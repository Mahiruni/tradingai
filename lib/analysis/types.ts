export type TradeDecision = "ENTER_LONG" | "ENTER_SHORT" | "WAIT" | "AVOID";

export type LevelKind =
  | "support"
  | "resistance"
  | "liquidity"
  | "invalidation"
  | "target"
  | "reference";

export interface StructureLevel {
  label: string;
  price: number | null;
  kind: LevelKind;
  rationale: string;
}

export interface ConfluenceItem {
  label: string;
  status: "present" | "missing" | "conflicting" | "unverified";
  detail: string;
}

export interface TradePlan {
  direction: "long" | "short" | "none";
  entryZone: { low: number | null; high: number | null };
  stopLoss: number | null;
  takeProfits: Array<{ label: string; price: number | null; rationale: string }>;
  riskReward: string | null;
  riskNote: string;
}

export interface ChartAnalysis {
  mode: "offline-preview" | "vision";
  instrument: string;
  timeframe: string;
  detectedInstrument: string | null;
  detectedTimeframe: string | null;
  executiveSummary: string;
  regime: {
    classification: string;
    bias: "bullish" | "bearish" | "neutral" | "unverified";
    volatility: string;
    timeframeAlignment: string;
  };
  decision: TradeDecision;
  confidence: number;
  confidenceReason: string;
  levels: StructureLevel[];
  confluences: ConfluenceItem[];
  tradePlan: TradePlan;
  biasInvalidation: string[];
  watchlist: string[];
  riskFlags: string[];
  limitations: string[];
  generatedAt: string;
}

export interface AnalysisRequestMetadata {
  instrument?: string;
  timeframe?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}
