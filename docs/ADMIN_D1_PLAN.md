# 后台与 D1 演进方案

## 推荐架构

短期采用：**Markdown 正文 + D1 管理索引**。

原因：

- Markdown 适合静态 SEO、Git 审计和自动化 agent 修改。
- D1 适合保存后台配置、广告位、文章索引、自动化运行记录和审计日志。
- 现在不直接把正文搬进 D1，可以避免 URL、frontmatter、图片路径和构建流程大迁移。

## 已准备内容

- D1 schema：`schema/d1/0001_admin_core.sql`
- 文章索引导出脚本：`corepack pnpm run export:posts-index`
- 静态后台骨架：
  - `/admin/`
  - `/admin/posts/`
  - `/admin/ads/`
  - `/admin/automation/`

## 后续接入步骤

1. 在 Cloudflare 创建 D1 数据库。
2. 复制 schema 到远程 D1 执行。
3. 配置 Pages Functions D1 binding。
4. 将 `scripts/export-posts-index.mjs` 生成的 SQL 导入 D1。
5. 后台先开放只读 API，再逐步开放写操作。
6. 写操作上线前必须加入鉴权、CSRF/权限校验、审计日志和回滚方案。

## 回滚策略

- Markdown 仍是正文事实源，D1 索引可重新生成。
- 广告配置出错时，把 `ADS.enabled` 设为 `false` 即可关闭前端广告。
- 发布日期以 Markdown `pubDatetime` 为准，D1 不应反向覆盖正文日期。
