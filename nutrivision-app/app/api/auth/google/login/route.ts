import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { queryDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface GoogleToken {
    email: string;
    name: string;
    picture?: string;
    sub: string; // Google user ID
}

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { message: 'Token tidak ditemukan' },
                { status: 400 }
            );
        }

        // Decode Google token
        const decoded = jwtDecode<GoogleToken>(token);

        if (!decoded.email) {
            return NextResponse.json(
                { message: 'Email tidak ditemukan di Google account' },
                { status: 400 }
            );
        }

        // Cek apakah user sudah ada
        const userQuery = 'SELECT id, name, email, phone_number, created_at FROM users WHERE email = $1';
        const userResult = await queryDatabase(userQuery, [decoded.email]);

        let user;

        if (userResult.rows.length > 0) {
            // User sudah ada, langsung login
            user = userResult.rows[0];
        } else {
            // User baru, create account dengan random password
            const randomPassword = Math.random().toString(36).slice(-12);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const insertQuery = `
                INSERT INTO users (name, email, password, created_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                RETURNING id, name, email, phone_number, created_at
            `;

            const insertResult = await queryDatabase(insertQuery, [
                decoded.name || 'Google User',
                decoded.email,
                hashedPassword,
            ]);

            user = insertResult.rows[0];
        }

        return NextResponse.json(
            {
                message: 'Login dengan Google berhasil',
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
    } catch (error) {
        console.error('Google auth error:', error);

        return NextResponse.json(
            { message: 'Terjadi kesalahan pada server' },
            { status: 500 }
        );
    }
}
