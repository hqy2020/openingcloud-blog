export const prerender = false;

import type { APIRoute } from 'astro';
import { getDiaryEntries, createDiaryEntry } from '@/lib/diary';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '30');

  const result = await getDiaryEntries(db, { from, to, page, pageSize });
  return Response.json({ ok: true, data: result });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  if (!body.date) {
    return Response.json({ ok: false, error: { code: 'VALIDATION', message: '日期必填' } }, { status: 400 });
  }

  try {
    const result = await createDiaryEntry(db, body as {
      date: string;
      steps?: number;
      sleep_hours?: number;
      focus_hours?: number;
      exercise_minutes?: number;
      mood?: number;
      note?: string;
      tags?: string[];
    });
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '创建失败';
    if (message.includes('UNIQUE')) {
      return Response.json({ ok: false, error: { code: 'DUPLICATE', message: '该日期已有记录' } }, { status: 409 });
    }
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
