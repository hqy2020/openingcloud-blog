# 启云博客 (OpeningCloud Blog)

基于 Astro 5 + Cloudflare Workers + D1 的个人博客系统，支持 Obsidian 内容同步、后台管理和自托管图片存储。

## 架构概览

```
┌─────────────────────────────────────────────┐
│              GitHub 仓库                     │
│   push main → GitHub Actions 自动部署        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌──────────────────────────┐    ┌──────────────────────┐
│   Cloudflare Workers     │    │   VPS / Docker 服务器 │
│  ┌────────────────────┐  │    │  ┌──────────────────┐ │
│  │   Astro SSR 应用   │  │    │  │  图片存储 API    │ │
│  │   (博客前台+后管)  │  │◄──►│  │  Fastify:8080    │ │
│  └────────────────────┘  │    │  ├──────────────────┤ │
│  ┌────────────────────┐  │    │  │  PostgreSQL      │ │
│  │   D1 数据库        │  │    │  │  (图片元数据)     │ │
│  │   (文章/日记/时间线)│  │    │  ├──────────────────┤ │
│  └────────────────────┘  │    │  │  Redis (缓存)    │ │
└──────────────────────────┘    │  └──────────────────┘ │
                                └──────────────────────┘
```

## 设计系统 — 云上牧场日记

| Token | 色值 | 用途 |
|-------|------|------|
| primary (sky) | #8EC9FF | 天空蓝，主色调 |
| grass | #7AA874 | 草地绿，分类/标签 |
| sun | #FFB86B | 暖调橙，CTA/高亮 |
| cloud | #F8FBFF | 云白，背景 |

标题字体：LXGW WenKai（霞鹜文楷）

## 内容分类

- 日记 — 日记 & 计划复盘
- 技术 — Java / AI / Agent
- 学习 — 学习方法 & 认知
- 生活 — 照片 & 随记

## 前置要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 22+ | 运行时 |
| npm | 10+ | 包管理 |
| Cloudflare 账号 | 免费即可 | Workers + D1 |
| VPS（可选） | 任意 Linux | Docker 图片服务 |

## 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/<你的用户名>/openingcloud-blog.git
cd openingcloud-blog
npm install
```

### 2. Cloudflare 配置

```bash
npm install -g wrangler
wrangler login

# 创建 D1 数据库
wrangler d1 create my_blog_prod
# 记下输出的 database_id
```

修改 `wrangler.jsonc`，替换 `database_id` 和项目名。

### 3. 执行数据库迁移

```bash
wrangler d1 migrations apply my_blog_prod --remote
```

### 4. 设置密钥

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_JWT_SECRET
wrangler secret put IMAGE_STORE_API_KEY
```

### 5. 本地开发

```bash
# 创建 .dev.vars
cat > .dev.vars << 'EOF'
ADMIN_PASSWORD=你的本地密码
ADMIN_JWT_SECRET=你的本地JWT密钥
IMAGE_STORE_URL=http://localhost:8080
IMAGE_STORE_PUBLIC_URL=http://localhost:8080
IMAGE_STORE_API_KEY=你的本地API密钥
EOF

npm run dev
```

访问 `http://localhost:4321` 查看博客，`http://localhost:4321/admin/login` 进入后台。

## 图片存储服务（可选）

```bash
# 在 VPS 上
scp -r infra/image-store/ user@你的VPS:/opt/image-store/
cd /opt/image-store
cp .env.example .env
# 编辑 .env 配置
docker compose up -d
```

建议使用 Nginx/Caddy 配置反向代理和 HTTPS。

## GitHub Actions 自动部署

在仓库 **Settings → Secrets** 中添加：

| Secret | 来源 |
|--------|------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 仪表盘 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Tokens |

推送到 main 分支即自动部署。

## Obsidian 内容同步（可选）

1. 在笔记中添加 `#publish` 标签
2. 配置 frontmatter（title, date, category, tags）
3. 运行 `npm run sync`

## 项目结构

```
openingcloud-blog/
├── .github/workflows/deploy.yml    # CI/CD
├── infra/image-store/              # Docker 图片服务
├── migrations/                     # D1 数据库迁移
├── scripts/                        # 同步脚本
├── src/
│   ├── components/                 # UI 组件
│   │   └── admin/                  # 后台组件
│   ├── data/                       # 文章内容 (4 分类)
│   ├── layouts/                    # 页面布局
│   ├── lib/                        # 工具函数 (auth, db, diary, timeline)
│   ├── pages/
│   │   ├── admin/                  # 后台页面 (SSR)
│   │   ├── api/admin/              # API 路由 (SSR)
│   │   ├── data/                   # 数据可视化
│   │   └── timeline/               # 人生路线
│   └── styles/global.css           # 设计系统
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

## 环境变量速查

| 变量 | 设置位置 | 说明 |
|------|---------|------|
| `ADMIN_PASSWORD` | `wrangler secret` + `.dev.vars` | 后台登录密码 |
| `ADMIN_JWT_SECRET` | `wrangler secret` + `.dev.vars` | JWT 签名密钥 |
| `IMAGE_STORE_API_KEY` | `wrangler secret` + `.dev.vars` | 图片服务认证 |
| `IMAGE_STORE_URL` | `wrangler.jsonc` vars | 图片服务内部 URL |
| `IMAGE_STORE_PUBLIC_URL` | `wrangler.jsonc` vars | 图片服务公网 URL |

## 常用命令

```bash
npm run dev              # 本地开发 (:4321)
npm run build            # 构建
npm run sync             # Obsidian 同步
git push origin main     # 自动部署
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Astro 5.5 |
| 样式 | Tailwind CSS 4 |
| 部署 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| 认证 | JWT (jose, HS256) |
| 图表 | Chart.js + D3 |
| 图片服务 | Fastify + PostgreSQL + Redis (Docker) |
| CI/CD | GitHub Actions |
