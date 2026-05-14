---
name: pace-notes-blog-automation
description: Run Pace Notes scheduled blog automation: morning GitHub/AI digest and afternoon CSDN technical-post digest with strict editorial gates.
---

# Pace Notes Blog Automation

Project root: `/home/pace/test-project-boke-google/astro-paper-main`.

This skill is for scheduled blog runs only. The user has authorized automatic publishing after strict self-review and validation; `main` supervises after runs by checking status, git history, and the published site.

## Hard rules

1. Work only inside the project root.
2. Never publish without self-review and validation.
3. Keep source links for every repo/news/CSDN item.
4. Prefer official or original sources; use secondary sources only as support.
5. Avoid gray/illegal items: leaked keys, piracy, credential abuse, open proxy dumps, exploit instructions, fake “free API” bypasses.
6. Keep posts concise, practical, and non-AI-sounding.
7. If uncertain, leave `draft: true`, write the blocker to `docs/AUTOMATION_STATUS.md`, and do not push.
8. Do not batch-edit old posts' `pubDatetime` or `modDatetime`.
9. Before commit/push, run:
   - `corepack pnpm run format:check`
   - `corepack pnpm run lint`
   - `corepack pnpm run build`
   - `corepack pnpm run validate:dates`

## Human-quality editorial gate

Read `docs/SEO_STYLE_GUIDE.md` before publishing. Its rules override templates below when wording conflicts.

Block publishing if any of these are true:

- Title or description sounds like an internal task: “整理/收集/综合 N 条/抓取时”.
- The first paragraph does not explain why a reader should care today.
- Article uses repetitive AI template phrasing.
- Article over-promises ranking, “free forever”, model capability, or business outcome.
- Source links are present but the article gives no original judgement.
- The article reads like a chat transcript, task log, or workflow report.

Rewrite rules:

- Use natural Chinese, short sentences, concrete nouns.
- Put the reader benefit and limitation first.
- Use dates for daily posts only when useful; keep the title meaningful without the date.
- `description` must be reader-facing, never a task description.

## Admin queue and API

If `PACE_NOTES_ADMIN_URL` and `PACE_NOTES_ADMIN_API_TOKEN` are available, check the manual publish queue before routine work:

```bash
corepack pnpm run admin:publish-requests
```

Treat queued `publish_requests` as user-requested work, but still apply all editorial and validation gates. Do not mark a request `published` until the article is actually pushed, the site build passes, and the admin post index is synced. Use `PATCH /api/admin/publish-requests` with the API token to update status when possible.

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

Stages: `start`, `collect`, `draft`, `self_review`, `validate`, `publish`, `done`.

## Morning workflow: 09:00 Asia/Shanghai

Create one post in `src/data/blog/ai-automation/`.

User-approved format: **GitHub fastest-rising AI projects top 5 + AI news top 3**.

### Title style

Use this style:

```md
title: 今天 GitHub 上涨最快的 5 个 AI 项目，以及 <主题> 的 3 个变化
slug: github-ai-daily-YYYY-MM-DD
```

Do not use generic titles like “GitHub每日热点与AI资讯速览”.

### Article structure

1. Opening paragraph: one human judgement explaining why today's list matters.
2. GitHub 5 projects. Each item must include:
   - repo name and URL;
   - what it does;
   - who should care;
   - why it is worth watching today;
   - risk/limitation.
3. AI news 3 items. Each item must include:
   - source link;
   - what happened;
   - impact on developers or everyday users;
   - what to watch next.
4. Closing paragraph: a short action suggestion for readers.

### Recommended sources

- GitHub Trending / GitHub search / repo README / release pages
- Hacker News / Product Hunt / Hugging Face / official vendor blogs
- Official sources first: OpenAI, Google AI, Anthropic, Meta AI, Microsoft, GitHub, Cloudflare, n8n, MCP.

### Frontmatter template

