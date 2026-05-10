---
author: wx
pubDatetime: 2026-05-09T16:00:00+08:00
modDatetime: 2026-05-10T16:55:00+08:00
title: 今天这 5 个 AI 工具值得试：做图、短视频、免费模型 API
slug: ai-tools-daily-2026-05-09
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 这 5 个工具适合今天就动手试：用 ChatGPT 或 Firefly 做图，用 Runway 做短视频，用低成本 API 和自动化工具搭小流程。
---

今天这几个工具，适合先做一个能看的小样。别一上来就追最贵的模型。做图、做短视频、接模型 API、让自动化工具跑点重复流程，都已经有普通用户能直接试的入口。我主要看三件事：能不能上手，成本说不说得清楚，有没有明显边界。

## 1. ChatGPT 图片生成：适合改图、做封面草稿和带文字的视觉稿

- 名称：ChatGPT / GPT-4o image generation
- URL：https://openai.com/index/introducing-4o-image-generation/
- 它做什么：在 ChatGPT 里用自然语言生成或修改图片。OpenAI 介绍里强调，它能利用聊天上下文和上传图片，生成更稳定的角色、图示、海报草稿，也更重视图片中的文字渲染。
- 为什么有用：如果你已经用 ChatGPT 写文案，可以顺手让它把标题图、活动海报、课程封面或产品示意图做成初稿。它的优势不是“一次出终稿”，而是可以继续对话：换背景、改比例、加一句短文案、保留某个角色风格。
- 成本 / 门槛：OpenAI 官方发布页写明，4o 图片生成面向 Plus、Pro、Team 和 Free 用户在 ChatGPT 中推出，并会进入 Sora；实际可用额度会随账号、地区和产品策略变化。不要把“Free 可用”理解成无限免费。
- 注意点：OpenAI 同页也列出限制，例如长海报可能被裁切过紧；图片生成通常比文字回答慢。涉及真人肖像、品牌 logo、医疗法律等场景时，不要直接拿生成图当最终发布物。

来源：

