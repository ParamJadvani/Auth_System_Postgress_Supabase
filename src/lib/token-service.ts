import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/db";
import { tokens, users } from "@/db/schema";
import { eq, and, lt, isNull, sql } from "drizzle-orm";

// Constants for token configuration
const TOKEN_EXPIRY = {
    ACCESS: 15 * 60, // 15 minutes in seconds
    REFRESH: 7 * 24 * 60 * 60, // 7 days in seconds
    VERIFICATION: 24 * 60 * 60, // 24 hours in seconds
    PASSWORD_RESET: 1 * 60 * 60, // 1 hour in seconds
};

// Helper to generate a secure random token
export const generateToken = (): string => {
    return crypto.randomBytes(40).toString("hex");
};

// Helper to get IP address from request
export const getIpFromRequest = (req: Request): string => {
    const forwarded = req.headers.get("x-forwarded-for");
    return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
};

// Helper to get user agent from request
export const getUserAgentFromRequest = (req: Request): string => {
    return req.headers.get("user-agent") || "unknown";
};

// Create a token and store it in the database
export const createToken = async ({
    userId,
    type,
    req,
    expiresIn = null,
}: {
    userId: string;
    type: "access" | "refresh" | "verification" | "password_reset";
    req: Request;
    expiresIn?: number | null;
}): Promise<string> => {
    const token = generateToken();
    const ip = getIpFromRequest(req);
    const userAgent = getUserAgentFromRequest(req);

    // Set expiry based on token type
    const expiry = expiresIn || TOKEN_EXPIRY[type.toUpperCase() as keyof typeof TOKEN_EXPIRY];
    const expires = new Date(Date.now() + expiry * 1000);

    await db.insert(tokens).values({
        userId,
        type,
        token,
        expires,
        createdByIp: ip,
        userAgent,
    });

    return token;
};

// Verify a token is valid and not expired
export const verifyToken = async (
    token: string,
    type: "access" | "refresh" | "verification" | "password_reset"
) => {
    const tokenRecords = await db
        .select()
        .from(tokens)
        .where(
            and(
                eq(tokens.token, token),
                eq(tokens.type, type),
                isNull(tokens.revokedAt), // Use isNull instead of eq with undefined
                lt(sql`${new Date()}`, tokens.expires) // Use sql wrapper to compare Date
            )
        );

    // Return the first token record if found, otherwise null
    return tokenRecords.length > 0 ? tokenRecords[0] : null;
};

// Revoke a token (e.g., on logout)
export const revokeToken = async (token: string, ip: string) => {
    await db
        .update(tokens)
        .set({
            revokedAt: new Date(),
            revokedByIp: ip,
        })
        .where(eq(tokens.token, token));
};

// Revoke all tokens for a user (e.g., on password change)
export const revokeAllUserTokens = async (userId: string, ip: string) => {
    await db
        .update(tokens)
        .set({
            revokedAt: new Date(),
            revokedByIp: ip,
        })
        .where(and(eq(tokens.userId, userId), isNull(tokens.revokedAt))); // Use isNull instead of eq with undefined
};

// Authenticate with cookies
export const authenticateWithCookies = async (accessToken: string) => {
    const tokenRecord = await verifyToken(accessToken, "access");
    if (!tokenRecord) {
        return null;
    }

    const userResults = await db.select().from(users).where(eq(users.id, tokenRecord.userId));
    // Return the first user if found, otherwise null
    return userResults.length > 0 ? userResults[0] : null;
};

// Set cookies for authentication
export const setAuthCookies = async (accessToken: string, refreshToken: string) => {
    const cookieStore = await cookies();

    // Set access token as HTTP-only cookie
    cookieStore.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_EXPIRY.ACCESS,
        path: "/",
    });

    // Set refresh token as HTTP-only cookie
    cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_EXPIRY.REFRESH,
        path: "/",
    });
};

// Clear auth cookies (for logout)
export const clearAuthCookies = async () => {
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
};

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken: string, req: Request) => {
    const tokenRecord = await verifyToken(refreshToken, "refresh");
    if (!tokenRecord) {
        return null;
    }

    // Create new access token
    const newAccessToken = await createToken({
        userId: tokenRecord.userId,
        type: "access",
        req,
    });

    return {
        accessToken: newAccessToken,
        userId: tokenRecord.userId,
    };
};

// Server-side auth check middleware
export const authGuard = async (requiredRole: "admin" | "user" | null = null) => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
        redirect("/login");
    }

    const tokenRecord = await verifyToken(accessToken, "access");

    if (!tokenRecord) {
        // Try to refresh using refresh token
        const refreshToken = cookieStore.get("refreshToken")?.value;
        if (!refreshToken) {
            clearAuthCookies();
            redirect("/login");
        }

        // Attempt to refresh the token
        const refreshResult = await refreshAccessToken(
            refreshToken,
            new Request("http://localhost:3000")
        );
        if (!refreshResult) {
            clearAuthCookies();
            redirect("/login");
        }

        // Set new cookies and continue
        setAuthCookies(refreshResult.accessToken, refreshToken);
    }

    // Get user data
    if (!tokenRecord) {
        clearAuthCookies();
        redirect("/login");
    }

    const userResults = await db.select().from(users).where(eq(users.id, tokenRecord.userId));
    const user = userResults.length > 0 ? userResults[0] : null;

    if (!user) {
        clearAuthCookies();
        redirect("/login");
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
        redirect("/unauthorized");
    }

    return user;
};
