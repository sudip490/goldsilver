"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginDialog } from "@/components/login-dialog";
import { authClient } from "@/lib/auth-client";
import { Loader2, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserButton() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [isSignOut, setIsSignOut] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const handleSignOut = async () => {
        setIsSignOut(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh();
                },
            },
        });
        setIsSignOut(false);
    };

    if (isPending) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    if (!session) {
        return (
            <>
                <Button variant="default" size="sm" onClick={() => setShowLoginDialog(true)}>
                    Sign In
                </Button>
                <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
            </>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                        <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    {isSignOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
