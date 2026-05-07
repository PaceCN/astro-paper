# 内容研究收件箱

> 更新时间：2026-05-08 07:05 +08:00
>
> 范围：AI 自动化、AI Agent、MCP、n8n、OpenClaw/本地 Agent、Cloudflare/自托管。
>
> 说明：本文件只记录可复查线索与选题，不代表已完成实测；发布前需逐项验证。

## 近期可复查线索

| 方向 | 线索 | 来源 | 复查点 |
| --- | --- | --- | --- |
| MCP 标准化 | MCP 官方将其定义为连接 AI 应用与外部系统的开源标准，类比“AI 应用的 USB-C”；列举了 Claude、ChatGPT、VS Code、Cursor 等生态支持。 | https://modelcontextprotocol.io/introduction | 发布前确认客户端支持列表是否变化。 |
| MCP 客户端生态 | MCP 客户端页列出 Resources、Prompts、Tools、Discovery、Tasks、Apps、OAuth 等能力维度。 | https://modelcontextprotocol.io/clients | 不要泛称“全部客户端都支持所有能力”，需逐客户端确认。 |
| VS Code + MCP | VS Code 文档说明 MCP server 可为 Copilot Chat 提供文件、数据库、外部 API 等工具；还提到 MCP Apps 可在聊天中渲染交互 UI，Linux/macOS 本地 stdio MCP 可启用 sandbox。 | https://code.visualstudio.com/docs/copilot/customization/mcp-servers | 需要本地验证 mcp.json、trust prompt、sandbox 行为。 |
| GitHub MCP Server | GitHub 文档说明 GitHub MCP Server 可在 IDE 中操作仓库、Issue、PR；所有 GitHub 用户可用，但部分工具继承相应功能/订阅要求。 | https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server | 区分免费可用能力与 Copilot 付费能力。 |
| GitHub MCP 近期发布 | GitHub MCP Server releases 显示 v1.0.0（2026-04-16 左右页面记录）含 granular issue fields、MCP Apps feature flag；v1.0.2 修复 issue field mutation。 | https://github.com/github/github-mcp-server/releases | GitHub release 页面动态渲染，发布前复查版本号和日期。 |
| n8n 版本节奏 | n8n release notes 显示 release 频繁，页面抓取时写明 current stable: 2.19.4、current beta: 2.20.0，并列出 2026-05-07 的 2.20.4 bug fixes。 | https://docs.n8n.io/release-notes/index.md | 版本变化很快，文章中避免写死“最新版本”，只写“抓取时”。 |
| n8n Advanced AI | n8n Advanced AI 可在 Cloud 与自托管版使用（文档称 1.19.4+），覆盖 AI workflow、Starter Kit、LangChain、模板、Chat Trigger、chatbot widget。 | https://docs.n8n.io/advanced-ai/ | 需要确认自托管 starter kit 的实际 docker compose 配置。 |
| n8n MCP | n8n instance-level MCP 可让 Lovable/Claude Desktop 等客户端搜索、触发、测试已开放 workflow；默认不暴露全部 workflow，需逐个启用。 | https://docs.n8n.io/advanced-ai/mcp/accessing-n8n-mcp-server/index.md | 重点写权限边界：所有连接到该实例的 MCP client 可见启用的 workflows，不能按 client 细分。 |
| n8n AI Workflow Builder | AI Workflow Builder 支持用自然语言创建、细化、调试 workflow；文档说明会发送 prompt、node 定义、当前 workflow、mock execution data，不发送 credentials 与历史 executions。 | https://docs.n8n.io/advanced-ai/ai-workflow-builder/index.md | 写隐私段落时引用此边界，仍建议避免上传敏感 mock data。 |
| n8n evaluations | n8n 文档强调 AI workflow 需要 evaluation：小样本 light eval 用于上线前，大样本 metric-based eval 用于上线后回归。 | https://docs.n8n.io/advanced-ai/evaluations/overview/index.md | 可作为“Agent 自动化不能只靠感觉”的独立文章。 |
| Cloudflare Agents | Cloudflare Agents SDK 文档描述 stateful AI agents：基于 Durable Objects，内置 SQL、WebSocket、state sync、scheduling，可调用模型、工具、MCP、浏览器、语音、工作流、邮件。 | https://developers.cloudflare.com/agents/ | 适合写“边缘平台上的 Agent 与本地 Agent 的差异”。 |
| Cloudflare Remote MCP | Cloudflare 文档区分 remote MCP（Streamable HTTP + OAuth）与 local MCP（stdio），并建议少而精的工具、窄权限、清晰描述、evals。 | https://developers.cloudflare.com/agents/model-context-protocol/ | 可做 MCP tool 设计 checklist。 |
| Cloudflare McpAgent | Cloudflare McpAgent 让每个 MCP server instance 拥有 Durable Object 持久状态；`serve("/mcp")` 可部署 Streamable HTTP transport；支持 OAuth 与 jurisdiction。 | https://developers.cloudflare.com/agents/api-reference/mcp-agent-api/ | 如果写教程需实际部署一个最小 demo。 |
| Cloudflare scheduled tasks | Cloudflare Agents scheduling 支持 delayed、date、cron、interval；任务存入 SQLite，并由 Durable Object alarms 唤醒。 | https://developers.cloudflare.com/agents/api-reference/schedule-tasks/ | 适合对比 OpenClaw cron/taskflow 与 Cloudflare DO alarm。 |
| Cloudflare Agents releases | GitHub releases 抓取到 2026-05-01/02 附近的 patch/minor：sub-agent WebSocket 修复、workspace image/PDF reads、agent tool orchestration 等。 | https://github.com/cloudflare/agents/releases | GitHub releases 抓取内容可能重复，发布前复查具体 tag。 |
| OpenClaw 定位 | OpenClaw 文档定义为自托管 gateway，连接多种聊天渠道到 AI coding agents；支持 Web Control UI、mobile nodes、multi-agent routing、tools、sessions、memory。 | https://docs.openclaw.ai/ | 本站文章应基于本地实操，不把文档宣传语当实测结论。 |
| OpenClaw TaskFlow | TaskFlow 用于跨 gateway restart 的多步骤 durable flow，适合定时情报、子任务、等待、重试、审批。 | https://docs.openclaw.ai/automation/taskflow.md | 后续可验证“每周选题/草稿/检查”能否 TaskFlow 化。 |
| OpenClaw Background tasks | OpenClaw docs 说明 background tasks 是 detached work ledger，不是 scheduler；subagents、cron、CLI 操作会创建 task；completion 是 push-driven。 | https://docs.openclaw.ai/automation/tasks.md | 可用于解释为什么不要 busy-poll 子 Agent。 |
| OpenClaw multi-agent | OpenClaw multi-agent routing 支持多个隔离 agent，各自 workspace、agentDir、session history，并通过 bindings 绑定渠道账号。 | https://docs.openclaw.ai/concepts/multi-agent.md | 可写“博客内容 Agent 与运维 Agent 分离”。 |

