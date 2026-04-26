import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryDatabase } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

interface LoginRequest {
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();

        // Validasi input
        if (!body.email || !body.password) {
            const errors: Record<string, string> = {};
            if (!body.email) errors.email = 'Email harus diisi';
            if (!body.password) errors.password = 'Password harus diisi';
            return NextResponse.json(
                { errors },
                { status: 400 }
            );
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { errors: { email: 'Format email tidak valid' } },
                { status: 400 }
            );
        }

        // Cari user berdasarkan email
        const userQuery = 'SELECT id, name, email, password, phone_number, created_at FROM users WHERE email = $1';
        const userResult = await queryDatabase(userQuery, [body.email]);

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { errors: { email: 'Email tidak ditemukan' } },
                { status: 401 }
            );
        }

        const user = userResult.rows[0];

        // Validasi password dengan bcrypt
        const isPasswordValid = await bcrypt.compare(body.password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { errors: { password: 'Password salah' } },
                { status: 401 }
            );
        }

        const sessionUser = {
            id: Number(user.id),
            name: String(user.name),
            email: String(user.email),
        };

        const token = await createSessionToken(sessionUser);

        const response = NextResponse.json(
            {
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                    created_at: user.created_at,
                },
            },
            { status: 200 }
        );

        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);

        return NextResponse.json(
            { message: 'Terjadi kesalahan pada server' },
            { status: 500 }
        );
    }
}
