import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session";
import { queryDatabase } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const sessionUser = await getSessionUserFromRequest(request);

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, phone_number } = body;

        // Validation
        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string" || email.trim() === "") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if email already exists (for other users)
        const existingEmail = await queryDatabase(
            `SELECT id FROM users WHERE email = $1 AND id != $2`,
            [email.toLowerCase(), sessionUser.id]
        );

        if (existingEmail.rows.length > 0) {
            return NextResponse.json(
                { error: "Email sudah terdaftar" },
                { status: 400 }
            );
        }

        // Update user
        const result = await queryDatabase(
            `UPDATE users 
             SET name = $1, email = $2, phone_number = $3
             WHERE id = $4
             RETURNING id, name, email, phone_number`,
            [
                name.trim(),
                email.toLowerCase(),
                phone_number || null,
                sessionUser.id,
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const updatedUser = result.rows[0];

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone_number: updatedUser.phone_number,
            },
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
