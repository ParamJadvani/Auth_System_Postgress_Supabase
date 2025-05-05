import db from "@/db";
import {  users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken, revokeToken, getIpFromRequest } from "@/lib/token-service";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return new Response(JSON.stringify({ message: "Token is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Verify the token
        const tokenRecord = await verifyToken(token, "verification");
        if (!tokenRecord) {
            return new Response(
                JSON.stringify({ message: "Invalid or expired verification token" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Update user's email verification status
        await db.update(users).set({ emailVerified: true }).where(eq(users.id, tokenRecord.userId));

        // Revoke the verification token so it can't be used again
        await revokeToken(token, getIpFromRequest(req));

        return new Response(JSON.stringify({ message: "Email verified successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Email verification error:", error);
        return new Response(
            JSON.stringify({ message: "An error occurred during email verification" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
