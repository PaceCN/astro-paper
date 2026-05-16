# Pace Notes

Pace Notes 是一个部署在 Cloudflare Pages/Workers 上的个人博客项目。

前台使用 Astro + Tailwind，文章和广告配置通过 Cloudflare D1 + Hono API 读取；后台登录后可以维护文章和广告位。

## 技术栈

- Astro 6
- Tailwind CSS 4
- Cloudflare Pages / Workers runtime
- Cloudflare D1
- Hono API
- Drizzle ORM

## 常用命令

```sh
npm install
npm run dev
npm run build
npm run preview
```

说明：

- `npm run dev`：本地 Astro 开发服务器。
- `npm run build`：构建到 `dist/`，并通过脚本整理 Cloudflare Pages 输出到 `dist-pages/`。
- `npm run preview`：使用 `wrangler pages dev ./dist-pages` 预览接近 Cloudflare 的运行环境。

## Cloudflare 环境变量

在 Cloudflare Pages 项目的 **Settings → Environment variables** 中配置：

| 变量名 | 必填 | 用途 | 建议值 |
| --- | --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 后台登录密码 | 自己生成一串强密码，例如 24 位以上随机字符串 |
| `JWT_SECRET` | 是 | 签发后台登录 session 的密钥 | 自己生成一串强随机字符串，建议 32 位以上 |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | 否 | Google Search Console 站点验证 | Google 给你的 verification 字符串 |

不要把真实的 `ADMIN_PASSWORD` 和 `JWT_SECRET` 写进代码仓库或 README。

可以用下面命令在本地生成随机值：

```sh
openssl rand -base64 32
```

后台入口：

```text
/login
```

登录时输入的就是 Cloudflare 环境变量里的 `ADMIN_PASSWORD`。登录成功后会跳转到：

```text
/admin
```

`/admin` 当前提供轻量后台 UI，可以管理 D1 里的文章和广告位：

- 新建文章；
- 编辑文章标题、slug、状态和 Markdown 正文；
- 发布/隐藏文章；
- 删除文章；
- 编辑并启用/关闭广告位。

## D1 数据库绑定

这个项目的代码里使用的 D1 binding 名称是：

```text
DB
```

也就是说，Cloudflare Pages/Workers 运行时需要能通过 `env.DB` 访问 D1 数据库。

### 为什么 Cloudflare 提示必须写在 wrangler.toml？

这是 Cloudflare 对 Pages Functions / Workers 项目的绑定配置要求之一。D1 binding 本身不是密码，它只是告诉 Cloudflare：

```text
把哪个 D1 数据库绑定到运行时变量 DB 上
```

`wrangler.toml` 里通常会出现：

```toml
[[d1_databases]]
binding = "DB"
database_name = "blogdb"
database_id = "你的-d1-database-id"
migrations_dir = "drizzle"
```

### 这有安全问题吗？

一般没有直接的密码泄露问题，原因是：

- `database_id` 是资源 ID，不是数据库密码；
- D1 的访问权限由 Cloudflare 项目、账号和部署环境控制；
- 浏览器前端不会因为 `wrangler.toml` 里写了 binding 就直接拿到数据库访问权限；
- 真正敏感的是 `ADMIN_PASSWORD`、`JWT_SECRET`、Cloudflare API Token，这些不要写进 `wrangler.toml`。

需要注意：如果你的仓库是公开的，别人看到 `database_id` 通常也不能直接访问你的 D1，但仍建议不要提交任何 Cloudflare API Token、账号密钥、真实后台密码或本地 `.env` 文件。

## wrangler.toml 示例

`wrangler.toml` 至少需要包含：

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

如果你在 Cloudflare 后台创建的数据库不叫 `blogdb`，可以把 `database_name` 改成实际名称；但 `binding` 必须保持为 `DB`，除非同步修改代码里的绑定名。

## 创建和迁移 D1

创建数据库：

```sh
wrangler d1 create blogdb
```

Cloudflare 会返回数据库名称和 `database_id`。把它填进 `wrangler.toml` 的 `database_id`。

