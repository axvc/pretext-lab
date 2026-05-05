export type StrategyName = "dom" | "canvas" | "pretext";

export type PreparedMeasurer = {
  measure: (widthPx: number) => number;
  teardown?: () => void;
};

export type Strategy = {
  name: StrategyName;
  prepareForText: (text: string) => Promise<{
    setupMs: number;
    measurer: PreparedMeasurer;
  }>;
};
