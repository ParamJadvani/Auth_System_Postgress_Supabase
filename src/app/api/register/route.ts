import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        if (existingUser.length > 0) {
            return new Response("Email already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
            })
            .returning();

        console.log(newUser);
        return new Response(
            JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (e) {
        const error = e as Error;
        return new Response(error.message, { status: 500 });
    }
}
