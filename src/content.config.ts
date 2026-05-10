import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const experiments = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/experiments",
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    status: z.enum(["draft", "published", "planned"]),
    apis: z.array(z.string()),
    publishedDate: z.string().optional(),
    quote: z.string().optional(),
    detail: z.string().optional(),
  }),
});

export const collections = { experiments };
