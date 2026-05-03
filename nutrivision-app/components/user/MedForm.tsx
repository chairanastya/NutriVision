"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getRecommendedLimitForNutrient } from "@/lib/targets";

interface MedFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

type MedicalCondition = {
    id: number;
    name: string;
    description: string | null;
    restrictedNutrient: {
        id: number;
        name: string | null;
        unit: string | null;
    } | null;
};

type Nutrient = {
    id: number;
    name: string;
    unit: string | null;
};

type CustomTargetInput = {
    nutrientId: string;
    dailyLimit: string;
};

export default function MedForm({ isOpen, onClose, onSaved }: MedFormProps) {
    const [gender, setGender] = useState<"male" | "female" | "">("");
    const [birthDate, setBirthDate] = useState<string>("");
    const [weight, setWeight] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [activityLevel, setActivityLevel] = useState<string>("");
    const [conditions, setConditions] = useState<MedicalCondition[]>([]);
    const [nutrients, setNutrients] = useState<Nutrient[]>([]);
    const [selectedConditionIds, setSelectedConditionIds] = useState<
        Set<number>
    >(new Set());
    const [dailyCaloriesTarget, setDailyCaloriesTarget] = useState<string>("");
    const [dailySugarLimit, setDailySugarLimit] = useState<string>("");
    const [dailySodiumLimit, setDailySodiumLimit] = useState<string>("");
    const [dailyFatLimit, setDailyFatLimit] = useState<string>("");
    const [customTargets, setCustomTargets] = useState<CustomTargetInput[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedCount = useMemo(
        () => selectedConditionIds.size,
        [selectedConditionIds],
    );

    const recommendedTargets = useMemo(() => {
        const map = new Map<
            number,
            {
                nutrientId: number;
                nutrientName: string | null;
                unit: string | null;
                recommendedLimit: number | null;
                reasons: string[];
            }
        >();

        for (const condition of conditions) {
            if (!selectedConditionIds.has(condition.id)) continue;
            const rn = condition.restrictedNutrient;
            if (!rn?.id) continue;

            const nutrientId = rn.id;
            const nutrientName = rn.name;
            const unit = rn.unit;

            const existing = map.get(nutrientId);
            if (!existing) {
                map.set(nutrientId, {
                    nutrientId,
                    nutrientName,
                    unit,
                    recommendedLimit:
                        nutrientName !== null
                            ? getRecommendedLimitForNutrient(nutrientName, unit)
                            : null,
                    reasons: [condition.name],
                });
            } else if (!existing.reasons.includes(condition.name)) {
                existing.reasons.push(condition.name);
            }
        }

        return Array.from(map.values()).sort((a, b) =>
            String(a.nutrientName ?? "").localeCompare(
                String(b.nutrientName ?? ""),
            ),
        );
    }, [conditions, selectedConditionIds]);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        (async () => {
            try {
                const [conditionsRes, profileRes, nutrientsRes] =
                    await Promise.all([
                        fetch("/api/medical-conditions", {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                        }),
                        fetch("/api/user/health-profile", {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                        }),
                        fetch("/api/nutrients", {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                        }),
                    ]);

                if (!conditionsRes.ok) {
                    throw new Error(
                        `Failed to load conditions: ${conditionsRes.status}`,
                    );
                }

                const conditionsJson = (await conditionsRes.json()) as {
                    conditions: MedicalCondition[];
                };

                if (!cancelled) {
                    setConditions(
                        Array.isArray(conditionsJson.conditions)
                            ? conditionsJson.conditions
                            : [],
                    );
                }

                if (profileRes.ok) {
                    const profileJson = (await profileRes.json()) as {
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
                        customTargets: Array<{
                            nutrientId: number;
                            nutrientName: string;
                            unit: string | null;
                            dailyLimit: number;
                        }>;
                    };

                    if (!cancelled) {
                        setGender(profileJson.profile?.gender ?? "");
                        setBirthDate(profileJson.profile?.birthDate ?? "");
                        setHeight(
                            profileJson.profile?.height === null ||
                                profileJson.profile?.height === undefined
                                ? ""
                                : String(profileJson.profile.height),
                        );
                        setWeight(
                            profileJson.profile?.weight === null ||
                                profileJson.profile?.weight === undefined
                                ? ""
                                : String(profileJson.profile.weight),
                        );
                        setActivityLevel(
                            profileJson.profile?.activityLevel ?? "",
                        );
                        setSelectedConditionIds(
                            new Set(
                                Array.isArray(profileJson.conditionIds)
                                    ? profileJson.conditionIds
                                    : [],
                            ),
                        );

                        const dt = profileJson.profile?.dailyTargets;
                        setDailyCaloriesTarget(
                            dt?.calories === null || dt?.calories === undefined
                                ? ""
                                : String(dt.calories),
                        );
                        setDailySugarLimit(
                            dt?.sugar === null || dt?.sugar === undefined
                                ? ""
                                : String(dt.sugar),
                        );
                        setDailySodiumLimit(
                            dt?.sodium === null || dt?.sodium === undefined
                                ? ""
                                : String(dt.sodium),
                        );
                        setDailyFatLimit(
                            dt?.fat === null || dt?.fat === undefined
                                ? ""
                                : String(dt.fat),
                        );

                        setCustomTargets(
                            Array.isArray(profileJson.customTargets)
                                ? profileJson.customTargets.map((t) => ({
                                      nutrientId: String(t.nutrientId),
                                      dailyLimit: String(t.dailyLimit),
                                  }))
                                : [],
                        );
                    }
                } else if (profileRes.status === 401) {
                    if (!cancelled) {
                        setError("Silakan login dulu untuk menyimpan profil.");
                    }
                }

                if (nutrientsRes.ok) {
                    const nutrientsJson = (await nutrientsRes.json()) as {
                        nutrients: Nutrient[];
                    };
                    if (!cancelled) {
                        setNutrients(
                            Array.isArray(nutrientsJson.nutrients)
                                ? nutrientsJson.nutrients
                                : [],
                        );
                    }
                }
            } catch (e) {
                console.error("Failed to load medical profile data:", e);
                if (!cancelled) {
                    setError(
                        "Gagal memuat data. Pastikan koneksi database dan endpoint API sudah benar.",
                    );
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    function toggleCondition(id: number) {
        setSelectedConditionIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function addCustomTarget() {
        const first = nutrients[0];
        setCustomTargets((prev) => [
            ...prev,
            { nutrientId: first ? String(first.id) : "", dailyLimit: "" },
        ]);
    }

    function updateCustomTarget(
        index: number,
        patch: Partial<CustomTargetInput>,
    ) {
        setCustomTargets((prev) =>
            prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
        );
    }

    function removeCustomTarget(index: number) {
        setCustomTargets((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                gender: gender ? gender : null,
                birthDate: birthDate ? birthDate : null,
                height: height ? Number(height) : null,
                weight: weight ? Number(weight) : null,
                activityLevel: activityLevel ? activityLevel : null,
                conditionIds: Array.from(selectedConditionIds),
                dailyTargets: {
                    calories: dailyCaloriesTarget
                        ? Number(dailyCaloriesTarget)
                        : null,
                    sugar: dailySugarLimit ? Number(dailySugarLimit) : null,
                    sodium: dailySodiumLimit ? Number(dailySodiumLimit) : null,
                    fat: dailyFatLimit ? Number(dailyFatLimit) : null,
                },
                customTargets: customTargets
                    .map((t) => ({
                        nutrientId: t.nutrientId ? Number(t.nutrientId) : 0,
                        dailyLimit: t.dailyLimit ? Number(t.dailyLimit) : NaN,
                    }))
                    .filter(
                        (t) =>
                            Number.isInteger(t.nutrientId) &&
                            t.nutrientId > 0 &&
                            Number.isFinite(t.dailyLimit) &&
                            t.dailyLimit > 0,
                    ),
            };

            const res = await fetch("/api/user/health-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = (await res.json().catch(() => null)) as {
                    message?: string;
                } | null;
                throw new Error(data?.message || `HTTP ${res.status}`);
            }

            onSaved?.();
            onClose();
        } catch (e) {
            console.error("Failed to save health profile:", e);
            setError(
                e instanceof Error
                    ? e.message
                    : "Gagal menyimpan profil kesehatan",
            );
        } finally {
            setIsSaving(false);
        }
    }

    // Untuk keperluan demo (tampilan saja)
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-linear-to-r from-[#2d6a3e] to-[#3d7d4a] p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            Lengkapi Profil Kesehatan
                        </h2>
                        <p className="text-xs opacity-80">
                            Data ini membantu AI memberikan skor gizi yang lebih
                            akurat
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Form Body */}
                    <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                        {error ? (
                            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}
                        {/* Section 1: Biometrik */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1.5 h-5 bg-[#2d6a3e] rounded-full"></span>
                                <h3 className="font-bold text-[#1a3129]">
                                    Data Biometrik Dasar
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Jenis Kelamin
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={(e) =>
                                            setGender(
                                                e.target.value as
                                                    | "male"
                                                    | "female"
                                                    | "",
                                            )
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]">
                                        <option value="">
                                            Pilih Jenis Kelamin
                                        </option>
                                        <option value="male">Laki-laki</option>
                                        <option value="female">
                                            Perempuan
                                        </option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Tanggal Lahir
                                    </label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) =>
                                            setBirthDate(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Berat Badan (kg)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 70"
                                        value={weight}
                                        onChange={(e) =>
                                            setWeight(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Tinggi Badan (cm)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 175"
                                        value={height}
                                        onChange={(e) =>
                                            setHeight(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Tingkat Aktivitas
                                    </label>
                                    <select
                                        value={activityLevel}
                                        onChange={(e) =>
                                            setActivityLevel(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]">
                                        <option value="">
                                            Pilih Tingkat Aktivitas
                                        </option>
                                        <option value="sedentary">
                                            Sedentary (Jarang Olahraga)
                                        </option>
                                        <option value="light">
                                            Lightly Active (1-3 hari/minggu)
                                        </option>
                                        <option value="moderate">
                                            Moderately Active (3-5 hari/minggu)
                                        </option>
                                        <option value="active">
                                            Active (Setiap hari)
                                        </option>
                                        <option value="very_active">
                                            Very Active (Setiap hari)
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Riwayat Medis */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1.5 h-5 bg-[#2d6a3e] rounded-full"></span>
                                <h3 className="font-bold text-[#1a3129]">
                                    Kondisi Medis & Pantangan
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4 italic">
                                *Pilih semua yang sesuai dengan kondisi Anda
                                saat ini.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {conditions.length === 0 ? (
                                    <div className="text-xs text-gray-500">
                                        {isLoading
                                            ? "Memuat daftar kondisi..."
                                            : "Belum ada data kondisi medis di database."}
                                    </div>
                                ) : (
                                    conditions.map((item) => (
                                        <label
                                            key={item.id}
                                            className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:bg-lime-50 transition-colors shadow-xs">
                                            <input
                                                type="checkbox"
                                                checked={selectedConditionIds.has(
                                                    item.id,
                                                )}
                                                onChange={() =>
                                                    toggleCondition(item.id)
                                                }
                                                disabled={isLoading || isSaving}
                                                className="w-4 h-4 accent-[#2d6a3e]"
                                            />
                                            <span className="text-sm text-[#1a3129] font-medium">
                                                {item.name}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {conditions.length > 0 ? (
                                <p className="mt-3 text-[11px] text-gray-500">
                                    Dipilih: {selectedCount}
                                </p>
                            ) : null}
                        </div>

                        {/* Section 3: Target Personalisasi */}
                        <div className="mb-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1.5 h-5 bg-[#2d6a3e] rounded-full"></span>
                                <h3 className="font-bold text-[#1a3129]">
                                    Target Personalisasi
                                </h3>
                            </div>

                            <div className="p-4 rounded-xl bg-lime-50 border border-lime-100 mb-4">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                    Rekomendasi Otomatis (berdasarkan kondisi
                                    medis)
                                </div>
                                {recommendedTargets.length === 0 ? (
                                    <div className="text-xs text-gray-500">
                                        Belum ada rekomendasi khusus. Pilih
                                        kondisi medis untuk melihat nutrisi yang
                                        perlu dijaga.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recommendedTargets.map((t) => (
                                            <div
                                                key={t.nutrientId}
                                                className="flex items-center justify-between gap-3 bg-white/70 border border-white rounded-lg px-3 py-2">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-[#1a3129] truncate">
                                                        {t.nutrientName ??
                                                            "Nutrisi"}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 truncate">
                                                        Alasan:{" "}
                                                        {t.reasons.join(", ")}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-sm font-bold text-[#1a3129]">
                                                        {t.recommendedLimit ===
                                                        null
                                                            ? "-"
                                                            : `Maks. ${t.recommendedLimit}${t.unit ?? ""}`}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        (bisa diubah)
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Target Kalori Harian (kcal)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 2000"
                                        value={dailyCaloriesTarget}
                                        onChange={(e) =>
                                            setDailyCaloriesTarget(
                                                e.target.value,
                                            )
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Batas Gula Harian (g)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 50"
                                        value={dailySugarLimit}
                                        onChange={(e) =>
                                            setDailySugarLimit(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Batas Natrium Harian (mg)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 2300"
                                        value={dailySodiumLimit}
                                        onChange={(e) =>
                                            setDailySodiumLimit(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Batas Lemak Harian (g)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Contoh: 65"
                                        value={dailyFatLimit}
                                        onChange={(e) =>
                                            setDailyFatLimit(e.target.value)
                                        }
                                        disabled={isLoading || isSaving}
                                        className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                    />
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-bold text-gray-500 uppercase">
                                        Target Kustom (opsional)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addCustomTarget}
                                        disabled={
                                            isLoading ||
                                            isSaving ||
                                            nutrients.length === 0
                                        }
                                        className="px-3 py-1.5 bg-white border border-lime-200 text-[#2d6a3e] rounded-lg text-xs font-semibold hover:bg-lime-50 transition-colors shadow-xs">
                                        + Tambah Target
                                    </button>
                                </div>

                                {nutrients.length === 0 ? (
                                    <div className="text-xs text-gray-500">
                                        {isLoading
                                            ? "Memuat daftar nutrisi..."
                                            : "Daftar nutrisi belum tersedia."}
                                    </div>
                                ) : customTargets.length === 0 ? (
                                    <div className="text-xs text-gray-500">
                                        Tidak ada target kustom.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {customTargets.map((t, idx) => (
                                            <div
                                                key={`${t.nutrientId}-${idx}`}
                                                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-center p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
                                                <select
                                                    value={t.nutrientId}
                                                    onChange={(e) =>
                                                        updateCustomTarget(
                                                            idx,
                                                            {
                                                                nutrientId:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    disabled={
                                                        isLoading || isSaving
                                                    }
                                                    className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]">
                                                    <option value="">
                                                        Pilih Nutrisi
                                                    </option>
                                                    {nutrients.map((n) => (
                                                        <option
                                                            key={n.id}
                                                            value={String(
                                                                n.id,
                                                            )}>
                                                            {n.name}
                                                            {n.unit
                                                                ? ` (${n.unit})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Batas harian"
                                                    value={t.dailyLimit}
                                                    onChange={(e) =>
                                                        updateCustomTarget(
                                                            idx,
                                                            {
                                                                dailyLimit:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    disabled={
                                                        isLoading || isSaving
                                                    }
                                                    className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeCustomTarget(idx)
                                                    }
                                                    disabled={
                                                        isLoading || isSaving
                                                    }
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isSaving}
                            className="px-8 py-2.5 bg-[#2d6a3e] text-white rounded-xl text-sm font-bold hover:bg-[#1a3129] transition-all shadow-lg shadow-green-900/20">
                            {isSaving ? "Menyimpan..." : "Simpan Profil"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
