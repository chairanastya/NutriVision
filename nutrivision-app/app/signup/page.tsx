'use client';

import Image from 'next/image';
import Form, { FormConfig } from '@/components/Form';

export default function SignupPage() {
    const signupFormConfig: FormConfig = {
        title: 'Sign Up',
        fields: [
            {
                name: 'name',
                label: 'Nama',
                type: 'text',
                placeholder: 'Masukkan nama lengkap',
                required: true,
                validation: (value) => {
                    if (!value.trim()) return 'Nama harus diisi';
                    if (value.trim().length < 3) return 'Nama minimal 3 karakter';
                    return null;
                },
            },
            {
                name: 'phone_number',
                label: 'Nomor Handphone',
                type: 'tel',
                placeholder: 'Masukkan nomor handphone',
                required: false,
            },
            {
                name: 'email',
                label: 'Email',
                type: 'email',
                placeholder: 'abc@gmail.com',
                required: true,
            },
            {
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'Masukkan password',
                required: true,
            },
            {
                name: 'confirmPassword',
                label: 'Konfirmasi Password',
                type: 'password',
                placeholder: 'Ulangi password',
                required: true,
            },
        ],
        submitButtonLabel: 'Daftar',
        apiEndpoint: '/api/auth/signup',
        successMessage: 'Akun berhasil dibuat! Redirecting ke login...',
        redirectTo: '/login',
        redirectDelay: 2000,
        footerText: 'Sudah punya akun?',
        footerLinkText: 'Log In',
        footerLinkHref: '/login',
        customValidation: (formData) => {
            const errors: Record<string, string> = {};
            
            // Validasi jika password tidak cocok
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Password tidak cocok';
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
