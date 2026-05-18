import type { ScaleType } from "../types";

export function log10(x: number): number {
  return Math.log10(x);
}

export type Scale = (value: number) => number;

export function makeScale(
  type: ScaleType,
  domain: readonly [number, number],
  range: readonly [number, number],
): Scale {
  const [r0, r1] = range;
  const rSpan = r1 - r0;

  if (type === "log") {
    const d0 = log10(domain[0]);
    const d1 = log10(domain[1]);
    const dSpan = d1 - d0;
    return (x: number) => r0 + ((log10(x) - d0) / dSpan) * rSpan;
  }

  const [d0, d1] = domain;
  const dSpan = d1 - d0;
  return (x: number) => r0 + ((x - d0) / dSpan) * rSpan;
}

export function logTicks(domain: readonly [number, number]): number[] {
  const lo = Math.ceil(log10(domain[0]));
  const hi = Math.floor(log10(domain[1]));
  const out: number[] = [];
  for (let k = lo; k <= hi; k++) out.push(10 ** k);
  return out;
}

export function paddedLogDomain(values: number[]): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return [10 ** Math.floor(log10(lo)), 10 ** Math.ceil(log10(hi))];
}

export function paddedLinearDomain(
  values: number[],
  padFraction = 0.05,
): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * padFraction;
  return [lo - pad, hi + pad];
}
