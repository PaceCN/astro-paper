# AdSense 准备清单

## 当前状态

站点已加入广告配置和广告位组件，但默认关闭。只有同时配置 `ADS.enabled`、`ADS.googleClient` 和对应 slot 后，才会加载真实 AdSense 脚本。

## 上线前检查

- 内容页、首页、关于、隐私政策、使用条款、联系页面可访问。
- 不在页面文案中诱导点击广告。
- 顶部不堆叠广告，移动端首屏以内容为主。
- 隐私政策说明第三方广告服务上线后的数据边界。
- 先配置文章底部广告位，再考虑首页或文章中部广告位。

## 配置位置

- 配置：`src/config.ts` 中的 `ADS`。
- 组件：`src/components/AdSlot.astro`。
- 前台已渲染广告位：`homeAfterHero`、`homeAfterRecent`、`postTop`、`postMiddle`、`postBottom`。
- 后台还可维护 `leftRail`、`rightRail` 两个桌面侧栏候选位，但当前前台组件未默认渲染。

未配置时，开发环境显示占位提示；生产环境不输出内容。
