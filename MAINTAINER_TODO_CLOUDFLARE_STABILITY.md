# Maintainer TODO：Cloudflare 长期稳定与请求成本优化

## 目标

本 TODO 用于后续新会话直接执行代码更新。核心目标是让博客长期稳定部署在 Cloudflare Pages / Workers / D1 上运行，尤其是在文章数量增长、AI 定时任务持续发布文章、爬虫访问增加后，仍能控制 Worker 请求数、D1 查询成本和响应体大小。

执行所有阶段时必须遵守四条约束：

1. 优先保障 Cloudflare 长期稳定运行，而不是追求短期功能堆叠。
2. 优先减少 Worker/D1 请求数，尊重 Cloudflare 免费额度限制。
3. 优先选择方便后期维护和更新的简单方案。
4. 通过消除冗余代码和增强关键边界健壮性来降低维护风险；任何 SEO、重构、API 优化都不能牺牲缓存稳定性、AI 发文流程和人工后台可用性。

## 必须保留的业务能力

1. AI 定时任务仍然通过 API 发布文章。
2. 人工后台仍然保留完整管理能力。
3. RSS 继续不提供，`robots.txt` 继续禁止 `/rss.xml`。
4. 搜索页、后台页、登录页、query 参数归档页继续 `noindex`。
5. 不引入需要额外付费服务的依赖；优先使用 Cloudflare Pages/Workers/D1 原生能力。

## 明确不要做的事

- 不要删除人工后台。
- 不要删除 AI 发文 API。
- 不要恢复 RSS。
- 不要把所有页面改成纯静态生成；当前项目依赖 D1 内容和后台管理，仍以 Astro server output 为主。
- 不要引入 Redis、外部数据库、外部搜索服务。
- 不要改动部署目标，不要脱离 Cloudflare Pages/Workers/D1。
- 不要为了优化而重写 UI 或主题样式。
- 不要大规模重命名路由，除非 TODO 中明确要求。

---

## 当前关键问题摘要

### 1. SSR 页面内部 fetch 自己的 `/api/*`

当前多个 Astro SSR 页面通过 HTTP fetch 调用自身 API，导致一次页面访问放大成多次 Worker/API/D1 链路。

重点位置：

- `src/pages/index.astro`
  - 请求 `/api/posts?status=published&pageSize=...`
  - 请求 `/api/meta`
  - 两个 `AdSlot` 又各自请求 `/api/ads`
- `src/pages/posts/[slug].astro`
  - 请求 `/api/posts/:slug`
  - 请求 `/api/settings`
  - 请求 `/api/related/:slug`
  - 请求 `/api/posts/:slug/comments`
  - 两个 `AdSlot` 又各自请求 `/api/ads`
- `src/pages/archive.astro`
  - 请求 `/api/posts?status=published&pageSize=50`
- `src/pages/posts/index.astro`
  - 与 archive 基本重复，也请求 `/api/posts?...`
- `src/pages/search.astro`
  - 请求 `/api/posts?status=published&pageSize=50`
- `src/pages/sitemap.xml.ts`
  - 请求 `/api/posts?status=published&pageSize=50`
- `src/components/AdSlot.astro`
  - 每个实例都会请求 `/api/ads`

### 2. 公开 HTML 页面缺少 Cloudflare 边缘缓存头

目前主要只有 sitemap 设置了缓存：

- `src/pages/sitemap.xml.ts`
- `src/pages/sitemap-index.xml.ts`

公开 HTML 页面和公开 API 大多没有明确 `Cache-Control`，流量或爬虫访问时很容易每次进入 Worker 和 D1。

### 3. `/api/posts` 默认返回完整正文

列表、首页、归档、sitemap 通常不需要 `content`，但当前公开列表接口会返回整行，后期文章数量和正文长度增长后会放大 D1 读取、JSON 序列化、HTML 注入和网络响应体。

### 4. D1 缺少面向公开读路径的索引

当前 posts 主要只有 slug 唯一索引。高频查询包括：

