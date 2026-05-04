import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session";
import { getRecommendedLimitForNutrient } from "@/lib/targets";

export const runtime = "nodejs";

type HealthProfileRow = {
    gender: string | null;
    birth_date: unknown;
    height: number | null;
    weight: number | null;
    activity_level: string | null;
    daily_calories_target: number | null;
    daily_sugar_limit: number | null;
    daily_sodium_limit: number | null;
    daily_fat_limit: number | null;
};

type GetResponse = {
    profile: {
        gender: "male" | "female" | null;
        birthDate: string | null;
        height: number | null;
        weight: number | null;
        activityLevel: string | null;
        dailyTargets: {
            calories: number | null;
            sugar: number | null;
            sodium: number | null;
            fat: number | null;
        };
    } | null;
    conditionIds: number[];
    recommendedTargets: Array<{
        nutrientId: number;
        nutrientName: string | null;
        unit: string | null;
        recommendedLimit: number | null;
        reasons: string[];
    }>;
    customTargets: Array<{
        nutrientId: number;
        nutrientName: string;
        unit: string | null;
        dailyLimit: number;
    }>;
};

type PostBody = {
    gender: "male" | "female" | null;
    birthDate: string | null;
    height: number | null;
    weight: number | null;
    activityLevel: string | null;
    conditionIds: number[];
    dailyTargets?: {
        calories?: number | null;
        sugar?: number | null;
        sodium?: number | null;
        fat?: number | null;
    };
    customTargets?: Array<{
        nutrientId: number;
        dailyLimit: number;
    }>;
};

function normalizeDateToYmd(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    if (typeof value !== "string") return null;

    const head = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
    return null;
}

function isValidGender(value: unknown): value is "male" | "female" {
    return value === "male" || value === "female";
}

function isValidActivityLevel(value: unknown): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= 20;
}

function toNullableNumber(value: unknown): number | null {
    if (value === null) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
}

function toNullableDateString(value: unknown): string | null {
    if (value === null) return null;
    if (typeof value !== "string") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
}

function uniqueIntArray(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    const nums = value
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((n) => Number.isInteger(n) && n > 0);
    return Array.from(new Set(nums));
}

function computeDefaultTargets(): {
    calories: number;
    sugar: number;
    sodium: number;
    fat: number;
} {
    return {
        calories: 2000,
        sugar: 50,
        sodium: 2300,
        fat: 65,
    };
}

function isMissingRelationError(error: unknown, relationName: string): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as { code?: unknown; message?: unknown };
    // Postgres: 42P01 = undefined_table
    if (e.code === "42P01") return true;
    const msg = typeof e.message === "string" ? e.message : "";
    return (
        msg.toLowerCase().includes("does not exist") &&
        msg.toLowerCase().includes(relationName.toLowerCase())
    );
}

