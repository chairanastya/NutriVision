import { getScanPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session";

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
        const base64 = Buffer.from(bytes).toString("base64");

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

        // 4. Return Response Berdasarkan Status Login
        if (sessionUser && profileData) {
            // User Login: Berikan hasil scan + data medis personal
            return NextResponse.json({
                isLoggedIn: true,
                result: parsedResult,
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
            });
        }
    } catch (error: unknown) {
        console.error("SERVER ERROR:", error);
        const message =
            error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
