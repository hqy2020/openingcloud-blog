export const prerender = false;

import type { APIRoute } from 'astro';
import { reorderTimelineNodes } from '@/lib/timeline';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  if (!Array.isArray(body.orders)) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: 'orders 数组必填' } },
      { status: 400 }
    );
  }

  try {
    const result = await reorderTimelineNodes(db, body.orders);
    return Response.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '排序失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
