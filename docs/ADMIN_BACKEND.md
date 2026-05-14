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

## 后台 API 约定

- `GET /api/admin/posts`：读取 D1 文章索引。
- `POST /api/admin/posts`：单篇或少量文章 upsert。
- `POST /api/admin/posts/import`：批量导入索引，可传 `replace: true` 重建索引。
- `GET|POST|PATCH /api/admin/automation-runs`：记录自动化运行状态。
- `GET|POST /api/admin/date-audit`：读取或写入日期变更审计。
- `GET /api/admin/ads`、`PUT /api/admin/ads/:slotKey`：管理广告位配置。

注意：当前广告位配置先作为后台管理数据保存；前台广告是否展示仍受 `src/config.ts` 中 `ADS` 构建时配置控制。正式让后台广告配置影响前台前，需要增加运行时公开配置 API 或构建期注入步骤。
