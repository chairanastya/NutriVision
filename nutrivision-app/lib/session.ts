import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "nv_session";

export interface SessionUser {
    id: number;
    name: string;
    email: string;
}

function getSessionSecret(): Uint8Array {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("Missing AUTH_SECRET env var");
    }
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
    const secret = getSessionSecret();

    return await new SignJWT({ user })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .setSubject(String(user.id))
        .sign(secret);
}

export async function readSessionToken(token: string): Promise<SessionUser> {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);

    const payloadUser = (payload as { user?: unknown }).user;
    if (!payloadUser || typeof payloadUser !== "object") {
        throw new Error("Invalid session payload");
    }

    const user = payloadUser as Partial<SessionUser>;
    if (
        typeof user.id !== "number" ||
        typeof user.name !== "string" ||
        typeof user.email !== "string"
    ) {
        throw new Error("Invalid session payload");
    }

    return { id: user.id, name: user.name, email: user.email };
}

export async function getSessionUserFromRequest(request: {
    cookies: { get: (name: string) => { value?: string } | undefined };
}): Promise<SessionUser | null> {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        return await readSessionToken(token);
    } catch {
        return null;
    }
}
