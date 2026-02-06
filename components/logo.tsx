
import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    withText?: boolean;
}

export function Logo({ className, withText = true, ...props }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                {...props}
            >
                <defs>
                    <linearGradient id="goldGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FCD34D" /> {/* amber-300 */}
                        <stop offset="50%" stopColor="#F59E0B" /> {/* amber-500 */}
                        <stop offset="100%" stopColor="#B45309" /> {/* amber-700 */}
                    </linearGradient>
                    <linearGradient id="silverGradient" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#E2E8F0" /> {/* slate-200 */}
                        <stop offset="50%" stopColor="#94A3B8" /> {/* slate-400 */}
                        <stop offset="100%" stopColor="#475569" /> {/* slate-600 */}
                    </linearGradient>
                </defs>

                {/* Gold Coin Backdrop */}
                <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" />

                {/* Inner Ring for Detail */}
                <circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.3" fill="none" />

                {/* Silver Graph / Mountain */}
                <path
                    d="M25 65 L40 45 L55 55 L75 30"
                    stroke="url(#silverGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Arrow Head */}
                <path
                    d="M65 30 H75 V40"
                    stroke="url(#silverGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Sparkle/Shine */}
                <path
                    d="M75 20 L78 28 L86 31 L78 34 L75 42 L72 34 L64 31 L72 28 Z"
                    fill="white"
                />
            </svg>

            {withText && (
                <div className="flex items-center leading-none font-bold text-lg tracking-tight ml-1">
                    <span className="text-amber-500">Gold</span>
                    <span className="text-slate-500 dark:text-slate-300">Silver</span>
                    <span className="text-slate-800 dark:text-slate-100">Tracker</span>
                </div>
            )}
        </div>
    );
}
