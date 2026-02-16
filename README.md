# openingClouds Blog (Phase 1)

Tech stack:

- Frontend: Vite + React 18 + TypeScript + Tailwind
- Backend: Django 5 + DRF + SQLite + Django Admin
- Deployment: Docker Compose + Nginx + Gunicorn

## Project structure

```text
backend/   Django API + Admin + SQLite
frontend/  React SPA
nginx/     Reverse proxy config
scripts/   Backup/restore/health scripts
```

## Local development

### 1) Backend

```bash
cd backend
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default API base URL is `/api`. For local split-port dev, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Docker deployment

```bash
cp backend/.env.example backend/.env.production
# edit backend/.env.production

cd frontend && npm install && npm run build && cd ..

docker compose up -d --build
```

Visit:

- `http://47.99.42.71/`
- `http://47.99.42.71/api/health`
- `http://47.99.42.71/admin/`

## Data import

### Posts markdown

```bash
cd backend
source .venv/bin/activate
python manage.py import_posts /path/to/markdown-root --dry-run
python manage.py import_posts /path/to/markdown-root
```

### Timeline/Travel/Social/Highlight JSON

```bash
cd backend
source .venv/bin/activate
python manage.py import_structured_data fixtures/phase1_seed.template.json --dry-run
python manage.py import_structured_data fixtures/phase1_seed.template.json
```

## Phase 1 validation commands

```bash
cd backend
source .venv/bin/activate

# Admin capability PoC
python manage.py verify_admin_capabilities

# Security baseline check (IP+HTTP temporary mode)
python manage.py security_baseline_check --allow-http-temporary

# SQLite concurrent write stress test + report
python manage.py sqlite_write_stress_test --concurrency 10 --rounds 20 --strict \
  --report ../reports/sqlite_stress_report.json
```

## HTTPS bootstrap (domain stage)

```bash
# 1) issue certificate
./scripts/init_https_certbot.sh blog.openingclouds.com your-email@example.com

# 2) start HTTPS stack
./scripts/start_https_stack.sh
```

## Useful scripts

```bash
./scripts/check_health.sh http://127.0.0.1
./scripts/backup_sqlite.sh ./data/blog.sqlite3 ./data/backups
./scripts/restore_sqlite.sh ./data/backups/blog_YYYYmmdd_HHMMSS.sqlite3 ./data/blog.sqlite3
./scripts/monitor_memory.sh 1440 60 ./reports/memory_24h.log
```

## Obsidian publish sync

Only notes with `publish` tag inside frontmatter `tags` are synced. Default scope:

- `3-Knowledge（知识库）`
- `2-Resource（参考资源）`

### Local sync

```bash
cd backend
source .venv/bin/activate
python manage.py sync_obsidian /Users/openingcloud/Documents/GardenOfOpeningClouds --mode overwrite --dry-run
python manage.py sync_obsidian /Users/openingcloud/Documents/GardenOfOpeningClouds --mode overwrite
```

### Remote sync (token)

1) Set backend env:

```env
OBSIDIAN_SYNC_TOKEN=replace-with-strong-sync-token
```

2) Run remote sync from local machine:

```bash
export OBSIDIAN_SYNC_TOKEN=replace-with-strong-sync-token
cd backend
source .venv/bin/activate
python manage.py sync_obsidian /Users/openingcloud/Documents/GardenOfOpeningClouds \
  --target remote \
  --remote-base-url http://47.99.42.71/api \
  --mode overwrite \
  --unpublish-behavior draft
```

### launchd (every 2 hours)

- Script: `/Users/openingcloud/openingcloud-blog/scripts/obsidian_sync_remote.sh`
- Agent plist: `/Users/openingcloud/Library/LaunchAgents/com.openingcloud.obsidian-sync.plist`
- Optional local env file for launchd: `/Users/openingcloud/.config/openingcloud/obsidian-sync.env`

## Obsidian document pool (full vault)

Build full-vault index into `ObsidianDocument` and optionally auto-update linked published posts:

```bash
cd backend
source .venv/bin/activate
python manage.py sync_obsidian_documents /srv/openingcloud-vault/GardenOfOpeningClouds \
  --trigger scheduled \
  --auto-update-published \
  --missing-behavior draft \
  --publish-tag publish
```

Server helper script (for cron `0 2 * * *`):

```bash
./scripts/obsidian_sync_server.sh
```
