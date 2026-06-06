<template>
  <main class="shell" :style="themeVars">
    <aside class="panel" aria-label="Visual inspector">
      <section class="section">
        <p class="eyebrow">Visual Style Learning</p>
        <h2>同一套命名，填不同风格值</h2>
        <p class="inspector-note">这里模拟 AI 学习大品牌网站视觉后，只写入 dangoui 已有 --du-* token 的 value，不改命名地基。</p>
        <div class="style-switcher" aria-label="brand style presets">
          <button
            v-for="preset in stylePresets"
            :key="preset.id"
            class="style-button"
            :class="{ active: selectedStyleId === preset.id }"
            type="button"
            @click="selectedStyleId = preset.id"
          >
            <span>{{ preset.label }}</span>
            <small>{{ preset.source }}</small>
          </button>
        </div>
        <div class="brand-token-grid">
          <div v-for="token in selectedStyle.tokens" :key="token.name" class="brand-token">
            <span>{{ token.name }}</span>
            <strong>{{ token.value }}</strong>
          </div>
        </div>
        <div class="extraction-card">
          <strong>高频风格信号 → dangoui token</strong>
          <p>频次来自当前 demo 的“样式学习抽样”。只映射到 dangoui 已有 --du-* token；dangoui 没有的圆角/阴影不放进 token 表。</p>
          <div class="mapping-list">
            <div v-for="signal in selectedStyle.signals" :key="`${signal.raw}-${signal.target}`" class="mapping-row">
              <span class="raw-signal">{{ signal.raw }}</span>
              <span class="frequency">{{ signal.count }}x</span>
              <span class="mapped-token">{{ signal.target }}</span>
              <span class="mapping-value">{{ signal.value }}</span>
            </div>
          </div>
        </div>
        <div class="schema-card">
          <details open>
            <summary>当前风格 token JSON</summary>
            <pre>{{ styleJson }}</pre>
          </details>
        </div>
      </section>

      <section class="section">
        <p class="eyebrow">Universal Docs</p>
        <h2>当前页面组件</h2>
        <div class="stats">
          <span class="stat">dangoui@3.6.16</span>
          <span class="stat">{{ selectedStyle.label }}</span>
          <span class="stat">{{ pageInstances.length }} rendered nodes</span>
          <span class="stat">{{ uniqueComponentCount }} component names</span>
        </div>
        <p class="inspector-note">点击右侧页面模块，左侧会锚定到对应组件。</p>
        <div class="component-list">
          <div
            v-for="instance in pageInstances"
            :key="instance.id"
            class="component"
            :class="{
              active: selectedInstanceId === instance.id,
              'instance-active': selectedInstanceId === instance.id,
              missing: isMissing(instance.name),
            }"
            role="button"
            tabindex="0"
            :data-instance-id="instance.id"
            @click="selectInstance(instance.id)"
            @keydown.enter.prevent="selectInstance(instance.id)"
            @keydown.space.prevent="selectInstance(instance.id)"
          >
            <strong>
              {{ instance.label }}
              <span>{{ componentMeta(instance.name)?.className || missingMeta(instance.name)?.status || "unknown" }}</span>
            </strong>
            <span>{{ displayDescription(instance.name) }}</span>
            <span class="component-token-row">
              <i v-for="token in tokenPreview(instance.name)" :key="token" class="mini-token">{{ token }}</i>
              <i v-if="extraTokenCount(instance.name) > 0" class="mini-token">+{{ extraTokenCount(instance.name) }}</i>
            </span>
            <a class="docs-link" :href="componentDocsUrl(instance.name)" target="_blank" rel="noreferrer" @click.stop>
              查看 docs
            </a>
          </div>
        </div>
      </section>

      <section class="section">
        <p class="eyebrow">Selected Node</p>
        <h2>{{ selectedComponent }}</h2>
        <div class="human-card">
          <p><strong>这是什么：</strong>{{ humanDescription }}</p>
          <div class="editable-list">
            <span v-for="field in editableFields" :key="field" class="mini-token">可改：{{ field }}</span>
          </div>
          <a class="docs-link" :href="componentDocsUrl(selectedComponent)" target="_blank" rel="noreferrer">看规范指南</a>
        </div>
      </section>

      <section class="section">
        <h2>用到的 Tokens</h2>
        <p class="inspector-note">默认只看关键几项；需要细节再展开或跳 docs。</p>
        <div v-if="selectedTokens.length" class="token-grid">
          <div v-for="token in visibleTokens" :key="token.name" class="token-card">
            <button
              class="token"
              :class="{ active: selectedTokenName === token.name }"
              type="button"
              @click="selectToken(token.name)"
            >
              <i class="swatch" :style="{ background: token.value }"></i>
              <span><strong>{{ token.name }}</strong><span>{{ token.usage }}</span></span>
              <span>{{ token.value }}</span>
            </button>
            <a class="docs-link" :href="tokenDocsUrl" target="_blank" rel="noreferrer">查看 token docs</a>
          </div>
          <button v-if="selectedTokens.length > tokenPreviewLimit" class="collapse-button" type="button" @click="tokensExpanded = !tokensExpanded">
            {{ tokensExpanded ? "收起 tokens" : `展开全部 ${selectedTokens.length} 个 tokens` }}
          </button>
        </div>
        <div v-else class="notice">该节点没有 dangoui token schema，等待补充。</div>
        <div class="schema-card">
          <details>
            <summary>高级 schema / 给研发和 AI 看</summary>
            <pre>{{ schemaPreview }}</pre>
          </details>
        </div>
      </section>
    </aside>

    <section class="workspace">
      <header>
        <h1>学习大品牌风格，填入同一套 design tokens</h1>
        <p class="lead">命名保持稳定：同一套 dangoui `--du-*` tokens，只替换 value；右侧同一组 dangoui 组件会渲染出不同品牌气质。</p>
      </header>

      <div class="demo-stage">
        <article class="phone" aria-label="mobile demo">
          <div class="phone-screen">
            <div
              class="click-target"
              :class="{ selected: selectedInstanceId === 'node-navigation-bar' }"
              data-component="NavigationBar"
              data-node-id="node-navigation-bar"
              tabindex="0"
              @click="selectInstance('node-navigation-bar')"
              @keydown.enter.prevent="selectInstance('node-navigation-bar')"
              @keydown.space.prevent="selectInstance('node-navigation-bar')"
            >
              <span class="tag">NavigationBar</span>
              <DuNavigationBar color="white" :back="false" :share="true">
                <strong class="nav-title">{{ selectedStyle.hero }}</strong>
              </DuNavigationBar>
            </div>

            <section class="feed" aria-label="feed">
              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-search' }"
                data-component="Search"
                data-node-id="node-search"
                tabindex="0"
                @click="selectInstance('node-search')"
                @keydown.enter.prevent="selectInstance('node-search')"
                @keydown.space.prevent="selectInstance('node-search')"
              >
                <span class="tag">Search</span>
                <DuSearch readonly :placeholder="['搜索活动', '搜索内容卡片']" />
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-notice-bar' }"
                data-component="NoticeBar"
                data-node-id="node-notice-bar"
                tabindex="0"
                @click="selectInstance('node-notice-bar')"
                @keydown.enter.prevent="selectInstance('node-notice-bar')"
                @keydown.space.prevent="selectInstance('node-notice-bar')"
              >
                <span class="tag">NoticeBar</span>
                <DuNoticeBar :text="selectedStyle.notice" link-text="查看" />
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-tabs' }"
                data-component="Tabs"
                data-node-id="node-tabs"
                tabindex="0"
                @click="selectInstance('node-tabs')"
                @keydown.enter.prevent="selectInstance('node-tabs')"
                @keydown.space.prevent="selectInstance('node-tabs')"
              >
                <span class="tag">Tabs</span>
                <DuTabs value="hot" type="tag" size="normal">
                  <DuTab name="hot">{{ selectedStyle.tabs[0] }}</DuTab>
                  <DuTab name="new">{{ selectedStyle.tabs[1] }}</DuTab>
                  <DuTab name="ops">{{ selectedStyle.tabs[2] }}</DuTab>
                </DuTabs>
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-tags' }"
                data-component="Tag"
                data-node-id="node-tags"
                tabindex="0"
                @click="selectInstance('node-tags')"
                @keydown.enter.prevent="selectInstance('node-tags')"
                @keydown.space.prevent="selectInstance('node-tags')"
              >
                <span class="tag">Tag</span>
                <div class="tag-row">
                  <DuTag color="primary" round>主推</DuTag>
                  <DuTag color="success" round>已配置</DuTag>
                  <DuTag color="warning" round>待审核</DuTag>
                </div>
              </div>

              <div class="feed-section-title">
                <strong>{{ selectedStyle.sectionTitle }}</strong>
                <span>同一 schema 渲染</span>
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-card-featured' }"
                data-component="Card"
                data-node-id="node-card-featured"
                tabindex="0"
                @click="selectInstance('node-card-featured')"
                @keydown.enter.prevent="selectInstance('node-card-featured')"
                @keydown.space.prevent="selectInstance('node-card-featured')"
              >
                <span class="tag">Card</span>
                <DuCard :title="selectedStyle.cards[0].title" guide-text="" size="large">
                  <div class="media" aria-hidden="true"></div>
                  <div class="card-meta">
                    <DuTag type="success" size="small">Featured</DuTag>
                    <span class="meta">8 min read</span>
                  </div>
                  <p class="card-copy">{{ selectedStyle.cards[0].copy }}</p>
                </DuCard>
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-card-secondary' }"
                data-component="Card"
                data-node-id="node-card-secondary"
                tabindex="0"
                @click="selectInstance('node-card-secondary')"
                @keydown.enter.prevent="selectInstance('node-card-secondary')"
                @keydown.space.prevent="selectInstance('node-card-secondary')"
              >
                <span class="tag">Card</span>
                <DuCard :title="selectedStyle.cards[1].title" guide-text="">
                  <div class="media" aria-hidden="true"></div>
                  <div class="card-meta">
                    <DuTag type="success" size="small">New</DuTag>
                    <span class="meta">4 min read</span>
                  </div>
                  <p class="card-copy">{{ selectedStyle.cards[1].copy }}</p>
                </DuCard>
              </div>

              <div
                class="click-target"
                :class="{ selected: selectedInstanceId === 'node-controls-card' }"
                data-component="Card"
                data-node-id="node-controls-card"
                tabindex="0"
                @click="selectInstance('node-controls-card')"
                @keydown.enter.prevent="selectInstance('node-controls-card')"
                @keydown.space.prevent="selectInstance('node-controls-card')"
              >
                <span class="tag">Card</span>
                <DuCard title="发布设置" subtitle="运营可见配置" guide-text="">
                  <div class="setting-row">
                    <span>首页展示</span>
                    <DuSwitch :on="true" />
                  </div>
                  <div
                    class="click-target inline-target"
                    :class="{ selected: selectedInstanceId === 'node-primary-button' }"
                    data-component="Button"
                    data-node-id="node-primary-button"
                    tabindex="0"
                    @click.stop="selectInstance('node-primary-button')"
                    @keydown.enter.prevent.stop="selectInstance('node-primary-button')"
                    @keydown.space.prevent.stop="selectInstance('node-primary-button')"
                  >
                    <span class="tag">Button</span>
                    <DuButton text="发布活动" full />
                  </div>
                </DuCard>
              </div>
            </section>

            <nav
              class="tab-bar click-target"
              :class="{ selected: selectedInstanceId === 'node-tab-bar' }"
              data-component="TabBar"
              data-node-id="node-tab-bar"
              tabindex="0"
              aria-label="bottom tabs"
              @click="selectInstance('node-tab-bar')"
              @keydown.enter.prevent="selectInstance('node-tab-bar')"
              @keydown.space.prevent="selectInstance('node-tab-bar')"
            >
              <span class="tag">TabBar</span>
              <span class="tab-item active"><i class="tab-icon"></i>Feed</span>
              <span class="tab-item"><i class="tab-icon circle"></i>Search</span>
              <span class="tab-item"><i class="tab-icon"></i>Profile</span>
            </nav>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import {
  DuButton,
  DuCard,
  DuNavigationBar,
  DuNoticeBar,
  DuSearch,
  DuSwitch,
  DuTab,
  DuTabs,
  DuTag,
} from "dangoui";

