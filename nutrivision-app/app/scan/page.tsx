"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { ArrowUpFromLine, Zap, Loader2 } from "lucide-react";

interface Props {
    onAnalyze: (file: File, previewUrl: string) => void;
}

export default function NutritionScanner({ onAnalyze }: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFile(f: File) {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
    }

    function handleDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }

    function handleAnalyze() {
        if (!file || !previewUrl) return;
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            onAnalyze(file, previewUrl);
        }, 2200);
    }

    return (
        <div className="min-h-screen bg-[#edffde] font-sans relative overflow-hidden">
            {/* Loading Overlay */}
            {isAnalyzing && (
                <div className="fixed inset-0 bg-[#edffde]/80 backdrop-blur-md z-200 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
                    <Loader2 className="w-14 h-14 text-[#1a3129] animate-spin" />
                    <p className="text-xl font-bold text-[#1a3129]">
                        Menganalisis nutrisi...
                    </p>
                </div>
            )}

            <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 py-10 md:py-20 flex flex-col items-center gap-10 md:gap-16">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="inline-block border-b-3 border-[#cbea7b] pb-2 font-bold text-[#1a3129] text-lg sm:text-2xl">
                        Scan & Analisis Gizi
                    </p>
                    <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-[#1a3129]">
                        Upload Nutrition Facts
                        <br /> Kamu di Sini
                    </h1>
                    <p className="mt-4 max-w-md md:max-w-2xl text-base sm:text-lg md:text-xl text-[#262626] opacity-80 leading-relaxed">
                        Foto atau unggah tabel Nutrition Facts, lalu biarkan AI
                        kami membaca dan menghitung NutriScore secara otomatis.
                    </p>
                </div>

                {/* Drop Card Section */}
                <div
                    id="scan"
                    className="relative flex items-center justify-center w-full">
                    <div className="p-4 md:p-6 bg-[#FAFDF2] w-full max-w-3xl rounded-[24px] md:rounded-[32px] shadow-sm">
                        <div
                            className={`relative flex flex-col items-center justify-center border-2 border-dotted border-[#1A3129] w-full min-h-[350px] rounded-[16px] transition-all cursor-pointer ${
                                isDragging
                                    ? "bg-lime-100/50 border-[#3d8a5e]"
                                    : "hover:bg-black/5"
                            }`}
                            onClick={() => inputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}>
                            {previewUrl ? (
                                <div className="p-4 w-full h-full flex flex-col items-center">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-[300px] rounded-xl object-contain shadow-md"
                                        width={300}
                                        height={300}
                                    />
                                    <p className="mt-4 text-sm font-semibold text-[#1a3129]">
                                        Klik untuk ganti foto
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 md:gap-6 px-4 py-10">
                                    <div className="p-4 bg-[#cbea7b] rounded-2xl shadow-sm transform transition-transform group-hover:-translate-y-1">
                                        <ArrowUpFromLine className="w-8 md:w-10 h-8 md:h-10 text-[#1a3129]" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-xl md:text-2xl font-bold text-[#1a3129]">
                                            Drag & drop foto di sini
                                        </h2>
                                        <p className="mt-2 text-sm md:text-base text-[#262626] opacity-60">
                                            atau klik untuk memilih file dari
                                            perangkat kamu
                                            <br />
                                            PNG, JPG, WEBP · Maks. 10 MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-full bg-[#cbea7b] px-8 md:px-10 py-3 text-sm md:text-base font-bold text-black hover:bg-[#b8d96a] transition-all active:scale-95 shadow-md"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            inputRef.current?.click();
                                        }}>
                                        Pilih Foto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleChange}
                />

                {/* Analyze Button Section */}
                <div
                    className={`flex flex-col items-center gap-3 transition-all duration-300 ${
                        file
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4 pointer-events-none"
                    }`}>
                    <button
                        className="flex items-center gap-3 rounded-full bg-[#1a3129] px-10 py-4 text-lg md:text-xl font-bold text-[#cbea7b] hover:bg-[#2d5a45] transition-all shadow-xl active:scale-95"
                        onClick={handleAnalyze}>
                        <Zap className="w-6 h-6 fill-current" />
                        Analisis Sekarang
                    </button>
                    <span className="text-xs md:text-sm text-[#262626] opacity-50 font-medium">
                        Proses biasanya selesai dalam 2–5 detik
                    </span>
                </div>
            </main>

            {/* Decorative Image (Optional, matching home style) */}
            <Image
                src="/images/hero/pngwing 8.png"
                alt="Decorative background"
                width={400}
                height={400}
                className="absolute bottom-[-100px] left-[-100px] opacity-20 pointer-events-none z-0"
            />
        </div>
    );
}
