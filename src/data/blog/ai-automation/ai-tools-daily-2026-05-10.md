---
author: wx
pubDatetime: 2026-05-10T16:00:00+08:00
title: 今天这 5 个 AI 工具值得试：生图、生视频和低成本 API
slug: ai-tools-daily-2026-05-10
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 想把 AI 用到日常创作或小项目里，可以先从 Gemini 做图、Luma/CapCut 做视频、Gemini API/OpenRouter 接模型和 n8n 工作流开始。
---

今天更适合看“能不能立刻做出一个可用版本”。做图工具在往对话式修图走，生视频工具越来越像素材实验台，模型 API 和工作流工具则适合把重复动作接起来。普通用户不用一开始就买很贵的套餐，先用免费额度或低门槛入口跑通一个小样，反而更容易判断值不值得继续投入。

## 1. Gemini 图片生成：适合边聊天边改图，也能做简单商品图

- 名称：Gemini / Nano Banana 图片生成
- URL：https://gemini.google/overview/image-generation/
- 它做什么：在 Gemini 里选择“Create images”后，用提示词生成图片，也可以上传图片做编辑。Google 的说明里提到，用户可以选择 Fast、Thinking 或 Pro 模型，再继续要求换风格、改尺寸、加元素或保留画面细节。
- 为什么有用：它更像一个聊天式修图助手。公众号封面、课程海报、商品背景图、社媒配图，都可以先让它给出第一版，再一句句改。Google AI Studio 的 Nano Banana 文档也展示了产品图、带文字海报、信息图这类更贴近实际用途的例子。
- 成本 / 门槛：Gemini 图片功能要以你所在地区和账号可见入口为准。Google 页面写到，部分 Pro 能力面向 Google AI Pro、Plus、Ultra 用户；开发者也可以在 AI Studio 里试 Nano Banana，并查看 Gemini API 价格页。
- 注意点：Google 明确说明 Gemini 生成图会带 SynthID 隐形水印和可见水印。用它做公开物料时，最好保留“AI 生成草稿”的预期；人物肖像、品牌商标和医疗法律类内容不要直接当最终稿发布。

来源：

