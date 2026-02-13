# openingClouds 博客 — 分阶段开发计划 v4.0

> 技术栈：Vite + React SPA + Django + DRF + SQLite + Django Admin + Nginx
> 服务器：阿里云 ECS 2C2G（¥99/年）
> 依据：`博客需求文档.md`（v2.0）
> 日期：2026-02-13
> 版本变更：v4.1 — 整合架构师审核意见（Gunicorn 调优、CSRF、Admin 定制、同步重构、PG 迁移阈值）

---

## 技术栈总览

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Vite + React 18 + TypeScript | SPA，React Router 6 |
| UI 组件 | Tailwind CSS + Aceternity UI 迁移 | 现有组件复用 |
| 动画 | motion/react + CSS Keyframes | 现有动画复用 |
| 后端 | Django 5 + DRF | REST API 服务 |
| 后台管理 | Django Admin | 内置 CRUD，省大量开发 |
| 数据库 | SQLite | Django 原生支持，零内存开销 |
| 部署 | Docker Compose + Nginx + Gunicorn | 单台 2C2G |
| 认证 | djangorestframework-simplejwt | JWT httpOnly cookie |

### 资源预算（2C2G）

| 组件 | 内存 | 说明 |
|------|------|------|
| 系统 + Docker | 300 MB | Ubuntu + containerd |
| Nginx | 60 MB | 反代 + 静态资源 |
| Django (Gunicorn 2w+2t) | 180-250 MB | 2 worker × 2 threads，压测后微调 |
| SQLite | ~0 MB | 文件数据库 |
| **合计** | **~540-610 MB** | 余量 ~1.3 GB，充裕 |

---

## Phase 1：工程搭建与数据迁移（第 1-2 周）

> 目标：跑通 React + Django + SQLite 最小链路，历史数据迁移完成。

### 1.1 后端工程初始化

- [x] **Django 项目搭建**
  - 创建 `backend/` Django 项目
  - 安装核心依赖：
    ```
    django==5.x
    djangorestframework
    djangorestframework-simplejwt
    django-cors-headers
    django-admin-sortable2
    gunicorn
    markdown
    python-frontmatter
    ```
  - 目录结构：
    ```
    backend/
    ├── config/           # Django settings, urls, wsgi
    ├── blog/             # 主应用
    │   ├── models.py     # 数据模型
    │   ├── admin.py      # Django Admin 配置
    │   ├── views.py      # DRF ViewSets
    │   ├── serializers.py
    │   ├── urls.py
    │   └── permissions.py
    ├── sync/             # Obsidian 同步模块
    ├── manage.py
    ├── db.sqlite3
    └── requirements.txt
    ```
  - 验收：`python manage.py runserver` 启动正常

- [x] **数据模型定义（7 张表）**
  - `Post` — 文章（title, slug, content, category, tags, cover, draft, obsidian_path, sync_source...）
  - `PostView` — 阅读数
  - `TimelineNode` — 时间线节点
  - `TravelPlace` — 旅行足迹
  - `SocialFriend` — 社交好友
  - `HighlightStage` — 高光阶段
  - `HighlightItem` — 高光成就条目
  - 方案：Django ORM 定义模型，`makemigrations` + `migrate` 自动生成表
  - 验收：所有表创建成功，Django Admin 可访问

- [x] **Django Admin 基础配置**
  - 所有 7 个模型注册到 Admin
  - 配置列表展示字段、筛选器、搜索、排序
  - 文章管理：分类筛选 + 状态筛选 + Markdown 预览
  - 方案示例：
    ```python
    @admin.register(Post)
    class PostAdmin(admin.ModelAdmin):
        list_display = ['title', 'category', 'draft', 'views_count', 'updated_at']
        list_filter = ['category', 'draft', 'sync_source']
        search_fields = ['title', 'slug']
        prepopulated_fields = {'slug': ('title',)}
    ```
  - 验收：管理员可通过 `/admin/` 完成所有内容 CRUD

