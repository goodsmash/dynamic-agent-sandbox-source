import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Terminal } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center text-center p-8">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20">
          <Terminal className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-8xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-4 tracking-tight">Endpoint Not Found</h2>
        <p className="text-muted-foreground font-mono text-sm max-w-md mb-8 leading-relaxed">
          The requested route does not exist in the current isolated environment. Please verify your path and try again.
        </p>
        <Link href="/">
          <Button size="lg" variant="neon" className="font-mono">
            RETURN_TO_SYSTEM_ROOT
          </Button>
        </Link>
      </div>
    </div>
  )
}
