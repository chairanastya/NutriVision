import { queryDatabase } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session";
import { getRecommendedLimitForNutrient } from "@/lib/targets";
import { NextRequest, NextResponse } from "next/server";

interface NutrientTotal {
    name: string;
    total: number;
    unit: string;
    limit?: number;
}

interface MacronutrientResponse {
    protein: NutrientTotal;
    carbs: NutrientTotal;
    fat: NutrientTotal;
    fiber: NutrientTotal;
}

interface ScanItem {
    id: number;
    product_id: number;
    product_name: string;
    product_brand: string | null;
    image_path: string | null;
    nutrition_score: number;
    scanned_at: string;
}

interface NutriScoreTrend {
    date: string;
    score: number;
    letter: string;
}

interface DashboardData {
    user: {
        id: number;
        name: string;
        email: string;
        phone_number: string | null;
    };
    healthProfile: {
        daily_calories_target: number;
        daily_sugar_limit: number;
        daily_sodium_limit: number;
        daily_fat_limit: number;
        height: number | null;
        weight: number | null;
        gender: string | null;
        birth_date: string | null;
        activity_level: string | null;
    };
    medicalConditions: Array<{ id: number; name: string }>;
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
    dailyStats: {
        total_calories: number;
        item_count: number;
        macronutrients: MacronutrientResponse;
    };
    scans: ScanItem[];
    nutriScoreTrend: NutriScoreTrend[];
}

function isMissingRelationError(error: unknown, relationName: string): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as { code?: unknown; message?: unknown };
    if (e.code === "42P01") return true;
    const msg = typeof e.message === "string" ? e.message : "";
    return (
        msg.toLowerCase().includes("does not exist") &&
        msg.toLowerCase().includes(relationName.toLowerCase())
    );
}

type DbNumber = number | string;

interface MacroRow {
    name: string;
    unit: string;
    total_amount: DbNumber | null;
}

interface TrendRow {
    date: string | Date;
    avg_score: DbNumber | null;
}

function toNumber(value: DbNumber | null): number {
    if (value === null) return 0;
    return typeof value === "number" ? value : Number(value);
}

function scoreToLetter(score: number): string {
    if (score >= 80) return "A";
    if (score >= 60) return "B";
    if (score >= 40) return "C";
    if (score >= 20) return "D";
    return "E";
}

