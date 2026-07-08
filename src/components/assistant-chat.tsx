"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type Msg = { role: "user" | "assistant"; text: string; sources?: string[] };

const SUGGESTIONS = [
  "When do admissions close?",
  "What is the attendance policy?",
  "How do I pay my fees?",
  "Tell me about hostels and outpasses",
  "What were last year's placement stats?",
];

export function AssistantChat({ compact = false, personal = false }: { compact?: boolean; personal?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? "Something went wrong.", sources: data.sources }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "I couldn't reach the assistant service. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = personal
    ? ["What's my attendance?", "Do I owe any fees?", "What classes do I have today?", "What's my CGPA?", ...SUGGESTIONS.slice(0, 2)]
    : SUGGESTIONS;

  return (
    <div className={`flex flex-col ${compact ? "h-[420px]" : "h-[560px]"}`}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Icon name="sparkles" className="size-6" />
            </span>
            <p className="mt-3 font-semibold">Aurora Assistant</p>
            <p className="mt-1 max-w-xs text-[13px] text-muted">
              Grounded in published university content{personal ? " and your own records" : ""} — it won't guess.
            </p>
            <div className="mt-4 flex max-w-sm flex-wrap justify-center gap-2">
              {suggestions.slice(0, compact ? 4 : 6).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 px-4 py-2.5 text-[13.5px] text-white">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 text-[13.5px]">
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <p className="mt-2 border-t border-line pt-2 text-[11px] text-muted">
                    Sources: {m.sources.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="flex items-center gap-2 pl-2 text-[13px] text-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-primary-500" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about admissions, fees, hostels…"
          aria-label="Message the assistant"
          className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
        >
          <Icon name="send" className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}

/** Floating launcher for the public site. */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Ask Aurora Assistant"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary-600 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-pop transition-transform hover:scale-105 active:scale-95"
      >
        <Icon name={open ? "x" : "sparkles"} className="size-5" />
        {!open && <span className="hidden sm:inline">Ask Aurora</span>}
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[min(94vw,400px)] animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-3">
            <Icon name="sparkles" className="size-4 text-primary-600" />
            <span className="text-sm font-semibold">Aurora Assistant</span>
            <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-800 dark:bg-primary-950 dark:text-primary-300">
              Beta
            </span>
          </div>
          <AssistantChat compact />
        </div>
      )}
    </>
  );
}
