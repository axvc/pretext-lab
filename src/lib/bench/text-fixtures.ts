const LOREM =
  "lorem sit ipsum dolor amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";

export function loremOfLength(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";

  let text = LOREM;
  while (text.length < n) {
    text = `${text} ${LOREM}`;
  }

  const clipped = text.slice(0, n);
  const nextChar = text[n];
  if (nextChar === undefined || /\s/.test(nextChar)) {
    return clipped.trimEnd();
  }

  const lastBoundary = clipped.search(/\s+\S*$/);
  if (lastBoundary <= 0) return clipped.trimEnd();

  return clipped.slice(0, lastBoundary).trimEnd();
}
