'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'tel' | 'number';
    placeholder?: string;
    required?: boolean;
    validation?: (value: string) => string | null;
    showPassword?: boolean; // Only for password type
}

export interface FormConfig {
    fields: FormField[];
    title: string;
    submitButtonLabel: string;
    apiEndpoint: string;
    successMessage: string;
    redirectTo?: string;
    redirectDelay?: number;
    footerText?: string;
    footerLinkText?: string;
    footerLinkHref?: string;
    customValidation?: (formData: Record<string, string>) => Record<string, string>;
}

interface FormData {
    [key: string]: string;
}

interface FormErrors {
    [key: string]: string;
}

const defaultValidation = {
    email: (value: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email harus diisi';
        if (!emailRegex.test(value)) return 'Format email tidak valid';
        return null;
    },
    text: (value: string): string | null => {
        if (!value.trim()) return null;
        if (value.trim().length < 3) return 'Minimal 3 karakter';
        return null;
    },
    password: (value: string): string | null => {
        if (!value) return 'Password harus diisi';
        if (value.length < 8) return 'Password minimal 8 karakter';
        return null;
    },
    tel: (value: string): string | null => {
        if (!value.trim()) return null;
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return 'Nomor tidak valid';
        return null;
    },
};

export default function Form({ config }: { config: FormConfig }) {
    const initialFormData: FormData = {};
    config.fields.forEach((field) => {
        initialFormData[field.name] = '';
    });

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validasi setiap field
        config.fields.forEach((field) => {
            const value = formData[field.name];

            // Check required
            if (field.required !== false && !value.trim()) {
                newErrors[field.name] = `${field.label} harus diisi`;
                return;
            }

            // Skip validation jika field tidak required dan empty
            if (!value.trim()) return;

            // Use custom validation jika ada
            if (field.validation) {
                const error = field.validation(value);
                if (error) newErrors[field.name] = error;
                return;
            }

            // Use default validation berdasarkan type
            if (field.type === 'email') {
                const error = defaultValidation.email(value);
                if (error) newErrors[field.name] = error;
            } else if (field.type === 'password') {
                const error = defaultValidation.password(value);
                if (error) newErrors[field.name] = error;
            } else if (field.type === 'tel') {
                const error = defaultValidation.tel(value);
                if (error) newErrors[field.name] = error;
            } else if (field.type === 'text') {
                const error = defaultValidation.text(value);
                if (error) newErrors[field.name] = error;
            }
        });

        // Custom validation jika ada
        if (config.customValidation) {
            const customErrors = config.customValidation(formData);
            Object.assign(newErrors, customErrors);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error ketika user mulai mengetik
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrors({
                    submit: errorData.message || 'Gagal memproses form',
                });
                return;
            }

            setSuccess(true);
            setFormData(initialFormData);

            // Redirect jika ada
            if (config.redirectTo) {
                setTimeout(() => {
                    window.location.href = config.redirectTo!;
                }, config.redirectDelay || 2000);
            }
        } catch (error) {
            setErrors({
                submit: 'Terjadi kesalahan. Silakan coba lagi.',
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (fieldName: string) => {
        setShowPasswordFields((prev) => ({
            ...prev,
            [fieldName]: !prev[fieldName],
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-8">
            {/* Title */}
            <div>
                <h1 className="text-4xl font-bold text-center leading-tight text-[#1a3129] mb-8">
                    {config.title}
                </h1>
            </div>

            {/* Fields */}
            <div className="space-y-7">
                {config.fields.map((field) => (
                    <div key={field.name} className="flex flex-col gap-2">
                        <label
                            htmlFor={field.name}
                            className="text-[#1a3129] text-base font-medium leading-6">
                            {field.label}
                            {field.required === false && (
                                <span className="text-neutral-500 text-sm ml-2">(opsional)</span>
                            )}
                        </label>

                        {field.type === 'password' ? (
                            <div className="relative">
                                <input
                                    id={field.name}
                                    type={
                                        showPasswordFields[field.name] ? 'text' : 'password'
                                    }
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    className="w-full h-12 px-4 py-3 pr-12 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-300 text-gray-700 text-base font-normal leading-5 placeholder:text-gray-400 focus:outline-2 focus:outline-[#cbea7b] transition duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        togglePasswordVisibility(field.name)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    {showPasswordFields[field.name] ? (
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <input
                                id={field.name}
                                type={field.type}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                className="w-full h-12 px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-300 text-gray-700 text-sm font-normal leading-5 placeholder:text-gray-400 focus:outline-2 focus:outline-[#cbea7b] transition duration-200"
                            />
                        )}

                        {errors[field.name] && (
                            <span className="text-red-600 text-sm font-medium">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Error atau Success Messages */}
            {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-red-700 text-sm font-medium">{errors.submit}</span>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-green-700 text-sm font-medium">
                        {config.successMessage}
                    </span>
                </div>
            )}

            {/* Tombol Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-4 bg-[#cbea7b] rounded-lg inline-flex justify-center items-center gap-2 hover:bg-[#b8d96a] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 mt-8">
                <span className="text-neutral-800 text-base font-semibold leading-6">
                    {loading ? 'Memproses...' : config.submitButtonLabel}
                </span>
            </button>

            {/* Footer Link */}
            {config.footerText && config.footerLinkText && config.footerLinkHref && (
                <div className="flex justify-center items-center gap-1 pt-4">
                    <span className="text-gray-600 text-md font-normal leading-6">
                        {config.footerText}
                    </span>
                    <Link
                        href={config.footerLinkHref}
                        className="text-[#1a3129] text-md font-medium leading-6 hover:underline transition">
                        {config.footerLinkText}
                    </Link>
                </div>
            )}
        </form>
    );
}