- [x] **Django Admin 定制增强**
  - **拖拽排序**：安装 `django-admin-sortable2`，为 TimelineNode、HighlightStage、HighlightItem、TravelPlace 启用拖拽 sort_order
    ```python
    from adminsortable2.admin import SortableAdminMixin

    @admin.register(TimelineNode)
    class TimelineNodeAdmin(SortableAdminMixin, admin.ModelAdmin):
        list_display = ['title', 'type', 'start_date', 'sort_order']
    ```
  - **Inline 编辑**：HighlightItem 作为 HighlightStage 的 TabularInline，支持阶段→成就条目一页管理
    ```python
    class HighlightItemInline(admin.TabularInline):
        model = HighlightItem
        extra = 1
        ordering = ['sort_order']

    @admin.register(HighlightStage)
    class HighlightStageAdmin(SortableAdminMixin, admin.ModelAdmin):
        inlines = [HighlightItemInline]
    ```
  - **自定义 Dashboard**：重写 Admin index 页面，展示关键统计（文章总数、各分类数、本周新增、总阅读量）
  - 验收：拖拽排序可用，Inline 编辑可用，Dashboard 显示统计数据

- [ ] **JWT 认证 + CSRF 防护**
  - djangorestframework-simplejwt 配置
  - 登录接口：`POST /api/auth/login` → 返回 token（httpOnly cookie）
  - 管理 API 统一鉴权
  - **CSRF 防护**（JWT 放 cookie 时必须）：
    - Cookie 设置 `SameSite=Strict`（同站请求才带 cookie）
    - 写操作校验 `Origin` / `Referer` 头
    - Django 内置 CSRF middleware 配合 DRF 的 `SessionAuthentication` 或自定义校验
    - 前端 Axios 配置 `withCredentials: true` + `X-CSRFToken` header
  - **CORS 策略**：
    - `django-cors-headers` 白名单仅允许 `https://blog.openingclouds.com`
    - 开发环境允许 `http://localhost:5173`
  - 当前进度：已实现 JWT Cookie、Origin/Referer 校验、前端 `X-CSRFToken`；因 IP+HTTP 阶段暂未启用 `SameSite=Strict + Secure=True`
  - 验收：无 token 访问管理接口返回 401；跨站请求返回 403

- [x] **基础公开 API**
  - `GET /api/health` — 健康检查
  - `GET /api/posts/` — 文章列表（分页、分类筛选、标签筛选）
  - `GET /api/posts/{slug}/` — 文章详情
  - `POST /api/posts/{slug}/view/` — 阅读数+1
  - 验收：Postman 调用返回正确数据

### 1.2 数据迁移

- [x] **Astro Content Collections → SQLite**
  - 编写 Django management command：`python manage.py import_posts`
  - 扫描 `src/data/{category}/*.md`，解析 frontmatter
  - 映射到 Post 模型（title, slug, category, tags, content...）
  - 验收：迁移后文章数、分类分布与原始数据一致

- [ ] **时间线/旅行/社交/高光数据导入**
  - 从现有 D1 导出或 JSON 文件导入
  - 编写 fixture 或 management command
  - 验收：Django Admin 中各模块数据完整

### 1.3 前端基础骨架

- [x] **Vite + React 项目初始化**
  - 创建 `frontend/` 项目
  - 安装：react, react-router-dom, axios, tailwindcss, motion
  - 目录结构：
    ```
    frontend/
    ├── src/
    │   ├── app/           # Router, Providers
    │   ├── pages/         # 页面组件
    │   ├── components/    # 通用组件
    │   │   ├── ui/        # Aceternity UI 迁移
    │   │   ├── home/      # 首页板块
    │   │   ├── pet/       # 宠物系统
    │   │   └── motion/    # 动画组件
    │   ├── api/           # Axios 封装
    │   ├── hooks/         # 自定义 hooks
    │   └── styles/        # 全局样式
    ├── vite.config.ts
    └── package.json
    ```
  - 验收：`npm run dev` 启动，路由跳转正常

- [x] **路由搭建**
  - 公开：`/`, `/tech`, `/learning`, `/life`, `/posts/:slug`
  - 后台：直接用 Django Admin（`/admin/`），无需前端后台页面
  - 验收：路由跳转 + 404 正常

- [x] **API 层封装**
  - Axios 实例 + 错误拦截 + token 注入
  - 验收：前端可请求后端 API 并渲染数据

### 1.4 部署基础

