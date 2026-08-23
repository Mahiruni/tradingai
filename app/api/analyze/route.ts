import { NextResponse } from "next/server";
import { getChartAnalysisProvider } from "@/lib/analysis/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function cleanField(value: FormDataEntryValue | null, maxLength = 48) {
  if (typeof value !== "string") return undefined;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength) || undefined;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const chart = form.get("chart");

    if (!(chart instanceof File)) {
      return NextResponse.json({ error: "A chart image is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(chart.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use PNG, JPG/JPEG or WebP." },
        { status: 415 },
      );
    }

    if (chart.size <= 0 || chart.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Chart image must be larger than 0 bytes and no more than 10 MB." },
        { status: 413 },
      );
    }

    const provider = getChartAnalysisProvider();
    const analysis = await provider.analyze({
      instrument: cleanField(form.get("instrument")),
      timeframe: cleanField(form.get("timeframe")),
      fileName: chart.name.slice(0, 180),
      mimeType: chart.type,
      fileSize: chart.size,
    });

    return NextResponse.json(analysis, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The chart could not be processed. Try a different screenshot." },
      { status: 500 },
    );
  }
}
