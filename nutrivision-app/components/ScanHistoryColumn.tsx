"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface Scan {
    id: number;
    product_id: number;
    product_name: string;
    product_brand: string | null;
    nutrition_score: number;
    scanned_at: string;
    category: string | null;
}

interface ScanHistoryColumnProps {
    scans: Scan[] | undefined;
    loading: boolean;
    onScanClick: (scan: Scan) => void;
}

export default function ScanHistoryColumn({
    scans,
    loading,
    onScanClick,
}: ScanHistoryColumnProps) {
    const router = useRouter();

    // Filter scans untuk 5 hari terakhir
    const filteredScans = useMemo(() => {
        if (!scans || scans.length === 0) return [];
        
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        fiveDaysAgo.setHours(0, 0, 0, 0);
        
        return scans.filter((scan) => {
            const scanDate = new Date(scan.scanned_at);
            scanDate.setHours(0, 0, 0, 0);
            return scanDate.getTime() >= fiveDaysAgo.getTime();
        });
    }, [scans]);

    return (
        <div className="p-8 md:p-10 bg-white rounded-2xl border-2 border-lime-200/60 shadow-md hover:shadow-lg transition-all md:col-span-2 lg:col-span-1 flex flex-col gap-6 max-w-lg">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-2 h-2 bg-[#cbea7b] rounded-full"></span>
                        <h3 className="font-bold text-[#1a3129] text-lg">
                            Riwayat Scan
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">
                        Ringkasan produk terbaru
                    </p>
                </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-[#1a3129] opacity-60">
                        Loading...
                    </div>
                ) : filteredScans && filteredScans.length > 0 ? (
                    filteredScans.map((scan) => (
                        <div
                            key={scan.id}
                            onClick={() => onScanClick(scan)}
                            className="flex gap-3 p-3 bg-white rounded-lg border border-lime-100 hover:shadow-md hover:bg-lime-50 transition-all cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#1a3129] text-sm truncate">
                                    {scan.product_name}
                                </h4>
                                {scan.product_brand && (
                                    <p className="text-xs text-gray-500 truncate">
                                        {scan.product_brand}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(
                                        scan.scanned_at,
                                    ).toLocaleDateString("id-ID", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center shrink-0">
                                <div className="text-sm font-bold text-[#1a3129]">
                                    {Math.round(scan.nutrition_score)}
                                </div>
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold text-center mt-1 ${
                                        scan.nutrition_score >= 80
                                            ? "bg-green-600"
                                            : scan.nutrition_score >= 60
                                              ? "bg-green-500"
                                              : scan.nutrition_score >= 40
                                                ? "bg-yellow-500"
                                                : scan.nutrition_score >= 20
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                    }`}>
                                    {scan.nutrition_score >= 80
                                        ? "A"
                                        : scan.nutrition_score >= 60
                                          ? "B"
                                          : scan.nutrition_score >= 40
                                            ? "C"
                                            : scan.nutrition_score >= 20
                                              ? "D"
                                              : "E"}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-[#1a3129] opacity-60">
                        Belum ada scan hari ini
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => router.push("/scan")} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    <Camera size={16} />
                    Scan Produk Baru
                </button>
                <button onClick={() => router.push("/scan-history")} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-[#cbea7b] text-[#2d6a3e] rounded-lg font-semibold hover:bg-lime-50 transition-colors">
                    Lihat Riwayat
                </button>
            </div>
        </div>
    );
}
