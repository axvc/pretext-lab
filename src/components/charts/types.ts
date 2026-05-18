export type ScaleType = "linear" | "log";
export type LineStyle = "solid" | "dashed" | "dotted";

export interface SeriesPoint {
  x: number;
  y: number;
}

export interface Series {
  id: string;
  label: string;
  points: SeriesPoint[];
  color: string;
  lineStyle: LineStyle;
  strokeWidth?: number;
}

export interface Annotation {
  x: number;
  y: number;
  label: string;
  color?: string;
}

export interface LineChartProps {
  series: Series[];
  xScale: ScaleType;
  yScale: ScaleType;
  xLabel: string;
  yLabel: string;
  title?: string;
  showYAxisLabels?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
  xTicks?: number[];
  yTicks?: number[];
  width?: number;
  height?: number;
  annotations?: Annotation[];
}
