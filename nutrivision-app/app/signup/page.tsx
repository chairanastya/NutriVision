"use client";

import Image from 'next/image';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Form, { FormConfig } from '@/components/Form';

export default function SignupPage() {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

    const handleGoogleSignupSuccess = async (codeResponse: any) => {
        setIsLoadingGoogle(true);
        try {
            // Kirim code ke backend untuk ditukar dengan token
            const response = await fetch('/api/auth/google/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: codeResponse.code }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Google signup error:', data.message);
                return;
            }

            // Redirect ke dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Google signup error:', error);
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    const googleSignup = useGoogleLogin({
        onSuccess: handleGoogleSignupSuccess,
        flow: 'auth-code',
    });
    const signupFormConfig: FormConfig = {
        title: "Sign Up",
        fields: [
            {
                name: "name",
                label: "Nama",
                type: "text",
                placeholder: "Masukkan nama lengkap",
                required: true,
                validation: (value) => {
                    if (!value.trim()) return "Nama harus diisi";
                    if (value.trim().length < 3)
                        return "Nama minimal 3 karakter";
                    return null;
                },
            },
            {
                name: "phone_number",
                label: "Nomor Handphone",
                type: "tel",
                placeholder: "Masukkan nomor handphone",
                required: false,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "abc@gmail.com",
                required: true,
            },
            {
                name: "password",
                label: "Password",
                type: "password",
                placeholder: "Masukkan password",
                required: true,
            },
            {
                name: "confirmPassword",
                label: "Konfirmasi Password",
                type: "password",
                placeholder: "Ulangi password",
                required: true,
            },
        ],
        submitButtonLabel: "Daftar",
        apiEndpoint: "/api/auth/signup",
        successMessage: "Akun berhasil dibuat! Redirecting ke login...",
        redirectTo: "/login",
        redirectDelay: 2000,
        customValidation: (formData) => {
            const errors: Record<string, string> = {};

            // Validasi jika password tidak cocok
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = "Password tidak cocok";
            }

            return errors;
        },
    };

    return (
        <div className="w-full min-h-screen bg-background overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start min-h-screen py-4 sm:py-6 md:py-8">
                    {/* Left Section - Form */}
                    <div className="flex flex-col justify-start items-start gap-10 w-full max-w-md">
                        <Form config={signupFormConfig} />

                        {/* Divider */}
                        <div className="w-full flex items-center gap-4">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="text-gray-600 text-sm font-medium">atau daftar melalui</span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                        </div>

                        {/* Custom Google Signup Button */}
                        <button
                            onClick={() => googleSignup()}
                            disabled={isLoadingGoogle}
                            className="w-full h-12 px-4 py-3 bg-lime-100 border border-neutral-200 rounded-md inline-flex justify-center items-center gap-2 hover:bg-lime-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Image
                                src="/images/icons/icons-google.svg"
                                alt="Google"
                                width={24}
                                height={24}
                                priority
                            />
                            <span className="text-neutral-800 text-lg font-semibold">Google</span>
                        </button>

                        {/* Log In Footer */}
                        <div className="w-full text-center text-sm mt-4">
                            <span className="text-gray-600">Sudah punya akun? </span>
                            <a 
                                href="/login" 
                                className="font-semibold text-gray-800 hover:text-lime-600 transition-colors"
                            >
                                Log In
                            </a>
                        </div>
                    </div>

                    {/* Right Section - Image */}
                    <div className="hidden lg:flex justify-start items-center fixed right-0 top-1/2 -translate-y-1/2 w-1/2 h-screen pointer-events-none">
                        <div className="relative w-full h-full">
                            <Image
                                src="/images/hero/pngwing 3.png"
                                alt="Vegetables for nutrition"
                                fill
                                sizes="(max-width: 1024px) 0vw, 50vw"
                                className="object-contain object-right"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
