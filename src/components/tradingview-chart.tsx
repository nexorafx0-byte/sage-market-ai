import { useEffect, useRef } from "react";

const DEFAULT_STUDIES = ["STD;EMA", "STD;RSI"];

type Props = {
  symbol: string;
  interval: string;
  studies?: string[];
  height?: number | string;
};

/** TradingView Advanced Chart widget (len na klientovi). */
export default function TradingViewChart({
  symbol,
  interval,
  studies = DEFAULT_STUDIES,
  height = "100%",
}: Props) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    el.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    container.appendChild(inner);
    el.appendChild(container);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Europe/Bratislava",
      theme: "dark",
      style: "1",
      locale: "sk",
      backgroundColor: "rgba(38,38,45,1)",
      gridColor: "rgba(255,255,255,0.06)",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      withdateranges: true,
      details: true,
      calendar: false,
      studies,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [symbol, interval, studies]);

  return <div ref={holder} style={{ height }} className="w-full" />;
}