## 已完成项目上下文：Pace Notes 改造

本项目已完成的“OpenClaw 自运行博客改造”过程，可作为案例文章素材：

1. 读取项目现状与 `docs/PROJECT_LOG.md`、`docs/BLOG_OPS.md`。
2. 将 AstroPaper 改造成中文站点：标题 `Pace Notes`，定位为“中文个人开发者的 AI 自动化、自托管运维与低成本独立博客实战手册”。
3. 调整首页、About、站点配置、作者、语言、时区、编辑链接。
4. 清理默认示例文章，新增 4 篇中文首批文章。
5. 处理 Cloudflare Pages 构建风险：移除 Google 字体实验配置，新增 `pnpm-workspace.yaml` 允许必要构建脚本。
6. 本地验证通过：format check、lint/astro check、build。
7. 绑定 GitHub 远程，使用仓库专用 SSH deploy key，成功推送 `ff585ac Initialize Chinese developer blog`。
8. 原则：Agent 可做研究、草稿、检查、PR，不直接发布生产内容。

## 后续可写选题

### 1. OpenClaw 自动维护 AstroPaper 博客的最小闭环

- 关键词：OpenClaw AstroPaper 自动化博客 AI Agent 内容工作流
- 目标读者：想把个人博客维护半自动化的开发者
- 文章角度：以本站改造为案例，拆成“研究 → 改代码 → 写文章 → 验证 → 人审发布”。
- 需要验证：重新跑一次 `pnpm run format:check`、`pnpm run lint`、`pnpm run build`；确认 Cloudflare Pages 最新部署。

### 2. 为什么 MCP 工具越少越可靠

- 关键词：MCP tool design permissions evals agent reliability
- 目标读者：准备给 Agent 接入内部工具的开发者
- 文章角度：引用 Cloudflare MCP best practices，讲“少而精、窄权限、描述清楚、加 eval”。
- 需要验证：实现一个只读工具与一个写入工具，对比误调用风险。

### 3. n8n instance-level MCP 适合开放哪些 workflow

- 关键词：n8n MCP workflow automation self-hosted OAuth access token
- 目标读者：自托管 n8n 用户、小团队自动化负责人
- 文章角度：强调默认不暴露 workflow、逐个启用、client 级别隔离不足、描述要写清楚。
- 需要验证：部署 n8n 2.x，自测 OAuth/Access Token 两种连接方式。

