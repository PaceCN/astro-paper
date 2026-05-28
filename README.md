# Pace Notes

Pace Notes 是一个基于 Astro 和 Cloudflare 的轻量博客项目，用于发布、管理和展示 Markdown 文章。

项目包含前台博客页面、后台管理页面和文章 API。前台负责展示文章列表与文章详情，后台用于登录后维护内容，API 用于配合后台和自动化流程创建、更新、读取文章。

## 主要功能

- 博客首页与文章列表
- 文章详情页
- Markdown 文章内容渲染
- 后台登录
- 文章创建、编辑、发布、隐藏和删除
- 基于 Cloudflare D1 的内容存储
- 可由自动化脚本通过 API 发布文章

## 技术栈

- Astro 6
- Tailwind CSS 4
- Cloudflare Pages / Workers runtime
- Cloudflare D1
- Hono API
- Drizzle ORM

## 目录结构

```text
.
├── astro.config.mjs          # Astro 配置
├── drizzle/                  # D1 数据库迁移文件
├── drizzle.config.ts         # Drizzle 配置
├── package.json              # 项目脚本与依赖
├── public/                   # 静态资源
├── scripts/                  # 构建和辅助脚本
├── src/
│   ├── components/           # 页面组件
│   ├── db/                   # 数据库 schema
│   ├── layouts/              # 页面布局
│   ├── lib/                  # 鉴权、数据库、响应工具
│   ├── pages/                # 页面和 API 路由
│   ├── styles/               # 全局样式
│   └── utils/                # 内容处理工具
├── tailwind.config.mjs       # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── wrangler.example.toml     # Cloudflare 配置示例
```

## 常用命令

```sh
npm install
npm run dev
npm run build
npm run preview
```

说明：

- `npm run dev`：启动本地开发服务器。
- `npm run build`：构建项目，并整理 Cloudflare Pages 输出。
- `npm run preview`：使用 Wrangler 在本地预览接近线上环境的构建结果。

## 环境变量

部署到 Cloudflare Pages 时，需要配置：

| 变量名 | 必填 | 用途 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 后台登录密码，也用于签发后台 session |
| `BACKEND_ENTRY` | 是 | 自定义后台入口，例如 `secret-admin`，后台地址为 `/{BACKEND_ENTRY}` |
| `AI_API_TOKEN` | 是 | AI 专用发文接口 token |
| `PUBLIC_GOOGLE_ADSENSE_ACCOUNT` | 否 | Google AdSense 账号，例如 `ca-pub-3317750744914675` |

不要把真实密码、密钥或 Token 写进代码仓库。

## D1 数据库

项目运行时使用的 D1 binding 名称是：

```text
DB
```

Cloudflare 配置示例：

```toml
name = "boke"
pages_build_output_dir = "dist-pages"
compatibility_date = "2025-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "blogdb"
database_id = "替换成你的 D1 database id"
migrations_dir = "drizzle"
```

创建数据库：

```sh
wrangler d1 create blogdb
```

应用本地迁移：

```sh
npm run db:local
```

应用远程迁移：

```sh
npm run db:remote
```

## 页面路由

- `/`：首页
- `/posts/`：重定向到 `/archive/`，减少重复入口
- `/posts/:slug`：文章详情
- `/archive/`：文章归档
- `/search/`：站内搜索，不建议索引
- `/robots.txt`：爬虫访问规则
- `/sitemap-index.xml`：sitemap 索引
- `/sitemap.xml`：首页、静态内容页和已发布文章 sitemap
- `/{BACKEND_ENTRY}/login`：后台登录，不建议索引
- `/{BACKEND_ENTRY}`：后台管理，不建议索引

`/login` 和 `/admin` 不是后台入口，会跳回首页。

## SEO 与爬虫策略

- 不提供 `/rss.xml`，`robots.txt` 会继续禁止抓取 RSS，避免订阅器和聚合器放大请求量。
- `/sitemap-index.xml` 和 `/sitemap.xml` 由服务端生成，并设置 `public, max-age=3600, s-maxage=86400` 强缓存。
- `/sitemap.xml` 使用轻量字段读取最多 1000 篇已发布文章，不读取正文；文章规模继续增长后再拆分分页 sitemap。
- 搜索页、后台页、后台登录页、404 页输出 `noindex,follow`。
- `/archive/?tag=...` 和 `/archive/?category=...` 这类 query 参数页输出 `noindex,follow`，并由 `robots.txt` 的 `Disallow: /*?*` 保守限制抓取。
- `robots.txt` 继续禁止 `/api/`、`/admin/`、`/login/`、`/search/`、`/*?*`、`/rss.xml`，并设置 `public, max-age=3600, s-maxage=86400` 缓存。

## API 路由

