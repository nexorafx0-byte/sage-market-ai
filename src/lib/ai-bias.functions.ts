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
  .inputValidator((d: { pairs?: string[] } | undefined) => ({
    pairs: Array.isArray(d?.pairs) ? d!.pairs.map(String).slice(0, 200) : [],
  }))
  .handler(async ({ context, data: input }) => {
    const sb = context.supabase;
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { buildMarketAnalysisSafe } = await import("./real-market.server");
    const { fetchCalendar } = await import("./news.server");
    const [analysis, calendar] = await Promise.all([
      buildMarketAnalysisSafe().catch(() => null),
      fetchCalendar().catch(() => []),
    ]);
    const all = analysis?.fundament?.length
      ? analysis.fundament
      : (await import("./mock-data")).fundamentScore;
    const rows = input.pairs.length ? all.filter((r) => input.pairs.includes(r.pair)) : all;
    if (!rows.length) throw new Error("Select at least one instrument.");

    const { data: claimed, error: claimErr } = await sb.rpc("claim_ai_bias");
    if (claimErr) throw new Error("Could not start generation.");
    if (!claimed) throw new Error("A report is being generated — wait a moment and try again.");

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

For EVERY instrument above return a daily and weekly directional bias with your confidence 0-100 (integer, subjective confidence, not a guaranteed probability) and a reason of max 15 words. Return json.`;

    const side = {
      type: "object",
      additionalProperties: false,
      required: ["direction", "confidence", "reason"],
      properties: {
        direction: { type: "string", enum: ["Bullish", "Bearish", "Neutral"] },
        confidence: { type: "integer" },
        reason: { type: "string" },
      },
    };
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["pair", "daily", "weekly"],
            properties: { pair: { type: "string" }, daily: side, weekly: side },
          },
        },
      },
    };

    const releaseLease = () =>
      sb.from("ai_bias_reports").update({ lease_until: new Date(0).toISOString() }).eq("user_id", context.userId);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "You are a professional macro forex analyst. Output strict JSON only.",
        input: [{ role: "user", content: prompt }],
        text: { format: { type: "json_schema", name: "bias", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      let safe = "";
      try {
        safe = ((await res.json()) as { message?: string; error?: { message?: string } }).message ?? "";
      } catch {}
      const msg =
        res.status === 402
          ? safe || "AI credits are used up. Add credits to continue."
          : res.status === 429
            ? "Too many AI requests — try again in a moment."
            : safe || `AI request failed (${res.status}).`;
      await sb
        .from("ai_bias_reports")
        .update({ paused_reason: msg, paused_status: res.status, lease_until: new Date(0).toISOString() })
        .eq("user_id", context.userId);
      throw new Error(msg);
    }

    // Consume SSE stream, collect output text.
    let txt = "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string };
          if (ev.type === "response.output_text.delta" && ev.delta) txt += ev.delta;
        } catch {}
      }
    }

    let parsed: { items?: Record<string, unknown>[] } = {};
    try {
      parsed = JSON.parse(txt.trim());
    } catch {
      await releaseLease();
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
