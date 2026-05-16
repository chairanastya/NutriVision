"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";

interface DashboardData {
    nutriScoreTrend: Array<{
        date: string;
        score: number;
        letter: string;
    }>;
}

export default function NutriScoreDetails() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/dashboard", {
                credentials: "include",
            });

            if (response.status === 401) {
                setError("Silakan login dulu.");
                router.push("/login");
                return;
            }

            if (!response.ok) {
                const errJson = (await response.json().catch(() => null)) as {
                    error?: string;
                    message?: string;
                    details?: string;
                } | null;
                const msg =
                    errJson?.error ||
                    errJson?.message ||
                    errJson?.details ||
                    "Failed to fetch data";
                throw new Error(`(${response.status}) ${msg}`);
            }

            const dashboardData = await response.json();
            setData(dashboardData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const nutriScoreChart = useMemo(() => {
        if (!data?.nutriScoreTrend || data.nutriScoreTrend.length === 0) {
            return null;
        }

        return (
            <svg
                width="100%"
                height="400"
                viewBox="0 0 800 400"
                className="mt-4">
                {/* Grid Lines */}
                {[0, 20, 40, 60, 80, 100].map((value) => {
                    const y = 350 - (value / 100) * 300;
                    return (
                        <g key={`grid-${value}`}>
                            <line
                                x1="80"
                                y1={y}
                                x2="750"
                                y2={y}
                                stroke="#d1d5db"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                            <text
                                x="60"
                                y={y + 6}
                                fontSize="14"
                                fill="#1a3129"
                                opacity="0.6"
                                textAnchor="end">
                                {value}
                            </text>
                        </g>
                    );
                })}

                {/* Y-Axis */}
                <line
                    x1="80"
                    y1="50"
                    x2="80"
                    y2="350"
                    stroke="#1a3129"
                    strokeWidth="2"
                />
                <text
                    x="30"
                    y="200"
                    fontSize="14"
                    fill="#1a3129"
                    opacity="0.7"
                    textAnchor="middle"
                    transform="rotate(-90 30 200)">
                    Score
                </text>

                {/* X-Axis */}
                <line
                    x1="80"
                    y1="350"
                    x2="750"
                    y2="350"
                    stroke="#1a3129"
                    strokeWidth="2"
                />
                <text
                    x="415"
                    y="390"
                    fontSize="14"
                    fill="#1a3129"
                    opacity="0.7"
                    textAnchor="middle">
                    Tanggal
                </text>

                {/* Connection Line */}
                <polyline
                    points={data.nutriScoreTrend
                        .map((trend, idx) => {
                            const spacing = (750 - 80) / (data.nutriScoreTrend.length - 1 || 1);
                            const x = 80 + idx * spacing;
                            const y = 350 - (trend.score / 100) * 300;
                            return `${x},${y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    opacity="0.6"
                />

                {/* Dots and Labels */}
                {data.nutriScoreTrend.map((trend, idx) => {
                    const spacing = (750 - 80) / (data.nutriScoreTrend.length - 1 || 1);
                    const x = 80 + idx * spacing;
                    const y = 350 - (trend.score / 100) * 300;
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
                            {/* Dot */}
                            <circle
                                cx={x}
                                cy={y}
                                r="8"
                                fill={color}
                                opacity="0.95"
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r="8"
                                fill="none"
                                stroke={color}
                                strokeWidth="3"
                                opacity="0.3"
                            />

                            {/* Letter Grade */}
                            <text
                                x={x}
                                y={y + 2}
                                fontSize="12"
                                fontWeight="bold"
                                fill="white"
                                textAnchor="middle"
                                dominantBaseline="middle">
                                {trend.letter}
                            </text>

                            {/* X-Axis Label */}
                            <text
                                x={x}
                                y="375"
                                fontSize="12"
                                fill="#1a3129"
                                opacity="0.7"
                                textAnchor="middle">
                                {new Date(trend.date).toLocaleDateString(
                                    "id-ID",
                                    { month: "short", day: "numeric" },
                                )}
                            </text>

                            {/* Score Value Label */}
                            <text
                                x={x}
                                y={y - 20}
                                fontSize="13"
                                fill="#1a3129"
                                fontWeight="bold"
                                textAnchor="middle">
                                {Math.round(trend.score)}
                            </text>

                            {/* Tooltip */}
                            <title>{`${trend.letter} - Score: ${Math.round(trend.score)} (${new Date(trend.date).toLocaleDateString("id-ID")})`}</title>
                        </g>
                    );
                })}
            </svg>
        );
    }, [data?.nutriScoreTrend]);

    const avgScore = useMemo(() => {
        if (!data?.nutriScoreTrend || data.nutriScoreTrend.length === 0)
            return null;
        return (
            data.nutriScoreTrend.reduce((sum, t) => sum + t.score, 0) /
            data.nutriScoreTrend.length
        );
    }, [data?.nutriScoreTrend]);

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
                <div className="mx-auto w-full max-w-5xl">
                    {/* Header */}
                    <div className="mb-10">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 text-[#2d6a3e] hover:text-[#1a3129] font-semibold flex items-center gap-2">
                            ← Kembali
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1a3129]">
                            Detail Nutri-Score 5 Hari
                        </h1>
                        <p className="text-[#1a3129] opacity-60 mt-2">
                            Lihat grafik perkembangan skor nutrisi Anda
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-[#1a3129] opacity-60">
                            Loading data...
                        </div>
                    ) : data?.nutriScoreTrend && data.nutriScoreTrend.length > 0 ? (
                        <div className="space-y-10">
                            {/* Main Chart */}
                            <div className="p-8 md:p-10 bg-lime-50 rounded-2xl outline-1 -outline-offset-1 outline-lime-200 shadow-md hover:shadow-lg border border-lime-200/50 transition-shadow">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-[#1a3129] mb-2">
                                        Grafik Perkembangan Nutri-Score
                                    </h2>
                                    <p className="text-[#1a3129] opacity-60">
                                        Rata-rata skor:{" "}
                                        <span className="font-bold text-lg text-[#1a3129]">
                                            {avgScore !== null
                                                ? Math.round(avgScore)
                                                : "-"}
                                            /100
                                        </span>
                                    </p>
                                </div>

                                {/* Chart */}
                                <div className="overflow-x-auto">
                                    {nutriScoreChart}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="p-8 bg-white rounded-2xl border-2 border-lime-200/60 shadow-md">
                                <h3 className="font-bold text-[#1a3129] text-lg mb-6">
                                    Penjelasan Kategori
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-600 shrink-0 flex items-center justify-center text-white font-bold">
                                            A
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1a3129]">
                                                Sangat Baik
                                            </p>
                                            <p className="text-sm text-[#1a3129] opacity-60">
                                                Score 80-100
                                            </p>
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-1">
                                                Nutrisi sangat berkualitas tinggi
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-500 shrink-0 flex items-center justify-center text-white font-bold">
                                            B
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1a3129]">
                                                Baik
                                            </p>
                                            <p className="text-sm text-[#1a3129] opacity-60">
                                                Score 60-79
                                            </p>
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-1">
                                                Nutrisi berkualitas baik
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 shrink-0 flex items-center justify-center text-white font-bold">
                                            C
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1a3129]">
                                                Cukup
                                            </p>
                                            <p className="text-sm text-[#1a3129] opacity-60">
                                                Score 40-59
                                            </p>
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-1">
                                                Nutrisi cukup, perlu perbaikan
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-orange-500 shrink-0 flex items-center justify-center text-white font-bold">
                                            D
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1a3129]">
                                                Kurang
                                            </p>
                                            <p className="text-sm text-[#1a3129] opacity-60">
                                                Score 20-39
                                            </p>
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-1">
                                                Kualitas nutrisi kurang baik
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-red-500 shrink-0 flex items-center justify-center text-white font-bold">
                                            E
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1a3129]">
                                                Buruk
                                            </p>
                                            <p className="text-sm text-[#1a3129] opacity-60">
                                                Score 0-19
                                            </p>
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-1">
                                                Kualitas nutrisi sangat kurang
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="p-8 bg-white rounded-2xl border-2 border-lime-200/60 shadow-md">
                                <h3 className="font-bold text-[#1a3129] text-lg mb-6">
                                    Detail Riwayat Skor
                                </h3>
                                <div className="space-y-3">
                                    {data.nutriScoreTrend.map((trend, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-lime-50 rounded-lg border border-lime-200/60 hover:bg-lime-100/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                        trend.score >= 80
                                                            ? "bg-green-600"
                                                            : trend.score >= 60
                                                              ? "bg-green-500"
                                                              : trend.score >= 40
                                                                ? "bg-yellow-500"
                                                                : trend.score >= 20
                                                                  ? "bg-orange-500"
                                                                  : "bg-red-500"
                                                    }`}>
                                                    {trend.letter}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#1a3129]">
                                                        {new Date(
                                                            trend.date,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                weekday: "long",
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            },
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-[#1a3129] opacity-60">
                                                        Grade{" "}
                                                        {trend.letter}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-bold text-[#1a3129]">
                                                {Math.round(trend.score)}/100
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-[#1a3129] opacity-60 text-lg">
                                Belum ada data Nutri-Score
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
