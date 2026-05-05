import { prepare, layout } from "@chenglou/pretext";
import type { Strategy } from "./types";

export const pretextStrategy: Strategy = {
  name: "pretext",
  prepareForText: async (text: string) => {
    const t0 = performance.now();
    const handle = prepare(text, '16px "Inter"');
    const setupMs = performance.now() - t0;

    return {
      setupMs,
      measurer: {
        measure: (widthPx: number) => layout(handle, widthPx, 24).height,
      },
    };
  },
};
