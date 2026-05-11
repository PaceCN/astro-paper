---
author: wx
pubDatetime: 2026-05-11T16:00:00+08:00
title: 今天这 5 个 AI 工具值得试：图片、短视频、浏览器助手和免费模型 API
slug: ai-tools-daily-2026-05-11
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 想把 AI 用进日常工作，今天可以先试 ChatGPT 做图、Runway 做短视频、OpenRouter 接免费模型，再用 Claude 浏览器助手和 Zapier 接流程。
---

今天的重点不是“又出了多少新模型”，而是普通用户能不能少花钱、少折腾，先做出一个能用的小样。图片、短视频、浏览器助手、免费模型 API 和自动化模板，刚好覆盖了从内容草稿到重复流程的几个入口。我的判断是：先用免费额度验证用途，再决定要不要付费；能省时间的留下，只是新鲜的先别订阅。

## 1. ChatGPT 图片生成：适合边聊边改封面、海报和示意图

- 名称：ChatGPT Images / GPT-4o image generation
- URL：https://openai.com/index/introducing-4o-image-generation/
- 它做什么：在 ChatGPT 里用文字生成图片，也可以结合聊天上下文和上传图片继续修改。OpenAI 的介绍强调，4o 图片生成更重视文字渲染、提示词细节和多轮一致性；Free 用户也有图片生成入口，但额度更紧。
- 为什么有用：写公众号封面、课程海报、活动视觉、产品说明图时，可以先让它出 2-3 个方向，再继续说“文字少一点”“换成竖版”“保留这个人物但换背景”。它的优势不是一次出终稿，而是你不用在设计软件里从零开始。
- 成本 / 门槛：OpenAI 发布页写到，4o 图片生成已面向 Plus、Pro、Team 和 Free 用户作为 ChatGPT 默认图片生成能力推出；Help Center 也说明 Free tier 可创建图片，但图片工具有独立使用限制，Plus 等付费计划有更高限额。具体次数会随账号、地区和产品策略变化。
- 注意点：不要把“Free 可用”理解成没有额度限制。OpenAI 同页也提到，长海报可能被裁切过紧，图片渲染通常比文字回复慢。涉及真人肖像、商标、医疗法律和客户素材，最好只当草稿，不要直接发布。

来源：

