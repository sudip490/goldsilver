"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-16 px-2">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors",
                        pathname === "/"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <LayoutDashboard className={cn("h-6 w-6", pathname === "/" && "fill-current/20")} strokeWidth={pathname === "/" ? 2.5 : 2} />
                    <span>Home</span>
                </Link>

                <Link
                    href="/portfolio/add"
                    className="flex flex-col items-center justify-center flex-1 h-full -mt-6"
                >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all ring-4 ring-background">
                        <Plus className="h-7 w-7" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1">Add</span>
                </Link>

                <Link
                    href="/portfolio"
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-colors",
                        pathname === "/portfolio"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Wallet className={cn("h-6 w-6", pathname === "/portfolio" && "fill-current/20")} strokeWidth={pathname === "/portfolio" ? 2.5 : 2} />
                    <span>Portfolio</span>
                </Link>
            </div>
        </div>
    );
}