- published posts 按 createdAt 倒序
- category 过滤
- comments 按 postId/status 查询
- comments 后台按 status 查询

需要补充索引迁移。

### 5. AI 发文 API 需要面向定时任务重试的稳定性

当前 AI 发布入口：

- `POST /api/{BACKEND_ENTRY}/ai/posts`
- 实现位置：`src/pages/api/[...path].ts`

需要评估并优化：

- slug 冲突时的行为；
- 定时任务重试是否幂等；
- AI 默认发布状态；
- AI 权限设置是否继续生效；
- 人工后台和 AI API 是否共用同一套写入逻辑。

---

## 建议执行顺序

建议分 6 个阶段执行。每阶段完成后运行 `npm run build`。如果做了数据库迁移，还要确认 Drizzle migration 文件和 schema 一致。

说明：Phase 5 是 SEO 稳定收录优化；Phase 6 是后置的死代码与重复逻辑清理。Phase 6 不应抢在缓存、API、D1、SEO 稳定性之前执行。

---

# Phase 1：低风险高收益缓存与入口治理

## 1.1 给 robots.txt 添加缓存头

文件：`src/pages/robots.txt.ts`

目标：

- 保持现有 robots 规则不变。
- 为响应添加：
  - `Content-Type: text/plain; charset=utf-8`
  - `Cache-Control: public, max-age=3600, s-maxage=86400`

不要改动：

- 不要恢复 RSS。
- 不要放开 `/api/`。
- 不要放开 `/search/`。
- 不要删除 AI bot 屏蔽规则。

验收：

- `robots.txt` 内容和原规则一致。
- 响应头包含缓存。

## 1.2 给公开 API 增加可控缓存头

文件：

- `src/lib/response.ts`
- `src/pages/api/[...path].ts`

建议方式：

- 在 `response.ts` 中新增一个用于公开缓存 JSON 的 helper，例如 `cachedOk`。
- 或在具体 API handler 中直接设置 header。

建议缓存策略：

