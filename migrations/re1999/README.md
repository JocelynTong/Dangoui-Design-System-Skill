# RE1999 Migration Notes

This migration is a focused test for the image-asset lane.

## Asset Rule

PNG/WebP/SVG assets must be collected before mapping:

- `background`: page or panel texture.
- `selected-bg`: selected/active state background.
- `asset-frame`: border image, corner image, card shell or media frame.
- `brand-mark`: logo or brand symbol.
- `illustration`: character, object or scene media.

Assets do not become DangoUI tokens by default. They are mapped to `Image` / icon slots only when the project exposes a matching component API. Otherwise they enter `demoOnlyVisualControls.assetRecipes` with `assetPath`, `role`, `targetScope`, `state`, CSS placement and fallback.

Keep both source evidence and a local copy:

- `rawSrc`: the exact path from DOM or CSS, for example `./img/character/1.png`.
- `resolvedUrl`: the absolute source URL used during acquisition.
- `localAssetPath`: the vendored copy used by the demo and downstream projects.

The demo must use `localAssetPath`; `rawSrc` and `resolvedUrl` are traceability, not runtime dependencies.

## Current Demo Asset

`/assets/re1999-logo.png` is used as a NavigationBar decorative watermark:

```text
targetScope: .theme-re1999 .phone .du-navigation-bar::before
role: brand-mark
implementation: CSS background-image, contain, right/bottom placement
```

`/assets/brand-assets/re1999/img/character/1.png` is a vendored DOM inline image:

```text
rawSrc: ./img/character/1.png
resolvedUrl: https://re.bluepoch.com/home/img/character/1.png
targetScope: .theme-re1999 .re1999-role-media i
role: role-art
implementation: CSS background-image in the archive media slot
```

Higher-priority heavy-style assets are also vendored:

```text
font: ./font/Serif.ttf / Sans.ttf / Didot.ttf -> /assets/brand-assets/re1999/font/
texture: ./img/BG2.png -> /assets/brand-assets/re1999/img/BG2.png
texture candidates: ./img/BG.png / ./img/BGM.png / ./img/01.jpg / ./kv/m.jpg / ./m/m_00000.jpg / ./img/login/loginBg.png -> /assets/brand-assets/re1999/
decorative-layer: ./img/role/false.webp -> /assets/brand-assets/re1999/img/role/false.webp
role-backdrop: ./img/role/1bg.png -> /assets/brand-assets/re1999/img/role/1bg.png
selected-state pair: ./img/icon/b.png + ./img/icon/bc.png -> /assets/brand-assets/re1999/img/icon/
cta image: ./img/more.png -> /assets/brand-assets/re1999/img/more.png
```

These assets should be tested before generic character art because they decide whether the final style keeps the official texture, frame/decorative rhythm, font package and state behavior.

## Anti Scope

Do not apply 1999 image assets to evidence panels, mapping panels, frequency tables or the DangoUI baseline.
