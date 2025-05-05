// import db from "@/db";
// import { users } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import bcrypt from "bcrypt";

// export const POST = async (req: Request) => {
//     const { email, password } = await req.json();

//     const user = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

//     if (user.length === 0) {
//         return new Response("Invalid email", { status: 400 });
//     }

//     const validPassword = await bcrypt.compare(password, user[0].password);

//     if (!validPassword) {
//         return new Response("Invalid password", { status: 400 });
//     }

//     console.log(user);

//     return new Response(
//         JSON.stringify({
//             id: user[0].id,
//             name: user[0].name,
//             email: user[0].email,
//             role: user[0].role,
//         }),
//         {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//         }
//     );
// };

import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createToken, setAuthCookies } from "@/lib/token-service";

export const POST = async (req: Request) => {
    try {
        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return new Response(JSON.stringify({ message: "Email and password are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find user by email
        const userResults = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        // Check if user exists
        if (userResults.length === 0) {
            return new Response(JSON.stringify({ message: "Invalid email or password" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const user = userResults[0];

        // Check if email is verified
        if (!user.emailVerified) {
            return new Response(
                JSON.stringify({
                    message: "Please verify your email before logging in",
                    emailVerified: false,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return new Response(JSON.stringify({ message: "Invalid email or password" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Generate tokens
        const accessToken = await createToken({
            userId: user.id,
            type: "access",
            req,
        });

        const refreshToken = await createToken({
            userId: user.id,
            type: "refresh",
            req,
        });

        // Set cookies
        await setAuthCookies(accessToken, refreshToken);

        // Return user info (exclude sensitive data)
        return new Response(
            JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        return new Response(JSON.stringify({ message: "An error occurred during login" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
