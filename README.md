# 启云博客 | openingClouds Blog

> 一个全栈个人博客系统，融合 Obsidian 笔记同步、交互式首页、桌面宠物等特色功能。

**在线地址**: [blog.oc.slgneon.cn](https://blog.oc.slgneon.cn)

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 19.2 / 5.9 |
| 构建工具 | Vite | 7.3 |
| 样式 | Tailwind CSS | 3.4 |
| 动画 | Motion (Framer Motion) | 12.34 |
| 数据可视化 | ECharts | 6.0 |
| 后端框架 | Django + DRF | 5.2 / 3.16 |
| 数据库 | SQLite | 3 |
| Web 服务器 | Nginx + Gunicorn | 1.27 / 25.1 |
| 容器化 | Docker Compose | — |
| CI/CD | GitHub Actions | — |
| 证书 | Let's Encrypt (Certbot) | — |

## 功能特性

### 首页模块
- **英雄区** — 全屏品牌展示 + 打字机效果
- **Bento Grid** — 卡片式内容导航
- **分类标签页** — Tech / Learning / Life 分类浏览
- **杂志排版** — 精选文章展示
- **时间线** — 横向滚动时间轴
- **生活指标** — 个人数据可视化（ECharts 中国地图）
- **数据统计** — 文章/访问/运行天数实时面板
- **页脚** — 社交链接 + 联系信息

### 文章系统
- Markdown 渲染 + 代码高亮
- 文章点赞（持久化存储）
- 分类筛选 + SEO 预渲染

### Obsidian 同步
- 本地同步 / 远程 API 同步 / 文档池全库索引
- 仅同步 frontmatter 含 `publish` 标签的笔记
- macOS LaunchAgent 定时自动同步（每 2 小时）

### 管理后台
- Django Admin 自定义界面
- 文章/时间线/旅行/社交/首页高亮 CRUD
- 数据导入命令（Markdown + JSON）

### 交互宠物
- 桌面跟随光标的像素风小狗
- 多种状态动画（精灵图）

## 项目结构

```text
openingcloud-blog/
├── backend/                  # Django 后端
│   ├── blog/                 #   主应用（模型/视图/序列化/管理命令）
│   ├── config/               #   Django 项目配置
│   ├── sync/                 #   Obsidian 同步引擎
│   ├── docker/               #   Docker 入口脚本
│   ├── fixtures/             #   种子数据模板
│   ├── Dockerfile            #   后端镜像
│   └── requirements.txt      #   Python 依赖
├── frontend/                 # React + Vite 前端
│   ├── src/
│   │   ├── components/       #   组件（home/layout/motion/pet/ui）
│   │   ├── pages/            #   页面
│   │   ├── api/              #   API 客户端
│   │   ├── hooks/            #   React Hooks
│   │   └── theme/            #   主题配置
│   ├── public/               #   静态资源
│   └── package.json
├── nginx/                    # Nginx 配置
│   ├── nginx.conf            #   HTTP
│   └── nginx.https.conf      #   HTTPS
├── scripts/                  # 运维脚本
├── docker-compose.yml        # 基础编排
├── docker-compose.https.yml  # HTTPS 扩展
└── .github/workflows/        # CI/CD
    └── deploy.yml
```

## 本地开发

### 后端

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 编辑环境变量
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认 API 地址为 `/api`。本地分端口开发时创建 `frontend/.env.local`：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Docker 部署

### HTTP 快速启动

```bash
# 1. 配置后端环境变量
cp backend/.env.example backend/.env.production
# 编辑 backend/.env.production

# 2. 构建前端
cd frontend && npm install && npm run build && cd ..

# 3. 启动服务
docker compose up -d --build
```

访问 `http://your-domain/` 验证部署。

### HTTPS 升级

```bash
# 1. 申请证书
./scripts/init_https_certbot.sh your-domain.com your-email@example.com

# 2. 启动 HTTPS 服务栈
./scripts/start_https_stack.sh
```

Certbot 容器会每 12 小时自动续期证书。

## Obsidian 同步

### 本地同步

```bash
cd backend && source .venv/bin/activate
python manage.py sync_obsidian /path/to/vault --mode overwrite --dry-run
python manage.py sync_obsidian /path/to/vault --mode overwrite
```

### 远程同步

```bash
export OBSIDIAN_SYNC_TOKEN=your-sync-token
cd backend && source .venv/bin/activate
python manage.py sync_obsidian /path/to/vault \
  --target remote \
  --remote-base-url https://your-domain/api \
  --mode overwrite \
  --unpublish-behavior draft
```

### 文档池（全库索引）

```bash
python manage.py sync_obsidian_documents /path/to/vault \
  --trigger scheduled \
  --auto-update-published \
  --missing-behavior draft \
  --publish-tag publish
```

## CI/CD

GitHub Actions 工作流 (`.github/workflows/deploy.yml`) 包含 4 个阶段：

| 阶段 | 说明 |
|------|------|
| **backend-check** | Python 3.12 环境下运行迁移、测试、安全基线检查 |
| **frontend-build** | Node.js 20 环境构建前端 + 验证预渲染产物 |
| **publish-backend-image** | 构建 Docker 镜像并推送至 GHCR |
| **deploy-ecs** | SSH 部署至生产服务器 |

仅 `push main` 触发后两个部署阶段；PR 仅触发检查和构建。

### 需配置的 Secrets

| Secret | 说明 |
|--------|------|
| `ECS_HOST` | 部署服务器地址 |
| `ECS_USER` | SSH 登录用户名 |
| `ECS_SSH_KEY` | SSH 私钥 |

> `GITHUB_TOKEN` 由 GitHub Actions 自动提供，无需手动配置。

## 运维脚本

| 脚本 | 用途 |
|------|------|
| `check_health.sh` | API 健康检查 |
| `backup_sqlite.sh` | SQLite 数据库备份（带时间戳） |
| `restore_sqlite.sh` | 从备份恢复数据库 |
| `monitor_memory.sh` | Docker 容器资源监控（CPU/内存） |
| `init_https_certbot.sh` | Let's Encrypt 证书申请 + HTTPS 初始化 |
| `start_https_stack.sh` | 启动 HTTPS 完整服务栈 |
| `obsidian_sync_remote.sh` | 客户端远程同步脚本（macOS） |
| `obsidian_sync_server.sh` | 服务器端 Obsidian 同步（适配 cron） |

## 许可证

[MIT](LICENSE)
