import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./ai/run-id.server";
import { fetchCalendar, fetchNews } from "./news.server";
import { buildMarketAnalysisSafe } from "./real-market.server";

const MODEL = "openai/gpt-6-astra";

const BodySchema = z.object({
  mode: z.enum(["chat", "event"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(40)
    .default([]),
  event: z
    .object({
      title: z.string(),
      country: z.string(),
      date: z.string(),
      impact: z.string(),
      forecast: z.string().optional().default(""),
      previous: z.string().optional().default(""),
    })
    .optional(),
});

async function buildContext(): Promise<string> {
  const [analysis, calendar, news] = await Promise.all([
    buildMarketAnalysisSafe().catch(() => null),
    fetchCalendar().catch(() => []),
    fetchNews().catch(() => []),
  ]);
  const rows = (analysis?.fundament ?? []).map((r) => {
    const factors = (r.factors ?? []).map((f) => `${f.label}=${f.value}`).join(", ");
    return `${r.pair} (${r.category}): score ${r.score.toFixed(1)} ${r.bias}${factors ? ` | ${factors}` : ""}`;
  });
  const cal = calendar
    .filter((e) => e.impact === "High" || e.impact === "Medium")
    .map((e) => `${e.date} ${e.country} ${e.title} [${e.impact}] f:${e.forecast || "-"} p:${e.previous || "-"}`);
  const heads = news.slice(0, 30).map((n) => `- ${n.title} (${n.source})`);
  return [
    `Now: ${new Date().toISOString()}`,
    `COT report date: ${analysis?.cotReportDate ?? "n/a"}`,
    "## Fundamental scores (-10..+10, real data: CFTC, BIS, World Bank, OECD, Yahoo)",
    ...rows,
    "## Forex Factory calendar this week (High/Medium)",
    ...cal,
    "## Latest headlines",
    ...heads,
  ].join("\n");
}

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleAi(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "AI is not configured.");

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return json(400, "Invalid request.");
  }

  const context = await buildContext();
  const system = `You are MARKETMIND AI, a professional macro & forex analyst. Use ONLY the live data below plus general macro knowledge. Be concise, use short markdown sections and bullet points, name concrete pairs and direction (bullish/bearish). Answer in the user's language. Not financial advice — add one short disclaimer line at the end.\n\n${context}`;

  let messages: ModelMessage[];
  if (body.mode === "event") {
    if (!body.event) return json(400, "Missing event.");
    const e = body.event;
    messages = [
      {
        role: "user",
        content: `Analyze this economic event: ${e.country} — ${e.title} (${e.impact} impact) at ${e.date}. Forecast: ${e.forecast || "n/a"}, Previous: ${e.previous || "n/a"}.\nExplain in max ~150 words: what it measures, what a beat vs miss means for ${e.country}, which pairs/assets are most affected and how, and how it fits the current fundamental scores.`,
      },
    ];
  } else {
    if (body.messages.length === 0) return json(400, "Empty conversation.");
    messages = body.messages;
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
    onError: ({ error }) => console.error("AI stream error", error),
  });

  return result.toTextStreamResponse();
}
