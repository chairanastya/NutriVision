'use client';

import Image from 'next/image';
import Form, { FormConfig } from '@/components/Form';

export default function LoginPage() {
    const loginFormConfig: FormConfig = {
        title: 'Log In',
        fields: [
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
        ],
        submitButtonLabel: 'Log In',
        apiEndpoint: '/api/auth/login',
        successMessage: 'Login berhasil! Redirecting ke dashboard...',
        redirectTo: '/dashboard',
        redirectDelay: 2000,
        footerText: 'Belum punya akun?',
        footerLinkText: 'Daftar',
        footerLinkHref: '/signup',
        showForgotPassword: true,
        forgotPasswordHref: '/forgot-password',
    };

    return (
        <div className="w-full min-h-screen bg-background overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 pt-8 md:pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start min-h-screen py-4 sm:py-6 md:py-8">
                    {/* Left Section - Form */}
                    <div className="flex flex-col justify-start items-start gap-10 w-full max-w-md">
                        <Form config={loginFormConfig} />
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