- [x] **Docker Compose 配置**
  - 仅两个服务：
    ```yaml
    services:
      nginx:
        image: nginx:1.24-alpine
        ports: ["80:80", "443:443"]
        volumes:
          - ./frontend/dist:/usr/share/nginx/html:ro
          - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
          - ./certs:/etc/nginx/ssl:ro

      backend:
        build: ./backend
        command: gunicorn config.wsgi -b 0.0.0.0:8000 -w 2 --threads 2 --max-requests 1000 --max-requests-jitter 50
        volumes:
          - ./data:/app/data   # SQLite + uploads
        environment:
          - DJANGO_SETTINGS_MODULE=config.settings.production
    ```
  - 验收：`docker compose up -d` 两容器运行

- [ ] **Nginx + HTTPS**
  - `/` → React 静态资源
  - `/api/` → 反代 backend:8000
  - `/admin/` → 反代 backend:8000（Django Admin）
  - Certbot HTTPS + 自动续期
  - 当前进度：Nginx 反代已完成；HTTPS 证书与域名切换待完成
  - 验收：`https://blog.openingclouds.com` 可访问

- [x] **CI 构建流水线**
  - GitHub Actions：build frontend dist + build Docker image → push 到 ECS
  - ECS 不做本地构建
  - 验收：push main 后自动部署

### Phase 1 验证性任务（PoC）

- [ ] **SQLite 并发写压测**
  - 模拟 10 并发写请求（管理写入 + Obsidian 同步 + 阅读数更新）
  - 确认 WAL 模式下无 `database is locked` 错误
  - 测量写入 P95 延迟，基线 < 100ms
  - 验收：压测报告确认 SQLite 满足业务并发需求

- [ ] **Django Admin 能力验证**
  - 验证 `django-admin-sortable2` 拖拽排序功能
  - 验证 TabularInline 在 HighlightStage 中的嵌套编辑体验
  - 验证自定义 Dashboard 视图可行性
  - 验收：三项能力 PoC 通过，无需自建后台

- [ ] **安全基线配置**
  - CSRF：`SameSite=Strict` + Origin 校验
  - CORS：白名单模式
  - Cookie：`httpOnly=True`, `Secure=True`, `SameSite=Strict`
  - Django `SECURE_*` 设置（HSTS、X-Frame-Options 等）
  - 验收：安全扫描无高危漏洞

### Phase 1 里程碑

- [ ] `https://blog.openingclouds.com` 首页可访问
- [x] `/api/posts/` 返回文章列表
- [x] `/admin/` Django Admin 可管理所有内容（含拖拽排序、Inline）
- [ ] 历史数据迁移完成
- [ ] 安全基线通过（CSRF + CORS + Cookie）
- [ ] SQLite 并发写压测通过
- [ ] 2C2G 稳定运行 24h，内存 < 60%

---

## Phase 2：前台页面与业务 API 完善（第 3-5 周）

> 目标：前台所有页面还原，首页七大板块数据联通，SEO 基础就绪。

### 2.1 完善后端 API

- [ ] **首页聚合 API**
  - `GET /api/home/` — 返回时间线 + 高光 + 旅行 + 社交图谱 + 统计数据
  - 方案：Django View 内 Promise-like 并行查询（或串行，SQLite 足够快）
  - 验收：单接口返回首页所有板块数据

- [ ] **各模块公开 API**
  - `GET /api/travel/` — 旅行足迹（按省份分组）
  - `GET /api/social-graph/` — 匿名社交图谱（仅 public_label，不暴露 name/link）
  - `GET /api/highlights/` — 高光时刻（阶段+成就树形结构）
  - `GET /api/timeline/` — 时间线节点
  - 验收：各接口数据与 Django Admin 中一致

- [ ] **媒体上传 API**
  - `POST /api/admin/images/` — 图片上传
  - 类型限制：jpg/png/webp，大小 < 5MB
  - 存储路径：`/data/uploads/`
  - 验收：上传图片后可通过 URL 访问

- [ ] **Sitemap + Robots**
  - Django 内置 sitemap framework 生成 sitemap.xml
  - 验收：`/sitemap.xml` 包含所有已发布文章 URL

### 2.2 前台页面开发

- [ ] **首页七大板块**
  - Hero 云海穿越（R3F 或降级静态背景）
  - 人生足迹时间轴
  - 高光时刻卡片
  - 旅行足迹地图
  - 社交图谱
  - 数据面板
  - 联系方式
  - 验收：每个板块从 API 获取数据正确渲染

