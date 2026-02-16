# UX-ADMIN 验收记录（2026-02-14）

## 1. 本轮目标

- 修复首页缺少后台入口问题（新增首屏 CTA）。
- 复验 `UX-ADMIN-01`、`UX-ADMIN-02`、`UX-ADMIN-03~08`、`UX-ADMIN-10`。
- 验收环境：`http://47.99.42.71`。

## 2. 本轮变更

- 前端入口改造：`/Users/openingcloud/openingcloud-blog/frontend/src/components/home/HeroSection.tsx`
  - 在首屏 slogan 下新增后台入口 CTA。
  - 使用原生 `<a href="/admin/">`，按钮文案为“后台管理”。
  - 辅助文案为“管理员入口：点击后前往 /admin/ 完成登录或退出”。
  - 增加 `aria-label="进入后台管理"` 与 focus ring。
- 验收文档更新：`/Users/openingcloud/openingcloud-blog/reports/上线验收命令.md`
  - 新增 UX-ADMIN-01~10 的复验步骤与命令。

## 3. 本地构建与质量检查

- `frontend npm run lint`：失败（历史遗留问题，非本次改动引入）
  - `src/app/theme.tsx`：`react-refresh/only-export-components`
  - `src/components/ui/BlurRevealImage.tsx`：`react-hooks/set-state-in-effect`
- `frontend npm run build`：通过。

## 4. 线上验收证据（执行时间：2026-02-14）

### 4.1 改造前基线（已确认）

- `GET http://47.99.42.71/admin/` 返回 `302`，`Location: /admin/login/?next=/admin/`。
- `GET http://47.99.42.71/admin/login/?next=/admin/` 页面包含用户名/密码登录表单。
- `POST http://47.99.42.71/api/auth/login`（错误凭据）返回 `400`，消息为“用户名或密码错误”。

### 4.2 发布执行情况

- 已在远端代码目录（`/opt/openingclouds-blog`）对 `frontend/src/components/home/HeroSection.tsx` 进行最小补丁替换。
- 远端构建尝试：
  1. `npm` 不在主机环境中（`npm: command not found`）。
  2. 使用 `node:20-alpine` 容器构建，`npm ci --legacy-peer-deps` 可安装依赖。
  3. 受限于远端源码现状与构建链路差异，`tsc -b` 在历史类型定义处失败（与本次 CTA 改动无直接关系）。
  4. 切换为纯 `vite build` 方案后，服务器进入异常状态（见 4.3），导致发布后核验无法继续。

### 4.3 当前阻塞

- 服务器 `47.99.42.71` 现状（本轮后半段）：
  - `ping` 可达。
  - `tcp/22`、`tcp/80` 可建立连接，但 `ssh` 在 banner 阶段超时，`http://47.99.42.71/` 请求持续超时无响应。
  - 因此无法完成发布后 UI 可见性确认与后台人工流程复验。

## 5. UX-ADMIN 状态结论（本轮）

- `UX-ADMIN-01`：未完成（仅失败提示链路已自动化验证；登录成功/退出流程需在服务器恢复后人工完成）。
- `UX-ADMIN-02`：未完成（需登录后台查看“运营概览”）。
- `UX-ADMIN-03 ~ UX-ADMIN-08`：未完成（需进入五个内容模块执行 CRUD/排序）。
- `UX-ADMIN-10`：未完成（需后台内验证成功/失败提示）。

> 按规则，本轮不对 `/Users/openingcloud/openingcloud-blog/reports/用户体验验收清单.md` 的 4.8 条目做通过勾选。

## 6. 建议的恢复后复验顺序

1. 先恢复主机 `ssh` 与 `http` 正常响应（确认 Nginx/容器状态）。
2. 重跑 `/Users/openingcloud/openingcloud-blog/reports/上线验收命令.md` 的第 4~9 节。
3. 通过后再回填 `reports/用户体验验收清单.md` 的 4.8 四项为 `[x]`。
