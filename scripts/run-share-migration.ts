import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function runMigration() {
    try {
        console.log("Running migration: add_share_token_to_khata_party.sql");

        const migrationSQL = fs.readFileSync("./migrations/add_share_token_to_khata_party.sql", "utf-8");

        // Split by semicolon and run each statement
        const statements = migrationSQL
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith("--"));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.execute(sql.raw(statement));
        }

        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
