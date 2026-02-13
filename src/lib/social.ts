type DB = import('@cloudflare/workers-types').D1Database;

export interface SocialFriend {
  id: number;
  stage_id: string;
  name: string;
  public_label: string;
  bio: string | null;
  avatar: string | null;
  link: string | null;
  platform: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialFilters {
  stage_id?: string;
  page?: number;
  pageSize?: number;
}

export async function getSocialFriends(db: DB, filters: SocialFilters = {}) {
  const { stage_id, page = 1, pageSize = 120 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (stage_id) {
    conditions.push('stage_id = ?');
    params.push(stage_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM social_friends ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const rows = await db
    .prepare(`SELECT * FROM social_friends ${where} ORDER BY stage_id ASC, sort_order ASC, id ASC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, offset)
    .all<SocialFriend>();

  return {
    friends: rows.results,
    total: countResult?.total ?? 0,
    page,
    pageSize,
  };
}

export async function getSocialFriend(db: DB, id: number) {
  return db.prepare('SELECT * FROM social_friends WHERE id = ?').bind(id).first<SocialFriend>();
}

export async function createSocialFriend(
  db: DB,
  data: {
    stage_id: string;
    name: string;
    public_label: string;
    bio?: string;
    avatar?: string;
    link?: string;
    platform?: string;
    sort_order?: number;
  }
) {
  const result = await db
    .prepare('INSERT INTO social_friends (stage_id, name, public_label, bio, avatar, link, platform, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(
      data.stage_id,
      data.name,
      data.public_label,
      data.bio ?? null,
      data.avatar ?? null,
      data.link ?? null,
      data.platform ?? 'other',
      data.sort_order ?? 0
    )
    .run();

  return { id: result.meta.last_row_id };
}

export async function updateSocialFriend(
  db: DB,
  id: number,
  data: {
    stage_id?: string;
    name?: string;
    public_label?: string;
    bio?: string | null;
    avatar?: string | null;
    link?: string | null;
    platform?: string;
    sort_order?: number;
  }
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.stage_id !== undefined) {
    fields.push('stage_id = ?');
    params.push(data.stage_id);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.public_label !== undefined) {
    fields.push('public_label = ?');
    params.push(data.public_label);
  }
  if (data.bio !== undefined) {
    fields.push('bio = ?');
    params.push(data.bio);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    params.push(data.avatar);
  }
  if (data.link !== undefined) {
    fields.push('link = ?');
    params.push(data.link);
  }
  if (data.platform !== undefined) {
    fields.push('platform = ?');
    params.push(data.platform);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (fields.length === 0) return { changes: 0 };

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = await db
    .prepare(`UPDATE social_friends SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return { changes: result.meta.changes };
}

export async function deleteSocialFriend(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM social_friends WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function getSocialPublicGraph(db: DB) {
  const rows = await db
    .prepare('SELECT stage_id, public_label FROM social_friends ORDER BY stage_id ASC, sort_order ASC, id ASC')
    .all<{ stage_id: string; public_label: string }>();

  return rows.results;
}
