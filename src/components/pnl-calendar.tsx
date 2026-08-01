import {
  calendarFirstWeekday,
  calendarMonthLabel,
  tradingCalendar,
} from "@/lib/account-stats";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

export function PnlCalendar() {
  const cells = [
    ...Array.from({ length: calendarFirstWeekday }, () => null),
    ...tradingCalendar,
  ];

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const total = tradingCalendar.reduce((s, d) => s + (d.pnl ?? 0), 0);
  const tradeSum = tradingCalendar.reduce((s, d) => s + d.trades, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{calendarMonthLabel}</span>
        <span>
          {tradeSum} obchodov ·{" "}
          <span className={total >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
            {total >= 0 ? "+" : ""}
            {total.toFixed(2)} €
          </span>
        </span>
      </div>

      <div className="grid grid-cols-8 gap-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1">
            {w}
          </div>
        ))}
        <div className="pb-1">Spolu</div>
      </div>


      <div className="space-y-1.5">
        {weeks.map((week, wi) => {
          const weekSum = week.reduce((s, d) => s + (d?.pnl ?? 0), 0);
          return (
            <div key={wi} className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 7 }, (_, i) => week[i] ?? null).map((d, di) => (
                <div
                  key={di}
                  className={cn(
                    "flex aspect-square flex-col justify-between rounded-lg border p-1.5 text-left",
                    !d && "border-transparent",
                    d && d.pnl === null && "border-border bg-secondary/40",
                    d && d.pnl !== null && d.pnl >= 0 && "border-success/30 bg-success/10",
                    d && d.pnl !== null && d.pnl < 0 && "border-destructive/30 bg-destructive/10",
                  )}
                >
                  {d && (
                    <>
                      <span className="text-[11px] text-muted-foreground">{d.day}</span>
                      {d.pnl !== null && (
                        <span className="leading-tight">
                          <span
                            className={cn(
                              "block font-mono text-[11px] font-semibold",
                              d.pnl >= 0 ? "text-success" : "text-destructive",
                            )}
                          >
                            {d.pnl >= 0 ? "+" : ""}
                            {d.pnl.toFixed(1)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {d.trades} obch.
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border bg-card px-1">
                <span className="text-[10px] uppercase text-muted-foreground">Týž.</span>
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold",
                    weekSum >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {weekSum >= 0 ? "+" : ""}
                  {weekSum.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
