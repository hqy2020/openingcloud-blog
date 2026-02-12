export const prerender = false;

import type { APIRoute } from 'astro';
import { getPosts, createPost } from '@/lib/db';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const category = url.searchParams.get('category') || undefined;
  const draft = url.searchParams.has('draft') ? Number(url.searchParams.get('draft')) : undefined;
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('pageSize') || '20');

  const result = await getPosts(db, { category, draft, page, pageSize });
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

  const { title, slug, description, content, category, tags, cover, draft } = body as {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    cover?: string;
    draft?: number;
  };

  if (!title || !slug || !content || !category) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: '标题、slug、内容和分类为必填项' } },
      { status: 400 }
    );
  }

  try {
    const result = await createPost(db, { title, slug, description, content, category, tags, cover, draft });
    return Response.json({ ok: true, data: result }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '创建失败';
    if (message.includes('UNIQUE')) {
      return Response.json({ ok: false, error: { code: 'DUPLICATE_SLUG', message: 'slug 已存在' } }, { status: 409 });
    }
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
