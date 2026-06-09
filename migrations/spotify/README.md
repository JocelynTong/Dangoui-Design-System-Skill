# Spotify-ish 第三个 Demo 迁移说明

来源：当前 demo 的 `Spotify-ish` 风格预设。

本轮目的是测试新版 `/brand` 工作流：不只迁移 color token，也记录 radius、shadow 和 component pattern 的承接状态。

## 高频视觉值统计

> 统计口径：当前 demo 抽样中的 UI color、radius、shadow 与 component pattern。它用于验证流程，不声明为 Spotify 官网完整生产统计。
>
> 占比公式：该值出现次数 / 本统计口径中所有值出现次数总和。

| 类型 | 原始值 / 模式 | 次数 | 占比 | 角色判断 | 承接 |
|---|---|---:|---:|---|---|
| color | `#121212` | 28 | 25.9% | 暗色页面背景 | `--du-bg-2` |
| color | `#181818` | 22 | 20.4% | 暗色卡片表面 | `--du-bg-1` |
| color | `#ffffff` | 19 | 17.6% | 暗底一级文字 | `--du-text-1` |
| color | `#b3b3b3` | 16 | 14.8% | 暗底辅助文字 | `--du-text-3` |
| color | `#1ed760` | 14 | 13% | 品牌行动入口 | `--du-primary-color` / `--du-primary-solid-bg` |
| color | `#153b25` | 9 | 8.3% | 品牌柔和背景 | `--du-primary-soft-bg` |
| radius | `12px` | 10 | 55.6% | 卡片 / 媒体圆角 | `Radius/Medium`，当前 demo 落到 `--style-card-radius` |
| radius | `999px` | 8 | 44.4% | pill 控件圆角 | fallback，未来候选 `Radius/Pill` |
| shadow | `0 18px 42px rgba(0,0,0,.36)` | 1 | 100% | 暗色媒体卡片阴影 | style-only，未来候选 `Shadow/CardDarkElevated` |
| component | `dark-media-card` | 4 | 33.3% | 媒体内容卡片 | `DuCard + DuTag + DuImage` |
| component | `pill-primary-action` | 3 | 25% | 圆角主操作 | `DuButton + DuTag + DuSwitch` |

## 机器可读资产

- `brand-evidence.json`
- `brand-profile.dtcg.json`
- `echo-mapping.json`
- `dangoui-adapter.json`
- `component-mapping.json`

## Demo 应用

当前 demo 的 `Spotify-ish` 预设已经使用这些值。color 进入 dangoui `--du-*`，radius/shadow 暂时进入 `--style-*`，并在 adapter 中记录未来 dangoui token 候选。
