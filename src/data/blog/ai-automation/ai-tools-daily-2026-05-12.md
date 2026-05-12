---
author: wx
pubDatetime: 2026-05-12T16:00:00+08:00
title: 今天这 5 个 AI 工具值得试：设计图、Veo 视频、免费 API 和知识库助手
slug: ai-tools-daily-2026-05-12
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 想少花钱试 AI 创作和工作流，今天可以从 Recraft 做设计图、Flow 做短视频、Gemini API 与 OpenRouter 跑小工具、Notion AI 整理知识库开始。
---

今天比较值得看的方向，是“能不能先做出一个小样”。设计图、短视频、模型 API 和知识库助手都有免费或低门槛入口，但每个工具的限制也很明确：免费额度适合验证想法，不适合当长期产能。我的建议是先用一两个真实场景试，不要因为页面写着“免费”就直接把业务流程压上去。

## 1. Recraft：适合做带文字的设计图、Logo 和产品样机

- 名称：Recraft
- URL：https://www.recraft.ai/ai-image-generator
- 它做什么：Recraft 是一个偏设计工作的 AI 生图平台，能生成照片、插画、Logo、图标、矢量图和产品样机。官方页面写到，Recraft V4、Nano Banana 2、GPT Image 2 等模型可以放在同一个工作区里用，V4 还强调文字排版、矢量输出和设计资产一致性。
- 为什么有用：如果你要做公众号封面、海报标题、店铺产品图、T 恤图案或活动 Logo，它比纯聊天式生图更像一个“设计草稿台”。尤其是需要把中文字、英文短句、图形和样机放在一起时，Recraft 的可编辑矢量和风格库会更顺手。
- 成本 / 门槛：官方 AI Image Generator 页面标注“每天最多 30 次免费图像生成”，并说明 V4 各版本在 Free 计划也可用。价格页同时提醒，Free 计划生成的图片由 Recraft 拥有、会公开到社区画廊，商业使用有一定限制；付费计划才给完整所有权、商业权利和私密生成。
- 注意点：免费版适合练提示词和做公开素材，不适合上传未发布产品、客户 Logo 或商业机密。想把图卖到素材站、用在正式品牌物料，至少要先看清版权和套餐说明。

来源：

