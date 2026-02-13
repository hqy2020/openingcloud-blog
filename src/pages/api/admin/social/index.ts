export const prerender = false;

import type { APIRoute } from 'astro';
import { createSocialFriend, getSocialFriends } from '@/lib/social';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const stage_id = url.searchParams.get('stage_id') || undefined;
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('pageSize') || '120');

  try {
    const result = await getSocialFriends(db, { stage_id, page, pageSize });
    return Response.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效请求体' } }, { status: 400 });
  }

  if (!body.stage_id || !body.name || !body.public_label) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: '阶段、姓名、公开称呼必填' } },
      { status: 400 }
    );
  }

  try {
    const result = await createSocialFriend(db, body as Parameters<typeof createSocialFriend>[1]);
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
