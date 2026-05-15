# 后台后端配置说明

Pace Notes 后台不是公开数据看板，真正读写后台 API 需要 Cloudflare Pages Functions、D1 和密码变量。后台页面现在按“总览、文章/发布、Google 广告、自动化”组织，手动操作通过按钮和表单完成，不需要在页面里手写命令。

## Cloudflare 需要配置

环境变量：

- `ADMIN_PASSWORD`：后台登录密码。建议使用长随机字符串，只在 Cloudflare Dashboard 中配置，不要提交到 Git。
- `ADMIN_API_TOKEN`：Agent/自动化调用受控 API 时使用的 Bearer token，不给浏览器页面直接使用。
- `PUBLIC_ADMIN_BASE_PATH`：后台页面路径，默认 `/admin`。这是构建时变量，修改后需要重新构建并部署。

D1 binding：

- `BLOG_DB`：后台数据库绑定名。

## 初始化 D1

1. 在 Cloudflare 创建 D1 数据库。
2. 将 binding 名设置为 `BLOG_DB`。
3. 执行 schema：`schema/d1/0001_admin_core.sql`。
4. 如果是旧库，再执行 `schema/d1/0002_admin_publish_controls.sql` 补齐发布队列和固定广告位。
5. 本地生成文章索引：

```bash
corepack pnpm run export:posts-index
```

默认会输出到：

- `/home/pace/.openclaw/workspace/tmp/pace-notes-d1/posts-index.json`
- `/home/pace/.openclaw/workspace/tmp/pace-notes-d1/posts-index.sql`

再把 `posts-index.sql` 导入 D1。

## 登录后台

默认路径：`/admin/`。

访问后输入 `ADMIN_PASSWORD`。登录成功后，浏览器会获得 httpOnly cookie：`pace_admin_session`。所有 `/api/admin/*` 接口都会验证这个 cookie；页面可以公开访问不等于 API 可公开写入。

如果 `ADMIN_PASSWORD` 未配置，登录会失败；如果 `BLOG_DB` 未配置，登录后页面会显示“BLOG_DB 读取失败”一类的人话说明。

## 用“新建发布请求”按钮

进入后台后：

1. 打开“文章/发布”。
2. 点击明显的 `新建发布请求` 或选择预设按钮：
   - `发布一篇今日技术实践文章`
   - `更新一篇旧文章`
   - `重新同步文章索引`
   - `检查日期并发布`
3. 检查表单里的标题、目标 slug、任务类型和详细要求。
4. 点击 `加入发布队列`。
5. 页面会显示队列 ID，并刷新“发布请求队列”。

发布按钮只创建 `publish_requests` 队列记录，不会在浏览器里直接改文件、持有 GitHub token、push 或部署。实际执行仍由 Agent/cron 领取任务后完成内容审查、日期校验、构建验证、提交、推送和 D1 索引同步。

总览页的 `导入/同步文章索引` 按钮也不会假装浏览器能导入本地文件；它会创建一个 `refresh_index` 发布请求，让后台执行者同步索引。

## Google 广告 / AdSense 手动配置流程

进入“Google 广告”页后：

1. 点击 `初始化固定广告位`，确保 D1 里有固定 slot。
2. 从 Google AdSense 后台复制 `ca-pub-...`，填到对应卡片的 Client ID。
3. 从广告单元复制纯数字 Slot ID，填到对应卡片的 Slot ID。
4. 选择是否启用广告位。启用但缺 Client ID 或 Slot ID 时，卡片会显示 warning。
5. 点击 `保存这个广告位`。每张卡片都有独立的保存状态。
6. 可用 `复制配置` 核对当前卡片 JSON；`清空本卡输入` 只清前端表单，不调用 API，不会误删 D1。

建议先只启用 `postBottom`，或低干扰位置；不要一开始启用文章顶部或首屏广告。

当前固定广告位与前台 slot key 对齐：

- `homeAfterHero`：首页介绍后
- `homeAfterRecent`：首页最近文章后
- `postTop`：文章顶部（默认建议关闭）
- `postMiddle`：文章中部（默认建议关闭）
- `postBottom`：文章底部（优先建议）
- `leftRail`：桌面左侧栏（当前前台组件未默认渲染）
- `rightRail`：桌面右侧栏（当前前台组件未默认渲染）

重要限制：当前前台 `src/components/AdSlot.astro` 仍读取 `src/config.ts` 里的静态 `ADS` 配置，后台保存到 D1 的广告配置不会自动让前台渲染真实广告。要让线上前台生效，需要后续选择一种方案：

- 将 D1 中核对后的 Client ID / Slot ID 同步到 `src/config.ts`，然后重新构建/部署；或
- 改造前台广告读取逻辑，让构建或运行时读取 D1 配置。

不要把真实 Google 账号密码或不该公开的凭据填进后台备注。

## 修改后台路径

在 Cloudflare Pages 的环境变量里设置：

```text
PUBLIC_ADMIN_BASE_PATH=/your-private-path
```

然后重新构建并部署。注意：Astro 静态路由是构建期生成的，路径变量不是运行时动态路由。当前默认仍保留 `/admin`。

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

## 当前 API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `POST /api/admin/posts/import`
- `DELETE /api/admin/posts?slug=...`
- `GET /api/admin/ads`
- `POST /api/admin/ads/slots`
- `PUT /api/admin/ads/:slotKey`
- `GET /api/admin/settings`
- `POST|PUT /api/admin/settings`
- `GET|POST|PATCH /api/admin/automation-runs`
- `GET|POST /api/admin/date-audit`
- `GET|POST|PATCH /api/admin/publish-requests`

安全边界：

- Web 后台使用 `ADMIN_PASSWORD` 登录后 httpOnly cookie 认证。
- Agent/API 使用 `ADMIN_API_TOKEN`：

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

- 写 API 会检查同源后台请求；跨站网页不能直接借 cookie 写入。
- 不要把 `ADMIN_PASSWORD`、`ADMIN_API_TOKEN`、Google 账号凭据写入仓库。
- 写操作上线前，建议再加 Cloudflare Access 或更细粒度权限。

本地查看待处理发布请求：

```bash
PACE_NOTES_ADMIN_URL=https://astro-paper-18u.pages.dev PACE_NOTES_ADMIN_API_TOKEN=<token> corepack pnpm run admin:publish-requests
```
