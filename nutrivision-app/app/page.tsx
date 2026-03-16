import Image from "next/image";
import Footer from "@/components/Footer";
import {Camera, Sparkles, Apple, Cloud, FileText, ArrowUpFromLine } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <main id="beranda" className="mx-auto grid w-full max-w-7xl items-center px-4 sm:px-6 md:px-8 grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 py-8 sm:py-10 md:py-14">
                <section className="max-w-xl text-left">
                    <p className="inline-block border-b-3 border-[#cbea7b] pb-2 font-bold text-foreground text-lg sm:text-2xl">
                        Wujudkan Hidup Lebih Sehat dengan
                    </p>
                    <h1 className="mt-3 sm:mt-4 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-[#1a3129]">
                        Analisis Gizi
                        <br />
                        Cerdas bersama
                        <br />
                        <span className="font-extrabold">NutriVision</span>
                        
                    </h1>
                    <p className="mt-4 sm:mt-6 text-foreground opacity-80 text-base sm:text-lg md:text-xl leading-6 sm:leading-7 md:leading-8">
                        Pahami kualitas gizi tanpa ribet dengan NutriVision!
                        Cukup foto tabel Nutrition Facts, kami akan langsung
                        ekstrak info penting dan hitung NutriScore secara
                        otomatis. Nggak perlu pusing baca label yang rumit dan
                        dalam hitungan detik, kamu sudah dapat insight yang
                        jelas, cepat, dan akurat untuk bantu pilih makanan yang
                        lebih sehat setiap hari.
                    </p>

                    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:mt-8">
                        <button
                            type="button"
                            className="rounded-md bg-[#cbea7b] px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base md:text-lg font-semibold text-black hover:bg-[#b8d96a] w-full sm:w-auto">
                            Mulai Scan
                        </button>
                        <button
                            type="button"
                            className="rounded-md border border-black/15 bg-transparent px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base md:text-lg font-semibold text-foreground hover:bg-black/5 w-full sm:w-auto">
                            Log In
                        </button>
                    </div>
                </section>

                <section className="flex items-center justify-center">
                    <Image
                        src="/images/hero/pngwing 2.png"
                        alt="Hero image"
                        width={900}
                        height={900}
                        priority
                        className="h-auto w-full max-w-140"
                    />
                </section>
            </main>
            <div id="tentang" className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16 lg:py-20 text-[#1a3129] flex flex-col items-center gap-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Tentang <span className="font-extrabold">NutriVision</span></h1>
                <p className="text-center text-sm sm:text-base md:text-lg lg:text-xl leading-6 sm:leading-7 md:leading-8 text-[#262626]\">
                    NutriVision adalah platform analisis gizi berbasis AI yang
                    membantu kamu memahami kualitas nutrisi produk dengan lebih
                    mudah dan cepat. Dengan teknologi pemrosesan gambar yang
                    cerdas, NutriVision mampu membaca tabel Nutrition Facts
                    langsung dari foto, mengekstrak informasi penting, dan
                    menghitung NutriScore secara otomatis.
                </p>
            </div>

            {/* Cara Kerja Section */}
            <div className="mx-auto w-full max-w-7xl px-8 py-10 text-[#1a3129] flex flex-col items-center gap-16">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Cara Kerja</h2>
                    <p className="inline-block border-b-3 border-[#cbea7b] pb-2 text-base sm:text-lg md:text-xl text-center text-[#262626]">Cuma 3 langkah simpel untuk tahu kualitas gizi produkmu.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
                    {/* Step 1 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                                <Camera className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></Camera>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">Ambil Foto Nutrition Facts</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Cukup foto atau upload tabel Nutrition Facts dari produk yang ingin kamu analisis. Tidak perlu input data secara manual.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></Sparkles>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">AI Membaca & Mengekstrak Data</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Teknologi AI NutriVision akan membaca label gizi dan mengekstrak informasi kalori dan nutrisi lainnya secara otomatis.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                                <Apple className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></Apple>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">Dapatkan Nutri-Score Instan</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Sistem akan menampilkan ringkasan nutrisi dan Nutri-Score agar kamu dapat menilai kualitas gizi produk dengan lebih mudah.
                        </p>
                    </div>
                </div>
            </div>

            {/* Fitur Utama Section */}
            <div className="mx-auto w-full max-w-7xl px-8 py-20 text-[#1a3129] flex flex-col items-center gap-16">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Fitur Utama</h2>
                    <p className="inline-block border-b-3 border-[#cbea7b] pb-2 text-base sm:text-lg md:text-xl text-center text-[#262626]">Kenapa Pilih NutriVision?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
                    {/* Feature 1 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                               <Sparkles className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></Sparkles>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">AI Nutrition Extraction</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Cukup upload foto tabel Nutrition Facts, AI NutriVision akan membaca, mengekstrak, dan menganalisis data nutrisi secara otomatis dalam hitungan detik.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                                <FileText className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></FileText>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">Insight Nutrisi Jelas</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Tampilan Nutri-Score dan ringkasan nutrisi yang mudah dipahami agar kamu dapat menilai kualitas gizi produk dengan cepat tanpa membaca label yang rumit.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-6 md:p-8 lg:p-10 bg-lime-50 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-lime-100 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-[#cbea7b] rounded-md flex-shrink-0">
                                <Cloud className="w-6 h-6 text-[#1a3129]" viewBox="0 0 24 24"></Cloud>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-800">Cloud Processing</h3>
                        </div>
                        <p className="text-sm md:text-base leading-6 text-zinc-800 flex-1">
                            Seluruh proses analisis NutriVision menggunakan teknologi AI dan cloud processing sehingga hasil tercepat dan akurat.
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative  bg-[#EDFFDE] w-full h-200 max-w-screen py-[20px] text-[#1a3129] flex flex-col items-center justify-center gap-16 z-0">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="inline-block border-b-3 border-[#cbea7b] text-6xl sm:mt-4 text-4xl sm:text-5xl md:text-6xl font-bold">Mulai Scan Sekarang!</h2>
                    <p className=" pb-2 text-base sm:text-lg md:text-xl text-center text-[#262626]">Unggah label Nutrition Facts dan mulai analisis gizi dalam hitungan detik</p>
                </div>
                <div className="relative flex items-center justify-center px-4">
                    <div className="p-6 bg-[#FAFDF2] w-full max-w-[713px] h-[365px] rounded-[32px] shadow-sm flex items-center justify-center">
                        <div className="flex items-center justify-center bg-[#FAFDF2] rounded-[16px] border-2 border-dotted border-[#1A3129] w-[661px] h-[325px] rounded-16 flex-shrink-0">
                            <div className=" grid grid-rows-3 justify-items-center items-center gap-y-[10px]">
                                <ArrowUpFromLine className="w-[40px] h-[48px] text-[#1a3129]"></ArrowUpFromLine>
                                <h1 className=" text-[32px] text-bold text-[#1a3129]">Scan Table Nutrition Facts</h1>
                                <button type="button"
                                className="rounded-md bg-[#cbea7b] px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base md:text-lg font-semibold text-black hover:bg-[#b8d96a] w-full sm:w-auto">
                                Scan & Analisis!
                                </button>
                            </div>
                        </div>   
                    </div>
                </div>
                <Image
                src="/images/hero/pngwing 8.png"
                alt="Salad"
                width={583}
                height={580}
                priority
                className="absolute bottom-0 left-0 h-auto w-full max-w-140 z-[-1]"
                />
            </div>
            <Footer />
        </div>

    );
}
