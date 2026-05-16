"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User } from "lucide-react";

interface UserData {
    id: string;
    name: string;
    email: string;
}

export default function Navbar() {
    const [activeSection, setActiveSection] = useState("beranda");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Start with null - will hydrate from sessionStorage in useEffect
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    
    const pathname = usePathname();
    const router = useRouter();

    const handleLoginClick = () => {
        router.push("/login");
    };

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                console.error("Logout failed with status:", response.status);
            }

            // Clear session storage
            sessionStorage.removeItem("nv_user");

            // Clear local state regardless of API response
            setIsLoggedIn(false);
            setUserData(null);
            setIsProfileOpen(false);
            setIsMenuOpen(false);
            
            // Redirect to home
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
            
            // Clear session storage on error too
            sessionStorage.removeItem("nv_user");
            
            // Still clear local state on error
            setIsLoggedIn(false);
            setUserData(null);
            setIsProfileOpen(false);
            setIsMenuOpen(false);
            router.push("/");
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const sections = ["beranda", "tentang", "scan"];
            let current = "beranda";

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

        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hydrate from sessionStorage after mount
    useEffect(() => {
        const cachedUser = sessionStorage.getItem("nv_user");
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            setUserData(user);
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                // Verify with server
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "include",
                    signal: controller.signal,
                });

                if (!res.ok) {
                    // Session invalid - clear everything
                    setIsLoggedIn(false);
                    setUserData(null);
                    sessionStorage.removeItem("nv_user");
                    return;
                }

                const data = (await res.json()) as {
                    isLoggedIn?: boolean;
                    user?: UserData;
                };

                if (data?.user) {
                    setIsLoggedIn(true);
                    setUserData(data.user);
                    sessionStorage.setItem("nv_user", JSON.stringify(data.user));
                } else {
                    setIsLoggedIn(false);
                    setUserData(null);
                    sessionStorage.removeItem("nv_user");
                }
            } catch (error) {
                // Network error - keep cache state, don't modify anything
                // State is already initialized from cache in initial render
                console.log("Auth verification error (keeping cache):", error);
            }
        })();

        return () => controller.abort();
    }, []);

    const handleNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        sectionId: string,
    ) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            // If element doesn't exist on current page, navigate to home with anchor
            window.location.href = `/#${sectionId}`;
        }
        setIsMenuOpen(false);
    };

    return (
        <nav
            className={`sticky top-0 z-50 w-full py-2 min-h-[55px] md:min-h-[65px] flex items-center ${isMenuOpen ? "bg-[#1a3129]" : "bg-[#1a3129]/90 backdrop-blur-md"} border-b border-lime-100/50`}>
            <div className="flex mx-auto w-full max-w-7xl px-8 justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-black text-white font-sans">
                        NutriVision
                    </h1>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-7" suppressHydrationWarning>
                    {/* Menu Items - Show only for non-logged-in users or home page */}
                    {!isHydrated || !isLoggedIn ? (
                        <div className="flex items-center gap-5">
                            <a
                                href="#beranda"
                                onClick={(e) => handleNavClick(e, "beranda")}
                                className={`text-md font-regular font-sans transition ${
                                    pathname === "/" &&
                                    activeSection === "beranda"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Beranda
                            </a>
                            <a
                                href="#tentang"
                                onClick={(e) => handleNavClick(e, "tentang")}
                                className={`text-md font-regular font-sans transition ${
                                    pathname === "/" &&
                                    activeSection === "tentang"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Tentang
                            </a>
                            <a
                                href="/scan"
                                className={`text-md font-regular font-sans transition ${
                                    pathname === "/scan"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Scan
                            </a>
                        </div>
                    ) : null}

                    {/* Logged-in user menu */}
                    {isHydrated && isLoggedIn ? (
                        <div className="flex items-center gap-5">
                            <a
                                href="/dashboard"
                                className={`text-md font-regular font-sans transition ${
                                    pathname === "/dashboard"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Dashboard
                            </a>
                            <a
                                href="/scan"
                                className={`text-md font-regular font-sans transition ${
                                    pathname === "/scan"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Scan
                            </a>
                        </div>
                    ) : null}

                    {/* Log In Button or Profile */}
                    {!isHydrated ? (
                        // During hydration, show Login button (safe default)
                        <button
                            onClick={handleLoginClick}
                            className="px-4 py-3 bg-lime-300 rounded-md hover:bg-lime-200 transition">
                            <span className="text-md font-regular font-sans text-neutral-800">
                                Log In
                            </span>
                        </button>
                    ) : isLoggedIn === false &&
                      pathname !== "/login" &&
                      pathname !== "/signup" ? (
                        // After hydration, if not logged in
                        <button
                            onClick={handleLoginClick}
                            className="px-4 py-3 bg-lime-300 rounded-md hover:bg-lime-200 transition">
                            <span className="text-md font-regular font-sans text-neutral-800">
                                Log In
                            </span>
                        </button>
                    ) : null}

                    {/* User Profile Dropdown */}
                    {isLoggedIn && userData && (
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsProfileOpen(!isProfileOpen)
                                }
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#2d5a45] transition">
                                <User size={20} className="text-lime-300" />
                                <span className="text-sm font-regular text-stone-50 hidden sm:inline">
                                    {userData.name}
                                </span>
                            </button>

                            {/* Profile Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-[#1a3129]">
                                            {userData.name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {userData.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            router.push("/profile");
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-[#1a3129] hover:bg-lime-50 transition">
                                        Edit Profil
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition border-t border-gray-200">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 p-2">
                    <span
                        className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
                    <span
                        className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? "opacity-0" : ""}`}></span>
                    <span
                        className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-[#1a3129]/90 border-t border-lime-100/30 px-8 py-4" suppressHydrationWarning>
                    <div className="flex flex-col gap-4">
                        {!isHydrated || !isLoggedIn ? (
                            <>
                                <a
                                    href="#beranda"
                                    onClick={(e) => handleNavClick(e, "beranda")}
                                    className={`text-md font-regular font-sans text-center transition ${
                                        pathname === "/" &&
                                        activeSection === "beranda"
                                            ? "text-lime-300 hover:text-lime-200"
                                            : "text-stone-50 hover:text-lime-300"
                                    }`}>
                                    Beranda
                                </a>
                                <a
                                    href="#tentang"
                                    onClick={(e) => handleNavClick(e, "tentang")}
                                    className={`text-md font-regular font-sans text-center transition ${
                                        pathname === "/" &&
                                        activeSection === "tentang"
                                            ? "text-lime-300 hover:text-lime-200"
                                            : "text-stone-50 hover:text-lime-300"
                                    }`}>
                                    Tentang
                                </a>
                            </>
                        ) : null}

                        <a
                            href="/scan"
                            onClick={() => setIsMenuOpen(false)}
                            className={`text-md font-regular font-sans text-center transition ${
                                pathname === "/scan"
                                    ? "text-lime-300 hover:text-lime-200"
                                    : "text-stone-50 hover:text-lime-300"
                            }`}>
                            Scan
                        </a>

                        {isHydrated && isLoggedIn ? (
                            <a
                                href="/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-md font-regular font-sans text-center transition ${
                                    pathname === "/dashboard"
                                        ? "text-lime-300 hover:text-lime-200"
                                        : "text-stone-50 hover:text-lime-300"
                                }`}>
                                Dashboard
                            </a>
                        ) : null}

                        {!isHydrated || (isLoggedIn === false &&
                            pathname !== "/login" &&
                            pathname !== "/signup") ? (
                                <button
                                    onClick={handleLoginClick}
                                    className="mt-2 mx-auto px-4 py-3 bg-lime-300 rounded-md hover:bg-lime-200 transition">
                                    <span className="text-md font-regular font-sans text-neutral-800">
                                        Log In
                                    </span>
                                </button>
                            ) : null}

                        {isLoggedIn && userData && (
                            <>
                                <div className="border-t border-lime-200/30 pt-4 mt-2">
                                    <p className="text-sm font-semibold text-stone-50 text-center">
                                        {userData.name}
                                    </p>
                                    <p className="text-xs text-stone-300 text-center mb-3">
                                        {userData.email}
                                    </p>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-sm text-red-400 hover:bg-[#2d5a45] rounded transition">
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
