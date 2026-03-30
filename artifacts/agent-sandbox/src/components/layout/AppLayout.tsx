import React from "react"
import { Sidebar } from "./Sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        
        {children}
      </main>
    </div>
  )
}
