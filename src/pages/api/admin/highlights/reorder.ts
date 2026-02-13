export const prerender = false;

import type { APIRoute } from 'astro';
import { reorderHighlights } from '@/lib/highlights';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效请求体' } }, { status: 400 });
  }

  try {
    const result = await reorderHighlights(db, body as Parameters<typeof reorderHighlights>[1]);
    return Response.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '排序失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
