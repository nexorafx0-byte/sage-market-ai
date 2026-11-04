import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Brain, BarChart3, CalendarDays, CandlestickChart, BookOpen, ShieldCheck, Landmark, Newspaper, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import overview from "@/assets/marketmind-overview.asset.json";
import seasonality from "@/assets/marketmind-seasonality.asset.json";
import factors from "@/assets/marketmind-factors.asset.json";

type Tool = {
  title: string;
  category: string;
  icon: LucideIcon;
  to: "/analyza" | "/grafy" | "/news" | "/ai-chat" | "/journal" | "/risk";
  description: string;
  steps: string[];
  note: string;
  image?: string;
};

const tools: Tool[] = [
  { title: "AI analysis & instrument detail", category: "THE BIG PICTURE", icon: Brain, to: "/analyza", image: overview.url,
    description: "Understand the macro picture behind forex pairs, commodities and indices. Open an instrument to bring its score, factors and AI explanation together.",
    steps: ["Open AI market analysis → Fundament. Search for a symbol or filter Forex, Commodities or Indices.", "Select an instrument, such as EURUSD, to open its full-screen detail.", "In Overall, review the factors and select Generate summary for an AI explanation. Use Back, × or Esc to return."],
    note: "AI explanations can be wrong. The historical score curve is illustrative, not a recorded history of daily fundamentals." },
  { title: "Seasonality", category: "HISTORICAL PATTERNS", icon: TrendingUp, to: "/analyza", image: seasonality.url,
    description: "Compare recurring patterns across the year using historical daily closing prices. The side table shows returns, winning years, gains, losses and risk statistics.",
    steps: ["Open Seasonality in AI market analysis or inside an instrument detail.", "Choose the symbol and a 5, 10, 15 or 20-year window. Check how many years of data are actually available.", "Drag across the chart or enter From / To dates. The side table recalculates for that period. Toggle Detrending to compare the seasonal shape without the long-term trend."],
    note: "Winning trades means positive historical yearly windows, not the chance of your next trade winning. Past performance does not guarantee future returns." },
  { title: "Fundamental Score", category: "SUPPORT VS. PRESSURE", icon: BarChart3, to: "/analyza", image: factors.url,
    description: "A whole-number rating from −10 to +10 brings together available factors: COT, GDP, seasonality, trend, retail sales and positioning, mPMI, sPMI, rates, inflation and employment.",
    steps: ["Compare instrument scores in Fundament, then open a card.", "Read Score overview for individual ratings, economic values and their sources.", "Positive scores lean toward support; negative scores lean toward pressure. Look for agreement or conflict between the factors."],
    note: "A score is not a probability or an entry signal. Missing values are shown as unavailable; some economic indicators use proxies." },
  { title: "COT positioning", category: "WHO HOLDS THE POSITIONS", icon: BarChart3, to: "/analyza",
    description: "See futures positioning for Commercials, Large Speculators and Small Traders, with long/short shares, net positions and weekly changes from CFTC reports.",
    steps: ["Open the COT tab in AI market analysis and choose an instrument, or use COT in its detail.", "Compare the long and short positions of the three groups.", "Read net positioning and changes alongside the fundamental factors, and check the report date."],
    note: "COT is a weekly futures report, not live forex order flow. Sample values may appear when source data is unavailable." },
  { title: "Daily & Weekly Bias", category: "AI DIRECTIONAL OUTLOOK", icon: Sparkles, to: "/analyza",
    description: "Generate a daily and weekly directional view for your chosen instruments, with an AI confidence percentage and a short explanation.",
    steps: ["Sign in, then open Daily & Weekly Bias in AI market analysis.", "Select instruments individually or use All, Forex, Commodities or Indices. An empty selection requests all instruments.", "Select Generate bias and compare the daily and weekly views. Saved results remain in your account; regeneration is limited to once every 10 minutes."],
    note: "Confidence is the AI's subjective assessment, not a verified probability. Check the data and risks before making a decision." },
  { title: "Bank reports", category: "CENTRAL-BANK CONTEXT", icon: Landmark, to: "/analyza",
    description: "Bring the relevant central banks, available interest-rate factors and this week's policy-related events into the detail of your instrument.",
    steps: ["Open an instrument in Fundament, then select Bank reports.", "Compare the central banks and rate factors for the currencies involved.", "Review listed rate decisions, minutes and speeches, and their timing before planning a trade."],
    note: "This is a central-bank overview with filtered calendar events, not a library of bank research reports or PDF forecasts." },
  { title: "Economic Calendar & News", category: "EVENTS THAT MATTER", icon: Newspaper, to: "/news",
    description: "Follow the Forex Factory weekly economic calendar and market headlines. Inside each instrument, Calendar focuses on its relevant currencies.",
    steps: ["Open News and filter the calendar by impact, currency or a search term.", "Compare forecast and previous values. Use the AI button beside an event for an explanation of its possible market impact.", "For a pair-specific view, open an instrument → Calendar. Check release times before entering a trade."],
    note: "External feeds may be delayed or unavailable. AI event explanations are analysis, not guaranteed reactions or automatic news alerts." },
  { title: "Charts & price alerts", category: "PRICE AND TIMING", icon: CandlestickChart, to: "/grafy",
    description: "Inspect price action in TradingView charts, switch instruments and timeframes, keep favourites and set price levels to watch.",
    steps: ["Open Charts, search for an instrument and select a timeframe.", "Use the star to save a favourite instrument.", "Open Alerts, enter a price and choose above or below. Save the alert, or remove it when it is no longer relevant."],
    note: "Alerts are checked while the chart page is open and appear in the app. They are not a background push-notification service; alert quotes and chart prices can differ." },
  { title: "AI chat", category: "ASK AND COMPARE", icon: Brain, to: "/ai-chat",
    description: "Ask about macro conditions, COT, news or a specific instrument. Turn available market context into an explanation you can question and compare.",
    steps: ["Open AI chat and choose a suggested question or write your own.", "Name the instrument and timeframe, for example: What could invalidate a bullish EURUSD outlook this week?",
      "Send the question, read the response and ask a follow-up. Use Stop to interrupt generation."],
    note: "Verify numerical claims against their sources. Chat history is not permanently saved, and AI responses are not financial advice." },
  { title: "Journal", category: "REVIEW YOUR DECISIONS", icon: BookOpen, to: "/journal",
    description: "Keep a manual record of each trade: pair name, entry, risk, Win or Loss, and links to your charts before and after the trade.",
    steps: ["Open Journal → Add trade.", "Enter the pair, entry and risk, choose Win or Loss and optionally paste the before-trade and after-trade chart links.", "Select Save trade. Review your records and win rate, open the chart links or delete a record."],
    note: "Trades are saved only in this browser, not synced across devices. Journal does not automatically import trades or generate AI reviews." },
  { title: "Risk manager", category: "PLAN YOUR EXPOSURE", icon: ShieldCheck, to: "/risk",
    description: "Estimate the amount you are risking and your position size before a trade using your capital, risk percentage and stop-loss distance.",
    steps: ["Open Risk manager and enter Capital (€), Risk (%) and Stop loss (pips).",
      "Read the calculated Risk per trade and Position size.", "Confirm your instrument's actual pip value and account-currency conversion with your broker before placing the order."],
    note: "The calculator assumes a fixed pip value of 10 per lot. Displayed daily limits, drawdown and open positions are examples, not connected account data; the app does not block broker orders." },
];

