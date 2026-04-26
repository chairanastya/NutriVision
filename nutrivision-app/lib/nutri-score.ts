/**
 * Nutri-Score Calculation System
 * 
 * This module calculates a nutrition score (A, B, C, or D) by comparing
 * user's actual nutrition intake against recommended daily values.
 */

// Recommended daily nutrition intake values
// These are based on general adult dietary guidelines
export const DAILY_RECOMMENDED = {
    calories: 2000,      // kcal
    protein: 50,         // grams
    carbohydrates: 300, // grams
    fat: 65,             // grams
    fiber: 25,           // grams
    sugar: 50,           // grams (max)
    sodium: 2300,        // mg (max)
    cholesterol: 300,    // mg (max)
    vitaminA: 900,       // mcg
    vitaminC: 90,        // mg
    vitaminD: 20,        // mcg
    calcium: 1000,       // mg
    iron: 18,            // mg
    potassium: 4700,     // mg
} as const;

export type NutrientKey = keyof typeof DAILY_RECOMMENDED;

// Score thresholds for each grade (French Nutri-Score system: A-E)
// A: Excellent, B: Good, C: Fair, D: Poor, E: Very Poor
const SCORE_THRESHOLDS = {
    A: { min: 80, max: 100 },
    B: { min: 65, max: 79 },
    C: { min: 50, max: 64 },
    D: { min: 35, max: 49 },
    E: { min: 0, max: 34 },
} as const;

export type NutritionGrade = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Interface for user nutrition data from database
 */
export interface UserNutritionData {
    userId: string;
    date: string;
    nutrients: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
        sugar: number;
        sodium: number;
        cholesterol: number;
        vitaminA: number;
        vitaminC: number;
        vitaminD: number;
        calcium: number;
        iron: number;
        potassium: number;
    };
}

/**
 * Interface for individual nutrient analysis
 */
export interface NutrientAnalysis {
    nutrient: NutrientKey;
    actual: number;
    recommended: number;
    percentage: number;
    score: number;
    status: 'good' | 'low' | 'high';
}

/**
 * Interface for complete nutrition score result
 */
export interface NutritionScoreResult {
    userId: string;
    date: string;
    overallScore: number;
    grade: NutritionGrade;
    nutrientBreakdown: NutrientAnalysis[];
    // summary: string;
    // recommendations: string[];
}

/**
 * Calculate percentage of recommended value
 * Handles both "more is better" and "less is better" nutrients
 */
function calculatePercentage(actual: number, recommended: number, nutrient: NutrientKey): number {
    const limitedNutrients: NutrientKey[] = ['sugar', 'sodium', 'cholesterol'];
    
    if (limitedNutrients.includes(nutrient)) {
        // For nutrients where less is better
        // If actual is 0, score is 100%. If actual exceeds recommended, score decreases
        if (actual === 0) return 100;
        if (actual <= recommended) return 100 - ((actual / recommended) * 100 - 100);
        return Math.max(0, 100 - ((actual - recommended) / recommended) * 50);
    }
    
    // For nutrients where more is better
    return Math.min(100, (actual / recommended) * 100);
}

/**
 * Calculate score for a single nutrient (0-100)
 */
function calculateNutrientScore(actual: number, recommended: number, nutrient: NutrientKey): number {
    const percentage = calculatePercentage(actual, recommended, nutrient);
    
    // Apply different scoring logic based on nutrient type
    const limitedNutrients: NutrientKey[] = ['sugar', 'sodium', 'cholesterol'];
    
    if (limitedNutrients.includes(nutrient)) {
        // For "less is better" nutrients
        if (actual <= recommended) {
            return 100;
        } else if (actual <= recommended * 1.25) {
            return 80;
        } else if (actual <= recommended * 1.5) {
            return 60;
        } else if (actual <= recommended * 2) {
            return 40;
        } else {
            return 20;
        }
    }
    
    // For "more is better" nutrients
    if (percentage >= 100) return 100;
    if (percentage >= 90) return 90;
    if (percentage >= 75) return 75;
    if (percentage >= 50) return 50;
    if (percentage >= 25) return 25;
    return 10;
}

/**
 * Determine nutrient status
 */
