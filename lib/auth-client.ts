import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // baseURL is automatically detected if not provided
    // This fixes "localhost" issues on Vercel
    baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})