公开读取接口会设置 Cloudflare 友好的 `Cache-Control`。其中公开文章列表默认返回轻量字段，不返回完整 `content`；文章详情接口仍返回正文。

- `GET /api/posts?status=published&pageSize=20`：公开读取已发布文章列表，支持 `tag`、`category`、`page`、`pageSize`
- `GET /api/posts/:slug`：公开读取单篇已发布文章
- `GET /api/posts/:slug/comments`：公开读取已发布评论
- `GET /api/meta`：公开读取站点统计、标签、分类和公开设置
- `GET /api/settings`：公开读取前台需要的站点设置
- `GET /api/related/:slug`：公开读取相关文章
- `GET /api/ads`：公开读取广告位配置
- `POST /api/auth/login`：后台登录
- `POST /api/{BACKEND_ENTRY}/ai/posts`：AI token 专用创建文章
- `POST /api/posts`：后台登录后创建文章
- `PUT /api/posts/:id`：后台登录后更新文章
- `PATCH /api/posts/:id/status`：后台登录后更新文章状态
- `DELETE /api/posts/:id`：后台登录后删除文章

AI 创建文章示例：

```http
POST /api/{BACKEND_ENTRY}/ai/posts
Authorization: Bearer 你的 AI_API_TOKEN
Content-Type: application/json

{
  "title": "文章标题",
  "slug": "article-slug",
  "status": "hidden",
  "category": "Cloudflare",
  "tags": "Cloudflare,VPS,独立博客",
  "description": "文章摘要，留空时会由正文自动生成。",
  "featured": false,
  "content": "# Markdown 正文\n\n这里写文章内容。"
}
```

后台手动创建文章仍使用后台页面，不建议让 AI 调用后台 cookie 接口。

字段说明：

- `title`：文章标题，必填。
- `slug`：文章 URL 路径，建议使用英文、数字和短横线；留空时由标题生成。
- `status`：文章状态，可为 `published` 或 `hidden`，但 AI 发文会受后台 AI 权限限制。
- `category`：分类短文本，AI 是否可设置由 `ai_can_set_category` 控制。
- `tags`：逗号分隔标签，AI 是否可设置由 `ai_can_set_tags` 控制。
- `description`：文章摘要，建议填写；留空时会从正文截断生成。
- `featured`：是否推荐，AI 是否可设置由 `ai_can_set_featured` 控制。
- `content`：Markdown 正文，必填。

如果 slug 已存在，创建接口会返回 `409`，不会覆盖已有文章；AI 定时任务遇到 409 应换 slug 或视为已存在后停止重试。

## 部署流程

1. 安装依赖：

```sh
npm install
```

2. 本地构建：

```sh
npm run build
```

3. 配置 Cloudflare Pages 环境变量和 D1 binding。

4. 执行远程数据库迁移：

```sh
npm run db:remote
```

5. 部署到 Cloudflare Pages。

6. 访问 `/{BACKEND_ENTRY}/login`，使用后台密码登录管理页面。

## 常见问题

### 图片视频加载方式
![图片信息](图片连接)

[![点击观看视频](https://img.youtube.com/vi/视频ID/maxresdefault.jpg)](视频连接)

### 登录失败

检查：

- 是否设置了 `ADMIN_PASSWORD`。
- 是否设置了 `BACKEND_ENTRY`。
- 输入密码是否与环境变量一致。
- 修改环境变量后是否重新部署。

### 页面能打开但没有文章

检查：

- D1 binding 是否为 `DB`。
- 是否执行了远程迁移。
- 数据库里是否存在 `published` 状态文章。

### API 返回未登录

检查：

- 是否已经登录后台。
- 请求是否携带 `boke_session` cookie。
- 修改 `ADMIN_PASSWORD` 后，旧 cookie 会自动失效，需要重新登录。

### AI 发文失败

检查：

- 接口路径是否为 `/api/{BACKEND_ENTRY}/ai/posts`。
- `Authorization` 是否为 `Bearer 你的 AI_API_TOKEN`。
- 后台“AI 权限管理”是否允许 AI 创建文章。
- 如果返回 `409`，说明 slug 已存在；接口不会覆盖已有文章。

### Cloudflare 构建或依赖审计异常

项目依赖保持 `latest` 以便长期获得上游修复，但 `package.json` 使用 `overrides` 固定少量兼容底座：

- `vite` 固定为 `7.3.3`，避免 Astro/Cloudflare adapter 与 Vite 8 混装导致构建错误。
- `@esbuild-kit/core-utils` 内部 `esbuild` 覆盖到安全版本，避免 `drizzle-kit` 旧 loader 链触发 audit 漏洞。

依赖更新后建议按顺序验证：

```sh
npm ci
npm audit
npm run build
```
