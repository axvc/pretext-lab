import { describe, expect, it } from "vitest";
import { wrapWords } from "./canvas";

const measure = (s: string) => s.length * 8;
const spaceW = 4;

describe("wrapWords", () => {
  it("returns 0 for empty string", () => {
    expect(wrapWords("", 200, measure, spaceW)).toBe(0);
  });

  it("single short word fits on one line", () => {
    expect(wrapWords("hello", 200, measure, spaceW)).toBe(1);
  });

  it("words that exactly fit stay on one line", () => {
    // "ab cd" = 16 + 4 + 16 = 36
    expect(wrapWords("ab cd", 36, measure, spaceW)).toBe(1);
  });

  it("overflow by one character wraps to second line", () => {
    // "ab cd" = 36, max = 35
    expect(wrapWords("ab cd", 35, measure, spaceW)).toBe(2);
  });

  it("each oversized word gets its own line", () => {
    // each word is 80px wide, max is 50
    expect(wrapWords("aaaaaaaaaa bbbbbbbbbb cccccccccc", 50, measure, spaceW)).toBe(3);
  });
});