应用本地迁移：

```sh
npm run db:local
```

应用远程迁移：

```sh
npm run db:remote
```

迁移文件在：

```text
drizzle/
```

## 后台和 API

主要路由：

- `/`：博客首页
- `/posts/`：文章列表
- `/posts/:slug`：文章详情
- `/login`：后台登录页
- `/admin`：后台管理页
- `/api/posts`：文章 API
- `/api/ads`：广告位 API

后台登录后调用受保护 API。公开可访问的是已发布文章和已启用广告位。

### API 不是普通页面

`/api/ads` 和 `/api/posts` 是接口地址，不是给访客看的页面。直接在浏览器里打开它们，看到 JSON 或错误信息是正常的。

### 文章 API

AI、脚本或自动化工具可以通过 `/api/posts` 发布文章，但必须先登录拿到 session cookie。

推荐流程：

```http
POST /api/auth/login
Content-Type: application/json

{
  "password": "你的 ADMIN_PASSWORD"
}
```

登录成功后，保存响应里的 cookie，再创建文章：

```http
POST /api/posts
Content-Type: application/json
Cookie: session=登录接口返回的 session cookie

{
  "title": "文章标题",
  "slug": "article-slug",
  "status": "hidden",
  "content": "# Markdown 正文\n\n这里写文章内容。"
}
```

字段说明：

- `title`：文章标题，必填；
- `slug`：URL 路径，留空时后端会根据标题生成；
- `status`：`hidden` 或 `published`，建议 AI 默认先发 `hidden`；
- `content`：Markdown 正文，必填。

文章接口速查：

- `GET /api/posts?status=published&pageSize=20`：公开读取已发布文章；
- `GET /api/posts/:slug`：公开读取单篇已发布文章；
- `GET /api/posts?pageSize=50`：登录后读取全部文章；
- `POST /api/posts`：登录后创建文章；
- `PUT /api/posts/:id`：登录后更新文章；
- `PATCH /api/posts/:id/status`：登录后发布或隐藏文章；
- `DELETE /api/posts/:id`：登录后删除文章。

## 广告位

前台组件会读取：

```text
/api/ads
```

`/api/ads` 不是 Google AdSense 必须要求的页面。它只是本站自己的广告位配置接口：后台把广告代码存进 D1，前台再从这个接口读取并渲染。

如果暂时不放 Google 广告，可以不配置广告位。如果要放 AdSense：

1. 到 Google AdSense 后台创建广告单元；
2. 复制 Google 给你的广告代码；
3. 登录 `/admin`；
4. 在右侧广告位中粘贴代码；
5. 勾选启用并保存。

当前支持的后端广告位包括：

- `header_bottom`
- `sidebar_top`
- `content_top`
- `content_bottom`
- `footer_top`

前端页面里的 AstroPaper 风格广告位会映射到这些 D1 广告位。

## 部署流程

1. 本地确认构建通过：

```sh
npm run build
```

2. 确认 `wrangler.toml` 里 D1 绑定正确。
3. 在 Cloudflare Pages 设置环境变量：
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - 可选：`PUBLIC_GOOGLE_SITE_VERIFICATION`
4. 部署到 Cloudflare Pages。
5. 访问 `/login`，用 `ADMIN_PASSWORD` 登录后台。

## 常见问题

### 登录一直失败

检查：

- Cloudflare Pages 是否设置了 `ADMIN_PASSWORD`；
- 输入的密码是否和变量完全一致；
- 是否设置了 `JWT_SECRET`；
- 重新部署后变量才会生效。

### 页面能打开，但文章为空

检查：

- D1 是否绑定为 `DB`；
- 是否执行了远程迁移：`npm run db:remote`；
- D1 里是否有 `published` 状态的文章。

### Cloudflare 提示 D1 必须写入 wrangler.toml

按上面的 `[[d1_databases]]` 示例配置即可。不要把密码、JWT secret 或 API token 写进 `wrangler.toml`。
