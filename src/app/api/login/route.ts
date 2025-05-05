import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const POST = async (req: Request) => {
    const { email, password } = await req.json();

    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (user.length === 0) {
        return new Response("Invalid email", { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) {
        return new Response("Invalid password", { status: 400 });
    }

    console.log(user);

    return new Response(
        JSON.stringify({
            id: user[0].id,
            name: user[0].name,
            email: user[0].email,
            role: user[0].role,
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
};
