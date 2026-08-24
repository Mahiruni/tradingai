import { runOfflineAnalysis } from "./offline-engine";
import type { AnalysisRequestMetadata, ChartAnalysis } from "./types";

export interface ChartAnalysisInput {
  image: File;
  metadata: AnalysisRequestMetadata;
}

export interface ChartAnalysisProvider {
  analyze(input: ChartAnalysisInput): Promise<ChartAnalysis>;
}

class OfflinePreviewProvider implements ChartAnalysisProvider {
  async analyze(input: ChartAnalysisInput): Promise<ChartAnalysis> {
    return runOfflineAnalysis(input.metadata);
  }
}

/**
 * Provider boundary for the product.
 *
 * The current build intentionally resolves to a no-network provider. A future
 * vision adapter can consume the transient `image` and implement the same
 * ChartAnalysisProvider contract while preserving the API route, upload flow,
 * response schema and every frontend component.
 */
export function getChartAnalysisProvider(): ChartAnalysisProvider {
  return new OfflinePreviewProvider();
}
