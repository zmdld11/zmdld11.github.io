import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** 博客文章：每篇一个目录 <slug>/index.md，图片同目录随迁 */
const posts = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().default(""),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
