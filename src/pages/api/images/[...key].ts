export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) {
    return new Response('Not Found', { status: 404 });
  }

  const env = locals.runtime.env;
  const publicUrl = `${env.IMAGE_STORE_PUBLIC_URL}/v1/images/${key}`;

  return new Response(null, {
    status: 302,
    headers: { Location: publicUrl },
  });
};
