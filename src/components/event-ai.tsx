import { useState } from "react";

import { streamAi } from "@/lib/ai-stream";

type Ev = { title: string; country: string; date: string; impact: string; forecast?: string; previous?: string };

export function EventAi({ event }: { event: Ev }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setOpen(true);
    if (text || busy) return;
    setBusy(true);
    try {
      await streamAi({ mode: "event", event }, setText);
    } catch (e) {
      setText(e instanceof Error ? e.message : "AI failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : go())}
        className="ml-2 rounded border border-primary/40 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
      >
        AI
      </button>
      {open && (
        <div className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-background/60 p-2 text-xs text-muted-foreground">
          {text || "AI is analyzing…"}
        </div>
      )}
    </>
  );
}
