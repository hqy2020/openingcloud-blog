export const prerender = false;

import type { APIRoute } from 'astro';
import { toggleDraft } from '@/lib/db';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  let body: { draft?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  if (body.draft === undefined || (body.draft !== 0 && body.draft !== 1)) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: 'draft 必须为 0 或 1' } },
      { status: 400 }
    );
  }

  const result = await toggleDraft(db, id, body.draft);
  if (result.changes === 0) {
    return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '文章不存在' } }, { status: 404 });
  }
  return Response.json({ ok: true });
};
