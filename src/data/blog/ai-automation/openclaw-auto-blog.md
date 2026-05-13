---
author: wx
pubDatetime: 2026-05-08T07:05:00+08:00
title: 我用 OpenClaw 自动改造并维护一个 AstroPaper 博客
featured: false
draft: true
tags:
  - ai-automation
  - OpenClaw
  - AstroPaper
  - MCP
  - 内容工作流
description: 记录一次用 OpenClaw 辅助改造 AstroPaper 中文博客的过程：从定位、改代码、写首批文章，到本地验证、GitHub 推送和后续半自动维护方案。
---

这篇先不写成“AI 全自动建站”的爽文。更准确地说：我用 OpenClaw 做了一次**可审查的半自动博客改造**。

结果是：一个默认 AstroPaper 主题，被改成了中文个人开发者博客 **Pace Notes**，定位为：

> 中文个人开发者的 AI 自动化、自托管运维与低成本独立博客实战手册。

过程中，Agent 负责读取项目、整理方向、改代码、写草稿、跑检查；人负责授权、判断方向、最终发布。

## 背景：为什么让 Agent 维护博客

技术博客的维护工作里，有很多事不难，但很碎：

- 查工具和文档有没有更新；
- 整理选题和关键词；
- 改 frontmatter、标签、描述；
- 检查链接、构建、格式；
- 把一次踩坑记录整理成文章；
- 定期复查旧文是否过期。

这些事很适合 Agent 做初稿和检查，但不适合完全自动发布。原因很简单：技术博客真正值钱的是可信度，不是更新频率。

## 这次实际改了什么

本次改造的项目是 AstroPaper。

已完成的主要步骤：

1. 读取项目结构、配置和已有文档。
2. 确定站点定位：AI 自动化、自托管运维、低成本独立博客。
3. 修改站点配置：标题、作者、语言、时区、站点 URL、编辑链接。
4. 将首页和 About 改成中文说明。
5. 清理默认示例文章。
6. 新增 4 篇首批中文文章：
   - 这个博客接下来会写什么
   - Cloudflare Pages 部署 AstroPaper 的最小配置清单
   - 为什么博客维护适合交给 Agent，但不适合全自动发布
   - 让技术博客控制运维成本的现实路径
7. 添加 `docs/PROJECT_LOG.md` 和 `docs/BLOG_OPS.md`，记录运营方向与改造过程。
8. 降低构建风险：移除 Astro 构建阶段容易受网络影响的 Google 字体实验配置。
9. 新增 `pnpm-workspace.yaml`，允许必要构建脚本，避免 pnpm 构建报错。
10. 本地验证通过后，推送到 GitHub，并等待 Cloudflare Pages 部署。

这里最重要的不是“AI 写了几篇文章”，而是把站点变成了一个可持续维护的内容系统。

## 我的工作流

这次流程大致是这样：

```txt
人给目标
  ↓
OpenClaw 读取项目与现状
  ↓
整理博客定位和栏目
  ↓
修改 AstroPaper 配置与页面
  ↓
生成首批中文文章
  ↓
运行 format / lint / build
  ↓
人授权 GitHub key / push
  ↓
记录项目日志与后续选题
```

Agent 的价值在于把很多“小但连续”的动作串起来：看文件、改文件、写文章、跑命令、修错误、再验证。

但每一步都应该留下痕迹。比如本项目把关键决策写进了 `docs/PROJECT_LOG.md`，把运营原则写进了 `docs/BLOG_OPS.md`。

## 为什么不让 Agent 直接全自动发布

我更推荐这个边界：

- Agent 可以研究；
- Agent 可以写草稿；
- Agent 可以改代码；
- Agent 可以跑检查；
- Agent 可以提交 PR 或准备 commit；
- 但发布前必须有人审。

原因有三个。

第一，AI 容易把“看起来合理”的步骤写成事实。技术文章如果没有实测，很快会损失信任。

第二，工具版本变化太快。比如 n8n、Cloudflare Agents、MCP 相关文档在 2026 年仍然高频更新，文章里写死“最新版本”很容易过期。

第三，博客可能涉及外部服务、密钥、支付、联盟链接和生产环境。自动发布一旦写错，成本比手工审核高。

所以本站的原则是：**草稿自动化，发布人工化。**

## 近期技术趋势给这个博客的启发

这次顺手做了一轮 live web 研究，几个方向值得持续写。

### 1. MCP 正在变成 Agent 接工具的通用层

MCP 官方把它定义为连接 AI 应用与外部系统的开源标准，类似“AI 应用的 USB-C”。官方文档也列出了 Claude、ChatGPT、VS Code、Cursor 等生态支持。

可复查来源：

- https://modelcontextprotocol.io/introduction
- https://modelcontextprotocol.io/clients

这意味着后续很多文章可以不只写“某个聊天机器人怎么用工具”，而是写：如何设计一个可靠、权限窄、可评估的 MCP 工具。

### 2. n8n 正在从 workflow 工具走向 AI workflow 平台

