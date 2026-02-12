import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import pg from 'pg';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

// ── Config ──────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '8080', 10);
const STORAGE_DIR = process.env.STORAGE_DIR || '/var/lib/imgstore';
const API_KEYS = new Set((process.env.API_KEYS || '').split(',').filter(Boolean));
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const REDIS_CACHE_THRESHOLD = 2 * 1024 * 1024; // only cache files ≤ 2MB
const REDIS_TTL = 3600; // 1 hour

// ── Clients ─────────────────────────────────────────

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ── Fastify ─────────────────────────────────────────

const app = Fastify({ logger: true });
await app.register(multipart, { limits: { fileSize: MAX_FILE_SIZE } });

// Allow DELETE/GET requests without content-type
app.addContentTypeParser('*', function (request, payload, done) {
  done(null);
});

// ── Auth hook ───────────────────────────────────────

function requireApiKey(request, reply, done) {
  const key = request.headers['x-api-key'];
  if (!key || !API_KEYS.has(key)) {
    reply.code(401).send({ ok: false, error: 'Unauthorized' });
    return;
  }
  done();
}

// ── MIME → extension mapping ────────────────────────

const ALLOWED_MIMES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
  ['image/avif', '.avif'],
]);

// ── Routes ──────────────────────────────────────────

// Health check
app.get('/healthz', async () => ({ ok: true }));

// Upload image (POST /v1/images)
app.post('/v1/images', { preHandler: requireApiKey }, async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ ok: false, error: 'No file uploaded' });
  }

  if (!ALLOWED_MIMES.has(data.mimetype)) {
    // consume the stream to avoid hanging
    data.file.resume();
    return reply.code(400).send({ ok: false, error: `Unsupported type: ${data.mimetype}` });
  }

  // Build storage key: posts/yyyy/mm/uuid-filename
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const shortId = randomUUID().slice(0, 8);
  const safeName = (data.filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `posts/${yyyy}/${mm}/${shortId}-${safeName}`;

  const diskPath = join(STORAGE_DIR, storageKey);
  await mkdir(dirname(diskPath), { recursive: true });

  // Stream file to disk
  await pipeline(data.file, createWriteStream(diskPath));

  if (data.file.truncated) {
    await unlink(diskPath).catch(() => {});
    return reply.code(400).send({ ok: false, error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` });
  }

  // Get actual file size from stream
  const sizeBytes = data.file.bytesRead;

  // Insert into database
  const result = await pool.query(
    `INSERT INTO images (storage_key, disk_path, original_name, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, storage_key, original_name, mime_type, size_bytes, created_at`,
    [storageKey, diskPath, data.filename || 'image', data.mimetype, sizeBytes]
  );

  const row = result.rows[0];
  const url = `${PUBLIC_BASE_URL}/v1/images/${storageKey}`;

  reply.code(201).send({
    ok: true,
    data: {
      id: row.id,
      key: row.storage_key,
      url,
      originalName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      createdAt: row.created_at,
    },
  });
});

// List images (GET /v1/images)
app.get('/v1/images', { preHandler: requireApiKey }, async (request, reply) => {
  const cursor = request.query.cursor || null;
  const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);

  let query, params;
  if (cursor) {
    query = `SELECT id, storage_key, original_name, mime_type, size_bytes, created_at
             FROM images WHERE deleted_at IS NULL AND created_at < $1
             ORDER BY created_at DESC LIMIT $2`;
    params = [cursor, limit];
  } else {
    query = `SELECT id, storage_key, original_name, mime_type, size_bytes, created_at
             FROM images WHERE deleted_at IS NULL
             ORDER BY created_at DESC LIMIT $1`;
    params = [limit];
  }

  const result = await pool.query(query, params);
  const items = result.rows.map((row) => ({
    id: row.id,
    key: row.storage_key,
    url: `${PUBLIC_BASE_URL}/v1/images/${row.storage_key}`,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.created_at,
  }));

  const nextCursor = items.length === limit ? items[items.length - 1].createdAt : null;

  reply.send({
    ok: true,
    data: {
      items,
      cursor: nextCursor,
    },
  });
});

// Delete image (DELETE /v1/images/:id)
app.delete('/v1/images/:id', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params;

  const result = await pool.query(
    `UPDATE images SET deleted_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING storage_key, disk_path`,
    [id]
  );

  if (result.rowCount === 0) {
    return reply.code(404).send({ ok: false, error: 'Image not found' });
  }

  const { storage_key, disk_path } = result.rows[0];

  // Remove from disk and Redis cache
  await Promise.allSettled([
    unlink(disk_path),
    redis.del(`img:${storage_key}`),
  ]);

  reply.send({ ok: true });
});

// Public image serving (GET /v1/images/posts/*)
app.get('/v1/images/*', async (request, reply) => {
  const storageKey = request.params['*'];
  if (!storageKey) {
    return reply.code(400).send({ ok: false, error: 'Missing key' });
  }

  // Try Redis cache first
  const cached = await redis.getBuffer(`img:${storageKey}`);
  if (cached) {
    // Lookup mime type from DB (or infer from extension)
    const mimeType = inferMimeType(storageKey);
    reply
      .header('Content-Type', mimeType)
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .send(cached);
    return;
  }

  // Lookup in DB
  const result = await pool.query(
    `SELECT disk_path, mime_type, size_bytes FROM images
     WHERE storage_key = $1 AND deleted_at IS NULL`,
    [storageKey]
  );

  if (result.rowCount === 0) {
    return reply.code(404).send({ ok: false, error: 'Not found' });
  }

  const { disk_path, mime_type, size_bytes } = result.rows[0];

  let fileBuffer;
  try {
    fileBuffer = await readFile(disk_path);
  } catch {
    return reply.code(404).send({ ok: false, error: 'File not found on disk' });
  }

  // Cache in Redis if small enough
  if (Number(size_bytes) <= REDIS_CACHE_THRESHOLD) {
    await redis.setex(`img:${storageKey}`, REDIS_TTL, fileBuffer).catch(() => {});
  }

  reply
    .header('Content-Type', mime_type)
    .header('Cache-Control', 'public, max-age=31536000, immutable')
    .send(fileBuffer);
});

// ── Helpers ─────────────────────────────────────────

function inferMimeType(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' };
  return map[ext] || 'application/octet-stream';
}

// ── Start ───────────────────────────────────────────

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
