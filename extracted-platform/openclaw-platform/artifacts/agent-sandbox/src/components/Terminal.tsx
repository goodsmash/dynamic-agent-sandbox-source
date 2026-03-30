/**
 * Terminal — outer shell with header bar + real xterm.js terminal
 *
 * Wraps XTerminal (real @xterm/xterm) with a header bar showing
 * connection status, isolate indicator, and a clear button.
 */

import { useState } from "react";
import { Terminal as TermIcon, Wifi, WifiOff, Loader2 } from "lucide-react";
import { XTerminal } from "./XTerminal";
import { useAgentWebSocket } from "@/hooks/use-agent-websocket";

export function Terminal({ sessionId }: { sessionId: string }) {
  const cfWorkerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string | undefined;
  const [refreshKey, setRefreshKey] = useState(0);

  const { status } = useAgentWebSocket({
    sessionId,
    onMessage: () => {},
    enabled: false, // Only used here for status display; XTerminal manages its own connection
  });

  const handleClear = () => {
    // Re-mount XTerminal to reset the terminal buffer
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#050508] font-mono text-sm">
      {/* Terminal Header Bar */}
      <div className="h-10 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-muted-foreground/70 text-xs">
          <TermIcon className="w-4 h-4" />
          <span>openclaw@sandbox</span>
          {cfWorkerUrl ? (
            <span className="text-[10px] opacity-60 truncate max-w-[200px]">{cfWorkerUrl}</span>
          ) : (
            <span className="text-[10px] text-yellow-500/70">HTTP mode</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status indicator */}
          {cfWorkerUrl ? (
            <ConnectionBadge status={status} />
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-yellow-500/70">
              <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
              LOCAL
            </span>
          )}

          {/* Active isolate indicator */}
          <span className="flex items-center gap-1.5 text-xs text-primary/70">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(57,255,20,0.5)]" />
            ISOLATE
          </span>
        </div>
      </div>

      {/* Real xterm.js terminal — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden p-1">
        <XTerminal key={refreshKey} sessionId={sessionId} />
      </div>
    </div>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-primary/80">
        <Wifi className="w-3.5 h-3.5" />
        CF CONNECTED
      </span>
    );
  }

  if (status === "connecting") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-400/80">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        CONNECTING
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive/80">
        <WifiOff className="w-3.5 h-3.5" />
        WS ERROR
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
      <WifiOff className="w-3.5 h-3.5" />
      DISCONNECTED
    </span>
  );
}
