export const prerender = false;

import type { APIRoute } from 'astro';
import { getDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '@/lib/diary';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  const entry = await getDiaryEntry(db, id);
  if (!entry) {
    return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '未找到' } }, { status: 404 });
  }
  return Response.json({ ok: true, data: entry });
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
    const result = await updateDiaryEntry(db, id, body as {
      date?: string;
      steps?: number | null;
      sleep_hours?: number | null;
      focus_hours?: number | null;
      exercise_minutes?: number | null;
      mood?: number | null;
      note?: string | null;
      tags?: string[];
    });
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

  const result = await deleteDiaryEntry(db, id);
  if (result.changes === 0) {
    return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '未找到' } }, { status: 404 });
  }
  return Response.json({ ok: true });
};
