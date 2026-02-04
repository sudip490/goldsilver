"use client";

import { authClient } from "@/lib/auth-client"; // Import the auth client
import { useState } from "react";
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/", // Redirect to home on success
            });
        } catch (err) {
            console.error("Login failed:", err);
            setError("Failed to sign in with Google. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80 border border-yellow-200/50 dark:border-yellow-500/10">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <svg
                            className="h-8 w-8 text-yellow-600 dark:text-yellow-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                            <path d="M12 18V6" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Sign in to track gold prices and manage your portfolio
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={signIn}
                        disabled={isLoading}
                        className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )}
                        <span className="text-base">
                            {isLoading ? "Signing in..." : "Sign in with Google"}
                        </span>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-slate-500 backdrop-blur-sm dark:text-slate-400">
                                Trusted by investors
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}