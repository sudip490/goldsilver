import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

const PRODUCTION_URL = "https://goldsilver-brown.vercel.app";
const DEV_URL = "http://localhost:3000";

// The Google redirect URI is built as `<baseURL>/api/auth/callback/google`
// and must EXACTLY match a URI registered in the Google console. To make this
// immune to a misconfigured BETTER_AUTH_URL in Vercel, production is pinned to
// the registered origin; dev uses the env var (or localhost) so other setups
// still work. Value is trimmed and stripped of trailing slashes.
const baseURL = (
    process.env.NODE_ENV === "production"
        ? PRODUCTION_URL
        : (process.env.BETTER_AUTH_URL || DEV_URL)
)
    .trim()
    .replace(/\/+$/, "");

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema
    }),

    baseURL,
    trustedOrigins: [
        "https://goldsilver-brown.vercel.app",
        "http://localhost:3000"
    ],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
});