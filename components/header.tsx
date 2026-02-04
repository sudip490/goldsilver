"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useRefresh } from "@/contexts/refresh-context";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles, LayoutDashboard, PieChart, RefreshCw, Menu, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/user-button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginDialog } from "@/components/login-dialog";


export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { isRefreshing, refresh } = useRefresh();
    const { data: session } = authClient.useSession();
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

    const routes = [
        {
            href: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/",
        },
        {
            href: "/portfolio",
            label: "Portfolio",
            icon: PieChart,
            active: pathname === "/portfolio",
        },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-8">
                    {/* Mobile Menu */}
                    <div className="md:hidden flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                                    <Menu className="h-5 w-5" />
                                    <span className="absolute top-0 right-0 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" hideDefaultClose className="w-[300px] p-0 flex flex-col gap-0">
                                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                                {/* Custom Header */}
                                <div className="flex items-center gap-4 p-4 border-b">
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <X className="h-5 w-5" />
                                            <span className="sr-only">Close</span>
                                        </Button>
                                    </SheetClose>
                                    <Link href="/" className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
                                            <Sparkles className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent dark:from-yellow-400 dark:to-yellow-200">
                                            GoldSilverTracker
                                        </span>
                                    </Link>
                                </div>

                                {/* Orange Separator Line */}
                                <div className="h-1 w-full bg-gradient-to-r from-yellow-500 to-orange-500" />

                                <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
                                    {routes.map((route) => (
                                        <SheetClose asChild key={route.href}>
                                            <Link
                                                href={route.href}
                                                className={cn(
                                                    "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                                    route.active
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                <route.icon className="h-5 w-5" />
                                                {route.label}
                                            </Link>
                                        </SheetClose>
                                    ))}

                                    <div className="my-2 px-4">
                                        <div className="h-px bg-border" />
                                    </div>

                                    {session ? (
                                        <>
                                            <div className="px-4 py-2 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border">
                                                        <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                                                        <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <p className="font-medium text-sm">{session.user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                            {session.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <SheetClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    onClick={handleSignOut}
                                                    disabled={isSignOut}
                                                >
                                                    <LogOut className="mr-3 h-5 w-5" />
                                                    <span>{isSignOut ? "Logging out..." : "Log out"}</span>
                                                </Button>
                                            </SheetClose>
                                        </>
                                    ) : (
                                        <SheetClose asChild>
                                            <Button
                                                variant="ghost"
                                                className="justify-start px-4"
                                                onClick={() => setShowLoginDialog(true)}
                                            >
                                                <User className="mr-3 h-5 w-5" />
                                                <span>Sign In</span>
                                            </Button>
                                        </SheetClose>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-lg font-bold tracking-tight bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent dark:from-yellow-400 dark:to-yellow-200">
                                GoldSilverTracker
                            </h1>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    route.active
                                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                )}
                            >
                                <route.icon className="h-4 w-4" />
                                {route.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">


                    {/* Desktop Refresh Button with Live Indicator */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="hidden md:flex items-center gap-1 pl-3 md:pr-5 relative"
                    >
                        <RefreshCw className={cn("h-4 w-4 md:mr-2", isRefreshing && "animate-spin")} />
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>Refresh</span>
                    </Button>


                    <ModeToggle />


                    <div className="hidden md:block">
                        <UserButton />
                    </div>

                    <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
                </div>
            </div>
        </header>
    );
}