n8n Advanced AI 文档覆盖了 AI workflow、Self-hosted AI Starter Kit、LangChain、Chat Trigger、chatbot widget 等能力。n8n 也提供 instance-level MCP，让 MCP 客户端连接到 n8n 实例，搜索、触发、测试开放的 workflow。

可复查来源：

- https://docs.n8n.io/advanced-ai/
- https://docs.n8n.io/advanced-ai/mcp/accessing-n8n-mcp-server/index.md
- https://docs.n8n.io/advanced-ai/evaluations/overview/index.md

这里尤其要注意权限：n8n 文档说明默认不会暴露所有 workflow，需要逐个启用；但启用后的 workflow 并不是按每个 MCP client 单独隔离。

### 3. Cloudflare Agents 更适合“部署到边缘的有状态 Agent”

Cloudflare Agents SDK 文档把 Agent 建在 Durable Objects 上，强调持久状态、SQL、WebSocket、任务调度、工具调用、MCP、浏览器、语音和工作流。

可复查来源：

- https://developers.cloudflare.com/agents/
- https://developers.cloudflare.com/agents/model-context-protocol/
- https://developers.cloudflare.com/agents/api-reference/mcp-agent-api/
- https://developers.cloudflare.com/agents/api-reference/schedule-tasks/

这和 OpenClaw 的定位不一样。Cloudflare 更像是把 Agent 服务部署到公网边缘；OpenClaw 更像是个人自托管 gateway，把聊天入口、本地工具、代码项目和人工审批串起来。

### 4. OpenClaw 适合做个人工作台，而不是只做一次性脚本

OpenClaw 文档把它定义为自托管 gateway：连接 Discord、Slack、Telegram、WhatsApp、WebChat 等渠道到 AI coding agents，并支持 sessions、memory、tools、multi-agent routing、TaskFlow、background tasks。

可复查来源：

- https://docs.openclaw.ai/
- https://docs.openclaw.ai/automation/taskflow.md
- https://docs.openclaw.ai/automation/tasks.md
- https://docs.openclaw.ai/concepts/multi-agent.md

这类工具最适合长期维护型任务，比如博客：每周研究选题、生成草稿、检查旧文、跑构建、等待人工确认。

## 后续我会怎么维护这个博客

我会把博客维护拆成几类任务。

### 每周任务

- 收集 AI 自动化、MCP、n8n、Cloudflare、自托管相关新闻；
- 生成 3-5 个候选选题；
- 标记每个选题的关键词、目标读者、可验证步骤；
- 只创建 `draft: true` 草稿。

### 每篇文章发布前

- 链接重新打开一次；
- 版本号确认一次；
- 关键命令跑一次；
- `pnpm run format:check`；
- `pnpm run lint`；
- `pnpm run build`；
- 人工审稿后再把 `draft` 改成 `false`。

### 每月任务

- 复查旧文是否过期；
- 检查 Cloudflare Pages 构建是否正常；
- 检查 Search Console、sitemap、RSS；
- 把踩坑补到旧文，而不是只发新文。

## 可以复用的目录结构

我现在倾向于这样组织：

```txt
docs/
  PROJECT_LOG.md       # 项目改造与部署记录
  BLOG_OPS.md          # 博客定位、栏目、发文原则
  CONTENT_INBOX.md     # 选题、来源、待验证清单

src/data/blog/
  ai-automation/       # OpenClaw、MCP、n8n、Agent 工作流
  self-hosting/        # Cloudflare、VPS、Docker、备份
  astro-blog/          # AstroPaper、SEO、独立博客建设
  income-log/          # 成本、变现、复盘
```

`docs/` 不是给读者看的正式文章，而是给未来的自己和 Agent 看的上下文。

## 小结

这次改造让我更确定一件事：个人博客并不需要“全自动内容农场”，但很需要一个可靠的 Agent 助手。

合理边界是：

```txt
Agent 负责重复劳动和初稿
人负责判断、验证和发布
```

如果后续这个博客能稳定更新，不是因为 AI 替我思考，而是因为它帮我把很多容易拖延的小环节串了起来。

这才是我认为 Agent 最实用的地方。

## 参考来源

- MCP introduction：https://modelcontextprotocol.io/introduction
- MCP clients：https://modelcontextprotocol.io/clients
- VS Code MCP servers：https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- GitHub MCP Server：https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server
- n8n Advanced AI：https://docs.n8n.io/advanced-ai/
- n8n MCP server：https://docs.n8n.io/advanced-ai/mcp/accessing-n8n-mcp-server/index.md
- n8n evaluations：https://docs.n8n.io/advanced-ai/evaluations/overview/index.md
- Cloudflare Agents：https://developers.cloudflare.com/agents/
- Cloudflare MCP：https://developers.cloudflare.com/agents/model-context-protocol/
- Cloudflare McpAgent：https://developers.cloudflare.com/agents/api-reference/mcp-agent-api/
- OpenClaw docs：https://docs.openclaw.ai/
- OpenClaw TaskFlow：https://docs.openclaw.ai/automation/taskflow.md
