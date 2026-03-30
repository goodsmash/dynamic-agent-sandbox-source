import { useRoute } from "wouter"
import { AppLayout } from "@/components/layout/AppLayout"
import { Terminal } from "@/components/Terminal"
import { RightPanel } from "@/components/RightPanel"
import { useGetSession, useDeleteSession } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { useLocation } from "wouter"

export default function SessionView() {
  const [, params] = useRoute("/session/:id");
  const [, setLocation] = useLocation();
  const sessionId = params?.id;

  const { data: session, isLoading, error } = useGetSession(sessionId || "", {
    query: { enabled: !!sessionId, retry: 1 }
  });

  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession();

  const handleDelete = () => {
    if (!sessionId) return;
    if (confirm("Are you sure you want to terminate this isolate? All volatile state will be lost.")) {
      deleteSession({ sessionId }, {
        onSuccess: () => setLocation("/")
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="font-mono text-primary animate-pulse">Locating isolate...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !session) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Session Terminated or Not Found</h2>
          <p className="text-muted-foreground mb-6 font-mono text-sm max-w-md">
            The requested isolate could not be found. It may have been terminated due to inactivity or manually deleted.
          </p>
          <Button variant="outline" onClick={() => setLocation("/")}>Return to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb/Action bar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-mono text-sm">/sessions/</span>
            <span className="font-bold text-foreground">{session.name}</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-mono">
              {session.id.split('-')[0]}
            </span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 font-mono text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            {isDeleting ? "TERMINATING..." : "TERMINATE ISOLATE"}
          </Button>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {/* Main Terminal Area */}
          <Terminal sessionId={session.id} />
          
          {/* Right Inspector Panel */}
          <RightPanel sessionId={session.id} />
        </div>
      </div>
    </AppLayout>
  )
}
