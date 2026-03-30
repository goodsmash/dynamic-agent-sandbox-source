import http from "http";
import app from "./app.js";
import { attachWebSocketServer } from "./agent/wsServer.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create an HTTP server wrapping Express so we can attach the WebSocket server.
// The WebSocket server handles /api/agents/OpenClawAgent/:sessionId upgrades.
const httpServer = http.createServer(app);

// Attach the WebSocket agent server (mirrors Cloudflare's routeAgentRequest)
attachWebSocketServer(httpServer);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
