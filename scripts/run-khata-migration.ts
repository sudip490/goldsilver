import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runKhataMigration() {
    try {
        console.log("Running Khata migration...");

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, "..", "migrations", "khata-manual.sql"),
            "utf-8"
        );

        // Split by semicolon and filter out empty statements
        const statements = migrationSQL
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith("--"));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.execute(sql.raw(statement));
        }

        console.log("✅ Khata migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runKhataMigration();
