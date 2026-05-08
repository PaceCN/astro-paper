---
name: pace-notes-blog-automation
description: Run Pace Notes scheduled blog automation: collect GitHub/AI hotspots, create draft posts, self-review, request main-agent review, then publish by commit/push only after approval.
---

# Pace Notes Blog Automation

Project root: `/home/pace/test-project-boke-google/astro-paper-main`.

This skill is for scheduled blog runs only. It must keep long research/writing work inside an isolated `blog-agent` run, then request a separate `main` subagent review before publishing.

## Hard rules

1. Work only inside the project root.
2. Never publish without review approval.
3. Keep source links for every news/tool item.
4. Cross-check important claims with at least two sources when possible.
5. Avoid gray/illegal items: leaked keys, piracy, credential abuse, open proxy dumps, exploit instructions.
6. Keep posts concise, practical, and non-AI-sounding.
7. If uncertain, leave `draft: true`, write the blocker to `docs/AUTOMATION_STATUS.md`, and do not push.
8. Before commit/push, run:
   - `corepack pnpm run format:check`
   - `corepack pnpm run lint`
   - `corepack pnpm run build`

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
description: 简短描述，说明包含 GitHub 升星最快项目与 AI 最新资讯。
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
description: 简短描述，说明包含生图、生视频、免费模型调用等普通人可直接尝试的工具和方法。
---
```

## Review and publish gate

1. Self-review first:
   - remove hype and AI-ish phrasing;
   - remove unsupported claims;
   - check duplicated items;
   - ensure each item has a source URL;
   - keep `draft: true`.
2. Request main-agent review with `sessions_spawn`:
   - `agentId: "main"`
   - `cwd: project root`
   - isolated context
   - ask reviewer to inspect the draft and source list only.
   - reviewer must reply exactly one of:
     - `APPROVED: <short reason>`
     - `CHANGES_REQUIRED: <short list>`
3. Publish only on `APPROVED`:
   - set `draft: false`;
   - run validation commands;
   - commit with message `Publish daily AI digest YYYY-MM-DD morning|afternoon`;
   - `git push origin main`.
4. If review asks changes, revise once and request review once more. If still not approved, leave draft and stop.

## Test mode

For test runs, create draft under `src/data/blog/ai-automation/test-*.md`, keep `draft: true`, do not publish, do not push unless only docs/SOP changed outside the test draft. Test mode still runs format/lint/build.