- [OpenAI：Introducing 4o Image Generation](https://openai.com/index/introducing-4o-image-generation/)
- [OpenAI ChatGPT 产品入口](https://chatgpt.com/)

## 2. Adobe Firefly：做社媒图和商业风格素材时更稳一点

- 名称：Adobe Firefly Text to Image
- URL：https://www.adobe.com/products/firefly/features/text-to-image.html
- 它做什么：输入提示词生成图片。Adobe 官方页面写到，每次提示会给出 4 个结果，可以继续用参考图、风格、构图、裁剪和 Generative Fill 做细调。
- 为什么有用：Firefly 更适合公众号封面、电商活动图、PPT 配图、短视频背景这类“要像设计素材”的场景。它的入口也比较清楚：登录 Adobe ID，打开 Text to Image，再迭代提示词。
- 成本 / 门槛：Adobe 的 generative credits FAQ 说明，生成图片、视频、音频等会消耗生成积分；免费计划的积分会在第一次使用 Firefly 功能时分配，并在一个月后过期。Creative Cloud、Firefly 付费计划和企业计划的额度不同。
- 注意点：Adobe 价格和积分规则分得比较细，正式批量使用前要看自己账号里还有多少 credits。部分地区访问 Firefly 独立站点可能不稳定，可以从 Adobe 产品页或 Creative Cloud / Express 入口进入。

来源：

- [Adobe Firefly Text to Image 官方页面](https://www.adobe.com/products/firefly/features/text-to-image.html)
- [Adobe Generative credits FAQ](https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html)
- [Adobe Firefly plans](https://www.adobe.com/products/firefly/plans.html)

## 3. Runway：用一张图或一句话先做几秒短视频

- 名称：Runway
- URL：https://runwayml.com/pricing
- 它做什么：把视频、图片、音频、编辑和工作流工具放在一个创作平台里。Runway 产品页列出 Gen-4.5、Gen-4、Seedance、Kling、Veo、Sora 等模型入口，也有图片、视频编辑和工作流功能。
- 为什么有用：普通用户最适合拿它做“短视频小样”：产品图转几秒展示镜头、活动海报变成动态开场、旅行照片做成 Reels/TikTok 素材。先验证镜头感觉，再决定要不要找人拍或继续精修。
- 成本 / 门槛：Runway 价格页显示 Free 计划为 $0，包含一次性 125 credits，页面换算为约 25 秒 Gen-4 Turbo 或 Gen-3 Alpha Turbo；Standard 年付折算 $12/月，含每月 625 credits，并解锁更多模型、去水印、购买额外 credits 等。
- 注意点：免费额度是一次性的，不适合长期批量生产。生成视频常见问题仍然是人物一致性、手部细节、文字和品牌标识，正式发布前最好逐帧看一遍。

来源：

- [Runway 产品页](https://runwayml.com/product)
- [Runway Pricing](https://runwayml.com/pricing)

## 4. OpenRouter 免费模型：先把 API 流程跑通，再决定是否付费

- 名称：OpenRouter Free Models / OpenRouter API
- URL：https://openrouter.ai/docs/quickstart
- 它做什么：用一个统一 API 访问多家大模型。官方 quickstart 说明，它兼容常见 HTTP 调用方式，也可以用 OpenAI SDK 指向 OpenRouter；模型列表 API 会返回模型价格、上下文长度和能力。
- 为什么有用：想做个人脚本、网页摘要机器人、Notion/飞书小助手的人，可以先用 `:free` 模型或低价模型把流程跑起来。这样你先验证“提示词、数据流、输出格式”是不是可行，不必一开始绑定某一家厂商。
- 成本 / 门槛：OpenRouter 文档说明，模型 ID 后加 `:free` 可访问免费版本，但会有不同的限速或可用性；模型 API 中可以看到部分模型的 prompt/completion 价格为 0，也能看到低价模型的 token 单价。FAQ 也写明，OpenRouter 按底层模型价格扣 credits。
- 注意点：免费模型不适合承载稳定业务。官方 Limits 文档里部分限额以变量渲染，实际额度应以登录后台和 `/api/v1/key` 查询为准。测试时不要上传客户资料、密钥或私人聊天记录。

来源：

- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [OpenRouter Free Variant 文档](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [OpenRouter Limits 文档](https://openrouter.ai/docs/api/reference/limits)
- [OpenRouter Models API](https://openrouter.ai/api/v1/models)

## 5. Zapier：把 AI 变成邮件、表单和表格里的自动动作

- 名称：Zapier AI workflows / Zapier Copilot
- URL：https://zapier.com/pricing
- 它做什么：把 Gmail、Slack、Google Docs、表格、表单、CRM 等 App 串成自动流程。Zapier 价格页写到，Zaps、Tables、Forms 和 Zapier MCP 已合入统一计划，Free 计划也包含 Zapier Copilot 和基础自动化能力。
- 为什么有用：很多人用 AI 的卡点不是“模型不够强”，而是每天还在手动复制邮件、整理表单、写摘要、转发消息。Zapier 更适合做这种小流程：新表单来了先生成摘要，再写入表格；客户邮件进来后分类，再提醒你处理。
- 成本 / 门槛：官方价格页显示 Free 计划 $0/月，含 100 tasks/month、Unlimited Zaps / Tables / Forms、Two-step Zaps 和 Zapier Copilot；Professional 年付起价 $19.99/月，支持 Multi-step Zaps、Webhooks、AI fields 等。
- 注意点：免费计划 100 个 tasks/月很容易用完，两步 Zap 也限制了复杂度。涉及公司客户数据、财务数据和内部文档时，先确认权限和合规要求；能用假数据测试，就不要一开始接真实账号。

来源：

- [Zapier Pricing](https://zapier.com/pricing)
- [Zapier AI starter kit](https://zapier.com/templates/ai-workflows)

## 今天怎么选

- 要做图，先试 ChatGPT 或 Firefly：前者适合边聊边改，后者更像设计素材工作台。
- 要做短视频，Runway 的免费 credits 够验证一两个镜头，但别把它当长期免费产能。
- 要接 API，OpenRouter 适合先跑通低成本原型，再换成更稳定的付费模型。
- 要省重复劳动，Zapier 从两步流程开始最稳：一个触发，一个动作，先别搭太长链路。

我的建议是：把这些工具当草稿机和流程加速器。生图、生视频负责给你第一版，API 和自动化负责减少重复动作；最终内容、隐私数据和发布判断，还是要自己把关。
