import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUserFromRequest } from "@/lib/session";
import { queryDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getSessionUserFromRequest(request);

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Validation
        if (!currentPassword || typeof currentPassword !== "string") {
            return NextResponse.json(
                { error: "Current password is required" },
                { status: 400 }
            );
        }

        if (!newPassword || typeof newPassword !== "string") {
            return NextResponse.json(
                { error: "New password is required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Get current password from database
        const userResult = await queryDatabase(
            `SELECT password FROM users WHERE id = $1`,
            [sessionUser.id]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = userResult.rows[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Password saat ini tidak benar" },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const updateResult = await queryDatabase(
            `UPDATE users SET password = $1 WHERE id = $2 RETURNING id`,
            [hashedPassword, sessionUser.id]
        );

        if (updateResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Failed to update password" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
