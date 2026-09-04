// Shared types for real market analysis (client-safe).
import type { FundamentRow } from "./mock-data";

export type CotWeekReal = {
  date: string;
  longChange: number;
  longPct: number;
  longOi: number;
  openInterest: number;
  shortOi: number;
  shortPct: number;
  shortChange: number;
  net: number;
};

export type MacroSourceReal = {
  label: string;
  value: string;
  score: number;
  source: string;
  updated: string;
  note: string;
};

export type InstrumentDetailReal = {
  macro: MacroSourceReal[];
  cot: Record<"noncommercial" | "commercial" | "retail", CotWeekReal[]>;
  cotSource: string;
};

export type MarketAnalysis = {
  updatedAt: string;
  cotReportDate: string;
  fundament: FundamentRow[];
  details: Record<string, InstrumentDetailReal>;
  cotSummary: { asset: string; net: number; change: number; extreme: number }[];
  seasonality: { month: string; value: number }[];
  seasonalityNote: string;
  zones: {
    pair: string;
    tf: string;
    type: "Supply" | "Demand";
    from: string;
    to: string;
    score: number;
    status: string;
  }[];
  sources: string[];
  warnings: string[];
};
