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

const AGENT_COLORS: Record<string, string> = {
  openclaw: "text-primary/70",
  nanoclaw: "text-cyan-400/70",
  nemoclaw: "text-purple-400/70",
};

const AGENT_LABELS: Record<string, string> = {
  openclaw: "OpenClaw",
  nanoclaw: "NanoClaw",
  nemoclaw: "NemoClaw",
};

export function Terminal({ sessionId, agentType = "openclaw" }: { sessionId: string; agentType?: string }) {
  const cfWorkerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string | undefined;
  const [refreshKey, setRefreshKey] = useState(0);

  const { status } = useAgentWebSocket({
    sessionId,
    agentType,
    onMessage: () => {},
    enabled: false,
  });

  const handleClear = () => {
    setRefreshKey((k) => k + 1);
  };

  const agentColor = AGENT_COLORS[agentType] ?? "text-primary/70";
  const agentLabel = AGENT_LABELS[agentType] ?? agentType;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#050508] font-mono text-sm">
      {/* Terminal Header Bar */}
      <div className="h-10 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-muted-foreground/70 text-xs">
          <TermIcon className="w-4 h-4" />
          <span className={agentColor}>{agentLabel.toLowerCase()}@sandbox</span>
          {cfWorkerUrl ? (
            <span className="text-[10px] opacity-60 truncate max-w-[200px]">{cfWorkerUrl}</span>
          ) : (
            <span className={`text-[10px] ${agentColor}`}>{agentLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {cfWorkerUrl ? (
            <ConnectionBadge status={status} />
          ) : (
            <span className={`flex items-center gap-1.5 text-xs ${agentColor}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              LIVE AI
            </span>
          )}

          <span className={`flex items-center gap-1.5 text-xs ${agentColor}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            ISOLATE
          </span>
        </div>
      </div>

      {/* Real xterm.js terminal — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden p-1">
        <XTerminal key={refreshKey} sessionId={sessionId} agentType={agentType} />
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
