/**
 * WebSocket Agent Server — Multi-agent router
 *
 * Routes WebSocket connections to the correct agent class:
 *   /api/agents/OpenClawAgent/:sessionId  → RealAgentSession (full-featured)
 *   /api/agents/NanoClawAgent/:sessionId  → NanoClawSession (fast/lightweight)
 *   /api/agents/NemoClawAgent/:sessionId  → NemoClawSession (deep reasoning)
 *
 * Each sessionId gets its own agent instance (mirrors Cloudflare Durable Objects).
 * Sessions persist in memory for the lifetime of the Node.js process.
 *
 * On Cloudflare: routeAgentRequest() distributes to separate DO classes per agent type.
 */

import { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RealAgentSession } from "./RealAgentSession.js";
import { NanoClawSession } from "./NanoClawSession.js";
import { NemoClawSession } from "./NemoClawSession.js";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

type AnySession = RealAgentSession | NanoClawSession | NemoClawSession;

const openClawSessions = new Map<string, RealAgentSession>();
const nanoClawSessions = new Map<string, NanoClawSession>();
const nemoClawSessions = new Map<string, NemoClawSession>();

function scheduleCleanup<T extends AnySession>(
  map: Map<string, T>,
  sessionId: string,
  session: T
): void {
  setTimeout(() => {
    if ((session as any)["connections"]?.size === 0) {
      map.delete(sessionId);
    }
  }, 4 * 60 * 60 * 1000);
}

function getOrCreateOpenClaw(sessionId: string, model?: string): RealAgentSession {
  let s = openClawSessions.get(sessionId);
  if (!s) {
    s = new RealAgentSession(sessionId, model);
    openClawSessions.set(sessionId, s);
    scheduleCleanup(openClawSessions, sessionId, s);
  }
  return s;
}

function getOrCreateNanoClaw(sessionId: string, model?: string): NanoClawSession {
  let s = nanoClawSessions.get(sessionId);
  if (!s) {
    s = new NanoClawSession(sessionId, model);
    nanoClawSessions.set(sessionId, s);
    scheduleCleanup(nanoClawSessions, sessionId, s);
  }
  return s;
}

function getOrCreateNemoClaw(sessionId: string, model?: string): NemoClawSession {
  let s = nemoClawSessions.get(sessionId);
  if (!s) {
    s = new NemoClawSession(sessionId, model);
    nemoClawSessions.set(sessionId, s);
    scheduleCleanup(nemoClawSessions, sessionId, s);
  }
  return s;
}

interface SessionRow {
  model: string;
  agentType?: string | null;
}

async function resolveSession(sessionId: string): Promise<SessionRow | undefined> {
  try {
    const rows = await db
      .select({ model: sessionsTable.model, agentType: sessionsTable.agentType })
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);
    return rows[0] as SessionRow | undefined;
  } catch {
    return undefined;
  }
}

const PATTERNS: Array<{ pattern: RegExp; agentType: string }> = [
  { pattern: /^\/api\/agents\/OpenClawAgent\/([^/?#]+)/, agentType: "openclaw" },
  { pattern: /^\/api\/agents\/NanoClawAgent\/([^/?#]+)/, agentType: "nanoclaw" },
  { pattern: /^\/api\/agents\/NemoClawAgent\/([^/?#]+)/, agentType: "nemoclaw" },
];

function connectSession(agentType: string, sessionId: string, model?: string): AnySession {
  switch (agentType) {
    case "nanoclaw":
      return getOrCreateNanoClaw(sessionId, model);
    case "nemoclaw":
      return getOrCreateNemoClaw(sessionId, model);
    default:
      return getOrCreateOpenClaw(sessionId, model);
  }
}

export function attachWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    const url = req.url ?? "";

    let sessionId: string | null = null;
    let agentTypeFromUrl = "openclaw";

    for (const { pattern, agentType } of PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        sessionId = decodeURIComponent(match[1]);
        agentTypeFromUrl = agentType;
        break;
      }
    }

    if (!sessionId) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const row = await resolveSession(sessionId);
    const model = row?.model;
    const agentType = row?.agentType || agentTypeFromUrl;

    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      const session = connectSession(agentType, sessionId!, model);

      session.onConnect(ws);

      ws.on("message", (data) => {
        session.onMessage(ws, typeof data === "string" ? data : data.toString());
      });

      ws.on("close", () => session.onClose(ws));
      ws.on("error", (err) => {
        console.error(`[WS] session ${sessionId} error:`, err.message);
        session.onClose(ws);
      });
    });
  });

  console.log("[WS] Multi-agent WebSocket server attached:");
  console.log("  /api/agents/OpenClawAgent/:id  → OpenClaw (full-featured)");
  console.log("  /api/agents/NanoClawAgent/:id  → NanoClaw (ultra-fast)");
  console.log("  /api/agents/NemoClawAgent/:id  → NemoClaw (deep reasoning)");
}
