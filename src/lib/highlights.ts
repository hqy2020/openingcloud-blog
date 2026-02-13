type DB = import('@cloudflare/workers-types').D1Database;

export interface HighlightStage {
  id: number;
  label: string;
  period: string | null;
  sort_order: number;
  created_at: string;
}

export interface HighlightItem {
  id: number;
  stage_id: number;
  content: string;
  sort_order: number;
  created_at: string;
}

export async function getHighlightStages(db: DB) {
  const rows = await db
    .prepare('SELECT * FROM highlight_stages ORDER BY sort_order ASC, id ASC')
    .all<HighlightStage>();

  return rows.results;
}

export async function getHighlightItems(db: DB) {
  const rows = await db
    .prepare('SELECT * FROM highlight_items ORDER BY stage_id ASC, sort_order ASC, id ASC')
    .all<HighlightItem>();

  return rows.results;
}

export async function getHighlights(db: DB) {
  const [stages, items] = await Promise.all([getHighlightStages(db), getHighlightItems(db)]);
  return stages.map((stage) => ({
    ...stage,
    items: items.filter((item) => item.stage_id === stage.id),
  }));
}

export async function createHighlightStage(db: DB, data: { label: string; period?: string; sort_order?: number }) {
  const result = await db
    .prepare('INSERT INTO highlight_stages (label, period, sort_order) VALUES (?, ?, ?)')
    .bind(data.label, data.period ?? null, data.sort_order ?? 0)
    .run();

  return { id: result.meta.last_row_id };
}

export async function updateHighlightStage(
  db: DB,
  id: number,
  data: {
    label?: string;
    period?: string | null;
    sort_order?: number;
  }
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.label !== undefined) {
    fields.push('label = ?');
    params.push(data.label);
  }
  if (data.period !== undefined) {
    fields.push('period = ?');
    params.push(data.period);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (fields.length === 0) return { changes: 0 };

  params.push(id);
  const result = await db
    .prepare(`UPDATE highlight_stages SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return { changes: result.meta.changes };
}

export async function deleteHighlightStage(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM highlight_stages WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function createHighlightItem(
  db: DB,
  data: {
    stage_id: number;
    content: string;
    sort_order?: number;
  }
) {
  const result = await db
    .prepare('INSERT INTO highlight_items (stage_id, content, sort_order) VALUES (?, ?, ?)')
    .bind(data.stage_id, data.content, data.sort_order ?? 0)
    .run();

  return { id: result.meta.last_row_id };
}

export async function updateHighlightItem(
  db: DB,
  id: number,
  data: {
    stage_id?: number;
    content?: string;
    sort_order?: number;
  }
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.stage_id !== undefined) {
    fields.push('stage_id = ?');
    params.push(data.stage_id);
  }
  if (data.content !== undefined) {
    fields.push('content = ?');
    params.push(data.content);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (fields.length === 0) return { changes: 0 };

  params.push(id);

  const result = await db
    .prepare(`UPDATE highlight_items SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return { changes: result.meta.changes };
}

export async function deleteHighlightItem(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM highlight_items WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function reorderHighlights(
  db: DB,
  payload: {
    stages?: Array<{ id: number; sort_order: number }>;
    items?: Array<{ id: number; sort_order: number; stage_id?: number }>;
  }
) {
  let changes = 0;

  if (payload.stages) {
    for (const stage of payload.stages) {
      const result = await db
        .prepare('UPDATE highlight_stages SET sort_order = ? WHERE id = ?')
        .bind(stage.sort_order, stage.id)
        .run();
      changes += result.meta.changes;
    }
  }

  if (payload.items) {
    for (const item of payload.items) {
      if (item.stage_id !== undefined) {
        const result = await db
          .prepare('UPDATE highlight_items SET sort_order = ?, stage_id = ? WHERE id = ?')
          .bind(item.sort_order, item.stage_id, item.id)
          .run();
        changes += result.meta.changes;
      } else {
        const result = await db
          .prepare('UPDATE highlight_items SET sort_order = ? WHERE id = ?')
          .bind(item.sort_order, item.id)
          .run();
        changes += result.meta.changes;
      }
    }
  }

  return { changes };
}
