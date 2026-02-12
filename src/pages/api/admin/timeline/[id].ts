export const prerender = false;

import type { APIRoute } from 'astro';
import { getTimelineNode, updateTimelineNode, deleteTimelineNode } from '@/lib/timeline';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  try {
    const node = await getTimelineNode(db, id);
    if (!node) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '未找到' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: node });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '查询失败';
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
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  try {
    const result = await updateTimelineNode(db, id, body as Parameters<typeof updateTimelineNode>[2]);
    if (result.changes === 0) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '未找到' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '更新失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  try {
    const result = await deleteTimelineNode(db, id);
    if (result.changes === 0) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '未找到' } }, { status: 404 });
    }
    return Response.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '删除失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
