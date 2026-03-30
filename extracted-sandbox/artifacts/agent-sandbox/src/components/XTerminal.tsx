/**
 * XTerminal — Real xterm.js terminal component
 *
 * Renders a proper VT100/xterm terminal in the browser using @xterm/xterm.
 * Connects to the Cloudflare Worker via WebSocket when VITE_CLOUDFLARE_WORKER_URL
 * is configured, otherwise falls back to the Express API (HTTP mode).
 *
 * Features:
 * - Full ANSI/VT100 escape code rendering (colors, bold, cursor movement)
 * - Auto-resize with FitAddon (fills its container)
 * - WebSocket real-time I/O to OpenClawAgent Durable Object
 * - HTTP fallback to Express backend
 *
 * Input handling fix:
 * - handleCommandRef pattern avoids stale closure inside term.onData
 *   (critical in React Strict Mode where effects can re-run)
 */

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useAgentWebSocket } from "@/hooks/use-agent-websocket";
import { useExecuteCommand } from "@workspace/api-client-react";
import "@xterm/xterm/css/xterm.css";

interface XTerminalProps {
  sessionId: string;
  agentType?: string;
  initialCommand?: string;
}

export function XTerminal({ sessionId, agentType = "openclaw", initialCommand }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef("");
  const { mutateAsync: executeHttp } = useExecuteCommand();

  // WebSocket connection to agent (OpenClaw, NanoClaw, or NemoClaw)
  const { sendMessage, isConnected, hasCloudflare, status } = useAgentWebSocket({
    sessionId,
    agentType,
    onMessage: (msg) => {
      const term = xtermRef.current;
      if (!term) return;
      if (msg.type === "pong") return;

      // Handle streaming tokens (no newline — just append to current line)
      if (msg.type === "token") {
        term.write(msg.data);
        return;
      }

      // Write message to terminal — xterm.js handles all ANSI codes natively
      term.write(msg.data.replace(/\n/g, "\r\n") + "\r\n");

      // After output is done, re-display the prompt
      if (msg.type === "task_complete" || msg.type === "system") {
        // handled by agent writing prompt itself
        return;
      }
    },
  });

  // Use a ref to hold the current command handler to avoid stale closure
  // This is the critical fix: term.onData captures handleCommandRef.current
  // not a potentially-stale function instance.
  const handleCommandRef = useRef<(command: string) => void>(() => {});

  // Update the ref whenever the connection state changes
  handleCommandRef.current = async (command: string) => {
    const term = xtermRef.current;
    if (!term) return;

    // If WebSocket is connected (Cloudflare OR local Express WS), send through WS.
    // The local WS server provides real AI streaming — no HTTP fallback needed.
    if (isConnected) {
      const sent = sendMessage(command);
      if (sent) {
        // Response arrives via onMessage WS callback — agent echoes command back
        return;
      }
    }

    // HTTP fallback — only used if WebSocket isn't connected yet
    term.writeln(`\x1b[90m[HTTP fallback — WS connecting...] ${command}\x1b[0m`);

    try {
      const result = await executeHttp({
        sessionId,
        data: { command },
      });

      if (result.exitCode === 0) {
        term.writeln(result.output.replace(/\n/g, "\r\n"));
      } else {
        term.writeln(`\x1b[31m${result.output.replace(/\n/g, "\r\n")}\x1b[0m`);
      }

      term.writeln(
        `\x1b[90m[exit:${result.exitCode} | ${result.executionTimeMs ?? 0}ms]\x1b[0m`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Command failed";
      term.writeln(`\x1b[31mError: ${msg}\x1b[0m`);
    }

    writePrompt(term);
  };

  // Initialize xterm.js terminal
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: "block",
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.5,
      theme: {
        background: "#050508",
        foreground: "#d4d4d4",
        cursor: "#39ff14",
        cursorAccent: "#050508",
        selectionBackground: "#39ff1430",
        black: "#1e1e2e",
        red: "#f38ba8",
        green: "#39ff14",
        yellow: "#f9e2af",
        blue: "#89b4fa",
        magenta: "#cba6f7",
        cyan: "#89dceb",
        white: "#cdd6f4",
        brightBlack: "#585b70",
        brightRed: "#f38ba8",
        brightGreen: "#a6e3a1",
        brightYellow: "#f9e2af",
        brightBlue: "#89b4fa",
        brightMagenta: "#cba6f7",
        brightCyan: "#89dceb",
        brightWhite: "#a6adc8",
      },
      allowProposedApi: true,
      scrollback: 10_000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Print welcome banner
    const cfUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
    term.writeln("\x1b[32m╔═══════════════════════════════════════════════════════╗\x1b[0m");
    term.writeln("\x1b[32m║\x1b[0m    \x1b[1mOpenClaw Agent Platform\x1b[0m — V8 Isolate Runtime    \x1b[32m║\x1b[0m");
    term.writeln("\x1b[32m╚═══════════════════════════════════════════════════════╝\x1b[0m");
    term.writeln("");

    const agentDoClass =
      agentType === "nanoclaw"  ? "NanoClawAgent"  :
      agentType === "nemoclaw"  ? "NemoClawAgent"  :
      agentType === "swarmclaw" ? "SwarmClawAgent" :
      "OpenClawAgent";
    const agentLabel =
      agentType === "nanoclaw"  ? "Flash"  :
      agentType === "nemoclaw"  ? "Nexus"  :
      agentType === "swarmclaw" ? "Swarm"  :
      "Scout";
    const agentColor =
      agentType === "nanoclaw"  ? "\x1b[36m" :
      agentType === "nemoclaw"  ? "\x1b[35m" :
      agentType === "swarmclaw" ? "\x1b[33m" :
      "\x1b[32m";

    if (cfUrl) {
      term.writeln(`\x1b[90mCloudflare Worker: \x1b[33m${cfUrl}\x1b[0m`);
      term.writeln(`\x1b[90mAgent: ${agentColor}${agentLabel}\x1b[0m`);
      term.writeln(`\x1b[90mSession: \x1b[36m${sessionId}\x1b[0m`);
      term.writeln(`\x1b[90mWS: /agents/${agentDoClass}/${sessionId}\x1b[0m`);
      term.writeln("\x1b[90mConnecting to Durable Object... (real Workers AI + V8 isolates)\x1b[0m");
    } else {
      term.writeln(`\x1b[90mAgent: ${agentColor}${agentLabel}\x1b[0m`);
      term.writeln(`\x1b[90mSession: \x1b[36m${sessionId}\x1b[0m`);
      term.writeln(`\x1b[90mWS: /api/agents/${agentDoClass}/${sessionId}\x1b[0m`);
      term.writeln(`${agentColor}✓  ${agentLabel} active\x1b[0m \x1b[90m(real AI — no simulation)\x1b[0m`);
      term.writeln("\x1b[90m   Parallel calls → Promise.all | Streaming → real tokens\x1b[0m");
      term.writeln("\x1b[90m   Deploy cloudflare-worker/ for real V8 isolates + Workers AI\x1b[0m");
    }

    term.writeln("");
    term.writeln("\x1b[90mType 'help' for commands. chat, parallel N task, workflow run <id>\x1b[0m");
    term.writeln("");

    // Handle keyboard input — collect characters into a line buffer.
    //
    // Deduplication: xterm.js fires onData via BOTH:
    //   (a) keydown events → one char at a time
    //   (b) textarea input events → the full accumulated string at once
    // This causes the classic "helphelp" / "workflow listworkflow list" doubling
    // in automated tests (Playwright fill()) and rapid paste operations.
    //
    // Fix: when a multi-char data chunk arrives that is already the suffix of
    // our current buffer, it is a duplicate from the input event — skip it.
    // When it's genuinely new multi-char data (paste into empty buffer), process it.
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Arrow keys and other escape sequences — ignore silently
      if (data.startsWith("\x1b")) return;

      // --- Multi-character data (paste, programmatic fill, or input event duplicate) ---
      if (data.length > 1) {
        // Check for duplicate: if the buffer already ends with this string,
        // this is the textarea input event echoing what keydown already processed.
        if (inputBufferRef.current.length >= data.length &&
            inputBufferRef.current.endsWith(data)) {
          return; // duplicate — skip
        }

        // Check if data contains a newline → treat as submitted command
        const newlineIdx = data.indexOf("\r") === -1 ? data.indexOf("\n") : data.indexOf("\r");
        if (newlineIdx !== -1) {
          const before = data.slice(0, newlineIdx);
          for (const ch of before) {
            const c = ch.charCodeAt(0);
            if (c >= 32) { inputBufferRef.current += ch; term.write(ch); }
          }
          term.write("\r\n");
          const command = inputBufferRef.current.trim();
          inputBufferRef.current = "";
          if (command) handleCommandRef.current(command);
          else writePrompt(term);
          return;
        }

        // Genuine paste — add each printable char to buffer
        for (const ch of data) {
          const c = ch.charCodeAt(0);
          if (c >= 32) { inputBufferRef.current += ch; term.write(ch); }
        }
        return;
      }

      // --- Single character input (standard keyboard typing) ---

      // Enter key (carriage return)
      if (data === "\r" || data === "\n") {
        term.write("\r\n");
        const command = inputBufferRef.current.trim();
        inputBufferRef.current = "";

        if (command) {
          handleCommandRef.current(command);
        } else {
          writePrompt(term);
        }
        return;
      }

      // Backspace
      if (code === 127 || data === "\x08") {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write("\x1b[D \x1b[D");
        }
        return;
      }

      // Ctrl+C — cancel current input
      if (data === "\x03") {
        term.write("^C\r\n");
        inputBufferRef.current = "";
        writePrompt(term);
        return;
      }

      // Ctrl+L — clear screen
      if (data === "\x0c") {
        term.clear();
        writePrompt(term);
        return;
      }

      // Ignore remaining control characters
      if (code < 32) return;

      // Normal printable character — echo to terminal and add to buffer
      inputBufferRef.current += data;
      term.write(data);
    });

    writePrompt(term);

    // Resize observer — keep terminal sized to container
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // Ignore resize errors during unmount
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      inputBufferRef.current = "";
    };
  // Only re-run if sessionId changes (mounts a fresh terminal per session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Show WebSocket connection status updates in the terminal
  useEffect(() => {
    const term = xtermRef.current;
    if (!term || !hasCloudflare) return;

    if (status === "connected") {
      term.writeln("\r\x1b[32m✓ WebSocket connected to Durable Object\x1b[0m\r");
      writePrompt(term);
    } else if (status === "disconnected") {
      term.writeln("\r\x1b[33m⟳ WebSocket disconnected — reconnecting...\x1b[0m\r");
    } else if (status === "error") {
      term.writeln("\r\x1b[31m✗ WebSocket error — check VITE_CLOUDFLARE_WORKER_URL\x1b[0m\r");
    }
  }, [status, hasCloudflare]);

  // Auto-send initialCommand once connected (for swarm blueprint launch from Swarm page)
  const initialCmdSentRef = useRef(false);
  useEffect(() => {
    if (!initialCommand || initialCmdSentRef.current) return;
    if (!isConnected) return;
    // Small delay to let the agent's welcome message render first
    const timer = setTimeout(() => {
      if (initialCmdSentRef.current) return;
      initialCmdSentRef.current = true;
      const sent = sendMessage(initialCommand);
      if (!sent) return;
      const term = xtermRef.current;
      if (term) {
        term.writeln(`\x1b[90m[auto] ${initialCommand}\x1b[0m`);
      }
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, initialCommand]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full"
      style={{ minHeight: 0 }}
    />
  );
}

function writePrompt(term: XTerm) {
  term.write("\x1b[32magent@openclaw:~$\x1b[0m ");
}
