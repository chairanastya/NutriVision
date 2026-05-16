import { getScanPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";
import pool, { queryDatabase } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes, randomUUID } from "crypto";

export const runtime = "nodejs";

function safeJsonParse(text: string): unknown | null {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}... (truncated)`;
}

function parseRetryAfterSeconds(errJson: unknown): number | null {
    if (!errJson || typeof errJson !== "object") return null;
    const root = errJson as { error?: unknown };
    if (!root.error || typeof root.error !== "object") return null;
    const errorObj = root.error as { details?: unknown };
    if (!Array.isArray(errorObj.details)) return null;

    for (const detail of errorObj.details) {
        if (!detail || typeof detail !== "object") continue;
        const d = detail as { "@type"?: unknown; retryDelay?: unknown };
        if (
            d["@type"] === "type.googleapis.com/google.rpc.RetryInfo" &&
            typeof d.retryDelay === "string"
        ) {
            const match = d.retryDelay.match(/^(\d+)(s)?$/);
            if (match) return Number(match[1]);
        }
    }
    return null;
}

type ProfileRow = {
    conditions: string | null;
    daily_sugar_limit: number | null;
    daily_sodium_limit: number | null;
    daily_calories_target: number | null;
};

type GeminiNutrientItem = {
    name?: unknown;
    amount?: unknown;
    unit?: unknown;
};

type GeminiScanResult = {
    type?: unknown;
    product_name?: unknown;
    nutrients?: unknown;
    nutrition_grade?: unknown;
    health_analysis?: unknown;
    confidence_level?: unknown;
};

function toTrimmedString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const s = value.trim();
    return s ? s : null;
}

function toFiniteNumber(value: unknown): number | null {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}

function gradeToScore(grade: string | null): number | null {
    if (!grade) return null;
    const g = grade.toUpperCase();
    if (g === "A") return 85;
    if (g === "B") return 70;
    if (g === "C") return 55;
    if (g === "D") return 40;
    if (g === "E") return 20;
    return null;
}

function normalizeNutrientName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

function normalizeUnit(unit: string): string {
    return unit.trim().replace(/\s+/g, " ");
}

// Nutrient name mapping: Maps various nutrient name variations to correct database IDs
// This ensures we're saving to the right nutrient regardless of naming variations in Gemini output
const NUTRIENT_ID_MAPPING: Record<string, number> = {
    // Energy/Calories → ID 9
    energy: 9,
    "energi": 9,
    calorie: 9,
    calories: 9,
    kcal: 9,
    kkal: 9,

    // Protein → ID 2
    protein: 2,

    // Carbohydrates → ID 11
    carbohydrate: 11,
    carbohydrates: 11,
    carbs: 11,
    karbohidrat: 11,
    "karbohidrat total": 11,

    // Fat → ID 10
    fat: 10,
    lemak: 10,
    "lemak total": 10,
    lipid: 10,
    lipids: 10,

    // Sugar → ID 12
    sugar: 12,
    gula: 12,
    sugars: 12,

    // Sodium → ID 13
    sodium: 13,
    natrium: 13,
    "natrium/sodium": 13,

    // Fiber → ID 8
    fiber: 8,
    fibre: 8,
    serat: 8,
    "serat pangan": 8,
    "dietary fiber": 8,

    // Saturated Fat → ID 6
    "saturated fat": 6,
    "lemak jenuh": 6,
};

function getNutrientIdMapping(nutrientName: string): number | null {
    const normalized = nutrientName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    return NUTRIENT_ID_MAPPING[normalized] ?? null;
}

function pickImageExtension(params: {
    mimeType: string | null;
    fileName: string | null;
}): "jpg" | "jpeg" | "png" | "webp" {
    const name = (params.fileName ?? "").trim();
    const mime = (params.mimeType ?? "").trim().toLowerCase();

    const allowed = new Set(["jpg", "jpeg", "png", "webp"]);

    const fromName = (() => {
        const base = name.split("/").pop() ?? name;
        const parts = base.split(".");
        if (parts.length < 2) return null;
        const ext = parts[parts.length - 1].toLowerCase();
        return allowed.has(ext)
            ? (ext as "jpg" | "jpeg" | "png" | "webp")
            : null;
    })();
    if (fromName) return fromName;

    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/jpg") return "jpg";

    return "jpg";
}

function newId(): string {
    try {
        return randomUUID();
    } catch {
        return randomBytes(16).toString("hex");
    }
}

async function saveScanImage(params: {
    buffer: Buffer;
    mimeType: string | null;
    fileName: string | null;
}): Promise<{ publicPath: string; absolutePath: string }> {
    const ext = pickImageExtension({
        mimeType: params.mimeType,
        fileName: params.fileName,
    });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "scans");
    await mkdir(uploadDir, { recursive: true });

    const fileId = newId();
    const fileName = `scan_${fileId}.${ext}`;
    const absolutePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/scans/${fileName}`;

    await writeFile(absolutePath, params.buffer);
    return { publicPath, absolutePath };
}

