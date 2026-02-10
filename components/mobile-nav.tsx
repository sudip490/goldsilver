"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Wallet, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-16 px-2">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors relative",
                        pathname === "/"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Home className={cn("h-6 w-6", pathname === "/" && "fill-current/20")} strokeWidth={pathname === "/" ? 2.5 : 2} />
                    <span>Home</span>
                    {pathname === "/" && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-full" />
                    )}
                </Link>

                <Link
                    href="/market"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors relative",
                        pathname === "/market"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <BarChart3 className={cn("h-6 w-6", pathname === "/market" && "fill-current/20")} strokeWidth={pathname === "/market" ? 2.5 : 2} />
                    <span>Market</span>
                    {pathname === "/market" && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-full" />
                    )}
                </Link>

                <Link
                    href="/finance-log"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors relative",
                        pathname.startsWith("/finance-log")
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <FileText className={cn("h-6 w-6", pathname.startsWith("/finance-log") && "fill-current/20")} strokeWidth={pathname.startsWith("/finance-log") ? 2.5 : 2} />
                    <span>Finance</span>
                    {pathname.startsWith("/finance-log") && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-full" />
                    )}
                </Link>

                <Link
                    href="/portfolio"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors relative",
                        pathname === "/portfolio"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Wallet className={cn("h-6 w-6", pathname === "/portfolio" && "fill-current/20")} strokeWidth={pathname === "/portfolio" ? 2.5 : 2} />
                    <span>Portfolio</span>
                    {pathname === "/portfolio" && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-full" />
                    )}
                </Link>
            </div>
        </div>
    );
}
