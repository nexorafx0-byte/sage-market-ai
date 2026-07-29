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
        content: "Obchodný denník s AI rozborom emócií, opakovaných chýb a najziskovejších setupov.",
      },
      { property: "og:title", content: "AI Journal — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "AI vyhodnotí každý obchod a odhalí opakované chyby.",
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
        subtitle="Každý obchod dostane rozbor od AI — disciplína, emócie, kvalita vstupu"
      />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Priemerné R" value="+0.67" delta="posledných 30 obchodov" tone="positive" />
          <Stat label="Disciplína" value="74 / 100" delta="+6 oproti minulému mesiacu" tone="positive" />
          <Stat label="Chyby pred správami" value="4 z 5" delta="hlavný zdroj strát" tone="negative" />
        </div>

        <Panel title="Nový záznam" hint="AI doplní rozbor po uložení">
          <Textarea
            rows={4}
            placeholder="Popíš obchod: pár, dôvod vstupu, emócia počas držania…"
            className="resize-none"
          />
          <div className="mt-3 flex justify-end">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Uložiť a analyzovať
            </Button>
          </div>
        </Panel>

        <Panel title="História obchodov">
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
                  <span className="ml-auto text-xs text-muted-foreground">Emócia: {e.emotion}</span>
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