| API | 建议 Cache-Control |
| --- | --- |
| `GET /api/posts?status=published` | `public, max-age=60, s-maxage=600, stale-while-revalidate=86400` |
| `GET /api/posts/:slug` | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` |
| `GET /api/meta` | `public, max-age=60, s-maxage=600, stale-while-revalidate=86400` |
| `GET /api/settings` | `public, max-age=60, s-maxage=600, stale-while-revalidate=86400` |
| `GET /api/related/:slug` | `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` |
| `GET /api/ads` | `public, max-age=60, s-maxage=600, stale-while-revalidate=86400` |
| `GET /api/posts/:slug/comments` | `public, max-age=30, s-maxage=60, stale-while-revalidate=300` |

注意：

- 不要给后台写接口加 public cache。
- 不要给登录、退出、创建、更新、删除接口加 public cache。
- 不要给带 cookie 的后台 API 响应加 public cache。
- `GET /api/posts` 只有 `status=published` 时才公开缓存；后台不带 published 或 status=hidden 的列表不要 public cache。

验收：

- 公开 GET API 有缓存头。
- 登录态后台 API 没有 public cache。
- `npm run build` 通过。

## 1.3 处理 `/posts/` 与 `/archive/` 重复入口

文件：`src/pages/posts/index.astro`

推荐方案：

- 将 `/posts/` 301 或 302 重定向到 `/archive/`。
- 如果担心永久重定向不方便回滚，先用 302。

目标：

- 减少重复归档入口。
- 减少爬虫抓取重复页面。

不要改动：

- 不要删除 `/archive/`。
- 不要修改文章详情 `/posts/:slug/`。

验收：

- `/posts/` 跳转到 `/archive/`。
- `/posts/:slug/` 不受影响。

---

# Phase 2：抽出服务层，停止 SSR fetch 自己 API

## 2.1 新增服务层文件

建议新增文件：`src/lib/content-service.ts`

目标：

把 API route 和 Astro pages 共同需要的数据读取逻辑放到服务层，避免页面通过 HTTP fetch 调自己。

建议导出函数：

```ts
getPublicPosts(db, options)
getPublicPostBySlug(db, slug)
getPublishedCommentsBySlug(db, slug)
getPublicSettings(db)
getPublicMeta(db)
getRelatedPosts(db, slug)
getAdSlots(db)
```

设计要求：

- 函数接收 D1 database 或 drizzle db，不从全局乱取状态。
- API 和页面共用同一套函数。
- 列表函数默认不返回 `content`，除非显式参数要求。
- 保持现有字段命名对前端兼容，避免大范围 UI 修改。

不要做：

- 不要把服务层做成过度抽象框架。
- 不要引入外部缓存库。
- 不要改变数据库表名。

## 2.2 改造 API route 使用服务层

文件：`src/pages/api/[...path].ts`

目标：

- `GET /posts`
- `GET /posts/:slug`
- `GET /posts/:slug/comments`
- `GET /settings`
- `GET /meta`
- `GET /related/:slug`
- `GET /ads`

这些读接口调用服务层。

注意：

- 写接口继续保留在 API route 中，但可复用服务层或 shared helper。
- AI 创建文章和人工创建文章必须继续可用。
- 鉴权中间件现有公开/后台判断要保持谨慎，不要把后台接口误放开。

## 2.3 改造首页不再 fetch `/api/*`

文件：`src/pages/index.astro`

当前问题：

- 请求 posts。
- 请求 meta。
- AdSlot 重复请求 ads。

目标：

- 直接通过服务层读取 posts/meta/ads。
- 页面级读取一次 ads，传给 `AdSlot`。

需要配合改造：`src/components/AdSlot.astro`

## 2.4 改造文章详情页不再 fetch `/api/*`

文件：`src/pages/posts/[slug].astro`

当前问题：

- 文章、settings、related、comments 都 fetch API。
- 两个 AdSlot 各自 fetch ads。

目标：

- 服务层直接读取文章。
- 找不到文章时仍按现有行为跳回首页或返回 404，建议改为 404 更合理，但如果改行为风险高，可先保持现状。
- 服务层读取 settings、related、comments、ads。
- ads 页面级只读一次。

缓存目标：

- 给文章详情 HTML 设置 Cloudflare 边缘缓存。
- 评论如果仍然 SSR 内联，缓存时间不宜太长；若后续改懒加载，则文章 HTML 可更长缓存。

## 2.5 改造 archive/search/sitemap 不再 fetch `/api/posts`

文件：

- `src/pages/archive.astro`
- `src/pages/search.astro`
- `src/pages/sitemap.xml.ts`

目标：

- 直接服务层读取轻量文章列表。
- sitemap 只需要 `slug`, `updatedAt`, `createdAt`。
- archive 只需要卡片字段，不需要完整 content。
- search 若暂时还需要全文搜索，可通过 `includeContent: true` 明确调用，但这是临时方案；长期建议见 Phase 4。

验收：

- 页面不再出现 `fetch(new URL('/api...` 读取本项目公开 API 的模式。
- `AdSlot` 不再自己 fetch `/api/ads`。
- `npm run build` 通过。

---

# Phase 3：D1 schema 与 API 写入稳定性

## 3.1 增加 D1 索引迁移

文件：

- `src/db/schema.ts`
- 新增 drizzle migration，例如 `drizzle/0005_read_indexes.sql`

建议 SQL：

```sql
CREATE INDEX IF NOT EXISTS posts_status_created_at_idx
ON posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS posts_status_category_created_at_idx
ON posts (status, category, created_at DESC);

CREATE INDEX IF NOT EXISTS comments_post_status_created_at_idx
ON comments (post_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS comments_status_created_at_idx
ON comments (status, created_at DESC);
```

注意：

- 如果使用 Drizzle 生成迁移，确保 schema 与 migration 一致。
- `tags LIKE '%tag%'` 普通索引帮助有限，不要误以为这个索引能解决 tag 模糊搜索。

验收：

- migration 文件存在。
- schema 声明索引或至少 migration 明确创建索引。
- `npm run build` 通过。

## 3.2 优化 `/api/posts` 字段返回

文件：

- `src/lib/content-service.ts`
- `src/pages/api/[...path].ts`
- 依赖该接口的页面和后台脚本

目标：

- 公开列表默认不返回完整 `content`。
- 后台列表如果需要编辑内容，可以保留后台接口返回完整内容，或后台点击编辑时再请求详情。
- API 参数可设计为：
  - `includeContent=true` 仅后台登录或明确允许时有效；
  - 公开 `status=published` 默认忽略 `includeContent`，除非搜索页临时需要。

更稳妥实现建议：

- 公开列表：轻量字段。
- 公开详情：完整正文。
- 后台列表：可保留完整字段，避免一次改动后台 UI 太多。

验收：

- 首页、归档、sitemap 不依赖 `content`。
- 文章详情仍能显示正文。
- 后台文章列表和编辑不坏。

## 3.3 AI 发文 API 幂等和冲突策略

文件：`src/pages/api/[...path].ts`

当前入口：`POST /api/:backendEntry/ai/posts`

目标：

AI 定时任务重试时不要造成不可控失败或重复状态混乱。

建议策略二选一：

### 方案 A：保守冲突返回

- 如果 slug 已存在，返回 `409`，并明确 message。
- AI 调度侧看到 409 后可判断为已存在或需要换 slug。
- 不自动覆盖已有文章。

适合：不希望 AI 自动覆盖人工修改。

### 方案 B：AI 幂等 upsert hidden 草稿

- 如果 slug 已存在且文章状态是 hidden，并且请求带 `idempotencyKey` 或明确 `overwriteHidden=true`，允许更新 hidden 草稿。
- 如果 slug 已 published，默认拒绝覆盖，返回 409。
- 人工后台仍可编辑和发布。

适合：AI 定时任务会重试同一篇草稿。

推荐：先做方案 A，风险最低。后续如果 AI 发布流程经常重试，再升级到方案 B。

必须保留：

- `ai_can_create_post`
- `ai_can_publish_post`
- `ai_can_set_featured`
- `ai_can_set_category`
- `ai_can_set_tags`
- `ai_default_status`

验收：

- AI token 错误仍 401。
- BACKEND_ENTRY 错误仍 404。
- AI 默认不能越权发布，除非设置允许。
- slug 冲突行为明确且可预测。
- 人工后台创建文章不受影响。

---

# Phase 4：长期扩展优化

## 4.1 搜索页轻量化

文件：`src/pages/search.astro`

当前问题：

- 搜索页会取前 50 篇完整 content 并注入 DOM。
- 文章多后，页面体积和 SSR 成本会增长。

短期方案：

- 搜索只基于 title、slug、description、tags、category。
- 不把完整正文放入 `data-search`。

长期方案：

- 构建或服务端生成轻量 search index JSON。
- index 只包含必要字段。
- 可缓存较长时间。

不要做：

- 不引入外部搜索服务。
- 不引入重量级前端搜索库，除非确有必要。

## 4.2 评论懒加载

文件：

- `src/pages/posts/[slug].astro`
- `src/components/Comments.astro`
- `src/pages/api/[...path].ts`

目标：

- 文章 HTML 可长缓存。
- 评论独立短缓存或不缓存。

建议：

- 文章 SSR 不内联评论列表。
- 页面加载后客户端请求 `/api/posts/:slug/comments`。
- 评论提交后只刷新评论区域。

注意：

- 如果想保持首屏完整评论，可以延后此项。
- 评论不是当前最高优先级。

## 4.3 tag/category 规范化

当前 tags 是逗号字符串，查询使用 LIKE。文章量大后不稳定。

长期方案：

- 新增 `post_tags` 表。
- tag/category 统计从规范化表或预聚合表读取。
- AI 发文和人工后台写入时同步维护。

暂不建议第一轮执行，除非文章数量已经明显增长并且 tag 查询成为瓶颈。

---

# Phase 5：SEO 稳定收录优化

## 执行原则

SEO 优化必须服务于长期稳定收录，而不是开放更多高成本入口。所有 SEO 改动都必须同时满足：

1. 不增加明显的 Worker/D1 请求量。
2. 不削弱 Cloudflare 边缘缓存。
3. 不恢复 RSS。
4. 不让 search、后台、query 参数页进入索引。
5. 不引入外部 SEO、搜索、图片生成服务。

## 5.1 sitemap 支持文章数量增长

文件：

- `src/pages/sitemap-index.xml.ts`
- `src/pages/sitemap.xml.ts`
- 如需要，可新增分页 sitemap 路由，例如 `src/pages/sitemap-posts/[page].xml.ts` 或等价 Astro 路由。

当前问题：

- `src/pages/sitemap.xml.ts` 只读取 `pageSize=50`。
- 文章超过 50 篇后，后面的文章可能不会进入 sitemap。

推荐演进：

- 保留 `/sitemap-index.xml` 作为入口。
- 将 sitemap 拆成：
  - `/sitemap-pages.xml`：固定页面，例如首页、about、archive、contact、privacy、terms。
  - `/sitemap-posts-1.xml`、`/sitemap-posts-2.xml`：文章分页 sitemap。
- 每个 posts sitemap 建议 500 或 1000 篇一页，不要一次读取无限文章。
- 每个 sitemap 都设置：
  - `Content-Type: application/xml; charset=utf-8`
  - `Cache-Control: public, max-age=3600, s-maxage=86400`

如果第一轮不想新增多个路由，可先把 `sitemap.xml` 改为使用服务层轻量字段并支持更合理的分页方案设计，但不要继续固定只取 50 篇。

验收：

- sitemap 不读取文章正文。
- sitemap 可覆盖超过 50 篇文章。
- sitemap 响应有缓存头。
- sitemap index 不造成全量高成本查询。

## 5.2 文章页结构化数据补强

文件：

- `src/layouts/Layout.astro`
- `src/pages/posts/[slug].astro`

目标：

在不增加请求数的前提下，补强已有 `BlogPosting` JSON-LD。

建议补充字段：

- `mainEntityOfPage`
- `dateModified`
- `publisher`
- `keywords`
- `articleSection`

注意：

- `keywords` 可来自文章 tags，不要额外查询。
- `articleSection` 可来自 category，不要额外查询。
- 如果 Layout 当前没有 tags/category props，可以小范围新增 props；不要为了 SEO 大改布局。
- 不要引入动态 OG 图片生成，除非后续明确实现强缓存。

验收：

- 文章页 HTML 中存在有效 JSON-LD。
- canonical 仍指向 `/posts/{slug}/`。
- 不新增额外 API 请求。

## 5.3 AI 发文流程加入 SEO 字段约束

文件：

- `src/pages/api/[...path].ts`
- 如果后续有 AI skill/prompt 文件，也应同步，但本仓库内不要凭空新增外部自动化配置。

目标：

因为文章主要由 AI 定时任务发布，SEO 质量应在写入时前置约束，而不是页面渲染时补救。

建议要求：

- `description` 尽量必填；如果缺失，仍可用正文截断兜底，但要限制长度。
- `slug` 必须稳定，保持英文/数字/短横线规范。
- `category` 使用短文本，避免过多离散分类。
- `tags` 建议 3-6 个，normalize 后存储。
- 默认 AI 发文仍以 hidden 为安全默认，除非 `ai_can_publish_post` 明确允许。

不要做：

- 不要让 AI 自动覆盖已发布文章。
- 不要让 AI 自动改变 published 文章 slug。
- 不要为了 SEO 强制拒绝所有缺 description 的请求；可以先兜底并返回明确 message，避免定时任务大面积失败。

验收：

- AI 发文仍可用。
- description/category/tags 规范化后写入。
- published 文章 slug 不被 AI 静默覆盖。

## 5.4 已发布 slug 稳定性与重定向预留

目标：

保护已被搜索引擎收录的文章 URL。

短期建议：

- 人工后台仍可编辑 slug，但最好在 UI 或 API 层对 published 文章 slug 修改保持谨慎。
- AI API 遇到已 published slug 默认返回 409，不自动覆盖。

长期方案：

- 新增 redirect 表，旧 slug 301 到新 slug。
- 不建议第一轮就做 redirect 表，除非已经存在大量改 slug 的需求。

验收：

- 已发布文章 URL 不会被 AI 定时任务破坏。
- 文章 canonical 保持稳定。

## 5.5 Open Graph 与图片策略

目标：

增强社交分享展示，但不增加运行时计算成本。

建议：

- 保留默认 `/og.svg`。
- 允许未来文章扩展自定义 ogImage 字段，但第一轮不强制新增数据库字段。
- 不启用动态 OG 图片生成，避免额外 CPU/请求成本。
- AI 写 Markdown 图片时应尽量使用有意义 alt 文本。

---

# Phase 6：消除冗余代码与增强健壮性

## 是否有必要新增这个 TODO

有必要，但必须作为后置阶段执行。本阶段的核心不是“为了重构而重构”，而是消除冗余代码、减少重复逻辑、增强 AI/API/后台这些关键边界的健壮性，从而降低后期维护和 Cloudflare 长期运行风险。

当前项目已经出现重复逻辑和历史遗留代码迹象，例如：

- `src/pages/archive.astro` 与 `src/pages/posts/index.astro` 基本重复。
- 多个页面重复定义 `Post` 类型。
- 多个页面重复通过 HTTP fetch 本项目 API。
- `src/utils/d1Posts.ts` 与当前主 schema/API 命名不完全一致，可能是旧内容源遗留。
- `src/utils/contentSource.ts` 仍保留 markdown/d1 内容源切换痕迹，但当前 README 和主流程以 D1 管理后台为主。

但这个阶段不能做成大规模重构。它的目的应是降低维护风险和重复逻辑，而不是改变产品行为。

## 执行原则

1. 只在 Phase 1-5 完成并通过验收后执行。
2. 每次只删除或合并能确认无调用、无运行时依赖的代码。
3. 删除前必须 grep 全仓库引用。
4. 不删除后台、AI API、D1 schema、部署配置。
5. 不做 UI 重写。
6. 不以“防御性编程”为名增加大量无用 fallback；只在系统边界保留必要校验。
7. 每个小步骤后运行 `npm run build`。

## 6.1 清理重复页面逻辑

目标：

- 如果 Phase 1 已将 `/posts/` 重定向到 `/archive/`，则 `src/pages/posts/index.astro` 应保持为最小重定向页面，不再复制 archive 页面逻辑。

验收：

- `/archive/` 正常。
- `/posts/` 跳转正常。
- `/posts/:slug/` 正常。

## 6.2 收敛重复类型定义

可选新增：`src/lib/types.ts` 或在 `content-service.ts` 中导出必要类型。

目标：

- 收敛重复的 `Post`, `Comment`, `Meta`, `AdSlot` 类型。
- 不要为了类型收敛引入复杂泛型。

验收：

- 页面类型更少重复。
- build 通过。

## 6.3 审查旧 utils 是否仍被使用

重点文件：

- `src/utils/d1Posts.ts`
- `src/utils/contentSource.ts`
- `src/utils/markdownPosts.ts`
- `src/utils/getPostsByTag.ts`
- `src/utils/getSortedPosts.ts`
- `src/utils/postFilter.ts`

执行方法：

- 对每个文件用 grep 查引用。
- 如果无引用，且不是 Astro/content collection 必需文件，可删除。
- 如果有引用，不要删除；只记录后续重构机会。

验收：

- 没有删除仍被 import 的文件。
- build 通过。

## 6.4 收敛响应与缓存 helper

文件：

- `src/lib/response.ts`
- `src/pages/api/[...path].ts`

目标：

- 统一 `ok/fail/cachedOk` 或等价 helper。
- 避免每个 handler 手写不一致缓存头。
- 不要给后台写接口误加 public cache。

验收：

- 公开 API 缓存策略清晰集中。
- 后台 API 不 public cache。

## 6.5 健壮性增强边界

只在以下边界保留或增强校验：

- AI API 输入。
- 人工后台写接口输入。
- slug、status、category、tags。
- comments 输入。
- 环境变量缺失。
- 公开分页参数，例如 `page`、`pageSize`，必须有上限。
- published 文章 slug 冲突和 AI 重试场景。

增强方式应保持简单：

- 统一 normalize 输入。
- 统一返回明确错误码和 message。
- 保持 AI API 与人工后台写入逻辑共享核心校验。
- 对不可恢复的配置错误返回清晰错误，不静默吞掉。

不要做：

- 不要在内部服务函数之间反复做不必要校验。
- 不要增加多层 fallback 掩盖真实配置错误。
- 不要为了“健壮性”吞掉数据库写入失败。
- 不要让异常变成难以发现的空列表，除非是公开只读页面的降级展示。

内部代码应通过类型、服务层边界和清晰调用约束保持简单。

---

## 建议新增/修改文件清单

可能新增：

- `src/lib/content-service.ts`
- `drizzle/0005_read_indexes.sql`

重点修改：

- `src/pages/api/[...path].ts`
- `src/lib/response.ts`
- `src/pages/index.astro`
- `src/pages/posts/[slug].astro`
- `src/pages/archive.astro`
- `src/pages/posts/index.astro`
- `src/pages/search.astro`
- `src/pages/sitemap.xml.ts`
- `src/pages/robots.txt.ts`
- `src/components/AdSlot.astro`
- `src/db/schema.ts`

尽量不要修改：

- `astro.config.mjs`，除非确实需要。
- `wrangler.toml`，除非只是同步示例或确认配置。
- UI 样式文件。
- README，除非用户要求同步文档。

---

## 每阶段验收命令

基础验收：

```sh
npm run build
```

如果涉及 D1 migration：

```sh
npm run db:local
```

如需本地运行确认：

```sh
npm run dev
```

建议人工检查页面：

- `/`
- `/archive/`
- `/posts/<已有 slug>/`
- `/search/`
- `/sitemap.xml`
- `/robots.txt`
- `/{BACKEND_ENTRY}/login`
- `/{BACKEND_ENTRY}`

建议 API 检查：

- `GET /api/posts?status=published&pageSize=6`
- `GET /api/meta`
- `GET /api/settings`
- `GET /api/ads`
- `GET /api/posts/:slug`
- `GET /api/related/:slug`
- `GET /api/posts/:slug/comments`
- `POST /api/{BACKEND_ENTRY}/ai/posts`

---

## 最终验收标准

完成后应满足：

1. 公开页面具备 Cloudflare 边缘缓存策略。
2. 公开读 API 具备合理缓存策略。
3. Astro SSR 页面不再通过 HTTP fetch 自己的公开 API。
4. `AdSlot` 不再每个实例重复请求 `/api/ads`。
5. 首页、归档、sitemap 不再读取完整正文。
6. D1 有适合 published 列表、category、comments 的索引。
7. AI 发布 API 保留，并且 slug 冲突或重试行为明确。
8. 人工后台保留，并且登录、创建、编辑、发布、隐藏、删除能力不受影响。
9. RSS 继续禁用，robots 策略不放松。
10. SEO 以 sitemap、canonical、JSON-LD、稳定 slug 为主，不增加高成本爬虫入口。
11. 明确清理可确认的冗余代码与重复逻辑，但不做无边界大重构。
12. AI/API/后台输入边界更健壮，错误行为明确，不静默破坏数据。
13. `npm run build` 通过。
