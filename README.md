# Design Radar

面向中文设计师的每日设计发现页。它把允许低频读取的公开数据源，在构建阶段整理为一个静态快照；浏览器只加载本项目的静态数据，不会直接请求第三方站点。

## 数据原则

- 只接入已验证公开可访问、且没有禁止通用抓取的入口。
- 不绕过 Cloudflare、登录、付费墙、验证码或 robots 限制。
- 不把站点地图的 `lastmod` 当成作品发布日期。
- 卡片时间代表来源可靠的收录/奖项日期；无法取得可靠日期时，应标为首次发现日期。
- 同步失败不会覆盖上一次成功的 `src/generated-feed.ts` 快照。

当前同步器已具备四个公开来源适配器：The FWA 公开首页、CSS Nectar 公开 RSS、CSS Design Awards 公开获奖与提名页、CSS Winner 公开获奖页。页面只会把本次实际解析成功的来源标为“已接入”；某个来源临时失败时，会保留该来源上一次成功的作品快照并如实显示失败状态。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://127.0.0.1:5173/`。若本地已有不同端口的 Vite 服务，请使用终端显示的地址。

## 更新数据

```bash
npm run fetch:feed
npm run build
```

`npm run fetch:feed` 低频读取四个已验证的公开入口，最多写入 12 个近期作品。同步器带有明确 User-Agent、20 秒超时和按来源保留快照的失败策略。请在发布前将脚本中的 GitHub 地址替换为自己的仓库地址。

仓库包含 GitHub Actions 定时任务，每日 09:17（北京时间附近，取决于夏令时无关的 UTC 计算）刷新静态快照并提交更新。可在 Actions 页面手动执行 `Refresh public design feed`。