function getNutrientStatus(actual: number, recommended: number, nutrient: NutrientKey): 'good' | 'low' | 'high' {
    const limitedNutrients: NutrientKey[] = ['sugar', 'sodium', 'cholesterol'];
    const percentage = (actual / recommended) * 100;
    
    if (limitedNutrients.includes(nutrient)) {
        if (actual <= recommended) return 'good';
        if (actual <= recommended * 1.25) return 'high';
        return 'high';
    }
    
    if (percentage >= 90) return 'good';
    if (percentage >= 50) return 'low';
    return 'low';
}

/**
 * Get grade from overall score
 */
function getGradeFromScore(score: number): NutritionGrade {
    if (score >= SCORE_THRESHOLDS.A.min) return 'A';
    if (score >= SCORE_THRESHOLDS.B.min) return 'B';
    if (score >= SCORE_THRESHOLDS.C.min) return 'C';
    if (score >= SCORE_THRESHOLDS.D.min) return 'D';
    return 'E';
}

/**
 * Main function to calculate nutrition score
 * 
 * @param userNutritionData - User's nutrition data from database
 * @returns NutritionScoreResult with overall score, grade, and detailed breakdown
 */
export function calculateNutritionScore(data: UserNutritionData): NutritionScoreResult {
    const breakdown: NutrientAnalysis[] = [];
    let totalScore = 0;
    let weightCount = 0;
    
    // Weight factors for different nutrient categories
    // More important nutrients have higher weights
    const weights: Record<string, number> = {
        calories: 2,
        protein: 1.5,
        carbohydrates: 1.5,
        fat: 1.5,
        fiber: 1.5,
        sugar: 1,
        sodium: 1,
        cholesterol: 1,
        vitaminA: 1,
        vitaminC: 1,
        vitaminD: 1,
        calcium: 1,
        iron: 1,
        potassium: 1,
    };
    
    // Calculate score for each nutrient
    for (const [nutrient, recommended] of Object.entries(DAILY_RECOMMENDED)) {
        const key = nutrient as NutrientKey;
        const actual = data.nutrients[key] || 0;
        
        const percentage = calculatePercentage(actual, recommended, key);
        const score = calculateNutrientScore(actual, recommended, key);
        const status = getNutrientStatus(actual, recommended, key);
        
        breakdown.push({
            nutrient: key,
            actual,
            recommended,
            percentage,
            score,
            status,
        });
        
        // Apply weight and accumulate score
        totalScore += score * (weights[key] || 1);
        weightCount += (weights[key] || 1);
    }
    
    // Calculate weighted average
    const overallScore = Math.round(totalScore / weightCount);
    const grade = getGradeFromScore(overallScore);
    
    
    return {
        userId: data.userId,
        date: data.date,
        overallScore,
        grade,
        nutrientBreakdown: breakdown,
    };
}

/**
 * Example function to fetch data from database
 * Replace with actual database query based on your schema
 */
export async function getUserNutritionData(userId: string, date: string): Promise<UserNutritionData> {
    // This is a placeholder - replace with actual database query
    // Example query structure:
    // SELECT * FROM nutrition_logs WHERE user_id = $1 AND date = $2
    
    // For now, return mock data structure
    // In production, replace this with actual DB call using the pool from db.ts
    /*
    import { queryDatabase } from './db';
    
    const result = await queryDatabase(
        'SELECT * FROM nutrition_logs WHERE user_id = $1 AND date = $2',
        [userId, date]
    );
    
    return {
        userId: result.rows[0].user_id,
        date: result.rows[0].date,
        nutrients: {
            calories: result.rows[0].calories,
            protein: result.rows[0].protein,
            // ... other nutrients
        }
    };
    */
   
    // Mock return for demonstration
    return {
        userId,
        date,
        nutrients: {
            calories: 1800,
            protein: 45,
            carbohydrates: 250,
            fat: 60,
            fiber: 20,
            sugar: 40,
            sodium: 2100,
            cholesterol: 250,
            vitaminA: 800,
            vitaminC: 75,
            vitaminD: 15,
            calcium: 900,
            iron: 14,
            potassium: 4000,
        },
    };
}

// Export for use in API routes
export default {
    DAILY_RECOMMENDED,
    calculateNutritionScore,
    getUserNutritionData,
};