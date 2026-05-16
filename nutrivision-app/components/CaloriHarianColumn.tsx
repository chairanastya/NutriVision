"use client";

import { useMemo } from "react";

interface MacroNutrient {
    total: number;
    limit: number;
}

interface Scan {
    id: number;
    scanned_at: string;
}

interface CaloriHarianColumnProps {
    loading: boolean;
    totalCalories: number;
    dailyCaloriesTarget: number;
    macronutrients: {
        protein: MacroNutrient;
        carbs: MacroNutrient;
        fat: MacroNutrient;
        fiber: MacroNutrient;
    };
    scans?: Scan[];
}

export default function CaloriHarianColumn({
    loading,
    totalCalories,
    dailyCaloriesTarget,
    macronutrients,
    scans = [],
}: CaloriHarianColumnProps) {
    const todayScans = useMemo(() => {
        if (!scans || scans.length === 0) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scans.filter((scan) => {
            const scanDate = new Date(scan.scanned_at);
            scanDate.setHours(0, 0, 0, 0);
            return scanDate.getTime() === today.getTime();
        });
    }, [scans]);

    const hasScansToday = todayScans.length > 0;
    const remaining = dailyCaloriesTarget - totalCalories;
    const percentage = Math.round(
        (totalCalories / dailyCaloriesTarget) * 100
    );

    return (
        <div className="p-8 md:p-10 bg-lime-50 rounded-2xl outline-1 -outline-offset-1 outline-lime-200 flex flex-col gap-6 shadow-md hover:shadow-lg border border-lime-200/50 transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    <h3 className="font-bold text-[#1a3129] text-lg">
                        Kalori Harian
                    </h3>
                </div>
            </div>

            {!hasScansToday && !loading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-[#1a3129] opacity-70 text-center">
                        Belum ada scan pada hari ini
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-end">
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                            {loading ? "-" : Math.round(remaining)} tersisa
                        </span>
                    </div>

                    <div className="flex justify-center">
                        <div className="relative w-28 h-28">
                            <svg
                                className="transform -rotate-90 w-full h-full"
                                viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.5"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.5"
                                    fill="none"
                                    stroke="#cbea7b"
                                    strokeWidth="2"
                                    strokeDasharray={`${(loading ? 0 : (percentage / 100) * 100) * 0.9735} 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl font-bold text-[#1a3129]">
                                    {loading ? "-" : Math.round(totalCalories)}
                                </div>
                                <div className="text-xs text-[#1a3129] opacity-70">
                                    kkal
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-[#1a3129] opacity-70 text-center">
                        {loading ? "-" : percentage}% dari target
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">🥚</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-[#1a3129]">
                                        Protein
                                    </span>
                                    <span className="text-sm text-[#1a3129] opacity-70">
                                        {loading
                                            ? "-/-"
                                            : `${Math.round(macronutrients.protein.total)}/${macronutrients.protein.limit}g`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-orange-500 h-1.5 rounded-full"
                                        style={{
                                            width: loading
                                                ? "0%"
                                                : `${Math.min(100, (macronutrients.protein.total / macronutrients.protein.limit) * 100)}%`,
                                        }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">🌽</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-[#1a3129]">
                                        Karbohidrat
                                    </span>
                                    <span className="text-sm text-[#1a3129] opacity-70">
                                        {loading
                                            ? "-/-"
                                            : `${Math.round(macronutrients.carbs.total)}/${macronutrients.carbs.limit}g`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-blue-500 h-1.5 rounded-full"
                                        style={{
                                            width: loading
                                                ? "0%"
                                                : `${Math.min(100, (macronutrients.carbs.total / macronutrients.carbs.limit) * 100)}%`,
                                        }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">🥑</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-[#1a3129]">
                                        Lemak
                                    </span>
                                    <span className="text-sm text-[#1a3129] opacity-70">
                                        {loading
                                            ? "-/-"
                                            : `${Math.round(macronutrients.fat.total)}/${macronutrients.fat.limit}g`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-red-500 h-1.5 rounded-full"
                                        style={{
                                            width: loading
                                                ? "0%"
                                                : `${Math.min(100, (macronutrients.fat.total / macronutrients.fat.limit) * 100)}%`,
                                        }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">💚</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-[#1a3129]">
                                        Serat
                                    </span>
                                    <span className="text-sm text-[#1a3129] opacity-70">
                                        {loading
                                            ? "-/-"
                                            : `${Math.round(macronutrients.fiber.total)}/${macronutrients.fiber.limit}g`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-green-500 h-1.5 rounded-full"
                                        style={{
                                            width: loading
                                                ? "0%"
                                                : `${Math.min(100, (macronutrients.fiber.total / macronutrients.fiber.limit) * 100)}%`,
                                        }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