- [Recraft AI Image Generator](https://www.recraft.ai/ai-image-generator)
- [Recraft Pricing](https://www.recraft.ai/pricing)
- [Zapier：The 8 best AI image generators in 2026](https://zapier.com/blog/best-ai-image-generator/)

## 2. Google Flow：用 Veo 3.1 做几秒钟可看的视频镜头

- 名称：Google Flow
- URL：https://labs.google/fx/tools/flow
- 它做什么：Flow 是 Google 的 AI 创作工作室，用 Veo 和 Nano Banana 等模型生成、改写和组合视频、图片与故事。官方页面列出文生视频、关键帧转视频、素材组合成视频、视频延展、插入/移除物体和分镜编排等入口。
- 为什么有用：它适合把一个抽象想法先拍成 5-8 秒小样：产品开场镜头、短视频补充镜头、活动氛围片、故事分镜都能先试。比起直接找素材或拍摄，Flow 的价值在于快速判断“这个画面方向有没有戏”。
- 成本 / 门槛：Flow 页面显示，不订阅 Google AI 也可免费开始，提供 100 个初始 credits 和每日 50 个 credits；Google AI Pro 为 $19.99/月、每月 1,000 个 credits，Ultra 为 $249.99/月、每月 25,000 个 credits。Google 博客介绍 Flow 时也提到，它是基于 Veo 的 AI 电影创作工具，Pro / Ultra 计划提供更高使用量和能力。
- 注意点：不同国家、账号和产品阶段的可用性会变动。AI 视频里的手、字幕、品牌标识、人物一致性仍要逐帧检查；免费额度做实验够用，但不适合承诺稳定交付。

来源：

- [Google Labs：Flow](https://labs.google/fx/tools/flow)
- [Google Blog：Introducing Flow](https://blog.google/innovation-and-ai/products/google-flow-veo-ai-filmmaking-tool/)
- [Zapier：The 18 best AI video generators in 2026](https://zapier.com/blog/best-ai-video-generator/)

## 3. Gemini API 免费层：先把自己的小工具跑起来

- 名称：Gemini API / Google AI Studio
- URL：https://ai.google.dev/gemini-api/docs/pricing
- 它做什么：Gemini API 可以把模型接进脚本、网页、小程序或内部工具。Google AI for Developers 的文档写到，Gemini API 支持文本、图片理解、原生图像生成、长上下文、结构化输出、函数调用、视频生成等能力。
- 为什么有用：普通用户不一定要“开发一个产品”，但可以做很小的自动化：批量改标题、整理表格、摘要 PDF、给客服话术分类、把语音记录变成待办。免费层的价值，是先确认 API key、输入输出格式和错误处理是否跑得通。
- 成本 / 门槛：截至 2026-05-12，Google 定价页写明 Free 计划面向开发者和小项目，包含免费输入与输出 token 和 Google AI Studio 访问权限，但内容会被用于改进产品；付费层有更高限额，内容不用于改进产品。Gemini 2.5 Flash 的定价表也显示 Free Tier 输入、输出为免费，付费层按每 100 万 token 计价。
- 注意点：免费层不是隐私保险箱。不要把客户资料、身份证、合同、密钥或私人聊天记录直接传进去；如果要给别人使用，要加额度上限、日志脱敏、失败重试和备用模型。

来源：

- [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini API docs](https://ai.google.dev/gemini-api/docs)

## 4. Notion AI：把零散资料变成可查询的工作区

- 名称：Notion AI
- URL：https://www.notion.com/product/ai
- 它做什么：Notion AI 直接嵌在 Notion 工作区里，能写作、改写、翻译、生成数据库、自动填充属性、转写会议、搜索工作区和连接的 Slack / Google Drive 等资料。官方帮助页也提到，Notion Agent 可以用工作区和连接应用的上下文创建、编辑页面和数据库。
- 为什么有用：如果你的资料已经散在 Notion 页面、项目数据库和会议记录里，Notion AI 的实际价值不是“再开一个聊天窗口”，而是让它基于已有资料回答问题、整理报告和补齐数据库字段。适合自由职业者、小团队、内容作者做知识库和项目复盘。
- 成本 / 门槛：Notion 帮助页说明，Notion AI 只在 Business 和 Enterprise 计划中可用，Free / Plus 用户有有限的免费 AI 回复额度试用；价格页也显示 Free 和 Plus 有 Limited Trial，Business 包含 Notion Agent、AI Meeting Notes、Enterprise Search 等能力。
- 注意点：接入越多资料，越要管权限。Notion 安全文档说 AI 会遵守现有权限，默认不会把客户数据用于训练模型；但非 Enterprise 工作区的大模型提供商可能保留数据 30 天或更短。处理客户、财务、医疗、法律资料前，先确认团队权限和数据政策。

来源：

- [Notion AI 产品页](https://www.notion.com/product/ai)
- [Notion Help：What is Notion AI?](https://www.notion.com/help/notion-ai-faqs)
- [Notion Pricing](https://www.notion.com/pricing)
- [Notion AI security & privacy practices](https://www.notion.com/help/notion-ai-security-practices)

## 5. OpenRouter Free Models：低成本试不同模型，不被一家 API 绑死

- 名称：OpenRouter Free Models / openrouter/free
- URL：https://openrouter.ai/openrouter/free
- 它做什么：OpenRouter 用统一接口接入多家模型。它的 free router 页面写明，openrouter/free 会从可用免费模型中选择，价格为每百万输入 token $0、每百万输出 token $0，并提供 200,000 token 上下文窗口；quickstart 也说明可以用标准 `/api/v1/chat/completions` 接口或 SDK 调用。
- 为什么有用：如果你在做网页摘要、邮件草稿、低风险客服 FAQ、表格标签分类，OpenRouter 可以先让你用免费模型验证流程，再按效果切到便宜或更强的模型。对不想一开始分别注册多家 API 的人，统一入口会省很多时间。
- 成本 / 门槛：OpenRouter 的免费模型集合页面写到，平台会继续扩展免费模型容量，但不保证未来一直如此；最简单的方式是用 openrouter/free 自动选择可用免费模型。价格页和模型页仍要逐项确认，因为不同模型的限速、上下文和可用性会变。
- 注意点：免费模型适合原型，不适合稳定业务承诺。调用前要写清楚超时、重试、降级模型和成本上限；公开应用还要防止别人刷你的 key。

来源：

- [OpenRouter Free Models Router](https://openrouter.ai/openrouter/free)
- [OpenRouter Free AI Models collection](https://openrouter.ai/collections/free-models)
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)

## 今天怎么选

- 需要做海报、Logo、商品图：先试 Recraft，但正式商用前看清版权。
- 需要短视频镜头：Flow 适合用免费 credits 打样，不要把一次生成当成终稿。
- 需要自己接模型：Gemini API 免费层适合跑脚本和小工具，敏感数据别直接传。
- 资料都在 Notion：Notion AI 适合整理知识库和会议记录，先管好权限。
- 想比较不同模型：OpenRouter 适合做原型和备用路由，但免费模型要接受不稳定。

我会把这 5 个工具分成两组：Recraft 和 Flow 负责“先做出来看看”；Gemini API、Notion AI 和 OpenRouter 负责“把重复工作接起来”。如果一个工具能在你的真实流程里连续省两三次时间，再考虑付费；只让你惊艳一次的，先留在收藏夹里就好。
