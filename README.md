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
| `ADMIN_PASSWORD` | 是 | 后台登录密码 |
| `JWT_SECRET` | 是 | 签发后台 session 的密钥 |
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
- `/posts/`：文章列表
- `/posts/:slug`：文章详情
- `/login`：后台登录
- `/admin`：后台管理

## API 路由

- `GET /api/posts?status=published&pageSize=20`：读取已发布文章列表
- `GET /api/posts/:slug`：读取单篇已发布文章
- `POST /api/auth/login`：后台登录
- `POST /api/posts`：创建文章
- `PUT /api/posts/:id`：更新文章
- `PATCH /api/posts/:id/status`：更新文章状态
- `DELETE /api/posts/:id`：删除文章

创建文章示例：

```http
POST /api/posts
Content-Type: application/json
Cookie: boke_session=登录后的 session cookie

{
  "title": "文章标题",
  "slug": "article-slug",
  "status": "published",
  "content": "# Markdown 正文\n\n这里写文章内容。"
}
```

字段说明：

- `title`：文章标题，必填。
- `slug`：文章 URL 路径，建议使用英文、数字和短横线。
- `status`：文章状态，可为 `published` 或 `hidden`。
- `content`：Markdown 正文，必填。

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

6. 访问 `/login`，使用后台密码登录管理页面。

## 常见问题

### 图片视频加载方式
![图片信息](图片连接)

[![点击观看视频](https://img.youtube.com/vi/视频ID/maxresdefault.jpg)](视频连接)

### 登录失败

检查：

- 是否设置了 `ADMIN_PASSWORD`。
- 是否设置了 `JWT_SECRET`。
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
- `JWT_SECRET` 是否与线上环境一致。
