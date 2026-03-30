import * as React from "react"
import { cn } from "@/lib/utils"

export function Dialog({ open, onOpenChange, children }: { open?: boolean, onOpenChange?: (open: boolean) => void, children: React.ReactNode }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={() => onOpenChange?.(false)} 
      />
      {children}
    </div>
  )
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "relative z-50 grid w-full max-w-lg gap-4 bg-card border border-border p-6 shadow-xl shadow-black/50 sm:rounded-xl animate-in fade-in-90 zoom-in-95",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)} {...props} />
}
