import type { Strategy } from "./types";

export const domStrategy: Strategy = {
  name: "dom",
  prepareForText: async (text: string) => {
    const el = document.createElement("div");
    el.textContent = text;
    Object.assign(el.style, {
      font: '16px "Inter"',
      lineHeight: "1.5",
      width: "600px",
      whiteSpace: "normal",
      wordBreak: "normal",
      padding: "0",
      margin: "0",
      border: "0",
      position: "absolute",
      visibility: "hidden",
      left: "-9999px",
      top: "0",
    });

    return {
      setupMs: 0,
      measurer: {
        measure: (widthPx: number) => {
          el.style.width = `${widthPx}px`;
          // Append to body so the layout engine runs; detached fragments are dishonestly fast.
          document.body.appendChild(el);
          const h = el.offsetHeight;
          document.body.removeChild(el);
          return h;
        },
        teardown: () => {
          el.remove();
        },
      },
    };
  },
};
