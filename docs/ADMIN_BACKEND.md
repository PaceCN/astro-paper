# 后台后端配置说明

Pace Notes 后台不是公开数据看板，真正读写后台 API 需要 Cloudflare Pages Functions、D1 和密码变量。

## Cloudflare 需要配置

环境变量：

- `ADMIN_PASSWORD`：后台登录密码。建议使用长随机字符串，只在 Cloudflare Dashboard 中配置，不要提交到 Git。
- `PUBLIC_ADMIN_BASE_PATH`：后台页面路径，默认 `/admin`。这是构建时变量，修改后需要重新部署。

D1 binding：

- `BLOG_DB`：后台数据库绑定名。

## 初始化 D1

1. 在 Cloudflare 创建 D1 数据库。
2. 将 binding 名设置为 `BLOG_DB`。
3. 执行 schema：`schema/d1/0001_admin_core.sql`。
4. 本地生成文章索引：

```bash
corepack pnpm run export:posts-index
```

默认会输出到：

- `/home/pace/.openclaw/workspace/tmp/pace-notes-d1/posts-index.json`
- `/home/pace/.openclaw/workspace/tmp/pace-notes-d1/posts-index.sql`

再把 `posts-index.sql` 导入 D1。

## 登录后台

默认路径：`/admin/`。

访问后输入 `ADMIN_PASSWORD`。登录成功后，浏览器会获得 httpOnly cookie：`pace_admin_session`。所有 `/api/admin/*` 接口都会验证这个 cookie。

## 当前 API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/posts`
- `GET /api/admin/ads`
- `POST /api/admin/ads`
- `PUT /api/admin/ads/:slotKey`
- `GET /api/admin/settings`
- `POST|PUT /api/admin/settings`
- `GET /api/admin/automation-runs`
- `POST /api/admin/automation-runs`
- `GET /api/admin/date-audit`

## 修改后台路径

在 Cloudflare Pages 的环境变量里设置：

```text
PUBLIC_ADMIN_BASE_PATH=/your-private-path
```

然后重新部署。注意：Astro 静态路由是构建期生成的，路径变量不是运行时动态路由。当前默认仍保留 `/admin`。

## 安全注意

- 页面本身可访问不等于 API 可访问；所有后台 API 都要求密码登录。
- 不要把 `ADMIN_PASSWORD` 写入仓库。
- 写操作上线前，建议再加 Cloudflare Access 或更细粒度权限。

## 发布后的文章索引同步

Markdown/Git 仍是正文事实源；D1 的 `posts_index` 是后台索引。每次自动发布并推送成功后，需要把当前 Markdown 索引同步到后台：

```bash
PACE_NOTES_ADMIN_URL=https://astro-paper-18u.pages.dev \
PACE_NOTES_ADMIN_PASSWORD=<后台密码> \
corepack pnpm run sync:posts-index
```

同步脚本会：

1. 运行 `scripts/export-posts-index.mjs` 生成当前文章索引。
2. 登录 `/api/admin/login` 获取 httpOnly session cookie。
3. 调用 `POST /api/admin/posts/import`，用当前 Markdown 列表重建 D1 `posts_index`。

如果同步失败，文章仍以 Git/Cloudflare Pages 发布结果为准，但后台文章列表可能暂时滞后；需要在 `docs/AUTOMATION_STATUS.md` 记录 blocker。

## 广告控制

后台只保留 5 个固定广告位开关，避免出现不可控的满屏广告：

- `pageTop`：页首
- `pageMiddle`：页中
- `pageBottom`：页尾
- `leftRail`：左侧
- `rightRail`：右侧

每个位置默认关闭。后台可保存该位置的 AdSense client/slot 和开关状态；前台接入时必须只读取这 5 个位置，不允许自动新增任意广告位。

## 手动发布与 Agent API

后台“自动化”页可以新增手动发布请求，写入 `publish_requests` 队列。队列不会在浏览器里直接持有 GitHub token，也不会让前端直接改文件；后续由 Agent 使用受控 API 领取、整理、验证、提交、推送和同步索引。

Agent 调用 API 时使用 Cloudflare 环境变量 `ADMIN_API_TOKEN`：

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

本地查看待处理发布请求：

```bash
PACE_NOTES_ADMIN_URL=https://astro-paper-18u.pages.dev PACE_NOTES_ADMIN_API_TOKEN=<token> corepack pnpm run admin:publish-requests
```

安全边界：

- Web 后台使用 `ADMIN_PASSWORD` 登录后 httpOnly cookie 认证。
- Agent/API 使用 `ADMIN_API_TOKEN`，不要写入仓库。
- 写 API 会检查同源后台请求；跨站网页不能直接借 cookie 写入。
- 发布按钮只创建队列请求，不直接发布，最终仍必须经过 Agent 的内容审查、构建验证、git push 和 D1 索引同步。

## 后台 API 约定

- `GET /api/admin/posts`：读取 D1 文章索引。
- `POST /api/admin/posts`：单篇或少量文章 upsert。
- `POST /api/admin/posts/import`：批量导入索引，可传 `replace: true` 重建索引。
- `GET|POST|PATCH /api/admin/automation-runs`：记录自动化运行状态。
- `GET|POST /api/admin/date-audit`：读取或写入日期变更审计。
- `GET /api/admin/ads`、`PUT /api/admin/ads/:slotKey`：管理 5 个固定广告位。
- `GET|POST|PATCH /api/admin/publish-requests`：发布/维护请求队列，支持后台 cookie 或 Agent API token。
