"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface NutriScoreTrend {
    date: string;
    score: number;
    letter: string;
}

interface NutriScoreTrendColumnProps {
    loading: boolean;
    nutriScoreTrend: NutriScoreTrend[] | undefined;
}

export default function NutriScoreTrendColumn({
    loading,
    nutriScoreTrend,
}: NutriScoreTrendColumnProps) {
    const router = useRouter();

    const nutriScoreChart = useMemo(() => {
        if (!nutriScoreTrend || nutriScoreTrend.length === 0) {
            return null;
        }

        return (
            <svg
                width="100%"
                height="180"
                viewBox="0 0 320 180"
                className="mt-2">
                {/* Grid Lines */}
                {[0, 20, 40, 60, 80, 100].map((value) => {
                    const y = 160 - (value / 100) * 140;
                    return (
                        <g key={`grid-${value}`}>
                            <line
                                x1="30"
                                y1={y}
                                x2="300"
                                y2={y}
                                stroke="#d1d5db"
                                strokeWidth="0.5"
                                strokeDasharray="2,2"
                            />
                            <text
                                x="10"
                                y={y + 4}
                                fontSize="10"
                                fill="#1a3129"
                                opacity="0.5"
                                textAnchor="end">
                                {value}
                            </text>
                        </g>
                    );
                })}

                {/* Y-Axis */}
                <line
                    x1="30"
                    y1="20"
                    x2="30"
                    y2="160"
                    stroke="#1a3129"
                    strokeWidth="1.5"
                />
                <text
                    x="15"
                    y="90"
                    fontSize="11"
                    fill="#1a3129"
                    opacity="0.7"
                    textAnchor="middle"
                    transform="rotate(-90 15 90)">
                    Score
                </text>

                {/* X-Axis */}
                <line
                    x1="30"
                    y1="160"
                    x2="300"
                    y2="160"
                    stroke="#1a3129"
                    strokeWidth="1.5"
                />
                <text
                    x="165"
                    y="175"
                    fontSize="11"
                    fill="#1a3129"
                    opacity="0.7"
                    textAnchor="middle">
                    Tanggal
                </text>

                {/* Connection Line */}
                <polyline
                    points={nutriScoreTrend
                        .map((trend, idx) => {
                            const x = 60 + idx * 54;
                            const y = 160 - (trend.score / 100) * 140;
                            return `${x},${y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    opacity="0.4"
                />

                {/* Dots */}
                {nutriScoreTrend.map((trend, idx) => {
                    const x = 60 + idx * 54;
                    const y = 160 - (trend.score / 100) * 140;
                    const color =
                        trend.score >= 80
                            ? "#16a34a"
                            : trend.score >= 60
                              ? "#22c55e"
                              : trend.score >= 40
                                ? "#eab308"
                                : trend.score >= 20
                                  ? "#f97316"
                                  : "#ef4444";

                    return (
                        <g key={`dot-${idx}`}>
                            {/* Dot Background */}
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill={color}
                                opacity="0.9"
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                opacity="0.3"
                            />

                            {/* Letter Grade */}
                            <text
                                x={x}
                                y={y + 1.5}
                                fontSize="8"
                                fontWeight="bold"
                                fill="white"
                                textAnchor="middle"
                                dominantBaseline="middle">
                                {trend.letter}
                            </text>

                            {/* Tooltip on hover */}
                            <title>{`${trend.letter} - Score: ${Math.round(trend.score)}`}</title>
                        </g>
                    );
                })}

                {/* X-Axis Labels */}
                {nutriScoreTrend.map((trend, idx) => {
                    const x = 60 + idx * 54;
                    return (
                        <g key={`label-${idx}`}>
                            <text
                                x={x}
                                y="175"
                                fontSize="9"
                                fill="#1a3129"
                                opacity="0.6"
                                textAnchor="middle">
                                {new Date(trend.date).toLocaleDateString(
                                    "id-ID",
                                    { month: "short", day: "numeric" },
                                )}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    }, [nutriScoreTrend]);

    if (loading || !nutriScoreTrend || nutriScoreTrend.length === 0) {
        return null;
    }

    const avgScore =
        nutriScoreTrend.reduce((sum, t) => sum + t.score, 0) /
        nutriScoreTrend.length;

    const letter =
        avgScore >= 80
            ? "A"
            : avgScore >= 60
              ? "B"
              : avgScore >= 40
                ? "C"
                : avgScore >= 20
                  ? "D"
                  : "E";

    const letterColor =
        avgScore >= 80
            ? "bg-green-600"
            : avgScore >= 60
              ? "bg-green-500"
              : avgScore >= 40
                ? "bg-yellow-500"
                : avgScore >= 20
                  ? "bg-orange-500"
                  : "bg-red-500";

    return (
        <div className="lg:col-span-1 space-y-6">
            <div className="p-8 md:p-10 bg-lime-50 rounded-2xl outline-1 -outline-offset-1 outline-lime-200 shadow-md hover:shadow-lg border border-lime-200/50 transition-shadow flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        <h3 className="font-bold text-[#1a3129] text-lg">
                            Nutri-Score 5 Hari
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[#1a3129] opacity-70">
                            Rata-rata: {Math.round(avgScore)}
                        </span>
                        <div
                            className={`w-6 h-6 rounded-full ${letterColor} flex items-center justify-center text-white text-xs font-bold`}>
                            {letter}
                        </div>
                    </div>
                </div>

                {nutriScoreChart}

                <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span className="text-[#1a3129] opacity-70">
                            Sangat Baik (80+)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-[#1a3129] opacity-70">
                            Baik (60-79)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-[#1a3129] opacity-70">
                            Cukup (40-59)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-[#1a3129] opacity-70">
                            Kurang (20-39)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-[#1a3129] opacity-70">
                            Buruk (&lt;20)
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/nutri-score-details")}
                    className="w-full px-4 py-2.5 bg-[#2d6a3e] text-white rounded-lg text-sm font-semibold hover:bg-[#1a3129] transition-colors">
                    Lihat Detail
                </button>
            </div>
        </div>
    );
}
