export const prerender = false;

import type { APIRoute } from 'astro';
import { incrementPostView } from '@/lib/post-views';

const VIEW_WINDOW_SECONDS = 6 * 60 * 60;

function normalizeSlug(raw: string) {
  return raw.trim().replace(/^\/+|\/+$/g, '');
}

function hashSlug(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export const POST: APIRoute = async ({ params, locals, cookies }) => {
  const db = locals.runtime.env.BLOG_DB;
  const slug = normalizeSlug(params.slug || '');

  if (!slug) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION', message: 'slug 不能为空' } },
      { status: 400 }
    );
  }

  const dedupeCookie = `oc_pv_${hashSlug(slug)}`;
  if (cookies.has(dedupeCookie)) {
    return Response.json({ ok: true, data: { slug, skipped: true } });
  }

  try {
    const result = await incrementPostView(db, slug);

    cookies.set(dedupeCookie, '1', {
      path: '/',
      maxAge: VIEW_WINDOW_SECONDS,
      sameSite: 'lax',
      httpOnly: true,
    });

    return Response.json({ ok: true, data: { ...result, skipped: false } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '上报失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};
