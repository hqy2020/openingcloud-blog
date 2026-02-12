import { defineMiddleware } from 'astro:middleware';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // 只保护 /admin 和 /api/admin 路由
  const isProtected =
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !PUBLIC_PATHS.some((p) => pathname === p || pathname === p + '/');

  if (!isProtected) {
    return next();
  }

  const token = context.cookies.get(COOKIE_NAME)?.value;
  const secret = context.locals.runtime?.env?.ADMIN_JWT_SECRET;

  if (!token || !secret || !(await verifyToken(token, secret))) {
    // API 路由返回 401
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // 页面路由重定向到登录页
    return context.redirect('/admin/login');
  }

  return next();
});
