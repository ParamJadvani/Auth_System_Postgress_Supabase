import { cookies } from "next/headers";
import { clearAuthCookies, revokeToken, getIpFromRequest } from "@/lib/token-service";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();

        // Get tokens from cookies
        const accessToken = cookieStore.get("accessToken")?.value;
        const refreshToken = cookieStore.get("refreshToken")?.value;

        // Revoke tokens in database if they exist
        if (accessToken) {
            await revokeToken(accessToken, getIpFromRequest(req));
        }

        if (refreshToken) {
            await revokeToken(refreshToken, getIpFromRequest(req));
        }

        // Clear cookies
        clearAuthCookies();

        return new Response(JSON.stringify({ message: "Logged out successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Logout error:", error);

        // Clear cookies anyway to ensure the user is logged out client-side
        clearAuthCookies();

        return new Response(JSON.stringify({ message: "An error occurred during logout" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