### 4. n8n AI Workflow Builder 的隐私边界

- 关键词：n8n AI Workflow Builder privacy credentials mock data
- 目标读者：想用自然语言生成 n8n workflow 但担心数据外发的人
- 文章角度：基于官方文档列出会发送/不会发送的数据，再给脱敏建议。
- 需要验证：在测试实例里构建 workflow，记录实际 UI 提示和 credit 消耗。

### 5. Cloudflare Agents 与本地 OpenClaw 的分工

- 关键词：Cloudflare Agents OpenClaw Durable Objects local agent gateway
- 目标读者：在“边缘部署 Agent”与“本地自托管助手”之间犹豫的开发者
- 文章角度：Cloudflare 适合对外 API、WebSocket、remote MCP；OpenClaw 适合本地文件、聊天入口、人工审批。
- 需要验证：部署一个 Cloudflare Agents starter；对比本地 OpenClaw 完成同一提醒/草稿任务。

### 6. 用 eval 管理 AI 自动化，而不是只看一次成功

- 关键词：AI workflow evaluation n8n light eval metric eval regression
- 目标读者：把 AI workflow 用到生产前的小团队
- 文章角度：从 n8n evaluations 文档切入，设计 10 条测试样本和回归清单。
- 需要验证：为一个内容摘要 workflow 建立 light eval 数据集并记录失败案例。

### 7. GitHub MCP Server 能替代多少手工仓库操作

- 关键词：GitHub MCP Server Copilot Issues Pull Requests IDE
- 目标读者：日常在 VS Code/Copilot 中处理 GitHub 项目的开发者
- 文章角度：从查 issue、列 PR、创建 issue、读取 repo 信息开始，明确哪些功能需额外权限/订阅。
- 需要验证：在测试仓库中执行只读与写入操作，记录权限弹窗与回滚方式。

### 8. VS Code MCP sandbox：本地工具接入的安全底线

- 关键词：VS Code MCP sandbox stdio Linux macOS file network allowlist
- 目标读者：给本地 IDE 安装 MCP server 的开发者
- 文章角度：解释 trust prompt、sandboxEnabled、文件/网络 allowlist，避免随便运行 npm MCP 包。
- 需要验证：在 Linux 环境启用 sandbox，测试文件写入和网络访问限制。

### 9. Cloudflare Remote MCP Server 最小部署教程

- 关键词：Cloudflare remote MCP Streamable HTTP OAuth McpAgent Workers
- 目标读者：想把自己服务暴露给 ChatGPT/Claude/IDE Agent 的开发者
- 文章角度：从 15 行 McpAgent demo 到 OAuth 与权限边界，先做只读工具。
- 需要验证：实际 `wrangler deploy`，用 MCP client 连通，截图/记录日志。

### 10. 技术博客的 Agent 审稿清单

- 关键词：AI blog workflow SEO fact check link check AstroPaper draft
- 目标读者：用 AI 写技术博客但不想变水文的站长
- 文章角度：把本站原则模板化：来源、可复现、版本、成本、风险、draft、人审。
- 需要验证：对一篇草稿跑清单，记录修正前后差异。

### 11. 自托管 Agent 的权限分层：研究 Agent、写作 Agent、发布 Agent

- 关键词：OpenClaw multi-agent routing workspace isolation approvals
- 目标读者：想长期运行多个个人 Agent 的开发者
- 文章角度：用 OpenClaw multi-agent 概念拆分职责，发布 Agent 默认不自动推送。
- 需要验证：创建隔离 workspace 的测试 agent，确认 session/history/auth 不串用。

### 12. Cloudflare Pages + AstroPaper 的内容发布流水线

- 关键词：Cloudflare Pages AstroPaper GitHub Actions pnpm build Pagefind SEO
- 目标读者：想低成本搭中文技术博客的人
- 文章角度：从本站部署记录扩展为完整发布流程：本地校验、GitHub、Pages、sitemap、Search Console。
- 需要验证：绑定自定义域名、提交 sitemap、确认 Pagefind 中文索引。

## 发布前通用检查清单

- [ ] 所有外部链接重新打开一次，确认未失效。
- [ ] 版本号只写“抓取时”，避免声称永久最新。
- [ ] 涉及 Cloud/GitHub/n8n 权限的内容先在测试账号验证。
- [ ] 技术步骤至少跑通一次，并记录命令、错误与修复。
- [ ] 文章 frontmatter 保持 `draft: true`，人工审核后再改。
- [ ] 如果使用联盟/赞助链接，必须明确披露。
