import { queryDatabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    };
    dailyStats: {
        total_calories: number;
        item_count: number;
        macronutrients: MacronutrientResponse;
    };
    scans: ScanItem[];
    nutriScoreTrend: NutriScoreTrend[];
}

function scoreToLetter(score: number): string {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
}

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId parameter is required' },
                { status: 400 }
            );
        }

        // 1. Fetch User Info
        const userResult = await queryDatabase(
            'SELECT id, name, email, phone_number FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
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
                gender
            FROM user_health_profiles WHERE user_id = $1`,
            [userId]
        );

        const healthProfile = healthResult.rows[0] || {
            daily_calories_target: 2000,
            daily_sugar_limit: 50,
            daily_sodium_limit: 2300,
            daily_fat_limit: 65,
            height: null,
            weight: null,
            gender: null,
        };

        // 3. Fetch Today's Scans (get last 5 scans regardless of date for debugging)
        const scansResult = await queryDatabase(
            `SELECT 
                s.id,
                s.product_id,
                p.name as product_name,
                p.brand as product_brand,
                s.nutrition_score,
                s.scanned_at
            FROM scans s
            JOIN products p ON s.product_id = p.id
            WHERE s.user_id = $1
            ORDER BY s.scanned_at DESC
            LIMIT 10`,
            [userId]
        );

        const scans = scansResult.rows;
        console.log('All recent scans for user:', JSON.stringify(scans, null, 2));

        // 4. Calculate Daily Macronutrients (from the scans we just fetched)
        const macroResult = await queryDatabase(
            `SELECT 
                n.name,
                n.unit,
                SUM(pn.amount) as total_amount
            FROM scans s
            JOIN product_nutrients pn ON s.product_id = pn.product_id
            JOIN nutrients n ON pn.nutrient_id = n.id
            WHERE s.user_id = $1 AND s.id IN (${scans.map((_, i) => `$${i + 2}`).join(',')})
            GROUP BY n.id, n.name, n.unit`,
            [userId, ...scans.map(s => s.id)]
        );

        const macronutrients: MacronutrientResponse = {
            protein: { name: 'Protein', total: 0, unit: 'g', limit: 80 },
            carbs: { name: 'Karbohidrat', total: 0, unit: 'g', limit: 250 },
            fat: { name: 'Lemak', total: 0, unit: 'g', limit: 55 },
            fiber: { name: 'Serat', total: 0, unit: 'g', limit: 25 },
        };

        macroResult.rows.forEach((row: any) => {
            const name = row.name.toLowerCase();
            const amount = Math.round(row.total_amount * 10) / 10;

            if (name.includes('protein')) {
                macronutrients.protein.total = amount;
            } else if (name.includes('carb')) {
                macronutrients.carbs.total = amount;
            } else if (name.includes('fat') || name.includes('lipid')) {
                macronutrients.fat.total = amount;
            } else if (name.includes('fiber') || name.includes('serat')) {
                macronutrients.fiber.total = amount;
            }
        });

        // 5. Calculate Total Calories (simplified: assuming ~4cal/g carbs, ~4cal/g protein, ~9cal/g fat)
        const total_calories = Math.round(
            macronutrients.protein.total * 4 +
            macronutrients.carbs.total * 4 +
            macronutrients.fat.total * 9
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
            [userId]
        );

        const nutriScoreTrend: NutriScoreTrend[] = trendResult.rows.map((row: any) => ({
            date: new Date(row.date).toLocaleDateString('id-ID'),
            score: Math.round(row.avg_score),
            letter: scoreToLetter(Math.round(row.avg_score)),
        }));

        // 7. Calculate Item Count
        const item_count = scans.length;

        // Combine all data
        const dashboardData: DashboardData = {
            user,
            healthProfile,
            dailyStats: {
                total_calories,
                item_count,
                macronutrients,
            },
            scans,
            nutriScoreTrend,
        };

        console.log('Dashboard response - scans array:', JSON.stringify(scans.slice(0, 2), null, 2));
        console.log('Dashboard response - first scan product_id:', scans[0]?.product_id);

        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
