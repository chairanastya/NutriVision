"use client";

import { useState } from "react";

interface MedFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MedForm({ isOpen, onClose }: MedFormProps) {
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

                {/* Form Body */}
                <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
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
                                <select className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]">
                                    <option>Pilih Jenis Kelamin</option>
                                    <option>Laki-laki</option>
                                    <option>Perempuan</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    Tanggal Lahir
                                </label>
                                <input
                                    type="date"
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
                                    className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    Tingkat Aktivitas
                                </label>
                                <select className="w-full p-2.5 bg-lime-50 border border-lime-100 rounded-lg text-sm focus:outline-none focus:border-[#2d6a3e]">
                                    <option>Sedentary (Jarang Olahraga)</option>
                                    <option>
                                        Lightly Active (1-3 hari/minggu)
                                    </option>
                                    <option>
                                        Moderately Active (3-5 hari/minggu)
                                    </option>
                                    <option>Very Active (Setiap hari)</option>
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
                            *Pilih semua yang sesuai dengan kondisi Anda saat
                            ini.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                "Diabetes",
                                "Hipertensi",
                                "Kolesterol",
                                "Asam Urat",
                                "Alergi Kacang",
                                "Alergi Seafood",
                                "Intoleransi Laktosa",
                                "Gagal Ginjal",
                                "Maag/GERD",
                            ].map((item) => (
                                <label
                                    key={item}
                                    className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:bg-lime-50 transition-colors shadow-xs">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#2d6a3e]"
                                    />
                                    <span className="text-sm text-[#1a3129] font-medium">
                                        {item}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                        Batal
                    </button>
                    <button className="px-8 py-2.5 bg-[#2d6a3e] text-white rounded-xl text-sm font-bold hover:bg-[#1a3129] transition-all shadow-lg shadow-green-900/20">
                        Simpan Profil
                    </button>
                </div>
            </div>
        </div>
    );
}
