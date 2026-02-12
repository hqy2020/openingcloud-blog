/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;

type Runtime = import('@astrojs/cloudflare').Runtime<{
  BLOG_DB: D1Database;
  ADMIN_PASSWORD: string;
  ADMIN_JWT_SECRET: string;
  IMAGE_STORE_URL: string;
  IMAGE_STORE_PUBLIC_URL: string;
  IMAGE_STORE_API_KEY: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
