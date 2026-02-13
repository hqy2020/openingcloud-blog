export const prerender = false;

import type { APIRoute } from 'astro';
import { deleteTravelPlace, getTravelPlace, updateTravelPlace } from '@/lib/travel';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  try {
    const place = await getTravelPlace(db, id);
    if (!place) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '记录不存在' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: place });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效请求体' } }, { status: 400 });
  }

  try {
    const result = await updateTravelPlace(db, id, body as Parameters<typeof updateTravelPlace>[2]);
    if (result.changes === 0) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '记录不存在' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '更新失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  try {
    const result = await deleteTravelPlace(db, id);
    if (result.changes === 0) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '记录不存在' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '删除失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
