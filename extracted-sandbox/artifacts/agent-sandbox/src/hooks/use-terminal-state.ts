import { useState, useRef, useEffect, useCallback } from "react";
import { type HistoryEntry } from "@workspace/api-client-react";

export interface TerminalEntry {
  id: string;
  type: "input" | "output" | "system" | "error";
  content: string;
  timestamp: Date;
  executionTimeMs?: number;
}

export function useTerminalState(initialHistory: HistoryEntry[] = []) {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize from history
  useEffect(() => {
    if (initialHistory.length > 0 && entries.length === 0) {
      const mapped: TerminalEntry[] = initialHistory.flatMap(h => [
        {
          id: `in-${h.id}`,
          type: "input",
          content: h.command,
          timestamp: new Date(h.executedAt)
        },
        {
          id: `out-${h.id}`,
          type: h.exitCode === 0 ? "output" : "error",
          content: h.output,
          timestamp: new Date(h.executedAt),
          executionTimeMs: h.executionTimeMs
        }
      ]);
      setEntries(mapped);
    }
  }, [initialHistory, entries.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [entries, scrollToBottom]);

  const appendEntry = useCallback((entry: Omit<TerminalEntry, "id" | "timestamp">) => {
    setEntries(prev => [...prev, {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    }]);
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    appendEntry,
    clear,
    scrollRef,
    scrollToBottom
  };
}
