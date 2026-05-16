import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        // Create response with cookie cleared
        const response = NextResponse.json(
            { message: "Logout successful" },
            { status: 200 }
        );

        // Clear session cookie by setting max-age to 0
        response.cookies.set(SESSION_COOKIE_NAME, "", {
            maxAge: 0,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Logout failed" },
            { status: 500 }
        );
    }
}
