import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/wbtest")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(
            "https://api.worldbank.org/v2/country/USA/indicator/FP.CPI.TOTL.ZG?format=json&per_page=10&mrv=4",
            { headers: { "User-Agent": "TradingAnalyzerAI/1.0" } },
          );
          const text = await res.text();
          return Response.json({ status: res.status, body: text.slice(0, 300) });
        } catch (e) {
          return Response.json({ error: String(e) });
        }
      },
    },
  },
});
