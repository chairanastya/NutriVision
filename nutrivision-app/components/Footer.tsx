export default function Footer() {
    const teamMembers = [
        {
            name: "Chaira Nastya Warestri",
            id: "23/514942/TK/56550",
        },
        {
            name: "Faiz Arsyi Pragata",
            id: "23/518958/TK/57199",
        },
        {
            name: "Grace Anne Marcheline",
            id: "23/522362/TK/57654",
        },
    ];

    return (
        <footer className="w-full bg-[#1a3129] border-t border-lime-100">
            {/* Footer Content */}
            <div className="mx-auto w-full max-w-7xl px-8 py-12 flex flex-col gap-8">
                {/* Logo */}
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white ">
                        NutriVision
                    </h2>
                </div>

                {/* Navigation Links */}
                <div className="flex justify-center items-center gap-4 md:gap-20 pb-6 border-b border-lime-300 overflow-x-auto">
                    <a
                        href="#beranda"
                        className="text-white text-sm md:text-lg font-regular hover:text-lime-300 transition whitespace-nowrap">
                        Beranda
                    </a>
                    <a
                        href="#tentang"
                        className="text-stone-50 text-sm md:text-lg font-regular hover:text-lime-300 transition whitespace-nowrap">
                        Tentang
                    </a>
                    <a
                        href="#scan"
                        className="text-stone-50 text-sm md:text-lg font-regular hover:text-lime-300 transition whitespace-nowrap">
                        Scan
                    </a>
                    <a
                        href="#"
                        className="text-stone-50 text-sm md:text-lg font-regular hover:text-lime-300 transition whitespace-nowrap">
                        Log In
                    </a>
                </div>

                {/* Team Members Section */}
                <div className="w-full bg-[#234338] rounded-lg outline-1 outline-[#2C5446] px-3 md:px-4 py-3.5 flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 md:gap-4 overflow-x-auto">
                    <div className="flex flex-row justify-center md:justify-start items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2 md:p-3 rounded  outline-1 outline-[#2C5446] shrink-0">
                                <div className="shrink-0 w-4 h-4 md:w-5 md:h-5 bg-lime-300 rounded"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-xs md:text-sm font-medium leading-4 md:leading-5 truncate">
                                        {member.name}
                                    </div>
                                    <div className="text-zinc-300 text-xs leading-3 md:leading-4 truncate">
                                        {member.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-zinc-100 text-xs md:text-sm font-normal whitespace-nowrap shrink-0">
                        @ 2026 NutriVision
                    </div>
                </div>
            </div>
        </footer>
    );
}
