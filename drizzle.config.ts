import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://postgres.uteueyiotlikjjrydiwo:QkNcQ9UJIBAJpDse@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    },
});
