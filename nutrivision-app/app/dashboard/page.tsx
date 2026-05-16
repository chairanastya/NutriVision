"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import MedForm from "@/components/user/MedForm";
import ProductDetailModal from "@/components/ProductDetailModal";
import ScanHistoryColumn from "@/components/ScanHistoryColumn";

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
    category: string | null;
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
                    <div className="p-8 md:p-10 bg-gradient-to-r from-[#2d6a3e] to-[#3d7d4a] rounded-2xl mb-10 shadow-lg border border-[#4a8a5a]/30">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            {/* Column 1: Greeting */}
                            <div className="text-white flex-1">
                                <p className="text-sm opacity-75 mb-2 font-medium tracking-wide">
                                    Selamat datang kembali!
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                    Halo,{" "}
                                    {loading
                                        ? "User"
                                        : data?.user?.name || "User"}
                                    ! 👋
                                </h1>
                                <p className="text-sm opacity-75">
                                    Pantau gizi & asupan kalorimu hari ini
                                </p>
                            </div>

                            {/* Column 2: Stats */}
                            <div className="flex gap-8 text-white">
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold mb-1">
                                        {loading
                                            ? "-"
                                            : Math.round(
                                                  data?.dailyStats
                                                      ?.total_calories || 0,
                                              )}
                                    </div>
                                    <div className="text-xs opacity-75 font-medium">
                                        kkal/kcal
                                    </div>
                                </div>
                                <div className="w-px bg-white/20"></div>
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold mb-1">
                                        {loading
                                            ? "-"
                                            : data?.dailyStats?.item_count || 0}
                                    </div>
                                    <div className="text-xs opacity-75 font-medium">
                                        item
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Nutri-Score */}
                            <div className="flex flex-col items-start lg:items-end gap-2">
                                <span className="text-xs font-semibold text-white opacity-75 uppercase tracking-wider">
                                    Nutri-Score
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

                    {/* --- Status Kesehatan Section --- */}
                    <div className="p-8 md:p-10 bg-lime-50 rounded-2xl outline-1 -outline-offset-1 outline-lime-200 flex flex-col gap-6 mb-10 shadow-md border border-lime-200/50 hover:shadow-lg transition-shadow">
                        {/* Section Header dengan Tombol Edit */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-[#2d6a3e] to-[#3d7d4a] rounded-full"></div>
                                <h2 className="text-2xl font-bold text-[#1a3129]">
                                    Status Kesehatan
                                </h2>
                            </div>
                            <button
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#cbea7b] text-[#2d6a3e] rounded-lg text-sm font-semibold hover:bg-lime-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                                onClick={() => setIsModalOpen(true)}>
                                <span>✏️</span>
                                Edit
                            </button>
                        </div>

                        {/* Grid 3 Kartu (Profil Fisik, Riwayat Medis, Target) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Profil Fisik */}
                            <div className="p-6 bg-white rounded-xl border-2 border-lime-200/60 shadow-md hover:shadow-lg hover:border-lime-300 transition-all flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-2xl">📊</span>
                                    <h3 className="font-bold text-[#1a3129] text-sm uppercase tracking-wider">
                                        Profil Fisik
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                                            Berat / Tinggi
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129] mt-1">
                                            {loading
                                                ? "-"
                                                : `${weightKg ?? "-"} kg / ${heightCm ?? "-"} cm`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                                            Status BMI
                                        </p>
                                        <p
                                            className={`text-sm font-semibold mt-1 ${bmiInfo?.className || "text-[#1a3129]"}`}>
                                            {loading
                                                ? "-"
                                                : bmiInfo
                                                  ? `${bmiInfo.value} (${bmiInfo.label})`
                                                  : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                                            Umur
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129] mt-1">
                                            {loading
                                                ? "-"
                                                : ageYears !== null
                                                  ? `${ageYears} Tahun`
                                                  : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                                            Aktivitas
                                        </p>
                                        <p className="text-sm font-semibold text-[#1a3129] mt-1">
                                            {loading ? "-" : activityLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Riwayat Medis */}
                            <div className="p-6 bg-white rounded-xl border-2 border-lime-200/60 shadow-md hover:shadow-lg hover:border-lime-300 transition-all flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-2xl">🏥</span>
                                    <h3 className="font-bold text-[#1a3129] text-sm uppercase tracking-wider">
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
                                                        ? "px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200"
                                                        : "px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full border border-orange-200"
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
                            <div className="p-6 bg-white rounded-xl border-2 border-lime-200/60 shadow-md hover:shadow-lg hover:border-lime-300 transition-all flex flex-col gap-4">
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
                                                                    null && (
                                                                    <span className="ml-2 text-[10px] font-semibold text-gray-400">
                                                                        (Rekom.{" "}
                                                                        {`${t.recommendedLimit}${t.unit ?? unit}`}
                                                                        )
                                                                    </span>
                                                                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[4fr_5fr_3fr] gap-6 md:gap-8 mb-8">
                            {/* Left Column - Calorie Daily */}
                            <div className="p-8 md:p-10 bg-lime-50 rounded-2xl outline-1 -outline-offset-1 outline-lime-200 flex flex-col gap-6 shadow-md hover:shadow-lg border border-lime-200/50 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <h3 className="font-bold text-[#1a3129] text-lg">
                                            Kalori Harian
                                        </h3>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
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
                                        tersisa
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
                            <ScanHistoryColumn
                                scans={data?.scans}
                                loading={loading}
                                onScanClick={fetchProductDetail}
                            />

                            {/* Right Column - Hidrasi, Energi & Mood, Aktivitas */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Nutri-Score 5-Day Trend */}
                                {!loading &&
                                    data?.nutriScoreTrend &&
                                    data.nutriScoreTrend.length > 0 && (
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

                    <MedForm
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSaved={() => {
                            fetchDashboardData();
                        }}
                    />
                </div>
            </div>

            <ProductDetailModal
                selectedProduct={selectedProduct}
                modalLoading={modalLoading}
                modalError={modalError}
                onClose={closeModal}
            />

            <Footer />
        </div>
    );
}
