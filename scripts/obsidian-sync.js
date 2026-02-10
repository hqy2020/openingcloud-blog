#!/usr/bin/env node

/**
 * Obsidian → Astro 同步脚本
 * 扫描 vault 中带 #publish 标签的 markdown，转换为 Astro Content Collections 格式
 */

import fs from 'fs';
import path from 'path';

// ─── 配置 ──────────────────────────────────────
const VAULT_PATH = '/Users/openingcloud/Documents/GardenOfOpeningClouds';
const BLOG_PATH = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(BLOG_PATH, 'src/data');
const IMAGES_DIR = path.join(BLOG_PATH, 'public/images');

const CATEGORIES = ['journal', 'tech', 'learning', 'life'];
const SENSITIVE_FIELDS = ['奖励', '使用手机时间'];

// Obsidian 附件目录（常见位置）
const ATTACHMENT_DIRS = [
  path.join(VAULT_PATH, 'attachments'),
  path.join(VAULT_PATH, '2-Resource/attachments'),
  path.join(VAULT_PATH, 'assets'),
];

// ─── 工具函数 ──────────────────────────────────

function findAllMarkdown(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      results.push(...findAllMarkdown(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const rawFm = match[1];
  const body = content.slice(match[0].length).trim();
  const frontmatter = {};

  const lines = rawFm.split('\n');
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    // YAML 列表项 (  - value)
    const listMatch = line.match(/^\s+-\s+(.+)/);
    if (listMatch && currentKey) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }

    // 保存之前的列表
    if (currentKey && currentList) {
      frontmatter[currentKey] = currentList;
      currentKey = null;
      currentList = null;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // 空值（可能是 YAML 列表的开始）
    if (value === '') {
      currentKey = key;
      currentList = null;
      continue;
    }

    // 数组 [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    // 布尔
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // 去引号
    else {
      value = value.replace(/^["']|["']$/g, '');
    }

    currentKey = null;
    currentList = null;
    frontmatter[key] = value;
  }

  // 处理最后一个列表
  if (currentKey && currentList) {
    frontmatter[currentKey] = currentList;
  }

  return { frontmatter, body };
}

function hasPublishTag(frontmatter, body) {
  const tags = frontmatter.tags || [];
  if (Array.isArray(tags) && tags.includes('publish')) return true;
  if (typeof tags === 'string' && tags.includes('publish')) return true;
  return false;
  return false;
}

function getCategory(frontmatter) {
  const cat = frontmatter.category;
  if (cat && CATEGORIES.includes(cat)) return cat;
  // 尝试从 tags 推断
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  for (const tag of tags) {
    if (tag.startsWith('domain/')) {
      const domain = tag.replace('domain/', '');
      if (['tech', 'java', 'ai', 'agent', 'backend'].includes(domain)) return 'tech';
      if (['learning', 'study', 'method'].includes(domain)) return 'learning';
      if (['life', 'photo', 'travel'].includes(domain)) return 'life';
    }
  }
  return 'journal'; // 默认日记分类
}

// ─── 转换函数 ──────────────────────────────────

function convertWikilinks(text) {
  // 图片嵌入 ![[image.png]] 或 ![[image.png|300]]
  text = text.replace(/!\[\[([^\]|]+?)(?:\|[^\]]*?)?\]\]/g, (_, filename) => {
    return `![${path.basename(filename, path.extname(filename))}](/images/${filename})`;
  });

  // 普通 wikilink [[文件名|显示文本]] 或 [[文件名]]
  text = text.replace(/\[\[([^\]|]+?)(?:\|([^\]]*?))?\]\]/g, (_, target, display) => {
    const text = display || target;
    const slug = target.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fff-]/g, '');
    return `[${text}](/posts/${slug})`;
  });

  return text;
}

function cleanObsidianSyntax(text) {
  // 移除 Dataview 代码块
  text = text.replace(/```dataview[\s\S]*?```/g, '');
  text = text.replace(/```dataviewjs[\s\S]*?```/g, '');

  // 移除行内字段 key:: value
  text = text.replace(/^[a-zA-Z\u4e00-\u9fff_]+::.*$/gm, '');

  // 移除 #publish 标签（已处理过）
  text = text.replace(/#publish\b/g, '');

  // 移除 Obsidian 注释 %%...%%
  text = text.replace(/%%[\s\S]*?%%/g, '');

  return text;
}

function filterSensitiveContent(text, frontmatter) {
  // 从 frontmatter 移除敏感字段
  for (const field of SENSITIVE_FIELDS) {
    delete frontmatter[field];
  }

  // 从正文移除包含敏感词的行
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    return !SENSITIVE_FIELDS.some(field => line.includes(field));
  });

  return filtered.join('\n');
}

