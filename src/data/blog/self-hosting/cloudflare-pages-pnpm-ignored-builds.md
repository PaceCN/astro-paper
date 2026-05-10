---
author: wx
pubDatetime: 2026-05-10T21:30:00+08:00
title: Cloudflare Pages 构建 Astro 失败：pnpm ignored builds 怎么处理
slug: cloudflare-pages-pnpm-ignored-builds
featured: true
draft: false
tags:
  - self-hosting
  - Cloudflare
  - AstroPaper
  - pnpm
  - 部署
description: Astro 或 AstroPaper 在 Cloudflare Pages 上构建失败时，如果日志里出现 pnpm ignored builds，通常要显式允许 sharp、esbuild 这类依赖执行安装脚本。
---

AstroPaper 部署到 Cloudflare Pages 时，最烦人的错误不一定来自 Astro 本身。

有时本地能 build，Cloudflare 上却挂在依赖安装或图片处理阶段。日志里可能出现 `ignored builds`、`approve-builds`、`sharp`、`esbuild` 这些词。这个问题看起来像“Cloudflare 抽风”，其实多数时候是 pnpm 在保护你：它默认不让依赖随便跑安装脚本。

这篇只讲一个具体难点：Cloudflare Pages + pnpm + Astro/AstroPaper 项目里，遇到 ignored builds 怎么排查和修。

## 先看构建日志里的报错词

如果 Cloudflare Pages 构建失败，先不要急着改 Astro 配置。打开构建日志，搜这些词：

```txt
ignored builds
approve-builds
allowBuilds
sharp
esbuild
postinstall
```

如果出现 `sharp` 或 `esbuild` 相关安装脚本被跳过，后面很可能会连带出现图片处理、Vite 打包、原生模块加载失败等问题。

本站就用到了这两个包：

- `sharp`：图片处理，Astro 和 OG 图相关流程经常会用到
- `esbuild`：Vite / Astro 构建链路里的底层打包工具

它们不是普通纯 JS 包，安装时可能需要准备平台相关的二进制文件。所以 pnpm 把安装脚本拦住以后，构建环境就可能不完整。

## pnpm 为什么会拦这些脚本

pnpm 10 之后增加了更严格的依赖构建脚本控制。官方 `pnpm approve-builds` 文档说得很直接：这个命令用于批准依赖在安装期间运行脚本，被批准的依赖会写入 `pnpm-workspace.yaml` 的 `allowBuilds` map，值为 `true`；不批准的会写成 `false`。

pnpm settings 文档里也写到：没有列在 `allowBuilds` 里的包默认不允许执行构建脚本。安装时如果发现还没处理的 ignored builds，会把它们加到 `pnpm-workspace.yaml`，让你手动决定是 `true` 还是 `false`。

这不是坏事。它是在防供应链攻击。

问题是：Cloudflare Pages 构建时没有人坐在终端前帮你按交互式确认。如果项目没有把允许列表提交进仓库，云端就只能按默认规则处理。结果就是本地好好的，云端失败。

## 最小修法：提交 pnpm-workspace.yaml

对 AstroPaper 这类项目，如果确认 `sharp` 和 `esbuild` 是正常依赖，可以在项目根目录放一个 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

然后提交到 Git：

```bash
git add pnpm-workspace.yaml
git commit -m "Allow required pnpm build scripts"
git push origin main
```

Cloudflare Pages 下次构建时，就能按这个配置允许它们执行安装脚本。

本站当前就是这么处理的：

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

## 不要直接开全局放行

pnpm 还有一个更粗暴的配置，叫 `dangerouslyAllowAllBuilds`。从名字就能看出来，它不是常规推荐项。

如果只是 AstroPaper 这种静态博客，没必要允许所有依赖都跑安装脚本。更稳的方式是只允许你确认过的包：比如 `sharp`、`esbuild`。这样既能让构建过，又不会把供应链风险放大到整个依赖树。

我的建议是：

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

而不是：

```yaml
dangerouslyAllowAllBuilds: true
```

除非你真的知道项目里所有依赖的安装脚本都在做什么。

## Cloudflare Pages 里还要确认什么

ignored builds 修完以后，还要确认 Pages 项目里的几个基础配置。

对纯静态 AstroPaper 站点，可以先用这套：

```txt
Framework preset: Astro
Production branch: main
Build command: pnpm run build
Build output directory: dist
Root directory: /
```

环境变量建议固定 Node：

```txt
NODE_VERSION = 22
```

如果项目不是放在仓库根目录，`Root directory` 要改成实际子目录。否则 Cloudflare 会在错误目录里找 `package.json`，后面的报错会非常绕。

## 静态站点和 SSR 站点别混了

Astro 部署到 Cloudflare 有两条路线：静态站点和按需渲染。

普通 AstroPaper 博客通常是静态站点，构建后把 `dist` 目录交给 Cloudflare Pages 就够了。Astro 官方 Cloudflare 文档里，静态部署的 wrangler 示例也是把 assets directory 指向 `./dist`。

如果你要做 SSR、Pages Functions、Cloudflare bindings 之类的动态能力，才需要走 `@astrojs/cloudflare` adapter。Cloudflare 的 Astro 指南也说明，SSR 站点会渲染在 Pages Functions 上，并需要 Cloudflare adapter。

所以排查时先问自己一句：

```txt
这个博客真的需要 SSR 吗？
```

如果只是文章、标签、RSS、站内搜索，答案通常是不需要。不要为了修一个 pnpm 安装脚本问题，顺手把项目改成 SSR。那是另一个复杂度。

## 本地怎么复查

在本地先跑三步：

```bash
corepack pnpm install
corepack pnpm run lint
corepack pnpm run build
```

如果刚改过 `pnpm-workspace.yaml`，可以再检查一下 Git 状态：

```bash
git status --short
```

确认 `pnpm-workspace.yaml` 已经被提交。只在本地改了但没 push，Cloudflare 看不到。

## 仍然失败时怎么继续查

如果加了 `allowBuilds` 还是失败，按这个顺序查：

1. Cloudflare 构建日志里是否还出现 `ignored builds`
2. `pnpm-workspace.yaml` 是否真的在仓库根目录
3. Cloudflare Pages 的 Root directory 是否指向正确目录
4. Node 版本是否固定，是否和本地差太多
5. `pnpm-lock.yaml` 是否提交
6. 报错是否已经从安装阶段变成 Astro/Vite/Pagefind 阶段

最后一条最容易被忽略。错误阶段变了，说明原来的问题可能已经解决了。不要继续围着 `allowBuilds` 打转，要按新的错误继续查。

## 来源

- [pnpm approve-builds 文档](https://pnpm.io/cli/approve-builds)
- [pnpm settings：allowBuilds](https://pnpm.io/settings#allowbuilds)
- [Cloudflare Pages：Deploy an Astro site](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Astro 官方文档：Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)

## 小结

如果 AstroPaper 在 Cloudflare Pages 上构建失败，并且日志里出现 pnpm ignored builds，先别乱改框架配置。

最常见的修法是把需要执行安装脚本的依赖显式写进 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

这类问题不大，但很容易浪费时间。它不是 Astro 写错了，也不是 Cloudflare 一定有问题，而是 pnpm 的安全策略要求你把“允许哪些依赖跑脚本”写清楚。
