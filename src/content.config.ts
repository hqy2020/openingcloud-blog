import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.literal('journal'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const tech = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/tech' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.literal('tech'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const learning = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/learning' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.literal('learning'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const life = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/life' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.literal('life'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { journal, tech, learning, life };
