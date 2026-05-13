---
author: wx
pubDatetime: 2026-05-13T16:00:00+08:00
title: 今天这 5 个 AI 工具值得试：手机生图、视频打样和低成本 API
slug: ai-tools-daily-2026-05-13
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 想把 AI 真正放进日常流程，今天可以从 Firefly 手机创作、Runway 视频打样、Workers AI、Comet 浏览器和 n8n 模板开始，小步试用更稳。
---

今天这几类工具更适合“先用起来”，而不是只收藏。手机端生图能解决临时素材，视频工具适合做几秒钟样片，低成本 API 可以给自己的小工具接模型，浏览器助手和工作流模板则更像把重复动作少做几遍。我的建议是：先拿一个真实任务试 30 分钟，能省下第二次重复操作，再考虑付费或迁移流程。

## 1. Adobe Firefly 手机 App：在路上先把海报和短素材做出来

- 名称：Adobe Firefly mobile app
- URL：https://www.adobe.com/products/firefly/app.html
- 它做什么：Firefly 手机 App 已支持 iOS 和 Android，主打在手机上生成图片和视频，也能把手机里的照片继续改成视频、背景图、社媒素材。Adobe 博客提到，Firefly 移动端可以用 Adobe 自家模型，也可以选择 OpenAI、Google 等合作方模型，生成结果会同步到 Creative Cloud，方便回到网页端或 Photoshop、Premiere、Lightroom 继续处理。
- 为什么有用：普通用户最常见的场景不是“做一张艺术大作”，而是临时缺一张活动海报图、公众号配图、短视频封面或 b-roll 背景。Firefly 的优势是和 Adobe 生态接得深，手机上先出草图，后面再进桌面软件精修。
- 成本 / 门槛：Firefly 使用生成式积分。Adobe 帮助页说明，Creative Cloud 订阅通常包含每月一定额度的 generative credits，不同计划额度不同；图片、视频、音频等生成都会消耗积分，积分不会无限滚动。免费或低配账号适合试功能，不适合连续生产大量素材。
- 注意点：不要把客户未公开产品、合同截图、身份证件等敏感内容当素材上传。需要商用时，还要单独确认所用模型、订阅计划和素材来源的授权边界。

来源：

