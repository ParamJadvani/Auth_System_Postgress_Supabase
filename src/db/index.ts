import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString:
        "postgresql://postgres.uteueyiotlikjjrydiwo:QkNcQ9UJIBAJpDse@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
});

const db = drizzle({ client: pool });

export default db;
