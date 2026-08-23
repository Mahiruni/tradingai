import type { AnalysisRequestMetadata, ChartAnalysis } from "./types";

export function runOfflineAnalysis(metadata: AnalysisRequestMetadata): ChartAnalysis {
  const instrument = metadata.instrument?.trim() || "Unspecified instrument";
  const timeframe = metadata.timeframe?.trim() || "Unspecified timeframe";

  return {
    mode: "offline-preview",
    instrument,
    timeframe,
    detectedInstrument: null,
    detectedTimeframe: null,
    executiveSummary:
      "Chart received securely, but AI vision is intentionally disconnected in this build. Exact market structure and trade levels cannot be verified without inventing data, so the correct decision is WAIT.",
    regime: {
      classification: "Unverified from offline image intake",
      bias: "unverified",
      volatility: "Unverified",
      timeframeAlignment: "Not available without vision analysis or explicit multi-timeframe context",
    },
    decision: "WAIT",
    confidence: 24,
    confidenceReason:
      "Confidence is deliberately low because the offline provider does not read candles, price scales, indicators or annotations. The application refuses to convert an unverified screenshot into a trade signal.",
    levels: [
      {
        label: "Nearest validated support",
        price: null,
        kind: "support",
        rationale: "Requires chart-vision confirmation.",
      },
      {
        label: "Nearest validated resistance",
        price: null,
        kind: "resistance",
        rationale: "Requires chart-vision confirmation.",
      },
      {
        label: "Trade invalidation",
        price: null,
        kind: "invalidation",
        rationale: "No defensible invalidation can be produced without reading visible structure.",
      },
    ],
    confluences: [
      {
        label: "Market structure",
        status: "unverified",
        detail: "Swing sequence, BOS and CHoCH require vision analysis.",
      },
      {
        label: "Liquidity / displacement",
        status: "unverified",
        detail: "Sweeps, displacement and FVGs are not inferred from file metadata.",
      },
      {
        label: "Momentum confirmation",
        status: "unverified",
        detail: "Visible oscillators cannot be read by the offline provider.",
      },
      {
        label: "Timeframe alignment",
        status: "missing",
        detail: "No verified higher/lower-timeframe chart context is available.",
      },
    ],
    tradePlan: {
      direction: "none",
      entryZone: { low: null, high: null },
      stopLoss: null,
      takeProfits: [],
      riskReward: null,
      riskNote:
        "Do not place a trade from this preview output. Connect a vision-capable provider, then require visible entry, invalidation and target structure before execution.",
    },
    biasInvalidation: [
      "No directional bias has been established, so there is nothing valid to invalidate yet.",
      "A future bias should be invalidated by a clearly defined structural level, not by an arbitrary fixed-distance stop.",
    ],
    watchlist: [
      "Verify the instrument and primary timeframe.",
      "Confirm the latest external swing high and swing low.",
      "Wait for displacement plus a valid structural confirmation before considering an entry.",
    ],
    riskFlags: [
      "Vision engine offline",
      "No verified price scale",
      "No verified multi-timeframe context",
    ],
    limitations: [
      "This build does not send the chart to any external AI service.",
      "The chart file is accepted transiently by the server route and is not written to application storage.",
      "Price-specific analysis is intentionally withheld until a vision provider is connected.",
    ],
    generatedAt: new Date().toISOString(),
  };
}
