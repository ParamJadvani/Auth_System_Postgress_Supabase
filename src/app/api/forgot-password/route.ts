// import db from "@/db";
// import { users } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import { createToken } from "@/lib/token-service";
// import sendEmail from "@/lib/mailer";

// export async function POST(req: Request) {
//     try {
//         const { email } = await req.json();

//         if (!email) {
//             return new Response(JSON.stringify({ message: "Email is required" }), {
//                 status: 400,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         // Find user by email
//         const user = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

//         // Don't reveal if the email exists for security reasons
//         if (!user) {
//             return new Response(
//                 JSON.stringify({
//                     message: "If this email is registered, you will receive a password reset link",
//                 }),
//                 { status: 200, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         // Generate password reset token
//         const resetToken = await createToken({
//             userId: user[0].id,
//             type: "password_reset",
//             req,
//         });

//         // Send password reset email
//         await sendEmail({
//             subject: "Reset Your Password",
//             text: "",
//             html: "",
//             type: "reset",
//             token: resetToken,
//         });

//         return new Response(
//             JSON.stringify({
//                 message: "If this email is registered, you will receive a password reset link",
//             }),
//             { status: 200, headers: { "Content-Type": "application/json" } }
//         );
//     } catch (error) {
//         console.error("Forgot password error:", error);
//         return new Response(JSON.stringify({ message: "An error occurred" }), {
//             status: 500,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }

import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "@/lib/token-service";
import sendEmail from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ message: "Email is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find user by email
        const userResults = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        // Get the first user or undefined if none found
        const user = userResults.length > 0 ? userResults[0] : undefined;

        // Don't reveal if the email exists for security reasons
        if (!user) {
            return new Response(
                JSON.stringify({
                    message: "If this email is registered, you will receive a password reset link",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // Generate password reset token
        const resetToken = await createToken({
            userId: user.id,
            type: "password_reset",
            req,
        });

        // Send password reset email
        await sendEmail({
            subject: "Reset Your Password",
            text: "",
            html: "",
            type: "reset",
            token: resetToken,
        });

        return new Response(
            JSON.stringify({
                message: "If this email is registered, you will receive a password reset link",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return new Response(JSON.stringify({ message: "An error occurred" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
