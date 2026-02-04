"use client";

import { authClient } from "@/lib/auth-client";
import { LoginDialog } from "@/components/login-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { data: session, isPending } = authClient.useSession();
    const [showLoginDialog, setShowLoginDialog] = useState(true);

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="text-center space-y-6 p-8">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <svg
                            className="h-10 w-10 text-yellow-600 dark:text-yellow-500"
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
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Authentication Required
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Please sign in to access your portfolio
                        </p>
                    </div>
                </div>
                <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
            </div>
        );
    }

    return <>{children}</>;
}
