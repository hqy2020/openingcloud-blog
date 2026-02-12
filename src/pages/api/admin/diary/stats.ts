export const prerender = false;

import type { APIRoute } from 'astro';
import { getDiaryStats } from '@/lib/diary';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  const stats = await getDiaryStats(db, from, to);
  return Response.json({ ok: true, data: stats });
};
