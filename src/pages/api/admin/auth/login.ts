export const prerender = false;

import type { APIRoute } from 'astro';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = locals.runtime.env;

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: '无效的请求体' } }, { status: 400 });
  }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return Response.json({ ok: false, error: { code: 'INVALID_PASSWORD', message: '密码错误' } }, { status: 401 });
  }

  const token = await signToken(env.ADMIN_JWT_SECRET);

  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return Response.json({ ok: true });
};