export async function GET(request: NextRequest) {
    const sessionUser = await getSessionUserFromRequest(request);
    if (!sessionUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionUser.id;

    try {
        const client = await pool.connect();
        try {
            const profileRes = await client.query(
                `SELECT gender, birth_date, height, weight, activity_level,
                        daily_calories_target, daily_sugar_limit, daily_sodium_limit, daily_fat_limit
                 FROM user_health_profiles
                 WHERE user_id = $1`,
                [userId],
            );

            const historyRes = await client.query(
                `SELECT condition_id
                 FROM user_medical_history
                 WHERE user_id = $1
                 ORDER BY created_at ASC`,
                [userId],
            );

            const customTargetsRes = await (async () => {
                try {
                    return await client.query(
                        `SELECT unt.nutrient_id, unt.daily_limit, n.name as nutrient_name, n.unit as nutrient_unit
                         FROM user_nutrient_targets unt
                         JOIN nutrients n ON unt.nutrient_id = n.id
                         WHERE unt.user_id = $1
                         ORDER BY n.name ASC`,
                        [userId],
                    );
                } catch (error) {
                    if (
                        isMissingRelationError(error, "user_nutrient_targets")
                    ) {
                        return { rows: [] } as { rows: unknown[] };
                    }
                    throw error;
                }
            })();

            const recommendedRes = await client.query(
                `SELECT 
                    mc.id as condition_id,
                    mc.name as condition_name,
                    mc.restricted_nutrient_id as nutrient_id,
                    n.name as nutrient_name,
                    n.unit as nutrient_unit
                 FROM user_medical_history umh
                 JOIN medical_conditions mc ON umh.condition_id = mc.id
                 LEFT JOIN nutrients n ON mc.restricted_nutrient_id = n.id
                 WHERE umh.user_id = $1
                   AND mc.restricted_nutrient_id IS NOT NULL
                 ORDER BY mc.name ASC`,
                [userId],
            );

            const profileRow =
                profileRes.rows.length > 0
                    ? (profileRes.rows[0] as Partial<HealthProfileRow>)
                    : null;

            const conditionIds = historyRes.rows
                .map((r) =>
                    Number((r as { condition_id: unknown }).condition_id),
                )
                .filter((n) => Number.isInteger(n) && n > 0);

            const customTargets = customTargetsRes.rows
                .map((r) => {
                    const row = r as {
                        nutrient_id: unknown;
                        daily_limit: unknown;
                        nutrient_name: unknown;
                        nutrient_unit: unknown;
                    };
                    return {
                        nutrientId: Number(row.nutrient_id),
                        nutrientName: String(row.nutrient_name),
                        unit:
                            row.nutrient_unit === null ||
                            row.nutrient_unit === undefined
                                ? null
                                : String(row.nutrient_unit),
                        dailyLimit: Number(row.daily_limit),
                    };
                })
                .filter(
                    (t) =>
                        Number.isInteger(t.nutrientId) &&
                        t.nutrientId > 0 &&
                        Number.isFinite(t.dailyLimit) &&
                        t.dailyLimit > 0,
                );

            const recommendedMap = new Map<
                number,
                {
                    nutrientId: number;
                    nutrientName: string | null;
                    unit: string | null;
                    recommendedLimit: number | null;
                    reasons: string[];
                }
            >();

            for (const r of recommendedRes.rows) {
                const row = r as {
                    nutrient_id: unknown;
                    nutrient_name: unknown;
                    nutrient_unit: unknown;
                    condition_name: unknown;
                };
                const nutrientId = Number(row.nutrient_id);
                if (!Number.isInteger(nutrientId) || nutrientId <= 0) continue;

                const nutrientName =
                    row.nutrient_name === null ||
                    row.nutrient_name === undefined
                        ? null
                        : String(row.nutrient_name);
                const unit =
                    row.nutrient_unit === null ||
                    row.nutrient_unit === undefined
                        ? null
                        : String(row.nutrient_unit);
                const reason = String(row.condition_name ?? "").trim();

                const existing = recommendedMap.get(nutrientId);
                if (!existing) {
                    recommendedMap.set(nutrientId, {
                        nutrientId,
                        nutrientName,
                        unit,
                        recommendedLimit:
                            nutrientName !== null
                                ? getRecommendedLimitForNutrient(
                                      nutrientName,
                                      unit,
                                  )
                                : null,
                        reasons: reason ? [reason] : [],
                    });
                } else if (reason && !existing.reasons.includes(reason)) {
                    existing.reasons.push(reason);
                }
            }

            const response: GetResponse = {
                profile: profileRow
                    ? {
                          gender:
                              profileRow.gender === "male" ||
                              profileRow.gender === "female"
                                  ? profileRow.gender
                                  : null,
                          birthDate: normalizeDateToYmd(profileRow.birth_date),
                          height:
                              profileRow.height === null ||
                              profileRow.height === undefined
                                  ? null
                                  : Number(profileRow.height),
                          weight:
                              profileRow.weight === null ||
                              profileRow.weight === undefined
                                  ? null
                                  : Number(profileRow.weight),
                          activityLevel:
                              typeof profileRow.activity_level === "string"
                                  ? profileRow.activity_level
                                  : null,
                          dailyTargets: {
                              calories:
                                  profileRow.daily_calories_target === null ||
                                  profileRow.daily_calories_target === undefined
                                      ? null
                                      : Number(
                                            profileRow.daily_calories_target,
                                        ),
                              sugar:
                                  profileRow.daily_sugar_limit === null ||
                                  profileRow.daily_sugar_limit === undefined
                                      ? null
                                      : Number(profileRow.daily_sugar_limit),
                              sodium:
                                  profileRow.daily_sodium_limit === null ||
                                  profileRow.daily_sodium_limit === undefined
                                      ? null
                                      : Number(profileRow.daily_sodium_limit),
                              fat:
                                  profileRow.daily_fat_limit === null ||
                                  profileRow.daily_fat_limit === undefined
                                      ? null
                                      : Number(profileRow.daily_fat_limit),
                          },
                      }
                    : null,
                conditionIds,
                recommendedTargets: Array.from(recommendedMap.values()),
                customTargets,
            };

            return NextResponse.json(response, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("GET /api/user/health-profile error:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const sessionUser = await getSessionUserFromRequest(request);
    if (!sessionUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionUser.id;

    let body: PostBody;
    try {
        body = (await request.json()) as PostBody;
    } catch {
        return NextResponse.json(
            { message: "Body harus berupa JSON" },
            { status: 400 },
        );
    }

    const gender =
        body.gender === null
            ? null
            : isValidGender(body.gender)
              ? body.gender
              : null;
    const birthDate = toNullableDateString(body.birthDate);
    const height = toNullableNumber(body.height);
    const weight = toNullableNumber(body.weight);
    const activityLevel =
        body.activityLevel === null
            ? null
            : isValidActivityLevel(body.activityLevel)
              ? body.activityLevel
              : null;

    const conditionIds = uniqueIntArray(body.conditionIds);
    const defaultTargets = computeDefaultTargets();
    const dailyTargets =
        body.dailyTargets && typeof body.dailyTargets === "object"
            ? {
                  calories: toNullableNumber(body.dailyTargets.calories),
                  sugar: toNullableNumber(body.dailyTargets.sugar),
                  sodium: toNullableNumber(body.dailyTargets.sodium),
                  fat: toNullableNumber(body.dailyTargets.fat),
              }
            : { calories: null, sugar: null, sodium: null, fat: null };

    const targets = {
        calories: dailyTargets.calories ?? defaultTargets.calories,
        sugar: dailyTargets.sugar ?? defaultTargets.sugar,
        sodium: dailyTargets.sodium ?? defaultTargets.sodium,
        fat: dailyTargets.fat ?? defaultTargets.fat,
    };

    const customTargetsInput = Array.isArray(body.customTargets)
        ? body.customTargets
        : [];
    const customTargets = Array.from(
        new Map(
            customTargetsInput
                .map((t) => ({
                    nutrientId:
                        typeof t?.nutrientId === "number"
                            ? t.nutrientId
                            : Number(t?.nutrientId),
                    dailyLimit:
                        typeof t?.dailyLimit === "number"
                            ? t.dailyLimit
                            : Number(t?.dailyLimit),
                }))
                .filter(
                    (t) =>
                        Number.isInteger(t.nutrientId) &&
                        t.nutrientId > 0 &&
                        Number.isFinite(t.dailyLimit) &&
                        t.dailyLimit > 0,
                )
                .map((t) => [t.nutrientId, t]),
        ).values(),
    );

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            await client.query(
                `INSERT INTO user_health_profiles (
                    user_id, gender, birth_date, height, weight, activity_level,
                    daily_calories_target, daily_sugar_limit, daily_sodium_limit, daily_fat_limit,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    gender = EXCLUDED.gender,
                    birth_date = EXCLUDED.birth_date,
                    height = EXCLUDED.height,
                    weight = EXCLUDED.weight,
                    activity_level = EXCLUDED.activity_level,
                    daily_calories_target = EXCLUDED.daily_calories_target,
                    daily_sugar_limit = EXCLUDED.daily_sugar_limit,
                    daily_sodium_limit = EXCLUDED.daily_sodium_limit,
                    daily_fat_limit = EXCLUDED.daily_fat_limit,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    userId,
                    gender,
                    birthDate,
                    height,
                    weight,
                    activityLevel,
                    targets.calories,
                    targets.sugar,
                    targets.sodium,
                    targets.fat,
                ],
            );

            await client.query(
                "DELETE FROM user_medical_history WHERE user_id = $1",
                [userId],
            );

            if (conditionIds.length > 0) {
                await client.query(
                    `INSERT INTO user_medical_history (user_id, condition_id)
                     SELECT $1, UNNEST($2::int[])`,
                    [userId, conditionIds],
                );
            }

            // Custom nutrient targets (user-defined beyond the default columns)
            try {
                await client.query(
                    "DELETE FROM user_nutrient_targets WHERE user_id = $1",
                    [userId],
                );

                if (customTargets.length > 0) {
                    const values: Array<number> = [userId];
                    const rowsSql = customTargets
                        .map((t, i) => {
                            const idx = i * 2;
                            values.push(t.nutrientId, t.dailyLimit);
                            return `($1, $${idx + 2}, $${idx + 3}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
                        })
                        .join(", ");

                    await client.query(
                        `INSERT INTO user_nutrient_targets (user_id, nutrient_id, daily_limit, created_at, updated_at)
                         VALUES ${rowsSql}`,
                        values,
                    );
                }
            } catch (error) {
                if (
                    isMissingRelationError(error, "user_nutrient_targets") &&
                    customTargets.length > 0
                ) {
                    await client.query("ROLLBACK");
                    return NextResponse.json(
                        {
                            message:
                                "Tabel user_nutrient_targets belum ada di database. Buat tabelnya dulu untuk memakai fitur target kustom.",
                        },
                        { status: 400 },
                    );
                }
                throw error;
            }

            await client.query("COMMIT");

            return NextResponse.json(
                { message: "Profil kesehatan tersimpan" },
                { status: 200 },
            );
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("POST /api/user/health-profile error:", error);
            return NextResponse.json(
                { message: "Gagal menyimpan profil" },
                { status: 500 },
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("POST /api/user/health-profile connect error:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 },
        );
    }
}
