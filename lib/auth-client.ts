import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // baseURL is automatically detected on the client to fix "localhost" issues on Vercel
    baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})