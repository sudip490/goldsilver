"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRefresh } from "@/contexts/refresh-context";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles, LayoutDashboard, PieChart, RefreshCw, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/user-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
    const pathname = usePathname();
    const { isRefreshing, refresh } = useRefresh();

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
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent dark:from-yellow-400 dark:to-yellow-200">
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
                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {routes.map((route) => (
                                    <DropdownMenuItem key={route.href} asChild>
                                        <Link
                                            href={route.href}
                                            className={cn(
                                                "flex items-center gap-2 w-full cursor-pointer",
                                                route.active ? "bg-accent" : ""
                                            )}
                                        >
                                            <route.icon className="h-4 w-4" />
                                            {route.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <span className="relative flex h-2 w-2" title="Live Updates">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-muted-foreground font-medium hidden md:inline">Live Updates</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="px-2 md:px-3"
                    >
                        <RefreshCw className={`h-4 w-4 md:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </Button>
                    <ModeToggle />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}
