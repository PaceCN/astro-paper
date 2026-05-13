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
