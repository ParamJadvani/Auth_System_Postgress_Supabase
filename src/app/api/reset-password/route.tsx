import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import {
    verifyToken,
    revokeToken,
    revokeAllUserTokens,
    getIpFromRequest,
} from "@/lib/token-service";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return new Response(
                JSON.stringify({ message: "Token and new password are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Password validation
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return new Response(
                JSON.stringify({
                    message:
                        "Password must be at least 8 characters long and contain at least one letter and one number",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verify the token
        const tokenRecord = await verifyToken(token, "password_reset");
        if (!tokenRecord) {
            return new Response(JSON.stringify({ message: "Invalid or expired reset token" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, tokenRecord.userId));

        // Revoke the reset token
        await revokeToken(token, getIpFromRequest(req));

        // Revoke all existing tokens for security
        await revokeAllUserTokens(tokenRecord.userId, getIpFromRequest(req));

        return new Response(JSON.stringify({ message: "Password has been reset successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return new Response(
            JSON.stringify({ message: "An error occurred while resetting password" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
