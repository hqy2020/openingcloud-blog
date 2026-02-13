export const prerender = false;

import type { APIRoute } from 'astro';
import { createTravelPlace, getTravelPlaces } from '@/lib/travel';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const province = url.searchParams.get('province') || undefined;
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('pageSize') || '100');

  try {
    const result = await getTravelPlaces(db, { province, page, pageSize });
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

  if (!body.province || !body.city || !body.period || !body.tag) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: '省份、城市、时间段、标签必填' } },
      { status: 400 }
    );
  }

  try {
    const result = await createTravelPlace(db, body as Parameters<typeof createTravelPlace>[1]);
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
