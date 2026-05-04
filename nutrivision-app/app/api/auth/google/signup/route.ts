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
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { message: 'Authorization code tidak ditemukan' },
                { status: 400 }
            );
        }

        // Exchange authorization code dengan Google untuk get ID token
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'postmessage';

        if (!clientId || !clientSecret) {
            console.error('Missing Google OAuth credentials in environment variables');
            return NextResponse.json(
                { message: 'Server configuration error' },
                { status: 500 }
            );
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }).toString(),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.id_token) {
            console.error('Failed to exchange code for token:', tokenData);
            return NextResponse.json(
                { message: 'Gagal menukar authorization code' },
                { status: 400 }
            );
        }

        // Decode Google token
        const decoded = jwtDecode<GoogleToken>(tokenData.id_token);

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
            // User sudah ada
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
                message: 'Signup dengan Google berhasil',
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
        console.error('Google signup error:', error);

        return NextResponse.json(
            { message: 'Terjadi kesalahan pada server' },
            { status: 500 }
        );
    }
}