export function HomepageGuide() {
  return (
    <section id="funkcie" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Explore your trading workspace</p>
        <h2 className="mt-3 text-3xl font-semibold">Get powerful tools</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Know what each tool is for, how to use it and what its data can tell you.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {tools.map((tool, index) => (
          <article key={tool.title} className={`flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card/20 ${index === 2 ? "md:col-span-2" : ""}`}>
            {tool.image ? <img src={tool.image} alt={`MARKETMIND ${tool.title} — actual application view`} loading="lazy" width="1280" height={index === 2 ? 500 : 800} className={`w-full border-b border-border object-cover object-top ${index === 2 ? "aspect-[1280/500]" : "aspect-[8/5]"}`} /> : <div className="flex items-center gap-3 px-6 pt-6"><tool.icon className="h-6 w-6 text-primary" /><p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{tool.category}</p></div>}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              {tool.image && <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-primary">{tool.category}</p>}
              <h3 className="text-xl font-semibold">{tool.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{tool.description}</p>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="usage" className="border-border">
                  <AccordionTrigger>How to use it</AccordionTrigger>
                  <AccordionContent><ol className="space-y-3">{tool.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-6"><span className="font-mono text-primary">0{i + 1}</span><span>{step}</span></li>)}</ol></AccordionContent>
                </AccordionItem>
              </Accordion>
              <p className="mt-4 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Keep in mind: </span>{tool.note}</p>
              <div className="mt-auto pt-5"><Button asChild variant="link" className="h-auto justify-start p-0"><Link to={tool.to}>Open {tool.title}<ArrowUpRight /></Link></Button></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomepageWorkflow() {
  const steps = [
    { icon: CalendarDays, title: "Check the context", text: "Start with News and the calendar. Find events affecting your instrument." },
    { icon: BarChart3, title: "Build your view", text: "Compare fundamentals, COT and seasonality. Use AI to explore conflicting signals." },
    { icon: ShieldCheck, title: "Plan the trade", text: "Inspect the chart, define an entry and stop loss, then estimate your risk." },
    { icon: BookOpen, title: "Record and review", text: "Save the trade in Journal with your before/after links and its result." },
  ];
  return <section id="postup" className="scroll-mt-24 border-y border-border py-14"><div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="text-2xl font-semibold">From market context to trade review</h2><p className="mt-3 text-sm text-muted-foreground">A practical order for using the tools together.</p><ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, i) => <li key={step.title}><div className="mb-4 flex items-center gap-3"><span className="font-mono text-sm text-muted-foreground">0{i + 1}</span><step.icon className="h-5 w-5 text-primary" /></div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></li>)}</ol></div></section>;
}