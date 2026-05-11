"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Camera } from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";

interface Scan {
    id: number;
    product_id: number;
    product_name: string;
    product_brand: string | null;
    image_path: string | null;
    nutrition_score: number;
    scanned_at: string;
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

export default function ScanHistory() {
    const router = useRouter();
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] =
        useState<ProductDetail | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchScanHistory = useCallback(async () => {
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
                    "Failed to fetch scan history";
                throw new Error(`(${response.status}) ${msg}`);
            }

            const data = await response.json();
            setScans(data.scans || []);
        } catch (err) {
            console.error("Error fetching scan history:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchScanHistory();
    }, [fetchScanHistory]);

    const fetchProductDetail = async (scan: Scan) => {
        try {
            setModalLoading(true);
            setModalError(null);

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

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 text-[#2d6a3e] hover:text-[#1a3129] font-semibold flex items-center gap-2">
                            ← Kembali
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1a3129]">
                            Riwayat Scan
                        </h1>
                        <p className="text-[#1a3129] opacity-60 mt-2">
                            Lihat semua produk yang pernah kamu scan
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-[#1a3129] opacity-60">
                            Loading riwayat scan...
                        </div>
                    ) : scans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {scans.map((scan, idx) => {
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

                                const scoreColor =
                                    scan.nutrition_score >= 80
                                        ? "bg-green-600"
                                        : scan.nutrition_score >= 60
                                          ? "bg-green-500"
                                          : scan.nutrition_score >= 40
                                            ? "bg-yellow-500"
                                            : scan.nutrition_score >= 20
                                              ? "bg-orange-500"
                                              : "bg-red-500";

                                const scoreLetter =
                                    scan.nutrition_score >= 80
                                        ? "A"
                                        : scan.nutrition_score >= 60
                                          ? "B"
                                          : scan.nutrition_score >= 40
                                            ? "C"
                                            : scan.nutrition_score >= 20
                                              ? "D"
                                              : "E";

                                return (
                                    <div
                                        key={scan.id}
                                        onClick={() => fetchProductDetail(scan)}
                                        className="p-6 bg-white rounded-[10px] border border-lime-200 shadow-sm hover:shadow-md hover:border-lime-300 transition-all cursor-pointer flex flex-col gap-4">
                                        <div
                                            className={`w-20 h-20 bg-linear-to-br ${gradients} rounded-lg flex items-center justify-center text-4xl`}>
                                            {scan.image_path ? (
                                                <div className="relative w-full h-full overflow-hidden rounded-lg">
                                                    <Image
                                                        src={scan.image_path}
                                                        alt={scan.product_name}
                                                        fill
                                                        sizes="80px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                emoji
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#1a3129] text-lg truncate">
                                                {scan.product_name}
                                            </h3>
                                            {scan.product_brand && (
                                                <p className="text-sm text-[#1a3129] opacity-60 truncate">
                                                    {scan.product_brand}
                                                </p>
                                            )}
                                            <p className="text-xs text-[#1a3129] opacity-50 mt-2">
                                                {new Date(
                                                    scan.scanned_at,
                                                ).toLocaleDateString("id-ID", {
                                                    weekday: "short",
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${scoreColor}`}
                                                        style={{
                                                            width: `${Math.min(100, scan.nutrition_score)}%`,
                                                        }}></div>
                                                </div>
                                            </div>
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${scoreColor}`}>
                                                {scoreLetter}
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-[#1a3129] opacity-70">
                                                Score:{" "}
                                                <span className="font-bold">
                                                    {Math.round(
                                                        scan.nutrition_score,
                                                    )}
                                                    /100
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Camera
                                size={48}
                                className="mx-auto text-gray-300 mb-4"
                            />
                            <p className="text-[#1a3129] opacity-60 text-lg">
                                Belum ada riwayat scan
                            </p>
                            <button
                                onClick={() => router.push("/scan")}
                                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                Mulai Scan Produk
                            </button>
                        </div>
                    )}
                </div>
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
                                                    Skor kualitas nutrisi produk
                                                    ini
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-2xl font-bold text-[#1a3129]">
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
                                                    {[0, 1, 2, 3, 4].map(
                                                        (i) => (
                                                            <div
                                                                key={i}
                                                                className={`flex-1 h-2 rounded-full ${
                                                                    selectedProduct.nutrition_score >=
                                                                    (i + 1) * 20
                                                                        ? i < 2
                                                                            ? "bg-green-500"
                                                                            : i ===
                                                                                2
                                                                              ? "bg-yellow-500"
                                                                              : "bg-orange-500"
                                                                        : "bg-gray-200"
                                                                }`}></div>
                                                        ),
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
                                        </div>
                                    </div>

                                    {/* Nutrients Section */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1a3129] mb-4">
                                            Informasi Nutrisi
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
                                                                <span className="font-semibold text-[#1a3129]">
                                                                    {
                                                                        nutrient.nutrient_name
                                                                    }
                                                                </span>
                                                                <span className="text-sm text-[#1a3129] opacity-70">
                                                                    {
                                                                        nutrient.amount
                                                                    }
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
                                                    Tidak ada data nutrisi
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
