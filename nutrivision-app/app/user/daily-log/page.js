import Image from "next/image";
import Footer from "@/components/Footer";
import {Camera, Sparkles, Apple, Cloud, FileText, ArrowUpFromLine } from "lucide-react";

//untuk circular progress bar/ring chart
const CircularProgress = ({ value }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference; }

//p-4 md:p-6 bg-[#FAFDF2] 
export default function FoodLog() {
    return (
        <div className="min-h-screen pt-8 bg-[background] font-sans">
            <main id="foodlog" className="mx-auto bg-[#E5F5BD] rounded-md grid w-full max-w-7xl items-center px-4 sm:px-4 md:px-8 grid-cols-1 gap-6 md:gap-10 py-8 sm:py-10 md:py-14">
                <section className="flex flex-row justify-between max-w-full text-left allign-middle">
                    <div className="inline-block pb-2 font-bold text-lg sm:text-2xl">
                        Halo, <span className="font-extrabold underline decoration-[#cbea7b] decoration-3">User!</span>
                        <p className="mt-1 opacity-80 text sm:text-lg md:text-xl leading-8 sm:leading-7 md:leading-8 drop-shadow-md">
                        Yuk, catat asupanmu hari ini dengan NutriVision! 
                        </p>
                    </div>
                    <div className= "items-center justify-center">
                        <button type="button"
                            className="mt-2 rounded-lg bg-[#cbea7b] px-5 py-2 sm:text-lg md:text-lg  font-bold text-black hover:bg-[#b8d96a] transition-all">
                            Hari Ini, 5 Mei 2026
                        </button>
                    </div>   
                </section>
            </main>

            <div className="text-[#1a3129] px-4 sm:px-6 md:px-1 py-8 mx-auto w-full max-w-7xl">
 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[4fr_5fr_3fr] gap-4 md:gap-6">
        
                {/* Nutrient Tracker*/}
                <div
                className="p-6 md:p-8 bg-lime-50 rounded-[10px]
                            outline outline-1 outline-offset-[-1px] outline-lime-100
                            flex flex-col items-center gap-6"
                >
                {/* Donut Chart */}
                <div className="relative w-40 h-40 flex-shrink-0 mx-auto">
                    <svg
                    className="rotate-[135deg] w-full h-full"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    <circle
                        cx="18" cy="18" r="16" fill="none"
                        className="stroke-current text-gray-200"
                        strokeWidth="1.5" strokeDasharray="75 100" strokeLinecap="round"
                    />
                    <circle
                        cx="18" cy="18" r="16" fill="none"
                        className="stroke-current text-[#cbea7b]"
                        strokeWidth="1.5" strokeDasharray="37.5 100" strokeLinecap="round"
                    />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-[#1a3129]">389</span>
                    <span className="text-xl font-bold opacity-75 text-[#1a3129]">kkal</span>
                    <span className="text-xs opacity-50 block leading-tight mt-0.5">
                        50% dari kebutuhan harian
                    </span>
                    </div>

                </div>
        
                {/* Nutrition items — self-start + w-full agar mepet kiri */}
                <div className="w-full self-start flex flex-col gap-3">
                    <NutriItem icon={<Apple className="w-4 h-4 text-[#1a3129]" />} label="Protein" />
                    <NutriItem icon={<Apple className="w-4 h-4 text-[#1a3129]" />} label="Karbohidrat" />
                    <NutriItem icon={<Apple className="w-4 h-4 text-[#1a3129]" />} label="Lemak" />
                </div>
                </div>
        
                {/* Log Makanan */}
                <div
                className="p-6 md:p-8 bg-lime-50 rounded-[10px]
                            outline outline-1 outline-offset-[-1px] outline-lime-100
                            flex flex-col items-center gap-6"
                >
                </div>
        
                {/* ─── Card 3 — kanan (4fr) ───
                    md: col-span-2 → full-width di baris ke-2
                    lg: col-span-1 → kembali jadi kolom ke-3               */}
                <div
                className="md:col-span-2 lg:col-span-1 lg:col-row-[2fr_2fr]
                            p-6 md:p-8 bg-lime-50 rounded-[10px]
                            outline outline-1 outline-offset-[-1px] outline-lime-100
                            flex flex-col items-center gap-6"
                >
                </div>
    

        
            </div>
            </div>
        </div>
        );
    
    function NutriItem({ icon, label }) {
    return (
    <div className="flex items-center gap-2">
      <div className="p-2 bg-[#cbea7b] rounded-md flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-base md:text-lg font-semibold text-neutral-800">{label}</h3>
    </div>


    );
    }
}
