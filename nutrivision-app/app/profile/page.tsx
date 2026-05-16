"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Footer from "@/components/Footer";

interface UserData {
    id: string;
    name: string;
    email: string;
    phone_number: string | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Fetch user data
    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/auth/me", {
                credentials: "include",
            });

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const data = await response.json();
            if (data.user) {
                setUserData(data.user);
                setFormData({
                    name: data.user.name || "",
                    email: data.user.email || "",
                    phone_number: data.user.phone_number || "",
                });
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError(
                err instanceof Error ? err.message : "Failed to load profile"
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: keyof typeof formData
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handlePasswordChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: keyof typeof passwordData
    ) => {
        setPasswordData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone_number: formData.phone_number || null,
                }),
            });

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to update profile"
                );
            }

            const updatedData = await response.json();
            setUserData(updatedData.user);
            setSuccessMessage("Profil berhasil diperbarui!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error saving profile:", err);
            setError(
                err instanceof Error ? err.message : "Failed to update profile"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChangingPassword(true);
        setError(null);
        setSuccessMessage(null);

        // Validation
        if (!passwordData.currentPassword) {
            setError("Password saat ini harus diisi");
            setIsChangingPassword(false);
            return;
        }
        if (!passwordData.newPassword) {
            setError("Password baru harus diisi");
            setIsChangingPassword(false);
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError("Password minimal 6 karakter");
            setIsChangingPassword(false);
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Password baru tidak cocok");
            setIsChangingPassword(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to change password"
                );
            }

            setSuccessMessage("Password berhasil diubah!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error changing password:", err);
            setError(
                err instanceof Error ? err.message : "Failed to change password"
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2d6a3e] animate-spin" />
                <p className="mt-4 text-[#1a3129]">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
                <div className="mx-auto w-full max-w-2xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 text-[#2d6a3e] hover:text-[#1a3129] font-semibold flex items-center gap-2">
                            <ArrowLeft size={20} />
                            Kembali
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1a3129]">
                            Edit Profil
                        </h1>
                        <p className="text-[#1a3129] opacity-60 mt-2">
                            Kelola informasi akun kamu
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {successMessage}
                        </div>
                    )}

                    {/* Profile Form */}
                    <form
                        onSubmit={handleSaveProfile}
                        className="mb-8 p-6 md:p-8 bg-white rounded-2xl border-2 border-lime-200/60 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 bg-[#cbea7b] rounded-full"></span>
                            <h2 className="text-xl font-bold text-[#1a3129]">
                                Informasi Profil
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange(e, "name")
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition"
                                    placeholder="Nama lengkap kamu"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleInputChange(e, "email")
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition"
                                    placeholder="email@example.com"
                                />
                            </div>

                            {/* Phone Number Field */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Nomor Telepon (Opsional)
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) =>
                                        handleInputChange(e, "phone_number")
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition"
                                    placeholder="+62 xxx xxxx xxxx"
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2d6a3e] text-white rounded-lg font-semibold hover:bg-[#1a3129] transition disabled:opacity-50">
                            {isSaving && (
                                <Loader2 size={20} className="animate-spin" />
                            )}
                            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </form>

                    {/* Change Password Form */}
                    <form
                        onSubmit={handleChangePassword}
                        className="p-6 md:p-8 bg-white rounded-2xl border-2 border-lime-200/60 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 bg-[#cbea7b] rounded-full"></span>
                            <h2 className="text-xl font-bold text-[#1a3129]">
                                Ubah Password
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Password Saat Ini
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPasswords.current
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            handlePasswordChange(
                                                e,
                                                "currentPassword"
                                            )
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition pr-10"
                                        placeholder="Masukkan password saat ini"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                current: !prev.current,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showPasswords.current ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPasswords.new
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            handlePasswordChange(
                                                e,
                                                "newPassword"
                                            )
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition pr-10"
                                        placeholder="Minimal 6 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                new: !prev.new,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showPasswords.new ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-[#1a3129] mb-2">
                                    Konfirmasi Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPasswords.confirm
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            handlePasswordChange(
                                                e,
                                                "confirmPassword"
                                            )
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cbea7b] focus:ring-2 focus:ring-[#cbea7b]/30 transition pr-10"
                                        placeholder="Konfirmasi password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                confirm: !prev.confirm,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showPasswords.confirm ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Change Password Button */}
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50">
                            {isChangingPassword && (
                                <Loader2 size={20} className="animate-spin" />
                            )}
                            {isChangingPassword
                                ? "Mengubah..."
                                : "Ubah Password"}
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
