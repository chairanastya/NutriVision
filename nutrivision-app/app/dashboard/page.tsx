"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import MedForm from "@/components/user/MedForm";

interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
}

interface NutrientTotal {
    name: string;
    total: number;
    unit: string;
    limit?: number;
}

interface Scan {
    id: number;
    product_id: number;
    product_name: string;
    product_brand: string | null;
    nutrition_score: number;
    scanned_at: string;
}

interface DashboardData {
    user: User;
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
        macronutrients: {
            protein: NutrientTotal;
            carbs: NutrientTotal;
            fat: NutrientTotal;
            fiber: NutrientTotal;
        };
    };
    scans: Scan[];
    nutriScoreTrend: Array<{
        date: string;
        score: number;
        letter: string;
    }>;
}

interface ProductDetail {
    id: number;
    name: string;
    brand: string | null;
    serving_size: number | null;
    serving_unit: string | null;
    nutrition_score: number;
    scanned_at: string;
    nutrients: Array<{
        nutrient_name: string;
        amount: number;
        unit: string;
    }>;
}

export default function Dashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] =
        useState<ProductDetail | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDashboardData = useCallback(async () => {
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
                    "Failed to fetch dashboard data";
                throw new Error(`(${response.status}) ${msg}`);
            }

            const dashboardData: DashboardData = await response.json();
            setData(dashboardData);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const health = data?.healthProfile;
    const weightKg = health?.weight ?? null;
    const heightCm = health?.height ?? null;

    const bmiInfo = useMemo(() => {
        if (!weightKg || !heightCm) return null;
        const heightM = heightCm / 100;
        if (!Number.isFinite(heightM) || heightM <= 0) return null;
        const bmi = weightKg / (heightM * heightM);
        const bmiRounded = Math.round(bmi * 10) / 10;

        if (bmiRounded < 18.5) {
            return {
                value: bmiRounded,
                label: "Kurus",
                className: "text-orange-600",
            };
        }
        if (bmiRounded < 25) {
            return {
                value: bmiRounded,
                label: "Ideal",
                className: "text-green-600",
            };
        }
        if (bmiRounded < 30) {
            return {
                value: bmiRounded,
                label: "Berlebih",
                className: "text-orange-600",
            };
        }
        return {
            value: bmiRounded,
            label: "Obesitas",
            className: "text-red-600",
        };
    }, [weightKg, heightCm]);

    const recommendedTargets = useMemo(
        () => data?.recommendedTargets ?? [],
        [data?.recommendedTargets],
    );
    const customTargets = useMemo(
        () => data?.customTargets ?? [],
        [data?.customTargets],
    );
    const customTargetById = useMemo(() => {
        return new Map(customTargets.map((t) => [t.nutrientId, t] as const));
    }, [customTargets]);

    const ageYears = useMemo(() => {
        const birthDate = health?.birth_date;
        if (!birthDate) return null;
        const parts = birthDate.split("-").map((p) => Number(p));
        if (parts.length !== 3) return null;
        const [y, m, d] = parts;
        if (!y || !m || !d) return null;

        const dob = new Date(y, m - 1, d);
        if (Number.isNaN(dob.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dob.getDate())
        ) {
            age -= 1;
        }
        return age >= 0 ? age : null;
    }, [health?.birth_date]);

    const activityLabel = useMemo(() => {
        const level = health?.activity_level;
        if (!level) return "-";
        const normalized = String(level).toLowerCase();
        if (normalized === "sedentary") return "Sedentary";
        if (normalized === "light") return "Ringan";
        if (normalized === "moderate") return "Moderat";
        if (normalized === "active") return "Aktif";
        if (normalized === "very_active") return "Sangat Aktif";
        return level;
    }, [health?.activity_level]);

    const fetchProductDetail = async (scan: Scan) => {
        try {
            setModalLoading(true);
            setModalError(null);

            console.log("Fetching product detail for scan:", scan);
            console.log(
                "product_id:",
                scan.product_id,
                "Type:",
                typeof scan.product_id,
            );
            console.log("id:", scan.id, "Type:", typeof scan.id);

            const response = await fetch(
                `/api/product-detail?productId=${scan.product_id}&scanId=${scan.id}`,
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Failed to fetch product details (${response.status})`,
                );
            }

            const productData: ProductDetail = await response.json();
            setSelectedProduct(productData);
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : "An error occurred";
            console.error("Error fetching product detail:", errorMsg);
            setModalError(errorMsg);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setModalError(null);
    };

    // Memoize the nutri-score chart to prevent re-renders when modal opens
    const nutriScoreChart = useMemo(() => {
        if (!data?.nutriScoreTrend || data.nutriScoreTrend.length === 0) {
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
                    points={data.nutriScoreTrend
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
                {data.nutriScoreTrend.map((trend, idx) => {
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
                {data.nutriScoreTrend.map((trend, idx) => {
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
    }, [data?.nutriScoreTrend]);

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
                <div className="mx-auto w-full max-w-7xl">
                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Header Welcome Section */}
                    <div className="p-6 md:p-8 bg-linear-to-r from-[#2d6a3e] to-[#3d7d4a] rounded-[10px] mb-8">
                        <div className="flex items-center justify-between gap-6">
                            {/* Column 1: Greeting */}
                            <div className="text-white">
                                <p className="text-xs opacity-80 mb-1">
                                    Selamat datang kembali!
                                </p>
                                <h1 className="text-2xl md:text-3xl font-bold">
                                    Halo,{" "}
                                    {loading
                                        ? "User"
                                        : data?.user?.name || "User"}
                                    ! 👋
                                </h1>
                                <p className="text-xs opacity-80 mt-1">
                                    Pantau gizi & asupan kalorimu hari ini
                                </p>
                            </div>

                            {/* Column 2: Stats */}
                            <div className="flex gap-4 text-white shrink-0">
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold">
                                        {loading
                                            ? "-"
                                            : Math.round(
                                                  data?.dailyStats
                                                      ?.total_calories || 0,
                                              )}
                                    </div>
                                    <div className="text-xs opacity-80">
                                        kkal/kcal
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold">
                                        {loading
                                            ? "-"
                                            : data?.dailyStats?.item_count || 0}
                                    </div>
                                    <div className="text-xs opacity-80">
                                        item makanan
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Nutri-Score */}
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-semibold text-white opacity-90">
                                        NUTRI-SCORE RATA-RATA
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {loading ? (
                                            <div className="text-white text-sm">
                                                -
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm text-white font-semibold">
                                                        {Math.round(
                                                            (data?.scans?.reduce(
                                                                (sum, scan) =>
                                                                    sum +
                                                                    scan.nutrition_score,
                                                                0,
                                                            ) || 0) /
                                                                (data?.scans
                                                                    ?.length ||
                                                                    1),
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-white opacity-80">
                                                        poin
                                                    </span>
                                                </div>
                                                <div
                                                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 ${(() => {
                                                        const avgScore =
                                                            (data?.scans?.reduce(
                                                                (sum, scan) =>
                                                                    sum +
                                                                    scan.nutrition_score,
                                                                0,
                                                            ) || 0) /
                                                            (data?.scans
                                                                ?.length || 1);
                                                        if (avgScore >= 80)
                                                            return "bg-green-600";
                                                        if (avgScore >= 60)
                                                            return "bg-green-500";
                                                        if (avgScore >= 40)
                                                            return "bg-yellow-500";
                                                        if (avgScore >= 20)
                                                            return "bg-orange-500";
                                                        return "bg-red-500";
                                                    })()}`}>
                                                    {(() => {
                                                        const avgScore =
                                                            (data?.scans?.reduce(
                                                                (sum, scan) =>
                                                                    sum +
                                                                    scan.nutrition_score,
                                                                0,
                                                            ) || 0) /
                                                            (data?.scans
                                                                ?.length || 1);
                                                        if (avgScore >= 80)
                                                            return "A";
                                                        if (avgScore >= 60)
                                                            return "B";
                                                        if (avgScore >= 40)
                                                            return "C";
                                                        if (avgScore >= 20)
                                                            return "D";
                                                        return "E";
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Status Kesehatan Section --- */}
                    <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col gap-4 mb-8">
                        {/* Section Header dengan Tombol Edit */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#2d6a3e] rounded-full"></span>
                                <h2 className="text-xl font-bold text-[#1a3129]">
                                    Status Kesehatan
                                </h2>
                            </div>
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-lime-200 text-[#2d6a3e] rounded-lg text-sm font-semibold hover:bg-lime-50 transition-all shadow-xs"
                                onClick={() => setIsModalOpen(true)}>
                                <span>✏️</span>
                                Lengkapi / Edit Data
                            </button>
                        </div>

                        {/* Grid 3 Kartu (Profil Fisik, Riwayat Medis, Target) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Card 1: Profil Fisik */}
                            <div className="p-5 bg-white rounded-[10px] border border-lime-200 shadow-sm flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">📊</span>
                                    <h3 className="font-bold text-[#1a3129] text-sm uppercase tracking-wide">
                                        Profil Fisik
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                                            Berat / Tinggi
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129]">
                                            {loading
                                                ? "-"
                                                : `${weightKg ?? "-"} kg / ${heightCm ?? "-"} cm`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                                            Status BMI
                                        </p>
                                        <p
                                            className={`text-sm font-semibold ${bmiInfo?.className || "text-[#1a3129]"}`}>
                                            {loading
                                                ? "-"
                                                : bmiInfo
                                                  ? `${bmiInfo.value} (${bmiInfo.label})`
                                                  : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                                            Umur
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129]">
                                            {loading
                                                ? "-"
                                                : ageYears !== null
                                                  ? `${ageYears} Tahun`
                                                  : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                                            Aktivitas
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129]">
                                            {loading ? "-" : activityLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Riwayat Medis */}
                            <div className="p-5 bg-white rounded-[10px] border border-lime-200 shadow-sm flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">🏥</span>
                                    <h3 className="font-bold text-[#1a3129] text-sm uppercase tracking-wide">
                                        Riwayat Medis
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {loading ? (
                                        <span className="text-xs text-gray-500">
                                            -
                                        </span>
                                    ) : data?.medicalConditions?.length ? (
                                        data.medicalConditions.map((c, idx) => (
                                            <span
                                                key={c.id}
                                                className={
                                                    idx % 2 === 0
                                                        ? "px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100"
                                                        : "px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full border border-orange-100"
                                                }>
                                                {c.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-500">
                                            Belum ada data
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Target Personalisasi */}
                            <div className="p-5 bg-white rounded-[10px] border border-lime-200 shadow-sm flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">🎯</span>
                                    <h3 className="font-bold text-[#1a3129] text-sm uppercase tracking-wide">
                                        Target Personalisasi
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[11px] text-gray-500">
                                        {loading
                                            ? "-"
                                            : recommendedTargets.length
                                              ? `Rekomendasi otomatis: ${recommendedTargets
                                                    .map((t) => t.nutrientName)
                                                    .filter(Boolean)
                                                    .join(", ")}`
                                              : "Tidak ada rekomendasi khusus dari riwayat medis"}
                                    </div>
                                    {loading ? null : recommendedTargets.length ? (
                                        <div className="space-y-3">
                                            {recommendedTargets.map((t) => {
                                                const name = (
                                                    t.nutrientName ?? "Nutrisi"
                                                ).trim();
                                                const lower =
                                                    name.toLowerCase();
                                                const isSugar =
                                                    /sugar|gula/.test(lower);
                                                const isSodium =
                                                    /sodium|natrium/.test(
                                                        lower,
                                                    );
                                                const isFat =
                                                    /fat|lemak/.test(lower) &&
                                                    !/jenuh|saturated/.test(
                                                        lower,
                                                    );
                                                const isCalories =
                                                    /calorie|kalori|energi/.test(
                                                        lower,
                                                    );

                                                const custom =
                                                    customTargetById.get(
                                                        t.nutrientId,
                                                    );

                                                const profileLimit = isSugar
                                                    ? (data?.healthProfile
                                                          ?.daily_sugar_limit ??
                                                      null)
                                                    : isSodium
                                                      ? (data?.healthProfile
                                                            ?.daily_sodium_limit ??
                                                        null)
                                                      : isFat
                                                        ? (data?.healthProfile
                                                              ?.daily_fat_limit ??
                                                          null)
                                                        : isCalories
                                                          ? (data?.healthProfile
                                                                ?.daily_calories_target ??
                                                            null)
                                                          : null;

                                                const maxValue =
                                                    profileLimit ??
                                                    custom?.dailyLimit ??
                                                    t.recommendedLimit ??
                                                    null;

                                                const unit = isSugar
                                                    ? "g"
                                                    : isSodium
                                                      ? "mg"
                                                      : isFat
                                                        ? "g"
                                                        : isCalories
                                                          ? "kcal"
                                                          : (custom?.unit ??
                                                            t.unit ??
                                                            "");

                                                const colorClass = isSugar
                                                    ? "text-red-500"
                                                    : isSodium
                                                      ? "text-orange-500"
                                                      : "text-[#1a3129]";

                                                return (
                                                    <div
                                                        key={t.nutrientId}
                                                        className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-600">
                                                                {name}
                                                            </span>
                                                            <span
                                                                className={`text-xs font-bold ${colorClass}`}>
                                                                Maks.{" "}
                                                                {maxValue ===
                                                                    null ||
                                                                !Number.isFinite(
                                                                    maxValue,
                                                                )
                                                                    ? "-"
                                                                    : `${maxValue}${unit}`}
                                                                {t.recommendedLimit !==
                                                                    null &&
                                                                profileLimit !==
                                                                    null ? (
                                                                    <span className="ml-2 text-[10px] font-semibold text-gray-400">
                                                                        (Rekom.{" "}
                                                                        {`${t.recommendedLimit}${t.unit ?? unit}`}
                                                                        )
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </div>
                                                        {isSugar ? (
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-red-400 h-1.5 rounded-full"
                                                                    style={{
                                                                        width: "40%",
                                                                    }}></div>
                                                            </div>
                                                        ) : isSodium ? (
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-orange-400 h-1.5 rounded-full"
                                                                    style={{
                                                                        width: "60%",
                                                                    }}></div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500">
                                            -
                                        </div>
                                    )}

                                    {loading ? null : customTargets.length ? (
                                        <div className="pt-2 space-y-1">
                                            <div className="text-[11px] text-gray-500 font-semibold">
                                                Target kustom
                                            </div>
                                            {customTargets.map((t) => (
                                                <div
                                                    key={t.nutrientId}
                                                    className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-600">
                                                        {t.nutrientName}
                                                    </span>
                                                    <span className="text-xs font-bold text-[#1a3129]">
                                                        Maks. {t.dailyLimit}
                                                        {t.unit ?? ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[4fr_5fr_3fr] gap-4 md:gap-6 mb-8">
                            {/* Left Column - Calorie Daily */}
                            <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <h3 className="font-semibold text-[#1a3129]">
                                            Kalori Harian
                                        </h3>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {loading
                                            ? "-"
                                            : Math.round(
                                                  (data?.healthProfile
                                                      ?.daily_calories_target ||
                                                      2000) -
                                                      (data?.dailyStats
                                                          ?.total_calories ||
                                                          0),
                                              )}{" "}
                                        kcal tersisa
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
                                                strokeDasharray={`${(loading ? 0 : ((data?.dailyStats?.total_calories || 0) / (data?.healthProfile?.daily_calories_target || 2000)) * 100) * 0.9735} 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <div className="text-2xl font-bold text-[#1a3129]">
                                                {loading
                                                    ? "-"
                                                    : Math.round(
                                                          data?.dailyStats
                                                              ?.total_calories ||
                                                              0,
                                                      )}
                                            </div>
                                            <div className="text-xs text-[#1a3129] opacity-70">
                                                kkal
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-[#1a3129] opacity-70 text-center">
                                    {loading
                                        ? "-"
                                        : Math.round(
                                              ((data?.dailyStats
                                                  ?.total_calories || 0) /
                                                  (data?.healthProfile
                                                      ?.daily_calories_target ||
                                                      2000)) *
                                                  100,
                                          )}
                                    % dari target
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg shrink-0">
                                            🥚
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-[#1a3129]">
                                                    Protein
                                                </span>
                                                <span className="text-sm text-[#1a3129] opacity-70">
                                                    {loading
                                                        ? "-/-"
                                                        : `${Math.round(data?.dailyStats?.macronutrients?.protein?.total || 0)}/${data?.dailyStats?.macronutrients?.protein?.limit || 80}g`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-orange-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: loading
                                                            ? "0%"
                                                            : `${Math.min(100, ((data?.dailyStats?.macronutrients?.protein?.total || 0) / (data?.dailyStats?.macronutrients?.protein?.limit || 80)) * 100)}%`,
                                                    }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-lg shrink-0">
                                            🌽
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-[#1a3129]">
                                                    Karbohidrat
                                                </span>
                                                <span className="text-sm text-[#1a3129] opacity-70">
                                                    {loading
                                                        ? "-/-"
                                                        : `${Math.round(data?.dailyStats?.macronutrients?.carbs?.total || 0)}/${data?.dailyStats?.macronutrients?.carbs?.limit || 250}g`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: loading
                                                            ? "0%"
                                                            : `${Math.min(100, ((data?.dailyStats?.macronutrients?.carbs?.total || 0) / (data?.dailyStats?.macronutrients?.carbs?.limit || 250)) * 100)}%`,
                                                    }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-lg shrink-0">
                                            🥑
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-[#1a3129]">
                                                    Lemak
                                                </span>
                                                <span className="text-sm text-[#1a3129] opacity-70">
                                                    {loading
                                                        ? "-/-"
                                                        : `${Math.round(data?.dailyStats?.macronutrients?.fat?.total || 0)}/${data?.dailyStats?.macronutrients?.fat?.limit || 55}g`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-red-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: loading
                                                            ? "0%"
                                                            : `${Math.min(100, ((data?.dailyStats?.macronutrients?.fat?.total || 0) / (data?.dailyStats?.macronutrients?.fat?.limit || 55)) * 100)}%`,
                                                    }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-lg shrink-0">
                                            💚
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-[#1a3129]">
                                                    Serat
                                                </span>
                                                <span className="text-sm text-[#1a3129] opacity-70">
                                                    {loading
                                                        ? "-/-"
                                                        : `${Math.round(data?.dailyStats?.macronutrients?.fiber?.total || 0)}/${data?.dailyStats?.macronutrients?.fiber?.limit || 25}g`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: loading
                                                            ? "0%"
                                                            : `${Math.min(100, ((data?.dailyStats?.macronutrients?.fiber?.total || 0) / (data?.dailyStats?.macronutrients?.fiber?.limit || 25)) * 100)}%`,
                                                    }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Column - Riwayat Scan */}
                            <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-[#1a3129]">
                                            Riwayat Scan
                                        </h3>
                                        <p className="text-xs text-[#1a3129] opacity-60 mt-1">
                                            Ringkasan analisis produk yang
                                            pernah kamu scan
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => router.push("/scan-history")}
                                        className="px-3 py-1 bg-[#cbea7b] text-black rounded-lg text-xs font-semibold hover:bg-[#b8d96a] transition-colors whitespace-nowrap">
                                        Lihat Semua
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {loading ? (
                                        <div className="text-center py-8 text-[#1a3129] opacity-60">
                                            Loading...
                                        </div>
                                    ) : data?.scans && data.scans.length > 0 ? (
                                        data.scans.map((scan, idx) => {
                                            const emoji = [
                                                "🥣",
                                                "🍫",
                                                "🥐",
                                                "🍕",
                                                "🥗",
                                                "🍎",
                                            ][idx % 6];
                                            const gradients = [
                                                "from-blue-100 to-blue-50",
                                                "from-amber-100 to-amber-50",
                                                "from-orange-100 to-orange-50",
                                                "from-red-100 to-red-50",
                                                "from-green-100 to-green-50",
                                                "from-purple-100 to-purple-50",
                                            ][idx % 6];

                                            return (
                                                <div
                                                    key={scan.id}
                                                    onClick={() =>
                                                        fetchProductDetail(scan)
                                                    }
                                                    className="flex gap-3 p-3 bg-white rounded-lg border border-lime-100 hover:shadow-md hover:bg-lime-50 transition-all cursor-pointer">
                                                    <div
                                                        className={`w-16 h-16 bg-linear-to-br ${gradients} rounded-lg flex items-center justify-center shrink-0 text-2xl`}>
                                                        {emoji}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-[#1a3129] text-sm">
                                                            {scan.product_name}
                                                            {scan.product_brand &&
                                                                ` (${scan.product_brand})`}
                                                        </h4>
                                                        <p className="text-xs text-[#1a3129] opacity-60 mb-2">
                                                            {new Date(
                                                                scan.scanned_at,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                            )}
                                                        </p>
                                                        <div className="flex gap-1">
                                                            {[...Array(6)].map(
                                                                (_, i) => {
                                                                    const filledBars =
                                                                        Math.ceil(
                                                                            (scan.nutrition_score /
                                                                                100) *
                                                                                6,
                                                                        );
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                i
                                                                            }
                                                                            className={`h-1 rounded-full flex-1 ${
                                                                                i <
                                                                                filledBars
                                                                                    ? "bg-lime-400"
                                                                                    : "bg-gray-200"
                                                                            }`}
                                                                        />
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center shrink-0">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-10 h-10 text-white text-sm font-bold rounded ${
                                                                scan.nutrition_score >=
                                                                80
                                                                    ? "bg-green-600"
                                                                    : scan.nutrition_score >=
                                                                        60
                                                                      ? "bg-green-500"
                                                                      : scan.nutrition_score >=
                                                                          40
                                                                        ? "bg-yellow-500"
                                                                        : scan.nutrition_score >=
                                                                            20
                                                                          ? "bg-orange-500"
                                                                          : "bg-red-500"
                                                            }`}>
                                                            {scan.nutrition_score >=
                                                            80
                                                                ? "A"
                                                                : scan.nutrition_score >=
                                                                    60
                                                                  ? "B"
                                                                  : scan.nutrition_score >=
                                                                      40
                                                                    ? "C"
                                                                    : scan.nutrition_score >=
                                                                        20
                                                                      ? "D"
                                                                      : "E"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-[#1a3129] opacity-60">
                                            Belum ada scan hari ini
                                        </div>
                                    )}
                                </div>

                                <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                    <Camera size={16} />
                                    Scan Produk Baru
                                </button>
                            </div>

                            {/* Right Column - Hidrasi, Energi & Mood, Aktivitas */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Nutri-Score 5-Day Trend */}
                                {!loading &&
                                    data?.nutriScoreTrend &&
                                    data.nutriScoreTrend.length > 0 && (
                                        <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                                    <h3 className="font-semibold text-[#1a3129]">
                                                        Nutri-Score 5 Hari
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-[#1a3129] opacity-70">
                                                        Rata-rata:{" "}
                                                        {Math.round(
                                                            data.nutriScoreTrend.reduce(
                                                                (sum, t) =>
                                                                    sum +
                                                                    t.score,
                                                                0,
                                                            ) /
                                                                data
                                                                    .nutriScoreTrend
                                                                    .length,
                                                        )}
                                                    </span>
                                                    {(() => {
                                                        const avgScore =
                                                            data.nutriScoreTrend.reduce(
                                                                (sum, t) =>
                                                                    sum +
                                                                    t.score,
                                                                0,
                                                            ) /
                                                            data.nutriScoreTrend
                                                                .length;
                                                        const letter =
                                                            avgScore >= 80
                                                                ? "A"
                                                                : avgScore >= 60
                                                                  ? "B"
                                                                  : avgScore >=
                                                                      40
                                                                    ? "C"
                                                                    : avgScore >=
                                                                        20
                                                                      ? "D"
                                                                      : "E";
                                                        const letterColor =
                                                            avgScore >= 80
                                                                ? "bg-green-600"
                                                                : avgScore >= 60
                                                                  ? "bg-green-500"
                                                                  : avgScore >=
                                                                      40
                                                                    ? "bg-yellow-500"
                                                                    : avgScore >=
                                                                        20
                                                                      ? "bg-orange-500"
                                                                      : "bg-red-500";
                                                        return (
                                                            <div
                                                                className={`w-6 h-6 rounded-full ${letterColor} flex items-center justify-center text-white text-xs font-bold`}>
                                                                {letter}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Dot Plot Chart */}
                                            {nutriScoreChart}

                                            {/* Legend */}
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
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    <MedForm
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSaved={() => {
                            fetchDashboardData();
                        }}
                    />
                </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-20 bg-linear-to-r from-[#2d6a3e] to-[#3d7d4a] p-6 flex items-center justify-between shrink-0 shadow-md">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedProduct.name}
                                    {selectedProduct.brand &&
                                        ` (${selectedProduct.brand})`}
                                </h2>
                                <p className="text-xs text-white opacity-80 mt-1">
                                    Scan:{" "}
                                    {new Date(
                                        selectedProduct.scanned_at,
                                    ).toLocaleDateString("id-ID")}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-white text-2xl font-bold hover:opacity-70">
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {modalLoading && (
                                <div className="text-center py-8 text-[#1a3129] opacity-60">
                                    Loading product details...
                                </div>
                            )}

                            {modalError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                    {modalError}
                                </div>
                            )}

                            {!modalLoading && !modalError && (
                                <>
                                    {/* Nutri-Score Section */}
                                    <div className="bg-lime-50 rounded-lg p-6 border border-lime-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-[#1a3129] opacity-70 mb-1">
                                                    Nutrient Score
                                                </p>
                                                <p className="text-sm text-[#1a3129] opacity-60">
                                                    {selectedProduct.serving_size &&
                                                    selectedProduct.serving_unit
                                                        ? `Per ${selectedProduct.serving_size} ${selectedProduct.serving_unit}`
                                                        : "Nutrition Information"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-3xl font-bold text-[#1a3129]">
                                                        {Math.round(
                                                            selectedProduct.nutrition_score,
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-[#1a3129] opacity-70">
                                                        poin
                                                    </span>
                                                </div>
                                                <div
                                                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                                                        selectedProduct.nutrition_score >=
                                                        80
                                                            ? "bg-green-600"
                                                            : selectedProduct.nutrition_score >=
                                                                60
                                                              ? "bg-green-500"
                                                              : selectedProduct.nutrition_score >=
                                                                  40
                                                                ? "bg-yellow-500"
                                                                : selectedProduct.nutrition_score >=
                                                                    20
                                                                  ? "bg-orange-500"
                                                                  : "bg-red-500"
                                                    }`}>
                                                    {selectedProduct.nutrition_score >=
                                                    80
                                                        ? "A"
                                                        : selectedProduct.nutrition_score >=
                                                            60
                                                          ? "B"
                                                          : selectedProduct.nutrition_score >=
                                                              40
                                                            ? "C"
                                                            : selectedProduct.nutrition_score >=
                                                                20
                                                              ? "D"
                                                              : "E"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Visualization */}
                                        <div className="mt-6 pt-4 border-t border-lime-200">
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-[#1a3129] mb-2">
                                                    📊 Kualitas Nutrisi (Skala
                                                    0-100)
                                                </p>
                                                <div className="flex gap-1">
                                                    {[...Array(6)].map(
                                                        (_, i) => {
                                                            const filledBars =
                                                                Math.ceil(
                                                                    (selectedProduct.nutrition_score /
                                                                        100) *
                                                                        6,
                                                                );
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`h-3 rounded-full flex-1 transition-colors ${
                                                                        i <
                                                                        filledBars
                                                                            ? "bg-lime-400"
                                                                            : "bg-gray-200"
                                                                    }`}
                                                                />
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[#1a3129] opacity-60">
                                                    Buruk (0)
                                                </span>
                                                <span className="text-[#1a3129] opacity-60">
                                                    Sangat Baik (100)
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#1a3129] opacity-70 mt-3 bg-blue-50 p-2 rounded">
                                                💡{" "}
                                                <span className="font-medium">
                                                    Skor Anda:{" "}
                                                    {Math.round(
                                                        selectedProduct.nutrition_score,
                                                    )}
                                                    /100
                                                </span>{" "}
                                                — Produk ini tergolong{" "}
                                                <span
                                                    className={`font-semibold ${
                                                        selectedProduct.nutrition_score >=
                                                        80
                                                            ? "text-green-600"
                                                            : selectedProduct.nutrition_score >=
                                                                60
                                                              ? "text-green-500"
                                                              : selectedProduct.nutrition_score >=
                                                                  40
                                                                ? "text-yellow-600"
                                                                : selectedProduct.nutrition_score >=
                                                                    20
                                                                  ? "text-orange-600"
                                                                  : "text-red-600"
                                                    }`}>
                                                    {selectedProduct.nutrition_score >=
                                                    80
                                                        ? "Sangat Sehat"
                                                        : selectedProduct.nutrition_score >=
                                                            60
                                                          ? "Sehat"
                                                          : selectedProduct.nutrition_score >=
                                                              40
                                                            ? "Cukup"
                                                            : selectedProduct.nutrition_score >=
                                                                20
                                                              ? "Kurang Baik"
                                                              : "Tidak Sehat"}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Calculation Explanation */}
                                        <div className="mt-6 pt-4 border-t border-lime-200">
                                            <p className="text-xs font-semibold text-[#1a3129] mb-3">
                                                🔍 Perhitungan Skor
                                            </p>
                                            <div className="space-y-1 bg-amber-50 p-3 rounded-lg text-xs text-[#1a3129]">
                                                <div className="flex justify-between">
                                                    <span>
                                                        Nutrisi Positif
                                                        (Protein, Serat, dll)
                                                    </span>
                                                    <span className="text-green-600 font-semibold">
                                                        +
                                                        {Math.round(
                                                            selectedProduct.nutrition_score +
                                                                (100 -
                                                                    selectedProduct.nutrition_score) *
                                                                    0.4,
                                                        )}{" "}
                                                        poin
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>
                                                        Nutrisi Negatif (Gula,
                                                        Garam, Lemak)
                                                    </span>
                                                    <span className="text-red-600 font-semibold">
                                                        −
                                                        {Math.round(
                                                            (100 -
                                                                selectedProduct.nutrition_score) *
                                                                0.4,
                                                        )}{" "}
                                                        poin
                                                    </span>
                                                </div>
                                                <div className="border-t border-amber-200 pt-1 flex justify-between font-semibold">
                                                    <span>
                                                        Nilai Akhir Nutri-Score
                                                    </span>
                                                    <span className="text-[#1a3129]">
                                                        ={" "}
                                                        {Math.round(
                                                            selectedProduct.nutrition_score,
                                                        )}{" "}
                                                        Poin
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nutrients Section */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1a3129] mb-4">
                                            Nutrient Information
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedProduct.nutrients &&
                                            selectedProduct.nutrients.length >
                                                0 ? (
                                                selectedProduct.nutrients.map(
                                                    (nutrient, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-semibold text-[#1a3129]">
                                                                    {
                                                                        nutrient.nutrient_name
                                                                    }
                                                                </span>
                                                                <span className="text-sm font-bold text-green-600">
                                                                    {Math.round(
                                                                        nutrient.amount *
                                                                            10,
                                                                    ) / 10}{" "}
                                                                    {
                                                                        nutrient.unit
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <p className="text-sm text-[#1a3129] opacity-60 text-center py-4">
                                                    No nutrient data available
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
