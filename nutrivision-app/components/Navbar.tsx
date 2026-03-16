'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [activeSection, setActiveSection] = useState('beranda');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['beranda', 'tentang'];
            let current = 'beranda';

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150) {
                        current = sectionId;
                    }
                }
            }

            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // If element doesn't exist on current page, navigate to home with anchor
            window.location.href = `/#${sectionId}`;
        }
        setIsMenuOpen(false);
    };

    return(
        <nav className={`sticky top-0 z-50 w-full py-2 ${isMenuOpen ? 'bg-[#1a3129]' : 'bg-[#1a3129]/90 backdrop-blur-md'} border-b border-lime-100/50`}>
            <div className="flex mx-auto w-full max-w-7xl px-8 justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-black text-white font-sans">NutriVision</h1>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-7">
                    {/* Menu Items */}
                    <div className="flex items-center gap-5">
                        <a 
                            href="#beranda" 
                            onClick={(e) => handleNavClick(e, 'beranda')}
                            className={`text-md font-regular font-sans transition ${
                                pathname === '/' && activeSection === 'beranda' 
                                    ? 'text-lime-300 hover:text-lime-200' 
                                    : 'text-stone-50 hover:text-lime-300'
                            }`}
                        >
                            Beranda
                        </a>
                        <a 
                            href="#tentang" 
                            onClick={(e) => handleNavClick(e, 'tentang')}
                            className={`text-md font-regular font-sans transition ${
                                pathname === '/' && activeSection === 'tentang' 
                                    ? 'text-lime-300 hover:text-lime-200' 
                                    : 'text-stone-50 hover:text-lime-300'
                            }`}
                        >
                            Tentang
                        </a>
                        <a href="#scan" className="text-md font-regular font-sans text-stone-50 hover:text-lime-300 transition">
                            Scan
                        </a>
                    </div>

                    {/* Log In Button */}
                    <button className="px-4 py-3 bg-lime-300 rounded-md hover:bg-lime-200 transition">
                        <span className="text-md font-regular font-sans text-neutral-800">Log In</span>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 p-2"
                >
                    <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-[#1a3129]/90 border-t border-lime-100/30 px-8 py-4">
                    <div className="flex flex-col gap-4">
                        <a 
                            href="#beranda" 
                            onClick={(e) => handleNavClick(e, 'beranda')}
                            className={`text-md font-regular font-sans text-center transition ${
                                pathname === '/' && activeSection === 'beranda' 
                                    ? 'text-lime-300 hover:text-lime-200' 
                                    : 'text-stone-50 hover:text-lime-300'
                            }`}
                        >
                            Beranda
                        </a>
                        <a 
                            href="#tentang" 
                            onClick={(e) => handleNavClick(e, 'tentang')}
                            className={`text-md font-regular font-sans text-center transition ${
                                pathname === '/' && activeSection === 'tentang' 
                                    ? 'text-lime-300 hover:text-lime-200' 
                                    : 'text-stone-50 hover:text-lime-300'
                            }`}
                        >
                            Tentang
                        </a>
                        <a href="#scan" className="text-md font-regular font-sans text-center text-stone-50 hover:text-lime-300 transition">
                            Scan
                        </a>
                        <button className="mt-2 mx-auto px-4 py-3 bg-lime-300 rounded-md hover:bg-lime-200 transition">
                            <span className="text-md font-regular font-sans text-neutral-800">Log In</span>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}