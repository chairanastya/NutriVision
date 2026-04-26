"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";

interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    created_at?: string;
}

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    throw new Error(`Failed to check session: ${res.status}`);
                }

                const data = (await res.json()) as
                    | { isLoggedIn: true; user: User }
                    | { isLoggedIn: false };

                if (cancelled) return;
                setUser(data.isLoggedIn ? data.user : null);
            } catch (err) {
                console.error("Failed to load session user:", err);
                if (cancelled) return;
                setUser(null);
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
                <div className="mx-auto w-full max-w-7xl">
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
                                    {loading ? "User" : user?.name || "User"}!
                                    👋
                                </h1>
                                <p className="text-xs opacity-80 mt-1">
                                    Pantau gizi & asupan kalorimu hari ini
                                </p>
                            </div>

                            {/* Column 2: Stats */}
                            <div className="flex gap-4 text-white shrink-0">
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold">
                                        389
                                    </div>
                                    <div className="text-xs opacity-80">
                                        kkal/kcal
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold">
                                        3
                                    </div>
                                    <div className="text-xs opacity-80">
                                        item makanan
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold">
                                        750
                                    </div>
                                    <div className="text-xs opacity-80">
                                        ml air minum
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Nutri-Score */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-xs font-semibold text-white opacity-90">
                                    NUTRI-SCORE RATA-RATA
                                </span>
                                <div className="flex gap-2">
                                    {["A", "B", "C", "D", "E"].map(
                                        (score, idx) => (
                                            <div
                                                key={score}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                    idx === 0
                                                        ? "bg-green-600"
                                                        : idx === 1
                                                          ? "bg-green-500"
                                                          : idx === 2
                                                            ? "bg-yellow-500"
                                                            : idx === 3
                                                              ? "bg-orange-500"
                                                              : "bg-red-500"
                                                }`}>
                                                {score}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[4fr_5fr_3fr] gap-4 md:gap-6">
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
                                    1.611 kcal tersisa
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
                                            strokeDasharray="58.3 100"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <div className="text-2xl font-bold text-[#1a3129]">
                                            389
                                        </div>
                                        <div className="text-xs text-[#1a3129] opacity-70">
                                            kkal
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[#1a3129] opacity-70 text-center">
                                39% dari target
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
                                                26/80g
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-orange-500 h-1.5 rounded-full"
                                                style={{
                                                    width: "32.5%",
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
                                                43/250g
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full"
                                                style={{
                                                    width: "17.2%",
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
                                                11/55g
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-red-500 h-1.5 rounded-full"
                                                style={{ width: "20%" }}></div>
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
                                                9/25g
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-green-500 h-1.5 rounded-full"
                                                style={{ width: "36%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Food Log */}
                        <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                    <h3 className="font-semibold text-[#1a3129]">
                                        Log Makanan
                                    </h3>
                                </div>
                                <span className="text-xs text-[#1a3129] opacity-70">
                                    3 item hari ini
                                </span>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button className="px-4 py-2 bg-[#cbea7b] text-black rounded-full text-sm font-semibold whitespace-nowrap hover:bg-[#b8d96a] transition-colors">
                                    Sarapan
                                </button>
                                <button className="px-4 py-2 bg-[#EDFFDE] text-[#1a3129] rounded-full text-sm font-medium border border-lime-200 whitespace-nowrap hover:bg-lime-100 transition-colors">
                                    Makan Siang
                                </button>
                                <button className="px-4 py-2 bg-[#EDFFDE] text-[#1a3129] rounded-full text-sm font-medium border border-lime-200 whitespace-nowrap hover:bg-lime-100 transition-colors">
                                    Makan Malam
                                </button>
                                <button className="px-4 py-2 bg-[#EDFFDE] text-[#1a3129] rounded-full text-sm font-medium border border-lime-200 whitespace-nowrap hover:bg-lime-100 transition-colors">
                                    Camilan
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-[#EDFFDE] rounded-lg border border-lime-100">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 text-lg">
                                        🥣
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1a3129]">
                                            Granola Renyah
                                        </p>
                                        <p className="text-xs text-[#1a3129] opacity-60">
                                            180 kkal • Nutri-Score B
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[#1a3129] font-bold text-sm">
                                            180
                                        </span>
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded">
                                            B
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 font-bold">
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-[#EDFFDE] rounded-lg border border-lime-100">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0 text-lg">
                                        🥛
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1a3129]">
                                            Susu Rendah Lemak
                                        </p>
                                        <p className="text-xs text-[#1a3129] opacity-60">
                                            120 kkal • Nutri-Score A
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[#1a3129] font-bold text-sm">
                                            120
                                        </span>
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded">
                                            A
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 font-bold">
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-[#EDFFDE] rounded-lg border border-lime-100">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0 text-lg">
                                        🍌
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1a3129]">
                                            Pisang
                                        </p>
                                        <p className="text-xs text-[#1a3129] opacity-60">
                                            89 kkal • Nutri-Score A
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[#1a3129] font-bold text-sm">
                                            89
                                        </span>
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded">
                                            A
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 font-bold">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-300 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-[#1a3129] opacity-70">
                                        Total Sarapan
                                    </span>
                                    <span className="text-lg font-bold text-[#1a3129]">
                                        389 kkal
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Nasi goreng",
                                    "Roti + telur",
                                    "Oatmeal",
                                    "Granola",
                                    "Pisang",
                                ].map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-[#EDFFDE] text-[#1a3129] text-opacity-70 rounded-full text-xs border border-lime-200 hover:bg-lime-100 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama makanan atau mi"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#1a3129] placeholder-gray-400 focus:outline-none focus:border-[#cbea7b]"
                                />
                                <input
                                    type="text"
                                    placeholder="kcal"
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#1a3129] placeholder-gray-400 focus:outline-none focus:border-[#cbea7b]"
                                />
                                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#1a3129] focus:outline-none focus:border-[#cbea7b] bg-[#EDFFDE]">
                                    <option>A</option>
                                    <option>B</option>
                                    <option>C</option>
                                    <option>D</option>
                                    <option>E</option>
                                </select>
                                <button className="px-4 py-2 bg-[#cbea7b] text-black rounded-lg font-semibold text-sm hover:bg-[#b8d96a] transition-colors whitespace-nowrap">
                                    + Tambah
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Hidrasi, Energi & Mood, Aktivitas */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Hydration */}
                            <div className="p-6 md:p-8 bg-lime-50 rounded-[10px]  outline-1 -outline-offset-1 outline-lime-100 flex flex-col items-center gap-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        <h3 className="font-semibold text-[#1a3129]">
                                            Hidrasi
                                        </h3>
                                    </div>
                                    <span className="text-xs text-[#1a3129] opacity-70">
                                        Target 2.000 ml
                                    </span>
                                </div>

                                <p className="text-sm text-[#1a3129] opacity-70 mb-3">
                                    3 gelas
                                </p>
                                <p className="text-xs text-[#1a3129] opacity-60 mb-3">
                                    750 ml tercatat
                                </p>

                                <div className="flex gap-2 justify-center mb-4">
                                    {[...Array(10)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-6 h-10 rounded-md ${i < 3 ? "bg-blue-400" : "bg-gray-200"}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-[#1a3129] opacity-60 text-center">
                                    5 gelas lagi untuk mencapai target 🌊
                                </p>
                            </div>

                            {/* Energy & Mood */}
                            <div className="p-6 md:p-8 bg-lime-50 rounded-[10px]  outline-1 -outline-offset-1 outline-lime-100 flex flex-col items-center gap-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                    <h3 className="font-semibold text-[#1a3129]">
                                        Energi & Mood
                                    </h3>
                                </div>

                                <p className="text-sm text-[#1a3129] opacity-70 mb-4">
                                    Bagaimana perasaanmu saat ini?
                                </p>

                                <div className="grid grid-cols-4 gap-2">
                                    <button className="py-3 px-2 bg-[#EDFFDE] rounded-lg hover:bg-lime-100 transition-colors text-center border border-lime-200">
                                        <div className="text-2xl mb-1">😴</div>
                                        <p className="text-xs text-[#1a3129]">
                                            Lelah
                                        </p>
                                    </button>
                                    <button className="py-3 px-2 bg-[#EDFFDE] rounded-lg hover:bg-lime-100 transition-colors text-center border border-lime-200">
                                        <div className="text-2xl mb-1">😐</div>
                                        <p className="text-xs text-[#1a3129]">
                                            Biasa
                                        </p>
                                    </button>
                                    <button className="py-3 px-2 bg-[#cbea7b] rounded-lg hover:bg-[#b8d96a] transition-colors text-center border border-[#cbea7b]">
                                        <div className="text-2xl mb-1">😊</div>
                                        <p className="text-xs text-black font-semibold">
                                            Baik
                                        </p>
                                    </button>
                                    <button className="py-3 px-2 bg-[#EDFFDE] rounded-lg hover:bg-lime-100 transition-colors text-center border border-lime-200">
                                        <div className="text-2xl mb-1">🔥</div>
                                        <p className="text-xs text-[#1a3129]">
                                            Semangat
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Activity & Calorie Burn */}
                            <div className="p-6 md:p-8 bg-lime-50 rounded-[10px] outline-1 -outline-offset-1 outline-lime-100 flex flex-col items-center gap-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <h3 className="font-semibold text-[#1a3129]">
                                        Aktivitas & Kalori Bakar
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                                        <div className="text-2xl font-bold text-red-600">
                                            320
                                        </div>
                                        <p className="text-xs text-[#1a3129] opacity-70">
                                            kkal terbakar
                                        </p>
                                    </div>
                                    <div className="bg-lime-50 rounded-lg p-3 text-center border border-lime-100">
                                        <div className="text-2xl font-bold text-green-600">
                                            69
                                        </div>
                                        <p className="text-xs text-[#1a3129] opacity-70">
                                            kkal bersih
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-lime-50 text-[#1a3129] rounded-full text-xs border border-lime-100">
                                        🚶 Jalan (150)
                                    </span>
                                    <span className="px-3 py-1 bg-lime-50 text-[#1a3129] rounded-full text-xs border border-lime-100">
                                        🏃 Lari (300)
                                    </span>
                                    <span className="px-3 py-1 bg-lime-50 text-[#1a3129] rounded-full text-xs border border-lime-100">
                                        🚴 Sepeda (200)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
