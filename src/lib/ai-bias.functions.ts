import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BiasItem = {
  pair: string;
  category: string;
  daily: { direction: "Bullish" | "Bearish" | "Neutral"; confidence: number; reason: string };
  weekly: { direction: "Bullish" | "Bearish" | "Neutral"; confidence: number; reason: string };
};
export type BiasReport = { items: BiasItem[] };

export const getMyBias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_bias_reports")
      .select("report, generated_at, paused_reason")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      report: (data?.report ?? null) as BiasReport | null,
      generatedAt: data?.generated_at ?? null,
      error: data?.paused_reason ?? null,
    };
  });

function dir(v: unknown): "Bullish" | "Bearish" | "Neutral" {
  return v === "Bullish" || v === "Bearish" ? v : "Neutral";
}
function conf(v: unknown) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
}

export const generateBias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: claimed, error: claimErr } = await sb.rpc("claim_ai_bias");
    if (claimErr) throw new Error("Could not start generation.");
    if (!claimed) throw new Error("A report was generated recently — wait up to 10 minutes.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { buildMarketAnalysisSafe } = await import("./real-market.server");
    const { fetchCalendar } = await import("./news.server");
    const [analysis, calendar] = await Promise.all([
      buildMarketAnalysisSafe().catch(() => null),
      fetchCalendar().catch(() => []),
    ]);
    const rows = analysis?.fundament ?? [];
    if (!rows.length) throw new Error("Market data is not available right now.");

    const lines = rows.map((r) => {
      const f = (r.factors ?? []).map((x) => `${x.label}=${x.value}`).join(", ");
      return `${r.pair} [${r.category}] score ${r.score.toFixed(1)} | ${f}`;
    });
    const cal = calendar
      .filter((e) => e.impact === "High")
      .map((e) => `${e.date} ${e.country} ${e.title} f:${e.forecast || "-"} p:${e.previous || "-"}`);

    const prompt = `Now: ${new Date().toISOString()}
Instruments with real fundamental data:
${lines.join("\n")}
High-impact events this week:
${cal.join("\n")}

For EVERY instrument above return a daily and weekly directional bias with your confidence 0-100 (integer, your subjective confidence, not a guaranteed probability) and a reason of max 15 words.
Reply ONLY with JSON: {"items":[{"pair":"EURUSD","daily":{"direction":"Bullish|Bearish|Neutral","confidence":62,"reason":"..."},"weekly":{...}}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional macro forex analyst. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const msg =
        res.status === 402
          ? "AI credits are used up. Add credits to continue."
          : res.status === 429
            ? "Too many AI requests — try again in a moment."
            : `AI request failed (${res.status}).`;
      await sb
        .from("ai_bias_reports")
        .update({ paused_reason: msg, paused_status: res.status })
        .eq("user_id", context.userId);
      throw new Error(msg);
    }
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let parsed: { items?: Record<string, unknown>[] } = {};
    try {
      const txt = j.choices?.[0]?.message?.content ?? "{}";
      parsed = JSON.parse(txt.replace(/^```(json)?|```$/g, "").trim());
    } catch {
      throw new Error("AI returned an invalid answer. Try again later.");
    }
    const byPair = new Map((parsed.items ?? []).map((i) => [String(i.pair), i]));
    const items: BiasItem[] = rows.map((r) => {
      const a = (byPair.get(r.pair) ?? {}) as Record<string, Record<string, unknown> | undefined>;
      const mk = (x?: Record<string, unknown>) => ({
        direction: dir(x?.direction),
        confidence: conf(x?.confidence),
        reason: String(x?.reason ?? "No AI comment."),
      });
      return { pair: r.pair, category: r.category, daily: mk(a.daily), weekly: mk(a.weekly) };
    });
    const report: BiasReport = { items };
    const generatedAt = new Date().toISOString();
    await sb
      .from("ai_bias_reports")
      .update({ report, generated_at: generatedAt, paused_reason: null, paused_status: null })
      .eq("user_id", context.userId);
    return { report, generatedAt, error: null };
  });
