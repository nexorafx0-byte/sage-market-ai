import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { journalEntries } from "@/lib/mock-data";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "AI Journal — Trading Analyzer AI" },
      {
        name: "description",
        content: "Trading journal with AI analysis of emotions, repeated mistakes and best setups.",
      },
      { property: "og:title", content: "AI Journal — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "AI reviews every trade and reveals repeated mistakes.",
      },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  return (
    <>
      <PageHeader
        title="AI Journal"
        subtitle="Every trade gets an AI review — discipline, emotions, entry quality"
      />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Average R" value="+0.67" delta="last 30 trades" tone="positive" />
          <Stat label="Discipline" value="74 / 100" delta="+6 vs. last month" tone="positive" />
          <Stat label="Mistakes before news" value="4 of 5" delta="main source of losses" tone="negative" />
        </div>

        <Panel title="New entry" hint="AI adds the review after saving">
          <Textarea
            rows={4}
            placeholder="Describe the trade: pair, entry reason, emotion while holding…"
            className="resize-none"
          />
          <div className="mt-3 flex justify-end">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Save and analyze
            </Button>
          </div>
        </Panel>

        <Panel title="Trade history">
          <div className="space-y-4">
            {journalEntries.map((e) => (
              <article key={`${e.date}-${e.pair}`} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-muted-foreground">{e.date}</span>
                  <span className="font-mono font-semibold">{e.pair}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {e.side}
                  </span>
                  <span
                    className={
                      e.r >= 0
                        ? "font-mono font-semibold text-success"
                        : "font-mono font-semibold text-destructive"
                    }
                  >
                    {e.r > 0 ? "+" : ""}
                    {e.r}R
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">Emotion: {e.emotion}</span>
                </div>
                <p className="mt-3 rounded-lg bg-accent p-3 text-xs leading-relaxed text-accent-foreground">
                  {e.ai}
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