function copyImage(filename) {
  for (const dir of ATTACHMENT_DIRS) {
    const src = path.join(dir, filename);
    if (fs.existsSync(src)) {
      const dest = path.join(IMAGES_DIR, filename);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`  📷 复制图片: ${filename}`);
      return true;
    }
  }

  // 在整个 vault 中搜索
  const found = findFile(VAULT_PATH, filename);
  if (found) {
    const dest = path.join(IMAGES_DIR, filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(found, dest);
    console.log(`  📷 复制图片: ${filename}`);
    return true;
  }

  console.warn(`  ⚠️  未找到图片: ${filename}`);
  return false;
}

function findFile(dir, filename) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, filename);
      if (found) return found;
    } else if (entry.name === filename) {
      return fullPath;
    }
  }
  return null;
}

function extractAndCopyImages(text) {
  // 找出所有图片引用
  const imageRegex = /!\[.*?\]\(\/images\/(.*?)\)/g;
  let match;
  while ((match = imageRegex.exec(text)) !== null) {
    copyImage(match[1]);
  }
  return text;
}

function buildFrontmatter(fm) {
  const lines = ['---'];
  if (fm.title) lines.push(`title: "${fm.title}"`);
  if (fm.description) lines.push(`description: "${fm.description}"`);
  if (fm.date) lines.push(`date: ${fm.date}`);
  if (fm.category) lines.push(`category: ${fm.category}`);
  if (fm.cover) lines.push(`cover: "${fm.cover}"`);

  // 清理 tags，移除 publish 和命名空间前缀
  let tags = Array.isArray(fm.tags) ? fm.tags : [];
  tags = tags
    .filter(t => t !== 'publish' && !t.startsWith('type/') && !t.startsWith('status/') && !t.startsWith('source/'))
    .map(t => t.replace(/^domain\//, ''));
  if (tags.length > 0) {
    lines.push(`tags: [${tags.join(', ')}]`);
  }

  lines.push('---');
  return lines.join('\n');
}

// ─── 主流程 ──────────────────────────────────

function main() {
  console.log('🔄 开始同步 Obsidian → Blog...\n');
  console.log(`📂 Vault: ${VAULT_PATH}`);
  console.log(`📂 Blog:  ${BLOG_PATH}\n`);

  // 确保输出目录存在
  for (const cat of CATEGORIES) {
    fs.mkdirSync(path.join(DATA_DIR, cat), { recursive: true });
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // 清空现有同步内容（保留手动创建的文件）
  // 注意：只清理 .synced.md 后缀的文件，避免误删手动内容
  for (const cat of CATEGORIES) {
    const dir = path.join(DATA_DIR, cat);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.synced.md')) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }

  // 扫描 vault
  const allFiles = findAllMarkdown(VAULT_PATH);
  console.log(`📝 扫描到 ${allFiles.length} 个 Markdown 文件\n`);

  let synced = 0;
  for (const filePath of allFiles) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);

    if (!hasPublishTag(frontmatter, body)) continue;

    const category = getCategory(frontmatter);
    const title = frontmatter.title || path.basename(filePath, '.md');
    const date = frontmatter.date || frontmatter.created || new Date().toISOString().split('T')[0];

    console.log(`✅ 同步: ${title} → ${category}/`);

    // 处理正文
    let processedBody = body;
    processedBody = convertWikilinks(processedBody);
    processedBody = cleanObsidianSyntax(processedBody);
    processedBody = filterSensitiveContent(processedBody, frontmatter);
    extractAndCopyImages(processedBody);

    // 构建输出
    const newFm = {
      title,
      description: frontmatter.description || '',
      date,
      category,
      cover: frontmatter.cover || '',
      tags: frontmatter.tags || [],
    };

    const output = buildFrontmatter(newFm) + '\n\n' + processedBody.trim() + '\n';

    // 生成文件名
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
      .slice(0, 80);
    const outputPath = path.join(DATA_DIR, category, `${slug}.synced.md`);

    fs.writeFileSync(outputPath, output, 'utf-8');
    synced++;
  }

  console.log(`\n🎉 同步完成！共同步 ${synced} 篇文章。`);
  if (synced === 0) {
    console.log('💡 提示：在 Obsidian 文章的 frontmatter 中添加 tags: [publish] 来标记要发布的文章。');
  }
}

main();
