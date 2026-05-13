# Pace Notes

中文个人开发者实战手册，记录 AI 自动化、自托管运维、Cloudflare、Astro 独立博客和个人项目成本控制。

- 线上站点：<https://astro-paper-18u.pages.dev/>
- GitHub 仓库：<https://github.com/PaceCN/astro-paper>
- 技术底座：AstroPaper / Astro / TypeScript / TailwindCSS / Cloudflare Pages

## 内容方向

- **AI 自动化**：n8n、MCP、Agent 工作流、自动化写作与验证流程。
- **自托管运维**：VPS、Cloudflare、Docker、备份、安全和故障处理。
- **独立博客建设**：AstroPaper、SEO、搜索收录、内容质量和发布流程。
- **收入与成本记录**：个人项目成本、广告准备、长期维护取舍。

## 项目结构

```text
src/data/blog/        Markdown 文章内容
src/pages/            页面与后台入口
src/components/       Astro 组件
functions/api/admin/  Cloudflare Pages Functions 后台 API
docs/                 运营、SEO、AdSense、后台和自动化文档
schema/d1/            D1 数据库 schema
scripts/              日期校验、文章索引导出等脚本
```

## 本地开发

```bash
corepack pnpm install
corepack pnpm run dev
```

常用检查：

```bash
corepack pnpm run format:check
corepack pnpm run validate:dates
corepack pnpm run lint
corepack pnpm run build
```

## 发布与运营

- 正文事实源是 `src/data/blog/**/*.md`。
- 文章日期以 frontmatter 中的 `pubDatetime` 为准。
- 自动化发布规则见 `docs/BLOG_OPS.md` 和 `docs/SEO_STYLE_GUIDE.md`。
- AdSense 准备清单见 `docs/ADSENSE_READINESS.md`。
- 后台与 D1 配置见 `docs/ADMIN_BACKEND.md`、`docs/ADMIN_D1_PLAN.md`。

## 部署

站点部署在 Cloudflare Pages。构建命令：

```bash
corepack pnpm run build
```

输出目录：

```text
dist
```

后台 API 依赖 Cloudflare Pages Functions、D1 binding 和环境变量；不要把后台密码或生产密钥提交到仓库。

## License

本项目基于 AstroPaper 改造，保留原项目 MIT License。
