export const prerender = false;

import type { APIRoute } from 'astro';
import { getPostViews } from '@/lib/post-views';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  const repeated = url.searchParams.getAll('slug');
  const csv = (url.searchParams.get('slugs') || '').split(',').map((item) => item.trim()).filter(Boolean);
  const slugs = [...repeated, ...csv];

  if (slugs.length === 0) {
    return Response.json({ ok: true, data: {} });
  }

  if (slugs.length > 300) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: '一次最多查询 300 个 slug' } },
      { status: 400 }
    );
  }

  try {
    const viewMap = await getPostViews(db, slugs);
    return Response.json({ ok: true, data: viewMap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
