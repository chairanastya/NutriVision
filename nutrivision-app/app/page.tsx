import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <main className="mx-auto grid w-full max-w-7xl items-center  px-8  grid-cols-2 gap-10 py-14">
                <section className="max-w-xl text-left">
                    <p className="inline-block border-b-3 border-[#cbea7b] pb-2 font-bold text-foreground text-2xl">
                        Wujudkan Hidup Lebih Sehat dengan
                    </p>
                    <h1 className="mt-4 text-6xl font-bold leading-tight text-[#1a3129]">
                        Analisis Gizi
                        <br />
                        Cerdas bersama
                        <br />
                        <span className="font-extrabold">NutriVision</span>
                        
                    </h1>
                    <p className="mt-6 text-foreground opacity-80 text-xl leading-8">
                        Pahami kualitas gizi tanpa ribet dengan NutriVision!
                        Cukup foto tabel Nutrition Facts, kami akan langsung
                        ekstrak info penting dan hitung NutriScore secara
                        otomatis. Nggak perlu pusing baca label yang rumit dan
                        dalam hitungan detik, kamu sudah dapat insight yang
                        jelas, cepat, dan akurat untuk bantu pilih makanan yang
                        lebih sehat setiap hari.
                    </p>

                    <div className="mt-6 flex items-center gap-3 md:mt-8">
                        <button
                            type="button"
                            className="rounded-md bg-[#cbea7b] px-5 py-2 text-lg font-semibold text-black hover:bg-[#b8d96a]">
                            Mulai Scan
                        </button>
                        <button
                            type="button"
                            className="rounded-md border border-black/15 bg-transparent px-5 py-2 text-lg font-semibold text-foreground hover:bg-black/5">
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
            <div className="mx-auto w-full max-w-6xl px-8 py-14 text-[#1a3129] flex flex-col items-center gap-8">
                <h1 className="text-5xl font-bold">Tentang <span className="font-extrabold">NutriVision</span></h1>
                <p className="text-center text-xl leading-8">
                    NutriVision adalah platform analisis gizi berbasis AI yang
                    membantu kamu memahami kualitas nutrisi produk dengan lebih
                    mudah dan cepat. Dengan teknologi pemrosesan gambar yang
                    cerdas, NutriVision mampu membaca tabel Nutrition Facts
                    langsung dari foto, mengekstrak informasi penting, dan
                    menghitung NutriScore secara otomatis.
                </p>
            </div>
        </div>
    );
}