- [ ] **分类列表页**
  - `/tech/`, `/learning/`, `/life/`
  - 瀑布流双列布局 + 标签筛选
  - 验收：卡片展示、筛选、hover 效果正常

- [ ] **文章详情页**
  - `/posts/:slug`
  - Markdown 渲染 + 目录 + 阅读进度条
  - 验收：文章内容渲染正确，阅读数可累计

- [ ] **Aceternity UI 组件迁移**
  - BackgroundBeams, CardSpotlight, TextGenerateEffect 等
  - 去除 Next.js 依赖，保持 Tailwind 配置
  - 验收：UI 组件在 React SPA 中正常工作

- [ ] **Motion 动画迁移**
  - FadeIn, StaggerContainer, ScrollReveal, ParallaxSection
  - 统一使用 `motion/react`
  - 验收：核心动画效果与原版一致

### 2.3 SEO 方案

- [ ] **预渲染（vite-plugin-ssr 或 prerender）**
  - 构建时预渲染核心公开页面
  - 新文章发布后 CI 触发增量预渲染
  - 验收：页面源码包含核心内容

- [ ] **Meta 标签**
  - react-helmet-async 动态注入 title/description/OG
  - 验收：社交分享时显示正确的标题和封面

### Phase 2 里程碑

- [ ] 前台所有页面可访问，视觉与需求文档一致
- [ ] 首页七板块数据联通
- [ ] 社交图谱公开接口不泄露隐私
- [ ] SEO 基础可用（预渲染 + sitemap）
- [ ] Lighthouse 移动端 >= 75

---

## Phase 3：增强功能与生产稳定（第 6-7 周）

> 目标：草地宠物交互上线，Obsidian 同步可用，运维闭环。

### 3.1 草地宠物交互

- [ ] **GrassManager + BlogPet 状态机**
  - 纯前端实现，无后端依赖
  - 状态：idle → walking_to_grass → eating → idle
  - 草上限 10 棵，FIFO 淘汰，点击节流 200ms
  - 验收：点击种草 → 羊吃草 → 恢复，全流程可用

- [ ] **降级策略**
  - `prefers-reduced-motion` → 禁用
  - 低端设备检测 → 禁用
  - 验收：低配设备不卡顿

### 3.2 Obsidian 单向同步

- [ ] **同步 Management Command**
  - 实现为 Django management command（而非独立脚本），复用 ORM、事务、配置、日志体系
  - 目录结构：
    ```
    backend/
    ├── blog/
    │   └── management/
    │       └── commands/
    │           └── sync_obsidian.py   # 主命令
    ├── sync/
    │   ├── scanner.py       # 扫描 publish: true 文件
    │   ├── parser.py        # frontmatter 解析
    │   └── mapper.py        # 中图法 → tech/learning/life 分类映射
    ```
  - 以 slug 为主键，存在则 UPDATE，不存在则 INSERT（ORM `update_or_create`）
  - 记录 obsidian_path + last_synced_at + sync_source
  - 命令用法：
    ```bash
    # 增量同步（仅同步 modified_at > last_synced_at 的文件）
    python manage.py sync_obsidian /path/to/vault

    # 全量强制同步
    python manage.py sync_obsidian /path/to/vault --force

    # 预览模式（不写入）
    python manage.py sync_obsidian /path/to/vault --dry-run

    # 指定同步模式
    python manage.py sync_obsidian /path/to/vault --mode=overwrite
    ```
  - 优势（相比独立脚本）：
    - 直接操作 ORM，无需经过 HTTP API，同步更快更可靠
    - 事务保护：单篇失败不影响其他文章
    - 复用 Django 日志系统，操作记录自动落盘
    - 可通过 CI 或 cron 直接调用 `docker exec backend python manage.py sync_obsidian`
  - 验收：标记 `publish: true` 的笔记一键同步到博客，多次同步幂等

- [ ] **同步 API（可选，供远程调用）**
  - `POST /api/admin/obsidian-sync/` — 单篇 upsert（供非同机场景使用）
  - 内部调用同一 sync 逻辑
  - 验收：API 与 command 行为一致

- [ ] **冲突策略**
  - syncMode：overwrite（默认）/ skip / merge
  - 操作日志记录每次同步（SyncLog 模型或 Django logging）
  - 验收：冲突场景行为可预期