const docsBaseUrl = "https://dumpling.echo.tech";
const tokenDocsUrl = `${docsBaseUrl}/guide/theme`;
const tokenPreviewLimit = 5;
const selectedStyleId = ref("apple");
const stylePresets = [
  {
    id: "apple",
    label: "Apple-ish",
    source: "large type / quiet surface",
    hero: "Vision Notes",
    notice: "大面积留白、克制中性色、柔和材质感被写入同一套 token value。",
    sectionTitle: "Today",
    tabs: ["精选", "产品", "体验"],
    cards: [
      { title: "Spatial Calm", copy: "同一张 Card 使用更轻的背景、空气感间距和低对比阴影，模拟 Apple 式的安静层级。" },
      { title: "Human Interface", copy: "按钮、标签和信息层级仍然来自 dangoui 组件，只替换品牌风格 token 的值。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f5f5f7" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#1d1d1f" },
      { name: "--du-text-3", value: "#6e6e73" },
      { name: "--du-primary-color", value: "#0071e3" },
      { name: "--du-primary-soft-bg", value: "#eaf3ff" },
      { name: "--du-primary-solid-bg", value: "#0071e3" },
    ],
    style: {
      cardRadius: "28px",
      controlRadius: "999px",
      pageSpacing: "20px",
      cardShadow: "0 18px 48px rgba(0,0,0,.08)",
      media: "linear-gradient(145deg,#f8fbff,#d9e9ff 48%,#ffffff)",
    },
    signals: [
      { raw: "#f5f5f7", count: 18, target: "--du-bg-2", value: "#f5f5f7" },
      { raw: "#1d1d1f", count: 15, target: "--du-text-1", value: "#1d1d1f" },
      { raw: "#ffffff", count: 13, target: "--du-bg-1", value: "#ffffff" },
      { raw: "#6e6e73", count: 10, target: "--du-text-3", value: "#6e6e73" },
      { raw: "#0071e3", count: 6, target: "--du-primary-color", value: "#0071e3" },
    ],
  },
  {
    id: "figma",
    label: "Figma-ish",
    source: "editor energy / bright accents",
    hero: "Design Jam",
    notice: "高对比紫色、清晰边框和协作感色块被填入同一套 token value。",
    sectionTitle: "Community Picks",
    tabs: ["文件", "组件", "社区"],
    cards: [
      { title: "Multiplayer Canvas", copy: "相同组件结构呈现更强的工具感：紫色主色、紧凑圆角、清晰描边。" },
      { title: "Variant Playground", copy: "命名没有变，只有 value 改变，所以 AI 后续仍能按同一个 schema 写代码。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f7f2ff" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#1f1147" },
      { name: "--du-text-3", value: "#6f5f92" },
      { name: "--du-primary-color", value: "#7b61ff" },
      { name: "--du-primary-soft-bg", value: "#eee8ff" },
      { name: "--du-primary-solid-bg", value: "#7b61ff" },
    ],
    style: {
      cardRadius: "18px",
      controlRadius: "10px",
      pageSpacing: "16px",
      cardShadow: "0 14px 34px rgba(79,49,155,.14)",
      media: "linear-gradient(135deg,#ff7262,#a259ff 52%,#1abcfe)",
    },
    signals: [
      { raw: "#7b61ff", count: 16, target: "--du-primary-color", value: "#7b61ff" },
      { raw: "#ffffff", count: 15, target: "--du-bg-1", value: "#ffffff" },
      { raw: "#f7f2ff", count: 10, target: "--du-bg-2", value: "#f7f2ff" },
      { raw: "#6f5f92", count: 8, target: "--du-text-3", value: "#6f5f92" },
      { raw: "#eee8ff", count: 6, target: "--du-primary-soft-bg", value: "#eee8ff" },
    ],
  },
  {
    id: "spotify",
    label: "Spotify-ish",
    source: "dark media / bold green",
    hero: "Daily Mix",
    notice: "深色媒体界面、强品牌绿和更厚重卡片被填入同一套 token value。",
    sectionTitle: "Made For You",
    tabs: ["播放", "收藏", "新歌"],
    cards: [
      { title: "Midnight Signal", copy: "同一组 Card 在深色底、强阴影和高饱和主色下，变成音乐内容推荐风格。" },
      { title: "Release Radar", copy: "这证明风格可以被数据化，而不是让 AI 每次自由发挥硬编码。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#121212" },
      { name: "--du-bg-1", value: "#181818" },
      { name: "--du-text-1", value: "#ffffff" },
      { name: "--du-text-3", value: "#b3b3b3" },
      { name: "--du-primary-color", value: "#1ed760" },
      { name: "--du-primary-soft-bg", value: "#153b25" },
      { name: "--du-primary-solid-bg", value: "#1ed760" },
    ],
    style: {
      cardRadius: "12px",
      controlRadius: "999px",
      pageSpacing: "18px",
      cardShadow: "0 18px 42px rgba(0,0,0,.36)",
      media: "linear-gradient(135deg,#1ed760,#1db954 32%,#302f6f)",
    },
    signals: [
      { raw: "#121212", count: 28, target: "--du-bg-2", value: "#121212" },
      { raw: "#181818", count: 22, target: "--du-bg-1", value: "#181818" },
      { raw: "#ffffff", count: 19, target: "--du-text-1", value: "#ffffff" },
      { raw: "#b3b3b3", count: 16, target: "--du-text-3", value: "#b3b3b3" },
      { raw: "#1ed760", count: 14, target: "--du-primary-color", value: "#1ed760" },
      { raw: "#153b25", count: 9, target: "--du-primary-soft-bg", value: "#153b25" },
    ],
  },
];
const componentDocs = {
  NavigationBar: `${docsBaseUrl}/navigation/navigation-bar`,
  Card: `${docsBaseUrl}/data-display/card`,
  NoticeBar: `${docsBaseUrl}/feedback/notice-bar`,
  Search: `${docsBaseUrl}/form/search`,
  Tabs: `${docsBaseUrl}/data-display/tabs`,
  Tab: `${docsBaseUrl}/data-display/tabs`,
  Tag: `${docsBaseUrl}/data-display/tag`,
  Button: `${docsBaseUrl}/general/button`,
  Switch: `${docsBaseUrl}/form/switch`,
};
const editableByComponent = {
  NavigationBar: ["标题", "返回按钮", "右侧动作", "背景", "固定/透明状态"],
  Card: ["图片", "标题", "标签", "摘要", "圆角", "阴影"],
  Search: ["占位文案", "只读/输入态", "背景", "右侧动作"],
  NoticeBar: ["提示文案", "链接文案", "色彩", "关闭按钮"],
  Tabs: ["标签项", "激活项", "样式类型", "激活色"],
  Tag: ["文案", "状态色", "圆角", "边框"],
  Button: ["按钮文案", "类型", "尺寸", "全宽", "禁用/加载状态"],
  Switch: ["开关状态", "颜色", "禁用状态"],
  TabBar: ["选中项", "图标", "文字", "激活色", "底部分隔线"],
};
const friendlyDescriptions = {
  NavigationBar: "页面顶部导航，负责标题、返回/分享等顶部动作。",
  Search: "搜索入口，让用户按关键词查找活动、内容或配置项。",
  NoticeBar: "页面公告条，用来提示运营状态、风险或待处理事项。",
  Tabs: "内容分组切换，用来在热门、最新、运营推荐等列表间切换。",
  Tag: "状态或分类标签，用短文案标记主推、已配置、待审核等状态。",
  Card: "内容承载容器，适合放图片、标题、摘要和操作信息。",
  Button: "主要操作入口，例如发布、保存、确认。",
  Switch: "开关设置，用来表达启用/关闭一类配置。",
  TabBar: "页面底部一级导航。当前 dangoui 没有内置 TabBar，需要后续补 schema。",
};

const catalog = ref({ source: {}, tokens: [], components: [], missingComponents: [] });
const selectedInstanceId = ref("node-navigation-bar");
const selectedComponent = ref("NavigationBar");
const selectedTokenName = ref("");
const tokensExpanded = ref(false);

const pageInstances = [
  { id: "node-navigation-bar", name: "NavigationBar", label: "NavigationBar" },
  { id: "node-search", name: "Search", label: "Search" },
  { id: "node-notice-bar", name: "NoticeBar", label: "NoticeBar" },
  { id: "node-tabs", name: "Tabs", label: "Tabs" },
  { id: "node-tags", name: "Tag", label: "Tag Group" },
  { id: "node-card-featured", name: "Card", label: "Card #1" },
  { id: "node-card-secondary", name: "Card", label: "Card #2" },
  { id: "node-controls-card", name: "Card", label: "Card #3" },
  { id: "node-primary-button", name: "Button", label: "Button" },
  { id: "node-tab-bar", name: "TabBar", label: "TabBar" },
];

const componentsByName = computed(() =>
  Object.fromEntries(catalog.value.components.map((component) => [component.name, component])),
);
const missingByName = computed(() =>
  Object.fromEntries((catalog.value.missingComponents || []).map((component) => [component.name, component])),
);
const uniqueComponentCount = computed(() => new Set(pageInstances.map((item) => item.name)).size);
const selectedStyle = computed(() => stylePresets.find((preset) => preset.id === selectedStyleId.value) || stylePresets[0]);
const selectedStyleTokenMap = computed(() =>
  Object.fromEntries(selectedStyle.value.tokens.map((token) => [token.name, token.value])),
);
const themeVars = computed(() => ({
  "--du-bg-2": selectedStyleTokenMap.value["--du-bg-2"],
  "--du-bg-1": selectedStyleTokenMap.value["--du-bg-1"],
  "--du-text-1": selectedStyleTokenMap.value["--du-text-1"],
  "--du-text-3": selectedStyleTokenMap.value["--du-text-3"],
  "--du-primary-color": selectedStyleTokenMap.value["--du-primary-color"],
  "--du-primary-soft-bg": selectedStyleTokenMap.value["--du-primary-soft-bg"],
  "--du-primary-solid-bg": selectedStyleTokenMap.value["--du-primary-solid-bg"],
  "--style-page-bg": selectedStyleTokenMap.value["--du-bg-2"],
  "--style-card-bg": selectedStyleTokenMap.value["--du-bg-1"],
  "--style-text": selectedStyleTokenMap.value["--du-text-1"],
  "--style-muted": selectedStyleTokenMap.value["--du-text-3"],
  "--style-accent": selectedStyleTokenMap.value["--du-primary-color"],
  "--style-accent-soft": selectedStyleTokenMap.value["--du-primary-soft-bg"],
  "--style-card-radius": selectedStyle.value.style.cardRadius,
  "--style-control-radius": selectedStyle.value.style.controlRadius,
  "--style-page-spacing": selectedStyle.value.style.pageSpacing,
  "--style-card-shadow": selectedStyle.value.style.cardShadow,
  "--style-media": selectedStyle.value.style.media,
}));
const styleJson = computed(() =>
  JSON.stringify(
    {
      source: selectedStyle.value.label,
      lockedSchema: "dangoui-existing-css-token-names",
      extractedSignals: selectedStyle.value.signals,
      dangouiTokens: selectedStyle.value.tokens.reduce((acc, token) => {
        acc[token.name] = token.value;
        return acc;
      }, {}),
      demoOnlyVisualControls: selectedStyle.value.style,
    },
    null,
    2,
  ),
);
const selectedMeta = computed(() => componentMeta(selectedComponent.value));
const selectedMissing = computed(() => missingMeta(selectedComponent.value));
const selectedTokens = computed(() => {
  if (!selectedMeta.value) return [];
  return Object.values(selectedMeta.value.tokens || {}).map(getToken);
});
const visibleTokens = computed(() =>
  tokensExpanded.value ? selectedTokens.value : selectedTokens.value.slice(0, tokenPreviewLimit),
);
const humanDescription = computed(() => {
  if (friendlyDescriptions[selectedComponent.value]) return friendlyDescriptions[selectedComponent.value];
  if (selectedMeta.value) return selectedMeta.value.description;
  if (selectedMissing.value) {
    return "这是页面底部导航。当前 dangoui catalog 还没有这个组件，所以只能识别位置，不能按 dangoui schema 精准改。";
  }
  return "这个模块还没有匹配到设计系统组件。";
});
const editableFields = computed(() => editableByComponent[selectedComponent.value] || ["颜色", "文字", "状态", "间距"]);
const schemaPreview = computed(() => {
  if (selectedTokenName.value) {
    return JSON.stringify(
      {
        token: getToken(selectedTokenName.value),
        usedBy: selectedComponent.value,
        docs: tokenDocsUrl,
      },
      null,
      2,
    );
  }
  return JSON.stringify(selectedMeta.value || selectedMissing.value || {}, null, 2);
});

function componentMeta(name) {
  return componentsByName.value[name];
}

function displayDescription(name) {
  return friendlyDescriptions[name] || componentMeta(name)?.description || missingMeta(name)?.reason || "未在 dangoui catalog 中找到。";
}

function missingMeta(name) {
  return missingByName.value[name];
}

function isMissing(name) {
  return Boolean(missingMeta(name));
}

function componentDocsUrl(name) {
  return componentDocs[name] || docsBaseUrl;
}

function tokenPreview(name) {
  const meta = componentMeta(name);
  return meta ? Object.values(meta.tokens || {}).slice(0, tokenPreviewLimit) : [];
}

function extraTokenCount(name) {
  const meta = componentMeta(name);
  const count = meta ? Object.values(meta.tokens || {}).length : 0;
  return Math.max(0, count - tokenPreviewLimit);
}

function normalizeTokenName(token) {
  return String(token || "").replace(/^var\((--du-[^)]+)\)$/, "$1");
}

function getToken(tokenName) {
  const normalized = normalizeTokenName(tokenName);
  return (
    catalog.value.tokens.find((token) => token.name === normalized) || {
      name: normalized,
      value: "见组件绑定",
      usage: "组件局部 token 或派生变量",
    }
  );
}

function selectInstance(instanceId) {
  const instance = pageInstances.find((item) => item.id === instanceId);
  if (!instance) return;
  selectedInstanceId.value = instance.id;
  selectedComponent.value = instance.name;
  selectedTokenName.value = "";
  tokensExpanded.value = false;
  nextTick(() => {
    document
      .querySelector(`[data-instance-id="${selectedInstanceId.value}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function selectToken(tokenName) {
  selectedTokenName.value = normalizeTokenName(tokenName);
  tokensExpanded.value = true;
}

onMounted(async () => {
  const response = await fetch("/data/dangoui.design-system.json");
  catalog.value = await response.json();
});
</script>