- [Google：Gemini AI image generator & photo editor](https://gemini.google/overview/image-generation/)
- [Google AI for Developers：Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI for Developers：Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

## 2. Luma：想做几秒动态镜头，可以先用试用 credits 探路

- 名称：Luma
- URL：https://lumalabs.ai/pricing
- 它做什么：Luma 把图片、视频和第三方创意模型放在一个平台里。官网把它定位成“Creative agents”，适合围绕一个项目不断生成镜头、素材和变体。
- 为什么有用：如果你有一张产品图、一张海报或一段文字设想，可以先做几秒视频小样，看镜头运动、氛围和构图是否成立。它适合广告分镜、短视频开场、活动预告、旅行照片动态化这类“先看感觉”的任务。
- 成本 / 门槛：Luma 价格页写明，所有计划都带 free trial credits；个人 Plus 计划为 $30/月，年付为 $300，并包含 Luma 与第三方图像、视频模型、访客协作编辑和商业使用。Pro、Ultra 主要是更高用量。
- 注意点：试用 credits 适合验证，不适合长期批量出片。生成视频仍要重点检查人物一致性、手指、文字、商标和镜头跳变；客户项目最好先确认商业使用和素材授权边界。

来源：

- [Luma Plans & Pricing](https://lumalabs.ai/pricing)
- [Luma 产品页](https://lumalabs.ai/dream-machine)

## 3. CapCut AI Video Generator：适合把脚本快速变成可剪的视频草稿

- 名称：CapCut AI Video Generator
- URL：https://www.capcut.com/tools/ai-video-generator
- 它做什么：输入视频想法，选择脚本、旁白和时长等设置，CapCut 会生成可继续编辑的视频。官方页面写到，可以在 CapCut Web 打开 AI video maker / Instant AI video，再添加音乐、字幕或特效并导出。
- 为什么有用：它不像专业生视频模型那样强调“一个镜头多真实”，更适合普通人做短视频草稿：课程预告、口播脚本、产品介绍、TikTok/Reels 素材、作业展示。生成后还能继续用 CapCut 的剪辑、字幕和模板能力修。
- 成本 / 门槛：CapCut 页面直接标注 Free AI Video Generator，并在 FAQ 里回答“Is there a free AI video maker?”为 yes。实际可用模板、素材、云空间和导出选项会随账号、地区和 CapCut 产品策略变化。
- 注意点：它更适合“视频结构”和“剪辑初稿”，不是严肃广告片的最终交付。若使用内置音乐、模板、素材或头像，发布商业内容前要再确认授权；免费入口也可能有水印、额度或功能限制。

来源：

- [CapCut：Free AI Video Generator](https://www.capcut.com/tools/ai-video-generator)
- [CapCut Help Center](https://www.capcut.com/help)

## 4. Gemini API + OpenRouter：先用免费或低成本模型把小项目跑通

- 名称：Gemini API / OpenRouter Free Models
- URL：https://ai.google.dev/gemini-api/docs/quickstart
- 它做什么：Gemini API 适合直接在脚本、网页或自动化工具里调用模型；OpenRouter 则用一个统一接口接入多家模型。两者都能让普通用户从“网页聊天”走到“自己的小工具”。
- 为什么有用：做邮件摘要、网页总结、表格分类、客服草稿、个人知识库问答时，最重要的不是一开始选最强模型，而是先跑通 API key、提示词、输入输出格式和错误处理。Gemini quickstart 写明可以免费创建 API key；OpenRouter 文档则支持在模型 ID 后加 `:free` 使用免费变体。
- 成本 / 门槛：截至 2026-05-10，Gemini API 价格页写明可免费开始，Free Tier 有免费输入输出 token，但内容可能用于改进产品；付费层按每百万 token 计费，并提供更高限额。OpenRouter 免费变体不收费，但官方 Limits 文档写到，`:free` 模型最高 20 requests/min；若购买 credits 少于 10 美元，每天 50 次免费模型请求，购买至少 10 credits 后可提高到每天 1000 次。
- 注意点：免费 API 不适合稳定业务。不要把客户资料、密钥、隐私聊天记录直接丢进测试脚本；如果要做公开服务，尽早切到付费层并加上限额、日志脱敏和错误重试。

来源：

- [Google AI for Developers：Gemini API quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Google AI for Developers：Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [OpenRouter：Free Variant](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [OpenRouter：API Rate Limits](https://openrouter.ai/docs/api-reference/limits)

## 5. n8n：把 AI 接进邮件、表格、表单和人工审核

- 名称：n8n AI workflow automation
- URL：https://n8n.io/ai/
- 它做什么：n8n 可以把 500+ 集成、AI agents、人工审核和代码步骤串成工作流。官网强调，它不是让 AI 自动乱跑，而是把模型放进可解释、可调试的流程里。
- 为什么有用：普通人最常见的浪费时间，不是“不会用 AI 聊天”，而是每天重复复制、分类、改写和转发信息。n8n 适合做小流程：表单提交后自动摘要并写入表格；新邮件先分类，再让你确认回复；文章链接进入队列后生成摘要和标签。
- 成本 / 门槛：n8n AI 页面写到有 14 天免费试用且不需要信用卡。价格页显示，Starter 年付为 20 欧元/月，含 2.5K workflow executions、无限步骤、无限用户和 50 个 AI Workflow Builder credits；n8n 也提供自托管路线，但需要自己维护。
- 注意点：自动化最容易出问题的地方是权限和误触发。建议先从“两步流程”开始：一个触发器，一个动作；涉及客户、财务、合同或账号权限时，要加人工确认，不要让 AI 直接发送或删除。

来源：

- [n8n：Advanced AI Workflow Automation Software & Tools](https://n8n.io/ai/)
- [n8n Plans and Pricing](https://n8n.io/pricing/)

## 今天怎么选

- 想做图：先试 Gemini。适合边聊边改，但公开发布前要检查水印、肖像和商标。
- 想做“像视频”的草稿：Luma 更偏镜头实验，CapCut 更偏脚本转短视频和后期剪辑。
- 想做自己的小工具：Gemini API 和 OpenRouter 适合先把流程跑通，再根据稳定性换付费模型。
- 想减少重复劳动：n8n 比单纯聊天更有用。先做小流程，再慢慢加分支和人工审核。

我的建议是：先把这些工具当“低成本试错层”。生图、生视频负责把想法变成可看的第一版；API 和工作流负责减少每天重复搬运信息的时间。能帮你省下半小时的，再考虑付费；只是新鲜但进不了流程的，先别急着订阅。
