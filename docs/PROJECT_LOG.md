# 项目记录

> 路径：`/home/pace/test-project-boke-google/astro-paper-main`  
> 线上：`https://astro-paper-18u.pages.dev/`  
> 仓库：`https://github.com/PaceCN/astro-paper`

## 2026-05-08

### 已知状态

- Cloudflare Pages 已上线。
- `SITE.website` 已改为 `https://astro-paper-18u.pages.dev/`。
- 本地目录最初不是 Git 仓库，已在 `astro-paper-main` 初始化 Git 并绑定远程 `origin`。

### 研究结论

定位建议：**中文个人开发者的 AI 自动化、自托管运维与低成本独立博客实战手册**。

优先内容线：

1. AI 自动化 / n8n / MCP / Agent 工作流
2. VPS / Cloudflare / Docker / 自托管运维
3. AstroPaper / 独立博客 / SEO

变现路径优先级：

1. 真实教程 + 合规联盟链接
2. 云服务 referral 抵扣服务器成本
3. 付费模板 / 部署服务
4. GitHub Sponsors / 打赏
5. AdSense 后置，等有稳定搜索流量再考虑

### 执行原则

- 先做可信内容和搜索入口，不急着挂广告。
- 每篇文章必须有明确关键词、可复现步骤、风险/成本说明。
- 项目记录只放在本项目目录内。

### 首版改造

- 重置本地仓库到 GitHub `origin/main`，避免覆盖用户已推送的历史。
- 更新站点配置：标题 `Pace Notes`、作者 `wx`、语言 `zh-CN`、时区 `Asia/Shanghai`、编辑链接指向 `PaceCN/astro-paper`。
- 首页改为中文定位文案。
- About 改为中文项目介绍。
- 清理 AstroPaper 默认示例文章，创建 4 篇首批中文文章：
  - 这个博客接下来会写什么
  - Cloudflare Pages 部署 AstroPaper 的最小配置清单
  - 为什么博客维护适合交给 Agent，但不适合全自动发布
  - 让技术博客覆盖服务器成本的现实路径
- 添加 `docs/BLOG_OPS.md` 记录运营方向。
- 移除 Astro 构建时的 Google 字体实验配置，降低 Cloudflare/本地构建因外网字体请求失败的概率。

### 验证

- `pnpm run format:check`：通过。
- `pnpm run lint`：通过，包含 `astro check`，0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 25 个页面，Pagefind 索引 4 篇文章。
- 新增 `pnpm-workspace.yaml`，允许 `esbuild`、`sharp` 安装脚本，避免 pnpm 11 构建时报 `ERR_PNPM_IGNORED_BUILDS`。

### GitHub 推送权限处理

- 用户使用 Google 登录 GitHub，没有 GitHub 密码，这是正常情况。
- 已生成本仓库专用 SSH key，准备通过 GitHub Deploy key 授权写入。
- 本地 remote 已切换为 SSH：`git@github.com:PaceCN/astro-paper.git`。
- 待用户在 GitHub 仓库添加公钥并勾选写权限后，再执行 push。

### 推送

- 用户已在 GitHub 添加 Deploy key 并允许写入。
- 已成功推送到 GitHub：`ff585ac Initialize Chinese developer blog`。
- 推送后立即访问线上站点仍是旧版，判断 Cloudflare Pages 尚未完成或尚未触发最新部署，需要稍后复查部署结果。
