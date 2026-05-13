export const SITE = {
  website: "https://astro-paper-18u.pages.dev/",
  author: "wx",
  profile: "https://github.com/PaceCN",
  desc: "面向中文个人开发者的 AI 自动化、自托管运维与低成本独立博客实战手册。",
  title: "Pace Notes",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 6,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: true,
    text: "在 GitHub 编辑",
    url: "https://github.com/PaceCN/astro-paper/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "zh-CN",
  timezone: "Asia/Shanghai",
} as const;

export const ADS = {
  enabled: false,
  provider: "adsense",
  googleClient: "",
  slots: {
    homeAfterHero: { label: "首页主视觉后", enabled: false, slot: "" },
    homeAfterRecent: { label: "首页最新文章后", enabled: false, slot: "" },
    postTop: { label: "文章顶部", enabled: false, slot: "" },
    postMiddle: { label: "文章中部", enabled: false, slot: "" },
    postBottom: { label: "文章底部", enabled: false, slot: "" },
  },
} as const;
