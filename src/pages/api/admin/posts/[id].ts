export const prerender = false;

import type { APIRoute } from 'astro';
import { getPost, updatePost, deletePost } from '@/lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  const post = await getPost(db, id);
  if (!post) {
    return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '文章不存在' } }, { status: 404 });
  }
  return Response.json({ ok: true, data: post });
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

  const { title, slug, description, content, category, tags, cover } = body as {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    cover?: string;
  };

  try {
    const result = await updatePost(db, id, { title, slug, description, content, category, tags, cover });
    if (result.changes === 0) {
      return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '文章不存在' } }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '更新失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.BLOG_DB;
  const id = Number(params.id);

  const result = await deletePost(db, id);
  if (result.changes === 0) {
    return Response.json({ ok: false, error: { code: 'NOT_FOUND', message: '文章不存在' } }, { status: 404 });
  }
  return Response.json({ ok: true });
};
