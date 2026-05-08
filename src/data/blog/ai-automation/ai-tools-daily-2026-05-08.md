---
author: wx
pubDatetime: 2026-05-08T16:00:00+08:00
title: 5 个今天就能上手的 AI 工具：生图、短视频和免费模型 API
slug: ai-tools-daily-2026-05-08
featured: false
draft: false
tags:
  - ai-automation
  - AI工具
  - AI生图
  - AI生视频
  - 免费模型
description: 这 5 个 AI 工具今天就能试：做图、生成短视频、调用免费模型 API、让浏览器帮你整理网页。
---

今天挑 5 个普通人能直接打开网页或注册试用的 AI 工具。重点不是追新名词，而是看它们能不能马上帮你做图、做短视频、接入模型 API，或者把浏览器和常用 App 里的重复动作省下来。价格和额度变化很快，付费前再看一眼官方价格页。

## 1. Adobe Firefly：适合做海报、封面和社媒配图的 AI 生图

- 名称：Adobe Firefly Text to Image
- URL：https://www.adobe.com/products/firefly/features/text-to-image.html
- 它做什么：输入文字提示词生成图片；每次提示会给出 4 张候选图，还能继续相似生成、换风格、用 Generative Fill 做局部修改。
- 为什么有用：对不会画图的人，Firefly 的优势是入口清晰，适合做公众号封面、活动海报、短视频背景、PPT 插图等不太复杂的视觉素材。
- 成本 / 门槛：Adobe 帮助页说明，Firefly 和 Creative Cloud 相关功能会消耗 generative credits；不同订阅包含的月度额度不同，部分 Firefly / Creative Cloud Pro 方案对标准生成有更宽松的访问。Adobe 公开页面也提示可创建免费账号试用。
- 注意点：地区可用性不完全一致，测试时发现 Firefly 独立站点可能会因地区限制拒绝访问；如果本地打不开，可以优先看 Adobe 产品页或改用已登录的 Creative Cloud / Express 入口。

来源：