- [OpenAI：Introducing 4o Image Generation](https://openai.com/index/introducing-4o-image-generation/)
- [OpenAI Help Center：ChatGPT Free Tier FAQ](https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq)

## 2. Runway：用免费 credits 试几秒 AI 短视频镜头

- 名称：Runway
- URL：https://runwayml.com/pricing
- 它做什么：把 AI 视频、图片、音频、编辑和工作流工具放在一个创作平台里。Runway 产品页列出 Gen-4.5、Kling、Veo、Sora、FLUX 等模型入口，也提供 storyboarding、animatics、virtual staging、visual effects 这类更具体的创作工具。
- 为什么有用：它适合先验证“这个画面动起来有没有感觉”。比如把产品图变成 4-5 秒展示镜头，把活动海报做成动态开场，或者给短视频找一个可参考的氛围片段。对普通用户来说，先做小样，比直接拍摄或外包更容易控制成本。
- 成本 / 门槛：价格页显示 Free 计划为 $0，包含一次性 125 credits；页面换算约为 25 秒 Gen-4 Turbo 或 Gen-3 Alpha Turbo。Standard 年付折算 $12/月，含每月 625 credits，并解锁更多模型、去水印、购买额外 credits 和更大存储。
- 注意点：免费 credits 是试用层，不是长期产能。AI 视频仍然容易在手指、文字、商标、人物一致性和镜头衔接上出问题；正式发布前要逐帧检查。如果是商业项目，还要确认水印、素材授权和套餐权限。

来源：

- [Runway 产品页](https://runwayml.com/product)
- [Runway Pricing](https://runwayml.com/pricing)
- [Revoyant：Best Free AI Video Generators in 2026](https://www.revoyant.com/blog/best-free-ai-video-generators)

## 3. OpenRouter 免费模型：先把 API 小工具跑通

- 名称：OpenRouter Free Models / OpenRouter API
- URL：https://openrouter.ai/docs/quickstart
- 它做什么：用一个统一 API 访问多家大模型。OpenRouter quickstart 写明，可以直接调用 `/api/v1/chat/completions`，也能用 SDK；`:free` 变体则可以访问部分免费模型。
- 为什么有用：如果你想做网页摘要、表格分类、邮件草稿、个人知识库问答，第一步不是追参数最漂亮的模型，而是先跑通 API key、输入输出格式、错误处理和成本上限。OpenRouter 的好处是入口统一，后面可以在免费模型、低价模型和更高能力模型之间切换。
- 成本 / 门槛：官方 Free Variant 文档说明，在模型 ID 后加 `:free` 可访问免费版本，但限速和可用性会不同。FAQ 也说明，OpenRouter 支持多种模型，付费模型按底层模型价格扣 credits，免费模型的日请求量会受账号 credits 状态影响。
- 注意点：免费模型适合原型，不适合稳定业务。不要把客户资料、密钥、合同、私人聊天记录直接传进测试脚本；如果要公开给别人用，要加用量上限、错误重试、日志脱敏和备用模型。

来源：

- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [OpenRouter Free Variant 文档](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [OpenRouter FAQ](https://openrouter.ai/docs/faq)
- [Awesome Agents：Every Free AI API in 2026](https://awesomeagents.ai/tools/free-ai-inference-providers-2026/)

## 4. Claude in Chrome：让浏览器助手处理网页里的重复动作

- 名称：Claude in Chrome
- URL：https://claude.com/claude-for-chrome
- 它做什么：Anthropic 的 Chrome 扩展让 Claude 在侧边栏里读取、点击和导航网页。官方帮助文档写到，它可以处理多标签页、网页导航、后台流程、截图上下文、图片上传、快捷方式和定时任务；目前 beta 面向 Pro、Max、Team、Enterprise 等付费计划用户。
- 为什么有用：它不是单纯“总结网页”的插件，更像浏览器里的执行助手。比如比对几个页面的信息、整理表单字段、从网页复制结构化内容、在你批准的范围内完成重复点击。对经常在后台、表格、文档、GitHub、日历里切换的人，价值会比普通聊天窗口更明显。
- 成本 / 门槛：官方帮助页写明，Claude in Chrome beta 面向所有付费计划用户；Pro 计划当前限用 Haiku 4.5，Max、Team、Enterprise 可按任务选择模型。安装后需要授予侧边栏、网页读取、浏览器控制、标签页、通知等权限。
- 注意点：这是今天最需要谨慎用的工具。Anthropic 安全文档明确提醒，浏览器 AI 工具会面对提示注入风险；Claude 可能看到当前网页上的个人信息，也可能在登录状态下执行动作。我的建议是：先只在低风险网站试，开启“先问再做”，不要让它碰银行、支付、客户后台和敏感文档。

来源：

- [Claude for Chrome 官方页](https://claude.com/claude-for-chrome)
- [Anthropic Support：Get started with Claude in Chrome](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome)
- [Anthropic Support：Using Claude in Chrome safely](https://support.claude.com/en/articles/12902428-using-claude-in-chrome-safely)

## 5. Zapier AI starter kit：从两步流程开始接邮件、表单和表格

- 名称：Zapier AI workflows / AI starter kit
- URL：https://zapier.com/templates/ai-workflows
- 它做什么：Zapier 提供 AI 工作流模板，也能把 Gmail、Slack、Google Docs、表格、表单、CRM 等应用串起来。价格页写到，Zaps、Tables、Forms 和 Zapier MCP 已合入统一计划；Free 计划包含 Zapier Copilot、无限 Zaps / Tables / Forms 和两步 Zaps。
- 为什么有用：很多人的 AI 使用卡在“聊完还要手动复制”。Zapier 更适合把结果接进流程：新表单来了，让 AI 先摘要；客户邮件进来，先分类并提醒；新文档上传后，生成摘要写进表格。普通用户不用一开始搭复杂系统，从一个触发器加一个动作开始就够。
- 成本 / 门槛：Zapier 价格页显示 Free 计划 $0/月，含 100 tasks/month；Professional 年付起价 $19.99/月，支持多步骤 Zaps、Webhooks、AI fields 等能力。模板页也有 AI starter kit，适合从现成流程改起。
- 注意点：免费计划的 100 tasks/month 很快会用完，两步 Zap 也限制了复杂度。涉及客户、财务、合同、账号权限时，要先用假数据测试，并加人工确认；不要让 AI 自动发送、删除或修改高风险内容。

来源：

- [Zapier AI starter kit](https://zapier.com/templates/ai-workflows)
- [Zapier Pricing](https://zapier.com/pricing)
- [Zapier：The 8 best AI automation tools in 2026](https://zapier.com/blog/ai-automation-tools/)

## 今天怎么选

- 要做图：先试 ChatGPT。它适合边聊边改，但公开发布前要自己检查文字、肖像和商标。
- 要做短视频：Runway 适合用免费 credits 验证镜头，不适合当长期免费剪辑工厂。
- 要接模型 API：OpenRouter 适合把小工具跑通，再根据稳定性换低价或付费模型。
- 要让浏览器帮忙干活：Claude in Chrome 很强，但先从低风险网页开始，别碰敏感账号。
- 要减少复制粘贴：Zapier 先做两步流程，跑稳了再加 AI 字段、多步骤和人工审核。

我的建议是，把这 5 个工具分成两类：ChatGPT 和 Runway 负责把想法变成可看的第一版；OpenRouter、Claude in Chrome 和 Zapier 负责把重复动作接起来。只要一个工具能稳定省下半小时，就值得继续研究；如果只是试完很惊艳、第二天用不上，先别急着付费。
