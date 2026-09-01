// Mapovanie našich inštrumentov na TradingView symboly.
import { SEASONALITY_SYMBOLS, SEASONALITY_GROUPS, type SeasonalityGroup } from "./seasonality-types";

const OVERRIDES: Record<string, string> = {
  "6E": "CME:6E1!",
  "6B": "CME:6B1!",
  "6J": "CME:6J1!",
  "6S": "CME:6S1!",
  "6C": "CME:6C1!",
  "6A": "CME:6A1!",
  "6N": "CME:6N1!",
  "6M": "CME:6M1!",
  "6L": "CME:6L1!",
  "6Z": "CME:6Z1!",
  DXFUT: "ICEUS:DX1!",
  XAUUSD: "OANDA:XAUUSD",
  XAGUSD: "OANDA:XAGUSD",
  XPTUSD: "OANDA:XPTUSD",
  WTI: "TVC:USOIL",
  BRENT: "TVC:UKOIL",
  NATGAS: "TVC:NATGAS",
  COPPER: "COMEX:HG1!",
  WHEAT: "CBOT:ZW1!",
  DXY: "TVC:DXY",
  SPX: "TVC:SPX",
  NDX: "TVC:NDQ",
  DJI: "TVC:DJI",
  RUT: "TVC:RUT",
  DAX: "TVC:DAX",
  FTSE: "TVC:UKX",
  CAC: "TVC:CAC40",
  STOXX: "TVC:SX5E",
  NIKKEI: "TVC:NI225",
  HSI: "TVC:HSI",
  ASX: "TVC:XJO",
  BTCUSD: "BINANCE:BTCUSDT",
  ETHUSD: "BINANCE:ETHUSDT",
};

export type ChartInstrument = {
  id: string;
  label: string;
  tv: string;
  yahoo: string;
  group: SeasonalityGroup;
};

export const CHART_INSTRUMENTS: ChartInstrument[] = SEASONALITY_SYMBOLS.map((s) => ({
  id: s.id,
  label: s.label,
  group: s.group,
  yahoo: s.yahoo,
  tv: OVERRIDES[s.id] ?? `FX:${s.id}`,
}));

export const CHART_GROUPS = SEASONALITY_GROUPS;

export const CHART_INTERVALS = [
  { key: "5", label: "5m" },
  { key: "15", label: "15m" },
  { key: "60", label: "1h" },
  { key: "240", label: "4h" },
  { key: "D", label: "1D" },
  { key: "W", label: "1T" },
  { key: "M", label: "1M" },
] as const;

export type ChartInterval = (typeof CHART_INTERVALS)[number]["key"];
