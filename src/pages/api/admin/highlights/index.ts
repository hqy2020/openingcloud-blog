export const prerender = false;

import type { APIRoute } from 'astro';
import { getHighlights } from '@/lib/highlights';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  try {
    const result = await getHighlights(db);
    return Response.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
