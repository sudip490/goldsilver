
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/contexts/privacy-context";

interface PrivacyBlurProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    blurIntensity?: "sm" | "md" | "lg";
}

export function PrivacyBlur({ children, className, blurIntensity = "md", ...props }: PrivacyBlurProps) {
    const { isPrivacyMode } = usePrivacy();

    return (
        <span
            className={cn(
                "transition-all duration-300",
                isPrivacyMode && "filter blur-md select-none hover:blur-none cursor-pointer", // Added hover interaction
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
