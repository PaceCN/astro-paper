---
author: wx
pubDatetime: 2026-05-08T06:05:00+08:00
title: Cloudflare Pages 部署 AstroPaper 的最小配置清单
slug: cloudflare-pages-astropaper
featured: true
draft: false
tags:
  - self-hosting
  - Cloudflare
  - AstroPaper
  - 部署
description: AstroPaper 部署到 Cloudflare Pages 时需要确认的构建命令、输出目录、Node 版本和站点 URL 配置。
---

这篇先记录本站当前用到的最小部署配置，后续遇到问题再补充。

## Cloudflare Pages 配置

```txt
Framework preset: Astro
Production branch: main
Build command: pnpm run build
Build output directory: dist
Root directory: /
```

建议环境变量：

```txt
NODE_VERSION = 22
```

## AstroPaper 站点 URL

`src/config.ts` 里必须改成线上地址：

```ts
website: "https://astro-paper-18u.pages.dev/";
```

这个值会影响：

- canonical URL
- sitemap
- RSS
- Open Graph 分享信息
- 搜索引擎识别站点主页

## 当前站点

- 线上地址：`https://astro-paper-18u.pages.dev/`
- GitHub 仓库：`https://github.com/PaceCN/astro-paper`

## 后续要补的内容

- 自定义域名绑定
- Search Console 提交 sitemap
- Cloudflare 构建失败排查
- Pagefind 搜索索引问题
- 中文动态 OG 图字体问题
