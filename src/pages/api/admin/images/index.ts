export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  // Forward the multipart request to the Docker image store
  const storeRes = await fetch(`${env.IMAGE_STORE_URL}/v1/images`, {
    method: 'POST',
    headers: {
      'X-API-Key': env.IMAGE_STORE_API_KEY,
      'Content-Type': request.headers.get('content-type') || '',
    },
    body: request.body,
    // @ts-ignore — duplex needed for streaming body
    duplex: 'half',
  });

  const result = await storeRes.json();

  if (!result.ok) {
    return Response.json(result, { status: storeRes.status });
  }

  // Rewrite URL to use public base URL
  result.data.url = `${env.IMAGE_STORE_PUBLIC_URL}/v1/images/${result.data.key}`;

  return Response.json(result, { status: 201 });
};

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime.env;
  const cursor = url.searchParams.get('cursor') || '';
  const limit = url.searchParams.get('limit') || '50';

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', limit);

  const storeRes = await fetch(`${env.IMAGE_STORE_URL}/v1/images?${params}`, {
    headers: { 'X-API-Key': env.IMAGE_STORE_API_KEY },
  });

  const result = await storeRes.json();

  if (!result.ok) {
    return Response.json(result, { status: storeRes.status });
  }

  // Rewrite URLs to use public base URL
  for (const item of result.data.items) {
    item.url = `${env.IMAGE_STORE_PUBLIC_URL}/v1/images/${item.key}`;
  }

  return Response.json(result);
};
