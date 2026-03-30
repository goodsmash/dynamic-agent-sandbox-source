/**
 * WebSocket hook for connecting to the OpenClaw agent.
 *
 * Priority order:
 *   1. VITE_CLOUDFLARE_WORKER_URL — connects to your deployed Cloudflare Worker
 *      (real Durable Objects, Workers AI, V8 isolates via LOADER binding)
 *   2. Local API server WebSocket — connects to the Express WS server on Replit
 *      (real OpenAI streaming, real parallel Promise.all, workflow execution)
 *
 * Protocol: JSON messages matching TerminalMessage type:
 *   { type: "input", data: string }           ← browser → agent (command)
 *   { type: "output", data: string }           ← agent → browser (response)
 *   { type: "token", data: string }            ← agent → browser (streaming token)
 *   { type: "system", data: string }           ← agent → browser (status)
 *   { type: "error", data: string }            ← agent → browser (error)
 *   { type: "task_start"|"task_complete", ... }
 *   { type: "ping" } / { type: "pong" }
 */

import { useEffect, useRef, useState, useCallback } from "react";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export type IncomingMessage =
  | { type: "output"; data: string; isolateId?: string }
  | { type: "token"; data: string }
  | { type: "task_start"; taskId?: string }
  | { type: "task_complete"; taskId?: string; timeMs?: number; tokens?: number }
  | { type: "error"; data: string; exitCode?: number }
  | { type: "system"; data: string }
  | { type: "pong" };

interface UseAgentWebSocketOptions {
  sessionId: string;
  onMessage: (msg: IncomingMessage) => void;
  enabled?: boolean;
}

/**
 * Builds the WebSocket URL for the agent connection.
 *
 * Cloudflare: wss://your-worker.workers.dev/agents/OpenClawAgent/:sessionId
 * Local:      ws://localhost:8080/api/agents/OpenClawAgent/:sessionId
 *             (or wss://<replit-host>/api/agents/OpenClawAgent/:sessionId in Replit)
 */
function buildWsUrl(sessionId: string): string {
  const cfWorkerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string | undefined;

  if (cfWorkerUrl) {
    // Cloudflare Worker WebSocket
    const wsBase = cfWorkerUrl
      .replace(/^https?:\/\//, (m) => (m.startsWith("https") ? "wss://" : "ws://"))
      .replace(/\/$/, "");
    return `${wsBase}/agents/OpenClawAgent/${encodeURIComponent(sessionId)}`;
  }

  // Local Express WebSocket server
  // In Replit: use the same host with wss://, API is routed through /api prefix
  // In pure localhost dev: use ws://localhost:8080
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host; // e.g. "67d7...replit.dev" or "localhost:PORT"

  // In Replit the Replit proxy routes /api/* → port 8080
  // In local dev (no proxy) we need to point directly at port 8080
  // We detect "localhost" to decide
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return `ws://localhost:8080/api/agents/OpenClawAgent/${encodeURIComponent(sessionId)}`;
  }

  // Replit or custom domain — API is available under /api prefix on same host
  return `${proto}//${host}/api/agents/OpenClawAgent/${encodeURIComponent(sessionId)}`;
}

export function useAgentWebSocket({
  sessionId,
  onMessage,
  enabled = true,
}: UseAgentWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const [status, setStatus] = useState<WsStatus>("disconnected");
  const [isCloudflare, setIsCloudflare] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return;

    const wsUrl = buildWsUrl(sessionId);
    const isCF = Boolean(import.meta.env.VITE_CLOUDFLARE_WORKER_URL);
    setIsCloudflare(isCF);

    setStatus("connecting");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      reconnectCountRef.current = 0;

      // Heartbeat ping every 25 seconds
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25_000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as IncomingMessage;
        onMessageRef.current(msg);
      } catch {
        onMessageRef.current({ type: "output", data: event.data });
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      cleanup();

      // Auto-reconnect with exponential backoff (max 5 retries)
      if (reconnectCountRef.current < 5 && enabled) {
        const delay = Math.min(1000 * 2 ** reconnectCountRef.current, 30_000);
        reconnectCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };
  }, [sessionId, enabled]);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      cleanup();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect, cleanup]);

  const sendMessage = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data }));
      return true;
    }
    return false;
  }, []);

  const isConnected = status === "connected";
  const hasCloudflare = Boolean(import.meta.env.VITE_CLOUDFLARE_WORKER_URL);

  return { status, sendMessage, isConnected, hasCloudflare, isCloudflare };
}
