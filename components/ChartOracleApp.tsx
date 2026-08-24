"use client";

import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clipboard,
  Download,
  FileImage,
  Gauge,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MonitorUp,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChartAnalysis, ConfluenceItem, StructureLevel, TradeDecision } from "@/lib/analysis/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ANALYSIS_STEPS = [
  "Reading chart geometry",
  "Mapping external structure",
  "Checking liquidity and displacement",
  "Scoring multi-factor confluence",
  "Applying capital-preservation gate",
];

const DECISION_COPY: Record<TradeDecision, { label: string; tone: string; note: string }> = {
  ENTER_LONG: { label: "Enter Long", tone: "positive", note: "Bullish conditions satisfy the execution gate." },
  ENTER_SHORT: { label: "Enter Short", tone: "negative", note: "Bearish conditions satisfy the execution gate." },
  WAIT: { label: "Wait", tone: "warning", note: "Structure or confirmation is incomplete." },
  AVOID: { label: "Avoid / No Trade", tone: "muted", note: "Risk quality is below the execution threshold." },
};

function money(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 5 }).format(value);
}

function decisionText(decision: TradeDecision) {
  return DECISION_COPY[decision].label;
}

function analysisAsText(analysis: ChartAnalysis) {
  const levels = analysis.levels
    .map((item) => `- ${item.label}: ${money(item.price)} — ${item.rationale}`)
    .join("\n");
  const confluences = analysis.confluences
    .map((item) => `- ${item.label}: ${item.status.toUpperCase()} — ${item.detail}`)
    .join("\n");
  const targets = analysis.tradePlan.takeProfits.length
    ? analysis.tradePlan.takeProfits.map((item) => `- ${item.label}: ${money(item.price)} — ${item.rationale}`).join("\n")
    : "- No validated targets";

  return `CHARTORACLE PRO — MARKET BRIEFING\n\nInstrument: ${analysis.instrument}\nTimeframe: ${analysis.timeframe}\nDecision: ${decisionText(analysis.decision)}\nConfidence: ${analysis.confidence}/100\nGenerated: ${new Date(analysis.generatedAt).toLocaleString()}\n\nEXECUTIVE SUMMARY\n${analysis.executiveSummary}\n\nMARKET REGIME\n${analysis.regime.classification} | Bias: ${analysis.regime.bias} | Volatility: ${analysis.regime.volatility}\nTimeframe alignment: ${analysis.regime.timeframeAlignment}\n\nKEY LEVELS\n${levels}\n\nCONFLUENCE\n${confluences}\n\nACTIONABLE PLAN\nDirection: ${analysis.tradePlan.direction}\nEntry: ${money(analysis.tradePlan.entryZone.low)} – ${money(analysis.tradePlan.entryZone.high)}\nStop: ${money(analysis.tradePlan.stopLoss)}\nR:R: ${analysis.tradePlan.riskReward ?? "—"}\n${targets}\nRisk note: ${analysis.tradePlan.riskNote}\n\nWHAT CHANGES THE BIAS\n${analysis.biasInvalidation.map((item) => `- ${item}`).join("\n")}\n\nWATCHLIST\n${analysis.watchlist.map((item) => `- ${item}`).join("\n")}\n\nLIMITATIONS\n${analysis.limitations.map((item) => `- ${item}`).join("\n")}`;
}

function StatusDot({ status }: { status: ConfluenceItem["status"] }) {
  return <span className={`status-dot status-${status}`} aria-hidden="true" />;
}

function LevelRow({ level }: { level: StructureLevel }) {
  return (
    <div className="level-row">
      <div>
        <span className={`level-kind level-${level.kind}`}>{level.kind}</span>
        <strong>{level.label}</strong>
        <p>{level.rationale}</p>
      </div>
      <span className="level-price">{money(level.price)}</span>
    </div>
  );
}

