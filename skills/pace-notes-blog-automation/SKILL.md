---
name: pace-notes-blog-automation
description: Run Pace Notes scheduled blog automation: collect GitHub/AI hotspots, create draft posts, self-review, request main-agent review, then publish by commit/push only after approval.
---

# Pace Notes Blog Automation

Project root: `/home/pace/test-project-boke-google/astro-paper-main`.

This skill is for scheduled blog runs only. Long research/writing work runs inside isolated `blog-agent` cron sessions so the main conversation remains responsive. The user has authorized automatic publishing after strict self-review and validation; `main` supervises after runs by checking status, git history, and the published site.

## Hard rules

1. Work only inside the project root.
2. Never publish without completing self-review and validation. User has pre-approved automatic publishing for scheduled daily digests.
3. Keep source links for every news/tool item.
4. Cross-check important claims with at least two sources when possible.
5. Avoid gray/illegal items: leaked keys, piracy, credential abuse, open proxy dumps, exploit instructions.
6. Keep posts concise, practical, and non-AI-sounding.
7. If uncertain, leave `draft: true`, write the blocker to `docs/AUTOMATION_STATUS.md`, and do not push.
8. Before commit/push, run:
   - `corepack pnpm run format:check`
   - `corepack pnpm run lint`
   - `corepack pnpm run build`


## Human-quality editorial gate

Read `docs/SEO_STYLE_GUIDE.md` before publishing. Its rules override the templates below when wording conflicts.


Before publishing, read the title, description, first 120 words, and post list preview as if you are a reader.

Block publishing if any of these are true:

- description sounds like an internal task: “整理/收集/综合 N 条/抓取时”.
- title is generic and not search/use-case oriented.
- first paragraph does not explain why the reader should care today.
- article uses repetitive AI template phrasing.
- article over-promises income, ranking, “free forever”, or model capability.
- source links are present but the article gives no original judgement.

Rewrite rules:

- Use natural Chinese, short sentences, concrete nouns.
- Put the reader benefit first.
- Use dates for daily posts only when useful; keep the title meaningful without the date.
- For daily AI tools, prefer: “今天这 5 个 AI 工具值得试：生图、短视频和免费模型 API”.
- For GitHub/news, prefer: “今天 GitHub 上涨最快的 5 个 AI 项目，以及 3 条值得跟进的 AI 变化”.
- `description` should be a reader-facing summary, never a task description.

## Status heartbeat

At each stage, update `docs/AUTOMATION_STATUS.md`:

```md
# 自动化运行状态

- lastRunType: morning|afternoon|test
- status: in_progress|reviewing|approved|published|blocked|failed
- stage: <short stage>
- updatedAt: <Asia/Shanghai ISO time>
- draftPath: <path or empty>
- notes: <one-line notes>
```

Stages: `start`, `collect`, `draft`, `self_review`, `main_review`, `validate`, `publish`, `done`.

## Morning workflow: 09:00 Asia/Shanghai

Create one post in `src/data/blog/ai-automation/`.

Required content:

1. GitHub fastest-rising projects: top 5.
   - Include repo, URL, stars/growth if available, one-line purpose, project type, tags.
   - Tag in article content: `github每日热点`.
2. AI latest/hottest news: top 3.
   - Include source link, what happened, why it matters, who should care.

Recommended sources:

- GitHub Trending / GitHub search / repo README / release pages
- Hacker News / Product Hunt / Hugging Face / official vendor blogs
- Official sources first: OpenAI, Google AI, Anthropic, Meta AI, Microsoft, GitHub, Cloudflare, n8n, MCP.

Frontmatter template:

```md
---
author: wx
pubDatetime: YYYY-MM-DDT09:00:00+08:00
title: YYYY-MM-DD GitHub每日热点与AI资讯速览
slug: github-ai-daily-YYYY-MM-DD
featured: false
draft: true
tags:
  - ai-automation
  - github每日热点
  - AI资讯
description: 面向读者的一句话摘要：今天 GitHub 哪些项目值得看，AI 领域哪几件事可能影响开发者；禁止写成“整理/速览/综合 N 条”。
---
```

## Afternoon workflow: 16:00 Asia/Shanghai

Create one post in `src/data/blog/ai-automation/`.

Required content: 5 items total about ordinary users can directly try:

- AI image generation
- AI video generation
- free or low-cost model API usage
- browser/app tools
- templates/workflows ordinary users can use

Each item: name, URL, what it does, why useful, caveat/cost/access.

Frontmatter template:

```md
---
author: wx
pubDatetime: YYYY-MM-DDT16:00:00+08:00
title: YYYY-MM-DD 普通人可用AI工具速览
slug: ai-tools-daily-YYYY-MM-DD
featured: false
draft: true
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 面向读者的一句话摘要：今天有哪些 AI 工具能直接上手，它们适合什么场景、有什么限制；禁止写成“整理/速览/综合 N 条”。
---
```

## Review and publish gate

1. Self-review first:
   - remove hype and AI-ish phrasing;
   - remove unsupported claims;
   - check duplicated items;
   - ensure each item has a source URL;
   - keep `draft: true` until validation passes.
2. Validate:
   - run format/lint/build commands listed above;
   - if any command fails, keep `draft: true`, write blocker to `docs/AUTOMATION_STATUS.md`, stop.
3. Publish on successful self-review + validation:
   - set `draft: false`;
   - commit with message `Publish daily AI digest YYYY-MM-DD morning|afternoon`;
   - `git push origin main`.
4. Main-agent supervision is post-run: main checks `docs/AUTOMATION_STATUS.md`, git history, and site output. Do not block on `sessions_spawn main`; isolated blog-agent jobs may not have permission to spawn main.

## Test mode

For test runs, create draft under `src/data/blog/ai-automation/test-*.md`, keep `draft: true`, do not publish, do not push unless only docs/SOP changed outside the test draft. Test mode still runs format/lint/build.
