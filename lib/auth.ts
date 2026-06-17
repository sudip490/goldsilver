import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

const PRODUCTION_URL = "https://goldsilver-brown.vercel.app";

// Normalize the configured base URL so the Google redirect URI is always
// exactly "<origin>/api/auth/callback/google". A trailing slash or stray
// whitespace in BETTER_AUTH_URL produces a redirect_uri_mismatch on Google,
// so we trim it and fall back to the known production origin.
const baseURL = (process.env.BETTER_AUTH_URL || PRODUCTION_URL)
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