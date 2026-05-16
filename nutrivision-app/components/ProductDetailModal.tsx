"use client";

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

interface ProductDetailModalProps {
    selectedProduct: ProductDetail | null;
    modalLoading: boolean;
    modalError: string | null;
    onClose: () => void;
}

export default function ProductDetailModal({
    selectedProduct,
    modalLoading,
    modalError,
    onClose,
}: ProductDetailModalProps) {
    if (!selectedProduct) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/50">
                {/* Modal Header */}
                <div className="sticky top-0 z-20 bg-gradient-to-r from-[#2d6a3e] to-[#3d7d4a] px-8 py-6 flex items-center justify-between shrink-0 shadow-lg">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {selectedProduct.name}
                            {selectedProduct.brand &&
                                ` (${selectedProduct.brand})`}
                        </h2>
                        <p className="text-sm text-white/80 mt-1">
                            Scanned:{" "}
                            {new Date(
                                selectedProduct.scanned_at,
                            ).toLocaleDateString("id-ID", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white text-3xl font-light hover:opacity-60 transition-opacity">
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-gray-50">
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
                            <div className="bg-white rounded-xl p-8 border-2 border-lime-200/60 shadow-md hover:shadow-lg transition-shadow">
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
                                            📊 Kualitas Nutrisi (Skala 0-100)
                                        </p>
                                        <div className="flex gap-1">
                                            {[...Array(6)].map((_, i) => {
                                                const filledBars = Math.ceil(
                                                    (selectedProduct.nutrition_score /
                                                        100) *
                                                        6,
                                                );
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`h-3 rounded-full flex-1 transition-colors ${
                                                            i < filledBars
                                                                ? "bg-lime-400"
                                                                : "bg-gray-200"
                                                        }`}
                                                    />
                                                );
                                            })}
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
                                                Nutrisi Positif (Protein,
                                                Serat, dll)
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
                                                Nutrisi Negatif (Gula, Garam,
                                                Lemak)
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
                                            <span>Nilai Akhir Nutri-Score</span>
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
                            <div className="bg-white rounded-xl p-8 border-2 border-lime-200/60 shadow-md hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-bold text-[#1a3129] mb-6">
                                    📋 Informasi Nutrisi Lengkap
                                </h3>
                                <div className="space-y-3">
                                    {selectedProduct.nutrients &&
                                    selectedProduct.nutrients.length > 0 ? (
                                        selectedProduct.nutrients.map(
                                            (nutrient, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 bg-lime-50 rounded-lg border border-lime-200/60 hover:border-lime-300 hover:bg-lime-100/50 transition-all">
                                                    <span className="text-sm font-semibold text-[#1a3129]">
                                                        {nutrient.nutrient_name}
                                                    </span>
                                                    <span className="text-sm font-bold text-[#2d6a3e] bg-white px-3 py-1 rounded-full">
                                                        {Math.round(
                                                            nutrient.amount * 10,
                                                        ) / 10}{" "}
                                                        {nutrient.unit}
                                                    </span>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-sm text-[#1a3129] opacity-60 text-center py-8 bg-lime-50 rounded-lg">
                                            Data nutrisi tidak tersedia
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
