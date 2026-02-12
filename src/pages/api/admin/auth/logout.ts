export const prerender = false;

import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '@/lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return Response.json({ ok: true });
};
