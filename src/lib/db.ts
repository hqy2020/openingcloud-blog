type DB = import('@cloudflare/workers-types').D1Database;

export interface Post {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  category: 'tech' | 'learning' | 'journal' | 'life';
  tags: string; // JSON array string
  cover: string | null;
  draft: number; // 0=published, 1=draft
  created_at: string;
  updated_at: string;
}

export interface PostFilters {
  category?: string;
  draft?: number;
  page?: number;
  pageSize?: number;
}

export async function getPosts(db: DB, filters: PostFilters = {}) {
  const { category, draft, page = 1, pageSize = 20 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (draft !== undefined) {
    conditions.push('draft = ?');
    params.push(draft);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM posts ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const rows = await db
    .prepare(`SELECT id, title, slug, description, category, tags, cover, draft, created_at, updated_at FROM posts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, offset)
    .all<Omit<Post, 'content'>>();

  return {
    posts: rows.results,
    total: countResult?.total ?? 0,
    page,
    pageSize,
  };
}

export async function getPost(db: DB, id: number) {
  return db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<Post>();
}

export async function createPost(db: DB, data: {
  title: string;
  slug: string;
  description?: string;
  content: string;
  category: string;
  tags?: string[];
  cover?: string;
  draft?: number;
}) {
  const result = await db
    .prepare(
      'INSERT INTO posts (title, slug, description, content, category, tags, cover, draft) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      data.title,
      data.slug,
      data.description ?? null,
      data.content,
      data.category,
      JSON.stringify(data.tags ?? []),
      data.cover ?? null,
      data.draft ?? 1
    )
    .run();

  return { id: result.meta.last_row_id };
}

export async function updatePost(db: DB, id: number, data: {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  cover?: string;
}) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.slug !== undefined) { fields.push('slug = ?'); params.push(data.slug); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.content !== undefined) { fields.push('content = ?'); params.push(data.content); }
  if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
  if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }
  if (data.cover !== undefined) { fields.push('cover = ?'); params.push(data.cover); }

  if (fields.length === 0) return { changes: 0 };

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = await db
    .prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return { changes: result.meta.changes };
}

export async function deletePost(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function toggleDraft(db: DB, id: number, draft: number) {
  const result = await db
    .prepare("UPDATE posts SET draft = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(draft, id)
    .run();
  return { changes: result.meta.changes };
}
