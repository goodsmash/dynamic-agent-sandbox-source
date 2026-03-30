import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "neon"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-border bg-background hover:bg-white/5 hover:border-white/20": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-white/10 hover:text-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "bg-transparent border border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-[0_0_10px_rgba(0,255,255,0.2)]": variant === "neon",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