function normalizeDateToYmd(date: string | Date): string {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);
    return parsed.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
    try {
        const sessionUser = await getSessionUserFromRequest(request);
        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const userId = sessionUser.id;

        // 1. Fetch User Info
        const userResult = await queryDatabase(
            "SELECT id, name, email, phone_number FROM users WHERE id = $1",
            [userId],
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const user = userResult.rows[0];

        // 2. Fetch Health Profile
        const healthResult = await queryDatabase(
            `SELECT 
                daily_calories_target,
                daily_sugar_limit,
                daily_sodium_limit,
                daily_fat_limit,
                height,
                weight,
                gender,
                birth_date,
                activity_level
            FROM user_health_profiles WHERE user_id = $1`,
            [userId],
        );

        const healthProfile = healthResult.rows[0] || {
            daily_calories_target: 2000,
            daily_sugar_limit: 50,
            daily_sodium_limit: 2300,
            daily_fat_limit: 65,
            height: null,
            weight: null,
            gender: null,
            birth_date: null,
            activity_level: null,
        };

        if (healthProfile.birth_date) {
            healthProfile.birth_date = normalizeDateToYmd(
                healthProfile.birth_date as string | Date,
            );
        }

        // 2b. Fetch User Medical Conditions
        const conditionsResult = await queryDatabase(
            `SELECT mc.id, mc.name
             FROM user_medical_history umh
             JOIN medical_conditions mc ON umh.condition_id = mc.id
             WHERE umh.user_id = $1
             ORDER BY mc.name`,
            [userId],
        );

        const medicalConditions = (
            conditionsResult.rows as Array<{
                id: DbNumber;
                name: string;
            }>
        ).map((row) => ({ id: toNumber(row.id), name: row.name }));

        // 2c. Recommended targets derived from medical conditions (restricted nutrients)
        const recommendedResult = await queryDatabase(
            `SELECT 
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

        for (const r of recommendedResult.rows) {
            const row = r as {
                condition_name: unknown;
                nutrient_id: unknown;
                nutrient_name: unknown;
                nutrient_unit: unknown;
            };
            const nutrientId = Number(row.nutrient_id);
            if (!Number.isInteger(nutrientId) || nutrientId <= 0) continue;

            const nutrientName =
                row.nutrient_name === null || row.nutrient_name === undefined
                    ? null
                    : String(row.nutrient_name);
            const unit =
                row.nutrient_unit === null || row.nutrient_unit === undefined
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
                            ? getRecommendedLimitForNutrient(nutrientName, unit)
                            : null,
                    reasons: reason ? [reason] : [],
                });
            } else if (reason && !existing.reasons.includes(reason)) {
                existing.reasons.push(reason);
            }
        }

        // 2d. Custom nutrient targets (optional table)
        const customTargetsResult = await (async () => {
            try {
                return await queryDatabase(
                    `SELECT unt.nutrient_id, unt.daily_limit, n.name as nutrient_name, n.unit as nutrient_unit
                     FROM user_nutrient_targets unt
                     JOIN nutrients n ON unt.nutrient_id = n.id
                     WHERE unt.user_id = $1
                     ORDER BY n.name ASC`,
                    [userId],
                );
            } catch (error) {
                if (isMissingRelationError(error, "user_nutrient_targets")) {
                    return { rows: [] } as { rows: unknown[] };
                }
                throw error;
            }
        })();

        const customTargets = (
            customTargetsResult.rows as Array<{
                nutrient_id: DbNumber;
                daily_limit: DbNumber;
                nutrient_name: string;
                nutrient_unit: string | null;
            }>
        )
            .map((r) => ({
                nutrientId: toNumber(r.nutrient_id),
                nutrientName: String(r.nutrient_name),
                unit: r.nutrient_unit === null ? null : String(r.nutrient_unit),
                dailyLimit: toNumber(r.daily_limit),
            }))
            .filter(
                (t) =>
                    t.nutrientId > 0 &&
                    Number.isFinite(t.dailyLimit) &&
                    t.dailyLimit > 0,
            );

        // 3. Fetch Today's Scans (get last 5 scans regardless of date for debugging)
        const scansResult = await queryDatabase(
            `SELECT 
                s.id,
                s.product_id,
                s.image_path,
                p.name as product_name,
                p.brand as product_brand,
                s.nutrition_score,
                s.scanned_at
            FROM scans s
            JOIN products p ON s.product_id = p.id
            WHERE s.user_id = $1
            ORDER BY s.scanned_at DESC
            LIMIT 10`,
            [userId],
        );

        const scans = scansResult.rows;

        // 4. Calculate Daily Macronutrients (from the scans we just fetched)
        const macronutrients: MacronutrientResponse = {
            protein: { name: "Protein", total: 0, unit: "g", limit: 80 },
            carbs: { name: "Karbohidrat", total: 0, unit: "g", limit: 250 },
            fat: { name: "Lemak", total: 0, unit: "g", limit: 55 },
            fiber: { name: "Serat", total: 0, unit: "g", limit: 25 },
        };

        if (scans.length > 0) {
            const macroResult = await queryDatabase(
                `SELECT 
                    n.name,
                    n.unit,
                    SUM(pn.amount) as total_amount
                FROM scans s
                JOIN product_nutrients pn ON s.product_id = pn.product_id
                JOIN nutrients n ON pn.nutrient_id = n.id
                WHERE s.user_id = $1 AND s.id IN (${scans.map((_, i) => `$${i + 2}`).join(",")})
                GROUP BY n.id, n.name, n.unit`,
                [userId, ...scans.map((s) => s.id)],
            );

            (macroResult.rows as MacroRow[]).forEach((row) => {
                const name = row.name.toLowerCase();
                const amount = Math.round(toNumber(row.total_amount) * 10) / 10;

                if (name.includes("protein")) {
                    macronutrients.protein.total = amount;
                } else if (name.includes("carb")) {
                    macronutrients.carbs.total = amount;
                } else if (name.includes("fat") || name.includes("lipid")) {
                    macronutrients.fat.total = amount;
                } else if (name.includes("fiber") || name.includes("serat")) {
                    macronutrients.fiber.total = amount;
                }
            });
        }

        // 5. Calculate Total Calories (simplified: assuming ~4cal/g carbs, ~4cal/g protein, ~9cal/g fat)
        const total_calories = Math.round(
            macronutrients.protein.total * 4 +
                macronutrients.carbs.total * 4 +
                macronutrients.fat.total * 9,
        );

        // 6. Fetch Nutri-Score 5-Day Trend (from last 5 days of available data)
        const trendResult = await queryDatabase(
            `SELECT 
                DATE(s.scanned_at) as date,
                AVG(s.nutrition_score) as avg_score
            FROM scans s
            WHERE s.user_id = $1
            GROUP BY DATE(s.scanned_at)
            ORDER BY DATE(s.scanned_at) DESC
            LIMIT 5`,
            [userId],
        );

        const nutriScoreTrend: NutriScoreTrend[] = (
            trendResult.rows as TrendRow[]
        ).map((row) => {
            const avgScore = Math.round(toNumber(row.avg_score));
            return {
                date: normalizeDateToYmd(row.date),
                score: avgScore,
                letter: scoreToLetter(avgScore),
            };
        });

        // 7. Calculate Item Count
        const item_count = scans.length;

        // Combine all data
        const dashboardData: DashboardData = {
            user,
            healthProfile,
            medicalConditions,
            recommendedTargets: Array.from(recommendedMap.values()),
            customTargets,
            dailyStats: {
                total_calories,
                item_count,
                macronutrients,
            },
            scans,
            nutriScoreTrend,
        };

        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error("Dashboard API error:", error);
        const details =
            process.env.NODE_ENV !== "production" && error instanceof Error
                ? error.message
                : undefined;
        return NextResponse.json(
            { error: "Internal server error", details },
            { status: 500 },
        );
    }
}
