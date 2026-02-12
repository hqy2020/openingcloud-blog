CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key TEXT UNIQUE NOT NULL,
  disk_path TEXT UNIQUE NOT NULL,
  original_name TEXT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_images_storage_key ON images (storage_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_images_created_at ON images (created_at DESC) WHERE deleted_at IS NULL;
