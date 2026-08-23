# ChartOracle Pro

A premium chart-intelligence workspace for TradingView screenshots. Users can upload PNG/JPG/WebP charts or capture a live browser screen, then receive a structured technical-analysis briefing through a provider abstraction.

## Current build mode

This repository currently runs in **offline preview mode** by design. The app accepts and validates chart images, exercises the complete analysis/reporting workflow, and returns a conservative `WAIT` result when chart structure cannot be verified. It does **not** invent price levels while a vision provider is disconnected.

The internal institutional analysis prompt is already included at:

`lib/analysis/system-prompt.ts`

The provider boundary is:

`lib/analysis/provider.ts`

A vision-capable provider can later implement the same `ChartAnalysisProvider` interface without changing the frontend or `/api/analyze` response contract.

## Architecture

```text
Browser
  ├─ Drag/drop image
  ├─ File picker
  └─ getDisplayMedia screen capture
          │
          ▼
POST /api/analyze (multipart/form-data)
  ├─ MIME validation
  ├─ 10 MB size limit
  ├─ sanitized metadata
  ├─ no-cache response
  └─ no application-storage write
          │
          ▼
ChartAnalysisProvider
  └─ OfflinePreviewProvider (current)
          │
          ▼
Typed ChartAnalysis JSON
          │
          ├─ Executive summary
          ├─ Regime & bias
          ├─ Structure map
          ├─ Confluence matrix
          ├─ Trade decision
          ├─ Actionable plan
          ├─ Invalidation scenarios
          ├─ Watchlist
          ├─ Copy to clipboard
          └─ PDF export
```

## Product principles

- **Evidence before inference.** No price or indicator value is manufactured.
- **Wait is a valid outcome.** The system does not force a signal.
- **Capital preservation first.** Entry requires visible structure, invalidation and targets.
- **Confidence is epistemic.** It represents confidence in interpretation, not win probability.
- **No unnecessary chart storage.** The current route handles uploads transiently and does not persist them.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Production check:

```bash
npm run build
npm run lint
```

## Main files

- `components/ChartOracleApp.tsx` — upload, drag/drop, screen capture, analysis UX, report rendering, clipboard and PDF export
- `app/api/analyze/route.ts` — secure request validation and provider invocation
- `lib/analysis/types.ts` — stable analysis contract
- `lib/analysis/provider.ts` — model/provider abstraction
- `lib/analysis/offline-engine.ts` — conservative no-network provider
- `lib/analysis/system-prompt.ts` — internal chart-analysis system prompt
- `app/globals.css` — responsive visual system

## Security notes

- Allowed chart MIME types: PNG, JPEG, WebP
- Maximum chart payload: 10 MB
- Request metadata is sanitized and length-limited
- Analysis responses are `no-store`
- The application sets defensive browser headers
- No image database, object-storage bucket or logging pipeline is used by this build

## Next integration step

When a vision provider is intentionally enabled later, add a server-only provider implementation that:

1. receives the transient chart image,
2. applies `CHART_ORACLE_SYSTEM_PROMPT`,
3. requests schema-constrained `ChartAnalysis` JSON,
4. validates the returned structure,
5. keeps credentials strictly server-side,
6. preserves the existing API response contract.

Until that provider exists, ChartOracle Pro deliberately refuses to present unverified levels as analysis.
