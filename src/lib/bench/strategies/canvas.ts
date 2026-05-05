import type { Strategy } from "./types";

export function wrapWords(
  text: string,
  maxWidthPx: number,
  measureWord: (s: string) => number,
  spaceWidthPx: number,
): number {
  if (text === "") return 0;

  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 0;

  let lines = 1;
  let lineWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const wordWidth = measureWord(word);

    if (i === 0) {
      lineWidth = wordWidth;
      continue;
    }

    const next = lineWidth + spaceWidthPx + wordWidth;
    if (next > maxWidthPx) {
      lines++;
      lineWidth = wordWidth;
    } else {
      lineWidth = next;
    }
  }

  return lines;
}

export const canvasStrategy: Strategy = {
  name: "canvas",
  prepareForText: async (text: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }

    ctx.font = '16px "Inter"';

    const spaceWidth = ctx.measureText(" ").width;
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const wordWidths = new Map<string, number>();
    for (const w of words) {
      if (!wordWidths.has(w)) {
        wordWidths.set(w, ctx.measureText(w).width);
      }
    }

    const measureWord = (s: string) => wordWidths.get(s) ?? ctx.measureText(s).width;
    const lineHeightPx = 16 * 1.5;

    return {
      setupMs: 0,
      measurer: {
        measure: (widthPx: number) => {
          const lineCount = wrapWords(text, widthPx, measureWord, spaceWidth);
          return lineCount * lineHeightPx;
        },
      },
    };
  },
};
