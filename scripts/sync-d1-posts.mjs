/**
 * sync-d1-posts.mjs — 构建时从 D1 拉取已发布文章并生成 .d1.md 文件
 *
 * 环境变量:
 *   CF_ACCOUNT_ID    — Cloudflare Account ID
 *   CF_API_TOKEN     — Cloudflare API Token (需要 D1 读权限)
 *   D1_DATABASE_ID   — D1 数据库 ID
 *
 * 如果环境变量缺失则跳过同步（本地开发场景）
 */

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN;
const DATABASE_ID = process.env.D1_DATABASE_ID;

const DATA_DIR = join(process.cwd(), 'src', 'data');

async function main() {
  if (!ACCOUNT_ID || !API_TOKEN || !DATABASE_ID) {
    console.log('[sync-d1] 环境变量缺失，跳过 D1 同步');
    return;
  }

  console.log('[sync-d1] 开始从 D1 同步已发布文章...');

  // 清理旧的 .d1.md 文件
  for (const category of ['tech', 'learning', 'journal', 'life']) {
    const dir = join(DATA_DIR, category);
    try {
      const files = readdirSync(dir);
      for (const f of files) {
        if (f.endsWith('.d1.md')) {
          unlinkSync(join(dir, f));
        }
      }
    } catch {
      // 目录不存在，跳过
    }
  }

  // 查询 D1
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: 'SELECT * FROM posts WHERE draft = 0 ORDER BY created_at DESC',
    }),
  });

  if (!res.ok) {
    console.error('[sync-d1] D1 API 错误:', res.status, await res.text());
    return;
  }

  const json = await res.json();
  const rows = json.result?.[0]?.results || [];
  console.log(`[sync-d1] 获取到 ${rows.length} 篇已发布文章`);

  for (const post of rows) {
    const dir = join(DATA_DIR, post.category);
    mkdirSync(dir, { recursive: true });

    let tags;
    try {
      tags = JSON.parse(post.tags || '[]');
    } catch {
      tags = [];
    }

    const frontmatter = [
      '---',
      `title: "${post.title.replace(/"/g, '\\"')}"`,
      post.description ? `description: "${post.description.replace(/"/g, '\\"')}"` : null,
      `date: ${post.created_at.split('T')[0] || post.created_at.split(' ')[0]}`,
      `category: ${post.category}`,
      `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
      post.cover ? `cover: "${post.cover}"` : null,
      'draft: false',
      '---',
    ]
      .filter(Boolean)
      .join('\n');

    const content = `${frontmatter}\n\n${post.content}`;
    const filePath = join(dir, `${post.slug}.d1.md`);
    writeFileSync(filePath, content, 'utf-8');
    console.log(`[sync-d1]   写入: ${post.category}/${post.slug}.d1.md`);
  }

  console.log('[sync-d1] 同步完成');
}

main().catch((err) => {
  console.error('[sync-d1] 同步出错:', err);
  // 不中断构建流程 — 同步失败时仍可使用已有的静态文件
});
