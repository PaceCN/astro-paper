---
author: wx
pubDatetime: 2026-05-08T06:05:00+08:00
modDatetime: 2026-05-10T16:55:00+08:00
title: AstroPaper 部署到 Cloudflare Pages：最小配置和几个坑
slug: cloudflare-pages-astropaper
featured: true
draft: false
tags:
  - self-hosting
  - Cloudflare
  - AstroPaper
  - 部署
description: AstroPaper 上 Cloudflare Pages 不复杂，先确认构建命令、输出目录、Node 版本、站点 URL 和中文 OG 字体，很多问题就能提前避开。
---

AstroPaper 部署到 Cloudflare Pages，本身不算难。真正容易出问题的地方，通常是几个很小的配置：构建命令、输出目录、Node 版本、站点 URL，还有中文字体。

这篇先记录本站当前能正常构建的一套最小配置。后面如果换自定义域名、接 Search Console、或者 Pagefind 搜索出问题，再继续补。

## Cloudflare Pages 怎么填

Cloudflare Pages 项目里可以先这样配：

```txt
Framework preset: Astro
Production branch: main
Build command: pnpm run build
Build output directory: dist
Root directory: /
```

如果项目根目录就是 AstroPaper 根目录，`Root directory` 保持 `/` 就行。如果你把博客放在 monorepo 的子目录里，这里才需要改成子目录路径。

## Node 版本建议固定

建议在 Cloudflare Pages 环境变量里加：

```txt
NODE_VERSION = 22
```

原因很简单：不要让云端构建环境自己猜版本。Astro、Sharp、Pagefind、pnpm 这些工具对 Node 和安装脚本都有要求。版本固定以后，本地和 Cloudflare 的差异会少很多。

本站目前本地使用 pnpm 构建，命令是：

```bash
corepack pnpm run build
```

`package.json` 里的构建脚本会先跑 Astro 检查，再构建页面，最后生成 Pagefind 搜索索引：

```json
"build": "astro check && astro build && pagefind --site dist && cp -r dist/pagefind public/"
```

## 站点 URL 一定要改

`src/config.ts` 里的 `website` 要改成线上地址：

```ts
website: "https://astro-paper-18u.pages.dev/";
```

这个值不只是展示用，它会影响：

- canonical URL
- sitemap
- RSS
- Open Graph 分享信息
- 搜索引擎识别站点主页

如果这里还是模板默认地址，页面能打开，但搜索和分享信息会变得很乱。

## 中文 OG 图字体别依赖远程请求

AstroPaper 会生成文章 OG 图。英文站点通常没什么问题，但中文站点要注意字体。

如果构建过程去请求 Google Fonts，Cloudflare 或本地网络一慢，构建就可能卡住。本站已经改成优先使用本机 Noto Sans CJK / fallback 字体，减少构建阶段对远程字体的依赖。

如果你也遇到 OG 图构建慢、超时、中文变方块，可以先检查这几个点：

1. OG 图生成代码是不是请求了远程字体
2. 构建环境有没有可用的中文字体
3. 是否可以把字体放到项目里，或使用系统 fallback
4. Cloudflare 构建日志里有没有字体下载失败

## 当前站点信息

本站当前配置：

- 线上地址：`https://astro-paper-18u.pages.dev/`
- GitHub 仓库：`https://github.com/PaceCN/astro-paper`
- 生产分支：`main`
- 输出目录：`dist`

## 部署后要检查什么

第一次部署成功后，不要只看首页。至少检查这些页面：

- `/` 首页是否是新内容
- `/posts/` 文章列表是否正常
- `/rss.xml` 是否生成
- `/sitemap-index.xml` 是否生成
- `/search/` 搜索页是否能打开
- 一篇文章的 OG 图是否能访问

如果这些都正常，再去 Search Console 提交 sitemap 会稳一点。

## 后续还要补的内容

这篇只是最小部署清单。后面还需要单独写：

- 自定义域名绑定
- Google Search Console 提交 sitemap
- Cloudflare Pages 构建失败排查
- Pagefind 中文搜索索引问题
- 中文动态 OG 图字体问题

先把基础配置固定住，后面排错会轻松很多。
