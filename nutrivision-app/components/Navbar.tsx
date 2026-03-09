export default function Navbar() {
    return(
        <nav className="flex w-full justify-between bg-[#1a3129] py-4 px-24 shadow-md  text-white">
            <h1 className="text-2xl font-bold">NutriVision</h1>
            <div className="flex items-center gap-6">
                <a href="#" className="text-sm font-medium hover:text-gray-300">
                    Home
                </a>
                <a href="#" className="text-sm font-medium hover:text-gray-300">
                    About
                </a>
                <a href="#" className="text-sm font-medium hover:text-gray-300">
                    Scan
                </a>
            </div>
        </nav>
    );
}