import { DAILY_RECOMMENDED, type NutrientKey } from "@/lib/nutri-score";

export type RecommendedTarget = {
    nutrientId: number;
    nutrientName: string;
    unit: string | null;
    recommendedLimit: number | null;
    reasons: string[];
};

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

function inferNutrientKey(nutrientName: string): NutrientKey | null {
    const n = normalizeText(nutrientName);

    if (n.includes("sugar") || n.includes("gula")) return "sugar";
    if (n.includes("sodium") || n.includes("natrium")) return "sodium";
    if (n.includes("fat") || n.includes("lemak") || n.includes("lipid"))
        return "fat";
    if (n.includes("calorie") || n.includes("kalori") || n.includes("energi"))
        return "calories";
    if (n.includes("cholesterol") || n.includes("kolesterol"))
        return "cholesterol";
    if (n.includes("fiber") || n.includes("serat")) return "fiber";
    if (n.includes("protein")) return "protein";
    if (n.includes("carb") || n.includes("karbo")) return "carbohydrates";

    if (n.includes("vitamin a")) return "vitaminA";
    if (n.includes("vitamin c")) return "vitaminC";
    if (n.includes("vitamin d")) return "vitaminD";
    if (n.includes("calcium") || n.includes("kalsium")) return "calcium";
    if (n.includes("iron") || n.includes("zat besi")) return "iron";
    if (n.includes("potassium") || n.includes("kalium")) return "potassium";

    return null;
}

function normalizeUnit(unit: string | null): string | null {
    if (!unit) return null;
    const u = normalizeText(unit);
    if (u === "mg" || u === "milligram") return "mg";
    if (u === "g" || u === "gram") return "g";
    if (u === "mcg" || u === "µg" || u === "ug") return "mcg";
    if (u === "kcal" || u === "kkal") return "kcal";
    return unit;
}

function convertUnit(
    value: number,
    fromUnit: string,
    toUnit: string,
): number | null {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);
    if (!from || !to) return null;
    if (from === to) return value;

    // g <-> mg
    if (from === "mg" && to === "g") return value / 1000;
    if (from === "g" && to === "mg") return value * 1000;

    // mcg <-> mg
    if (from === "mcg" && to === "mg") return value / 1000;
    if (from === "mg" && to === "mcg") return value * 1000;

    // kcal (no conversion)
    return null;
}

function recommendedUnitForKey(key: NutrientKey): string {
    switch (key) {
        case "calories":
            return "kcal";
        case "sodium":
        case "cholesterol":
        case "vitaminC":
        case "calcium":
        case "iron":
        case "potassium":
            return "mg";
        case "vitaminA":
        case "vitaminD":
            return "mcg";
        default:
            return "g";
    }
}

export function getRecommendedLimitForNutrient(
    nutrientName: string,
    nutrientUnit: string | null,
): number | null {
    const key = inferNutrientKey(nutrientName);
    if (!key) return null;

    const recommendedValue = DAILY_RECOMMENDED[key];
    const recUnit = recommendedUnitForKey(key);

    const targetUnit = normalizeUnit(nutrientUnit) ?? recUnit;
    const converted = convertUnit(recommendedValue, recUnit, targetUnit);
    return converted ?? (targetUnit === recUnit ? recommendedValue : null);
}