```md
---
author: wx
pubDatetime: YYYY-MM-DDT09:00:00+08:00
title: 今天 GitHub 上涨最快的 5 个 AI 项目，以及 <主题> 的 3 个变化
slug: github-ai-daily-YYYY-MM-DD
featured: false
draft: true
tags:
  - ai-automation
  - github每日热点
  - AI资讯
description: 一句话说明今天的 GitHub 项目和 AI 资讯对开发者有什么实际影响。
---
```

## Afternoon workflow: 16:00 Asia/Shanghai

Create one post in `src/data/blog/ai-automation/`.

New user requirement: **directly find popular/high-value technical posts on CSDN**. This replaces the old AI tools digest.

### Goal

Find about 5 recent CSDN technical posts worth reading, then write a curated technical digest for readers who want practical engineering ideas.

### Source strategy

Use CSDN search/rankings/hot pages/author pages when accessible. If needed, use search engine queries such as:

- `site:blog.csdn.net MCP Agent RAG Python 最近`
- `site:blog.csdn.net Cloudflare Workers D1 Astro`
- `site:blog.csdn.net n8n Docker 自托管`
- `site:blog.csdn.net AI Agent 工程化`

### Selection criteria

Choose posts that are:

- technically practical;
- not obvious copy-paste SEO spam;
- relevant to AI, Agent, MCP, RAG, Python, Cloudflare, self-hosting, operations, backend/frontend engineering;
- clear enough to summarize with attribution.

Each selected post must include original link and author if available.

### Title style

```md
title: 今天 CSDN 上值得看的 5 篇技术实践：<主题摘要>
slug: csdn-tech-daily-YYYY-MM-DD
```

### Article structure

1. Opening paragraph: what technical directions stood out today.
2. Five CSDN posts. Each item must include:
   - original title and link;
   - author if available;
   - what problem it solves;
   - who should read it;
   - what Pace Notes would borrow from it;
   - caveat or missing part.
3. Closing paragraph: common trend across the five posts.

### Frontmatter template

```md
---
author: wx
pubDatetime: YYYY-MM-DDT16:00:00+08:00
title: 今天 CSDN 上值得看的 5 篇技术实践：<主题摘要>
slug: csdn-tech-daily-YYYY-MM-DD
featured: false
draft: true
tags:
  - ai-automation
  - CSDN
  - 技术实践
description: 一句话说明今天这些 CSDN 技术帖共同指向的工程问题和读者可借鉴点。
---
```

## Cron payload note

The 16:00 Asia/Shanghai scheduled job should now ask for the CSDN technical-post workflow, not the old ordinary-user AI tools digest. If the external cron payload still mentions AI tools, update that payload separately before the next afternoon run.

## Review and publish gate

1. Self-review first:
   - remove hype and AI-ish phrasing;
   - remove unsupported claims;
   - check duplicated items;
   - ensure each item has a source URL;
   - keep `draft: true` until validation passes.
2. Validate with all required commands.
3. Publish on successful self-review + validation:
   - set `draft: false`;
   - commit with message `Publish daily digest YYYY-MM-DD morning|afternoon`;
   - `git push origin main`.
4. After a successful push, sync the remote admin index when credentials are available:
   - set `PACE_NOTES_ADMIN_URL` to the deployed site origin, for example `https://astro-paper-18u.pages.dev`;
   - set `PACE_NOTES_ADMIN_PASSWORD` from the private admin password;
   - run `corepack pnpm run sync:posts-index`.
5. Record the final outcome in `docs/AUTOMATION_STATUS.md`; if admin sync fails, keep the article published but write the sync blocker clearly.
6. Main-agent supervision is post-run: main checks `docs/AUTOMATION_STATUS.md`, git history, site output, and admin index freshness.

## Test mode

For test runs, create draft under `src/data/blog/ai-automation/test-*.md`, keep `draft: true`, do not publish, do not push unless only docs/SOP changed outside the test draft. Test mode still runs format/lint/build/date validation.
