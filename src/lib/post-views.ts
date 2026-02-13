type DB = import('@cloudflare/workers-types').D1Database;

export interface PostViewRow {
  slug: string;
  views: number;
}

function normalizeSlug(raw: string) {
  return raw.trim().replace(/^\/+|\/+$/g, '');
}

export async function getPostViews(db: DB, slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.map(normalizeSlug).filter(Boolean))];
  if (uniqueSlugs.length === 0) return {} as Record<string, number>;

  const placeholders = uniqueSlugs.map(() => '?').join(', ');
  const rows = await db
    .prepare(`SELECT slug, views FROM post_views WHERE slug IN (${placeholders})`)
    .bind(...uniqueSlugs)
    .all<PostViewRow>();

  const viewMap: Record<string, number> = {};
  uniqueSlugs.forEach((slug) => {
    viewMap[slug] = 0;
  });

  rows.results.forEach((row) => {
    viewMap[row.slug] = row.views;
  });

  return viewMap;
}

export async function incrementPostView(db: DB, slugInput: string) {
  const slug = normalizeSlug(slugInput);
  if (!slug) {
    throw new Error('INVALID_SLUG');
  }

  await db
    .prepare(
      `INSERT INTO post_views (slug, views, updated_at)
       VALUES (?, 1, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         views = views + 1,
         updated_at = datetime('now')`
    )
    .bind(slug)
    .run();

  const row = await db
    .prepare('SELECT views FROM post_views WHERE slug = ?')
    .bind(slug)
    .first<{ views: number }>();

  return { slug, views: row?.views ?? 1 };
}
