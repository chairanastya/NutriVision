import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryDatabase } from "@/lib/db";

interface SignupRequest {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
    confirmPassword?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SignupRequest = await request.json();

        // Validasi input
        if (!body.name || !body.email || !body.password) {
            return NextResponse.json(
                { message: "Nama, email, dan password harus diisi" },
                { status: 400 },
            );
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { message: "Format email tidak valid" },
                { status: 400 },
            );
        }

        // Validasi panjang password
        if (body.password.length < 8) {
            return NextResponse.json(
                { message: "Password minimal 8 karakter" },
                { status: 400 },
            );
        }

        // Cek apakah email sudah terdaftar
        const emailCheckQuery = "SELECT id FROM users WHERE email = $1";
        const emailCheckResult = await queryDatabase(emailCheckQuery, [
            body.email,
        ]);

        if (emailCheckResult.rows.length > 0) {
            return NextResponse.json(
                { message: "Email sudah terdaftar" },
                { status: 409 },
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.password, salt);

        // Insert user ke database
        const insertQuery = `
            INSERT INTO users (name, email, password, phone_number, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id, name, email, phone_number, created_at
        `;

        const result = await queryDatabase(insertQuery, [
            body.name,
            body.email,
            hashedPassword,
            body.phone_number || null,
        ]);

        const user = result.rows[0];

        return NextResponse.json(
            {
                message: "Akun berhasil dibuat",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                    created_at: user.created_at,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Signup error:", error);

        // Handle duplicate email error
        if (error instanceof Error && error.message.includes("duplicate")) {
            return NextResponse.json(
                { message: "Email sudah terdaftar" },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 },
        );
    }
}
