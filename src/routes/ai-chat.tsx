import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { PageHeader } from "@/components/page-shell";
import { streamAi } from "@/lib/ai-stream";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: "AI market chat — MARKETMIND" },
      {
        name: "description",
        content: "Ask anything about forex, commodities and indices — answered from live fundamentals, COT and Forex Factory news.",
      },
      { property: "og:title", content: "AI market chat — MARKETMIND" },
      { property: "og:description", content: "Chat with AI over live macro, COT and news data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What is the outlook for EURUSD this week?",
  "Which pairs have the strongest fundamental divergence?",
  "Which high-impact news this week can move gold?",
  "Summarize the USD fundamental picture.",
];

function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamAi(
        { mode: "chat", messages: next },
        (full) => {
          setMessages([...next, { role: "assistant", content: full }]);
          endRef.current?.scrollIntoView({ block: "end" });
        },
        ac.signal,
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        setError(e instanceof Error ? e.message : "AI request failed.");
        setMessages(next);
        setInput(q);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="AI market chat" subtitle="Answers from live fundamentals, COT and Forex Factory news" />
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col p-6">
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="animate-rise grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="card-luxe rounded-lg border border-border bg-card p-3 text-left text-sm hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_h3]:mt-3 [&_h3]:font-semibold [&_strong]:text-primary">
                {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="animate-pulse text-muted-foreground">Analyzing live data…</span>}
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="mt-4 flex gap-2 rounded-xl border border-border bg-card p-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Ask about any pair, commodity, index or news…"
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-lg border border-border px-4 text-sm">
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
              Send
            </button>
          )}
        </form>
      </div>
    </>
  );
}
