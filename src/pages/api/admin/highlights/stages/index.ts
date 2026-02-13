export const prerender = false;

import type { APIRoute } from 'astro';
import { createHighlightStage } from '@/lib/highlights';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效请求体' } }, { status: 400 });
  }

  if (!body.label) {
    return Response.json({ ok: false, error: { code: 'VALIDATION', message: '阶段名称必填' } }, { status: 400 });
  }

  try {
    const result = await createHighlightStage(db, body as Parameters<typeof createHighlightStage>[1]);
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