### 3.3 运维保障

- [ ] **备份策略**
  - SQLite 备份：每日 `sqlite3 blog.db ".backup /data/backups/blog_$(date).db"`
  - cron 定时 + 保留 7 天
  - 每月恢复演练一次
  - 验收：备份可成功恢复

- [ ] **监控与日志**
  - Django `health_check` endpoint
  - Nginx + Gunicorn 日志轮转（单文件 ≤ 100MB）
  - Docker restart policy: unless-stopped
  - 可选：接入 UptimeRobot 免费监控
  - 验收：容器异常能自动重启，日志不膨胀

- [ ] **部署流水线完善**
  - push main → CI 构建前端 dist + 后端 Docker image → ECS 拉取重启
  - 保留上一版本，支持 30s 内回滚
  - 验收：发布可重复，可回滚

### Phase 3 里程碑

- [ ] 草地宠物交互上线
- [ ] Obsidian 同步可用
- [ ] 自动备份 + 恢复演练通过
- [ ] 自动部署流水线可用
- [ ] 连续 7 天稳定运行，内存 < 60%

---

## 对比：技术栈简化收益

| 维度 | 旧方案 (Spring Boot) | 新方案 (Django) |
|------|---------------------|----------------|
| 后端内存 | 350-500 MB | 180-250 MB |
| 数据库内存 | 300 MB (MySQL) | ~0 MB (SQLite) |
| 总内存占用 | ~1.2-1.5 GB | ~540-610 MB |
| 服务器配置 | 需 2C4G | 2C2G 足够 |
| 年费 | ¥1,260+ | **¥99** |
| Docker 服务数 | 4 个 | **2 个** |
| 后台开发量 | 6 模块×CRUD | **Django Admin 内置** |
| 数据库迁移工具 | Flyway | **Django migrations 内置** |
| 预计开发周期 | 8 周 | **6-7 周** |

---

## 开发约定

- 后端 ORM：Django ORM（复杂查询可用 raw SQL）
- 前端路由：React Router 6
- SEO：SPA + 预渲染（不引入 SSR 框架）
- 后台管理：Django Admin（不自建前端后台）+ sortable2 + Inline
- 构建：CI 执行，ECS 不做本地构建
- Obsidian 同步：Django management command（同机直接调用 ORM）
- 备份：`sqlite3 .backup` 命令（WAL-safe）
- 安全：JWT httpOnly cookie + SameSite=Strict + CSRF + CORS 白名单
- Gunicorn：2 worker + 2 threads（压测后可微调，不超过 4 worker）

## 风险与应对

| 风险 | 应对 |
|------|------|
| SQLite 并发写限制 | 博客读多写少，WAL 模式足够；达到迁移阈值时迁 PostgreSQL（见下表） |
| SPA SEO 不足 | 预渲染 + Helmet + Sitemap |
| 同步覆盖手动修改 | syncMode + dry-run + 日志 |
| 2C2G 未来不够用 | 内存余量 1.3GB，远期加 Redis/升配即可 |
| 备份不可恢复 | 每月恢复演练 |
| CSRF 攻击 | SameSite=Strict + Origin 校验 + Django CSRF middleware |
| Django Admin 功能不足 | Phase 1 PoC 验证；极端情况可扩展 django-unfold 或自建 |

### PostgreSQL 迁移触发条件

当以下任一条件持续出现时，启动从 SQLite 到 PostgreSQL 的迁移：

| 触发条件 | 阈值 | 监控方式 |
|----------|------|----------|
| 写入并发 `database is locked` 错误 | 日均 > 5 次 | Django 日志 + Sentry |
| 写入 P95 延迟 | > 500ms | Gunicorn access log 分析 |
| 数据库文件体积 | > 500 MB | 磁盘监控脚本 |
| 日均写入操作数 | > 1000 次 | 自定义计数 middleware |
| 需要全文搜索 | 业务明确需要 | 产品需求触发 |

迁移方案：
- Django ORM 层无需改动（`DATABASES` 配置切换即可）
- 使用 `dumpdata` / `loaddata` 或 `pgloader` 迁移数据
- 预计迁移工作量：1-2 天（含测试）
- 服务器需升配到 2C4G（PostgreSQL 最低需 ~300MB 内存）
