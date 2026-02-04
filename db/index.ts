import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from "@neondatabase/serverless";
import { setGlobalDispatcher, Agent } from 'undici';
import * as schema from "./schema";

// Force IPv4 to fix Neon connection issues
setGlobalDispatcher(new Agent({
    connect: {
        family: 4
    }
}));

config({ path: ".env" }); // or .env.local

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
