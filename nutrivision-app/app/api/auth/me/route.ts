import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
    const user = await getSessionUserFromRequest(request);

    if (!user) {
        return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }

    return NextResponse.json(
        {
            isLoggedIn: true,
            user,
        },
        { status: 200 },
    );
}