- [Adobe Firefly mobile app](https://www.adobe.com/products/firefly/app.html)
- [Adobe Blog：Firefly on your Phone](https://blog.adobe.com/en/publish/2025/06/17/firefly-on-your-phone)
- [Adobe Generative credits FAQ](https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html)

## 2. Runway：用少量免费额度测试 AI 视频镜头

- 名称：Runway
- URL：https://runwayml.com/product
- 它做什么：Runway 把图片、视频、音频、编辑和语言模型放在一个创作工作台里。官方产品页列出 Gen-4.5、Seedance 2.0、Kling 3.0、Veo 3.1、Sora 2 Pro、FLUX.2 等模型入口，也有故事板、虚拟置景、角色表演、视觉特效和节点式 Workflows。
- 为什么有用：如果你要做短视频开场、产品演示氛围镜头、课程宣传片或电商动图，Runway 适合先验证镜头方向。它不是替代剪辑软件，而是帮你快速判断“这个画面值得继续做吗”。
- 成本 / 门槛：截至 2026-05-13，Runway 价格页显示 Free 计划为 0 美元，包含一次性 125 credits，约等于 25 秒 Gen-4 Turbo 或 Gen-3 Alpha Turbo；Standard 计划年付折算 12 美元 / 月，包含每月 625 credits，并开放更多视频模型、去水印和 Workflows。
- 注意点：免费额度很快会用完，而且 Free 计划没有完整的高级视频模型和导出权益。正式发布前要逐帧看手部、文字、Logo、人物一致性和版权风险，不要把第一次生成当终稿。

来源：

- [Runway 产品页](https://runwayml.com/product)
- [Runway Pricing](https://runwayml.com/pricing)

## 3. Cloudflare Workers AI：给小工具接一个低成本模型入口

- 名称：Cloudflare Workers AI
- URL：https://developers.cloudflare.com/workers-ai/
- 它做什么：Workers AI 让你在 Cloudflare 的全球网络上调用开源模型，可以从 Workers、Pages 或 Cloudflare API 运行文本生成、图片分类、目标检测等任务。官方文档写到，它提供 50 多个开源模型，并和 AI Gateway、Vectorize、Workers、Pages 等产品放在同一套开发平台里。
- 为什么有用：如果你已经有一个简单网页、表单或内部小工具，Workers AI 的吸引力在于“部署和调用在一个地方”。例如：把用户留言自动分类、给商品标题做改写、给文章生成摘要、给客服 FAQ 做路由。对个人开发者和小团队来说，这比一开始租 GPU 或维护模型服务轻很多。
- 成本 / 门槛：Cloudflare 价格页写明，Workers AI 在 Free 和 Paid Workers 计划中都可用，每天有 10,000 Neurons 免费额度；超过后，Paid 计划按 0.011 美元 / 1,000 Neurons 计费。不同模型会消耗不同 Neurons，页面也给出了按 token 折算的模型价格。
- 注意点：它更适合轻量 AI 功能，不是“无限免费 API”。要给项目设置调用频率、失败兜底和日志脱敏；公开应用还要防刷，否则免费额度可能被很快打满。

来源：

- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

## 4. Perplexity Comet：把搜索、网页阅读和少量网页操作放在同一个浏览器里

- 名称：Perplexity Comet
- URL：https://www.perplexity.ai/comet
- 它做什么：Comet 是 Perplexity 的 AI 浏览器，核心是浏览器旁边常驻一个助手。官方搜索结果和资源页说明，它可以帮你研究网页、总结内容、翻译、引用当前标签页，也可以在明确授权下处理部分浏览器操作。TechCrunch 报道称，Comet 已面向全球用户免费开放，免费用户主要使用侧边栏助手，部分更强的后台助手、邮件助手等能力留给付费用户。
- 为什么有用：它适合做“边看边问”的工作：读长文、比价、查旅行资料、整理多个网页结论、把一堆标签页归纳成清单。对不想在浏览器和聊天窗口之间反复复制粘贴的人，Comet 会更顺手。
- 成本 / 门槛：基础浏览器可免费下载使用；TechCrunch 提到，Pro / Max 等付费用户会获得更强模型、文件分析、图像和视频生成、邮件助手或后台助手等扩展能力。不同地区和账号的可用功能可能会变。
- 注意点：浏览器助手一旦接触邮箱、购物、表单和登录网站，权限风险就比普通聊天机器人高。涉及付款、发邮件、提交表单前，最好让它停在确认页，由你自己检查并点击最后一步。

来源：

- [Perplexity Comet](https://www.perplexity.ai/comet)
- [Comet Quick Start Guide](https://www.perplexity.ai/comet/resources/articles/comet-quick-start-guide)
- [TechCrunch：Perplexity’s Comet AI browser now free](https://techcrunch.com/2025/10/02/perplexitys-comet-ai-browser-now-free-max-users-get-new-background-assistant/)

## 5. n8n AI 工作流模板：从现成流程开始做自动化

- 名称：n8n AI workflow templates
- URL：https://n8n.io/workflows/categories/ai/
- 它做什么：n8n 的 AI 模板库收录了大量社区工作流，覆盖邮件、Slack、表格、CRM、文档处理、AI Agent、内容生成和通知等场景。官方页面显示 AI 分类下已有数千个自动化模板；文档也说明，n8n 可以自托管，Community edition 不需要 license key。
- 为什么有用：很多人做自动化失败，不是因为模型不强，而是一开始就想从零搭完整系统。n8n 模板更适合先照着改：比如把表单内容发到邮箱、把客户问题分类进表格、把网页摘要发到 Slack、定时生成周报。先跑通一条小流程，再替换成自己的账号和提示词。
- 成本 / 门槛：自托管 Community edition 免费，但需要 Docker、服务器、备份和安全配置经验；n8n 文档也明确提醒，自托管更适合有技术经验的人，不熟悉服务器管理时建议用 n8n Cloud。模板本身不等于零成本，因为接入 OpenAI、Gemini、Slack、Gmail 等服务时仍可能产生对应费用。
- 注意点：导入模板前要先看节点连接了哪些外部服务、会读写哪些数据。涉及客户资料、财务表格或邮箱的流程，建议先用测试账号和假数据跑，确认权限和日志再接正式账号。

来源：

- [n8n AI workflow templates](https://n8n.io/workflows/categories/ai/)
- [n8n Hosting docs](https://docs.n8n.io/hosting/)

## 今天怎么选

- 想在手机上先出视觉素材：试 Firefly，但注意积分和素材授权。
- 想做几秒钟视频样片：试 Runway，把它当镜头草稿机更现实。
- 想给网页或脚本接模型：试 Workers AI，先从低频内部工具开始。
- 想减少复制粘贴和网页总结：试 Comet，关键操作别让它自动提交。
- 想把重复流程串起来：从 n8n 模板改，不要一上来自己搭大系统。

我会把今天这 5 个工具分成两类：Firefly 和 Runway 负责“内容先成形”；Workers AI、Comet 和 n8n 负责“流程少折腾”。如果一个工具只能让你新鲜一次，先别急着付费；如果它能连续三次帮你省下重复劳动，再把它放进固定工作流。