async function persistScanToDatabase(params: {
    userId: number | null;
    imagePath: string | null;
    cleanedGeminiJson: string;
    parsedResult: unknown;
}): Promise<{ scanId: number; productId: number }> {
    const root = params.parsedResult as GeminiScanResult;
    const productName = toTrimmedString(root.product_name) ?? "Unknown product";

    const nutritionGrade = toTrimmedString(root.nutrition_grade);
    const nutritionScore = gradeToScore(nutritionGrade);
    const category = toTrimmedString(root.type);

    const nutrientsRaw = root.nutrients;
    const nutrientItems: GeminiNutrientItem[] = Array.isArray(nutrientsRaw)
        ? (nutrientsRaw as GeminiNutrientItem[])
        : [];

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Create a new product record for each scan to avoid mutating nutrients for past scans.
        const productInsert = await client.query(
            `INSERT INTO products (name, brand, serving_size, serving_unit)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [productName.slice(0, 255), null, null, null],
        );

        const productId = Number(productInsert.rows[0]?.id);
        if (!Number.isInteger(productId) || productId <= 0) {
            throw new Error("Failed to create product");
        }

        // Upsert nutrients (by name) and insert amounts for this product.
        for (const item of nutrientItems) {
            const name = toTrimmedString(item?.name);
            const unit = toTrimmedString(item?.unit);
            const amount = toFiniteNumber(item?.amount);

            if (!name || !unit || amount === null) continue;
            const normalizedName = normalizeNutrientName(name);
            const normalizedUnit = normalizeUnit(unit);

            // First, try to find the nutrient from our mapping
            let nutrientId = getNutrientIdMapping(normalizedName);

            // If not found in mapping, query the database with case-insensitive match
            if (nutrientId === null) {
                const existing = await client.query(
                    `SELECT id, unit FROM nutrients WHERE lower(name) = lower($1) LIMIT 1`,
                    [normalizedName],
                );

                if (existing.rows.length > 0) {
                    nutrientId = Number(existing.rows[0].id);
                } else {
                    // Create new nutrient if it doesn't exist
                    const inserted = await client.query(
                        `INSERT INTO nutrients (name, unit)
                         VALUES ($1, $2)
                         RETURNING id`,
                        [normalizedName, normalizedUnit],
                    );
                    nutrientId = Number(inserted.rows[0]?.id);
                }
            }

            if (!Number.isInteger(nutrientId) || nutrientId <= 0) continue;

            await client.query(
                `INSERT INTO product_nutrients (product_id, nutrient_id, amount)
                 VALUES ($1, $2, $3)`,
                [productId, nutrientId, amount],
            );
        }

        const scanInsert = await client.query(
            `INSERT INTO scans (user_id, product_id, image_path, ocr_raw_text, nutrition_score, category)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
                params.userId,
                productId,
                params.imagePath,
                params.cleanedGeminiJson,
                nutritionScore,
                category,
            ],
        );

        const scanId = Number(scanInsert.rows[0]?.id);
        if (!Number.isInteger(scanId) || scanId <= 0) {
            throw new Error("Failed to create scan");
        }

        await client.query("COMMIT");
        return { scanId, productId };
    } catch (e) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore rollback errors
        }
        throw e;
    } finally {
        client.release();
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionUser = await getSessionUserFromRequest(req);

        const formData = await req.formData();
        const file = formData.get("image");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 },
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: "Server misconfiguration: GEMINI_API_KEY is not set",
                },
                { status: 500 },
            );
        }

        let userContext = "General healthy adult (approx. 2000 kcal daily).";
        let profileData: ProfileRow | null = null;

        // 1. Logika Pengecekan Login (pakai session cookie)
        if (sessionUser) {
            const userId = sessionUser.id;

            // Ambil data personalisasi jika user login
            const userResult = await queryDatabase(
                `SELECT p.*, string_agg(c.name, ', ') as conditions 
                 FROM USER_HEALTH_PROFILES p 
                 LEFT JOIN USER_MEDICAL_HISTORY h ON p.user_id = h.user_id
                 LEFT JOIN MEDICAL_CONDITIONS c ON h.condition_id = c.id
                 WHERE p.user_id = $1 
                 GROUP BY p.id`,
                [Number(userId)],
            );

            if (userResult.rows.length > 0) {
                profileData = userResult.rows[0] as ProfileRow;
                userContext = `
                    User conditions: ${profileData.conditions || "None"}. 
                    Daily Limits: Sugar ${profileData.daily_sugar_limit}g, 
                    Sodium ${profileData.daily_sodium_limit}mg, 
                    Calories ${profileData.daily_calories_target}kcal.
                `;
            }
        }

        // 2. Persiapkan Image Base64
        const bytes = await file.arrayBuffer();
        const imageBuffer = Buffer.from(bytes);
        const base64 = imageBuffer.toString("base64");

        // 3. Panggil Gemini API
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: getScanPrompt(userContext) },
                                {
                                    inline_data: {
                                        mime_type: file.type || "image/jpeg",
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                }),
            },
        );

        if (!response.ok) {
            const errText = await response.text();
            const errJson = safeJsonParse(errText);
            const retryAfterSeconds = parseRetryAfterSeconds(errJson);
            console.error("Gemini API Error:", {
                status: response.status,
                statusText: response.statusText,
                body: truncate(errText, 4000),
            });

            if (response.status === 429) {
                return NextResponse.json(
                    {
                        error: "Gemini API rate limited / quota exceeded",
                        status: response.status,
                        retryAfterSeconds,
                        details: errJson ?? truncate(errText, 2000),
                    },
                    {
                        status: 429,
                        headers: retryAfterSeconds
                            ? { "Retry-After": String(retryAfterSeconds) }
                            : undefined,
                    },
                );
            }
            return NextResponse.json(
                {
                    error: "Gemini API failed",
                    status: response.status,
                    details: errJson ?? truncate(errText, 2000),
                },
                { status: 502 },
            );
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            const finishReason = data.candidates?.[0]?.finishReason;
            const promptFeedback = data.promptFeedback;
            console.error("Gemini response missing text:", {
                finishReason,
                promptFeedback,
            });
            throw new Error("No text returned from Gemini");
        }
        const cleaned = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const parsedResult = safeJsonParse(cleaned);
        if (!parsedResult) {
            console.error("Failed to parse Gemini JSON:", {
                rawText: truncate(rawText, 2000),
                cleaned: truncate(cleaned, 2000),
            });
            throw new Error("Gemini returned invalid JSON");
        }

        // 3b. Persist scan result into database (best-effort)
        let saved: { scanId: number; productId: number } | null = null;
        let saveError: string | null = null;
        let savedImage: { publicPath: string; absolutePath: string } | null =
            null;
        try {
            savedImage = await saveScanImage({
                buffer: imageBuffer,
                mimeType: file.type || null,
                fileName: file.name || null,
            });
            saved = await persistScanToDatabase({
                userId: sessionUser ? Number(sessionUser.id) : null,
                imagePath: savedImage.publicPath,
                cleanedGeminiJson: cleaned,
                parsedResult,
            });
        } catch (e: unknown) {
            console.error("Failed to save scan to database:", e);
            saveError = e instanceof Error ? e.message : "Unknown DB error";
            // Best-effort cleanup: if image was written but DB failed, attempt to remove it.
            if (savedImage) {
                await unlink(savedImage.absolutePath).catch(() => undefined);
            }
        }

        // 4. Return Response Berdasarkan Status Login
        if (sessionUser && profileData) {
            // User Login: Berikan hasil scan + data medis personal
            return NextResponse.json({
                isLoggedIn: true,
                result: parsedResult,
                db: saved
                    ? { saved: true, ...saved }
                    : { saved: false, error: saveError },
                medical_summary: {
                    conditions: profileData.conditions,
                    daily_limits: {
                        sugar: profileData.daily_sugar_limit,
                        sodium: profileData.daily_sodium_limit,
                        calories: profileData.daily_calories_target,
                    },
                },
            });
        } else {
            // Guest (atau user login tanpa profile): hasil nutrisi & skor umum
            return NextResponse.json({
                isLoggedIn: Boolean(sessionUser),
                result: parsedResult,
                db: saved
                    ? { saved: true, ...saved }
                    : { saved: false, error: saveError },
            });
        }
    } catch (error: unknown) {
        console.error("SERVER ERROR:", error);
        const message =
            error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
