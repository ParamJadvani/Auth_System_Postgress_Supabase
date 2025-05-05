// import db from "@/db";
// import { users } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import bcrypt from "bcrypt";

// export async function POST(req: Request) {
//     try {
//         const { name, email, password } = await req.json();

//         const existingUser = await db
//             .select()
//             .from(users)
//             .where(eq(users.email, email.toLowerCase()));

//         if (existingUser.length > 0) {
//             return new Response("Email already exists", { status: 400 });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const [newUser] = await db
//             .insert(users)
//             .values({
//                 name,
//                 email: email.toLowerCase(),
//                 password: hashedPassword,
//             })
//             .returning();

//         console.log(newUser);
//         return new Response(
//             JSON.stringify({
//                 id: newUser.id,
//                 name: newUser.name,
//                 email: newUser.email,
//             }),
//             {
//                 status: 200,
//                 headers: { "Content-Type": "application/json" },
//             }
//         );
//     } catch (e) {
//         const error = e as Error;
//         return new Response(error.message, { status: 500 });
//     }
// }

import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createToken } from "@/lib/token-service";
import sendEmail from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!name || !email || !password) {
            return new Response(
                JSON.stringify({ message: "Name, email, and password are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if email already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        if (existingUser) {
            return new Response(JSON.stringify({ message: "Email already exists" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Password validation (minimum 8 characters, at least one number and one letter)
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
            })
            .returning();

        // Create email verification token
        const verificationToken = await createToken({
            userId: newUser.id,
            type: "verification",
            req,
        });

        // Send verification email
        await sendEmail({
            subject: "Verify Your Email Address",
            text: "",
            html: "",
            type: "verify",
            token: verificationToken,
        });

        // Return user info (exclude sensitive data)
        return new Response(
            JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                message: "Registration successful! Please check your email to verify your account.",
            }),
            {
                status: 201,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return new Response(JSON.stringify({ message: "An error occurred during registration" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
