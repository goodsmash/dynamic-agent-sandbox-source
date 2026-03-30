/**
 * WebSocket Agent Server — Node.js counterpart to Cloudflare's routeAgentRequest()
 *
 * Listens for HTTP upgrade requests at:
 *   /api/agents/OpenClawAgent/:sessionId
 *
 * Each sessionId gets its own RealAgentSession instance (like a Durable Object).
 * Sessions persist in memory for the lifetime of the Node.js process.
 *
 * In production (Cloudflare), this is replaced by:
 *   routeAgentRequest() → OpenClawAgent Durable Object → real V8 isolates + Workers AI
 */

import { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RealAgentSession } from "./RealAgentSession.js";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

// In-memory registry: sessionId → RealAgentSession
const sessions = new Map<string, RealAgentSession>();

function getOrCreateSession(sessionId: string, model?: string): RealAgentSession {
  let session = sessions.get(sessionId);
  if (!session) {
    session = new RealAgentSession(sessionId, model);
    sessions.set(sessionId, session);

    // Clean up after 4 hours of no connections
    const cleanup = () => {
      setTimeout(() => {
        if ((session as RealAgentSession)["connections"].size === 0) {
          sessions.delete(sessionId);
        }
      }, 4 * 60 * 60 * 1000);
    };
    cleanup();
  }
  return session;
}

async function resolveSessionModel(sessionId: string): Promise<string | undefined> {
  try {
    const rows = await db.select({ model: sessionsTable.model })
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);
    return rows[0]?.model ?? undefined;
  } catch {
    return undefined;
  }
}

// Path pattern: /api/agents/OpenClawAgent/:sessionId
const AGENT_WS_PATTERN = /^\/api\/agents\/OpenClawAgent\/([^/?#]+)/;

export function attachWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    const url = req.url ?? "";
    const match = url.match(AGENT_WS_PATTERN);

    if (!match) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const sessionId = decodeURIComponent(match[1]);

    // Fetch model from DB so the agent uses the right model from session creation
    const model = await resolveSessionModel(sessionId);

    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      const session = getOrCreateSession(sessionId, model);

      // Lifecycle
      session.onConnect(ws);

      ws.on("message", (data) => {
        session.onMessage(ws, typeof data === "string" ? data : data.toString());
      });

      ws.on("close", () => {
        session.onClose(ws);
      });

      ws.on("error", (err) => {
        console.error(`[WS] session ${sessionId} error:`, err.message);
        session.onClose(ws);
      });
    });
  });

  console.log("[WS] Agent WebSocket server attached at /api/agents/OpenClawAgent/:sessionId");
}