- [Adobe Firefly Text to Image 官方页面](https://www.adobe.com/products/firefly/features/text-to-image.html)
- [Adobe generative credits FAQ](https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html)
- [Adobe Firefly plans 页面](https://www.adobe.com/products/firefly/plans.html)

## 2. Runway：从图片或文字生成短视频，适合小样片和广告分镜

- 名称：Runway
- URL：https://runwayml.com/pricing
- 它做什么：提供生成式视频、图片、音频和视频编辑工具。当前价格页列出 Gen-4 Turbo 图片转视频、Gen-4/Gen-4.5、Veo 3/3.1、第三方视频模型、去水印、工作流等能力。
- 为什么有用：普通用户可以先用一张产品图、旅行照或手绘分镜生成几秒短片，用来验证短视频开头、广告镜头、活动 teaser，而不是一上来就拍摄。
- 成本 / 门槛：官方价格页显示 Free 计划为 $0，包含一次性 125 credits，约等于 25 秒 Gen-4 Turbo 或 Gen-3 Alpha Turbo；Standard 年付折算 $12/月，含每月 625 credits，并解锁更多模型、去水印、购买额外 credits 等。
- 注意点：免费额度是一次性的，不适合长期批量生产；生成视频容易出现手部、文字、品牌标识和人物一致性问题，正式发布前要逐帧检查。

来源：

- [Runway 官方价格页](https://runwayml.com/pricing)
- [Magic Hour 2026 AI 视频工具价格对比](https://magichour.ai/blog/ai-video-generators-pricing)
- [Zapier 2026 AI productivity tools 中的视频工具分类](https://zapier.com/blog/best-ai-productivity-tools/)

## 3. OpenRouter 免费模型：低成本试用大模型 API 的统一入口

- 名称：OpenRouter Free Models / OpenRouter API
- URL：https://openrouter.ai/collections/free-models
- 它做什么：用一个 OpenAI 兼容风格的 API 入口调用多家模型。免费模型集合中会展示零成本模型；`/api/v1/models` 也能看到模型价格、上下文长度和能力。
- 为什么有用：想做个人脚本、Notion/飞书小助手、浏览器插件原型的人，不必一开始就分别申请很多厂商 API。可以先用 free 模型或很便宜的小模型验证流程，再换成付费模型。
- 成本 / 门槛：OpenRouter 官方 free models 页面说明可访问免费 AI 模型；官方 Limits 文档说明可以用 `/api/v1/key` 查询 key 的 credits 与限制。测试 `/api/v1/models` 时，可以看到一些 prompt 和 completion 价格为 0 的模型，也能看到部分低价模型。
- 注意点：免费模型通常有请求频率、每日次数、稳定性和模型下线风险；不要把隐私数据、客户资料或密钥直接塞进测试请求。官方 Limits 文档中的部分限制值以变量形式渲染，实际限额应以登录后台或 key 查询结果为准。

来源：

- [OpenRouter 免费模型集合](https://openrouter.ai/collections/free-models)
- [OpenRouter API Limits 文档](https://openrouter.ai/docs/api/reference/limits)
- [OpenRouter 模型列表 API](https://openrouter.ai/api/v1/models)

## 4. Microsoft Edge Copilot Mode：把浏览器变成带上下文的 AI 助手

- 名称：Microsoft Edge Copilot Mode
- URL：https://blogs.windows.com/msedgedev/2025/07/28/introducing-copilot-mode-in-edge-a-new-way-to-browse-the-web/
- 它做什么：在 Edge 里开启实验性的 Copilot Mode 后，新标签页把聊天、搜索和网页导航放到同一个输入框；在用户授权时，Copilot 可以理解多个打开标签页的上下文，帮助比较信息、翻译、总结页面，或用语音导航做一些浏览动作。
- 为什么有用：适合普通人做旅行比价、购物参数对比、资料阅读、网页摘要。它不要求你会写提示词工程，只要在浏览器里说清楚“帮我比较这几个页面”。
- 成本 / 门槛：微软官方博客写明，Copilot Mode 在 Copilot 支持市场中、Edge for Windows 和 Mac 上限时免费，且是完全 opt-in 功能。Edge 官方页面也强调浏览器内置 Copilot、浏览器动作和标签组织等能力。
- 注意点：多标签上下文、历史记录、凭据相关动作都涉及隐私和账号安全。不要让浏览器助手代你处理转账、购买、登录敏感后台等高风险动作；能总结就不要授权执行。

来源：

- [Microsoft Edge Dev Blog：Introducing Copilot Mode in Edge](https://blogs.windows.com/msedgedev/2025/07/28/introducing-copilot-mode-in-edge-a-new-way-to-browse-the-web/)
- [Microsoft Edge 官方页面](https://www.microsoft.com/en-us/edge)
- [Microsoft Edge Copilot Mode 入口](https://www.microsoft.com/en-us/edge/copilot-mode)

## 5. Zapier AI starter kit：把常用 App 串成可复用的 AI 工作流

- 名称：Zapier AI workflows / AI starter kit
- URL：https://zapier.com/templates/ai-workflows
- 它做什么：用模板和可视化流程把 Gmail、Slack、Google Docs、表格、CRM、表单等应用连起来。Zapier 价格页显示 Zaps、Tables、Forms 和 Zapier MCP 已合入统一计划；Zapier 的 2026 AI 工具文章也把它归到 AI orchestration and automation。
- 为什么有用：普通用户最容易落地的 AI，不一定是“再开一个聊天窗口”，而是把重复动作自动化：新表单提交后生成摘要、把会议纪要发到群里、把客户邮件分类、把待办写进表格。
- 成本 / 门槛：官方价格页显示 Free 计划 $0/月，含 100 tasks/month、Unlimited Zaps / Tables / Forms、Two-step Zaps 和 Zapier Copilot；Professional 年付起价 $19.99/月，支持多步骤 Zaps、Webhooks、AI fields 等。
- 注意点：免费计划只有 100 个任务/月，且 two-step Zaps 很快会遇到复杂度限制。涉及客户数据、财务数据和公司内部文档时，要先确认公司是否允许把这些数据接入第三方自动化平台。

来源：

- [Zapier AI starter kit 模板页](https://zapier.com/templates/ai-workflows)
- [Zapier 官方价格页](https://zapier.com/pricing)
- [Zapier：The best AI productivity tools in 2026](https://zapier.com/blog/best-ai-productivity-tools/)

## 今天怎么选

- 只想做图：先试 Firefly，看能不能满足封面和配图。
- 想做视频小样：Runway 的免费 credits 够验证一两个短片思路。
- 想写脚本接模型：OpenRouter 适合先把 API 调通，再决定是否付费。
- 想边浏览边总结：Edge Copilot Mode 比单独复制粘贴到聊天框顺手。
- 想减少重复动作：从 Zapier 的两步免费流程开始，不要一上来搭很长链路。

小建议：把 AI 工具当“草稿机”和“流程加速器”，不要当最终发布者。生图、生视频要检查版权、人物肖像和品牌元素；API 与自动化要先用假数据测试，再接真实账号。
