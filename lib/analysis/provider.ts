import { runOfflineAnalysis } from "./offline-engine";
import type { AnalysisRequestMetadata, ChartAnalysis } from "./types";

export interface ChartAnalysisProvider {
  analyze(metadata: AnalysisRequestMetadata): Promise<ChartAnalysis>;
}

class OfflinePreviewProvider implements ChartAnalysisProvider {
  async analyze(metadata: AnalysisRequestMetadata): Promise<ChartAnalysis> {
    return runOfflineAnalysis(metadata);
  }
}

/**
 * Provider boundary for the product.
 *
 * The current build intentionally resolves to a no-network provider. A future
 * vision adapter can implement ChartAnalysisProvider while preserving the API
 * route and every frontend component.
 */
export function getChartAnalysisProvider(): ChartAnalysisProvider {
  return new OfflinePreviewProvider();
}
