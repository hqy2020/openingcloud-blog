export const prerender = false;

import type { APIRoute } from 'astro';
import { getTimelineNodes, createTimelineNode } from '@/lib/timeline';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const type = url.searchParams.get('type') || undefined;
  const phase = url.searchParams.get('phase') || undefined;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

  try {
    const result = await getTimelineNodes(db, { type, phase, from, to, page, pageSize });
    return Response.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  if (!body.title || !body.start_date || !body.type) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: '标题、开始日期和类型必填' } },
      { status: 400 }
    );
  }

  try {
    const result = await createTimelineNode(db, body as Parameters<typeof createTimelineNode>[1]);
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '创建失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