export default function ChartOracleApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [instrument, setInstrument] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isAnalyzing) return;
    const timer = window.setInterval(() => {
      setLoadingStage((current) => (current + 1) % ANALYSIS_STEPS.length);
    }, 850);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  function acceptFile(nextFile: File) {
    setError(null);
    setAnalysis(null);
    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setError("Use a PNG, JPG/JPEG or WebP TradingView screenshot.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("The chart image is larger than the 10 MB secure upload limit.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(nextFile));
    setFile(nextFile);
  }

  async function captureScreen() {
    setError(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen capture is not supported in this browser. Upload a screenshot instead.");
      return;
    }

    setCaptureBusy(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      await new Promise((resolve) => window.setTimeout(resolve, 180));

      if (!video.videoWidth || !video.videoHeight) throw new Error("Capture dimensions unavailable");

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Capture failed"))), "image/png", 0.96);
      });
      acceptFile(new File([blob], `tradingview-capture-${Date.now()}.png`, { type: "image/png" }));
    } catch (captureError) {
      if (captureError instanceof DOMException && captureError.name === "NotAllowedError") {
        setError("Screen capture was cancelled. You can still upload a chart screenshot.");
      } else {
        setError("The screen could not be captured. Upload a screenshot instead.");
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setCaptureBusy(false);
    }
  }

  async function analyze() {
    if (!file) {
      setError("Add a TradingView chart screenshot before running analysis.");
      return;
    }
    setError(null);
    setAnalysis(null);
    setIsAnalyzing(true);
    setLoadingStage(0);

    try {
      const body = new FormData();
      body.append("chart", file);
      if (instrument.trim()) body.append("instrument", instrument.trim());
      if (timeframe.trim()) body.append("timeframe", timeframe.trim());

      const response = await fetch("/api/analyze", { method: "POST", body, cache: "no-store" });
      const payload = (await response.json()) as ChartAnalysis | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Analysis failed.");
      }
      setAnalysis(payload as ChartAnalysis);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function copyBriefing() {
    if (!analysis) return;
    await navigator.clipboard.writeText(analysisAsText(analysis));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function exportPdf() {
    if (!analysis) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("ChartOracle Pro — Market Briefing", 14, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const wrapped = pdf.splitTextToSize(analysisAsText(analysis).replace("CHARTORACLE PRO — MARKET BRIEFING\n\n", ""), 180) as string[];
    let y = 28;
    for (const line of wrapped) {
      if (y > 282) {
        pdf.addPage();
        y = 16;
      }
      pdf.text(line, 14, y);
      y += 4.5;
    }
    pdf.save(`chartoracle-${analysis.instrument.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "analysis"}.pdf`);
  }

  function resetChart() {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const decision = analysis ? DECISION_COPY[analysis.decision] : null;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="ChartOracle Pro home">
          <span className="brand-mark"><ScanLine size={19} strokeWidth={2.2} /></span>
          <span>ChartOracle <b>Pro</b></span>
        </a>
        <div className="topbar-meta">
          <span className="system-pill"><span className="live-dot" /> Analysis workspace</span>
          <span className="privacy-label"><LockKeyhole size={14} /> No chart storage</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><Sparkles size={14} /> Evidence-bounded chart intelligence</div>
        <h1>Read the chart.<br /><span>Respect the risk.</span></h1>
        <p>
          Upload or capture a TradingView chart. ChartOracle turns the visible structure into a disciplined market briefing — and treats <strong>Wait</strong> as a valid professional decision.
        </p>
        <div className="hero-proof">
          <span><ShieldCheck size={16} /> Capital-preservation gate</span>
          <span><Layers3 size={16} /> Multi-framework analysis</span>
          <span><Target size={16} /> Exact levels only when verified</span>
        </div>
      </section>

      <section className="workspace">
        <div className="input-column">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / Chart intake</span>
              <h2>Give Oracle the market view</h2>
            </div>
            {file && <span className="ready-pill"><Check size={13} /> Ready</span>}
          </div>

          <div
            className={`upload-card ${isDragging ? "dragging" : ""} ${previewUrl ? "has-preview" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const nextFile = event.dataTransfer.files?.[0];
              if (nextFile) acceptFile(nextFile);
            }}
          >
            {previewUrl ? (
              <div className="preview-stage">
                <Image src={previewUrl} alt="Selected trading chart" fill unoptimized sizes="(max-width: 900px) 100vw, 46vw" />
                <div className="preview-overlay">
                  <div className="file-chip"><FileImage size={14} /> <span>{file?.name}</span></div>
                  <button className="icon-button" onClick={resetChart} aria-label="Remove chart"><X size={17} /></button>
                </div>
              </div>
            ) : (
              <button className="drop-target" onClick={() => fileInputRef.current?.click()} type="button">
                <span className="upload-icon"><Upload size={28} /></span>
                <strong>Drop a TradingView screenshot</strong>
                <span>or tap to choose PNG, JPG or WebP</span>
                <small>Maximum 10 MB · high-resolution screenshots work best</small>
              </button>
            )}
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                if (nextFile) acceptFile(nextFile);
              }}
            />
          </div>

          <button className="capture-button" type="button" onClick={captureScreen} disabled={captureBusy}>
            {captureBusy ? <LoaderCircle className="spin" size={18} /> : <MonitorUp size={18} />}
            {captureBusy ? "Capturing selected screen…" : "Capture TradingView Screen"}
            <span>Browser screen capture</span>
          </button>

          <div className="context-grid">
            <label>
              <span>Instrument <em>optional</em></span>
              <input value={instrument} onChange={(event) => setInstrument(event.target.value)} placeholder="e.g. XAUUSD" maxLength={48} />
            </label>
            <label>
              <span>Primary timeframe <em>optional</em></span>
              <input value={timeframe} onChange={(event) => setTimeframe(event.target.value)} placeholder="e.g. 15m" maxLength={48} />
            </label>
          </div>

          {error && <div className="error-banner"><AlertTriangle size={17} /><span>{error}</span></div>}

          <button className="analyze-button" onClick={analyze} disabled={!file || isAnalyzing} type="button">
            {isAnalyzing ? <LoaderCircle className="spin" size={19} /> : <ScanLine size={19} />}
            <span>{isAnalyzing ? ANALYSIS_STEPS[loadingStage] : "Run Institutional Analysis"}</span>
            {!isAnalyzing && <ArrowRight size={18} />}
          </button>

          <div className="security-strip">
            <ShieldCheck size={16} />
            <p><strong>Private by design.</strong> Images are handled transiently by the analysis request and are not written to application storage.</p>
          </div>
        </div>

        <div className="results-column">
          <div className="section-heading">
            <div>
              <span className="section-kicker">02 / Market briefing</span>
              <h2>Decision before prediction</h2>
            </div>
            {analysis && <span className="mode-pill">{analysis.mode === "offline-preview" ? "Offline preview" : "Vision"}</span>}
          </div>

          {isAnalyzing ? (
            <div className="analysis-loader panel">
              <div className="radar">
                <span /><span /><span />
                <ScanLine size={31} />
              </div>
              <div>
                <span className="section-kicker">Oracle engine</span>
                <h3>{ANALYSIS_STEPS[loadingStage]}</h3>
                <p>Separating visible evidence from assumptions before producing a decision.</p>
              </div>
              <div className="loading-track"><span key={loadingStage} /></div>
            </div>
          ) : !analysis ? (
            <div className="empty-brief panel">
              <div className="empty-icon"><BarChart3 size={27} /></div>
              <span className="section-kicker">No briefing yet</span>
              <h3>Your analysis will appear here</h3>
              <p>Oracle prioritizes verified structure, confluence and invalidation. If the evidence is incomplete, the output will explicitly say Wait or Avoid.</p>
              <div className="empty-grid">
                <span><Gauge size={16} /> Regime & bias</span>
                <span><Target size={16} /> Key levels</span>
                <span><Layers3 size={16} /> Confluence</span>
                <span><ShieldCheck size={16} /> Risk gate</span>
              </div>
            </div>
          ) : (
            <div className="briefing-stack">
              <div className={`decision-card panel tone-${decision?.tone}`}>
                <div className="decision-head">
                  <div>
                    <span className="section-kicker">Trade decision</span>
                    <h3>{decision?.label}</h3>
                    <p>{decision?.note}</p>
                  </div>
                  <div className="confidence-block">
                    <strong>{analysis.confidence}</strong><span>/100</span>
                    <small>confidence</small>
                  </div>
                </div>
                <div className="confidence-track"><span style={{ width: `${analysis.confidence}%` }} /></div>
                <p className="confidence-reason">{analysis.confidenceReason}</p>
              </div>

              <div className="brief-toolbar">
                <button onClick={copyBriefing} type="button">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy briefing"}</button>
                <button onClick={exportPdf} type="button"><Download size={15} /> Export PDF</button>
              </div>

              <div className="summary-card panel">
                <span className="section-kicker">Executive summary</span>
                <p>{analysis.executiveSummary}</p>
                <div className="market-tags">
                  <span>{analysis.instrument}</span><span>{analysis.timeframe}</span><span className={`bias-${analysis.regime.bias}`}>{analysis.regime.bias}</span>
                </div>
              </div>

              <div className="two-up">
                <div className="panel metric-card">
                  <span className="section-kicker">Market regime</span>
                  <h4>{analysis.regime.classification}</h4>
                  <dl>
                    <div><dt>Bias</dt><dd>{analysis.regime.bias}</dd></div>
                    <div><dt>Volatility</dt><dd>{analysis.regime.volatility}</dd></div>
                    <div><dt>TF alignment</dt><dd>{analysis.regime.timeframeAlignment}</dd></div>
                  </dl>
                </div>
                <div className="panel metric-card">
                  <span className="section-kicker">Actionable plan</span>
                  <dl>
                    <div><dt>Direction</dt><dd>{analysis.tradePlan.direction}</dd></div>
                    <div><dt>Entry</dt><dd>{money(analysis.tradePlan.entryZone.low)} – {money(analysis.tradePlan.entryZone.high)}</dd></div>
                    <div><dt>Stop</dt><dd>{money(analysis.tradePlan.stopLoss)}</dd></div>
                    <div><dt>R:R</dt><dd>{analysis.tradePlan.riskReward ?? "—"}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="panel detail-card">
                <div className="card-title"><div><span className="section-kicker">Structure map</span><h4>Key levels</h4></div><Target size={18} /></div>
                <div className="level-list">{analysis.levels.map((level) => <LevelRow key={`${level.label}-${level.kind}`} level={level} />)}</div>
              </div>

              <div className="panel detail-card">
                <div className="card-title"><div><span className="section-kicker">Decision matrix</span><h4>Confluence checklist</h4></div><Layers3 size={18} /></div>
                <div className="confluence-list">
                  {analysis.confluences.map((item) => (
                    <div className="confluence-row" key={item.label}>
                      <StatusDot status={item.status} />
                      <div><strong>{item.label}</strong><p>{item.detail}</p></div>
                      <span>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <details className="panel expandable">
                <summary><div><span className="section-kicker">Deep dive</span><strong>Invalidation, watchlist & limitations</strong></div><ChevronRight size={18} /></summary>
                <div className="expand-content">
                  <section><h5>What changes the bias</h5>{analysis.biasInvalidation.map((item) => <p key={item}>{item}</p>)}</section>
                  <section><h5>Next candle / session watchlist</h5>{analysis.watchlist.map((item) => <p key={item}>{item}</p>)}</section>
                  <section><h5>Risk flags</h5><div className="risk-pills">{analysis.riskFlags.map((item) => <span key={item}>{item}</span>)}</div></section>
                  <section><h5>Analysis limitations</h5>{analysis.limitations.map((item) => <p key={item}>{item}</p>)}</section>
                </div>
              </details>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="brand compact"><span className="brand-mark"><ScanLine size={17} /></span><span>ChartOracle <b>Pro</b></span></div>
        <p>Technical analysis is probabilistic. Verify market conditions independently before risking capital.</p>
        <span>Built for disciplined decision-making.</span>
      </footer>
    </main>
  );
}
