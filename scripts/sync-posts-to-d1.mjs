#!/usr/bin/env node
/**
 * 将 src/data/ 下的 Markdown 文章同步到 D1 数据库
 * 用法: node scripts/sync-posts-to-d1.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const DATA_DIR = 'src/data';
const CATEGORIES = ['tech', 'learning', 'journal', 'life'];
const SQL_FILE = '/tmp/sync-posts.sql';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.replace(/^["']|["']$/g, '');
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim());
    }
    meta[key] = val;
  }

  return { meta, body: match[2].trim() };
}

function fileToSlug(filename) {
  return filename.replace(/\.(synced|d1)?\.md$/, '');
}

const esc = (s) => s.replace(/'/g, "''");

async function main() {
  const statements = [];

  for (const category of CATEGORIES) {
    const dir = join(DATA_DIR, category);
    let files;
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const content = await readFile(join(dir, file), 'utf-8');
      const parsed = parseFrontmatter(content);
      if (!parsed) {
        console.warn(`⚠ 跳过 (无 frontmatter): ${category}/${file}`);
        continue;
      }

      const slug = fileToSlug(file);
      const tags = Array.isArray(parsed.meta.tags) ? parsed.meta.tags : [];
      const date = parsed.meta.date || '2026-02-10';

      statements.push(
        `INSERT INTO posts (title, slug, description, content, category, tags, draft, created_at, updated_at) ` +
        `VALUES ('${esc(parsed.meta.title || slug)}', '${esc(slug)}', '${esc(parsed.meta.description || '')}', '${esc(parsed.body)}', '${esc(category)}', '${esc(JSON.stringify(tags))}', 0, '${date}', '${date}') ` +
        `ON CONFLICT(slug) DO NOTHING;`
      );

      console.log(`📄 ${category}/${slug}`);
    }
  }

  console.log(`\n📝 共 ${statements.length} 篇文章，生成 SQL 并执行...\n`);

  await writeFile(SQL_FILE, statements.join('\n'), 'utf-8');

  try {
    const out = execSync(`npx wrangler d1 execute openingcloud_blog_prod --remote --file="${SQL_FILE}"`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log(out.toString());
    console.log(`✅ 同步完成！`);
  } catch (e) {
    console.error(`❌ 执行失败:`, e.stderr?.toString() || e.message);
  }
}

main().catch(console.error);
