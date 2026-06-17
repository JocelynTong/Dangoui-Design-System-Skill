<template>
  <main class="shell" :class="`theme-${selectedStyleId}`" :style="themeVars">
    <aside class="panel" aria-label="Visual inspector">
      <div class="style-rail">
        <p class="section-heading"><strong>参考站</strong></p>
        <div class="style-switcher compact" aria-label="brand style presets">
          <button
            v-for="preset in stylePresets"
            :key="preset.id"
            class="style-button"
            :class="{ active: selectedStyleId === preset.id }"
            type="button"
            @click="selectStyle(preset.id)"
          >
            <img class="site-icon" :src="preset.icon" :alt="`${preset.label} icon`" width="16" height="16" />
            <span>{{ preset.label }}</span>
          </button>
        </div>
      </div>

      <div class="side-rail">
        <nav class="inspector-tabs" aria-label="inspector sections">
          <button type="button" :class="{ active: selectedInspectorTab === 'style' }" @click="showStyleMenu">风格</button>
          <button type="button" :class="{ active: selectedInspectorTab === 'components' }" @click="showComponentMenu">组件</button>
          <button type="button" :class="{ active: selectedInspectorTab === 'pages' }" @click="showPageMenu">页面</button>
        </nav>

        <template v-if="selectedInspectorTab === 'style'">
          <div class="token-category-list rail-list" aria-label="token categories">
            <div
              v-for="category in styleCategories"
              :key="category.id"
              class="token-category"
              :class="[
                `token-category--${styleCategorySupportKind(category)}`,
                { active: selectedWorkspaceMode === 'style' && selectedStyleCategoryId === category.id },
              ]"
            >
              <button class="node-button token-category-button" type="button" @click="selectStyleCategory(category.id)">
                <strong>{{ category.label }} <em>{{ category.zh }}</em><span>{{ styleCategorySupportLabel(category) }}</span></strong>
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="selectedInspectorTab === 'pages'">
          <div class="page-list rail-list" aria-label="demo pages">
            <div
              v-for="template in currentPageTabs"
              :key="template.id"
              class="page-node"
              :class="{ active: isTemplateTabActive(template) }"
            >
              <button class="node-button" type="button" @click="selectTemplateTab(template)">
                <strong>
                  <b>
                    {{ templatePageTitle(template) }}
                    <span :class="`page-kind-tag page-kind-tag--${templateKindClass(template)}`">{{ templateKindLabel(template) }}</span>
                  </b>
                  <em>{{ templateDescription(template) }}</em>
                </strong>
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <nav class="side-tabs workflow-tabs component-category-tabs" aria-label="component categories">
            <button
              v-for="category in componentCategorySpecs"
              :key="category.id"
              type="button"
              :class="{ active: selectedComponentCategoryId === category.id }"
              @click="selectComponentCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </nav>
          <div class="component-list rail-list">
            <div
              v-for="item in componentPanelItems"
              :key="item.id"
              class="component"
              :class="[
                `component--${componentSupportKind(item.name)}`,
                { active: selectedComponent === item.name, missing: isMissing(item.name) },
              ]"
              :data-instance-id="item.id"
            >
              <button
                class="node-button"
                type="button"
                @click="selectCatalogComponent(item.name)"
              >
                <strong>
                  {{ item.label }} <em>{{ componentChineseName(item.name) }}</em>
                  <span>{{ componentSupportLabel(item.name) }}</span>
                </strong>
              </button>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <section class="workspace">
      <div class="demo-stage">
        <article class="component-showcase" aria-label="dangoui component showcase">
          <section class="template-preview">
            <div class="phone template-phone" ref="phoneRef" :style="mockupScaleVars">
              <div
                class="phone-screen"
                :class="{
'phone-screen--home': isHomeTemplate && selectedInspectorTab === 'pages',
                  'phone-screen--display': isDisplayTemplate && selectedWorkspaceMode !== 'style',
                  'phone-screen--publish': activeSide === 'publish' && selectedInspectorTab === 'pages',
                  'phone-screen--bottom-actions': showDemoBottomActions,
                  'phone-screen--no-bottom-actions': !showDemoBottomActions,
                  'phone-screen--has-selection': Boolean(selectedInstanceId),
                }"
                @click="restoreMockupSelection"
                @mouseover="prepareMockupHoverLabel"
                @mouseleave="clearMockupHoverLabel"
              >
                <div
                  class="click-target"
                  :class="{ selected: selectedInstanceId === pageNodeId('NavigationBar') }"
                  :data-node-id="pageNodeId('NavigationBar')"
                  tabindex="0"
                  @click.capture="handleNavigationBarCapture"
                  @click="selectInstance(pageNodeId('NavigationBar'), $event)"
                  @keydown.enter.prevent="selectInstance(pageNodeId('NavigationBar'), $event)"
                >
                  <span class="tag">NavigationBar</span>
                  <div class="mock-statusbar" :class="mockStatusbarClass" aria-hidden="true">
                    <span class="mock-statusbar-time">9:41</span>
                    <span class="mock-statusbar-camera"></span>
                    <span class="mock-statusbar-icons">
                      <i class="mock-statusbar-signal"><b></b><b></b><b></b><b></b></i>
                      <i class="mock-statusbar-wifi"></i>
                      <i class="mock-statusbar-battery"><b></b></i>
                    </span>
                  </div>
                  <DuNavigationBar platform="miniprogram" color="default" :back="showNavigationBack" :share="false">
                    <div class="nav-content">
                      <strong class="nav-title">{{ navigationTitle }}</strong>
                      <div
                        v-if="showNavigationSearch"
                        class="nav-searchbar-target"
                        :class="{ selected: selectedInstanceId === pageNodeId('Search') }"
                        :data-node-id="pageNodeId('Search')"
                        @click.stop="selectInstance(pageNodeId('Search'))"
                      >
                        <span class="tag">Search</span>
                        <DuSearch readonly :placeholder="[navigationSearchPlaceholder]" />
                      </div>
                    </div>
                  </DuNavigationBar>
                </div>
                <div
                  class="contents template-contents"
                  :class="{
                    'style-phone-contents': selectedWorkspaceMode === 'style',
                  'component-phone-contents': selectedInspectorTab === 'components',
                  }"
                >
                  <template v-if="selectedWorkspaceMode === 'style'">
                    <section class="style-mockup-page" aria-label="style preview page">
                      <h2>{{ selectedStyleCategory?.label }} <span>{{ selectedStyleCategory?.zh }}</span></h2>
                      <p>{{ currentStyleCategoryDescription }}</p>
                    </section>

                    <section class="style-evidence-mockup-card" aria-label="style evidence">
                      <div class="style-preview-heading">
                        <span>项目结构与映射</span>
                      </div>
                      <div v-if="currentStyleCapabilityNote" class="style-capability-note">
                        <strong>{{ currentStyleCapabilityNote.title }}</strong>
                        <span>{{ currentStyleCapabilityNote.body }}</span>
                      </div>
                      <div v-if="selectedStyleCategoryId === 'color'" class="palette-stack">
                        <section class="palette-list" aria-label="project color inventory and mapping">
                          <p v-if="selectedStyle.id !== 'dango'" class="style-evidence-note">保持 DangoUI 一级/二级/三级色彩结构，高频品牌色只覆盖最相似的 token，并用「覆盖」标记显示原值到新值的变化。「推测」一整块色阶剩余的颜色，完全和 DangoUI 相同就用「命中」。</p>
                          <div class="color-hierarchy-panel" aria-label="DangoUI color token hierarchy">
                            <div class="color-hierarchy-grid">
                              <div
                                v-for="group in dangoColorStructureRows"
                                :key="group.title"
                                class="color-hierarchy-group"
                              >
                                <span>{{ group.title }}</span>
                                <p>{{ group.description }}</p>
                                <div
                                  v-if="group.variant === 'paletteRows'"
                                  class="palette-scale-list"
                                  :class="{ 'has-overrides': group.hasOverrides }"
                                >
                                  <div v-for="row in group.items" :key="row.family" class="palette-scale-row" :class="`palette-scale-row--${row.family}`">
                                    <strong>{{ row.family }}</strong>
                                    <div class="palette-scale-swatches">
                                      <button
                                        v-for="step in row.steps"
                                        :key="`${row.family}-swatch-${step.name}`"
                                        type="button"
                                        :class="{ copied: copiedColorValue === step.value, overridden: step.isOverridden, inferred: step.isInferred }"
                                        :aria-label="`复制 ${step.name} ${step.value}`"
                                        :style="{ background: step.swatch, color: step.textColor }"
                                        @click.stop="copyPaletteColor(step.value)"
                                      >
                                        {{ step.label }}
                                      </button>
                                    </div>
                                    <div class="palette-scale-labels">
                                      <span v-for="step in row.steps" :key="`${row.family}-label-${step.name}`">
                                        <em>{{ step.isOverridden ? step.baseDisplayValue : step.displayValue }}</em>
                                        <strong v-if="step.isOverridden">{{ step.displayValue }}</strong>
                                        <b v-if="step.isOverridden">{{ step.overrideKind }}</b>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div v-else-if="group.variant === 'semanticTextRows'" class="semantic-palette-list">
                                  <details
                                    v-for="row in group.items"
                                    :key="row.family"
                                    class="semantic-palette-row"
                                    :open="row.family === 'primary'"
                                  >
                                    <summary class="semantic-palette-heading">
                                      <strong>{{ row.family }}</strong>
                                      <small>{{ row.category }}</small>
                                    </summary>
                                    <p>{{ row.scaleText }}</p>
                                    <div class="semantic-mapping-list">
                                      <button
                                        v-for="mapping in row.mappings"
                                        :key="`${row.family}-mapping-${mapping.name}`"
                                        type="button"
                                        :class="{ copied: copiedColorValue === mapping.value, overridden: mapping.isOverridden }"
                                        :data-hover-label="`${mapping.name} ${mapping.expression}`"
                                        :style="{ '--alias-swatch': mapping.swatch, '--alias-text': readableTextColor(mapping.swatch, 0.58) }"
                                        @click.stop="copyPaletteColor(mapping.value)"
                                      >
                                        <i></i>
                                        <span>{{ mapping.name }}</span>
                                        <em>{{ mapping.expression }}</em>
                                        <small v-if="mapping.isOverridden">{{ mapping.overrideKind }}</small>
                                      </button>
                                    </div>
                                  </details>
                                </div>
                                <div v-else-if="group.variant === 'componentAliasRows'" class="component-alias-list">
                                  <details
                                    v-for="row in group.items"
                                    :key="row.component"
                                    class="component-alias-row"
                                    :open="row.expanded"
                                  >
                                    <summary class="component-alias-heading">
                                      <span>{{ row.component }}</span>
                                      <small>{{ row.summary }}</small>
                                    </summary>
                                    <div v-if="row.variantGroups" class="component-variant-list">
                                      <details
                                        v-for="variant in row.variantGroups"
                                        :key="`${row.component}-${variant.name}`"
                                        class="component-variant-row"
                                        :open="variant.name === 'primary'"
                                      >
                                        <summary class="component-variant-heading">
                                          <strong>{{ variant.name }}</strong>
                                          <small>{{ variant.summary }}</small>
                                        </summary>
                                        <div class="semantic-mapping-list">
                                          <button
                                            v-for="mapping in variant.mappings"
                                            :key="`${row.component}-${variant.name}-mapping-${mapping.name}-${mapping.expression}`"
                                            type="button"
                                            :class="{ copied: copiedColorValue === mapping.value, overridden: mapping.isOverridden }"
                                            :data-hover-label="mapping.expression"
                                            :style="{ '--alias-swatch': mapping.swatch }"
                                            @click.stop="copyPaletteColor(mapping.hexValue)"
                                          >
                                            <i></i>
                                            <span>{{ mapping.name }}</span>
                                            <em>{{ mapping.expression }}</em>
                                            <small v-if="mapping.isOverridden">{{ mapping.overrideKind }}</small>
                                          </button>
                                        </div>
                                      </details>
                                    </div>
                                    <div v-else class="semantic-mapping-list">
                                      <button
                                        v-for="mapping in row.mappings"
                                        :key="`${row.component}-mapping-${mapping.name}`"
                                        type="button"
                                        :class="{ copied: copiedColorValue === mapping.value, overridden: mapping.isOverridden }"
                                        :data-hover-label="mapping.expression"
                                        :style="{ '--alias-swatch': mapping.swatch }"
                                        @click.stop="copyPaletteColor(mapping.hexValue)"
                                      >
                                        <i></i>
                                        <span>{{ mapping.name }}</span>
                                        <em>{{ mapping.expression }}</em>
                                        <small v-if="mapping.isOverridden">{{ mapping.overrideKind }}</small>
                                      </button>
                                    </div>
                                    <p v-if="!row.variantGroups && !row.mappings.length" class="component-alias-empty">该组件在当前快照中只有尺寸、资源、文案或旧层变量等非色彩 token，不进入色彩链路表。</p>
                                  </details>
                                </div>
                                <div v-else class="color-chain-list">
                                  <b v-for="(item, itemIndex) in group.items" :key="`${group.title}-${item.name || itemIndex}`">
                                    <i :style="{ background: item.swatch }"></i>
                                    <span>
                                      <strong>{{ item.name }}</strong>
                                      <em>{{ item.value }}</em>
                                      <small v-if="item.chain">{{ item.chain }}</small>
                                    </span>
                                  </b>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div v-else-if="selectedStyleRecipeRows.length" class="style-inventory-list">
                        <details
                          v-for="(item, index) in selectedStyleRecipeRows"
                          :key="`style-inventory-${selectedStyleCategoryId}-${item.title}`"
                          class="style-inventory-row"
                          :open="index === 0"
                        >
                          <summary class="style-inventory-heading">
                            <span>{{ item.title }}</span>
                            <small>{{ item.source }} · {{ styleRecipeStatusLabel(item.status, selectedStyleCategoryId, item) }}</small>
                          </summary>
                          <div class="style-inventory-body">
                            <i
                              class="style-inventory-preview recipe-swatch"
                              :class="recipeSwatchClass"
                              :style="recipeSwatchStyle(item)"
                            >
                              <span>{{ recipeSwatchText(item) }}</span>
                            </i>
                            <div class="style-inventory-meta">
                              <p><strong>value</strong><em>{{ item.value }}</em></p>
                              <p><strong>mapping</strong><em>{{ item.target }}</em></p>
                              <p><strong>evidence</strong><em>{{ item.note }}</em></p>
                            </div>
                          </div>
                        </details>
                      </div>
                      <div v-else class="recipe-placeholder">
                        <span>{{ selectedStyleCategory ? styleCategorySupportLabel(selectedStyleCategory) : '' }}</span>
                        <strong>{{ selectedStyleCategory?.nextStep }}</strong>
                        <p>{{ selectedStyleCategory?.scope }}</p>
                      </div>
                    </section>
                  </template>

                  <template v-else-if="selectedInspectorTab === 'components'">
                    <section class="style-mockup-page component-mockup-page" aria-label="component preview page">
                      <h2>{{ componentDisplayName(selectedComponent) || activeComponentCategory.label }} <span>{{ componentChineseName(selectedComponent) }}</span></h2>
                      <p class="component-title-description">
                        <span>{{ componentUserActionDescription }}</span>
                        <span>{{ componentAvailabilityDescription }}</span>
                      </p>
                    </section>

                    <section class="style-evidence-mockup-card component-evidence-mockup-card" aria-label="component evidence">
                      <div v-if="selectedComponentCategoryId === 'bar'" class="component-doc-section component-preview-section">
                        <strong>示例</strong>
                        <div class="bar-component-preview" :class="`bar-component-preview--${kebabName(selectedComponent)}`">
                          <div v-if="selectedComponent === 'NavigationBar'" :key="navigationExampleRenderKey" class="navigation-doc-examples">
                            <div class="navigation-doc-demo-row">
                              <DuNavigationBar :back="navExampleShowBack" :share="navExampleShowRight" :color="navigationExampleBaseColor" @share="handleNavigationExampleShare">
                                <template v-if="navigationAreaLeft && navigationSlotLeft" #left>
                                  <DuActionButton :name="iconRoom" />
                                </template>
                                <template v-if="navigationAreaLeft && navigationSlotScopedLeft" #scoped-left="{ opacity }">
                                  <span class="navigation-slot-chip">L {{ opacity.toFixed(1) }}</span>
                                </template>
                                <span v-if="navigationAreaDefault && navigationSlotDefault && navExampleShowTitle">标题</span>
                                <div v-if="navigationAreaDefault && navigationSlotDefault && navExampleShowSearch" class="navigation-doc-search-slot">
                                  <DuSearch bg="white" :placeholder="navigationExamplePlaceholders" readonly>
                                    <template #right>
                                      <DuIcon v-if="navExampleShowRight" :icon="iconCamera" />
                                      <DuDivider v-if="navExampleShowRight && navExampleShowRefresh" />
                                      <DuIcon :icon="iconScanning" />
                                    </template>
                                  </DuSearch>
                                </div>
                                <template v-if="navigationAreaDefault && navigationSlotScopedDefault" #scoped-default="{ opacity }">
                                  <span class="navigation-slot-chip">D {{ opacity.toFixed(1) }}</span>
                                </template>
                                <template v-if="navigationAreaRight && navigationSlotRight && navExampleShowRefresh" #right>
                                  <DuActionButton :name="iconRefresh" />
                                </template>
                                <template v-if="navigationAreaRight && navigationSlotScopedRight" #scoped-right="{ opacity }">
                                  <span class="navigation-slot-chip">R {{ opacity.toFixed(1) }}</span>
                                </template>
                              </DuNavigationBar>
                            </div>
                          </div>
                          <div v-else-if="selectedComponent === 'Search'" class="navigation-doc-search-examples">
                            <DuSearch
                              :key="`search-example-${componentExampleState.searchPlaceholder}`"
                              bg="white"
                              :class="{ 'component-example-disabled': componentExampleState.disabled }"
                              :clearable="!componentExampleState.disabled"
                              :placeholder="searchExamplePlaceholder"
                              value=""
                            >
                              <template v-if="componentExampleState.showIcon" #right>
                                <DuIcon :icon="iconCamera" />
                                <DuDivider />
                                <DuIcon :icon="iconScanning" />
                              </template>
                            </DuSearch>
                          </div>
                          <div v-else-if="selectedComponent === 'Tabs'" class="navigation-doc-tabs-examples">
                            <DuTabs
                              :type="componentExampleState.tabsType"
                              size="normal"
                              :value="componentExampleState.tabsValue"
                              @update:value="componentExampleState.tabsValue = $event"
                            >
                              <DuTab name="recommend">推荐</DuTab>
                              <DuTab name="latest">最新</DuTab>
                              <DuTab name="hot">热门</DuTab>
                            </DuTabs>
                          </div>
                          <div v-else-if="selectedComponent === 'SegmentControl'" class="mock-segment-control">
                            <button type="button" class="active">全部</button>
                            <button type="button">已上线</button>
                            <button type="button">待配置</button>
                          </div>
                          <div v-else-if="selectedComponent === 'TabBar'" class="mock-tabbar">
                            <button class="active" type="button">首页</button>
                            <button type="button">发现</button>
                            <button type="button">我的</button>
                          </div>
                          <div v-else-if="selectedComponent === 'BottomBar'" class="mock-bottom-bar">
                            <DuButton text="取消" type="outline" />
                            <DuButton text="确认发布" type="primary" />
                          </div>
                          <div v-else-if="selectedComponent === 'Menu'" class="mock-menu-list">
                            <button type="button" class="active">内容配置</button>
                            <button type="button">投放设置</button>
                            <button type="button">数据复盘</button>
                          </div>
                        </div>
                      </div>

                      <div v-else-if="selectedComponentCategoryId === 'output'" class="component-doc-section component-preview-section">
                        <strong>示例</strong>
                        <div class="output-component-preview" :class="`output-component-preview--${kebabName(selectedComponent)}`">
                          <div v-if="selectedComponent === 'Badge'" class="component-example-inline">
                            <DuBadge :value="componentExampleState.active ? 8 : 0" color="primary" always-show>
                              <span class="badge-anchor">消息</span>
                            </DuBadge>
                            <DuBadge dot color="error" always-show>
                              <span class="badge-anchor">未读</span>
                            </DuBadge>
                            <DuBadge v-if="componentExampleState.showLabel" :value="128" :max="99" color="warning">
                              <span class="badge-anchor">库存</span>
                            </DuBadge>
                          </div>
                          <div v-else-if="selectedComponent === 'Tag'" class="tag-row">
                            <DuTag color="primary" bg="soft" :bordered="componentExampleState.bordered" :round="componentExampleState.rounded" :closeable="componentExampleState.showClose">限时活动</DuTag>
                          </div>
                          <div v-else-if="selectedComponent === 'Empty'" class="component-empty-example">
                            <DuEmpty :image="componentExampleState.showMedia ? imagePreviewSrc : ''" text="暂无可展示内容" :button-text="componentExampleState.showAction ? '去创建' : ''" />
                          </div>
                          <div v-else-if="selectedComponent === 'Image'" class="component-image-examples">
                            <DuImage :src="imagePreviewSrc" width="100%" height="112px" mode="aspectFill" :radius="componentExampleState.imageRadius" />
                            <DuImage v-if="componentExampleState.showMedia" :src="imagePreviewSrc" width="88px" height="88px" mode="aspectFit" :radius="Math.max(0, componentExampleState.imageRadius - 2)" />
                          </div>
                          <div v-else-if="selectedComponent === 'Avatar'" class="component-avatar-examples">
                            <div class="mock-avatar-row">
                              <DuAvatar type="primary" size="large" :bordered="componentExampleState.bordered">DU</DuAvatar>
                              <div><strong>运营账号</strong><span>内容负责人</span></div>
                            </div>
                          </div>
                          <div v-else-if="selectedComponent === 'Time'" class="mock-time-row">
                            <strong>{{ componentExampleState.showLabel ? '2026.06.29' : '20:00' }}</strong><p v-if="componentExampleState.showHelper">Showcase 开始 · 20:00</p>
                          </div>
                          <div v-else-if="selectedComponent === 'PriceStatistic'" class="mock-stat-grid">
                            <b><small v-if="componentExampleState.showLabel">PRICE</small>¥256</b><b><small v-if="componentExampleState.showLabel">SCORE</small>{{ componentExampleState.active ? 98 : 76 }}</b><b><small v-if="componentExampleState.showLabel">RANK</small>Top 5</b>
                          </div>
                          <DuSwiper v-else-if="selectedComponent === 'Swiper'" class="component-swiper-example" :autoplay="componentExampleState.active" indicator-type="bar">
                            <DuSwiperItem>
                              <div class="component-swiper-slide"><strong>主推资源位</strong><p>活动 Banner</p></div>
                            </DuSwiperItem>
                            <DuSwiperItem v-if="componentExampleState.showMedia">
                              <div class="component-swiper-slide"><strong>媒体内容</strong><p>截图 / PV</p></div>
                            </DuSwiperItem>
                          </DuSwiper>
                        </div>
                      </div>

                      <div v-else-if="selectedComponentCategoryId === 'input'" class="component-doc-section component-preview-section">
                        <strong>示例</strong>
                        <div class="input-component-preview" :class="`input-component-preview--${kebabName(selectedComponent)}`">
                          <DuFormItem v-if="selectedComponent === 'FormItem'" :label="componentExampleState.showLabel ? '活动标题' : ''" :required="componentExampleState.active" :tips="componentExampleState.showHelper ? '用于说明字段要求、校验和辅助提示。' : ''">
                            <DuInput value="夏日市集报名" :bordered="componentExampleState.bordered" :disabled="componentExampleState.disabled" />
                          </DuFormItem>
                          <DuInput
                            v-else-if="selectedComponent === 'Input'"
                            value="夏日市集报名"
                            :prefix="componentExampleState.showLabel ? '标题' : ''"
                            :bordered="componentExampleState.bordered"
                            allow-clear
                            :disabled="componentExampleState.disabled"
                          />
                          <div v-else-if="selectedComponent === 'Textarea'" class="component-example-stack component-textarea-examples">
                            <DuTextarea value="默认背景态：适合表单里的长说明、备注、正文。" :show-count="componentExampleState.showCount" :maxlength="componentExampleState.textareaMaxlength" />
                            <DuTextarea value="带边框态：适合独立模块里强调输入区域。" :bordered="componentExampleState.bordered" :show-count="componentExampleState.showCount" :maxlength="componentExampleState.textareaMaxlength" />
                          </div>
                          <div v-else-if="selectedComponent === 'Radio'" class="mock-choice-stack">
                            <DuRadio :checked="componentExampleState.active" :disabled="componentExampleState.disabled" label="公开发布" @update:checked="setComponentExampleValue('active', $event)" />
                          </div>
                          <div v-else-if="selectedComponent === 'Checkbox'" class="mock-choice-stack">
                            <DuCheckbox :checked="componentExampleState.active" :disabled="componentExampleState.disabled" label="同步到首页" @update:checked="setComponentExampleValue('active', $event)" />
                          </div>
                          <div v-else-if="selectedComponent === 'Switch'" class="mock-switch-row">
                            <span>上线后自动推送</span>
                            <DuSwitch :key="`switch-example-${componentExampleState.active}-${componentExampleState.disabled}`" :on="componentExampleState.active" :disabled="componentExampleState.disabled" @update:on="setComponentExampleValue('active', $event)" />
                          </div>
                          <DuInputNumber v-else-if="selectedComponent === 'Stepper'" :value="componentExampleState.stepperValue" :min="0" :max="99" :disabled="componentExampleState.disabled" @update:value="setComponentExampleValue('stepperValue', $event)" />
                          <DuUpload
                            v-else-if="selectedComponent === 'Upload'"
                            :value="componentExampleState.showMedia ? uploadExampleFiles : []"
                            upload-text="上传封面"
                            :badge="componentExampleState.showLabel ? '封面' : ''"
                            :max-count="3"
                            :disabled="componentExampleState.disabled"
                          />
                          <div v-else-if="selectedComponent === 'Tips'" class="mock-tips-card">
                            <strong v-if="componentExampleState.showLabel">字段辅助提示</strong>
                            <p v-if="componentExampleState.showHelper">用于解释输入规则、风险或下一步动作，不替代错误反馈。</p>
                          </div>
                          <DuForm v-else-if="selectedComponent === 'Group'" class="mock-form-group" layout="vertical" label-size="72px" :class="{ 'mock-form-group--plain': !componentExampleState.bordered }">
                            <DuFormItem :label="componentExampleState.showLabel ? '标题' : ''"><DuInput value="同一组相关字段" bordered /></DuFormItem>
                            <DuFormItem :label="componentExampleState.showLabel ? '开关' : ''"><DuSwitch :on="true" /></DuFormItem>
                          </DuForm>
                          <div v-else-if="selectedComponent === 'DateTimePicker'" class="component-example-stack">
                            <DuButton text="选择日期时间" type="primary" size="normal" @click="openComponentExamplePopup('datetime-picker')" />
                            <small v-if="componentExampleState.showHelper" class="component-example-helper">点按钮弹出 DuCalendar;showTimePicker 由控制面板勾选控制;确认后会回填到下方"当前值"。</small>
                            <strong class="component-example-value">当前值:{{ componentExampleState.calendarSelectedDate || "未设置" }}{{ componentExampleState.calendarShowTimePicker ? " " + (componentExampleState.calendarSelectedTime || "00:00") : "" }}</strong>
                          </div>
                          <DuRate
                            v-else-if="selectedComponent === 'Rate'"
                            :value="componentExampleState.rateValue"
                            size="medium"
                            color="primary"
                            :disabled="componentExampleState.disabled"
                            @update:value="setComponentExampleValue('rateValue', $event)"
                          />
                          <DuCascader
                            v-else-if="selectedComponent === 'Cascader'"
                            :title="componentExampleState.showLabel ? '投放范围' : '请选择'"
                            :options="cascaderExampleOptions"
                            :value="['east', 'shanghai', 'pudong']"
                            show-search
                          >
                            <template #default="{ open }">
                              <button v-if="componentExampleState.showAction" class="mock-picker-trigger" type="button" @click="open">
                                <span>{{ componentExampleState.showLabel ? '投放范围' : '请选择' }}</span>
                                <strong>华东 / 上海 / 浦东</strong>
                              </button>
                            </template>
                          </DuCascader>
                          <DuSelect v-else-if="selectedComponent === 'Select'" :title="componentExampleState.showHelper ? '发布类型' : '请选择'" :options="brandPublishOptions" value="notice">
                            <template #default="{ open }">
                              <button class="mock-picker-trigger" type="button" @click="open">
                                <span>{{ componentExampleState.showLabel ? '发布类型' : '请选择' }}</span>
                                <strong>公告</strong>
                              </button>
                            </template>
                          </DuSelect>
                        </div>
                      </div>

                      <div v-else-if="selectedComponentCategoryId === 'feedback'" class="component-doc-section component-preview-section">
                        <strong>示例</strong>
                        <div class="feedback-component-preview" :class="`feedback-component-preview--${kebabName(selectedComponent)}`">
                          <div v-if="selectedComponent === 'NoticeBar'" class="component-example-stack">
                            <DuNoticeBar
                              :type="componentExampleState.noticeType"
                              :color="componentExampleState.noticeColor"
                              text="重要配置即将生效，请检查发布范围。"
                              :link-text="componentExampleState.showAction ? '知道了' : ''"
                              :closeable="componentExampleState.showClose"
                            />
                          </div>
                          <div v-else-if="selectedComponent === 'Snackbar'" class="component-example-stack">
                            <DuSnackbar
                              :show="true"
                              :show-close="componentExampleState.showClose"
                              :left-icon="componentExampleState.showIcon ? 'success' : ''"
                              :duration="0"
                              :show-action-btn="componentExampleState.showAction"
                              :button-props="{ text: '查看', color: componentExampleState.snackbarButtonColor, type: 'primary', size: 'mini', arrowRight: false }"
                            >
                              发布成功
                            </DuSnackbar>
                          </div>
                          <div v-else-if="selectedComponent === 'Toast'" class="mock-toast-bubble">{{ componentExampleState.showIcon ? '✓ ' : '' }}{{ componentExampleState.active ? '发布成功' : '待触发' }}</div>
                          <div v-else-if="selectedComponent === 'Dialog'" class="mock-dialog-card">
                            <strong>确认提交？</strong>
                            <p v-if="componentExampleState.showHelper">这类反馈会打断用户，需要明确确认/取消。</p>
                            <div v-if="componentExampleState.showAction"><button type="button">取消</button><button type="button">确认</button></div>
                          </div>
                          <div v-else-if="selectedComponent === 'Popup'" class="mock-popup-sheet">
                            <strong>底部弹层</strong>
                            <p>DuPopup 承载筛选、详情或二次操作；文档页用静态壳展示，避免遮住整个 demo。</p>
                            <DuButton v-if="componentExampleState.showAction" size="small" type="secondary">打开筛选</DuButton>
                          </div>
                          <div v-else-if="selectedComponent === 'ShareSheet'" class="mock-share-sheet">
                            <button v-if="componentExampleState.showAction" type="button">{{ componentExampleState.showIcon ? '↗ ' : '' }}微信</button>
                            <button v-if="componentExampleState.showAction" type="button">{{ componentExampleState.showIcon ? '↗ ' : '' }}朋友圈</button>
                            <button v-if="componentExampleState.showAction" type="button">{{ componentExampleState.showIcon ? '↗ ' : '' }}复制链接</button>
                          </div>
                          <div v-else-if="selectedComponent === 'ResultPage'" class="mock-result-page compact-result">
                            <i></i><strong>{{ componentExampleState.active ? '提交成功' : '提交失败' }}</strong><p v-if="componentExampleState.showAction">结果页用于承接流程完成后的下一步。</p>
                          </div>
                          <div v-else-if="selectedComponent === 'Spin'" class="mock-spin-inline">
                            <i v-if="componentExampleState.active"></i><span v-if="componentExampleState.showLabel">加载中</span>
                          </div>
                          <DuSkeleton v-else-if="selectedComponent === 'Skeleton'" :loading="componentExampleState.active">
                            <template #template>
                              <div class="skeleton-demo">
                                <DuSkeletonRectangle width="100%" :aspect-ratio="4" />
                                <DuSkeletonParagraph row-width="100%" />
                                <DuSkeletonAvatar />
                              </div>
                            </template>
                          </DuSkeleton>
                        </div>
                      </div>

                      <div class="component-doc-section">
                        <strong>可编辑属性</strong>
                        <div v-if="selectedComponent === 'NavigationBar'" class="component-editable-controls">
                          <div class="component-editable-group">
                            <label>
                              <span>left 区域</span>
                              <DuSwitch :on="navigationAreaLeft" @update:on="navigationAreaLeft = $event" />
                            </label>
                            <div v-if="navigationAreaLeft" class="component-editable-children">
                              <label>
                                <span>back prop：返回按钮</span>
                                <DuSwitch :on="navExampleShowBack" @update:on="navExampleShowBack = $event" />
                              </label>
                              <label>
                                <span>left slot：首页按钮</span>
                                <DuSwitch :on="navigationSlotLeft" @update:on="navigationSlotLeft = $event" />
                              </label>
                              <label>
                                <span>scoped-left：opacity 内容</span>
                                <DuSwitch :on="navigationSlotScopedLeft" @update:on="navigationSlotScopedLeft = $event" />
                              </label>
                            </div>
                          </div>
                          <div class="component-editable-group">
                            <label>
                              <span>default 区域</span>
                              <DuSwitch :on="navigationAreaDefault" @update:on="navigationAreaDefault = $event" />
                            </label>
                            <div v-if="navigationAreaDefault" class="component-editable-children">
                              <label>
                                <span>default slot：标题</span>
                                <DuSwitch :on="navExampleShowTitle" @update:on="navExampleShowTitle = $event" />
                              </label>
                              <label>
                                <span>default slot：Search</span>
                                <DuSwitch :on="navExampleShowSearch" @update:on="navExampleShowSearch = $event" />
                              </label>
                              <label>
                                <span>scoped-default：opacity 内容</span>
                                <DuSwitch :on="navigationSlotScopedDefault" @update:on="navigationSlotScopedDefault = $event" />
                              </label>
                            </div>
                          </div>
                          <div class="component-editable-group">
                            <label>
                              <span>right 区域</span>
                              <DuSwitch :on="navigationAreaRight" @update:on="navigationAreaRight = $event" />
                            </label>
                            <div v-if="navigationAreaRight" class="component-editable-children">
                              <label>
                                <span>right slot：刷新按钮</span>
                                <DuSwitch :on="navExampleShowRefresh" @update:on="navExampleShowRefresh = $event" />
                              </label>
                              <label>
                                <span>scoped-right：opacity 内容</span>
                                <DuSwitch :on="navigationSlotScopedRight" @update:on="navigationSlotScopedRight = $event" />
                              </label>
                              <label>
                                <span>share prop：分享入口</span>
                                <DuSwitch :on="navExampleShowRight" @update:on="navExampleShowRight = $event" />
                              </label>
                            </div>
                          </div>
                          <div class="component-editable-group">
                            <label>
                              <span>
                                <b>color prop：背景色</b>
                                <em>string；默认 default，按 DangoUI 色板名切换。</em>
                              </span>
                              <div class="component-editable-dropdown" @click.stop>
                                <button class="component-editable-select-button" type="button" @click="toggleEditableSelect('navigation-color')">
                                  {{ editableOptionLabel(navigationColorOptions, navExampleColor) }}
                                </button>
                                <div v-if="openEditableSelectKey === 'navigation-color'" class="component-editable-menu">
                                  <button
                                    v-for="option in navigationColorOptions"
                                    :key="option.value"
                                    type="button"
                                    :class="{ active: option.value === navExampleColor }"
                                    @click="setNavigationExampleColor(option.value)"
                                  >
                                    {{ option.label }}
                                  </button>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                        <div v-else-if="componentEditableGroups.length" class="component-editable-controls">
                          <div v-for="group in componentEditableGroups" :key="group.title" class="component-editable-group">
                            <strong class="component-editable-group-title">{{ group.title }}</strong>
                            <div class="component-editable-children">
                              <label v-for="item in group.items" :key="item.key">
                                <span>
                                  <b>{{ item.label }}</b>
                                  <em v-if="item.hint">{{ item.hint }}</em>
                                </span>
                                <DuSwitch
                                  v-if="item.control === 'switch'"
                                  :on="componentExampleState[item.key]"
                                  @update:on="componentExampleState[item.key] = $event"
                                />
                                <div
                                  v-else-if="item.control === 'select'"
                                  class="component-editable-dropdown"
                                  @click.stop
                                >
                                  <button class="component-editable-select-button" type="button" @click="toggleEditableSelect(`component-${item.key}`)">
                                    {{ editableOptionLabel(item.options, componentExampleState[item.key]) }}
                                  </button>
                                  <div v-if="openEditableSelectKey === `component-${item.key}`" class="component-editable-menu">
                                    <button
                                      v-for="option in item.options"
                                      :key="option.value"
                                      type="button"
                                      :class="{ active: option.value === componentExampleState[item.key] }"
                                      @click="setComponentExampleValue(item.key, option.value)"
                                    >
                                      {{ option.label }}
                                    </button>
                                  </div>
                                </div>
                                <input
                                  v-else-if="item.control === 'number'"
                                  :value="componentExampleState[item.key]"
                                  class="component-editable-input"
                                  type="number"
                                  :min="item.min"
                                  :max="item.max"
                                  :step="item.step || 1"
                                  @input="setComponentExampleValue(item.key, Number($event.target.value))"
                                >
                              </label>
                            </div>
                          </div>
                        </div>
                        <div v-else class="component-editable-map">
                          <span v-for="field in editableFields" :key="field">
                            <b>{{ field }}</b>
                            <em>{{ editableFieldHint(field) }}</em>
                          </span>
                        </div>
                      </div>

                      <details class="component-doc-section component-code-details">
                        <summary>代码 / Schema</summary>
                        <p v-if="!selectedTokens.length">当前组件没有在 DangoUI catalog 暴露专属 token；通常通过语义色、局部 CSS 或业务适配控制。</p>
                        <div v-else class="token-grid component-token-grid">
                          <button
                            v-for="token in visibleTokens"
                            :key="`component-page-${token.name}`"
                            class="token"
                            :class="{ active: selectedTokenName === token.name }"
                            type="button"
                            @click="selectToken(token.name)"
                          >
                            <i class="swatch" :style="{ background: token.value }"></i>
                            <span><strong>{{ token.name }}</strong><span>{{ token.usage }}</span></span>
                            <span>{{ token.value }}</span>
                          </button>
                        </div>
                        <button v-if="selectedTokens.length > tokenPreviewLimit" class="collapse-button component-collapse-button" type="button" @click="tokensExpanded = !tokensExpanded">
                          {{ tokensExpanded ? "收起 tokens" : `展开全部 ${selectedTokens.length} 个 tokens` }}
                        </button>
                        <pre class="component-schema-preview">{{ schemaPreview }}</pre>
                      </details>
                    </section>
                  </template>

                  <template v-else-if="selectedTemplateId === 're1999-home'">
                    <div class="click-target re1999-hero" :class="{ selected: selectedInstanceId === pageNodeId('HeroHeader') }" :data-node-id="pageNodeId('HeroHeader')" @click="selectInstance(pageNodeId('HeroHeader'), $event)">
                      <span class="tag">HeroHeader · 图片层 Image</span>
                      <div class="re1999-hero-copy">
                        <p>THE STORM IS COMING</p>
                        <img class="re1999-hero-title" src="/assets/re1999-logo.png" alt="重返未来：1999" />
                        <span>{{ selectedStyle.notice }}</span>
                      </div>
                    </div>
                    <div class="click-target re1999-home-distribution" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <button type="button" :class="{ active: re1999HomePanel === 'news' }" @click.stop="openRe1999HomePanel('news')">
                        <strong>NEWS</strong>
                        <span>暴雨情报</span>
                      </button>
                      <button type="button" :class="{ active: re1999HomePanel === 'archive' }" @click.stop="openRe1999HomePanel('archive')">
                        <strong>ARCHIVE</strong>
                        <span>神秘学家档案</span>
                      </button>
                      <button type="button" :class="{ active: re1999HomePanel === 'media' }" @click.stop="openRe1999HomePanel('media')">
                        <strong>MEDIA</strong>
                        <span>影像资料</span>
                      </button>
                    </div>
                    <div class="click-target re1999-home-gallery" :class="[{ selected: selectedInstanceId === pageNodeId('Image') }, `re1999-home-gallery--${re1999HomePanel}`]" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <i></i>
                      <div>
                        <p>{{ re1999HomePanels[re1999HomePanel].galleryKicker }}</p>
                        <strong>{{ re1999HomePanels[re1999HomePanel].galleryTitle }}</strong>
                        <span>{{ re1999HomePanels[re1999HomePanel].galleryBody }}</span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 're1999-news'">
                    <div class="click-target re1999-news-feature" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div class="re1999-news-poster" aria-hidden="true">
                        <img src="/assets/brand-assets/re1999/img/News.png" alt="NEWS" />
                        <strong>暴雨情报记录</strong>
                      </div>
                    </div>
                    <div class="click-target re1999-news-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs :value="re1999NewsTab" type="tag" size="normal" @update:value="re1999NewsTab = $event">
                        <DuTab name="news">最新</DuTab>
                        <DuTab name="notice">公告</DuTab>
                        <DuTab name="event">活动</DuTab>
                        <DuTab name="media">新闻</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target re1999-news-list" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <article>
                        <time>06.11</time>
                        <div>
                          <strong>{{ re1999NewsCopy[re1999NewsTab].items[0].title }}</strong>
                          <p>{{ re1999NewsCopy[re1999NewsTab].items[0].body }}</p>
                        </div>
                      </article>
                      <article>
                        <time>06.04</time>
                        <div>
                          <strong>{{ re1999NewsCopy[re1999NewsTab].items[1].title }}</strong>
                          <p>{{ re1999NewsCopy[re1999NewsTab].items[1].body }}</p>
                        </div>
                      </article>
                      <article>
                        <time>05.30</time>
                        <div>
                          <strong>{{ re1999NewsCopy[re1999NewsTab].items[2].title }}</strong>
                          <p>{{ re1999NewsCopy[re1999NewsTab].items[2].body }}</p>
                        </div>
                      </article>
                    </div>
                    <div class="click-target re1999-news-actions" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag :color="re1999NewsTag === 'notice' ? 'primary' : 'default'" round @click="re1999NewsTag = 'notice'">公告</DuTag>
                        <DuTag :color="re1999NewsTag === 'role' ? 'primary' : 'default'" round @click="re1999NewsTag = 'role'">角色</DuTag>
                        <DuTag :color="re1999NewsTag === 'event' ? 'primary' : 'default'" round @click="re1999NewsTag = 'event'">活动</DuTag>
                      </div>
                      <p class="demo-interaction-feedback">{{ re1999NewsTagCopy[re1999NewsTag] }}</p>
                      <DuButton text="查看更多 NEWS" type="outline" :data-node-id="pageNodeId('Button')" @click.stop="selectInstance(pageNodeId('Button'), $event)" />
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 're1999-media'">
                    <div class="click-target re1999-media-hero" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div class="re1999-media-title">
                        <p>MEDIA ROOM</p>
                        <strong>暴雨影像资料室</strong>
                        <span>集中展示 PV、壁纸、访谈与图库，让风格化图片资产成为页面主体。</span>
                      </div>
                    </div>
                    <div class="click-target re1999-media-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs :value="re1999MediaTab" type="tag" size="normal" @update:value="re1999MediaTab = $event">
                        <DuTab name="pv">PV</DuTab>
                        <DuTab name="gallery">图库</DuTab>
                        <DuTab name="interview">访谈</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target re1999-media-grid" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <article class="featured">
                        <i></i>
                        <div>
                          <p>{{ re1999MediaCopy[re1999MediaTab].kicker }}</p>
                          <strong>{{ re1999MediaCopy[re1999MediaTab].title }}</strong>
                        </div>
                      </article>
                      <article>
                        <i></i>
                        <strong>{{ re1999MediaCopy[re1999MediaTab].items[0] }}</strong>
                      </article>
                      <article>
                        <i></i>
                        <strong>{{ re1999MediaCopy[re1999MediaTab].items[1] }}</strong>
                      </article>
                    </div>
                    <div class="click-target re1999-media-notes" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <div>
                        <p>ASSET NOTES</p>
                        <strong>{{ re1999MediaCopy[re1999MediaTab].noteTitle }}</strong>
                        <span>{{ re1999MediaCopy[re1999MediaTab].noteBody }}</span>
                      </div>
                      <div class="tag-row">
                        <DuTag color="primary" round>{{ re1999MediaCopy[re1999MediaTab].tags[0] }}</DuTag>
                        <DuTag color="default" round>{{ re1999MediaCopy[re1999MediaTab].tags[1] }}</DuTag>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 're1999-archive'">
                    <div class="click-target re1999-character-panel" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image · 角色档案面板</span>
                      <div class="re1999-character-copy">
                        <p>ARCANIST FILE</p>
                        <strong>维尔汀</strong>
                        <span>时代的旁观者与记录者，档案页承接角色身份、阵营和叙事摘要。</span>
                        <div class="re1999-character-meta" aria-label="角色档案信息">
                          <small>No. 1999</small>
                          <small>6★ Arcanist</small>
                          <small>Timekeeper</small>
                        </div>
                        <div class="re1999-case-stamp" aria-label="暴雨档案时间戳">
                          <b>STORM ARCHIVE</b>
                          <span>1999.12.31 / 23:59</span>
                        </div>
                      </div>
                    </div>
                    <div class="click-target re1999-file-grid" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <article>
                        <b>时代</b>
                        <small>20 世纪末 / 伦敦</small>
                      </article>
                      <article>
                        <b>身份</b>
                        <small>Timekeeper</small>
                      </article>
                      <article>
                        <b>介质</b>
                        <small>档案 / 影像 / 访谈</small>
                      </article>
                      <article>
                        <b>状态</b>
                        <small>暴雨观测中</small>
                      </article>
                    </div>
                    <div class="click-target re1999-archive-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'), $event)">
                      <span class="tag">Badge</span>
                      <DuBadge value="6★" color="primary" always-show>
                        <span class="badge-anchor">档案等级</span>
                      </DuBadge>
                      <DuTabs :value="re1999ArchiveTab" type="tag" size="normal" :data-node-id="pageNodeId('Tabs')" @update:value="re1999ArchiveTab = $event" @click.stop="selectInstance(pageNodeId('Tabs'), $event)">
                        <DuTab name="profile">档案</DuTab>
                        <DuTab name="story">故事</DuTab>
                      </DuTabs>
                      <p class="demo-interaction-feedback">{{ re1999ArchiveTab === 'profile' ? '展示角色身份、星级与档案摘要。' : '切换到故事线索、访谈片段与暴雨记录。' }}</p>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 're1999-publish'">
                    <div class="form-demo re1999-publish-form">
                      <div class="publish-template-tip">
                        <strong>TIPS</strong>
                        <span>发布内容会进入首页分发侧，优先补全标题、正文和封面。</span>
                      </div>
                      <section class="group publish-editor-card">
                        <div class="click-target publish-cover-upload" :class="{ selected: selectedInstanceId === pageNodeId('Upload') }" :data-node-id="pageNodeId('Upload')" @click="selectInstance(pageNodeId('Upload'), $event)">
                          <span class="tag">Upload</span>
                          <DuUpload :value="[]" upload-text="添加封面" />
                        </div>
                        <div class="click-target publish-title-field" :class="{ selected: selectedInstanceId === pageNodeId('Input') }" :data-node-id="pageNodeId('Input')" @click="selectInstance(pageNodeId('Input'), $event)">
                          <span class="tag">Input</span>
                          <DuInput value="暴雨情报更新" placeholder="填写清晰的标题" allow-clear />
                        </div>
                        <div class="click-target publish-body-field" :class="{ selected: selectedInstanceId === pageNodeId('Textarea') }" :data-node-id="pageNodeId('Textarea')" @click="selectInstance(pageNodeId('Textarea'), $event)">
                          <span class="tag">Textarea</span>
                          <DuTextarea value="填写公告正文、活动说明或档案摘要。发布侧只换 token，不强行套展示侧纹理。" show-count :maxlength="120" />
                        </div>
                        <div class="publish-editor-meta">
                          <div class="click-target control-grid control-grid--inline-short" :class="{ selected: selectedInstanceId === pageNodeId('Radio') }" :data-node-id="pageNodeId('Radio')" @click="selectInstance(pageNodeId('Radio'), $event)">
                            <span class="tag">Radio</span>
                            <DuRadio checked label="公开" /><DuRadio label="草稿" />
                          </div>
                          <DuTag color="primary" round>AI 智能排版</DuTag>
                        </div>
                      </section>
                      <section class="group publish-form-card">
                        <div class="click-target publish-list-row" :class="{ selected: selectedInstanceId === pageNodeId('Select') }" :data-node-id="pageNodeId('Select')" @pointerdown.capture="syncMockupPopupBounds('Select')" @click="selectInstance(pageNodeId('Select'), $event)">
                          <span class="tag">Select</span>
                          <span>*情报类型</span>
                          <DuSelect title="请选择类型" :options="re1999PublishOptions" :value="publishSelectValue" :popup-style="mockupSelectPopupStyle" @update:value="publishSelectValue = $event" />
                        </div>
                        <div class="click-target publish-list-row re1999-publish-switch" :class="{ selected: selectedInstanceId === pageNodeId('Switch') }" :data-node-id="pageNodeId('Switch')" @click="selectInstance(pageNodeId('Switch'), $event)">
                          <span class="tag">Switch</span>
                          <span>同步到官网首页分发侧</span>
                          <DuSwitch :on="publishSyncOn" @update:on="publishSyncOn = $event" @click.stop />
                        </div>
                        <div
                          class="click-target publish-list-row"
                          :class="{ selected: selectedInstanceId === pageNodeId('DateTimePicker') }"
                          :data-node-id="pageNodeId('DateTimePicker')"
                          @pointerdown.capture="syncMockupPopupBounds('DateTimePicker')"
                          @click="selectInstance(pageNodeId('DateTimePicker'), $event); calendarDateTimeVisible = true"
                        >
                          <span class="tag">DateTimePicker · Calendar showTimePicker</span>
                          <span>定时发布</span>
                          <strong>{{ calendarDateTimeText }}</strong>
                        </div>
                        <DuCalendar
                          v-model:visible="calendarDateTimeVisible"
                          title="定时发布"
                          type="single"
                          :selected-date="calendarSelectedDate"
                          show-time-picker
                          :time-step="5"
                          @confirm="handleCalendarDateTimeConfirm"
                        />
                      </section>
                      <div class="click-target publish-bottom-actions" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                        <span class="tag">Button</span>
                        <div class="button-row">
                          <DuButton text="保存草稿" type="outline" />
                          <DuButton text="提交发布" type="primary" />
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-publish' || selectedTemplateId === 'hpma-publish'">
                    <div class="form-demo brand-publish-form">
                      <div class="publish-template-tip">
                        <strong>TIPS</strong>
                        <span>{{ currentBrandPublishCopy.switchLabel }}，发布前先补齐标题、正文和封面。</span>
                      </div>
                      <section class="group publish-editor-card">
                        <div class="click-target publish-cover-upload" :class="{ selected: selectedInstanceId === pageNodeId('Upload') }" :data-node-id="pageNodeId('Upload')" @click="selectInstance(pageNodeId('Upload'), $event)">
                          <span class="tag">Upload</span>
                          <DuUpload :value="[]" upload-text="添加封面" />
                        </div>
                        <div class="click-target publish-title-field" :class="{ selected: selectedInstanceId === pageNodeId('Input') }" :data-node-id="pageNodeId('Input')" @click="selectInstance(pageNodeId('Input'), $event)">
                          <span class="tag">Input</span>
                          <DuInput :value="currentBrandPublishCopy.inputValue" placeholder="填写清晰的标题" allow-clear />
                        </div>
                        <div class="click-target publish-body-field" :class="{ selected: selectedInstanceId === pageNodeId('Textarea') }" :data-node-id="pageNodeId('Textarea')" @click="selectInstance(pageNodeId('Textarea'), $event)">
                          <span class="tag">Textarea</span>
                          <DuTextarea :value="currentBrandPublishCopy.textareaValue" show-count :maxlength="120" />
                        </div>
                        <div class="publish-editor-meta">
                          <div class="click-target control-grid control-grid--inline-short" :class="{ selected: selectedInstanceId === pageNodeId('Radio') }" :data-node-id="pageNodeId('Radio')" @click="selectInstance(pageNodeId('Radio'), $event)">
                            <span class="tag">Radio</span>
                            <DuRadio checked label="公开" /><DuRadio label="草稿" />
                          </div>
                          <DuTag color="primary" round>AI 智能排版</DuTag>
                        </div>
                      </section>
                      <section class="group publish-form-card">
                        <div class="click-target publish-list-row" :class="{ selected: selectedInstanceId === pageNodeId('Select') }" :data-node-id="pageNodeId('Select')" @pointerdown.capture="syncMockupPopupBounds('Select')" @click="selectInstance(pageNodeId('Select'), $event)">
                          <span class="tag">Select</span>
                          <span>*发布类型</span>
                          <DuSelect title="请选择类型" :options="brandPublishOptions" :value="publishSelectValue" :popup-style="mockupSelectPopupStyle" @update:value="publishSelectValue = $event" />
                        </div>
                        <div class="click-target publish-list-row brand-publish-switch" :class="{ selected: selectedInstanceId === pageNodeId('Switch') }" :data-node-id="pageNodeId('Switch')" @click="selectInstance(pageNodeId('Switch'), $event)">
                          <span class="tag">Switch</span>
                          <span>{{ currentBrandPublishCopy.switchLabel }}</span>
                          <DuSwitch :on="publishSyncOn" @update:on="publishSyncOn = $event" @click.stop />
                        </div>
                        <div
                          class="click-target publish-list-row"
                          :class="{ selected: selectedInstanceId === pageNodeId('DateTimePicker') }"
                          :data-node-id="pageNodeId('DateTimePicker')"
                          @pointerdown.capture="syncMockupPopupBounds('DateTimePicker')"
                          @click="selectInstance(pageNodeId('DateTimePicker'), $event); calendarDateTimeVisible = true"
                        >
                          <span class="tag">DateTimePicker · Calendar showTimePicker</span>
                          <span>定时发布</span>
                          <strong>{{ calendarDateTimeText }}</strong>
                        </div>
                        <DuCalendar
                          v-model:visible="calendarDateTimeVisible"
                          title="定时发布"
                          type="single"
                          :selected-date="calendarSelectedDate"
                          show-time-picker
                          :time-step="5"
                          @confirm="handleCalendarDateTimeConfirm"
                        />
                      </section>
                      <div class="click-target publish-bottom-actions" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                        <span class="tag">Button</span>
                        <div class="button-row">
                          <DuButton text="保存草稿" type="outline" />
                          <DuButton text="提交发布" type="primary" />
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-home'">
                    <div class="click-target hpma-hero" :class="{ selected: selectedInstanceId === pageNodeId('HeroHeader') }" :data-node-id="pageNodeId('HeroHeader')" @click="selectInstance(pageNodeId('HeroHeader'), $event)">
                      <span class="tag">HeroHeader · 图片层 Image</span>
                      <img class="hpma-hero-slogan" src="/assets/hpma-slogan.png" alt="欢迎回到霍格沃茨" />
                      <span>{{ selectedStyle.notice }}</span>
                    </div>
                    <div class="click-target hpma-home-distribution" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <button type="button" :class="{ active: hpmaHomePanel === 'news' }" @click.stop="openHpmaHomePanel('news')">
                        <span>NEWS</span>
                        <small>资讯活动</small>
                      </button>
                      <button type="button" :class="{ active: hpmaHomePanel === 'cards' }" @click.stop="openHpmaHomePanel('cards')">
                        <span>SPELL</span>
                        <small>魔咒伙伴</small>
                      </button>
                      <button type="button" :class="{ active: hpmaHomePanel === 'media' }" @click.stop="openHpmaHomePanel('media')">
                        <span>MEDIA</span>
                        <small>视听中心</small>
                      </button>
                    </div>
                    <div class="click-target hpma-home-gallery" :class="[{ selected: selectedInstanceId === pageNodeId('Image') }, `hpma-home-gallery--${hpmaHomePanel}`]" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <i></i>
                      <div>
                        <small>{{ hpmaHomePanels[hpmaHomePanel].galleryKicker }}</small>
                        <strong>{{ hpmaHomePanels[hpmaHomePanel].galleryTitle }}</strong>
                        <p>{{ hpmaHomePanels[hpmaHomePanel].galleryBody }}</p>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-news'">
                    <div class="click-target hpma-news-feature" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div class="hpma-news-poster" aria-hidden="true">
                        <span>SEASON</span>
                        <strong>魔法觉醒赛季更新</strong>
                      </div>
                      <p>轮播位保留暗场大图、金线框和活动标题，适合接真实运营 banner。</p>
                    </div>
                    <div class="click-target hpma-news-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs :value="hpmaNewsTab" type="tag" size="normal" @update:value="hpmaNewsTab = $event">
                        <DuTab name="event">活动</DuTab>
                        <DuTab name="news">新闻</DuTab>
                        <DuTab name="notice">公告</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target hpma-news-list" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <article>
                        <time>06.12</time>
                        <div>
                          <strong>{{ hpmaNewsCopy[hpmaNewsTab].items[0].title }}</strong>
                          <p>{{ hpmaNewsCopy[hpmaNewsTab].items[0].body }}</p>
                        </div>
                      </article>
                      <article>
                        <time>06.08</time>
                        <div>
                          <strong>{{ hpmaNewsCopy[hpmaNewsTab].items[1].title }}</strong>
                          <p>{{ hpmaNewsCopy[hpmaNewsTab].items[1].body }}</p>
                        </div>
                      </article>
                    </div>
                    <div class="click-target hpma-news-actions" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag :color="hpmaNewsTag === 'event' ? 'primary' : 'default'" round @click="hpmaNewsTag = 'event'">限时活动</DuTag>
                        <DuTag :color="hpmaNewsTag === 'season' ? 'primary' : 'default'" round @click="hpmaNewsTag = 'season'">赛季情报</DuTag>
                      </div>
                      <p class="demo-interaction-feedback">{{ hpmaNewsTag === 'event' ? '当前筛选限时活动，列表保留活动入口。' : '当前筛选赛季情报，列表切换到更新与卡牌说明。' }}</p>
                      <DuButton text="查看更多资讯" type="outline" />
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-cards'">
                    <div class="click-target hpma-card-media" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <i class="hpma-card-asset" aria-hidden="true"></i>
                      <div class="hpma-spell-orbit" aria-hidden="true">
                        <i></i><i></i><i></i>
                      </div>
                      <strong>魔咒图鉴</strong>
                      <p>图鉴页用卡面、轨迹光效和稀有度标签区别于首页/资讯页。</p>
                    </div>
                    <div class="click-target hpma-spell-grid" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <article>
                        <b>Expelliarmus</b>
                        <small>魔咒</small>
                      </article>
                      <article>
                        <b>Golden Snitch</b>
                        <small>召唤</small>
                      </article>
                    </div>
                    <div class="click-target hpma-rarity-row" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'), $event)">
                      <span class="tag">Badge</span>
                      <DuBadge value="LEGEND" color="primary" always-show>
                        <span class="badge-anchor">稀有度</span>
                      </DuBadge>
                      <DuTabs :value="hpmaCardTab" type="tag" size="normal" :data-node-id="pageNodeId('Tabs')" @update:value="hpmaCardTab = $event" @click.stop="selectInstance(pageNodeId('Tabs'), $event)">
                        <DuTab name="spell">魔咒</DuTab>
                        <DuTab name="partner">伙伴</DuTab>
                      </DuTabs>
                      <p class="demo-interaction-feedback">{{ hpmaCardTab === 'spell' ? '当前查看魔咒卡牌。' : '当前查看伙伴卡牌。' }}</p>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-media'">
                    <div class="click-target hpma-media-hero" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <i class="hpma-media-play" aria-hidden="true"></i>
                      <p>{{ hpmaMediaCopy[hpmaMediaTab].kicker }}</p>
                      <strong>{{ hpmaMediaCopy[hpmaMediaTab].title }}</strong>
                    </div>
                    <div class="click-target hpma-media-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs :value="hpmaMediaTab" type="tag" size="normal" @update:value="hpmaMediaTab = $event">
                        <DuTab name="video">影像</DuTab>
                        <DuTab name="wallpaper">壁纸</DuTab>
                        <DuTab name="feature">专题</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target hpma-media-grid" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <article v-for="item in hpmaMediaCopy[hpmaMediaTab].items" :key="item">
                        <i></i>
                        <strong>{{ item }}</strong>
                      </article>
                    </div>
                    <div class="click-target hpma-media-notes" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <strong>{{ hpmaMediaCopy[hpmaMediaTab].noteTitle }}</strong>
                      <p>{{ hpmaMediaCopy[hpmaMediaTab].noteBody }}</p>
                      <div class="tag-row">
                        <DuTag v-for="tag in hpmaMediaCopy[hpmaMediaTab].tags" :key="tag" color="primary" round>{{ tag }}</DuTag>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-home'">
                    <div class="click-target czn-hero" :class="{ selected: selectedInstanceId === pageNodeId('HeroHeader') }" :data-node-id="pageNodeId('HeroHeader')" @click="selectInstance(pageNodeId('HeroHeader'), $event)">
                      <span class="tag">HeroHeader · 图片层 Image</span>
                      <p>CHAOS ZERO NIGHTMARE</p>
                      <img class="czn-hero-slogan" src="/assets/czn-sm-add-slogan.png" alt="卡厄思梦境现已正式上线" />
                      <span>{{ selectedStyle.notice }}</span>
                    </div>
                    <div class="click-target czn-home-distribution" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <button type="button" :class="{ active: cznHomePanel === 'forward' }" @click.stop="openCznHomePanel('forward')">
                        <span>FORWARD</span>
                        <small>前瞻情报</small>
                      </button>
                      <button type="button" :class="{ active: cznHomePanel === 'character' }" @click.stop="openCznHomePanel('character')">
                        <span>CHARACTER</span>
                        <small>角色档案</small>
                      </button>
                      <button type="button" :class="{ active: cznHomePanel === 'media' }" @click.stop="openCznHomePanel('media')">
                        <span>VISUAL</span>
                        <small>图像资料</small>
                      </button>
                    </div>
                    <div class="click-target czn-home-gallery" :class="[{ selected: selectedInstanceId === pageNodeId('Image') }, `czn-home-gallery--${cznHomePanel}`]" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <i></i>
                      <div>
                        <small>{{ cznHomePanels[cznHomePanel].galleryKicker }}</small>
                        <strong>{{ cznHomePanels[cznHomePanel].galleryTitle }}</strong>
                        <p>{{ cznHomePanels[cznHomePanel].galleryBody }}</p>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-forward'">
                    <div class="click-target czn-forward-card" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div class="czn-swiper-frame" aria-hidden="true">
                        <div class="czn-swiper-window">
                          <div class="czn-swiper-track">
                            <div class="czn-slide is-prev">
                              <img src="/assets/czn-forward-img1.jpg" alt="" />
                            </div>
                            <div class="czn-slide is-active">
                              <img src="/assets/czn-forward-img1.jpg" alt="" />
                              <div class="czn-forward-txtbox">
                                <strong>全新角色</strong>
                                <p>全新东方气质主战员「绯」及辅战员「芮香」，抢先登场</p>
                              </div>
                            </div>
                            <div class="czn-slide is-next">
                              <img src="/assets/czn-forward-img1.jpg" alt="" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <strong>前瞻情报一览</strong>
                      <p>源站 forward_swiper 使用 forward_mask 裁切图片，底部文案盒使用 forward_txt_bg，不是普通卡片边框。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>全新角色</DuTag>
                        <DuTag color="primary" round>公测内容</DuTag>
                        <DuTag color="default" round>限时活动</DuTag>
                      </div>
                    </div>
                    <div class="click-target czn-forward-info-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <strong>全新角色</strong>
                      <p>全新东方气质主战员「绯」及辅战员「芮香」，抢先登场</p>
                      <small>forward_txt_bg.png / source caption card</small>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <DuButton text="查看详情 MORE" type="primary" />
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-media'">
                    <div class="click-target czn-media-hero" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <p>{{ cznMediaCopy[cznMediaTab].kicker }}</p>
                      <strong>{{ cznMediaCopy[cznMediaTab].title }}</strong>
                    </div>
                    <div class="click-target czn-media-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs :value="cznMediaTab" type="tag" size="normal" @update:value="cznMediaTab = $event">
                        <DuTab name="pv">PV</DuTab>
                        <DuTab name="screenshots">截图</DuTab>
                        <DuTab name="interview">访谈</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target czn-media-grid" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <article v-for="item in cznMediaCopy[cznMediaTab].items" :key="item">
                        <i></i>
                        <strong>{{ item }}</strong>
                      </article>
                    </div>
                    <div class="click-target czn-media-notes" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <strong>{{ cznMediaCopy[cznMediaTab].noteTitle }}</strong>
                      <p>{{ cznMediaCopy[cznMediaTab].noteBody }}</p>
                      <div class="tag-row">
                        <DuTag v-for="tag in cznMediaCopy[cznMediaTab].tags" :key="tag" color="primary" round>{{ tag }}</DuTag>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-character'">
                    <div class="click-target czn-character-panel" :class="{ selected: selectedInstanceId === pageNodeId('CharacterPanel') }" :data-node-id="pageNodeId('CharacterPanel')" @click="selectInstance(pageNodeId('CharacterPanel'), $event)">
                      <span class="tag">CharacterPanel</span>
                      <div class="czn-character-visual" aria-hidden="true">
                        <video src="/assets/czn-renoa-creazy-loop.mp4" poster="/assets/czn-renoa-creazy-rc.jpg" autoplay muted loop playsinline></video>
                      </div>
                      <div class="czn-character-copy">
                        <p>RENOA</p>
                        <strong>蕾诺娅</strong>
                        <span>黑玫瑰诗人。不会凋零的黑玫瑰，即将绽放。</span>
                        <div class="czn-character-stats" aria-label="角色详情">
                          <small>MAIN AGENT</small>
                          <small>BLACK ROSE</small>
                          <small>ASSAULT</small>
                        </div>
                      </div>
                      <div class="button-row">
                        <DuButton text="查看档案" type="primary" />
                      </div>
                    </div>
                    <div class="click-target display-summary czn-avatar-row" :class="{ selected: selectedInstanceId === pageNodeId('Avatar') }" :data-node-id="pageNodeId('Avatar')" @click="selectInstance(pageNodeId('Avatar'), $event)">
                      <span class="tag">Avatar</span>
                      <span class="czn-character-avatar" aria-hidden="true"></span>
                      <div>
                        <strong>角色档案</strong>
                        <p>头像、角色名和状态适合后续接入真实角色数据。</p>
                      </div>
                    </div>
                    <div class="click-target czn-character-voice-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <small>CHARACTER VOICE</small>
                      <strong>角色语音与技能卡</strong>
                      <p>角色页内容块直接承接黑紫角色舞台，不再在 click-target 里套一层默认 DuCard。</p>
                      <i class="czn-character-skill" aria-hidden="true"></i>
                      <div class="tag-row">
                        <DuTag color="primary" round>技能卡</DuTag>
                        <DuTag color="default" round>支援</DuTag>
                      </div>
                    </div>
                    <div class="click-target czn-character-tags" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>危险人物</DuTag>
                        <DuTag color="default" round>黑玫瑰</DuTag>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-home'">
                    <div class="click-target notion-hero" :class="{ selected: selectedInstanceId === pageNodeId('HeroHeader') }" :data-node-id="pageNodeId('HeroHeader')" @click="selectInstance(pageNodeId('HeroHeader'), $event)">
                      <span class="tag">HeroHeader · 图片层 Image</span>
                      <p>Write, plan, organize</p>
                      <strong>Your team's calm operating system</strong>
                      <span>白纸感画布、近黑大字和单一蓝色行动入口，彩色贴纸只负责人格。</span>
                      <div class="button-row">
                        <DuButton text="Start building" type="primary" />
                        <DuButton text="Browse templates" type="outline" />
                      </div>
                    </div>
                    <div class="click-target notion-sticker-row" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <DuTag color="primary" round>docs</DuTag>
                      <DuTag color="default" round>wiki</DuTag>
                      <DuTag color="default" round>projects</DuTag>
                    </div>
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <DuCard title="Company home" guide-text="" size="large">
                        <p class="card-copy">用 dangoui Card 承接 Notion 的文档卡片模式；纸面、圆角和 --du-border-1 是 demo 视觉控制。</p>
                      </DuCard>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="Get Notion free" type="primary" />
                        <DuButton text="Request demo" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-wiki'">
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <DuCard title="Team wiki" guide-text="" size="large">
                        <div class="notion-list">
                          <span>Getting started</span>
                          <span>Product roadmap</span>
                          <span>Design system notes</span>
                        </div>
                      </DuCard>
                    </div>
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('NoticeBar') }" :data-node-id="pageNodeId('NoticeBar')" @click="selectInstance(pageNodeId('NoticeBar'), $event)">
                      <span class="tag">NoticeBar</span>
                      <DuNoticeBar text="新成员已加入工作区，建议先阅读 onboarding 页面。" link-text="打开" />
                    </div>
                    <div class="click-target notion-sticker-panel" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <i></i><i></i><i></i><i></i>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-pricing'">
                    <div class="click-target notion-plan-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <strong>Plus</strong>
                      <p>For small teams and professionals.</p>
                      <b>$10 <small>/ seat</small></b>
                      <DuButton text="Get started" type="primary" />
                    </div>
                    <div class="click-target notion-plan-card featured" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'), $event)">
                      <span class="tag">Badge</span>
                      <strong>Business</strong>
                      <p>Advanced permissions, SSO and shared teamspaces.</p>
                      <b>$20 <small>/ seat</small></b>
                      <DuTag color="primary" round>Recommended</DuTag>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="Contact sales" type="primary" />
                        <DuButton text="Compare plans" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'distribution'">
                    <div class="click-target mock-hero-header" :class="{ selected: selectedInstanceId === pageNodeId('HeroHeader') }" :data-node-id="pageNodeId('HeroHeader')" @click="selectInstance(pageNodeId('HeroHeader'), $event)">
                      <span class="tag">HeroHeader · 图片层 Image</span>
                      <small>CAMPAIGN LAUNCH</small>
                      <strong>夏日市集限时开启</strong>
                      <p>一屏讲清主题、利益点和下一步动作，适合活动首页、品牌专题和内容集合页。</p>
                    </div>
                    <div class="click-target mock-swiper" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div><strong>今日主推资源位</strong><p>多个 Banner 轮流承接福利、上新、攻略和预约入口。</p></div>
                    </div>
                    <div class="click-target mock-grid" :class="{ selected: selectedInstanceId === pageNodeId('Grid') }" :data-node-id="pageNodeId('Grid')" @click="selectInstance(pageNodeId('Grid'), $event)">
                      <span class="tag">Grid</span>
                      <i v-for="item in ['领福利', '逛商品', '看攻略', '做任务']" :key="`dist-grid-${item}`">{{ item }}</i>
                    </div>
                    <div class="click-target mock-list" :class="{ selected: selectedInstanceId === pageNodeId('List') }" :data-node-id="pageNodeId('List')" @click="selectInstance(pageNodeId('List'), $event)">
                      <span class="tag">List</span>
                      <p v-for="item in distributionListRows" :key="`dist-list-${item.title}`">
                        <i aria-hidden="true"></i>
                        <span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span>
                        <em>{{ item.meta }}</em>
                        <b aria-hidden="true">›</b>
                      </p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <DuCard title="限量补给包上新" guide-text="" size="large">
                        <p class="card-copy">封面、标题、标签、摘要和按钮组成一条可分发内容。</p>
                      </DuCard>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <div class="mock-tabs-scene">
                        <DuTabs value="hot" type="tag" size="normal">
                          <DuTab name="hot">热门</DuTab>
                          <DuTab name="new">上新</DuTab>
                          <DuTab name="ops">攻略</DuTab>
                        </DuTabs>
                        <article>
                          <small>热门频道</small>
                          <strong>本周转化最高的活动入口</strong>
                          <p>Tabs 不只是切换样式，而是把同一个资源区分成不同运营视角。</p>
                        </article>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <div class="button-row"><DuButton text="立即预约" type="primary" /><DuButton text="查看详情" type="outline" /></div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="mock-tag-scene">
                        <strong>周末补给包</strong>
                        <p>标签负责让用户快速扫出状态，不承担长说明。</p>
                        <div class="tag-row">
                          <DuTag color="primary">限时</DuTag>
                          <DuTag color="default">主推</DuTag>
                          <DuTag color="success">上新</DuTag>
                        </div>
                      </div>
                    </div>
                  </template>
                  
                  <template v-else-if="selectedTemplateId === 'display'">
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'), $event)">
                      <span class="tag">Image</span>
                      <DuImage :src="imagePreviewSrc" width="100%" height="160px" mode="aspectFill" radius="16" />
                    </div>
                    <div class="click-target display-summary" :class="{ selected: selectedInstanceId === pageNodeId('Avatar') }" :data-node-id="pageNodeId('Avatar')" @click="selectInstance(pageNodeId('Avatar'), $event)">
                      <span class="tag">Avatar</span>
                      <DuAvatar type="primary" size="large" bordered>DU</DuAvatar>
                      <div>
                        <strong>服务器返回的用户信息</strong>
                        <p>昵称、状态、数量和图片资源都属于展示侧。</p>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'), $event)">
                      <span class="tag">Badge</span>
                      <DuBadge value="12" color="primary" always-show>
                        <span class="badge-anchor">更新</span>
                      </DuBadge>
                    </div>
                    <div class="click-target mock-swiper" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'), $event)">
                      <span class="tag">Swiper</span>
                      <div><strong>多图展示</strong><p>DuSwiper 可承接基础横滑，当前静态表达结构。</p></div>
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Popup') }" :data-node-id="pageNodeId('Popup')" @click="selectInstance(pageNodeId('Popup'), $event)">
                      <span class="tag">Popup</span>
                      <strong>图片详情 / 资料浮层</strong><p>DuPopup 可承接弹层；静态 demo 不默认打开。</p>
                    </div>
                    <div class="click-target mock-list" :class="{ selected: selectedInstanceId === pageNodeId('List') }" :data-node-id="pageNodeId('List')" @click="selectInstance(pageNodeId('List'), $event)">
                      <span class="tag">List</span>
                      <p v-for="item in displayListRows" :key="`display-list-${item.title}`">
                        <i aria-hidden="true"></i>
                        <span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span>
                        <em>{{ item.meta }}</em>
                        <b aria-hidden="true">›</b>
                      </p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Steps') }" :data-node-id="pageNodeId('Steps')" @click="selectInstance(pageNodeId('Steps'), $event)">
                      <span class="tag">Steps</span>
                      <DuSteps :active-index="1" status="process" color="primary" :steps="[{ title: '提交' }, { title: '审核' }, { title: '完成' }]" />
                    </div>
                    <div class="click-target mock-time-row" :class="{ selected: selectedInstanceId === pageNodeId('Time') }" :data-node-id="pageNodeId('Time')" @click="selectInstance(pageNodeId('Time'), $event)">
                      <span class="tag">Time</span>
                      <strong>2026.06.15</strong><p>最近同步 · 12:30</p>
                    </div>
                    <div class="click-target mock-stat-grid" :class="{ selected: selectedInstanceId === pageNodeId('PriceStatistic') }" :data-node-id="pageNodeId('PriceStatistic')" @click="selectInstance(pageNodeId('PriceStatistic'), $event)">
                      <span class="tag">PriceStatistic</span>
                      <b><small>VALUE</small>¥256</b><b><small>SCORE</small>98</b><b><small>RANK</small>Top 5</b>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Rate') }" :data-node-id="pageNodeId('Rate')" @click="selectInstance(pageNodeId('Rate'), $event)">
                      <span class="tag">Rate</span>
                      <DuRate :default-value="4" size="medium" color="primary" />
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'), $event)">
                      <span class="tag">Card</span>
                      <strong>数据分组</strong><p>用页面 section/Card 组合承接。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                      <span class="tag">Tabs</span>
                      <DuTabs value="detail" type="tag" size="normal"><DuTab name="detail">详情</DuTab><DuTab name="media">媒体</DuTab><DuTab name="record">记录</DuTab></DuTabs>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                      <span class="tag">Button</span>
                      <div class="button-row"><DuButton text="查看详情" type="primary" /><DuButton text="收藏" type="outline" /></div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                      <span class="tag">Tag</span>
                      <div class="tag-row"><DuTag color="primary" round>活跃</DuTag><DuTag color="default" round>服务端状态</DuTag></div>
                    </div>
                  </template>
                  <template v-else-if="selectedTemplateId === 'publish'">
                    <div class="form-demo generic-publish-form">
                      <div class="publish-template-tip">
                        <strong>TIPS</strong>
                        <span>先写清标题和亮点，再设置报名、同步和发布时间。</span>
                      </div>
                      <section class="group publish-editor-card">
                        <div class="click-target publish-cover-upload" :class="{ selected: selectedInstanceId === pageNodeId('Upload') }" :data-node-id="pageNodeId('Upload')" @click="selectInstance(pageNodeId('Upload'), $event)">
                          <span class="tag">Upload</span>
                          <DuUpload :value="[]" upload-text="添加封面" />
                        </div>
                        <div class="click-target publish-title-field" :class="{ selected: selectedInstanceId === pageNodeId('Input') }" :data-node-id="pageNodeId('Input')" @click="selectInstance(pageNodeId('Input'), $event)">
                          <span class="tag">Input</span>
                          <DuInput value="周末市集" placeholder="填写清晰的活动标题" allow-clear />
                        </div>
                        <div class="click-target publish-body-field" :class="{ selected: selectedInstanceId === pageNodeId('Textarea') }" :data-node-id="pageNodeId('Textarea')" @click="selectInstance(pageNodeId('Textarea'), $event)">
                          <span class="tag">Textarea</span>
                          <DuTextarea value="描述活动亮点、内容、人群和注意事项，帮助用户快速判断要不要参加。" show-count :maxlength="120" />
                        </div>
                        <div class="publish-editor-meta">
                          <div class="click-target control-grid control-grid--inline-short" :class="{ selected: selectedInstanceId === pageNodeId('Radio') }" :data-node-id="pageNodeId('Radio')" @click="selectInstance(pageNodeId('Radio'), $event)">
                            <span class="tag">Radio</span>
                            <DuRadio checked label="公开" /><DuRadio label="仅团队" />
                          </div>
                          <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'), $event)">
                            <span class="tag">Tag</span>
                            <DuTag color="primary" round>AI 智能排版</DuTag>
                          </div>
                        </div>
                      </section>
                      <section class="publish-mode-card">
                        <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'), $event)">
                          <span class="tag">Tabs</span>
                          <DuTabs value="single" type="tag" size="large"><DuTab name="single">单次活动</DuTab><DuTab name="series">多场次活动</DuTab></DuTabs>
                        </div>
                      </section>
                      <DuForm class="group publish-form-card" layout="horizontal" label-size="88px">
                        <DuFormItem label="活动分类" required>
                          <div class="click-target publish-field-control" :class="{ selected: selectedInstanceId === pageNodeId('Select') }" :data-node-id="pageNodeId('Select')" @pointerdown.capture="syncMockupPopupBounds('Select')" @click="selectInstance(pageNodeId('Select'), $event)">
                          <span class="tag">Select</span>
                          <DuSelect title="请选择活动类型" :options="selectOptions" :value="genericSelectValue" :popup-style="mockupSelectPopupStyle" @update:value="genericSelectValue = $event" />
                          </div>
                        </DuFormItem>
                        <DuFormItem label="活动人数" required>
                          <div class="click-target publish-field-control" :class="{ selected: selectedInstanceId === pageNodeId('Stepper') }" :data-node-id="pageNodeId('Stepper')" @click="selectInstance(pageNodeId('Stepper'), $event)">
                          <span class="tag">Stepper · InputNumber</span>
                          <DuInputNumber :value="3" :min="1" :max="99" />
                          </div>
                        </DuFormItem>
                        <DuFormItem label="活动地点">
                          <div class="click-target publish-field-control publish-field-value" :class="{ selected: selectedInstanceId === pageNodeId('Cascader') }" :data-node-id="pageNodeId('Cascader')" @pointerdown.capture="syncMockupPopupBounds('Cascader')" @click="selectInstance(pageNodeId('Cascader'), $event)">
                          <span class="tag">Cascader</span>
                          <DuCascader title="活动地点" :options="cascaderExampleOptions" :value="['east', 'shanghai', 'pudong']" show-search :popup-style="mockupSelectPopupStyle" />
                          </div>
                        </DuFormItem>
                        <DuFormItem label="报名截止">
                          <div
                            class="click-target publish-field-control publish-field-value"
                            :class="{ selected: selectedInstanceId === pageNodeId('DateTimePicker') }"
                            :data-node-id="pageNodeId('DateTimePicker')"
                            @pointerdown.capture="syncMockupPopupBounds('DateTimePicker')"
                            @click="selectInstance(pageNodeId('DateTimePicker'), $event); calendarDateTimeVisible = true"
                          >
                          <span class="tag">DateTimePicker · Calendar showTimePicker</span>
                          <strong>{{ calendarDateTimeText }}</strong>
                          </div>
                          <DuCalendar
                            v-model:visible="calendarDateTimeVisible"
                            title="报名截止"
                            type="single"
                            :selected-date="calendarSelectedDate"
                            show-time-picker
                            :time-step="5"
                            @confirm="handleCalendarDateTimeConfirm"
                          />
                        </DuFormItem>
                        <DuFormItem label="首页同步">
                          <div class="click-target publish-field-control" :class="{ selected: selectedInstanceId === pageNodeId('Switch') }" :data-node-id="pageNodeId('Switch')" @click="selectInstance(pageNodeId('Switch'), $event)">
                          <span class="tag">Switch</span>
                          <DuSwitch :on="publishSyncOn" @update:on="publishSyncOn = $event" @click.stop />
                          </div>
                        </DuFormItem>
                        <DuFormItem label="更多设置">
                          <div class="click-target control-grid publish-option-grid" :class="{ selected: selectedInstanceId === pageNodeId('Checkbox') }" :data-node-id="pageNodeId('Checkbox')" @click="selectInstance(pageNodeId('Checkbox'), $event)">
                          <span class="tag">Checkbox</span>
                          <DuCheckbox :checked="publishWaitlistOn" label="候补" @update:checked="publishWaitlistOn = $event" @click.stop />
                          <DuCheckbox :checked="publishLimitOn" label="限购" @update:checked="publishLimitOn = $event" @click.stop />
                          </div>
                        </DuFormItem>
                        <DuFormItem label="推荐强度">
                          <div class="click-target publish-field-control" :class="{ selected: selectedInstanceId === pageNodeId('Rate') }" :data-node-id="pageNodeId('Rate')" @click="selectInstance(pageNodeId('Rate'), $event)">
                          <span class="tag">Rate</span>
                          <DuRate :default-value="3" size="medium" color="primary" />
                          </div>
                        </DuFormItem>
                      </DuForm>
                      <div class="click-target publish-list-row publish-tips-row" :class="{ selected: selectedInstanceId === pageNodeId('Tips') }" :data-node-id="pageNodeId('Tips')" @click="selectInstance(pageNodeId('Tips'), $event)">
                        <span class="tag">Tips</span>
                        <span>TIPS：开启候补后，活动结束前不建议取消。</span>
                      </div>
                      <div class="click-target publish-bottom-actions" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'), $event)">
                        <span class="tag">Button</span>
                        <div class="button-row">
                          <DuButton text="保存草稿" type="outline" />
                          <DuButton text="发布活动" type="primary" />
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('NoticeBar') }" :data-node-id="pageNodeId('NoticeBar')" @click="selectInstance(pageNodeId('NoticeBar'), $event)">
                      <span class="tag">NoticeBar</span>
                      <DuNoticeBar text="非模态轻反馈：页面内提示，不打断用户操作。" link-text="知道了" />
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Snackbar') }" :data-node-id="pageNodeId('Snackbar')" @click="selectInstance(pageNodeId('Snackbar'), $event)">
                      <span class="tag">Snackbar</span>
                      <strong>非模态轻反馈：短提示</strong>
                      <p>DuSnackbar 可承接，但需要由动作触发，默认不常驻。</p>
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Toast') }" :data-node-id="pageNodeId('Toast')" @click="selectInstance(pageNodeId('Toast'), $event)">
                      <span class="tag">Toast</span>
                      <strong>ToastProvider / useToast</strong>
                      <p>当前 DangoUI 提供 ToastProvider 和 useToast，不是独立可见组件。</p>
                    </div>
                    <div class="feedback-stack">
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Dialog') }" :data-node-id="pageNodeId('Dialog')" @click="selectInstance(pageNodeId('Dialog'), $event)">
                        <span class="tag">Dialog</span>
                        <strong>模态重反馈：需要用户决策</strong>
                        <p>确认、删除、付款等高风险动作再使用。</p>
                      </div>
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Popup') }" :data-node-id="pageNodeId('Popup')" @click="selectInstance(pageNodeId('Popup'), $event)">
                        <span class="tag">Popup</span>
                        <strong>模态中反馈：承载临时内容</strong>
                        <p>适合筛选、说明、二次操作等底部或居中浮层。</p>
                      </div>
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Dropdown') }" :data-node-id="pageNodeId('Dropdown')" @click="selectInstance(pageNodeId('Dropdown'), $event)">
                      <span class="tag">Dropdown</span>
                      <strong>筛选下拉面板</strong><p>DuDropdown 可承接，需要展开态；静态页仅表达入口。</p>
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Popover') }" :data-node-id="pageNodeId('Popover')" @click="selectInstance(pageNodeId('Popover'), $event)">
                      <span class="tag">Popover</span>
                      <strong>轻量浮层说明</strong><p>DangoUI 暂无 Popover，通常由 Tooltip / Popup / 业务组件承接。</p>
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('ShareSheet') }" :data-node-id="pageNodeId('ShareSheet')" @click="selectInstance(pageNodeId('ShareSheet'), $event)">
                      <span class="tag">ShareSheet</span>
                      <strong>分享面板</strong><p>可由 DuActionSheet grid/list 组合承接，分享渠道由业务注入。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Empty') }" :data-node-id="pageNodeId('Empty')" @click="selectInstance(pageNodeId('Empty'), $event)">
                      <span class="tag">Empty</span>
                      <DuEmpty text="非模态中反馈：占据局部页面，给出下一步动作。" button-text="去创建" />
                    </div>
                    <div class="click-target mock-result-page" :class="{ selected: selectedInstanceId === pageNodeId('ResultPage') }" :data-node-id="pageNodeId('ResultPage')" @click="selectInstance(pageNodeId('ResultPage'), $event)">
                      <span class="tag">ResultPage</span>
                      <strong>提交成功</strong><p>结果页是业务页面模板；DangoUI 可用 Empty / Button / Icon 组合。</p>
                      <DuButton text="返回首页" type="primary" />
                    </div>
                    <div class="click-target placeholder-card mock-spin" :class="{ selected: selectedInstanceId === pageNodeId('Spin') }" :data-node-id="pageNodeId('Spin')" @click="selectInstance(pageNodeId('Spin'), $event)">
                      <span class="tag">Spin</span>
                      <i></i><strong>加载中</strong><p>DangoUI 当前未导出 Spin 组件。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Skeleton') }" :data-node-id="pageNodeId('Skeleton')" @click="selectInstance(pageNodeId('Skeleton'), $event)">
                      <span class="tag">Skeleton</span>
                      <DuSkeleton loading>
                        <template #template>
                          <div class="skeleton-demo">
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                        </template>
                      </DuSkeleton>
                    </div>
                  </template>

                  <section v-if="snapshotComponents.length" class="component-supplement-section" aria-label="组件快照">
                    <div class="component-supplement-grid">
                      <div
                        v-for="name in snapshotComponents"
                        :key="`snapshot-${selectedTemplateId}-${name}`"
                        role="button"
                        tabindex="0"
                        class="click-target supplement-component-card"
                        :class="[`supplement-component-card--${kebabName(name)}`, { selected: selectedInstanceId === pageNodeId(name) }]"
                        :data-node-id="pageNodeId(name)"
                        @click="selectInstance(pageNodeId(name))"
                        @keydown.enter.prevent="selectInstance(pageNodeId(name))"
                      >
                        <span class="tag">{{ name }}</span>
                        <div class="supplement-component-preview">
                          <DuRate v-if="name === 'Rate'" :default-value="4" size="medium" color="primary" />
                          <div v-else-if="name === 'Button'" class="button-row">
                            <DuButton :text="activeSide === 'distribution' ? '立即预约' : '主要行动'" type="primary" />
                            <DuButton :text="activeSide === 'distribution' ? '查看详情' : '次要'" type="outline" />
                          </div>
                          <div v-else-if="name === 'Tag' && activeSide === 'distribution'" class="mock-tag-scene compact">
                            <strong>周末补给包</strong>
                            <div class="tag-row">
                              <DuTag color="primary">限时</DuTag>
                              <DuTag color="default">主推</DuTag>
                              <DuTag color="success">上新</DuTag>
                            </div>
                          </div>
                          <div v-else-if="name === 'Tag'" class="tag-row">
                            <DuTag color="primary">Primary</DuTag>
                            <DuTag color="default">Default</DuTag>
                          </div>
                          <div v-else-if="name === 'Tabs' && activeSide === 'distribution'" class="mock-tabs-scene compact">
                            <DuTabs value="a" type="tag" size="normal">
                              <DuTab name="a">热门</DuTab>
                              <DuTab name="b">上新</DuTab>
                              <DuTab name="c">攻略</DuTab>
                            </DuTabs>
                            <article>
                              <small>热门频道</small>
                              <strong>本周转化最高的活动入口</strong>
                            </article>
                          </div>
                          <DuTabs v-else-if="name === 'Tabs'" value="a" type="tag" size="normal">
                            <DuTab name="a">选项一</DuTab>
                            <DuTab name="b">选项二</DuTab>
                          </DuTabs>
                          <div v-else-if="name === 'TabBar'" class="mock-tabbar">
                            <button class="active" type="button">首页</button>
                            <button type="button">发现</button>
                            <button type="button">我的</button>
                          </div>
                          <div v-else-if="name === 'SegmentControl'" class="mock-segment-control">
                            <button type="button" class="active">全部</button>
                            <button type="button">活动</button>
                            <button type="button">攻略</button>
                          </div>
                          <div v-else-if="name === 'BottomBar'" class="mock-bottom-bar">
                            <DuButton text="取消" type="outline" />
                            <DuButton text="确认" type="primary" />
                          </div>
                          <div v-else-if="name === 'Menu'" class="mock-menu-list">
                            <button type="button" class="active">内容配置</button>
                            <button type="button">数据复盘</button>
                          </div>
                          <DuSearch v-else-if="name === 'Search'" readonly :placeholder="[activeSide === 'distribution' ? '搜索活动、商品、攻略' : '搜索内容、活动、商品']" />
                          <DuImage v-else-if="name === 'Image'" :src="imagePreviewSrc" width="100%" height="72px" mode="aspectFill" radius="8" />
                          <DuCard v-else-if="name === 'Card'" :title="activeSide === 'distribution' ? '限量补给包上新' : '内容卡片'" guide-text="" size="large">
                            <p class="card-copy">{{ activeSide === 'distribution' ? '封面、标题、标签、摘要和按钮组成一条可分发内容。' : '标题、摘要、图片或行动入口的内容承载容器。' }}</p>
                          </DuCard>
                          <DuBadge v-else-if="name === 'Badge'" value="8" color="primary" always-show>
                            <span class="badge-anchor">消息</span>
                          </DuBadge>
                          <DuAvatar v-else-if="name === 'Avatar'" type="primary" size="large" bordered>DU</DuAvatar>
                          <div v-else-if="name === 'Swiper'" class="mock-swiper supplement-swiper">
                            <div>
                              <strong>{{ activeSide === 'distribution' ? '今日主推资源位' : '轮播' }}</strong>
                              <p v-if="activeSide === 'distribution'">多张 Banner 承接福利、上新、攻略和预约入口。</p>
                            </div>
                          </div>
                          <div v-else-if="name === 'Grid'" class="mock-grid">
                            <i v-for="item in (activeSide === 'distribution' ? ['领福利', '逛商品', '看攻略', '做任务'] : ['入口一', '入口二', '入口三', '入口四'])" :key="`snapshot-grid-${item}`">{{ item }}</i>
                          </div>
                          <div v-else-if="name === 'List'" class="mock-list">
                            <p v-for="item in currentListRows" :key="`snapshot-list-${selectedTemplateId}-${item.title}`">
                              <i aria-hidden="true"></i>
                              <span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span>
                              <em>{{ item.meta }}</em>
                              <b aria-hidden="true">›</b>
                            </p>
                          </div>
                          <div v-else-if="name === 'Time'" class="mock-time-row">
                            <strong>{{ activeSide === 'distribution' ? '06.17' : '2026.06.15' }}</strong>
                            <p>{{ activeSide === 'distribution' ? '20:00 开抢 · 距结束 48h' : '最近同步 · 12:30' }}</p>
                          </div>
                          <div v-else-if="name === 'PriceStatistic'" class="mock-stat-grid">
                            <b><small>PRICE</small>¥128</b><b><small>{{ activeSide === 'distribution' ? '已预约' : 'VALUE' }}</small>{{ activeSide === 'distribution' ? '12.6w' : '98' }}</b><b><small>{{ activeSide === 'distribution' ? '热度' : 'RANK' }}</small>{{ activeSide === 'distribution' ? '98' : 'Top 5' }}</b>
                          </div>
                          <div v-else-if="name === 'FeedSpuTag'" class="mock-feed-card">
                            <div class="media" aria-hidden="true"></div>
                            <strong>{{ activeSide === 'distribution' ? '种草内容带商品转化' : 'Feed + SPU + 标签组合' }}</strong>
                            <p>{{ activeSide === 'distribution' ? '内容、商品、标签和行动入口组合成一条可分发资源。' : 'DangoUI 可提供 Card / Image / Tag / Button 原子能力。' }}</p>
                            <div class="tag-row"><DuTag color="primary">SPU</DuTag><DuTag color="default">主推</DuTag></div>
                          </div>
                          <button v-else-if="name === 'FAB'" class="demo-publish-fab supplement-fab" type="button" aria-label="快捷创建">
                            <DuIcon :icon="iconPlusHeavy" :size="18" />
                          </button>
                          <DuSteps v-else-if="name === 'Steps'" :active-index="1" status="process" color="primary" :steps="[{ title: '提交' }, { title: '审核' }, { title: '完成' }]" />
                          <DuNoticeBar v-else-if="name === 'NoticeBar'" text="这是一条 NoticeBar 提示。" />
                          <DuSnackbar v-else-if="name === 'Snackbar'" :show="true" :show-action-btn="false" :show-close="false" :duration="0">已保存</DuSnackbar>
                          <DuEmpty v-else-if="name === 'Empty'" text="暂无内容" />
                          <DuSkeleton v-else-if="name === 'Skeleton'" loading>
                            <template #template>
                              <div class="skeleton-demo"><div></div><div></div><div></div></div>
                            </template>
                          </DuSkeleton>
                          <DuInput v-else-if="name === 'Input'" value="输入内容" bordered />
                          <DuTextarea v-else-if="name === 'Textarea'" value="多行输入内容" bordered />
                          <DuRadio v-else-if="name === 'Radio'" checked label="选项" />
                          <DuCheckbox v-else-if="name === 'Checkbox'" checked label="复选项" />
                          <DuSwitch v-else-if="name === 'Switch'" :on="true" />
                          <DuInputNumber v-else-if="name === 'Stepper'" :value="3" :min="1" :max="99" />
                          <div v-else-if="name === 'DateTimePicker'" class="mock-datetime-picker">
                            <strong>2026-06-08</strong>
                            <span>20:00</span>
                            <small>Calendar + showTimePicker</small>
                          </div>
                          <div v-else-if="name === 'Cascader'" class="mock-datetime-picker">
                            <strong>华东 / 上海</strong>
                            <span>›</span>
                            <small>Cascader 多级选择</small>
                          </div>
                          <DuSelect v-else-if="name === 'Select'" title="选择器" :options="selectOptions" value="figma" />
                          <DuUpload v-else-if="name === 'Upload'" :value="[]" upload-text="上传" />
                          <div v-else-if="name === 'Tips'" class="mock-tips-card">
                            <strong>字段辅助提示</strong>
                            <p>解释规则、风险或下一步动作。</p>
                          </div>
                          <DuFormItem v-else-if="name === 'FormItem'" label="字段" required show-border>
                            <DuInput value="表单项" bordered />
                          </DuFormItem>
                          <DuForm v-else-if="name === 'Group'" class="mock-form-group" layout="vertical" label-size="72px">
                            <DuFormItem label="基础信息" show-border>
                              <DuInput value="同一组相关字段" bordered />
                            </DuFormItem>
                            <DuFormItem label="发布设置" show-border>
                              <DuSwitch :on="true" />
                            </DuFormItem>
                          </DuForm>
                          <div v-else-if="name === 'Dialog'" class="placeholder-card supplement-dialog"><strong>Dialog</strong><p>确认 / 取消</p></div>
                          <div v-else-if="name === 'Popup'" class="placeholder-card supplement-popup"><strong>Popup</strong><p>底部弹层</p></div>
                          <div v-else-if="name === 'Dropdown'" class="placeholder-card supplement-dropdown"><strong>筛选</strong><p>Dropdown</p></div>
                          <div v-else-if="name === 'Toast'" class="placeholder-card supplement-toast"><strong>Toast</strong><p>useToast 触发</p></div>
                          <div v-else-if="name === 'ShareSheet'" class="placeholder-card supplement-share"><strong>ShareSheet</strong><p>ActionSheet 适配</p></div>
                          <div v-else-if="name === 'ResultPage'" class="mock-result-page compact-result"><strong>提交成功</strong><p>完成后给出下一步。</p></div>
                          <div v-else-if="name === 'Spin'" class="mock-spin-inline"><i></i><span>加载中</span></div>
                          <i v-else aria-hidden="true"></i>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <nav
                  v-if="showDemoBottomActions"
                  class="click-target demo-bottom-tabbar"
                  :class="{ selected: selectedInstanceId === pageNodeId('TabBar') }"
                  :data-node-id="pageNodeId('TabBar')"
                  aria-label="demo inspector switcher"
                >
                  <span class="tag">TabBar</span>
                  <button type="button" :class="{ active: selectedInspectorTab === 'style' }" @click.stop="showStyleMenu">
                    <span>风格</span>
                  </button>
                  <button type="button" :class="{ active: selectedInspectorTab === 'components' }" @click.stop="showComponentMenu">
                    <span>组件</span>
                  </button>
                  <button type="button" :class="{ active: selectedInspectorTab === 'pages' }" @click.stop="showPageMenu">
                    <span>页面</span>
                  </button>
                </nav>
                <button
                  v-if="showPublishFab"
                  class="click-target demo-publish-fab"
                  :class="{ active: selectedTemplateId === publishTemplateId, selected: selectedInstanceId === pageNodeId('FAB') }"
                  type="button"
                  :data-node-id="pageNodeId('FAB')"
                  aria-label="打开发布侧"
                  @click="openPublishSide"
                >
                  <span class="tag">FAB</span>
                  <DuIcon :icon="iconPlusHeavy" :size="20" />
                </button>
                <div class="mock-home-indicator" :class="{ 'mock-home-indicator--transparent': !showDemoBottomActions }" aria-hidden="true"><span></span></div>
                <div
                  v-if="mockupHoverLabel"
                  class="mockup-hover-label"
                  :style="mockupHoverStyle"
                  aria-hidden="true"
                >
                  {{ mockupHoverLabel }}
                </div>
                <DuSnackbar
                  v-if="snackbarMessage"
                  :show="true"
                  :show-action-btn="false"
                  :show-close="false"
                  :duration="0"
                  :ext-class="['mockup-copy-snackbar', { 'mockup-copy-snackbar--open': snackbarOpen }]"
                  role="status"
                  aria-live="polite"
                >
                  {{ snackbarMessage }}
                </DuSnackbar>
              </div>
            </div>
          </section>
        <!-- DateTimePicker showcase popup:点 DuButton 触发,作为浮层挂到 article 末尾 -->
        <div v-if="componentExamplePopup === 'datetime-picker'" class="component-example-popup-layer">
          <DuCalendar
            :visible="true"
            title="选择日期时间"
            type="single"
            :selected-date="componentExampleState.calendarSelectedDate"
            :selected-time="componentExampleState.calendarSelectedTime"
            :show-time-picker="componentExampleState.calendarShowTimePicker"
            :time-step="5"
            @close="closeComponentExamplePopup"
            @cancel="closeComponentExamplePopup"
            @confirm="(payload) => { setComponentExampleValue('calendarSelectedDate', payload?.date || null); setComponentExampleValue('calendarSelectedTime', payload?.time || null); closeComponentExamplePopup(); }"
          />
        </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import {
  DuActionButton,
  DuAvatar,
  DuAvatarGroup,
  DuBadge,
  DuButton,
  DuCard,
  DuCalendar,
  DuCascader,
  DuCheckbox,
  DuDivider,
  DuEmpty,
  DuForm,
  DuFormItem,
  DuIcon,
  DuImage,
  DuInput,
  DuInputNumber,
  DuNavigationBar,
  DuNoticeBar,
  DuRadio,
  DuRate,
  DuSearch,
  DuSelect,
  DuSnackbar,
  DuSkeleton,
  DuSkeletonAvatar,
  DuSkeletonParagraph,
  DuSkeletonRectangle,
  DuSteps,
  DuSwitch,
  DuSwiper,
  DuSwiperItem,
  DuTab,
  DuTabs,
  DuTag,
  DuTextarea,
  DuUpload,
} from "dangoui";
import {
  iconCamera,
  iconPlusHeavy,
  iconRefresh,
  iconRoom,
  iconScanning,
} from "dangoui-icon-config";

const docsBaseUrl = "https://dumpling.echo.tech";
const introductionUrl = `${docsBaseUrl}/get-started/introduction`;
const tokenDocsUrl = `${docsBaseUrl}/guide/theme`;
const tokenPreviewLimit = 5;
const selectedStyleId = ref("re1999");
const publishSyncOn = ref(true);
const publishWaitlistOn = ref(true);
const publishLimitOn = ref(false);
const publishSelectValue = ref("notice");
const genericSelectValue = ref("figma");
const calendarDateTimeVisible = ref(false);
const calendarSelectedDate = ref(dayjs("2026-06-29 20:00"));
const calendarDateTimeText = computed(() => calendarSelectedDate.value.format("YYYY-MM-DD HH:mm"));
function handleCalendarDateTimeConfirm(payload) {
  calendarSelectedDate.value = payload.date || payload.value || calendarSelectedDate.value;
  calendarDateTimeVisible.value = false;
}
const starterTemplates = [
  {
    side: "分发侧",
    name: "内容分发模板",
    goal: "把服务端内容按推荐、搜索、分类和运营位送到用户面前，适合首页、活动列表、商品流和内容 feed。",
    parts: "NavigationBar / HeroHeader / Swiper / TabBar / Grid / List / FeedSPU / FAB",
  },
  {
    side: "展示侧",
    name: "数据展示模板",
    goal: "承接服务器数据输出，把用户、状态、图片、指标、进度和空结果展示清楚。",
    parts: "NavigationBar / Image / Badge / Avatar / Swiper / Grid / Steps / SPU / Rate",
  },
  {
    side: "发布侧",
    name: "数据发布模板",
    goal: "承接用户输入并提交到服务器，适合报名、资料编辑、配置发布和内容创建。",
    parts: "FormItem / Input / Textarea / Radio / Checkbox / Switch / Upload / Picker",
  },
  {
    side: "通用反馈",
    name: "轻量到重量反馈模板",
    goal: "按打扰程度组织反馈：轻量提示常驻，中量状态占位，重量弹层需要用户决策。",
    parts: "NoticeBar / Snackbar / Toast / Dialog / Popup / Dropdown / Empty / Skeleton",
  },
];
const activeDocs = [
  {
    kind: "资产架构",
    title: "长期资产怎么存",
    file: "brand-dtcg-migration-asset-standard.md",
  },
  {
    kind: "执行流程",
    title: "Codex 什么时候做什么",
    file: "skills/brand/SKILL.md",
  },
  {
    kind: "判定规则",
    title: "如何避免 AI 主观漂移",
    file: "mapping-rules.md",
  },
  {
    kind: "输出格式",
    title: "交付给设计/研发/产品看什么",
    file: "output-template.md",
  },
];
const workflowSteps = ["看 docs 入口", "选模板", "查组件", "追 token chain", "生成 adapter", "demo 验证"];
const stylePresets = [
  {
    id: "dango",
    label: "DangoUI",
    icon: "https://dumpling.echo.tech/favicon.ico",
    source: "dumpling.echo.tech / 初始化状态",
    hero: "DangoUI",
    notice: "未应用品牌迁移的 DangoUI baseline：组件结构、默认 token 和普通边界保持原样，用来判断后续风格化覆盖了什么。",
    evidenceNote: "这是 baseline，不来自外部品牌采样；直接展示 token 结构，不做频次统计，用于对照 Button、Card、Divider、Tabs 等组件在未风格化时的默认语义和可编辑面。",
    sectionTitle: "Default Components",
    tabs: ["组件", "Token", "状态"],
    cards: [
      { title: "原始组件语义", copy: "先识别 dangoui 组件本身：Card 承载内容、Divider 组织层级、Button 表达行动，不急着加入品牌纹理。" },
      { title: "未覆盖状态", copy: "圆角、弱文字、--du-border-1 和主色都保持初始化 token，作为对比迁移后变化的参照物。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f7f7f9" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#000000e0" },
      { name: "--du-text-2", value: "#000000a6" },
      { name: "--du-text-3", value: "#00000066" },
      { name: "--du-border-1", value: "#0000001f" },
      { name: "--du-primary-color", value: "#7c66ff" },
      { name: "--du-primary-border", value: "#7c66ff" },
      { name: "--du-primary-outline-color", value: "#7c66ff" },
      { name: "--du-primary-soft-bg", value: "#f2f0ff" },
      { name: "--du-primary-solid-bg", value: "#7c66ff" },
    ],
    style: {
      cardRadius: "8px",
      controlRadius: "8px",
      pageSpacing: "16px",
      cardShadow: "0 1px 2px rgba(17,17,20,.06)",
      media: "linear-gradient(135deg,#ffffff,#f7f7f9 56%,#f2f0ff)",
    },
    signals: [
      { raw: "#ffffff", count: 1, percent: "baseline", target: "--du-bg-1", value: "默认组件表面" },
      { raw: "#f7f7f9", count: 1, percent: "baseline", target: "--du-bg-2", value: "默认页面背景" },
      { raw: "#000000e0", count: 1, percent: "baseline", target: "--du-text-1", value: "默认主文本" },
      { raw: "#00000066", count: 1, percent: "baseline", target: "--du-text-3", value: "浅底弱文本；深色品牌迁移时必须被主题弱文本覆盖" },
      { raw: "#0000001f", count: 1, percent: "baseline", target: "--du-border-1", value: "默认 Divider / Card boundary" },
      { raw: "#7c66ff", count: 1, percent: "baseline", target: "--du-primary-color", value: "默认 primary action" },
    ],
  },
  {
    id: "czn",
    label: "CZN",
    icon: "https://czn.qq.com/favicon.ico",
    source: "czn.qq.com / 待截图校准",
    hero: "Combat Zone",
    notice: "沉浸式游戏工具风格：橙色主行动、黑紫角色页、白灰资讯区和 HUD 式斜切边界。",
    evidenceNote: "依据官网 CSS / 素材校准：导航激活、下载按钮和 forward 轮播描边使用 #ff5514；forward 文案卡使用图片背景 + 橙标题 + 白正文；角色页大面积黑紫/深红。",
    sectionTitle: "Game Toolkit",
    tabs: ["任务", "战绩", "装备"],
    cards: [
      { title: "战术面板", copy: "保持 dangoui 组件结构，换成深色底、亮橙行动入口和高对比信息层级。" },
      { title: "沉浸式工具", copy: "霓虹媒体面、HUD 边界和状态标签作为 demo 视觉控制，不伪装成正式 token。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#0b0710" },
      { name: "--du-bg-1", value: "#17111f" },
      { name: "--du-text-1", value: "#fff7f0" },
      { name: "--du-text-3", value: "#a79daa" },
      { name: "--du-border-1", value: "#3a2b3f" },
      { name: "--du-primary-color", value: "#ff5514" },
      { name: "--du-primary-border", value: "#ff5514" },
      { name: "--du-primary-outline-color", value: "#ff5514" },
      { name: "--du-primary-soft-bg", value: "#32180f" },
      { name: "--du-primary-solid-bg", value: "#ff5514" },
    ],
    style: {
      cardRadius: "10px",
      controlRadius: "0px",
      pageSpacing: "16px",
      cardShadow: "0 20px 50px rgba(0,0,0,.45), 0 0 28px rgba(32,216,255,.16)",
      media: "linear-gradient(135deg, transparent 0 18%, rgba(255,90,31,.92) 18% 20%, transparent 20% 58%, rgba(255,255,255,.28) 58% 59%, transparent 59%), radial-gradient(circle at 24% 18%, rgba(255,90,31,.95), transparent 25%), radial-gradient(circle at 76% 68%, rgba(151,71,255,.78), transparent 30%), repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 14px), linear-gradient(135deg,#12070b,#251038 48%,#5a0f1d)",
    },
    signals: [
      { raw: "#ff5514", count: 6, percent: "约 30%", target: "--du-primary-color", value: "首页导航、官网按钮、下载 CTA、轮播描边" },
      { raw: "#0b0710", count: 4, percent: "约 20%", target: "--du-bg-2", value: "角色页黑紫沉浸底" },
      { raw: "#17111f", count: 4, percent: "约 20%", target: "--du-bg-1", value: "HUD / 卡片表面" },
      { raw: "#fff7f0", count: 3, percent: "约 15%", target: "--du-text-1", value: "大标题、按钮文字、高对比文本" },
      { raw: "#a79daa", count: 3, percent: "约 15%", target: "--du-text-3", value: "导航副文案、角色说明、弱信息" },
    ],
  },
  {
    id: "hpma",
    label: "HPMA",
    icon: "https://www.harrypottermagicawakened.com/favicon.ico",
    source: "官网 HTML/CSS + 截图采样",
    hero: "Magic Awakened",
    notice: "棕黑羊皮纸、古铜金边、白金标题和手绘魔法场景被拆成 dangoui token 与 demo-only 媒体资产两层。",
    evidenceNote: "频次来自官网主 CSS 的 UI 色值引用，共 115 次；另用官网分享图、游戏特色图、角色卡和壁纸做图片采样，只作为媒体资产口径。金棕 CTA、羊皮纸文字和深棕面板进入 dangoui token；学院场景、角色插画、魔法蓝光和华丽边框留在 demoOnlyVisualControls。",
    sectionTitle: "Wizarding Desk",
    tabs: ["录取", "课程", "卡牌"],
    cards: [
      { title: "入学信面板", copy: "用 Card 承接羊皮纸式内容面板，文字和边界使用棕金 token，装饰纹理只作为 demo 背景。" },
      { title: "魔咒卡组", copy: "媒体图、卡牌框、魔法光效和角色插画属于品牌资产层，不写入正式 dangoui token。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#221b15" },
      { name: "--du-bg-1", value: "#493832" },
      { name: "--du-text-1", value: "#f4eedc" },
      { name: "--du-text-2", value: "#e9d9c5" },
      { name: "--du-text-3", value: "#c8b08b" },
      { name: "--du-border-1", value: "#8e6140" },
      { name: "--du-primary-color", value: "#996540" },
      { name: "--du-primary-border", value: "#8e6140" },
      { name: "--du-primary-outline-color", value: "#c8b08b" },
      { name: "--du-primary-soft-bg", value: "#2f241b" },
      { name: "--du-primary-solid-bg", value: "#996540" },
    ],
    style: {
      cardRadius: "0px",
      controlRadius: "0px",
      pageSpacing: "16px",
      cardShadow: "0 20px 48px rgba(0,0,0,.42), inset 0 0 0 1px rgba(200,176,139,.22)",
      media: "radial-gradient(circle at 72% 24%, rgba(96,172,190,.78), transparent 13%), radial-gradient(circle at 32% 36%, rgba(239,204,92,.72), transparent 15%), linear-gradient(135deg, rgba(20,19,16,.92), rgba(73,56,50,.92) 46%, rgba(153,101,64,.82)), repeating-linear-gradient(45deg, rgba(244,238,220,.14) 0 1px, transparent 1px 18px)",
      fontDisplay: "uifont_cn_title",
      fontNav: "navfont",
      iconSystem: "image-asset buttons + diamond bullets",
      borderFrame: "ornate gold corner frame / media_border asset",
    },
    signals: [
      { raw: "#6a3611", count: 12, percent: "10.4%", target: "--du-primary-border", value: "官网 CSS 高频古铜棕，承接边界/强调" },
      { raw: "#ffffff / #fefefe", count: 13, percent: "11.3%", target: "--du-text-1 / --du-white-*", value: "Logo、亮标题、反相文字" },
      { raw: "#696a75", count: 8, percent: "7%", target: "--du-text-3", value: "输入 placeholder / 弱信息" },
      { raw: "#523c2e", count: 7, percent: "6.1%", target: "--du-bg-1", value: "深棕面板/弹层表面" },
      { raw: "#e9d9c5", count: 6, percent: "5.2%", target: "--du-text-1", value: "羊皮纸高亮文字" },
      { raw: "#c8b08b", count: 4, percent: "3.5%", target: "--du-text-3", value: "金色标签、媒体导航文字" },
      { raw: "手绘场景/角色/魔法蓝光", count: 6, percent: "图片采样", target: "demoOnlyVisualControls", value: "霍格沃茨街景、角色卡、飞贼、光效" },
      { raw: "uifont_cn_title / navfont", count: 2, percent: "字体资产", target: "demoOnlyVisualControls", value: "官网字体包，用于标题和导航，不进入 dangoui token" },
      { raw: "media_border / top_nav_h / button png", count: 6, percent: "图片资产", target: "demoOnlyVisualControls", value: "装饰边框、导航高亮、按钮/icon 图片" },
    ],
  },
  {
    id: "re1999",
    label: "1999",
    icon: "/assets/re1999-logo.png",
    source: "re.bluepoch.com/home / HTML + CSS",
    hero: "Reverse:1999",
    notice: "20 世纪复古神秘学 RPG 官网风格：黑底、暖纸、古铜橙、衬线标题、档案式资讯框和角色文件感。",
    evidenceNote: "频次来自官网 CSS 色值引用口径；#B55829 是最高频强调色，#BBA893/#E9DCCD 承接复古纸面文字，#131818/#000000 承接深色站点底。",
    sectionTitle: "Arcane Archive",
    tabs: ["首页", "资讯", "档案"],
    cards: [
      { title: "暴雨档案", copy: "NavigationBar、Card、Tag 和 Button 保持 dangoui 结构，外层换成复古档案站的深色纸面与古铜边界。" },
      { title: "角色文件", copy: "角色介绍、资讯轮播和下载面板分别作为三个样板页，不把插画资产误写成正式 token。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#000000" },
      { name: "--du-bg-1", value: "#131818" },
      { name: "--du-text-1", value: "#E9DCCD" },
      { name: "--du-text-2", value: "#BBA893" },
      { name: "--du-text-3", value: "#BBA893" },
      { name: "--du-border-1", value: "#45392F" },
      { name: "--du-primary-color", value: "#B55829" },
      { name: "--du-primary-border", value: "#B55829" },
      { name: "--du-primary-outline-color", value: "#db6f39" },
      { name: "--du-primary-soft-bg", value: "#2a160f" },
      { name: "--du-primary-solid-bg", value: "#B55829" },
    ],
    style: {
      cardRadius: "0px",
      controlRadius: "0px",
      pageSpacing: "16px",
      cardShadow: "0 18px 42px rgba(0,0,0,.42), inset 0 0 0 1px rgba(181,88,41,.18)",
      media: "radial-gradient(circle at 72% 28%, rgba(219,111,57,.34), transparent 18%), radial-gradient(circle at 30% 18%, rgba(187,168,147,.18), transparent 22%), repeating-linear-gradient(90deg, rgba(233,220,205,.05) 0 1px, transparent 1px 18px), linear-gradient(135deg,#090909,#131818 52%,#45392f)",
    },
    signals: [
      { raw: "#B55829", count: 10, percent: "约 23%", target: "--du-primary-color / --du-primary-border", value: "导航激活、分隔线、资讯标签、框体强调" },
      { raw: "#BBA893", count: 6, percent: "约 14%", target: "--du-text-2 / --du-text-3", value: "导航弱文字、正文说明、角色副文案" },
      { raw: "#000000", count: 4, percent: "约 9%", target: "--du-bg-2", value: "站点深色底和大面积黑场" },
      { raw: "#db6f39", count: 3, percent: "约 7%", target: "--du-primary-outline-color", value: "高亮橙、hover/active 辅助强调" },
      { raw: "#E9DCCD", count: 2, percent: "约 5%", target: "--du-text-1", value: "暗底标题、主导航文本" },
      { raw: "#45392F", count: 2, percent: "约 5%", target: "--du-border-1", value: "资讯列表边界、档案框线" },
      { raw: "SourceHanSerifCN / cn", count: 2, percent: "字体资产", target: "demoOnlyVisualControls", value: "复古衬线标题与无衬线正文，不写入 dangoui token" },
      { raw: "paper / role / first visual assets", count: 5, percent: "图片资产", target: "demoOnlyVisualControls", value: "档案纸张、角色图和首屏插画只作为页面 CSS" },
    ],
  },
  {
    id: "apple",
    label: "Apple",
    icon: "https://www.apple.com/apple-touch-icon.png",
    source: "组件引用口径 / 46 次",
    hero: "Apple Gallery",
    notice: "按 DESIGN-apple.md 的组件颜色引用统计，把行动蓝、近黑文字、白/羊皮纸表面写入 dangoui token value。",
    evidenceNote: "频次来自上游 DESIGN 文档 components: 对 colors.* 的引用次数，共 46 次；百分比 = 该颜色引用次数 / 46。圆角、阴影、摄影质感只作为 demo 视觉控制，不写入 dangoui token。",
    sectionTitle: "Museum Feed",
    tabs: ["产品", "故事", "购买"],
    cards: [
      { title: "产品展陈", copy: "Card 仍然是 dangoui 组件，但表面、文字和行动入口已经换成 Apple 迁移稿里的 token value。" },
      { title: "安静控件", copy: "白色/羊皮纸表面承担主要氛围，行动蓝只负责链接、按钮和可点击信号。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f5f5f7" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#1d1d1f" },
      { name: "--du-text-3", value: "#7a7a7a" },
      { name: "--du-primary-color", value: "#0066cc" },
      { name: "--du-primary-border", value: "#0066cc" },
      { name: "--du-primary-outline-color", value: "#0066cc" },
      { name: "--du-primary-soft-bg", value: "#eaf3ff" },
      { name: "--du-primary-solid-bg", value: "#0066cc" },
    ],
    style: {
      cardRadius: "28px",
      controlRadius: "999px",
      pageSpacing: "20px",
      cardShadow: "0 18px 48px rgba(0,0,0,.08)",
      media: "linear-gradient(145deg,#ffffff,#f5f5f7 48%,#d7e8ff)",
    },
    signals: [
      { raw: "#1d1d1f", count: 10, percent: "21.7%", target: "--du-text-1", value: "文字层级 / colors.ink" },
      { raw: "#ffffff", count: 6, percent: "13%", target: "--du-bg-1", value: "中性表面 / colors.canvas" },
      { raw: "#ffffff", count: 6, percent: "13%", target: "--du-white-*", value: "暗底文字 / colors.on-dark" },
      { raw: "#0066cc", count: 6, percent: "13%", target: "--du-primary-color", value: "品牌行动入口 / colors.primary" },
      { raw: "#f5f5f7", count: 4, percent: "8.7%", target: "--du-bg-2", value: "羊皮纸表面 / colors.canvas-parchment" },
      { raw: "#ffffff", count: 4, percent: "8.7%", target: "--du-white-*", value: "主按钮文字 / colors.on-primary" },
      { raw: "#333333", count: 2, percent: "4.3%", target: "--du-text-2", value: "弱化文字 / colors.ink-muted-80" },
      { raw: "#272729", count: 2, percent: "4.3%", target: "--du-bg-4", value: "暗色产品区块 / colors.surface-tile-1" },
    ],
  },
  {
    id: "figma",
    label: "Figma",
    icon: "https://static.figma.com/app/icon/1/favicon.ico",
    source: "官网/品牌书口径",
    hero: "Design Systems",
    notice: "Figma 官网的白底黑字、清晰界面边界和多色协作资产，被拆成 dangoui token 与 demo 视觉控制两层。",
    evidenceNote: "频次来自官网首页与官方品牌/开发者资料的 UI 颜色口径推演；黑白中性进入 dangoui token，多色品牌图形和协作画布色只作为品牌资产或 demo 视觉控制。",
    sectionTitle: "Team Workspace",
    tabs: ["设计", "组件", "变量"],
    cards: [
      { title: "协作画布", copy: "同一张 Card 保持 dangoui 结构，换成更像 Figma 的白色画布、黑色行动入口和清晰边框。" },
      { title: "变量系统", copy: "品牌多色不污染 primary，而是作为图形资产留在 demo 视觉控制里。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f5f5f5" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#1e1e1e" },
      { name: "--du-text-3", value: "#757575" },
      { name: "--du-border-1", value: "#d9d9d9" },
      { name: "--du-primary-color", value: "#1e1e1e" },
      { name: "--du-primary-border", value: "#1e1e1e" },
      { name: "--du-primary-outline-color", value: "#1e1e1e" },
      { name: "--du-primary-soft-bg", value: "#f2f2f2" },
      { name: "--du-primary-solid-bg", value: "#1e1e1e" },
    ],
    style: {
      cardRadius: "14px",
      controlRadius: "8px",
      pageSpacing: "16px",
      cardShadow: "0 10px 0 rgba(30,30,30,.04), 0 0 0 1px rgba(30,30,30,.10)",
      media: "conic-gradient(from 180deg at 50% 50%, #ff3737 0 20%, #ff7237 0 40%, #24cb71 0 60%, #00b6ff 0 80%, #874fff 0 100%)",
    },
    signals: [
      { raw: "#ffffff", count: 36, percent: "32%", target: "--du-bg-1", value: "页面/画布表面" },
      { raw: "#1e1e1e", count: 24, percent: "21%", target: "--du-text-1 / --du-primary-color", value: "文字与主要行动入口" },
      { raw: "#f5f5f5", count: 16, percent: "14%", target: "--du-bg-2", value: "弱区块背景" },
      { raw: "#757575", count: 12, percent: "11%", target: "--du-text-3", value: "二级文字" },
      { raw: "#d9d9d9", count: 9, percent: "8%", target: "--du-border-1", value: "清晰界面边界" },
      { raw: "#874fff", count: 8, percent: "7%", target: "承接缺口", value: "品牌图形/协作色" },
      { raw: "#ff3737 / #24cb71 / #00b6ff", count: 8, percent: "7%", target: "承接缺口", value: "多色品牌资产" },
    ],
  },
  {
    id: "notion",
    label: "Notion",
    icon: "https://www.notion.so/images/favicon.ico",
    source: "DESIGN-notion.md / 组件引用口径",
    hero: "Notion Workspace",
    notice: "暖白纸面、近黑 Inter 字体、蓝色 primary action 和多色贴纸被拆成 dangoui token 与 demo-only 视觉控制。",
    evidenceNote: "频次来自 DESIGN-notion.md 的 components: 对 colors.* 的引用统计；#0075de 出现 3/33 次，占 9.1%，只承接 primary CTA、badge 和 active indicator，不代表整体主题色。",
    sectionTitle: "Paper-Calm Docs",
    tabs: ["文档", "知识库", "团队"],
    cards: [
      { title: "安静文档壳", copy: "大面积白和暖灰承接页面节奏，按钮只保留一个清晰蓝色行动入口。" },
      { title: "贴纸人格层", copy: "紫、粉、橙、绿等品牌色只作为插画/贴纸资产，不污染 dangoui 语义 token。" },
    ],
    tokens: [
      { name: "--du-bg-2", value: "#f6f5f4" },
      { name: "--du-bg-1", value: "#ffffff" },
      { name: "--du-text-1", value: "#000000" },
      { name: "--du-text-2", value: "#31302e" },
      { name: "--du-text-3", value: "#615d59" },
      { name: "--du-border-1", value: "#e6e6e6" },
      { name: "--du-primary-color", value: "#0075de" },
      { name: "--du-primary-border", value: "#0075de" },
      { name: "--du-primary-outline-color", value: "#0075de" },
      { name: "--du-primary-soft-bg", value: "#edf6ff" },
      { name: "--du-primary-solid-bg", value: "#0075de" },
    ],
    style: {
      cardRadius: "12px",
      controlRadius: "999px",
      pageSpacing: "16px",
      cardShadow: "0 1px 0 rgba(0,0,0,.08), 0 14px 34px rgba(33,49,131,.08)",
      media: "radial-gradient(circle at 20% 26%, #62aef0 0 15%, transparent 16%), radial-gradient(circle at 68% 22%, #d6b6f6 0 13%, transparent 14%), radial-gradient(circle at 44% 68%, #ff64c8 0 12%, transparent 13%), radial-gradient(circle at 78% 72%, #1aae39 0 10%, transparent 11%), linear-gradient(135deg,#ffffff,#f6f5f4)",
    },
    signals: [
      { raw: "#ffffff", count: 8, percent: "24.2%", target: "--du-bg-1 / --du-white-*", value: "canvas、surface、on-primary" },
      { raw: "#000000", count: 7, percent: "21.2%", target: "--du-text-1", value: "标题、正文、次级按钮文字" },
      { raw: "#f6f5f4", count: 3, percent: "9.1%", target: "--du-bg-2", value: "canvas-soft、featured pricing、footer" },
      { raw: "#0075de", count: 3, percent: "9.1%", target: "--du-primary-color", value: "primary CTA、badge、app-shell active indicator" },
      { raw: "#e6e6e6", count: 2, percent: "6.1%", target: "--du-border-1", value: "Divider、table row、drawer divider" },
      { raw: "#213183", count: 1, percent: "3%", target: "demoOnlyVisualControls", value: "hero-band dark island" },
      { raw: "贴纸多色 palette", count: 9, percent: "27.3%", target: "demoOnlyVisualControls", value: "accent-sky/purple/pink/orange/teal/green/brown" },
    ],
  },
  {
    id: "spotify",
    label: "Spotify",
    icon: "/assets/style-icons/spotify-square.svg",
    source: "DTCG 测试资产 / 108 次",
    hero: "Daily Mix",
    notice: "深色媒体界面、强品牌绿和更厚重卡片被填入同一套 token value。",
    evidenceNote: "第三个 demo 例子：频次来自当前 Spotify-ish 抽样，共 108 次 UI color 统计；color 映射到 dangoui --du-*，radius/shadow/component pattern 进入 DTCG 迁移资产和 adapter。",
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
      { name: "--du-primary-border", value: "#1ed760" },
      { name: "--du-primary-outline-color", value: "#1ed760" },
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
      { raw: "#121212", count: 28, percent: "25.9%", target: "--du-bg-2", value: "#121212" },
      { raw: "#181818", count: 22, percent: "20.4%", target: "--du-bg-1", value: "#181818" },
      { raw: "#ffffff", count: 19, percent: "17.6%", target: "--du-text-1", value: "#ffffff" },
      { raw: "#b3b3b3", count: 16, percent: "14.8%", target: "--du-text-3", value: "#b3b3b3" },
      { raw: "#1ed760", count: 14, percent: "13%", target: "--du-primary-color", value: "#1ed760" },
      { raw: "#153b25", count: 9, percent: "8.3%", target: "--du-primary-soft-bg", value: "#153b25" },
    ],
  },
];
const componentDocs = {
  Avatar: `${docsBaseUrl}/data-display/avatar`,
  Badge: `${docsBaseUrl}/data-display/badge`,
  NavigationBar: `${docsBaseUrl}/navigation/navigation-bar`,
  Card: `${docsBaseUrl}/data-display/card`,
  Checkbox: `${docsBaseUrl}/form/checkbox`,
  Divider: `${docsBaseUrl}/data-display/divider`,
  Empty: `${docsBaseUrl}/feedback/empty`,
  Input: `${docsBaseUrl}/form/input`,
  NoticeBar: `${docsBaseUrl}/feedback/notice-bar`,
  Radio: `${docsBaseUrl}/form/radio`,
  Rate: `${docsBaseUrl}/form/rate`,
  Search: `${docsBaseUrl}/form/search`,
  Stepper: `${docsBaseUrl}/form/input-number`,
  Skeleton: `${docsBaseUrl}/feedback/skeleton`,
  Popup: `${docsBaseUrl}/feedback/popup`,
  Upload: `${docsBaseUrl}/form/upload`,
  Steps: `${docsBaseUrl}/data-display/steps`,
  Tabs: `${docsBaseUrl}/data-display/tabs`,
  Tab: `${docsBaseUrl}/data-display/tabs`,
  Tag: `${docsBaseUrl}/data-display/tag`,
  Textarea: `${docsBaseUrl}/form/textarea`,
  Button: `${docsBaseUrl}/general/button`,
  Switch: `${docsBaseUrl}/form/switch`,
};
const editableByComponent = {
  Avatar: ["头像内容", "类型", "尺寸", "边框", "角标"],
  Badge: ["数值", "颜色", "红点", "最大值"],
  NavigationBar: ["标题", "返回按钮", "右侧动作", "背景", "固定/透明状态"],
  Card: ["图片", "标题", "标签", "摘要", "圆角", "阴影"],
  Checkbox: ["选中状态", "形状", "文案", "颜色", "禁用状态"],
  Divider: ["方向", "长度", "颜色", "文案"],
  Empty: ["空状态文案", "按钮文案", "插图", "动作"],
  Input: ["值", "占位文案", "前缀", "后缀", "边框"],
  Radio: ["选中状态", "文案", "颜色", "禁用状态"],
  Rate: ["分值", "数量", "尺寸", "颜色", "半选"],
  Search: ["占位文案", "只读/输入态", "背景", "右侧动作"],
  Skeleton: ["加载态", "骨架结构", "尺寸"],
  Spin: ["加载状态", "尺寸", "文案", "局部/全局范围"],
  Steps: ["步骤列表", "当前步骤", "状态", "颜色"],
  NoticeBar: ["提示文案", "链接文案", "色彩", "关闭按钮"],
  Tabs: ["标签项", "激活项", "样式类型", "激活色"],
  Tag: ["文案", "状态色", "圆角", "边框"],
  Button: ["按钮文案", "类型", "尺寸", "全宽", "禁用/加载状态"],
  Switch: ["开关状态", "颜色", "禁用状态"],
  Textarea: ["值", "占位文案", "字数统计", "边框"],
  DateTimePicker: ["日期", "时间", "最小/最大值", "确认文案"],
  FAB: ["位置", "图标", "前景色", "阴影", "显隐侧"],
  FeedSpuTag: ["内容流", "商品模型", "标签", "行动入口"],
  FormItem: ["标签", "必填", "提示", "字段插槽", "底线"],
  Grid: ["列数", "图标/图片", "文案", "间距"],
  Group: ["标题", "分组说明", "字段列表", "间距"],
  HeroHeader: ["主视觉", "标题", "副标题", "行动入口", "安全区"],
  List: ["行内容", "右侧动作", "分隔线", "状态"],
  Popover: ["触发点", "浮层内容", "方向", "关闭方式"],
  PriceStatistic: ["价格", "指标", "单位", "趋势"],
  Popup: ["打开状态", "位置", "遮罩", "关闭方式"],
  ResultPage: ["结果状态", "主文案", "辅助文案", "下一步动作"],
  ShareSheet: ["渠道", "布局", "取消动作", "业务回调"],
  SpuTag: ["商品模型", "状态标签", "业务字段"],
  Stepper: ["数值", "最小/最大值", "步进", "禁用态"],
  SegmentControl: ["选中项", "分段项", "尺寸", "激活色"],
  Swiper: ["图片列表", "当前项", "自动播放", "指示器"],
  Time: ["日期", "时间", "倒计时", "时区"],
  Tips: ["提示内容", "触发方式", "语气", "位置"],
  Toast: ["文案", "类型", "时长", "触发动作"],
  Upload: ["文件类型", "数量限制", "上传状态", "回调"],
  DownloadPanel: ["下载入口", "平台", "二维码", "福利信息"],
  QRCode: ["二维码", "说明文案", "下载动作"],
  CharacterPanel: ["角色名", "角色立绘", "语音", "档案卡片"],
  TabBar: ["选中项", "图标", "文字", "激活色", "底部分隔线"],
  BottomBar: ["固定位置", "安全区", "操作按钮", "背景"],
  Menu: ["菜单项", "层级", "选中项", "展开状态"],
};
const friendlyDescriptions = {
  Avatar: "头像组件，用来展示用户、团队或身份标识。",
  Badge: "徽标组件，用来显示数量、红点或状态提醒。",
  NavigationBar: "页面顶部导航，负责标题、返回/分享等顶部动作。",
  Search: "搜索入口，让用户按关键词查找活动、内容或配置项。",
  NoticeBar: "页面公告条，用来提示运营状态、风险或待处理事项。",
  Tabs: "内容分组切换，用来在热门、最新、运营推荐等列表间切换。",
  Tag: "状态或分类标签，用短文案标记主推、已配置、待审核等状态。",
  Card: "内容承载容器，适合放图片、标题、摘要和操作信息。",
  Button: "主要操作入口，例如发布、保存、确认。",
  Checkbox: "多选控件，用来表达多个可同时启用的选项。",
  Divider: "分割线组件，用来组织区域和视觉层级。",
  Empty: "空状态组件，用来表达暂无内容或未命中结果。",
  Input: "单行输入控件，用来输入名称、关键词或配置值。",
  Radio: "单选控件，用来表达互斥选项。",
  Rate: "评分控件，用来展示满意度或反馈分数。",
  Skeleton: "骨架屏组件，用来表达加载中的内容结构。",
  Spin: "加载指示器，用于局部等待或轻量异步状态。",
  Steps: "步骤组件，用来展示流程阶段和当前进度。",
  Switch: "开关设置，用来表达启用/关闭一类配置。",
  Swiper: "轮播组件，用来展示多张图片、运营 Banner 或可横滑内容。",
  Textarea: "多行文本输入控件，用来输入描述、说明或备注。",
  DateTimePicker: "日期时间选择器，用来输入预约、发布、截止等时间字段；当前由 DangoUI Calendar 的 showTimePicker 模式承接。",
  Group: "表单分组，用来把一组相关输入项组织在同一语义区域。",
  Popup: "弹层组件，用来承载需要临时浮出的内容或操作。底部弹层按内容量选择 30% / 60% / 88% 三档高度：轻选择用 30%，层级选择/筛选用 60%，重内容详情用 88%。",
  Upload: "上传组件，用来把图片、文件或素材提交到服务器。",
  DownloadPanel: "下载入口面板，聚合 PC、移动端、二维码和平台下载动作。",
  QRCode: "扫码下载模块，用来承接移动端下载或预约转换。",
  CharacterPanel: "角色详情面板，展示角色名、语音、立绘、技能卡片和查看更多动作。",
  FAB: "悬浮动作入口，当前作为 app shell 自定义样式处理，DangoUI 暂无独立 FAB。",
  FeedSpuTag: "内容流、商品模型和标签的业务组合，DangoUI 提供 Card/Image/Tag/Button 原子能力。",
  FormItem: "表单字段行组件，用来承接标签、必填、提示和输入插槽。",
  Grid: "宫格入口通常是业务布局，当前由页面 CSS 或业务组件承接。",
  HeroHeader: "首屏主视觉包裹组件，图片层可由 DuImage 承接，但安全区、内容层、遮罩和行动区仍需要 HeroHeader 规范。",
  List: "列表是基础业务布局，DangoUI 当前没有独立 List 组件。",
  Popover: "轻量浮层说明，DangoUI 当前没有独立 Popover，可由 Tooltip/Popup 或业务组件替代。",
  PriceStatistic: "价格和指标统计属于业务展示组件，DangoUI 当前没有直接组件。",
  ResultPage: "结果页属于页面模板，可由 Empty、Icon、Button 等组合。",
  ShareSheet: "分享面板可由 ActionSheet 承接，分享渠道和回调属于业务。",
  SpuTag: "SPU 标签是业务模型组件，DangoUI 可承接 Tag 原子能力。",
  Stepper: "Stepper 是业务叫法，生产代码用 DangoUI 的 DuInputNumber 承接；后续清单里归为命名/文档口径待更新，不是组件待新增。",
  SegmentControl: "分段控制器需要 DangoUI 新增正式组件或命名规范。",
  Time: "时间/倒计时展示属于业务格式化组件，DangoUI 当前没有独立 Time。",
  Tips: "字段提示可由 FormItem tips 或 Tooltip 承接，独立 Tips 仍是缺口。",
  Toast: "DangoUI 提供 ToastProvider/useToast，但不是独立可见组件。",
  TabBar: "页面底部一级导航。当前 dangoui 没有内置 TabBar，需要后续补 schema。",
  BottomBar: "底部操作栏需要 DangoUI 新增正式组件或命名规范。",
  Menu: "菜单组件需要 DangoUI 新增正式组件或命名规范。",
};
const distributionFriendlyDescriptions = {
  NavigationBar: "用户进页面先看这里：告诉他当前在哪一页、能不能返回、能不能搜索。活动页、专题页、内容流都需要一个稳定顶部。",
  Search: "当内容、商品、活动入口变多时，用搜索帮用户直接找目标；运营也能把搜索词当成用户需求信号。",
  HeroHeader: "分发侧最像海报的首屏：用一张主视觉、一句卖点和一个行动入口，把用户立刻带进活动或内容主题。",
  Image: "图片不是装饰位，而是内容证据：展示商品封面、活动主图、角色图或专题视觉，让用户先被画面吸引。",
  Swiper: "轮播适合承接多张主推 Banner：首屏资源位、活动合集、版本更新、专题入口都可以放这里。",
  TabBar: "底部一级入口，让用户在首页、发现、我的这类高频页面间切换；它是 app shell，不是内容卡片。",
  Grid: "宫格是快捷入口区：把活动、商品、任务、资讯这些高频动作排成一眼能扫完的入口。",
  List: "列表适合承接持续更新的信息流：公告、攻略、资源位、推荐内容，重点是标题清楚、右侧状态明确。",
  Card: "卡片负责把一条运营内容包装完整：封面、标题、摘要、标签和行动按钮都能放进来。",
  Time: "时间让用户知道活动节奏：什么时候开始、什么时候截止、还剩多久，适合限时活动和预约节点。",
  PriceStatistic: "价格和指标用于刺激决策：价格、热度、折扣、库存、参与人数，都能帮助用户判断值不值得点。",
  FeedSpuTag: "内容流 + 商品 + 标签的组合：适合把种草内容、商品卡、活动标签和购买/报名动作串起来。",
  Rate: "评分在分发侧更像信任背书：告诉用户这个内容、商品或活动口碑如何，降低点击前的不确定。",
  FAB: "右下角悬浮的快速发布/创建入口，只在需要用户随时发起动作时出现，不要当普通内容块解释。",
  Tabs: "Tabs 用来给同一块内容分频道：推荐、最新、活动、攻略、热门，让用户不用离开页面就能换视角。",
  Button: "按钮是运营转化的最后一步：立即报名、查看详情、领取福利、去购买，文案要直接说清动作。",
  Tag: "标签帮用户快速扫重点：限时、主推、上新、已结束、热卖，把内容状态压缩成几个字。",
};
const displayFriendlyDescriptions = {
  NavigationBar: "展示侧的导航负责告诉用户正在看哪个对象，也提供返回上一层的路径，不承担首页导流。",
  Image: "图片在展示侧是对象本身的证据：商品图、角色图、媒体图、截图或档案图，帮助用户确认看到的是什么。",
  Avatar: "头像用来说明对象背后的身份：用户、作者、角色、团队或账号，让信息不只是冷冰冰的文字。",
  Badge: "徽标用于补充对象状态或数量：等级、未读数、星级、更新数，让关键信息一眼被看见。",
  Swiper: "展示侧的轮播不是资源位导流，而是同一个对象的多图/多视频浏览，比如图库、截图、PV、角色动作。",
  Popup: "Popup 用来展开当前对象的更多细节，例如图片大图、资料说明、筛选条件或临时操作。",
  List: "展示侧列表负责把对象的属性、记录或明细排清楚，例如资料项、订单明细、成就记录、服务状态。",
  Steps: "步骤条让用户知道当前对象处在哪个流程阶段，例如提交、审核、完成，适合进度和履约状态。",
  Time: "时间在展示侧用于说明对象的时间信息：创建、更新、同步、开始、结束或最近一次状态变化。",
  PriceStatistic: "价格和指标在展示侧用于解释对象价值：价格、评分、排名、库存、参与人数或核心数据。",
  Rate: "评分是对象口碑或质量信号，适合商品、内容、服务、活动反馈，不负责导流，只帮助判断。",
  Card: "展示侧 Card 是信息分组，把对象的参数、摘要、说明、媒体或状态整理成可读模块。",
  Tabs: "展示侧 Tabs 用来切对象的不同维度：详情、媒体、记录、评论，而不是切换资源频道。",
  Tag: "展示侧 Tag 标记对象属性：状态、分类、等级、身份、服务端结果，帮助用户理解对象。",
  Button: "展示侧 Button 是对当前对象执行动作：查看详情、收藏、分享、联系、继续处理。",
};
const componentChineseNames = {
  Avatar: "头像",
  Badge: "徽标",
  Button: "按钮",
  Card: "内容卡片",
  Checkbox: "复选框",
  Cascader: "级联选择",
  Dialog: "弹窗",
  Dropdown: "下拉筛选",
  Empty: "空状态",
  FAB: "悬浮按钮",
  FeedSpuTag: "内容商品标签",
  FormItem: "表单项",
  Grid: "宫格",
  HeroHeader: "首屏头图",
  Image: "图片",
  Input: "输入框",
  List: "列表",
  NavigationBar: "顶部导航",
  NoticeBar: "公告条",
  Popover: "气泡浮层",
  PriceStatistic: "价格指标",
  Rate: "评分",
  Radio: "单选框",
  ResultPage: "结果页",
  Search: "搜索",
  Select: "选择器",
  ShareSheet: "分享面板",
  Skeleton: "骨架屏",
  SpuTag: "商品标签",
  Spin: "加载",
  Snackbar: "轻提示",
  SegmentControl: "分段控制",
  Stepper: "步进器 / InputNumber",
  Steps: "步骤条",
  Switch: "开关",
  Swiper: "轮播",
  TabBar: "底部导航栏",
  BottomBar: "底部操作栏",
  Tabs: "标签切换",
  Tag: "标签",
  Textarea: "多行输入",
  Time: "时间",
  Tips: "提示",
  Toast: "吐司",
  DateTimePicker: "日期时间",
  Group: "分组",
  Popup: "弹层",
  Upload: "上传",
  Menu: "菜单",
  DownloadPanel: "下载面板",
  QRCode: "二维码",
  CharacterPanel: "角色详情",
};

const componentDisplayNames = {
  NavigationBar: "Navigation Bar",
  Search: "Search",
  Tabs: "Tabs",
  SegmentControl: "SegmentControl",
  TabBar: "Tab Bar",
  BottomBar: "Bottom Bar",
  Menu: "Menu",
  PriceStatistic: "Price and Statistic",
  Swiper: "Swipe",
  Snackbar: "SnackBar",
  ShareSheet: "Sharesheet",
  ResultPage: "Result Page",
};

const componentSupportMap = {
  NavigationBar: "DangoUI",
  Search: "DangoUI",
  Card: "DangoUI",
  Image: "DangoUI",
  Badge: "DangoUI",
  Avatar: "DangoUI",
  Swiper: "DangoUI",
  Popup: "DangoUI",
  Steps: "DangoUI",
  Rate: "DangoUI",
  FormItem: "DangoUI",
  Input: "DangoUI",
  Textarea: "DangoUI",
  Radio: "DangoUI",
  Checkbox: "DangoUI",
  Switch: "DangoUI",
  Upload: "DangoUI",
  Stepper: "DangoUI 待更新",
  Cascader: "DangoUI",
  Select: "DangoUI",
  NoticeBar: "DangoUI",
  Snackbar: "DangoUI",
  Dialog: "DangoUI",
  Dropdown: "DangoUI",
  Empty: "DangoUI",
  Skeleton: "DangoUI",
  Tabs: "DangoUI",
  Button: "DangoUI",
  Tag: "DangoUI",
  Toast: "DangoUI 待更新",
  ShareSheet: "DangoUI 待更新",
  Tips: "DangoUI 待新增",
  SegmentControl: "DangoUI 待新增",
  HeroHeader: "DangoUI 待新增",
  Grid: "DangoUI 待新增",
  List: "DangoUI 待新增",
  Time: "DangoUI 待新增",
  PriceStatistic: "业务组件",
  FeedSpuTag: "业务组件",
  SpuTag: "业务组件",
  Group: "DangoUI",
  ResultPage: "DangoUI 待更新",
  FAB: "DangoUI 待新增",
  TabBar: "DangoUI 待新增",
  BottomBar: "DangoUI 待新增",
  Menu: "DangoUI 待新增",
  DateTimePicker: "DangoUI 待更新",
  Popover: "缺口",
  Spin: "缺口",
};

const catalog = ref({ source: {}, tokens: [], components: [], missingComponents: [] });
const selectedInstanceId = ref("");
const selectedComponent = ref("");
const selectedComponentCategoryId = ref("bar");
const selectedTokenName = ref("");
const tokensExpanded = ref(false);
const selectedTemplateId = ref("re1999-home");
const templateHistory = ref([]);
const selectedInspectorTab = ref("pages");
const selectedWorkspaceMode = ref("components");
const selectedStyleCategoryId = ref("");
const phoneRef = ref(null);
const mockupScale = ref(1);
const mockupHoverLabel = ref("");
const mockupHoverStyle = ref({});
let phoneResizeObserver = null;
const re1999NewsTab = ref("news");
const re1999NewsTag = ref("notice");
const re1999ArchiveTab = ref("profile");
const re1999HomePanel = ref("news");
const re1999MediaTab = ref("pv");
const hpmaHomePanel = ref("news");
const hpmaNewsTab = ref("event");
const hpmaNewsTag = ref("event");
const hpmaCardTab = ref("spell");
const hpmaMediaTab = ref("video");
const cznHomePanel = ref("forward");
const cznMediaTab = ref("pv");
const copiedColorValue = ref("");
const snackbarMessage = ref("");
const snackbarOpen = ref(false);
const openEditableSelectKey = ref("");
const navExampleShowBack = ref(true);
const navExampleShowTitle = ref(true);
const navExampleShowSearch = ref(true);
const navExampleShowRight = ref(true);
const navExampleShowRefresh = ref(true);
const navExampleColor = ref("default");
const navigationColorOptions = [
  { label: "default", value: "default" },
  { label: "primary", value: "primary" },
  { label: "secondary", value: "secondary" },
  { label: "white", value: "white" },
];
const navigationAreaLeft = ref(true);
const navigationAreaDefault = ref(true);
const navigationAreaRight = ref(true);
const navigationSlotLeft = ref(true);
const navigationSlotScopedLeft = ref(false);
const navigationSlotDefault = ref(true);
const navigationSlotScopedDefault = ref(true);
const navigationSlotRight = ref(true);
const navigationSlotScopedRight = ref(false);
const navigationExampleTab = ref("discovery");
const navigationExamplePlaceholders = ["Molly", "Labubu", "Skullpanda"];
const searchExampleValue = ref("Labubu");
const tabsExampleDefault = ref("discovery");
const tabsExampleTag = ref("recommend");
const tabsExampleText = ref("all");
const componentExampleState = ref({
  active: true,
  disabled: false,
  bordered: true,
  rounded: true,
  searchPlaceholder: "rolling",
  tabsType: "default",
  tabsValue: "recommend",
  imageRadius: 10,
  textareaMaxlength: 80,
  stepperValue: 3,
  rateValue: 4,
  noticeType: "secondary",
  noticeColor: "primary",
  snackbarButtonColor: "white",
  showLabel: true,
  showHelper: true,
  showAction: true,
  showIcon: true,
  showMedia: true,
  showCount: true,
  showClose: true,
  calendarShowTimePicker: true,
  calendarSelectedDate: null,
  calendarSelectedTime: null,
});
let componentExamplePopup = ref(null);
let snackbarTimer = null;
let snackbarCloseTimer = null;

const re1999NewsCopy = {
  news: {
    items: [
      { title: "《重返未来：1999》版本更新公告", body: "维护完成后，司辰可前往领取补偿邮件。" },
      { title: "神秘学家征集概率说明", body: "限定征集、角色档案与活动说明同步更新。" },
      { title: "「暴雨」档案馆资料增补", body: "新增角色故事、影像资料和特别访谈。" },
    ],
  },
  notice: {
    items: [
      { title: "停服维护与资源更新说明", body: "维护期间暂不可登录，补偿将在开服后发放。" },
      { title: "客户端资源修复公告", body: "修复部分界面贴图、音频与档案页显示问题。" },
      { title: "账号安全提醒", body: "请通过官方渠道下载并绑定有效联系方式。" },
    ],
  },
  event: {
    items: [
      { title: "限时活动「旧雨新知」开启", body: "完成调查任务可获得活动代币与养成材料。" },
      { title: "角色试用关卡开放", body: "新增神秘学家试用与活动剧情挑战。" },
      { title: "签到奖励阶段更新", body: "连续登录可领取纯雨滴和启寤材料。" },
    ],
  },
  media: {
    items: [
      { title: "版本 PV 正式公开", body: "穿过暴雨之后，新的时代影像正在展开。" },
      { title: "开发组访谈：档案与叙事", body: "制作组分享角色文本、影像资料与时代设定。" },
      { title: "官方壁纸资源追加", body: "移动端与桌面端壁纸已加入资料库。" },
    ],
  },
};

const re1999HomePanels = {
  news: {
    kicker: "FEATURED RECORD",
    title: "暴雨档案馆开放",
    body: "首页直接露出资讯、角色和世界观内容，让访客先进入叙事，再选择下一步。",
    primaryTag: "版本情报",
    secondaryTag: "角色档案",
    galleryKicker: "VISUAL INDEX",
    galleryTitle: "时代影像",
    galleryBody: "用插画资产承担首页展示侧，而不是下载入口。",
  },
  archive: {
    kicker: "ARCANIST FILE",
    title: "神秘学家资料入库",
    body: "角色入口承接身份、星级、阵营和访谈摘要，让首页具备档案分发能力。",
    primaryTag: "角色文件",
    secondaryTag: "阵营记录",
    galleryKicker: "CASE PREVIEW",
    galleryTitle: "维尔汀档案",
    galleryBody: "角色立绘与纸面资料作为展示侧资产，适合继续进入档案页。",
  },
  media: {
    kicker: "MEDIA ROOM",
    title: "影像资料公开",
    body: "媒体入口展示 PV、壁纸、访谈与图库资源，保留官网的电影感和美术叙事。",
    primaryTag: "版本 PV",
    secondaryTag: "图库壁纸",
    galleryKicker: "GALLERY",
    galleryTitle: "暴雨影像集",
    galleryBody: "把插画、剧照和装饰资产放进首页展示侧，强化可浏览的媒体区。",
  },
};

const re1999MediaCopy = {
  pv: {
    kicker: "VERSION PV",
    title: "暴雨将至",
    items: ["版本预告影像", "主视觉分镜"],
    noteTitle: "PV 承接方式",
    noteBody: "用大画面、暗场渐变和古铜角线承接视频封面，不把视频区域降级成普通卡片。",
    tags: ["PV 封面", "电影感"],
  },
  gallery: {
    kicker: "GALLERY",
    title: "时代切片",
    items: ["角色壁纸", "场景美术"],
    noteTitle: "图库承接方式",
    noteBody: "图库页重点保留横向大图、缩略图节奏和纸面档案信息，不只展示图片路径。",
    tags: ["图库", "壁纸"],
  },
  interview: {
    kicker: "INTERVIEW",
    title: "档案访谈",
    items: ["制作组访谈", "神秘学家记录"],
    noteTitle: "访谈承接方式",
    noteBody: "访谈内容以档案条目、时间戳和影像缩略图组合呈现，和 NEWS 列表拉开差异。",
    tags: ["访谈", "档案"],
  },
};

const re1999NewsTagCopy = {
  notice: "筛选公告：列表更偏维护、版本说明和系统通知。",
  role: "筛选角色：列表更偏神秘学家档案、征集与试用。",
  event: "筛选活动：列表更偏任务、签到和限时奖励。",
};

const hpmaNewsCopy = {
  event: {
    items: [
      { title: "禁林调查限时开启", body: "羊皮纸列表用于承接资讯摘要、日期和跳转入口。" },
      { title: "舞会邀请函已送达", body: "完成课堂与舞会任务可领取赛季奖励。" },
    ],
  },
  news: {
    items: [
      { title: "魔法觉醒赛季更新", body: "新增伙伴卡、课堂玩法与社团活动内容。" },
      { title: "伙伴卡平衡性调整", body: "细金线分隔比普通卡片边框更贴近官网资讯区。" },
    ],
  },
  notice: {
    items: [
      { title: "学院活动维护公告", body: "维护完成后将通过邮件发放补偿奖励。" },
      { title: "资源包下载提示", body: "建议在稳定网络下更新最新魔法资源。" },
    ],
  },
};

const hpmaHomePanels = {
  news: {
    kicker: "OWL POST",
    title: "魔法资讯活动",
    body: "资讯入口承接公告、活动和赛季更新，用羊皮纸列表与金线分隔表现官网信息流。",
    primaryTag: "资讯",
    secondaryTag: "活动",
    galleryKicker: "NOTICE BOARD",
    galleryTitle: "公告栏",
    galleryBody: "公告入口应进入资讯页，不停留在首页内部预览。",
  },
  cards: {
    kicker: "SPELL BOOK",
    title: "魔咒&伙伴介绍",
    body: "源站第四项是魔咒&伙伴介绍，书页、卡牌弹层和点击提示比普通列表更重要。",
    primaryTag: "魔咒卡",
    secondaryTag: "伙伴卡",
    galleryKicker: "CARD INDEX",
    galleryTitle: "书页卡片",
    galleryBody: "这里的装饰来自 book/pop_card 一类图片，不用通用角线替代。",
  },
  media: {
    kicker: "MEDIA CENTER",
    title: "魔法媒体资料",
    body: "媒体入口承接 PV、壁纸和专题资料，用暗场大图与金线角标保留影像区识别。",
    primaryTag: "PV",
    secondaryTag: "壁纸",
    galleryKicker: "GALLERY FRAME",
    galleryTitle: "视听中心",
    galleryBody: "大图需要使用对应画框/裁切，不把边框泛化给所有卡片。",
  },
};

const hpmaMediaCopy = {
  video: {
    kicker: "TRAILER",
    title: "赛季预告影像",
    items: ["禁林调查 PV", "学院舞会预告"],
    noteTitle: "视频封面",
    noteBody: "保持暗场大图、金线角标和羊皮纸标题，避免变成普通图片卡。",
    tags: ["PV", "赛季"],
  },
  wallpaper: {
    kicker: "WALLPAPER",
    title: "学院壁纸",
    items: ["宿舍壁纸", "伙伴插画"],
    noteTitle: "图库承接",
    noteBody: "壁纸区更适合横向缩略图和学院标签，突出可收藏的素材属性。",
    tags: ["壁纸", "插画"],
  },
  feature: {
    kicker: "FEATURE",
    title: "魔法专题",
    items: ["魔咒课堂", "伙伴访谈"],
    noteTitle: "专题承接",
    noteBody: "专题页用卷轴式说明和小图标串联内容，比单一卡片更贴近官网专题。",
    tags: ["专题", "课堂"],
  },
};

const cznHomePanels = {
  forward: {
    kicker: "INTELLIGENCE",
    title: "前瞻情报一览",
    body: "这组入口来自 CZN 当前参考站内容证据；换站时必须重新采集导航和模块，不复用固定栏目。",
    primaryTag: "情报",
    secondaryTag: "活动",
    galleryKicker: "FEATURED",
    galleryTitle: "前瞻情报",
    galleryBody: "大图轮播和斜切信息框承担官网展示侧，而不是保留下载卡。",
  },
  character: {
    kicker: "AGENT FILE",
    title: "作战员档案",
    body: "角色入口承接立绘、身份、技能和语音资料，是 CZN 风格最核心的视觉资产。",
    primaryTag: "角色",
    secondaryTag: "技能",
    galleryKicker: "RENOA",
    galleryTitle: "黑玫瑰档案",
    galleryBody: "紫黑底、角色剪影和橙色斜切框形成可迁移的档案页模式。",
  },
  media: {
    kicker: "VISUAL FILE",
    title: "影像资料库",
    body: "媒体入口只有在源站存在 PV、截图、壁纸或图库证据时才成立；这里用于承接 CZN 的图像资料。",
    primaryTag: "PV",
    secondaryTag: "图库",
    galleryKicker: "SCREENSHOT",
    galleryTitle: "梦境切片",
    galleryBody: "用高对比图像、斜切遮罩和亮橙描边保留官网素材感。",
  },
};

const cznMediaCopy = {
  pv: {
    kicker: "TRAILER",
    title: "卡厄思梦境 PV",
    items: ["正式上线 PV", "公测前瞻"],
    noteTitle: "PV 承接",
    noteBody: "视频封面保留强角色图、斜切遮罩和橙色焦点线，避免退化为普通轮播。",
    tags: ["PV", "公测"],
  },
  screenshots: {
    kicker: "SCREENSHOTS",
    title: "战斗与场景截图",
    items: ["梦境场景", "战斗界面"],
    noteTitle: "截图承接",
    noteBody: "截图页适合白灰信息底和高饱和内容图，突出真实游戏画面。",
    tags: ["截图", "战斗"],
  },
  interview: {
    kicker: "ARCHIVE",
    title: "角色访谈资料",
    items: ["作战员访谈", "世界观设定"],
    noteTitle: "访谈承接",
    noteBody: "访谈内容应结合角色头像、台词和橙色标签，不只用纯文字列表。",
    tags: ["访谈", "设定"],
  },
};

const styleCategories = [
  {
    id: "color",
    label: "Color",
    zh: "颜色",
    meta: "dangoui token",
  },
  {
    id: "typography",
    label: "Typography",
    zh: "字体",
    meta: "待更新",
    description: "展示项目里已有的 H/B/N 字号层级、组件 CSS 字重/行高，以及品牌字体资产承接点。",
    status: "待提取",
    nextStep: "先补 display / title / body / caption 四级文字样式。",
    scope: "保留 dangoui 组件结构，优先映射到组件源码或文本 token；品牌字体气质只作为页面样式说明。",
  },
  {
    id: "icon",
    label: "Icon",
    zh: "图标",
    meta: "待更新",
    description: "展示项目里已有的 DuIcon、DuButton icon prop、语义色继承和品牌资产图标承接点。",
    status: "待提取",
    nextStep: "先判断参考站偏线性、填充、品牌符号还是系统图标。",
    scope: "不新造 icon name；缺失图标只记录为 demo-only 或 ask-user。",
  },
  {
    id: "button",
    label: "Button",
    zh: "按钮",
    meta: "待更新",
    description: "展示 Button、IconButton、FAB 三类行动入口在当前风格里的形态、状态和素材承接方式。",
    status: "待提取",
    nextStep: "先区分普通按钮换 token、图标按钮组合，以及悬浮行动入口是否需要业务级 FAB。",
    scope: "普通 Button 优先走 DangoUI Button；IconButton 由 Button/Icon/slot 组合；FAB 当前按待新增或页面 CSS 承接。",
  },
  {
    id: "asset",
    label: "Asset",
    zh: "图片资产",
    meta: "待更新",
    description: "展示项目里已采集的 PNG/JPG/WebP/SVG 资产，以及它们作为背景图、选中背景、装饰、frame 或 icon 的落地方式。",
    status: "待提取",
    nextStep: "先记录 asset role、尺寸、透明度、复用状态和目标 selector，再决定 Image/slot、CSS background、mask、border-image 或 ReviewQueue。",
    scope: "图片资产不写成 --du-* token；能用 dangoui Image/icon slot 承接的走组件，不能承接的走页面资产样式。",
  },
  {
    id: "divider",
    label: "Divider",
    zh: "分割线",
    meta: "token",
    description: "展示项目里已有的 Divider 组件、--du-border-* token、卡片边界和 Frame CSS 承接点。",
    status: "待提取",
    nextStep: "先补 Divider / --du-border-* / Frame 三类证据。",
    scope: "优先映射到 dangoui border token；特殊装饰线保留为页面装饰样式。",
  },
  {
    id: "layout",
    label: "Layout",
    zh: "布局",
    meta: "待更新",
    description: "展示项目里已有的 mockup viewport、页面模板、媒体比例和组件组合方式。",
    status: "待提取",
    nextStep: "先补页面节奏：顶部、主体、卡片流、底部模块的结构规则。",
    scope: "布局不是 dangoui token；落地时由模板、页面 CSS 和组件组合承接。",
  },
  {
    id: "spacing",
    label: "Spacing",
    zh: "间距",
    meta: "DangoUI 待新增",
    description: "当前 DangoUI schema 没有通用 spacing token；只展示项目页面 CSS、组件局部 gap 和少量组件专用 token。",
    status: "DangoUI 待新增",
    nextStep: "先确认项目源码里实际使用的 padding/gap/margin，再标记 page CSS、component CSS 或 missing。",
    scope: "不能写成 --du-spacing-*；除组件专用 token 外，统一按页面 CSS 承接。",
  },
  {
    id: "radius",
    label: "Radius",
    zh: "圆角",
    meta: "DangoUI 待新增",
    description: "当前 DangoUI schema 没有通用 radius token；只展示 card/control/media/tag 在项目 CSS 里的承接点。",
    status: "DangoUI 待新增",
    nextStep: "先区分组件源码圆角、页面容器圆角和媒体资产圆角。",
    scope: "不能写成 --du-radius-*；只有组件源码已有 class/prop 时才算可承接，否则走页面 CSS。",
  },
  {
    id: "shadow",
    label: "Shadow",
    zh: "阴影",
    meta: "DangoUI 待新增",
    description: "当前 DangoUI schema 没有通用 shadow token；只展示项目 CSS 里的 elevation、inset border 或品牌光效承接点。",
    status: "DangoUI 待新增",
    nextStep: "先区分真实 elevation、边框替代和品牌氛围光。",
    scope: "不能写成 --du-shadow-*；没有来源证据时保持 none，不为选中态补阴影。",
  },
  {
    id: "motion",
    label: "Motion",
    zh: "动效",
    meta: "待更新",
    description: "展示项目里已有的 hover、press、tab 切换、Snackbar 和轻反馈承接点。",
    status: "待提取",
    nextStep: "先补点击反馈、tab 切换、卡片 hover 三类交互节奏。",
    scope: "当前 demo 只做轻量交互验证；复杂动效进入 ReviewQueue。",
  },
];

const styleRecipeDetails = {
  dango: {
    typography: [
      { title: "Display", value: "20-24px / 760", note: "默认组件标题保持系统字体和清晰层级，不引入品牌字体或装饰字形。" },
      { title: "Body", value: "13-14px / 500", note: "正文使用通用 UI 阅读节奏，适合表单、卡片和列表说明。" },
      { title: "Caption", value: "10-12px / 600", note: "辅助文字使用默认弱文本 token，浅底可读；深色品牌迁移时必须改由主题弱文本承接。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "默认页面内距是稳定的中等密度，适合作为迁移前参照。" },
      { title: "Card gap", value: "12px", note: "卡片、表单行和信息块保持普通组件间距，不表达特定品牌节奏。" },
      { title: "Control", value: "8px", note: "按钮、标签和输入控件之间使用基础 8px 节奏。" },
    ],
    divider: [
      { title: "Divider", value: "#0000001f / 1px", note: "默认 Divider 与普通卡片边界都来自 --du-border-1。" },
      { title: "Frame", value: "none / component border", note: "初始化状态没有装饰框、角线或图片边框；只有组件自身 border。" },
      { title: "Selection", value: "#7c66ff active indicator", note: "选中态由 primary token 标识，不引入 shadow、纹理或特殊 Frame CSS。" },
    ],
    radius: [
      { title: "Card", value: "8px", note: "默认卡片圆角克制，作为后续品牌 card/media radius 对照。" },
      { title: "Control", value: "8px", note: "按钮、输入和标签沿用普通控件圆角，不推导成品牌风格。" },
      { title: "Media", value: "8px", note: "默认媒体容器不带特殊裁切、装饰框或资产边界。" },
    ],
  },
  czn: {
    typography: [
      { title: "Display", value: "24-28px / 850", note: "用于角色名、官网首屏标题，保持高对比和游戏宣发气势。" },
      { title: "Body", value: "12-13px / 650", note: "正文偏紧凑，服务资讯流和角色说明，避免大段文字削弱沉浸感。" },
      { title: "Caption", value: "10-11px / 700", note: "状态、标签、HUD 信息可略加粗，形成工具面板感。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "页面内距保持中等密度，适合游戏内容卡和下载入口并排出现。" },
      { title: "Card gap", value: "10-14px", note: "卡片之间不宜过松，保留活动页的资讯密度。" },
      { title: "CTA", value: "8-12px", note: "按钮、二维码、下载块之间用紧凑间距强化行动入口。" },
    ],
    divider: [
      { title: "Divider", value: "rgba(255,90,31,.38) / 1px", note: "资讯区和导航分隔使用橙色低透明 Divider，映射到 --du-border-1 / --du-primary-border。" },
      { title: "Frame", value: "angled HUD frame", note: "卡片边界是斜切线框，不是普通 Divider；需要页面 Frame CSS。" },
      { title: "Selection", value: "orange active underline", note: "选中态用底线和斜切边界，不额外加无依据阴影。" },
    ],
    radius: [
      { title: "HUD / Media frame", value: "0px + slanted mask", note: "风格化媒体框和角色舞台不继承普通 card 圆角；斜切由 mask / frame CSS 承接。" },
      { title: "Plain panel", value: "0px", note: "普通信息容器保持硬朗直角，不为复用 card 组件额外加圆角。" },
      { title: "Control", value: "6px", note: "按钮和输入类控件更硬朗，强调游戏工具属性。" },
    ],
  },
  hpma: {
    typography: [
      { title: "Display", value: "26-32px / 850", note: "标题需要像入学通知书和游戏 logo 一样有强仪式感，适合 serif/装饰字形方向。" },
      { title: "Body", value: "13-15px / 560", note: "正文承接官网说明、新闻列表和卡牌信息，偏羊皮纸阅读感。" },
      { title: "Label", value: "12-14px / 700", note: "导航、卡牌名和按钮文字用金棕色强化魔法书签感。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "信息密度中等，既能承接官网新闻，也保留沉浸式视觉空间。" },
      { title: "Media gap", value: "12-16px", note: "媒体卡、壁纸和视频缩略图之间保持清晰网格，不把插画色混进 token。" },
      { title: "CTA", value: "10-14px", note: "下载、预约、查看更多等行动入口靠近内容面板，保持游戏站节奏。" },
    ],
    divider: [
      { title: "Divider", value: "rgba(200,176,139,.72) / 1px", note: "普通分割线使用古铜金 Divider，可映射到 --du-border-1。" },
      { title: "Frame", value: "ornate corner frame / 22px", note: "媒体框和卡牌框需要贴边角线 CSS；只设置 border 色不算完成。" },
      { title: "Scope", value: "demo/page frames only", note: "装饰框只能套到目标页面框体、媒体壳、卡牌壳；证据区和 mapping 区必须排除。" },
    ],
    radius: [
      { title: "Card", value: "0px", note: "官网装饰框和媒体框更接近直角，主要识别来自边框、纹理和手绘资产。" },
      { title: "Control", value: "5px", note: "输入框 CSS 出现 5px；当前 DangoUI schema 没有通用 radius token，只能先落到 control CSS。" },
      { title: "Media", value: "0-8px", note: "特色图和壁纸更多依赖装饰边框，圆角不是主要 token 特征。" },
    ],
  },
  re1999: {
    typography: [
      { title: "Display", value: "24-30px / serif", note: "标题与章节名保留复古档案感，来自官网 SourceHanSerifCN 倾向。" },
      { title: "Body", value: "12-14px / 520", note: "说明文字使用暖灰棕，降低暗底上的现代 UI 感。" },
      { title: "Label", value: "10-12px / 700", note: "NEWS、ARCNIST FILE、日期和分类标签用古铜色强调。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "移动端样板页保持中等密度，承接官网首页、资讯和档案三个信息层。" },
      { title: "Card gap", value: "10-14px", note: "资讯列表和档案卡片之间保持紧凑的阅读节奏。" },
      { title: "CTA", value: "8-12px", note: "下载、预约、查看更多靠近内容块，避免像普通品牌官网一样过松。" },
    ],
    divider: [
      { title: "Divider", value: "#45392F / 1px", note: "普通分割线来自资讯列表和暗色面板边界，映射到 --du-border-1。" },
      { title: "Accent frame", value: "#B55829 / top-right archive frame", note: "古铜线框用于资讯/档案框，不等同普通 Divider。" },
      { title: "Selection", value: "#db6f39 active", note: "导航和选中态用更亮橙，承接 --du-primary-outline-color。" },
    ],
    asset: [
      { title: "BG2 texture", value: "./img/BG2.png -> /assets/brand-assets/re1999/img/BG2.png", assetPath: "/assets/brand-assets/re1999/img/BG2.png", note: "官网 .swiperBG2 背景；暗场、噪点、细线轨迹和橙色漏光是页面气质，不应降级成纯色或渐变。", role: "texture", scope: ".theme-re1999 .phone-screen", placement: "background-image / cover", fallback: "dark gradient + line texture" },
      { title: "BG texture", value: "./img/BG.png -> /assets/brand-assets/re1999/img/BG.png", assetPath: "/assets/brand-assets/re1999/img/BG.png", note: "官网 .swiperBG 背景，1920×1080；与 BG2 共同构成 PC 主背景层，作为 texture/background 候选保留。", role: "texture", scope: "PC page background", placement: "background-image / cover", fallback: "BG2 or dark gradient" },
      { title: "BGM mobile texture", value: "./img/BGM.png -> /assets/brand-assets/re1999/img/BGM.png", assetPath: "/assets/brand-assets/re1999/img/BGM.png", note: "移动端背景图，750×1624；用于校验同一风格在 mobile shell 下不是简单裁 PC 背景。", role: "texture", scope: "mobile page background", placement: "background-image / cover", fallback: "BG2 crop" },
      { title: "First scene JPG", value: "./img/01.jpg -> /assets/brand-assets/re1999/img/01.jpg", assetPath: "/assets/brand-assets/re1999/img/01.jpg", note: "首页场景图，1920×1080；更偏插画/摄影式内容背景，和纯 UI texture 分开记录。", role: "illustration-background", scope: "home scene / hero media", placement: "media background", fallback: "texture background" },
      { title: "Mobile KV JPG", value: "./kv/m.jpg -> /assets/brand-assets/re1999/kv/m.jpg", assetPath: "/assets/brand-assets/re1999/kv/m.jpg", note: "移动端 KV，750×1334；属于主视觉背景资产，可用于移动端 hero/launch 方向验证。", role: "illustration-background", scope: "mobile key visual", placement: "media background", fallback: "BGM mobile texture" },
      { title: "Mobile frame JPG", value: "./m/m_00000.jpg -> /assets/brand-assets/re1999/m/m_00000.jpg", assetPath: "/assets/brand-assets/re1999/m/m_00000.jpg", note: "移动端序列帧样本，750×1334；作为 motion/视频帧候选记录，不默认进入静态 UI token。", role: "motion-frame", scope: "mobile intro frame", placement: "media frame", fallback: "static key visual" },
      { title: "Login modal texture", value: "./img/login/loginBg.png -> /assets/brand-assets/re1999/img/login/loginBg.png", assetPath: "/assets/brand-assets/re1999/img/login/loginBg.png", note: "预约/登录弹层背景，574×493；用于弹层/活动卡片的纹理候选，不泛化到全站背景。", role: "texture", scope: "modal / campaign panel", placement: "panel background-image", fallback: "dark panel CSS" },
      { title: "Home title layers", value: "./img/first/1.png + ./img/first/2.png -> /assets/brand-assets/re1999/img/first/", assetPath: "/assets/brand-assets/re1999/img/first/1.png", note: "官网首屏小图层，适合做 hero 的品牌标识/标题装饰，不当作大背景。", role: "decorative-layer", scope: ".theme-re1999 .re1999-hero::before/::after", placement: "absolute overlay / contain", fallback: "text title" },
      { title: "Gallery character visual", value: "./img/gallery/01.png -> /assets/brand-assets/re1999/img/gallery/01.png", assetPath: "/assets/brand-assets/re1999/img/gallery/01.png", note: "带橙色轨道和块状装饰的 gallery 图，直接增强资讯主视觉感知。", role: "illustration-background", scope: ".theme-re1999 .re1999-news-feature", placement: "background-image layer", fallback: "scene JPG" },
      { title: "Backstory scene", value: "./img/backstory/p1.png -> /assets/brand-assets/re1999/img/backstory/p1.png", assetPath: "/assets/brand-assets/re1999/img/backstory/p1.png", note: "强叙事场景图，适合档案/故事 panel，而不是普通卡片。", role: "illustration-background", scope: ".theme-re1999 .re1999-character-panel", placement: "background-image / cover", fallback: "BG2 texture" },
      { title: "News title image", value: "./img/News.png -> /assets/brand-assets/re1999/img/News.png", assetPath: "/assets/brand-assets/re1999/img/News.png", note: "官网 NEWS 标题图，公告页标题应优先使用资产图层，而不是普通文本替代。", role: "decorative-layer", scope: ".theme-re1999 .re1999-news-poster img", placement: "inline image", fallback: "NEWS text" },
      { title: "Role main image", value: "./img/role/1.png -> /assets/brand-assets/re1999/img/role/1.png", assetPath: "/assets/brand-assets/re1999/img/role/1.png", note: "角色主图，940×1160；档案页核心视觉，不应只用缩略头像或 CSS 剪影。", role: "role-art", scope: ".theme-re1999 .re1999-role-media i", placement: "background-image / contain", fallback: "character thumbnail" },
      { title: "Role title image", value: "./img/role/1t.png -> /assets/brand-assets/re1999/img/role/1t.png", assetPath: "/assets/brand-assets/re1999/img/role/1t.png", note: "角色标题 PNG，属于内容图层/标题装饰，不能只用普通文字完全替代。", role: "decorative-layer", scope: ".theme-re1999 .re1999-character-panel::after", placement: "absolute overlay / contain", fallback: "text heading" },
      { title: "Role orbital layer", value: "./img/role/false.webp -> /assets/brand-assets/re1999/img/role/false.webp", assetPath: "/assets/brand-assets/re1999/img/role/false.webp", note: "DOM inline <img>，940×1160 alpha；它更像角色媒体装饰层/轨道层，不是人物本身。", role: "decorative-layer", scope: ".theme-re1999 .re1999-role-media::after", placement: "absolute overlay / contain", fallback: "CSS orbital line" },
      { title: "Role backdrop", value: "./img/role/1bg.png -> /assets/brand-assets/re1999/img/role/1bg.png", assetPath: "/assets/brand-assets/re1999/img/role/1bg.png", note: "CSS background in .character-right-left；角色区背板与纹理层，适合落到 media 背景而不是 token。", role: "background", scope: ".theme-re1999 .re1999-role-media::before", placement: "absolute background / cover", fallback: "radial dark copper field" },
      { title: "Selected icon pair", value: "./img/icon/b.png + ./img/icon/bc.png -> /assets/brand-assets/re1999/img/icon/", assetPath: "/assets/brand-assets/re1999/img/icon/bc.png", note: "CSS hover 成对状态：.share-content-b 使用 b.png，hover 切到 bc.png。用于判断 selected/active 应优先找状态图片对，而不是自行加 shadow。", role: "selected-bg", scope: "share/social state; selected-state evidence", placement: "state-scoped background-image", fallback: "copper active line" },
      { title: "Backstory hover mark", value: "./img/backstory/1_1.png -> /assets/brand-assets/re1999/img/backstory/1_1.png", assetPath: "/assets/brand-assets/re1999/img/backstory/1_1.png", note: "CSS content:url hover 替换；属于分页/选中态微装饰，后续应用时应映射到组件 state slot 或 CSS state layer。", role: "selected-bg", scope: "pagination / index state", placement: "content replacement / state icon", fallback: "text active state" },
      { title: "Font Serif.ttf", value: "./font/Serif.ttf -> /assets/brand-assets/re1999/font/Serif.ttf", assetPath: "/assets/brand-assets/re1999/font/Serif.ttf", note: "CSS @font-face: SourceHanSerifCN；用于标题、导航和档案标题，是 1999 复古叙事感的核心资产。", role: "font", scope: ".theme-re1999 title/body", placement: "@font-face / font-family", fallback: "Georgia / Songti SC" },
      { title: "Font Sans.ttf", value: "./font/Sans.ttf -> /assets/brand-assets/re1999/font/Sans.ttf", assetPath: "/assets/brand-assets/re1999/font/Sans.ttf", note: "CSS @font-face: cn；用于正文说明、角色描述和信息块小字，不能只靠系统字体猜。", role: "font", scope: ".theme-re1999 body copy", placement: "@font-face / font-family", fallback: "system sans-serif" },
      { title: "Font Didot.ttf", value: "./font/Didot.ttf -> /assets/brand-assets/re1999/font/Didot.ttf", assetPath: "/assets/brand-assets/re1999/font/Didot.ttf", note: "CSS @font-face: Den；用于数字/英文 display，可进入字体候选但当前 demo 只记录证据。", role: "font", scope: "display numerals / music modal", placement: "@font-face", fallback: "Georgia" },
      { title: "CTA image", value: "./img/more.png -> /assets/brand-assets/re1999/img/more.png", assetPath: "/assets/brand-assets/re1999/img/more.png", note: "CSS background for more/see-more 入口；按钮不一定能用普通 Button 还原，可能需要 Image + Button 组合。", role: "decorative-cta", scope: "news more button / CTA", placement: "CSS background-image", fallback: "DuButton outline" },
      { title: "Logo PNG", value: "/assets/re1999-logo.png · 333x132 RGBA", assetPath: "/assets/re1999-logo.png", note: "作为 nav decorative watermark / brand mark 使用；透明 PNG 直接影响 1999 识别度，不抽象成颜色 token。", role: "brand-mark", scope: ".theme-re1999 .phone .du-navigation-bar::before", placement: "background-image / contain / right center", fallback: "serif text title + copper divider" },
    ],
    radius: [
      { title: "Card", value: "0px", note: "普通 Card / frame 容器跟随档案式直角线框；radius 与 Divider / Frame 联动，不保留通用圆角。" },
      { title: "Control", value: "42px", note: "标签/按钮有明显 pill 倾向，和档案框形成对比。" },
      { title: "Large media shell", value: "top-right 50-100px", note: "源站 news-left / backstory-left 有右上角大圆角；只作用在大媒体壳或故事图区域，不能泛化到普通卡片。" },
      { title: "Media", value: "0px", note: "普通媒体/组件封面保持直角；特殊圆角必须由具体页面壳证据驱动。" },
    ],
  },
  apple: {
    typography: [
      { title: "Display", value: "28-34px / 760", note: "大标题留白充分，语气像产品展陈，不靠重描边制造冲击。" },
      { title: "Body", value: "13-15px / 500", note: "正文清爽，行高更松，适合产品说明和故事型卡片。" },
      { title: "Link", value: "12-13px / 650", note: "行动文字保持蓝色清晰入口，避免过多粗体。" },
    ],
    spacing: [
      { title: "Page", value: "20px", note: "页面留白更松，给产品图和大标题呼吸感。" },
      { title: "Section", value: "20-28px", note: "模块之间用明显间距，而不是依赖分割线。" },
      { title: "Card inner", value: "16-20px", note: "卡片内部留白偏大，承接产品展陈气质。" },
    ],
    divider: [
      { title: "Divider", value: "rgba(0,0,0,.08) / 1px", note: "分割线极弱，主要依靠留白和模块节奏建立层级。" },
      { title: "Frame", value: "none / spacing-led", note: "不需要装饰框；卡片形态来自大圆角和留白。" },
      { title: "Selection", value: "blue text link", note: "选中/行动更多依赖蓝色文字入口，不把 divider 做成强样式。" },
    ],
    radius: [
      { title: "Card", value: "28px", note: "大圆角是主要识别点，只作为 demo 视觉控制，不强行写入 dangoui token。" },
      { title: "Control", value: "999px", note: "主要行动和标签倾向 pill 形态。" },
      { title: "Media", value: "24-28px", note: "产品图容器跟随大圆角，形成柔和展示面。" },
    ],
  },
  figma: {
    typography: [
      { title: "Display", value: "24-30px / 760", note: "标题清晰但不过度品牌化，适合工具和协作页面。" },
      { title: "Body", value: "12-14px / 520", note: "正文偏理性，强调说明、状态和团队协作语境。" },
      { title: "Label", value: "10-12px / 700", note: "标签、变量名、组件名需要更清楚的扫描性。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "中等密度，贴近设计工具工作区。" },
      { title: "Grid", value: "8px", note: "控件和标签之间使用 8px 基准，便于形成系统感。" },
      { title: "Panel", value: "12-16px", note: "面板内距清楚但不松散，适合属性面板与列表。" },
    ],
    divider: [
      { title: "Divider", value: "#d9d9d9 / 1px", note: "工具面板、列表和属性区使用清晰 Divider，映射到 --du-border-1。" },
      { title: "Frame", value: "plain panel border", note: "边框是普通面板线，不需要图片或角线 CSS。" },
      { title: "Selection", value: "#1e1e1e focus border", note: "焦点态强调边框清晰度，不靠装饰。" },
    ],
    radius: [
      { title: "Card", value: "14px", note: "卡片圆角中等，配合清晰边界。" },
      { title: "Control", value: "8px", note: "按钮、输入和 tab 更像工具控件，避免过强拟物。" },
      { title: "Asset", value: "8-14px", note: "协作图形可保留更丰富形状，但不进入正式 token。" },
    ],
  },
  notion: {
    typography: [
      { title: "Display", value: "24-30px / 760", note: "近黑 Inter 风格，标题清楚但保持文档气质。" },
      { title: "Body", value: "13-14px / 500", note: "正文可读性优先，适合知识库、说明和列表。" },
      { title: "Caption", value: "11-12px / 520", note: "辅助文字偏中性，避免让蓝色 primary 过度扩散。" },
    ],
    spacing: [
      { title: "Page", value: "16px", note: "页面密度适中，像文档工作区而不是营销页。" },
      { title: "Row", value: "8-12px", note: "列表、表格、卡片行之间保持清楚但不松散。" },
      { title: "Block", value: "12-16px", note: "内容块之间用稳定留白承接文档节奏。" },
    ],
    divider: [
      { title: "Divider", value: "#e6e6e6 / 1px", note: "文档表格、抽屉和列表使用低对比 Divider，映射到 --du-border-1。" },
      { title: "Frame", value: "paper card border", note: "卡片是纸面 border，不需要装饰框 CSS。" },
      { title: "Selection", value: "#0075de underline", note: "蓝色行动入口是选中/链接信号，divider 维持安静。" },
    ],
    radius: [
      { title: "Card", value: "12px", note: "卡片圆角温和，贴近纸面容器。" },
      { title: "Control", value: "999px", note: "按钮和 badge 可用 pill，作为轻量行动入口。" },
      { title: "Surface", value: "8-12px", note: "表格、抽屉、文档块可保持较小圆角。" },
    ],
  },
  spotify: {
    typography: [
      { title: "Display", value: "24-32px / 850", note: "标题更厚重，服务媒体封面和播放场景。" },
      { title: "Body", value: "12-14px / 650", note: "正文高对比，暗底上保持清晰扫描。" },
      { title: "Meta", value: "10-12px / 700", note: "歌单、状态和辅助信息可更紧凑。" },
    ],
    spacing: [
      { title: "Page", value: "18px", note: "页面内距略大于常规，给深色卡片和封面留空间。" },
      { title: "Media gap", value: "12-16px", note: "封面、标题、按钮之间保持清晰分组。" },
      { title: "Stack", value: "8-12px", note: "列表和推荐流使用紧凑堆叠，保留音乐 App 密度。" },
    ],
    divider: [
      { title: "Divider", value: "rgba(255,255,255,.12) / 1px", note: "暗色页面使用弱白分隔线，避免破坏封面图和品牌绿。" },
      { title: "Frame", value: "dark elevated media card", note: "卡片边界主要由暗色表面和阴影形成，不需要装饰框。" },
      { title: "Selection", value: "#1ed760 underline", note: "选中态使用品牌绿线条或文字，不加无证据阴影。" },
    ],
    radius: [
      { title: "Card", value: "12px", note: "暗色卡片保持中等圆角，主要质感来自阴影和表面色。" },
      { title: "Control", value: "999px", note: "播放、收藏、筛选等控件倾向 pill。" },
      { title: "Media", value: "8-12px", note: "封面图圆角克制，不抢品牌绿。" },
    ],
  },
};

const fallbackStyleRecipeDetails = {
  typography: [
    ...[
      ["H", 700, "标题/强强调"],
      ["B", 500, "正文强调/组件标题"],
      ["N", 400, "正文/说明/辅助"],
    ].flatMap(([prefix, weight, usage]) =>
      [
        [1, 32, 40],
        [2, 28, 36],
        [3, 24, 32],
        [4, 20, 28],
        [5, 18, 26],
        [6, 16, 24],
        [7, 14, 22],
        [8, 12, 18],
      ].map(([level, size, lineHeight]) => ({
        title: `${prefix}${level}`,
        value: `${size}px / ${weight} / ${lineHeight}px`,
        note: `${usage}，按 H/B/N typography scale 表达；落到 DangoUI 时由组件源码或页面 CSS 承接。`,
      })),
    ),
    { title: "Font family", value: "system-ui / brand font asset", note: "字体族单独记录；DangoUI 当前快照没有全局 font-family token，品牌字体包进入 demoOnlyVisualControls。" },
    { title: "Letter spacing", value: "0 by default", note: "普通 UI 文本不加负字距；品牌标题若有字距证据单独记录。" },
  ],
  icon: [
    { title: "System icon", value: "stroke / 20px", note: "优先使用 dangoui Icon 已有 name、size 和 color，不从品牌图里新造 icon name。" },
    { title: "Brand symbol", value: "asset / logo", note: "品牌符号、logo、游戏装饰图标属于资产层；只记录来源和使用范围。" },
    { title: "Button icon", value: "left/right slot", note: "按钮图标先映射 DuButton icon / iconPosition；缺失图标进入 ask-user。" },
    { title: "State icon", value: "feedback/status", note: "成功、警告、错误图标必须跟语义色板一致，不单独漂移颜色。" },
  ],
  button: [
    { title: "Button", value: "normal / primary / outline / text", note: "普通行动入口优先继承 DangoUI Button 的 type、size、disabled、loading 和语义色；品牌只覆盖 token、边框、圆角或轻动效。" },
    { title: "IconButton", value: "icon-only / slot button", note: "只放图标的行动入口先用 Button + Icon/slot 组合表达；如果参考站使用图片态 icon，需要记录 assetPath 和 selected/hover 状态。" },
    { title: "FAB", value: "floating action button", note: "右下角发布、创建、快捷操作属于 FAB；当前 DangoUI 待新增，demo 先用页面 CSS 表达位置、尺寸、主色和前景色。" },
  ],
  asset: [
    { title: "Background image", value: "png/webp/svg background", note: "页面底图、纹理和装饰背景先记录 assetPath、repeat、size、position，再落 CSS background。" },
    { title: "Selected background", value: "active/selected asset", note: "选中态图片要绑定具体 state selector；不能用 shadow 或 outline 代替有证据的 selected-bg。" },
    { title: "Frame image", value: "border-image / 9-slice", note: "边框图、角花、卡牌框属于 asset-frame，通常替代普通 border。" },
    { title: "Illustration", value: "Image slot / media layer", note: "角色图、物件图和场景图优先作为 Image/slot 或 media layer，不进入 UI token。" },
  ],
  layout: [
    { title: "Page shell", value: "375x812 / safe area", note: "移动 mockup 以 375x812 为真实屏幕区域；页面内距和导航高度单独记录。" },
    { title: "Section rhythm", value: "hero / feed / detail", note: "区分首屏、内容流、详情块和行动区，避免所有 demo 页面同构。" },
    { title: "Card density", value: "compact / medium / loose", note: "卡片密度由内容类型决定，不用 landing page 式大空白套所有项目。" },
    { title: "Media ratio", value: "cover / tile / poster", note: "媒体比例和裁切属于页面 CSS，图片色不进入 UI color token。" },
  ],
  shadow: [
    { title: "Elevation", value: "surface shadow", note: "只有真实卡片层级或浮层证据明确时才迁移；否则保持 none。" },
    { title: "Inner line", value: "inset border", note: "很多暗色面板的层级来自 inset 线框，不应误判成 shadow token。" },
    { title: "Glow", value: "brand glow", note: "霓虹、魔法光、游戏氛围光属于页面氛围样式，不能写成正式 dangoui shadow。" },
  ],
  motion: [
    { title: "Press", value: "120-180ms", note: "按钮/卡片点击反馈保持轻量，不为选中态擅自加 shadow。" },
    { title: "Tab switch", value: "150-220ms", note: "tab 切换表达 active indicator，不改变页面结构或复用同一套内容。" },
    { title: "Snackbar", value: "bottom feedback", note: "复制、保存等轻反馈使用 mockup 屏幕内 snackbar，避免全局 toast 干扰。" },
  ],
};

const imagePreviewSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' rx='24' fill='%23f5f5f5'/%3E%3Ccircle cx='92' cy='76' r='44' fill='%23874fff' fill-opacity='.82'/%3E%3Ccircle cx='160' cy='92' r='48' fill='%2300b6ff' fill-opacity='.72'/%3E%3Ccircle cx='224' cy='82' r='38' fill='%23ff7237' fill-opacity='.78'/%3E%3C/svg%3E";
const uploadExampleFiles = [
  {
    uid: "cover-1",
    thumbUrl: imagePreviewSrc,
    status: "done",
  },
];
const cascaderExampleOptions = [
  {
    label: "华东",
    value: "east",
    children: [
      {
        label: "上海",
        value: "shanghai",
        children: [
          { label: "浦东", value: "pudong" },
          { label: "黄浦", value: "huangpu" },
        ],
      },
    ],
  },
  {
    label: "华南",
    value: "south",
    children: [
      {
        label: "广州",
        value: "guangzhou",
        children: [{ label: "天河", value: "tianhe" }],
      },
    ],
  },
];
const selectOptions = [
  { label: "Figma", value: "figma" },
  { label: "Apple", value: "apple" },
  { label: "Spotify", value: "spotify" },
];
const re1999PublishOptions = [
  { label: "公告", value: "notice" },
  { label: "活动", value: "event" },
  { label: "角色档案", value: "archive" },
];
const brandPublishOptions = [
  { label: "公告", value: "notice" },
  { label: "活动", value: "event" },
  { label: "媒体", value: "media" },
];
const brandPublishCopy = {
  czn: {
    title: "保留 DangoUI 发布链路，只继承 CZN token",
    body: "发布侧不默认套斜切 HUD、角色动效或下载入口皮肤；只有主 CTA 使用品牌橙。",
    groupTitle: "前瞻内容发布",
    groupBody: "面向运营录入标题、摘要、栏目和上线状态，优先保证可读性和可提交。",
    inputValue: "前瞻情报更新",
    textareaValue: "填写活动摘要、角色说明或媒体素材描述。发布侧默认不启用展示侧 mask。",
    switchLabel: "同步到首页分发侧",
  },
  hpma: {
    title: "保留 DangoUI 发布链路，只继承 HPMA token",
    body: "发布侧不默认套羊皮纸大框、金色角线或魔法光效；只保留字体色、按钮色和弱边界。",
    groupTitle: "魔法资讯发布",
    groupBody: "面向运营录入公告、活动和媒体资料，优先保证表单效率。",
    inputValue: "学院活动公告",
    textareaValue: "填写活动说明、赛季公告或媒体摘要。发布侧默认不启用展示侧装饰框。",
    switchLabel: "同步到首页分发侧",
  },
};
const avatarImages = [imagePreviewSrc, imagePreviewSrc, imagePreviewSrc, imagePreviewSrc];
const defaultPlaceholderReason = "该组件依赖弹层、上下文、运行时 API 或特定父子结构，当前静态目录先保留入口，避免误以为 dangoui 没有这个组件。";
const placeholderReasons = {
  ActionButton: "需要稳定的 icon/name 配置和具体业务动作，静态页先不硬造图标。",
  ActionSheet: "动作面板需要通过点击唤起弹层；静态目录保留入口，避免默认遮挡页面。",
  Calendar: "日历适合弹层或完整选择流程，静态铺开会吞掉大量视口，先保留入口。",
  Cascader: "级联选择依赖选项数据和弹层交互，当前只记录组件存在。",
  CheckboxGroup: "组合容器需要表达一组绑定关系，已用 Checkbox 展示视觉基础。",
  CheckboxIcon: "这是 Checkbox 的内部图标组件，通常不作为运营可点选模块单独出现。",
  Dialog: "确认弹窗需要由动作触发，默认打开会打断组件目录浏览。",
  Dropdown: "下拉筛选依赖选项组和展开态，静态页先保留入口。",
  Form: "表单容器主要负责校验和布局，视觉效果由 Input、Select、Checkbox 等子组件承接。",
  FormField: "表单字段上下文组件，通常由 Form/FormItem 调用，不单独静态展示。",
  FormItem: "表单行布局组件，视觉基础已在 Input/Select 等控件里展示。",
  Icon: "需要明确 icon 字库 name；当前 demo 先不假设业务图标。",
  IconButton: "依赖明确 icon name 和动作语义，静态页先保留入口。",
  NavigationBarRight: "NavigationBar 的右侧插槽/子结构，已在 NavigationBar 示例中体现。",
  Picker: "选择器需要打开态和滚动选择交互，静态页先保留入口。",
  PickerView: "滚动选择视图更适合在选择器内部展示，当前不单独铺开。",
  Popup: "底部/居中弹层需要触发态，默认显示会覆盖组件目录。",
  RadioGroup: "组合容器需要表达互斥绑定关系，已用 Radio 展示视觉基础。",
  RadioIcon: "这是 Radio 的内部图标组件，通常不作为独立运营模块。",
  RootPortal: "这是挂载容器能力，不是可见组件。",
  SearchRight: "Search 的右侧动作插槽/子结构，已在 Search 示例中体现。",
  Snackbar: "轻提示条通常由动作触发，不适合默认常驻。",
  StepCheck: "Steps 的内部检查态元素，已由 Steps 组件承接。",
  Sticky: "吸顶需要滚动容器和临界状态，静态目录只保留入口。",
  Swiper: "轮播需要尺寸、图片资源和滑动运行态，当前先记录组件存在。",
  SwiperItem: "Swiper 子项必须放在 Swiper 内部使用，不单独静态展示。",
  Tab: "Tab 必须作为 Tabs 子组件使用，已在 Tabs 示例中展示。",
  TabPane: "TabPane 依赖 Tabs 上下文，当前目录只记录组件存在。",
  TabsRight: "Tabs 的右侧扩展区域，已由 Tabs 组件承接。",
  TagsPanel: "标签面板通常需要可选列表和展开/收起交互，当前先保留入口。",
  Theme: "主题提供器不直接产出可见 UI，风格切换已通过 token value 演示。",
  ToastProvider: "Toast 上下文提供器不直接产出可见 UI，需要动作触发 toast。",
  Tooltip: "悬浮提示依赖 hover/focus 触发，静态目录先不默认打开。",
  Transition: "过渡组件需要进入/离开状态，静态页无法单独表达稳定视觉。",
  Upload: "上传依赖文件选择和权限能力，当前先保留入口。",
};
const sideComponentSpecs = [
  {
    id: "distribution",
    tab: "分发侧",
    name: "分发侧：内容送达",
    pageName: "夏日市集首页",
    description: "面向首页、活动页、内容流和搜索分发，重点回答“用户下一步去哪”。",
    components: ["NavigationBar", "Search", "HeroHeader", "Swiper", "TabBar", "Grid", "List", "Card", "Tabs", "Tag", "Button", "FAB"],
  },
  {
    id: "display",
    tab: "展示侧",
    description: "面向详情、媒体、档案和状态展示，重点回答“用户现在看的这个是什么”。",
    name: "展示侧：服务器数据输出",
    pageName: "商品图鉴详情",
    components: ["NavigationBar", "Image", "Avatar", "Badge", "Swiper", "Popup", "List", "Steps", "Time", "PriceStatistic", "Rate", "Card", "Tabs", "Tag", "Button"],
  },
  {
    id: "publish",
    tab: "发布侧",
    name: "发布侧：用户数据输入",
    pageName: "发布器",
    description: "面向创建、编辑、报名和配置发布，把用户输入校验后提交给服务器。",
    components: ["NavigationBar", "FormItem", "Input", "Textarea", "Radio", "Checkbox", "Switch", "Upload", "Stepper", "DateTimePicker", "Cascader", "Select", "Rate", "Tips", "Tabs", "Button", "Tag"],
  },
  {
    id: "feedback",
    tab: "反馈",
    name: "反馈：从轻到重",
    pageName: "操作反馈中心",
    description: "从轻量信息提示到重量决策弹层，帮助开发者判断什么时候该打扰用户。",
    components: ["NavigationBar", "NoticeBar", "Snackbar", "Toast", "Dialog", "Popup", "Dropdown", "Popover", "ShareSheet", "Empty", "ResultPage", "Spin", "Skeleton"],
  },
];
const componentCategorySpecs = [
  {
    id: "bar",
    label: "导航",
    description: "页面骨架、路径切换、入口分发和底部操作。",
    components: ["NavigationBar", "Search", "Tabs", "SegmentControl", "TabBar", "BottomBar", "Menu"],
  },
  {
    id: "output",
    label: "数据输出",
    description: "把内容、媒体、状态和商品信息展示给用户。",
    components: ["Badge", "Tag", "Empty", "Image", "Avatar", "Time", "PriceStatistic", "Swiper"],
  },
  {
    id: "input",
    label: "数据输入",
    description: "收集用户填写、选择、上传和提交的数据。",
    components: ["FormItem", "Input", "Textarea", "Radio", "Checkbox", "Switch", "Stepper", "Upload", "Tips", "Group", "DateTimePicker", "Rate", "Cascader", "Select"],
  },
  {
    id: "feedback",
    label: "反馈",
    description: "用户操作后的提示、弹层、空态、加载和状态反馈。",
    components: ["NoticeBar", "Snackbar", "Toast", "Dialog", "Popup", "ShareSheet", "ResultPage", "Spin", "Skeleton"],
  },
];
const distributionListRows = [
  { title: "周末限时活动", desc: "报名、任务和奖励入口集中展示", meta: "48h" },
  { title: "主推商品合集", desc: "SPU、价格、标签和行动按钮组合", meta: "¥128" },
  { title: "版本资讯更新", desc: "公告、攻略和内容流持续分发", meta: "NEW" },
];
const displayListRows = [
  { title: "图鉴资料", desc: "图片、角色、物品和详情数据", meta: "36" },
  { title: "成就记录", desc: "用户状态、进度和历史记录", meta: "82%" },
  { title: "服务状态", desc: "同步时间、审核状态和数据结果", meta: "OK" },
];
const publishListRows = [
  { title: "基础信息", desc: "标题、描述、分类和可见范围", meta: "必填" },
  { title: "素材上传", desc: "封面、图片、视频和附件", meta: "3/9" },
  { title: "发布设置", desc: "时间、开关、审核与提交动作", meta: "草稿" },
];
const categorySpecs = sideComponentSpecs;
const staticallyRenderedComponents = new Set([
  "Avatar",
  "AvatarGroup",
  "Badge",
  "Button",
  "Card",
  "Checkbox",
  "Divider",
  "Empty",
  "Image",
  "Input",
  "InputNumber",
  "FAB",
  "FeedSpuTag",
  "FormItem",
  "Grid",
  "Group",
  "HeroHeader",
  "NavigationBar",
  "NoticeBar",
  "PriceStatistic",
  "ResultPage",
  "Radio",
  "Rate",
  "Search",
  "Select",
  "SpuTag",
  "Skeleton",
  "SkeletonAvatar",
  "SkeletonParagraph",
  "SkeletonRectangle",
  "Spin",
  "Stepper",
  "Steps",
  "Switch",
  "Tabs",
  "TabBar",
  "Tag",
  "Textarea",
  "Time",
  "Tips",
  "Toast",
  "Upload",
]);

function kebabName(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function pageNodeId(name, templateId = selectedTemplateId.value) {
  return `node-${templateId}-${kebabName(name)}`;
}

const componentGroups = categorySpecs.map((group, groupIndex) => ({
  ...group,
  items: group.components.map((name) => ({
    id: `node-${groupIndex}-${kebabName(name)}`,
    name,
    label: name,
    rendered: staticallyRenderedComponents.has(name),
    reason: placeholderReasons[name] || defaultPlaceholderReason,
  })),
}));
const templatePages = sideComponentSpecs.map((spec) => ({
  id: spec.id,
  side: spec.id,
  tab: spec.tab,
  name: spec.pageName,
  description: spec.description,
  components: spec.components,
}));
const fallbackTemplatePages = templatePages.filter((template) => template.id !== "feedback");
const cznTemplatePages = [
  {
    id: "czn-home",
    side: "distribution",
    tab: "官网首页",
    name: "首页",
    description: "对应 CZN 首页首屏：大主视觉、内容分发和展示侧图片，不用说明型 Card 填充首页。",
    components: ["NavigationBar", "HeroHeader", "Button", "Image"],
  },
  {
    id: "czn-forward",
    side: "distribution",
    tab: "前瞻情报",
    name: "前瞻情报",
    description: "对应 CZN 公测内容区：白灰资讯底、橙色轮播描边、内容卡和状态标签。",
    components: ["NavigationBar", "Swiper", "Tag", "Card", "Button"],
  },
  {
    id: "czn-character",
    side: "display",
    tab: "角色档案",
    name: "角色档案",
    description: "对应 CZN 角色页：黑紫沉浸底、角色档案、语音面板和技能卡片。",
    components: ["NavigationBar", "CharacterPanel", "Avatar", "Card", "Tag"],
  },
  {
    id: "czn-media",
    side: "display",
    tab: "影像资料",
    name: "影像资料",
    description: "对应 CZN 媒体页：PV 封面、截图图库、访谈资料和斜切素材框。",
    components: ["NavigationBar", "Swiper", "Tabs", "Image", "Card", "Tag"],
  },
  {
    id: "czn-publish",
    side: "publish",
    tab: "发布器",
    name: "发布器",
    description: "发布侧：表单、选择、开关和提交动作只继承 CZN token，默认不套展示侧 HUD/mask。",
    components: ["NavigationBar", "Card", "Input", "Textarea", "Select", "Switch", "Button"],
  },
];
const hpmaTemplatePages = [
  {
    id: "hpma-home",
    side: "distribution",
    tab: "官网首页",
    name: "首页",
    description: "对应官网首页：顶部导航、入学主视觉、内容分发和媒体预览，不用说明型 Card 填充首页。",
    components: ["NavigationBar", "HeroHeader", "Button", "Image"],
  },
  {
    id: "hpma-news",
    side: "distribution",
    tab: "资讯公告",
    name: "资讯公告",
    description: "对应官网新闻与活动轮播：羊皮纸列表、金棕标签、媒体缩略图和查看更多。",
    components: ["NavigationBar", "Swiper", "Tabs", "Card", "Tag", "Button"],
  },
  {
    id: "hpma-cards",
    side: "display",
    tab: "卡牌图鉴",
    name: "卡牌图鉴",
    description: "对应魔咒&伙伴介绍和壁纸图库：卡牌框、角色媒体、图鉴网格和装饰边界。",
    components: ["NavigationBar", "Search", "Image", "Card", "Badge", "Tabs"],
  },
  {
    id: "hpma-media",
    side: "display",
    tab: "影像资料",
    name: "影像资料",
    description: "对应 HPMA 媒体页：PV 封面、壁纸图库、专题资料和羊皮纸说明。",
    components: ["NavigationBar", "Swiper", "Tabs", "Image", "Card", "Tag"],
  },
  {
    id: "hpma-publish",
    side: "publish",
    tab: "发布器",
    name: "发布器",
    description: "发布侧：表单、选择、开关和提交动作只继承 HPMA token，默认不套展示侧羊皮纸框。",
    components: ["NavigationBar", "Card", "Input", "Textarea", "Select", "Switch", "Button"],
  },
];
const re1999TemplatePages = [
  {
    id: "re1999-home",
    side: "distribution",
    tab: "官网首页",
    name: "首页",
    description: "对应官网首页：复古黑底、主视觉、资讯分发和视觉内容露出，不用说明型 Card 填充首页。",
    components: ["NavigationBar", "HeroHeader", "Button", "Image"],
  },
  {
    id: "re1999-news",
    side: "distribution",
    tab: "资讯公告",
    name: "资讯公告",
    description: "分发侧：NEWS 区、分类 tabs、日期列表和查看更多，使用中等风格化。",
    components: ["NavigationBar", "Swiper", "Tabs", "Card", "Tag", "Button"],
  },
  {
    id: "re1999-media",
    side: "display",
    tab: "影像资料",
    name: "影像资料",
    description: "展示侧：媒体大图、图库缩略图和影像资料，允许强纹理、资产和档案边框。",
    components: ["NavigationBar", "Swiper", "Tabs", "Image", "Card", "Tag"],
  },
  {
    id: "re1999-archive",
    side: "display",
    tab: "角色档案",
    name: "角色档案",
    description: "展示侧：角色文件、纸面档案和角色图层，优先使用资产与风格化框体。",
    components: ["NavigationBar", "Image", "Card", "Badge", "Tabs"],
  },
  {
    id: "re1999-publish",
    side: "publish",
    tab: "发布器",
    name: "发布器",
    description: "发布侧：表单、选择、开关和提交动作只继承 1999 token，默认不套展示侧装饰。",
    components: ["NavigationBar", "Card", "Input", "Textarea", "Select", "Switch", "Button"],
  },
];
const notionTemplatePages = [
  {
    id: "notion-home",
    side: "distribution",
    tab: "文档首页",
    name: "首页",
    description: "对应 Notion 首页：暖白画布、近黑大标题、蓝色 CTA 和贴纸人格层。",
    components: ["NavigationBar", "HeroHeader", "Tag", "Card", "Button"],
  },
  {
    id: "notion-wiki",
    side: "distribution",
    tab: "知识库",
    name: "团队知识库",
    description: "对应 Notion 文档/知识库：搜索、文档列表、轻提示和多色插画块。",
    components: ["NavigationBar", "Search", "Card", "NoticeBar", "Image"],
  },
  {
    id: "notion-pricing",
    side: "display",
    tab: "团队计划",
    name: "团队计划页",
    description: "对应 Notion pricing card：白卡、--du-border-1、少量蓝色行动入口和 featured 反相卡。",
    components: ["NavigationBar", "Card", "Badge", "Button"],
  },
];
const demoPagesByStyle = {
  czn: cznTemplatePages,
  hpma: hpmaTemplatePages,
  re1999: re1999TemplatePages,
  notion: notionTemplatePages,
};
const scenarioTabs = [
  { id: "distribution", kind: "数据输出" },
  { id: "display", kind: "数据输出" },
  { id: "publish", kind: "数据输入" },
];
const currentDemoPages = computed(() => demoPagesByStyle[selectedStyleId.value] || []);
const currentTemplatePages = computed(() => [...templatePages, ...currentDemoPages.value]);
const selectedTemplate = computed(() => currentTemplatePages.value.find((template) => template.id === selectedTemplateId.value) || currentTemplatePages.value[0]);
const currentScenarioTabs = computed(() => {
  if (!currentDemoPages.value.length) return [];
  return scenarioTabs
    .map((scenario) => {
      const pages = scenario.id === "feedback"
        ? templatePages.filter((template) => template.id === "feedback")
        : currentDemoPages.value.filter((template) => template.side === scenario.id);
      if (!pages.length) return null;
      const sideSpec = sideComponentSpecs.find((spec) => spec.id === scenario.id);
      return {
        id: `${selectedStyleId.value}-${scenario.id}`,
        side: scenario.id,
        tab: pages.length === 1 ? pages[0].name : pages.map((page) => page.tab).join(" / "),
        name: pages.length === 1 ? pages[0].name : pages.map((page) => page.name).join(" / "),
        kind: scenario.kind,
        description: sideSpec?.description || pages.map((page) => page.description).filter(Boolean).join(" / "),
        renderId: pages[0].id,
        sourceIds: pages.map((page) => page.id),
        components: [...new Set(pages.flatMap((page) => page.components))],
      };
    })
    .filter(Boolean);
});
const currentPageTabs = computed(() => {
  const pages = currentDemoPages.value.length ? [...currentDemoPages.value] : [...fallbackTemplatePages];
  const hasPublishPage = pages.some((page) => /发布|publish|发布器/i.test(`${page.id || ""} ${page.tab || ""} ${page.name || ""}`));
  if (currentDemoPages.value.length && !hasPublishPage) {
    const genericPublishPage = fallbackTemplatePages.find((page) => page.id === "publish");
    if (genericPublishPage) pages.push(genericPublishPage);
  }
  return [...pages].sort((a, b) => pageDemoRank(a) - pageDemoRank(b));
});
const activeScenarioTab = computed(() =>
  currentScenarioTabs.value.find((tab) => tab.sourceIds.includes(selectedTemplateId.value)),
);
const publishTemplateId = computed(() =>
  currentDemoPages.value.find((template) => template.side === "publish")?.id || "publish",
);
const activeSide = computed(() => activeScenarioTab.value?.side || selectedTemplate.value?.side || "");
const activeSideSpec = computed(() => sideComponentSpecs.find((spec) => spec.id === activeSide.value));
const isDistributionTemplate = computed(() => activeSide.value === "distribution");
const isDisplayTemplate = computed(() => activeSide.value === "display");
const showDemoBottomActions = computed(() => isDistributionTemplate.value);
const showPublishFab = computed(() => selectedInspectorTab.value === "pages" && isDistributionTemplate.value);
const isHomeTemplate = computed(() => {
  const homeId = currentDemoPages.value[0]?.id || templatePages[0]?.id;
  return selectedTemplateId.value === homeId;
});
const showNavigationBack = computed(() => selectedInspectorTab.value === "pages" && !isHomeTemplate.value);
const navigationTitle = computed(() => {
  if (selectedInspectorTab.value === "style") return "风格";
  if (selectedInspectorTab.value === "components") return activeComponentCategory.value.label;
  if (selectedInspectorTab.value === "pages" && isHomeTemplate.value) return "";
  if (selectedInspectorTab.value === "pages") return selectedTemplate.value.name || selectedTemplate.value.tab;
  if (activeScenarioTab.value?.tab) return activeScenarioTab.value.tab;
  return selectedTemplate.value.name || selectedTemplate.value.tab;
});
const showNavigationSearch = computed(() =>
  selectedInspectorTab.value === "pages" && pageInstances.value.some((instance) => instance.name === "Search"),
);
const navigationExampleBaseColor = computed(() => navExampleColor.value);
const navigationExampleRenderKey = computed(() => `navigation-example-${navExampleColor.value}`);
const searchExamplePlaceholder = computed(() => {
  const placeholders = {
    rolling: navigationExamplePlaceholders,
    single: "搜索活动、商品、攻略",
    empty: "",
  };
  return placeholders[componentExampleState.value.searchPlaceholder] ?? "";
});
const navigationSearchPlaceholder = computed(() => {
  const placeholders = {
    hpma: "搜索魔咒、伙伴、回响",
    notion: "搜索文档、项目、成员",
    czn: "搜索角色、情报、影像",
    re1999: "搜索档案、暴雨、角色",
    dango: "搜索组件、token、文档",
    apple: "搜索产品、服务",
    figma: "搜索文件、组件",
    spotify: "搜索歌单、播客",
  };
  return placeholders[selectedStyleId.value] || "搜索内容";
});
const pageInstances = computed(() => {
  const scenario = selectedInspectorTab.value === "pages" ? null : activeScenarioTab.value;
  const sourcePages = scenario
    ? currentTemplatePages.value.filter((template) => scenario.sourceIds.includes(template.id))
    : [selectedTemplate.value];
  const componentNames = scenario?.components || selectedTemplate.value.components;
  return componentNames.map((name) => {
    const source = selectedTemplate.value.components.includes(name)
      ? selectedTemplate.value
      : sourcePages.find((template) => template.components.includes(name)) || selectedTemplate.value;
    return {
      id: pageNodeId(name, source.id),
      templateId: source.id,
      name,
      label: name,
      rendered: staticallyRenderedComponents.has(name),
      reason: placeholderReasons[name] || defaultPlaceholderReason,
    };
  });
});
const activeComponentCategory = computed(() =>
  componentCategorySpecs.find((category) => category.id === selectedComponentCategoryId.value) || componentCategorySpecs[0],
);
const componentPanelItems = computed(() =>
  activeComponentCategory.value.components.map((name) => ({
    id: `component-${activeComponentCategory.value.id}-${kebabName(name)}`,
    name,
    label: componentDisplayName(name),
    rendered: staticallyRenderedComponents.has(name),
    reason: placeholderReasons[name] || defaultPlaceholderReason,
  })),
);
const snapshotComponents = computed(() => {
  if (selectedInspectorTab.value !== "pages") return [];
  return [];
});
const currentListRows = computed(() => {
  if (activeSide.value === "display") return displayListRows;
  if (activeSide.value === "publish") return publishListRows;
  return distributionListRows;
});

const componentsByName = computed(() =>
  Object.fromEntries(catalog.value.components.map((component) => [component.name, component])),
);
const missingByName = computed(() =>
  Object.fromEntries((catalog.value.missingComponents || []).map((component) => [component.name, component])),
);
const uniqueComponentCount = computed(() => new Set(pageInstances.value.map((item) => item.name)).size);
const selectedStyle = computed(() => stylePresets.find((preset) => preset.id === selectedStyleId.value) || stylePresets[0]);
const currentBrandPublishCopy = computed(() =>
  brandPublishCopy[selectedStyleId.value] || brandPublishCopy.czn,
);
const darkStatusbarStyleIds = new Set(["czn", "hpma", "re1999"]);
const isDarkStatusbarGhost = computed(() => darkStatusbarStyleIds.has(selectedStyleId.value));
const mockStatusbarClass = computed(() =>
  isDarkStatusbarGhost.value ? "mock-statusbar--ghost-dark" : "mock-statusbar--ghost-light",
);
const mockStatusbarMode = computed(() => ({
  color: isDarkStatusbarGhost.value ? "#ffffff" : "#111111",
  shadow: isDarkStatusbarGhost.value ? "0 1px 8px rgba(0, 0, 0, 0.42)" : "none",
}));
const selectedStyleCategory = computed(() =>
  styleCategories.find((category) => category.id === selectedStyleCategoryId.value),
);
const currentStyleCategoryDescription = computed(() =>
  selectedStyleCategoryId.value === "color" ? selectedStyle.value.evidenceNote : selectedStyleCategory.value?.description || "",
);
const currentStyleCapabilityNote = computed(() => {
  const notes = {
    spacing: {
      title: "DangoUI schema",
      body: "未发现通用 spacing token；Page / Media gap / CTA 只能落到 page CSS、component gap CSS 或 layout CSS。",
    },
    radius: {
      title: "DangoUI schema",
      body: "未发现通用 radius token；Card / Control / Media 圆角只能落到组件或页面 CSS。",
    },
    shadow: {
      title: "DangoUI schema",
      body: "未发现通用 shadow token；阴影、发光和 inset line 只能作为页面 CSS。",
    },
    motion: {
      title: "DangoUI schema",
      body: "有 Snackbar / Transition 组件能力，但未发现 --du-motion-* token；动效参数走组件 props 或交互 CSS。",
    },
    button: {
      title: "Action schema",
      body: "Button 是行动入口规则：普通 Button 可继承 DangoUI，IconButton 先看 icon/slot，FAB 当前作为待新增能力或页面 CSS。",
    },
  };
  return notes[selectedStyleCategoryId.value] || null;
});
const recipeSwatchClass = computed(() => `recipe-swatch-${selectedStyleCategoryId.value}`);
const selectedStyleRecipeRows = computed(() => {
  const recipe = styleRecipeDetails[selectedStyle.value.id];
  const categoryRows = recipe?.[selectedStyleCategoryId.value] || [];
  const fallbackRows = fallbackStyleRecipeDetails[selectedStyleCategoryId.value] || [];
  const rows = selectedStyleCategoryId.value === "typography"
    ? [...fallbackRows, ...categoryRows.map((item) => ({ ...item, title: `Brand ${item.title}` }))]
    : categoryRows.length
      ? categoryRows
      : fallbackRows;
  return rows.map((item, index) => ({
    ...item,
    source: item.source || styleInventorySource(selectedStyleCategoryId.value, item, index),
    target: item.target || styleRecipeMappingTarget(selectedStyleCategoryId.value, item),
    status: item.status || styleRecipeStatus(selectedStyleCategoryId.value, item),
  }));
});
const spacingScaleRows = computed(() =>
  selectedStyleRecipeRows.value.map((item) => {
    const size = firstNumber(item.value, 8);
    return {
      title: item.title,
      label: recipeSwatchText(item),
      size: Math.min(size, 28),
      width: Math.max(8, Math.min(size * 4, 96)),
      source: item.source,
      target: item.target,
      value: item.value,
      note: item.note,
    };
  }),
);
const radiusScaleRows = computed(() =>
  selectedStyleRecipeRows.value.map((item) => {
    const isPill = item.value.includes("999");
    const size = isPill ? 48 : Math.min(firstNumber(item.value, 8), 28);
    return {
      title: item.title,
      label: recipeSwatchText(item),
      radius: isPill ? "999px" : `${size}px`,
      source: item.source,
      target: item.target,
      value: item.value,
      note: item.note,
    };
  }),
);
const dividerScaleRows = computed(() =>
  selectedStyleRecipeRows.value.map((item) => {
    const text = `${item.title} ${item.value}`.toLowerCase();
    const kind = text.includes("selection") || text.includes("underline")
      ? "selection"
      : text.includes("frame") || text.includes("hud") || text.includes("ornate") || text.includes("card") || text.includes("panel")
        ? "frame"
        : "divider";
    return {
      ...item,
      kind,
    };
  }),
);
const selectedStyleTokenMap = computed(() =>
  Object.fromEntries(selectedStyle.value.tokens.map((token) => [token.name, token.value])),
);
const dangoColorStructureRows = computed(() => {
  const baseTokenMap = Object.fromEntries(catalog.value.tokens.map((token) => [token.name, token.value]));
  const overrideTokenMap = selectedStyle.value.id === "dango" ? {} : selectedStyleTokenMap.value;
  const tokenMap = {
    ...baseTokenMap,
    ...overrideTokenMap,
  };
  const overriddenTokenNames = new Set(Object.keys(overrideTokenMap));
  const firstColor = (value) => extractColorValues(value)[0] || "transparent";
  const dangoPrimitivePalettes = {
    neutral: ["#0000000a", "#00000014", "#0000001f", "#00000029", "#0000003d", "#00000066", "#000000a3", "#000000e0", "#000000"],
    white: ["#ffffff0a", "#ffffff14", "#ffffff1f", "#ffffff29", "#ffffff3d", "#ffffff66", "#ffffffa3", "#ffffffe0", "#ffffff"],
    purple: ["#f2f0ff", "#d9d2ff", "#c7b8ff", "#958dff", "#7c66ff", "#5c4cd9", "#4036b3", "#28238c", "#1a1866"],
    purplegray: ["#f7f7f9", "#ededf2", "#e1e1e5", "#d4d0da", "#bab5c4", "#918b9f", "#625e76", "#383950", "#2b263b"],
    red: ["#ffebe9", "#ffd1cf", "#ffabab", "#ff8380", "#f96464", "#d94a4e", "#b3343c", "#8c222c", "#661722"],
    orange: ["#fff0e6", "#ffdfca", "#ffc299", "#ffa15a", "#fc7e22", "#d65d11", "#b04105", "#8a2c00", "#631c00"],
    yellow: ["#fffde6", "#fff9ca", "#ffe885", "#fad728", "#edbf00", "#c79800", "#a17600", "#7a5600", "#543800"],
    tendershoots: ["#fbffe5", "#f4fec3", "#e4f689", "#cdee2b", "#b2d600", "#99b800", "#7f9900", "#667a00", "#4c5c00"],
    green: ["#e2f7e3", "#c9f2ca", "#9de09d", "#7ad37f", "#52ba5c", "#379e45", "#247842", "#145221", "#0f3d19"],
    turquoise: ["#e2f7f3", "#cdf9eb", "#9dedd9", "#77e5d2", "#36ccb6", "#17ad9b", "#14877e", "#076059", "#053b3a"],
    zimablue: ["#dff7f7", "#cbf7f7", "#9df2f4", "#62deef", "#28bee0", "#009bbf", "#087599", "#005273", "#00344d"],
    blue: ["#e4ebf9", "#cce0ff", "#a6caff", "#8fb7ff", "#6c9aff", "#5077d9", "#3957b3", "#263c8c", "#1b2866"],
    grape: ["#f1e6ff", "#ebd4ff", "#d6b3ff", "#b688ff", "#ad69f7", "#8a4fd1", "#6838ab", "#4a2585", "#32195e"],
  };
  const primitiveColorRefs = Object.entries(dangoPrimitivePalettes).flatMap(([family, values]) =>
    values.map((value, index) => ({
      ref: `${family}-${index + 1}`,
      family,
      step: index + 1,
      value: formatHexColor(value).toLowerCase(),
    })),
  );
  const primitiveRefForValue = (value) =>
    primitiveColorRefs.find((item) => item.value === formatHexColor(value).toLowerCase())?.ref || "";
  const rgbDistance = (a, b) => {
    const colorA = parseHexColor(a);
    const colorB = parseHexColor(b);
    if (!colorA || !colorB) return Number.MAX_SAFE_INTEGER;
    return Math.hypot(colorA.r - colorB.r, colorA.g - colorB.g, colorA.b - colorB.b, (colorA.a - colorB.a) * 255);
  };
  const colorStats = (value) => {
    const color = parseHexColor(value);
    if (!color) return null;
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    let hue = 0;
    if (delta) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return { hue, saturation, lightness, luminance, alpha: color.a };
  };
  const closestStepInFamily = (family, activeColor) => {
    const values = dangoPrimitivePalettes[family] || [];
    const stats = colorStats(activeColor);
    if (family === "neutral" && stats?.alpha > 0.95) {
      return Math.min(9, Math.max(1, Math.round((1 - stats.luminance) * 7) + 2));
    }
    if (family === "white" && stats?.alpha > 0.95) {
      return Math.min(9, Math.max(1, Math.round(stats.luminance * 7) + 2));
    }
    return values.reduce((best, value, index) => {
      const distance = rgbDistance(activeColor, value);
      if (!best || distance < best.distance) return { step: index + 1, distance };
      return best;
    }, null)?.step || 1;
  };
  const chromaticFamilyForHue = (hue) => {
    if (hue < 12 || hue >= 345) return "red";
    if (hue < 45) return "orange";
    if (hue < 72) return "yellow";
    if (hue < 95) return "tendershoots";
    if (hue < 155) return "green";
    if (hue < 185) return "turquoise";
    if (hue < 205) return "zimablue";
    if (hue < 255) return "blue";
    if (hue < 292) return "grape";
    return "purple";
  };
  const semanticFamilyHint = (tokenName, stats) => {
    if (stats?.luminance >= 0.92 && stats?.saturation <= 0.12) return "white";
    if (stats?.luminance <= 0.12 && stats?.saturation <= 0.45) return "neutral";
    if (stats?.saturation <= 0.08) {
      return stats.luminance > 0.72 ? "white" : "neutral";
    }
    return "";
  };
  const primitiveRefForBrandColor = (tokenName, activeColor) => {
    const stats = colorStats(activeColor);
    if (!stats) return "";
    const family = semanticFamilyHint(tokenName, stats) || chromaticFamilyForHue(stats.hue);
    const step = closestStepInFamily(family, activeColor);
    return `${family}-${step}`;
  };
  const primitiveOverridePriority = (name) => {
    if (name.endsWith("-color") || name.endsWith("-solid-bg")) return 0;
    if (name.endsWith("-border")) return 1;
    if (name.endsWith("-outline-color")) return 2;
    if (name.endsWith("-soft-bg")) return 3;
    return 4;
  };
  const primitiveOverrideMap = Object.entries(overrideTokenMap).reduce((map, [tokenName, activeValue]) => {
    const baseColor = firstColor(baseTokenMap[tokenName]);
    const activeColor = firstColor(activeValue);
    const primitiveRef = primitiveRefForBrandColor(tokenName, activeColor);
    if (!primitiveRef || !activeColor || formatHexColor(baseColor) === formatHexColor(activeColor)) return map;
    const current = map.get(primitiveRef);
    const item = {
      tokenName,
      baseColor,
      activeColor,
    };
    if (!current) {
      map.set(primitiveRef, {
        ...item,
        sourceTokens: [tokenName],
      });
      return map;
    }
    if (formatHexColor(current.activeColor) === formatHexColor(activeColor)) {
      if (!current.sourceTokens.includes(tokenName)) current.sourceTokens.push(tokenName);
      return map;
    }
    if (primitiveOverridePriority(tokenName) < primitiveOverridePriority(current.tokenName)) {
      map.set(primitiveRef, {
        ...item,
        sourceTokens: [tokenName],
      });
    }
    return map;
  }, new Map());
  const primitiveAnchorsByFamily = Array.from(primitiveOverrideMap.entries()).reduce((map, [primitiveRef, item]) => {
    const match = primitiveRef.match(/^(.+)-(\d)$/);
    if (!match) return map;
    const family = match[1];
    const anchors = map.get(family) || [];
    anchors.push({
      step: Number(match[2]),
      activeColor: item.activeColor,
    });
    map.set(family, anchors.sort((a, b) => a.step - b.step));
    return map;
  }, new Map());
  const mixColor = (fromValue, toValue, progress) => {
    const from = parseHexColor(fromValue);
    const to = parseHexColor(toValue);
    if (!from || !to) return "";
    const channel = (start, end) => Math.min(255, Math.max(0, Math.round(start + (end - start) * progress)));
    return `#${[channel(from.r, to.r), channel(from.g, to.g), channel(from.b, to.b)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
  };
  const inferredPrimitiveColor = (family, step) => {
    const inferableFamilies = new Set(["neutral", "white", "red", "orange", "yellow", "tendershoots", "green", "turquoise", "zimablue", "blue", "grape", "purple"]);
    if (!inferableFamilies.has(family)) return "";
    const anchors = primitiveAnchorsByFamily.get(family) || [];
    if (!anchors.length || anchors.some((anchor) => anchor.step === step)) return "";
    if (anchors.length === 1) {
      const anchor = anchors[0];
      if (step < anchor.step) {
        const progress = step / anchor.step;
        return mixColor("#FFFFFF", anchor.activeColor, progress);
      }
      const progress = (step - anchor.step) / (10 - anchor.step);
      return mixColor(anchor.activeColor, "#000000", progress);
    }
    const lower = [...anchors].reverse().find((anchor) => anchor.step < step);
    const upper = anchors.find((anchor) => anchor.step > step);
    if (lower && upper) {
      const progress = (step - lower.step) / (upper.step - lower.step);
      return mixColor(lower.activeColor, upper.activeColor, progress);
    }
    if (!lower && upper) {
      const progress = step / upper.step;
      return mixColor("#FFFFFF", upper.activeColor, progress);
    }
    const progress = (step - lower.step) / (10 - lower.step);
    return mixColor(lower.activeColor, "#000000", progress);
  };
  const paletteRows = Object.entries(dangoPrimitivePalettes).map(([family, values]) => {
    const steps = values.map((value, index) => {
      const step = index + 1;
      const tokenName = `--du-${family}-${step}`;
      const primitiveRef = `${family}-${step}`;
      const inferredOverride = primitiveOverrideMap.get(primitiveRef);
      const inferredColor = inferredPrimitiveColor(family, step);
      const activeValue = tokenMap[tokenName] || inferredOverride?.activeColor || inferredColor || value;
      const activeColor = firstColor(activeValue) || firstColor(value);
      const hasPrimitiveSignal = Boolean(inferredOverride);
      const isExactMatch = formatHexColor(activeColor) === formatHexColor(value);
      const isInferred = Boolean(inferredColor) && !hasPrimitiveSignal && !overriddenTokenNames.has(tokenName);
      const isOverridden = isInferred || ((overriddenTokenNames.has(tokenName) || hasPrimitiveSignal) && (hasPrimitiveSignal || !isExactMatch));
      return {
        name: `${family}-${step}`,
        label: String(step),
        value: activeColor,
        baseValue: value,
        displayValue: formatHexColor(activeColor),
        baseDisplayValue: formatHexColor(value),
        swatch: firstColor(activeColor),
        textColor: readableTextColor(activeColor, 0.42),
        isOverridden,
        isInferred,
        overrideKind: isInferred ? "推测" : isExactMatch ? "命中" : "覆盖",
        overrideSource: inferredOverride?.sourceTokens.join(" / ") || tokenName,
      };
    });
    return {
      family,
      steps,
      hasOverrides: steps.some((step) => step.isOverridden),
    };
  });
  const brandPrimitiveValueMap = paletteRows.reduce((map, row) => {
    row.steps.forEach((step) => {
      map.set(`${row.family}-${step.label}`, {
        value: step.value,
        swatch: step.swatch,
        displayValue: step.displayValue,
        baseDisplayValue: step.baseDisplayValue,
        isOverridden: step.isOverridden,
        isInferred: step.isInferred,
        overrideKind: step.overrideKind,
      });
    });
    return map;
  }, new Map());
  const primitiveForBaseToken = (name) => {
    const baseColor = firstColor(baseTokenMap[name]);
    const primitiveRef = baseColor ? primitiveRefForValue(baseColor) : "";
    return brandPrimitiveValueMap.get(primitiveRef)
      ? { ref: primitiveRef, ...brandPrimitiveValueMap.get(primitiveRef) }
      : null;
  };
  const semanticBrandFamilyMap = (() => {
    const directRefs = Array.from(primitiveOverrideMap.entries()).map(([ref, item]) => ({
      ref,
      family: ref.replace(/-\d$/, ""),
      tokenName: item.tokenName,
    }));
    const familyForPrefix = (prefix) => {
      const matches = directRefs.filter((item) => item.tokenName.startsWith(`--du-${prefix}-`));
      if (!matches.length) return "";
      const counts = matches.reduce((map, item) => {
        map.set(item.family, (map.get(item.family) || 0) + 1);
        return map;
      }, new Map());
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    };
    return {
      primary: familyForPrefix("primary"),
      secondary: familyForPrefix("secondary"),
      trade: familyForPrefix("trade"),
      success: familyForPrefix("success"),
      warning: familyForPrefix("warning"),
      error: familyForPrefix("error"),
    };
  })();
  const semanticPrefixFromName = (name) =>
    ["primary", "secondary", "trade", "success", "warning", "error"].find((prefix) => name.startsWith(`--du-${prefix}-`)) || "";
  const semanticResolvedColor = (name, activeValue = tokenMap[name]) => {
    const directOverride = tokenOverrideInfo(name, activeValue);
    if (directOverride.isOverridden) {
      const primitiveRef = primitiveRefForBrandColor(name, directOverride.overrideDisplayValue) || "unknown";
      return {
        value: directOverride.overrideDisplayValue,
        swatch: directOverride.overrideDisplayValue,
        baseDisplayValue: directOverride.baseDisplayValue,
        expression: `${primitiveRef} · ${directOverride.overrideDisplayValue}`,
        isOverridden: true,
        overrideKind: "覆盖",
      };
    }
    const semanticPrefix = semanticPrefixFromName(name);
    const semanticBrandFamily = semanticBrandFamilyMap[semanticPrefix];
    const basePrimitiveRef = primitiveForBaseToken(name)?.ref || "";
    const basePrimitiveFamily = basePrimitiveRef.replace(/-\d$/, "");
    const baseStep = basePrimitiveRef.match(/-(\d)$/)?.[1] || "";
    const canAdoptSemanticFamily = semanticBrandFamily && baseStep && !["neutral", "white", "purplegray"].includes(basePrimitiveFamily);
    const semanticFamilyValue = canAdoptSemanticFamily ? brandPrimitiveValueMap.get(`${semanticBrandFamily}-${baseStep}`) : null;
    if (semanticFamilyValue?.isOverridden) {
      return {
        value: semanticFamilyValue.displayValue,
        swatch: semanticFamilyValue.displayValue,
        baseDisplayValue: semanticFamilyValue.baseDisplayValue,
        expression: `${semanticBrandFamily}-${baseStep} · ${semanticFamilyValue.displayValue}`,
        isOverridden: true,
        isInferred: semanticFamilyValue.isInferred,
        overrideKind: semanticFamilyValue.overrideKind,
      };
    }
    const primitive = primitiveForBaseToken(name);
    if (primitive?.isOverridden) {
      return {
        value: primitive.displayValue,
        swatch: primitive.displayValue,
        baseDisplayValue: primitive.baseDisplayValue,
        expression: `${primitive.ref} · ${primitive.displayValue}`,
        isOverridden: true,
        isInferred: primitive.isInferred,
        overrideKind: primitive.overrideKind,
      };
    }
    const color = firstColor(activeValue);
    const primitiveRef = primitiveRefForValue(color) || "unknown";
    const hexValue = formatHexColor(color);
    return {
      value: hexValue,
      swatch: firstColor(hexValue),
      baseDisplayValue: hexValue,
      expression: `${primitiveRef} -> ${hexValue}`,
      isOverridden: false,
      overrideKind: "",
    };
  };
  const tokenRefFromValue = (value) => String(value).match(/var\((--[^)]+)\)/)?.[1] || "";
  const resolveTokenValue = (value, seen = []) => {
    const ref = tokenRefFromValue(value);
    if (!ref || seen.includes(ref) || !tokenMap[ref]) return { value, refs: [] };
    const resolved = resolveTokenValue(tokenMap[ref], [...seen, ref]);
    return { value: resolved.value, refs: [ref, ...resolved.refs] };
  };
  const tokenOverrideInfo = (name, activeValue = tokenMap[name]) => {
    const activeColor = firstColor(activeValue);
    const baseColor = firstColor(baseTokenMap[name]);
    const isOverridden = selectedStyle.value.id !== "dango" && overriddenTokenNames.has(name) && activeColor && baseColor && formatHexColor(activeColor) !== formatHexColor(baseColor);
    return {
      isOverridden,
      baseColor,
      baseDisplayValue: baseColor ? formatHexColor(baseColor) : "",
      overrideDisplayValue: activeColor ? formatHexColor(activeColor) : "",
    };
  };
  const mappingExpression = (name, primitiveRef, hexValue, prefixParts = []) => {
    const overrideInfo = tokenOverrideInfo(name, tokenMap[name]);
    if (overrideInfo.isOverridden) {
      return [...prefixParts, `DangoUI ${overrideInfo.baseDisplayValue} -> ${selectedStyle.value.label} ${overrideInfo.overrideDisplayValue}`].filter(Boolean).join(" -> ");
    }
    return [...prefixParts, primitiveRef || "unknown", hexValue].filter(Boolean).join(" -> ");
  };
  const componentAlias = (name, displayName = name.replace("--du-", ""), rawOverride = null, context = "", optionalRef = "") => {
    const rawValue = rawOverride ?? tokenMap[name] ?? "";
    const resolved = resolveTokenValue(rawValue);
    const colorValue = firstColor(resolved.value) || firstColor(rawValue);
    if (!colorValue) return null;
    const overrideInfo = tokenOverrideInfo(name, rawValue);
    const refResolvedInfo = resolved.refs.map((ref) => ({ ref, resolved: semanticResolvedColor(ref, tokenMap[ref]) })).find((item) => item.resolved.isOverridden);
    const directResolvedInfo = semanticResolvedColor(name, rawValue);
    const finalResolved = overrideInfo.isOverridden ? directResolvedInfo : refResolvedInfo?.resolved || null;
    const hexValue = finalResolved?.value || formatHexColor(colorValue);
    const primitiveRef = finalResolved?.expression?.split(" · ")[0] || primitiveRefForValue(hexValue) || "unknown";
    const slotLabel = optionalRef?.split(" -> ")[0] || displayName.replace(/^--du-/, "");
    const expression = `${slotLabel} · ${primitiveRef} · ${hexValue}`;
    return {
      name,
      label: displayName,
      value: rawValue,
      hexValue,
      swatch: firstColor(hexValue),
      expression,
      isOverridden: Boolean(finalResolved?.isOverridden),
      isInferred: Boolean(finalResolved?.isInferred),
      overrideKind: finalResolved?.overrideKind || "",
    };
  };
  const sortByOrder = (items, order) => {
    const orderMap = new Map(order.map(([suffix], index) => [suffix, index]));
    return [...items].sort((a, b) => {
      const aIndex = orderMap.has(a.suffix) ? orderMap.get(a.suffix) : Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.has(b.suffix) ? orderMap.get(b.suffix) : Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex || a.suffix.localeCompare(b.suffix);
    });
  };
  const componentAliasOrder = [
    ["solid-color", "solidColor"],
    ["solid-bg", "solidBg"],
    ["color", "color"],
    ["soft-bg", "softBg"],
    ["outline-color", "outlineColor"],
    ["border", "border"],
    ["text-color", "textColor"],
    ["solid-disabledtemp-color", "solidDisabledtempColor"],
    ["solid-disabledtemp-bg", "solidDisabledtempBg"],
    ["disabledtemp-color", "disabledtempColor"],
    ["soft-disabledtemp-bg", "softDisabledtempBg"],
    ["outline-disabledtemp-color", "outlineDisabledtempColor"],
    ["disabledtemp-border", "disabledtempBorder"],
    ["text-disabledtemp-color", "textDisabledtempColor"],
  ];
  const componentAliasOrderIndex = (item) => {
    const haystack = `${item.displayName || ""} ${item.tokenName || ""} ${item.suffix || ""}`;
    const index = componentAliasOrder.findIndex(([suffix]) => haystack.endsWith(suffix) || haystack.includes(`-${suffix}`));
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const buttonVariantNames = ["primary", "secondary", "trade", "success", "warning", "error", "default", "white", "trans-black", "vip"];
  const buttonVariantTokens = buttonVariantNames.flatMap((variant) =>
    sortByOrder(
      componentAliasOrder
        .map(([suffix, displayName]) => ({
          variant,
          suffix,
          displayName,
          tokenName: `--du-bt-${suffix}`,
          semanticName: `--du-${variant}-${suffix}`,
        }))
        .filter((item) => tokenMap[item.semanticName]),
      componentAliasOrder,
    ),
  );
  const buttonVariantGroups = buttonVariantNames
    .map((variant) => {
      const mappings = sortByOrder(
        buttonVariantTokens.filter((item) => item.variant === variant),
        componentAliasOrder,
      )
        .map((item) => componentAlias(
          item.tokenName,
          item.tokenName,
          `var(${item.semanticName})`,
          "",
          `${item.suffix} -> ${item.variant}-${item.suffix}`,
        ))
        .filter(Boolean);
      return {
        name: variant,
        summary: `du-c-${variant}-bt：bt-* 槽位赋值到 ${variant}-*`,
        mappings,
      };
    })
    .filter((group) => group.mappings.length);
  const componentTokenGroups = [
    {
      component: "Button",
      source: "源码逻辑：每个 du-c-{color}-bt 分别把 bt-* 槽位赋值到 {color}-*",
      variantGroups: buttonVariantGroups,
      tokens: [],
    },
    ...catalog.value.components
      .filter((componentItem) => componentItem.name !== "Button" && componentItem.tokens)
      .map((componentItem) => ({
        component: componentItem.name,
        source: "catalog component.tokens 全量",
        tokens: Object.entries(componentItem.tokens)
          .map(([displayName, tokenName]) => ({
            tokenName,
            displayName,
          }))
          .sort((a, b) => componentAliasOrderIndex(a) - componentAliasOrderIndex(b) || a.displayName.localeCompare(b.displayName)),
      })),
  ];
  const componentAliasGroups = componentTokenGroups
    .map((spec) => {
      const seen = new Set();
      const mappings = spec.tokens
        .filter(({ tokenName, rawOverride }) => {
          const key = `${tokenName}:${rawOverride || ""}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return Boolean(tokenMap[tokenName]);
        })
        .map(({ tokenName, displayName, rawOverride, context, optionalRef }) => componentAlias(tokenName, displayName, rawOverride, context, optionalRef))
        .filter(Boolean);
      return {
        component: spec.component,
        expanded: spec.component === "Button",
        variantGroups: spec.variantGroups,
        summary: spec.variantGroups
          ? `${spec.variantGroups.length} 个颜色变体 · ${spec.source}`
          : mappings.length
          ? `${mappings.length} 个颜色别名 · ${spec.source}`
          : `无颜色别名 · ${spec.source}`,
        mappings,
      };
    })
    .filter((group) => group.component === "Button" || group.summary);
  const neutralSemanticDescription = "占整个 app 用色的 60%，文字、图标、边框、分割线、阴影的常用色";
  const semanticFamilies = [
    { family: "text", prefix: "text", category: "中性语义色", source: neutralSemanticDescription, order: ["1", "2", "3", "disabled"] },
    { family: "icon", prefix: "icon", category: "中性语义色", source: neutralSemanticDescription, order: ["1", "2", "3", "disabled"] },
    { family: "border", prefix: "border", category: "中性语义色", source: neutralSemanticDescription, order: ["1", "2", "3"] },
    { family: "bg", prefix: "bg", category: "中性语义色", source: neutralSemanticDescription, order: ["1", "2", "3", "4"] },
    { family: "mask", prefix: "mask", category: "中性语义色", source: neutralSemanticDescription, order: ["1", "2", "3", "4", "hover", "active"] },
    { family: "primary", prefix: "primary", category: "品牌语义色", source: "品牌主色，用于主按钮、主行动入口和关键高亮。" },
    { family: "secondary", prefix: "secondary", category: "品牌语义色", source: "品牌辅助色，用于次级行动、辅助强调和品牌延展。" },
    { family: "trade", prefix: "trade", category: "品牌语义色", source: "交易/业务强调色，用于价格、交易动作和强业务状态。" },
    { family: "success", prefix: "success", category: "通用语义色", source: "成功状态色，用于完成、通过、正向反馈。" },
    { family: "warning", prefix: "warning", category: "通用语义色", source: "警告状态色，用于提醒、风险提示和待处理状态。" },
    { family: "error", prefix: "error", category: "通用语义色", source: "错误状态色，用于失败、危险、破坏性提示。" },
    { family: "default", prefix: "default", category: "通用语义色", source: "默认操作色，用于未指定品牌或状态语义的组件默认态。" },
    { family: "white", prefix: "white", category: "通用语义色", source: "反相语义色，用于深色底上的文字、图标和组件状态。" },
    { family: "transblack", prefix: "trans-black", category: "通用语义色", source: "透明黑语义色，用于遮罩、浮层、压暗和叠加状态。" },
  ];
  const semanticRows = semanticFamilies.map(({ family, prefix, category, source, order }) => {
    const tokenPrefix = `--du-${prefix}-`;
    const familyTokens = Object.entries(tokenMap)
      .filter(([name]) => name.startsWith(tokenPrefix))
      .filter(([name]) => !name.includes("-bt-") && !name.includes("-tag-") && !name.endsWith("-channel"));
    const directToken = (suffix) => {
      const name = `${tokenPrefix}${suffix}`;
      const resolved = semanticResolvedColor(name, tokenMap[name]);
      return {
        name,
        label: suffix,
        value: resolved.value,
        displayValue: resolved.value,
        baseDisplayValue: resolved.baseDisplayValue,
        swatch: resolved.swatch,
        textColor: readableTextColor(resolved.swatch, 0.42),
        isOverridden: resolved.isOverridden,
        isInferred: resolved.isInferred,
        overrideKind: resolved.overrideKind,
        expression: resolved.expression,
      };
    };
    const steps = Array.from({ length: 9 }, (_, index) => directToken(String(index + 1))).filter((item) => item.value);
    const aliases = familyTokens
      .filter(([name]) => order || !/^--du-[a-z-]+-\d$/.test(name))
      .map(([name, value]) => {
        const resolved = semanticResolvedColor(name, value);
        const label = name.replace(tokenPrefix, "");
        return {
          name,
          label,
          value: resolved.value,
          displayValue: resolved.value,
          baseDisplayValue: resolved.baseDisplayValue,
          swatch: resolved.swatch,
          expression: resolved.expression,
          isOverridden: resolved.isOverridden,
          isInferred: resolved.isInferred,
          overrideKind: resolved.overrideKind,
        };
      });
    const mappedAliasNames = order
      ? order.map((label) => [label, label])
      : [
      ["solid-color", "solidColor"],
      ["solid-bg", "solidBg"],
      ["color", "color"],
      ["soft-bg", "softBg"],
      ["outline-color", "outlineColor"],
      ["border", "border"],
      ["text-color", "textColor"],
      ["solid-disabledtemp-color", "solidDisabledtempColor"],
      ["solid-disabledtemp-bg", "solidDisabledtempBg"],
      ["disabledtemp-color", "disabledtempColor"],
      ["soft-disabledtemp-bg", "softDisabledtempBg"],
      ["outline-disabledtemp-color", "outlineDisabledtempColor"],
      ["disabledtemp-border", "disabledtempBorder"],
      ["text-disabledtemp-color", "textDisabledtempColor"],
    ];
    const mappings = mappedAliasNames
      .map(([label, displayName]) => {
        const item = aliases.find((aliasItem) => aliasItem.label === label);
        return item ? { ...item, displayName } : null;
      })
      .filter(Boolean)
      .map((item) => ({
        name: item.name,
        label: item.displayName,
        value: item.value,
        swatch: item.swatch,
        primitiveRef: primitiveRefForValue(item.value) || "unknown",
        hexValue: formatHexColor(item.value),
        expression: item.expression,
        isOverridden: item.isOverridden,
        isInferred: item.isInferred,
        overrideKind: item.overrideKind,
      }));
    return {
      family,
      category,
      scaleText: source,
      mappings,
    };
  });
  const alias = (name, value, swatchSource = value) => ({
    name,
    value,
    swatch: firstColor(swatchSource),
    chain: "",
  });
  const semantic = (name, ref, swatchSource = tokenMap[name]) => ({
    name,
    value: `var(${ref})`,
    swatch: firstColor(swatchSource),
    chain: "",
  });
  const component = (name) => {
    const value = tokenMap[name] || "";
    const ref = String(value).match(/var\((--[^)]+)\)/)?.[1] || "";
    return {
      name,
      value: ref ? `var(${ref})` : value,
      swatch: firstColor(tokenMap[ref] || value),
      chain: "",
    };
  };
  return [
    {
      title: "一级：基础色板",
      description: "只表达颜色家族和色阶，不带业务语义。",
      variant: "paletteRows",
      items: paletteRows,
      hasOverrides: paletteRows.some((row) => row.hasOverrides),
    },
    {
      title: "二级：语义色板",
      description: "引用一级基础色板，中性色:品牌语义色:通用语义色=6:3:1，中性色包括 White/Transblack/Default，品牌语义色包括 Primary/Secondary/Trade，通用语义色包括 Success/Warning/Error。",
      variant: "semanticTextRows",
      items: semanticRows,
    },
    {
      title: "三级：组件别名",
      description: "组件别名层引用二级语义色板；当前快照 61 个组件，其中 39 个有 token map，32 个能解析到颜色链路。",
      variant: "componentAliasRows",
      items: componentAliasGroups,
    },
  ];
});
const catalogColorInventoryRows = computed(() => {
  const rows = new Map();
  catalog.value.tokens.forEach((token) => {
    extractColorValues(token.value).forEach((color) => {
      const key = color.toLowerCase();
      const row = rows.get(key) || {
        raw: color,
        count: 0,
        percent: "token refs",
        targetNames: [],
        value: "dangoui 初始化 token 色值",
        swatch: color,
        sortCount: 0,
      };
      row.count += 1;
      row.sortCount = row.count;
      if (row.targetNames.length < 8) row.targetNames.push(token.name);
      rows.set(key, row);
    });
  });
  return Array.from(rows.values()).map((row) => ({
    ...row,
    target: row.targetNames.join(" / "),
  }));
});
const selectedColorInventoryRows = computed(() => {
  if (selectedStyle.value.id === "dango" && catalogColorInventoryRows.value.length) {
    return catalogColorInventoryRows.value.sort((a, b) => b.sortCount - a.sortCount || a.raw.localeCompare(b.raw));
  }

  const rows = new Map();
  const addCandidate = ({ raw, count = 0, percent = "0%", target, value, swatch, source }) => {
    extractColorValues(raw).forEach((color) => {
      const key = color.toLowerCase();
      const row = rows.get(key) || {
        raw: color,
        count: 0,
        percent,
        targetNames: [],
        value,
        swatch: swatch || color,
        sortCount: 0,
        sources: [],
      };
      row.count += count;
      row.sortCount = row.count;
      if (count > 0) {
        row.percent = percent;
        row.value = value;
      }
      if (target && row.targetNames.length < 8) row.targetNames.push(target);
      if (source && row.sources.length < 4) row.sources.push(source);
      rows.set(key, row);
    });
  };

  selectedStyle.value.tokens.filter((token) => isColorSignal(token.value)).forEach((token) => {
    addCandidate({
      raw: token.value,
      target: token.name,
      value: "项目 token 中存在的候选映射色",
      source: "token",
    });
  });
  selectedStyle.value.signals.forEach((signal) => {
    const count = typeof signal.count === "number" ? signal.count : 0;
    addCandidate({
      raw: signal.raw,
      count,
      percent: signal.percent === "baseline" ? "0%" : signal.percent,
      target: signal.target,
      value: signal.value,
      swatch: signalSwatch(signal),
      source: "evidence",
    });
  });
  Object.values(selectedStyle.value.style || {}).forEach((value) => {
    addCandidate({
      raw: value,
      target: "demoOnlyVisualControls",
      value: "页面 CSS 中出现的候选颜色",
      source: "style",
    });
  });
  const sourceRank = (row) => {
    const source = row.sources[0] || "";
    if (source === "token") return 0;
    if (source === "evidence") return 1;
    if (source === "style") return 2;
    return 3;
  };
  return Array.from(rows.values()).map((row) => ({
    ...row,
    target: row.targetNames.join(" / "),
    source: row.sources.join(" / ") || row.targetNames[0] || "project",
  })).sort((a, b) => sourceRank(a) - sourceRank(b) || a.target.localeCompare(b.target) || a.raw.localeCompare(b.raw));
});
const themeVars = computed(() => ({
  "--du-bg-2": selectedStyleTokenMap.value["--du-bg-2"],
  "--du-bg-1": selectedStyleTokenMap.value["--du-bg-1"],
  "--du-c-bg-2": selectedStyleTokenMap.value["--du-bg-2"],
  "--du-text-1": selectedStyleTokenMap.value["--du-text-1"],
  "--du-text-3": selectedStyleTokenMap.value["--du-text-3"],
  "--du-icon-1": selectedStyleTokenMap.value["--du-icon-1"] || selectedStyleTokenMap.value["--du-text-1"],
  "--du-icon-2": selectedStyleTokenMap.value["--du-icon-2"] || selectedStyleTokenMap.value["--du-text-2"] || selectedStyleTokenMap.value["--du-text-3"],
  "--du-icon-3": selectedStyleTokenMap.value["--du-icon-3"] || selectedStyleTokenMap.value["--du-text-3"],
  "--du-border-1": selectedStyleTokenMap.value["--du-border-1"],
  "--du-border-2": selectedStyleTokenMap.value["--du-border-2"] || selectedStyleTokenMap.value["--du-border-1"],
  "--du-primary-color": selectedStyleTokenMap.value["--du-primary-color"],
  "--du-primary-border": selectedStyleTokenMap.value["--du-primary-border"],
  "--du-primary-outline-color": selectedStyleTokenMap.value["--du-primary-outline-color"],
  "--du-primary-soft-bg": selectedStyleTokenMap.value["--du-primary-soft-bg"],
  "--du-primary-solid-bg": selectedStyleTokenMap.value["--du-primary-solid-bg"],
  "--du-c-bg-2-channel": rgbChannel(selectedStyleTokenMap.value["--du-bg-2"]),
  "--du-primary-solid-bg-channel": rgbChannel(
    selectedStyleTokenMap.value["--du-primary-solid-bg"] || selectedStyleTokenMap.value["--du-primary-color"],
  ),
  "--du-secondary-solid-bg-channel": rgbChannel(
    selectedStyleTokenMap.value["--du-secondary-solid-bg"] ||
      selectedStyleTokenMap.value["--du-secondary-color"] ||
      selectedStyleTokenMap.value["--du-primary-solid-bg"] ||
      selectedStyleTokenMap.value["--du-primary-color"],
  ),
  "--style-page-bg": selectedStyleTokenMap.value["--du-bg-2"],
  "--style-card-bg": selectedStyleTokenMap.value["--du-bg-1"],
  "--style-text": selectedStyleTokenMap.value["--du-text-1"],
  "--style-muted": selectedStyleTokenMap.value["--du-text-3"],
  "--style-accent": selectedStyleTokenMap.value["--du-primary-color"],
  "--style-accent-soft": selectedStyleTokenMap.value["--du-primary-soft-bg"],
  "--style-card-radius-base": selectedStyle.value.style.cardRadius,
  "--style-control-radius-base": selectedStyle.value.style.controlRadius,
  "--style-page-spacing-base": selectedStyle.value.style.pageSpacing,
  "--style-card-radius": selectedStyle.value.style.cardRadius,
  "--style-control-radius": selectedStyle.value.style.controlRadius,
  "--style-page-spacing": selectedStyle.value.style.pageSpacing,
  "--style-card-shadow": selectedStyle.value.style.cardShadow,
  "--style-media": selectedStyle.value.style.media,
  "--mock-fab-foreground": readableSolidTextColor(selectedStyleTokenMap.value["--du-primary-color"]),
  "--mock-statusbar-color": mockStatusbarMode.value.color,
  "--mock-statusbar-shadow": mockStatusbarMode.value.shadow,
}));
const mockupScaleVars = computed(() => ({
  "--mockup-scale": mockupScale.value.toFixed(4),
}));

const mockupSelectPopupStyle = computed(() => ({
  "--mockup-select-popup": "1",
  left: "var(--mockup-popup-left, 0px)",
  right: "auto",
  bottom: "var(--mockup-popup-bottom, 0px)",
  width: "var(--mockup-popup-width, 100vw)",
  "max-height": "min(320px, calc(var(--mockup-popup-height, 100vh) - 96px))",
  "padding-bottom": "var(--mockup-popup-home-indicator, 34px)",
  "border-radius": "var(--publish-card-radius, 16px) var(--publish-card-radius, 16px) var(--mockup-popup-radius, 32px) var(--mockup-popup-radius, 32px)",
}));
const styleJson = computed(() =>
  JSON.stringify(
    {
      source: selectedStyle.value.label,
      docsEntry: introductionUrl,
      activeDocs: activeDocs.map((doc) => doc.file),
      supportingFiles: {
        archive: "历史上下文，不参与规则判断",
        references: "demo-only token snapshot，正式 dangoui 项目中废弃",
        migrations: "案例产物，不反向定义规则",
      },
      lockedSchema: "dangoui-existing-css-token-names-and-components",
      starterTemplates,
      workflow: workflowSteps,
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
  if (selectedInspectorTab.value === "components") {
    if (friendlyDescriptions[selectedComponent.value]) return friendlyDescriptions[selectedComponent.value];
    if (selectedComponentCategoryId.value === "output") {
      return displayFriendlyDescriptions[selectedComponent.value] || distributionFriendlyDescriptions[selectedComponent.value] || selectedMeta.value?.description || selectedMissing.value?.reason || "这个组件用于把信息清楚地展示给用户。";
    }
    return selectedMeta.value?.description || selectedMissing.value?.reason || "这个模块还没有匹配到设计系统组件。";
  }
  if (activeSide.value === "distribution" && distributionFriendlyDescriptions[selectedComponent.value]) {
    return distributionFriendlyDescriptions[selectedComponent.value];
  }
  if (activeSide.value === "display" && displayFriendlyDescriptions[selectedComponent.value]) {
    return displayFriendlyDescriptions[selectedComponent.value];
  }
  if (friendlyDescriptions[selectedComponent.value]) return friendlyDescriptions[selectedComponent.value];
  if (selectedMeta.value) return selectedMeta.value.description;
  if (selectedMissing.value) {
    return "这是页面底部导航。当前 dangoui catalog 还没有这个组件，所以只能识别位置，不能按 dangoui schema 精准改。";
  }
  return "这个模块还没有匹配到设计系统组件。";
});
const componentUseCaseDescription = computed(() => {
  const categoryDescriptions = {
    bar: "用于让用户知道自己在哪里、还能去哪里，以及下一步能执行什么主要动作。",
    output: "用于把内容、媒体、商品、状态或结果以可浏览、可比较、可点击的方式展示出来。",
    input: "用于收集用户填写、选择、上传和确认的信息，并把它们组织成可提交的数据。",
    feedback: "用于在用户操作后给出轻重不同的反馈，避免用户不知道系统是否响应。",
  };
  return categoryDescriptions[selectedComponentCategoryId.value] || activeComponentCategory.value.description;
});
const componentActionDescriptions = {
  NavigationBar: "用户能通过它确认当前页面、返回上一层、发起搜索或触发右侧动作。",
  Search: "用户能通过它直接找到内容、商品、活动或配置项。",
  Tabs: "用户能通过它在同一块内容里切换不同频道或维度。",
  Button: "用户能通过它完成报名、发布、保存、确认等明确动作。",
  Tag: "用户能通过它快速识别内容状态、分类和运营重点。",
  Image: "用户能通过它确认封面、商品图、角色图或媒体素材。",
  FormItem: "用户能通过它理解字段名称、必填规则、提示和校验状态。",
  Input: "用户能通过它填写名称、关键词或单行配置。",
  Textarea: "用户能通过它填写正文、说明和运营备注。",
  Switch: "用户能通过它开启或关闭某项配置。",
  NoticeBar: "用户能通过它看到页面内持续提示、风险提醒或运营公告。",
  Snackbar: "用户能通过它知道刚刚的操作是否成功。",
  Dialog: "用户能通过它确认高风险动作或做二次决策。",
};
const componentUserActionDescription = computed(() => {
  return componentActionDescriptions[selectedComponent.value] || humanDescription.value || componentUseCaseDescription.value;
});
const componentAvailabilityDescription = computed(() => {
  const name = selectedComponent.value;
  const label = componentSupportLabel(name);
  const kind = componentSupportKind(name);
  if (kind === "dangoui") return `DangoUI 已有：可以直接用组件库能力承接，再按参考站 token 调整视觉。`;
  if (kind === "business") return `DangoUI 待更新：当前先用业务组件或组合样式表达，后续需要补齐组件 API / schema。`;
  if (kind === "gap") return `DangoUI 待新增：现在是建设中占位，demo 只表达场景和期望形态。`;
  return `${label}：当前先按 demo 场景表达，后续再归入 DangoUI 或业务组件。`;
});
const componentEditableModel = {
  Search: [
    { title: "slots", items: [["showIcon", "right slot：图标操作", "slot right；可放 Icon / Divider / Button。"]] },
    {
      title: "props",
      items: [
        {
          key: "searchPlaceholder",
          label: "placeholder：占位提示文案",
          hint: "string | string[]；默认空字符串，数组时会滚动切换。",
          control: "select",
          options: [
            { label: "滚动占位", value: "rolling" },
            { label: "单条文案", value: "single" },
            { label: "空值", value: "empty" },
          ],
        },
      ],
    },
    { title: "业务组合能力", items: [["disabled", "置灰态", "Search 源码没有 disabled prop；这里表达只读入口在业务中不可点的状态。"]] },
  ],
  Tabs: [
    { title: "slots", items: [["showLabel", "default slot：Tab 文案", "slot default；每个 DuTab 的显示内容。"]] },
    {
      title: "props",
      items: [
        {
          key: "tabsValue",
          label: "value：选中项",
          hint: "string；必须匹配 DuTab 的 name。",
          control: "select",
          options: [
            { label: "推荐", value: "recommend" },
            { label: "最新", value: "latest" },
            { label: "热门", value: "hot" },
          ],
        },
        {
          key: "tabsType",
          label: "type：形态",
          hint: "'default' | 'tag' | 'text'；默认 default。",
          control: "select",
          options: [
            { label: "default", value: "default" },
            { label: "tag", value: "tag" },
            { label: "text", value: "text" },
          ],
        },
      ],
    },
  ],
  SegmentControl: [{ title: "props", items: [["active", "选中项"], ["disabled", "禁用态"]] }],
  TabBar: [
    { title: "slots", items: [["showIcon", "item icon"]] },
    { title: "props", items: [["active", "active tab"]] },
  ],
  BottomBar: [
    { title: "slots", items: [["showAction", "操作按钮"]] },
    { title: "props", items: [["disabled", "禁用态"]] },
  ],
  Menu: [
    { title: "slots", items: [["showIcon", "菜单图标"]] },
    { title: "props", items: [["active", "选中项"]] },
  ],
  Badge: [
    { title: "slots", items: [["showLabel", "default slot：承载内容", "slot default；红点/数字挂载的目标内容。"]] },
    { title: "props", items: [["active", "value / dot 状态", "string | number；0 或空值默认隐藏，alwaysShow 可强制显示。"]] },
  ],
  Tag: [
    { title: "slots", items: [["showClose", "closeable：关闭入口", "boolean；显示关闭图标并触发 close 事件。"]] },
    { title: "props", items: [["bordered", "bordered", "boolean；是否显示边框。"], ["rounded", "round", "boolean；是否使用圆角胶囊形态。"]] },
  ],
  Empty: [
    { title: "slots", items: [["showAction", "buttonText 动作"]] },
    { title: "props", items: [["showMedia", "image 类型"]] },
  ],
  Image: [{ title: "props", items: [{ key: "imageRadius", label: "radius：图片圆角", hint: "number | string；默认不设置。", control: "number", min: 0, max: 40 }, ["showMedia", "src / mode", "src 为图片地址；mode 为 'aspectFit' | 'aspectFill' | 'widthFix'。"]] }],
  Avatar: [
    { title: "props", items: [["bordered", "bordered", "boolean；是否展示头像外边框。"]] },
  ],
  Time: [{ title: "业务组合能力", items: [["showLabel", "时间标题"], ["showHelper", "辅助说明"]] }],
  PriceStatistic: [{ title: "业务组合能力", items: [["showLabel", "指标标签"], ["active", "强调状态"]] }],
  Swiper: [
    { title: "slots", items: [["showMedia", "SwiperItem 内容"]] },
    { title: "props", items: [["active", "autoplay"]] },
  ],
  FormItem: [
    { title: "slots", items: [["showLabel", "label 区域", "label prop 渲染字段名；默认 slot 承载表单控件。"], ["showHelper", "tips 区域", "tips prop；字段说明/校验提示。"]] },
    { title: "props", items: [["bordered", "内部控件边框", "这里联动内部 DuInput 的 bordered。"], ["active", "required", "boolean；字段是否必填。"]] },
  ],
  Input: [
    { title: "slots", items: [["showLabel", "prefix 文案", "prefix prop；输入内容前的标签。"]] },
    { title: "props", items: [["bordered", "bordered", "boolean；外边框样式。"], ["disabled", "disabled", "boolean；禁用输入。"]] },
  ],
  Textarea: [{ title: "props", items: [["bordered", "bordered", "boolean；外边框样式。"], ["showCount", "show-count", "boolean；显示当前字数/maxlength。"], { key: "textareaMaxlength", label: "maxlength：最大字数", hint: "number；默认 -1 表示不限制。", control: "number", min: -1, max: 200 }] }],
  Radio: [{ title: "props", items: [["active", "checked", "boolean；当前项是否选中。"], ["disabled", "disabled", "boolean；禁用选择。"]] }],
  Checkbox: [{ title: "props", items: [["active", "checked", "boolean；当前项是否选中。"], ["disabled", "disabled", "boolean；禁用选择。"]] }],
  Switch: [{ title: "props", items: [["active", "on", "boolean；开关开/关。"], ["disabled", "disabled", "boolean；禁用操作。"]] }],
  Stepper: [{ title: "props", items: [{ key: "stepperValue", label: "value：当前数值", hint: "number；默认 0。", control: "number", min: 0, max: 99 }, ["disabled", "disabled", "boolean；禁用加减。"]] }],
  Upload: [
    { title: "slots", items: [["showMedia", "已上传媒体"]] },
    { title: "props", items: [["showLabel", "badge"], ["disabled", "disabled"]] },
  ],
  Tips: [{ title: "业务组合能力", items: [["showLabel", "提示标题"], ["showHelper", "提示正文"]] }],
  Group: [
    { title: "slots", items: [["showLabel", "字段内容"]] },
    { title: "props", items: [["bordered", "分组边界"]] },
  ],
  DateTimePicker: [
    { title: "slots", items: [["showLabel", "字段名", "DuCalendar title / 外部 label 槽位"], ["showHelper", "辅助说明", "提示用户时间字段的取值范围与默认值"]] },
    {
      title: "props",
      items: [
        {
          key: "calendarShowTimePicker",
          label: "showTimePicker:是否含时间",
          hint: "boolean;true 时 DuCalendar 启用时间选择,半小时内 step=5。",
          control: "switch",
        },
      ],
    },
  ],
  Rate: [{ title: "props", items: [{ key: "rateValue", label: "value：评分值", hint: "number；用来表达当前评分。", control: "number", min: 0, max: 5 }, ["disabled", "只读/禁用"]] }],
  Cascader: [
    { title: "slots", items: [["showAction", "trigger slot"]] },
    { title: "props", items: [["showLabel", "title"]] },
  ],
  Select: [
    { title: "slots", items: [["showLabel", "trigger slot 文案", "default slot；非 FormItem 环境必须提供触发器。"]] },
    { title: "props", items: [["showHelper", "title / placeholder", "title prop；弹层标题或未选占位。"]] },
  ],
  NoticeBar: [
    { title: "slots", items: [["showAction", "linkText 动作", "linkText/linkIcon；右侧链接动作。"]] },
    {
      title: "props",
      items: [
        {
          key: "noticeType",
          label: "type：公告条形态",
          hint: "'primary' | 'secondary'；默认 secondary。",
          control: "select",
          options: [
            { label: "secondary", value: "secondary" },
            { label: "primary", value: "primary" },
          ],
        },
        {
          key: "noticeColor",
          label: "color：色彩",
          hint: "string；使用 DangoUI 色板名。",
          control: "select",
          options: [
            { label: "primary", value: "primary" },
            { label: "warning", value: "warning" },
            { label: "success", value: "success" },
            { label: "error", value: "error" },
            { label: "default", value: "default" },
          ],
        },
        ["showClose", "closeable", "boolean；是否显示关闭入口。"],
      ],
    },
  ],
  Snackbar: [
    { title: "slots", items: [["showIcon", "leftIcon", "string；左侧图标名。"], ["showAction", "action button", "buttonProps；右侧操作按钮配置。"]] },
    {
      title: "props",
      items: [
        ["showClose", "showClose", "boolean；是否显示关闭按钮。"],
        {
          key: "snackbarButtonColor",
          label: "buttonProps.color：动作按钮色彩",
          hint: "string；Snackbar 自身无顶层 color，颜色通过右侧动作按钮配置。",
          control: "select",
          options: [
            { label: "white", value: "white" },
            { label: "primary", value: "primary" },
            { label: "secondary", value: "secondary" },
            { label: "default", value: "default" },
          ],
        },
      ],
    },
  ],
  Toast: [{ title: "props", items: [["active", "显示状态"], ["showIcon", "图标"]] }],
  Dialog: [
    { title: "slots", items: [["showAction", "底部按钮"], ["showHelper", "正文说明"]] },
  ],
  Popup: [
    { title: "slots", items: [["showAction", "内容动作"]] },
    { title: "props", items: [["showClose", "closable"]] },
  ],
  ShareSheet: [
    { title: "slots", items: [["showIcon", "渠道图标"], ["showAction", "渠道动作"]] },
  ],
  ResultPage: [{ title: "slots", items: [["active", "结果状态"], ["showAction", "后续动作"]] }],
  Spin: [{ title: "props", items: [["active", "loading"], ["showLabel", "加载文案"]] }],
  Skeleton: [
    { title: "slots", items: [["showMedia", "template 内容"]] },
    { title: "props", items: [["active", "loading"]] },
  ],
};
const componentSwitchLabels = {
  active: "选中 / 激活态",
  disabled: "禁用态",
  bordered: "边框",
  rounded: "圆角",
  showLabel: "标题 / 标签",
  showHelper: "辅助说明",
  showAction: "操作入口",
  showIcon: "图标",
  showMedia: "媒体 / 图片",
  showCount: "字数统计",
  showClose: "关闭入口",
};
function normalizeEditableItem(item) {
  if (Array.isArray(item)) {
    const [key, label, hint] = item;
    return {
      key,
      label: label || componentSwitchLabels[key] || key,
      hint: hint || "boolean；按默认值初始化，开关控制 true / false。",
      control: "switch",
    };
  }
  return {
    control: item.control || "switch",
    options: item.options || [],
    step: item.step || 1,
    ...item,
    label: item.label || componentSwitchLabels[item.key] || item.key,
    hint: item.hint || (item.control === "number" ? "number；填写数值。" : item.control === "select" ? "string；从可用值中选择。" : "boolean；按默认值初始化，开关控制 true / false。"),
  };
}
function openComponentExamplePopup(name) {
  componentExamplePopup.value = name;
}
function closeComponentExamplePopup() {
  componentExamplePopup.value = null;
}
function setComponentExampleValue(key, value) {
  componentExampleState.value = {
    ...componentExampleState.value,
    [key]: value,
  };
  openEditableSelectKey.value = "";
}
function toggleEditableSelect(key) {
  openEditableSelectKey.value = openEditableSelectKey.value === key ? "" : key;
}
function setNavigationExampleColor(value) {
  navExampleColor.value = value;
  openEditableSelectKey.value = "";
}
function editableOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}
const componentEditableGroups = computed(() => {
  const fallback = [
    { title: "props", items: [["active", "状态"], ["disabled", "禁用态"], ["bordered", "边框"]] },
    { title: "业务组合能力", items: [["showAction", "操作入口"]] },
  ];
  return (componentEditableModel[selectedComponent.value] || fallback).map((group) => ({
    title: group.title,
    items: group.items.map(normalizeEditableItem),
  }));
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

function componentChineseName(name) {
  return componentChineseNames[name] || "组件";
}

function componentDisplayName(name) {
  return componentDisplayNames[name] || name || "";
}

function editableFieldHint(field) {
  const hints = {
    标题: "导航栏中间的页面标题",
    返回按钮: "左侧返回入口",
    右侧动作: "右侧分享、更多或确认动作",
    背景: "导航栏底色或透明状态",
    "固定/透明状态": "是否吸顶、是否覆盖在主视觉上",
    占位文案: "输入前给用户看的提示文字",
    只读: "是否允许用户直接输入",
    输入态: "聚焦、输入中、清除按钮状态",
    文案: "组件展示给用户看的文字",
    类型: "primary、default、success 等语义类型",
    尺寸: "normal、large 或组件尺寸",
    颜色: "语义色或品牌色映射",
    选中项: "当前 active 的 tab、分段或选项",
    图标: "左侧、右侧或 icon-only 图标",
    安全区: "底部 home indicator / 顶部状态栏预留",
  };
  return hints[field] || `对应组件里的 ${field} 区域`;
}

function componentSupportLabel(name) {
  const kind = componentSupportKind(name);
  const support = componentSupportMap[name] || "";
  if (support.includes("·")) return support;
  const labels = {
    dangoui: "DangoUI",
    adapter: "DangoUI",
    business: "待更新",
    shell: "DangoUI 待更新",
    gap: "待新增",
  };
  return labels[kind] || support || componentMeta(name)?.className || missingMeta(name)?.status || "unknown";
}

function componentSupportKind(name) {
  const support = componentSupportMap[name] || "";
  if (support === "DangoUI 待更新") return "business";
  if (support === "DangoUI 待新增") return "gap";
  if (support.startsWith("DangoUI")) return "dangoui";
  if (support === "业务组件") return "business";
  if (support === "Shell" || support === "组合") return "shell";
  if (support.includes("缺口")) return "gap";
  if (componentMeta(name)) return "dangoui";
  return "gap";
}

const styleCategorySupportMap = {
  color: "DangoUI",
  typography: "DangoUI",
  icon: "DangoUI",
  button: "DangoUI 待更新",
  asset: "DangoUI 待更新",
  divider: "DangoUI",
  layout: "DangoUI 待更新",
  spacing: "DangoUI 待新增",
  radius: "DangoUI 待新增",
  shadow: "DangoUI 待新增",
  motion: "DangoUI 待更新",
};

function styleCategorySupportKind(category) {
  const support = styleCategorySupportMap[category?.id] || category?.status || category?.meta || "";
  if (support === "DangoUI 待更新") return "business";
  if (support === "DangoUI 待新增") return "gap";
  if (support.startsWith("DangoUI") || support === "token" || support === "dangoui token") return "dangoui";
  return "business";
}

function styleCategorySupportLabel(category) {
  const kind = styleCategorySupportKind(category);
  const labels = {
    dangoui: "DangoUI",
    business: "待更新",
    gap: "待新增",
  };
  return labels[kind] || "待更新";
}

function styleRecipeStatusLabel(status, categoryId, item = {}) {
  const text = `${item.title || ""} ${item.value || ""} ${item.note || ""}`;
  if (["spacing", "radius", "shadow"].includes(categoryId)) return "待新增";
  if (categoryId === "typography") {
    if (/^[HBN][1-8]$/.test(item.title || "")) return "DangoUI";
    if (/Button|Tab|Title|Body|Caption|Micro|Line height|Font weight/i.test(text)) return "DangoUI";
    return "待更新";
  }
  if (categoryId === "icon") return status === "mapped" ? "DangoUI" : "待更新";
  if (categoryId === "button") {
    if (/FAB/i.test(text) || status === "missing") return "待新增";
    if (/IconButton/i.test(text) || status === "composed") return "DangoUI 组合";
    return status === "mapped" ? "DangoUI" : "待更新";
  }
  if (categoryId === "divider") return status === "mapped" ? "DangoUI" : "待更新";
  if (categoryId === "motion") return /Snackbar|Transition/i.test(text) || status === "mapped" ? "DangoUI" : "待更新";
  if (categoryId === "asset") return status === "composed" ? "DangoUI" : "待更新";
  if (status === "mapped" || status === "composed") return "DangoUI";
  if (status === "missing") return "待新增";
  return "待更新";
}

function supplementDescription(name) {
  const support = componentSupportLabel(name);
  const description = displayDescription(name);
  if (support === "DangoUI 待更新") return `${description} Showcase 前先作为业务 mock 或适配态补齐，不在此阶段定架构。`;
  if (support === "DangoUI 待新增") return `${description} 当前 DangoUI 尚未提供正式组件或 token，需要后续补充。`;
  return description;
}

function missingMeta(name) {
  return missingByName.value[name];
}

function isMissing(name) {
  return Boolean(missingMeta(name));
}

function isColorSignal(value) {
  return extractColorValues(value).length > 0;
}

function signalSwatch(signal) {
  const firstColor = extractColorValues(signal.raw)[0];
  if (firstColor) return firstColor;
  if (String(signal.raw).includes("/")) {
    return `linear-gradient(135deg, ${String(signal.raw).split("/").map((item) => item.trim()).join(", ")})`;
  }
  if (String(signal.raw).includes("palette")) return selectedStyle.value.style.media;
  return "linear-gradient(135deg, #f6f5f4, #e6e6e6)";
}

function parseHexColor(value) {
  const hex = String(value).trim().replace("#", "");
  if (!/^[0-9a-f]{3,8}$/i.test(hex)) return null;
  const normalized = hex.length === 3 || hex.length === 4
    ? hex.split("").map((char) => char + char).join("")
    : hex;
  const hasAlpha = normalized.length === 8;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: hasAlpha ? parseInt(normalized.slice(6, 8), 16) / 255 : 1,
  };
}

function rgbChannel(value) {
  const color = parseHexColor(value);
  if (!color) return "0, 0, 0";
  return `${color.r}, ${color.g}, ${color.b}`;
}

function formatHexColor(value) {
  const raw = String(value).trim();
  const match = raw.match(/^#([0-9a-f]{3,8})$/i);
  if (!match) return raw;
  const hex = match[1];
  const normalized = hex.length === 3 || hex.length === 4
    ? hex.split("").map((char) => char + char).join("")
    : hex;
  return `#${normalized.toUpperCase()}`;
}

function readableTextColor(value, opacity = 0.8) {
  const color = parseHexColor(value);
  if (!color) return "var(--style-text)";
  const r = color.r * color.a + 255 * (1 - color.a);
  const g = color.g * color.a + 255 * (1 - color.a);
  const b = color.b * color.a + 255 * (1 - color.a);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.48 ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`;
}

function readableSolidTextColor(value) {
  const color = parseHexColor(value);
  if (!color) return "#fff";
  const r = color.r * color.a + 255 * (1 - color.a);
  const g = color.g * color.a + 255 * (1 - color.a);
  const b = color.b * color.a + 255 * (1 - color.a);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.48 ? "#fff" : "#111";
}

function legacyCopyText(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyPaletteColor(value) {
  let copied = legacyCopyText(value);
  if (!copied && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      copied = false;
    }
  }
  copiedColorValue.value = value;
  showCopySnackbar(value);
  window.setTimeout(() => {
    if (copiedColorValue.value === value) copiedColorValue.value = "";
  }, 900);
}

function showCopySnackbar(value) {
  window.clearTimeout(snackbarTimer);
  window.clearTimeout(snackbarCloseTimer);
  snackbarMessage.value = `已复制 ${value}`;
  snackbarOpen.value = false;
  window.setTimeout(() => {
    snackbarOpen.value = true;
  }, 20);
  snackbarTimer = window.setTimeout(() => {
    snackbarOpen.value = false;
    snackbarCloseTimer = window.setTimeout(() => {
      snackbarMessage.value = "";
    }, 250);
  }, 2000);
}

function extractColorValues(value) {
  return Array.from(String(value).matchAll(/#[0-9a-f]{3,8}|rgba?\([^)]*\)/gi), (match) => match[0]);
}

function firstNumber(value, fallback) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function closestPrimitive(value, type) {
  const primitives = [
    { label: `${type}/Mini`, value: 2 },
    { label: `${type}/Small`, value: 4 },
    { label: `${type}/Normal`, value: 8 },
    { label: `${type}/Medium`, value: 12 },
    { label: `${type}/Large`, value: 16 },
  ];
  const number = firstNumber(value, 8);
  const exact = primitives.find((item) => item.value === number);
  if (exact) return { ...exact, status: "mapped" };
  const nearest = primitives.reduce((best, item) =>
    Math.abs(item.value - number) < Math.abs(best.value - number) ? item : best,
  primitives[0]);
  return { ...nearest, status: "fallback" };
}

function styleRecipeMappingTarget(category, item) {
  if (category === "typography") {
    if (/^[HBN][1-8]$/.test(item.title)) return "Echo typography scale · DangoUI no global typography token";
    if (/Button/i.test(item.title)) return "Button style.scss size classes · component source";
    if (/Tab/i.test(item.title)) return "Tabs / Tab style.scss · component source";
    if (/Title|Body|Caption|Micro|Line height|Font weight/i.test(item.title)) return "DangoUI component CSS · no global typography token";
    if (/Font family|Brand/i.test(item.title)) return "demoOnlyVisualControls / brand font asset";
    return "DangoUI component CSS / 页面文字样式";
  }
  if (category === "icon") {
    if (/brand|asset|logo/i.test(`${item.title} ${item.value}`)) return "demoOnlyVisualControls / asset reference";
    if (/button/i.test(item.title)) return "DuButton icon / iconPosition · ask-user when icon name is missing";
    return "DuIcon name / color inherits semantic token";
  }
  if (category === "button") {
    if (/IconButton/i.test(item.title)) return "DuButton + DuIcon / icon slot · state asset when needed";
    if (/FAB/i.test(item.title)) return "DangoUI 待新增 · floating action CSS / future DuFab";
    return "DuButton props + semantic color token";
  }
  if (category === "asset") {
    const text = `${item.title} ${item.value} ${item.role || ""}`;
    if (/logo|brand-mark|illustration/i.test(text)) return "DangoUI Image / slot when structure needs it · otherwise 页面资产样式";
    if (/selected|active/i.test(text)) return "state selector CSS background · selected/active only";
    if (/frame|border-image|9-slice/i.test(text)) return "页面 Frame 资产 · border-image/background";
    if (/texture|background/i.test(text)) return "page/panel CSS background asset";
    return "页面资产样式";
  }
  if (category === "layout") {
    return "template CSS / component composition · 页面布局样式";
  }
  if (category === "spacing") {
    if (/Empty/i.test(item.title)) return "--du-empty-padding · Empty component only";
    const adapter = /Page/i.test(item.title)
      ? "--style-page-spacing / page CSS"
      : /CTA|Control|Button/i.test(item.title)
        ? "component local gap CSS"
        : "layout gap CSS";
    return `DangoUI schema: no general spacing token · ${adapter}`;
  }
  if (category === "divider") {
    if (/frame|角线|ornate|HUD|panel|card/i.test(`${item.title} ${item.value}`)) {
      return "dangoui --du-border-1 + 页面 Frame CSS";
    }
    return "--du-border-1 / --du-primary-border";
  }
  if (category === "radius") {
    const adapter = item.title === "Control"
      ? "--style-control-radius / component CSS"
      : /Media|Asset/i.test(item.title)
        ? "media container CSS"
        : "--style-card-radius / page CSS";
    return `DangoUI schema: no general radius token · ${adapter}`;
  }
  if (category === "shadow") {
    if (/glow|氛围光|magic|neon/i.test(`${item.title} ${item.value} ${item.note}`)) return "DangoUI schema: no shadow token · demoOnlyVisualControls glow CSS";
    if (/inner|inset|line/i.test(`${item.title} ${item.value} ${item.note}`)) return "DangoUI schema: no shadow token · --du-border-* / inset border CSS";
    return "DangoUI schema: no shadow token · 页面 CSS";
  }
  if (category === "motion") {
    if (/snackbar/i.test(`${item.title} ${item.value}`)) return "DuSnackbar props · no motion token";
    if (/tab|switch|transition/i.test(`${item.title} ${item.value}`)) return "Transition / component state CSS · no motion token";
    return "interaction CSS · no --du-motion-*";
  }
  return selectedStyleCategory.value?.meta || "页面样式";
}

function styleInventorySource(category, item, index) {
  const text = `${item.title} ${item.value} ${item.note}`;
  if (category === "typography") {
    if (/^[HBN][1-8]$/.test(item.title)) return "H/B/N typography scale";
    if (/Font family|Brand/i.test(item.title)) return "font asset / CSS";
    if (/Letter spacing|Line height|Font weight/i.test(item.title)) return "component CSS";
    return "DangoUI component CSS";
  }
  if (category === "icon") {
    if (/brand|asset|logo/i.test(text)) return "asset reference";
    if (/button/i.test(text)) return "DuButton icon prop";
    return "DuIcon / semantic color";
  }
  if (category === "button") {
    if (/FAB/i.test(item.title)) return "floating action / page CSS";
    if (/IconButton/i.test(item.title)) return "Button + Icon composition";
    return "DangoUI Button";
  }
  if (category === "asset") {
    if (/logo|brand-mark/i.test(text)) return "local image asset";
    if (/selected|active/i.test(text)) return "state asset";
    if (/frame|border-image|9-slice/i.test(text)) return "asset frame";
    if (/texture|background/i.test(text)) return "background asset";
    return "asset inventory";
  }
  if (category === "divider") {
    if (/frame|角线|ornate|HUD|panel|card/i.test(text)) return "Frame CSS / --du-border-*";
    if (/selection|underline|active/i.test(text)) return "active indicator CSS";
    return "Divider.vue / --du-border-1";
  }
  if (category === "layout") {
    if (/Page shell/i.test(item.title)) return "mockup viewport";
    if (/Media/i.test(item.title)) return "media template CSS";
    return "page template";
  }
  if (category === "spacing") {
    if (/Empty/i.test(item.title)) return "Empty component token";
    if (/Page/i.test(item.title)) return "page CSS";
    if (/Control|CTA|Button/i.test(item.title)) return "component CSS";
    return "layout CSS";
  }
  if (category === "radius") {
    if (/Control/i.test(item.title)) return "control CSS";
    if (/Media|Asset/i.test(item.title)) return "media CSS";
    return "card/page CSS";
  }
  if (category === "shadow") {
    if (/none|inset|border/i.test(text)) return "border/inset CSS";
    return "页面 shadow CSS";
  }
  if (category === "motion") {
    if (/Snackbar/i.test(item.title)) return "DuSnackbar";
    return "interaction CSS";
  }
  return `project item ${index + 1}`;
}

function styleRecipeStatus(category, item) {
  const text = `${item.title} ${item.value} ${item.note}`;
  if (category === "typography") {
    if (/^[HBN][1-8]$/.test(item.title)) return "fallback";
    if (/Button|Tab|Title|Body|Caption|Micro|Line height|Font weight/i.test(item.title)) return "mapped";
    if (/Font family|Brand/i.test(item.title)) return "style-only";
    return "fallback";
  }
  if (category === "icon") return /missing|缺失|ask-user/i.test(text) ? "ask-user" : /asset|logo|brand/i.test(text) ? "style-only" : "mapped";
  if (category === "button") {
    if (/FAB/i.test(item.title)) return "missing";
    if (/IconButton/i.test(item.title)) return "composed";
    return "mapped";
  }
  if (category === "asset") {
    if (/candidate|缺失|ReviewQueue|ask-user/i.test(text)) return "ask-user";
    if (/Image slot|DangoUI Image/i.test(text)) return "composed";
    return "style-only";
  }
  if (category === "layout") return "style-only";
  if (category === "spacing") return /Empty/i.test(item.title) ? "mapped" : "style-only";
  if (category === "divider") return /frame|角线|ornate|HUD|panel|card/i.test(text) ? "style-only" : "mapped";
  if (category === "radius") return "style-only";
  if (category === "shadow") return "style-only";
  if (category === "motion") return /Snackbar/i.test(text) ? "mapped" : "style-only";
  return "style-only";
}

function recipeSwatchText(item) {
  if (selectedStyleCategoryId.value === "typography") return "Aa";
  if (selectedStyleCategoryId.value === "icon") return item.title.includes("Brand") ? "logo" : "icon";
  if (selectedStyleCategoryId.value === "button") {
    if (/IconButton|FAB/i.test(item.title)) return "+";
    return "Button";
  }
  if (selectedStyleCategoryId.value === "asset") {
    if (/font/i.test(item.role || item.title)) return "Aa";
    if (/logo/i.test(item.title)) return "png";
    if (/selected/i.test(item.title)) return "state";
    if (/cta/i.test(item.role || item.title)) return "cta";
    if (/decorative|orbital/i.test(item.role || item.title)) return "decor";
    if (/frame/i.test(item.title)) return "frame";
    if (/texture|background/i.test(item.title)) return "bg";
    return "asset";
  }
  if (selectedStyleCategoryId.value === "layout") return item.title.includes("Page") ? "page" : "grid";
  if (selectedStyleCategoryId.value === "spacing") return `${firstNumber(item.value, 8)}px`;
  if (selectedStyleCategoryId.value === "divider") return item.title === "Frame" ? "frame" : "1px";
  if (selectedStyleCategoryId.value === "radius") return item.value.includes("999") ? "pill" : `${firstNumber(item.value, 8)}px`;
  if (selectedStyleCategoryId.value === "shadow") return item.title.includes("Glow") ? "glow" : "layer";
  if (selectedStyleCategoryId.value === "motion") return item.title.includes("Snackbar") ? "bar" : "tap";
  return item.value;
}

function recipeSwatchStyle(item) {
  const category = selectedStyleCategoryId.value;
  if (category === "typography") {
    const [sizePart, weightPart] = String(item.value).split("/");
    const lineHeightPart = String(item.value).split("/")[2];
    return {
      fontSize: `${Math.min(firstNumber(sizePart, 14), 22)}px`,
      fontWeight: String(firstNumber(weightPart, 700)),
      lineHeight: lineHeightPart ? `${Math.min(firstNumber(lineHeightPart, 22), 28)}px` : undefined,
    };
  }
  if (category === "spacing") {
    const gap = Math.min(firstNumber(item.value, 8), 24);
    return {
      "--recipe-gap": `${gap}px`,
    };
  }
  if (category === "radius") {
    const radius = item.value.includes("999") ? 999 : firstNumber(item.value, 8);
    return {
      "--recipe-radius": radius === 999 ? "999px" : `${Math.min(radius, 28)}px`,
    };
  }
  if (category === "divider") {
    return {
      "--recipe-divider": selectedStyleTokenMap.value["--du-border-1"] || selectedStyleTokenMap.value["--du-primary-border"] || "#d9d9d9",
      "--recipe-divider-accent": selectedStyleTokenMap.value["--du-primary-border"] || selectedStyleTokenMap.value["--du-primary-color"] || "#8e6140",
      "--recipe-frame-opacity": item.title === "Frame" ? 1 : 0,
    };
  }
  if (category === "asset") {
    const isFontAsset = /font/i.test(`${item.role || ""} ${item.title}`);
    return {
      "--recipe-asset-image": isFontAsset ? "none" : item.assetPath ? `url("${item.assetPath}")` : item.value.includes("/assets/") ? `url("${item.value.split(" · ")[0]}")` : "none",
      "--recipe-asset-accent": selectedStyleTokenMap.value["--du-primary-border"] || selectedStyleTokenMap.value["--du-primary-color"] || "#8e6140",
      "--recipe-asset-bg": selectedStyleTokenMap.value["--du-bg-1"] || selectedStyleTokenMap.value["--du-bg-2"] || "#131818",
    };
  }
  if (category === "button") {
    const isFab = /FAB/i.test(item.title);
    const isIconButton = /IconButton/i.test(item.title);
    const bg = selectedStyleTokenMap.value["--du-primary-color"] || selectedStyle.value.style.accent;
    return {
      "--recipe-button-radius": isFab || isIconButton ? "999px" : "var(--style-control-radius)",
      "--recipe-button-width": isFab ? "46px" : isIconButton ? "34px" : "74px",
      "--recipe-button-height": isFab ? "46px" : isIconButton ? "34px" : "32px",
      "--recipe-button-bg": bg,
      "--recipe-button-fg": readableSolidTextColor(bg),
    };
  }
  if (category === "shadow") {
    return {
      "--recipe-shadow": item.title.includes("Glow")
        ? `0 0 24px ${selectedStyleTokenMap.value["--du-primary-color"] || "rgba(0,0,0,.18)"}`
        : selectedStyle.value.style.cardShadow,
    };
  }
  return {};
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

function clearDemoSelection() {
  selectedInstanceId.value = "";
  selectedComponent.value = "";
  selectedTokenName.value = "";
  tokensExpanded.value = false;
}

function clearCanvasSelection() {
  selectedInstanceId.value = "";
  selectedTokenName.value = "";
  tokensExpanded.value = false;
}

function componentCategoryForName(name) {
  return componentCategorySpecs.find((category) => category.components.includes(name))?.id || selectedComponentCategoryId.value;
}

function defaultComponentForCategory(categoryId = selectedComponentCategoryId.value) {
  const category = componentCategorySpecs.find((item) => item.id === categoryId) || componentCategorySpecs[0];
  return category.components[0] || "";
}

function selectComponentCategory(categoryId) {
  selectedComponentCategoryId.value = categoryId;
  selectedInspectorTab.value = "components";
  selectedWorkspaceMode.value = "components";
  clearCanvasSelection();
  selectedComponent.value = defaultComponentForCategory(categoryId);
}

function selectCatalogComponent(name) {
  selectedComponentCategoryId.value = componentCategoryForName(name);
  selectedInspectorTab.value = "components";
  selectedWorkspaceMode.value = "components";
  clearCanvasSelection();
  selectedComponent.value = name;
}

const defaultSelectionExclusions = new Set(["NavigationBar", "NavigationBarRight", "SearchRight"]);

function defaultInstanceForCurrentTemplate() {
  const template = selectedTemplate.value;
  const componentName = template.components.find((name) => !defaultSelectionExclusions.has(name)) || template.components[0];
  if (!componentName) return null;
  const instanceId = pageNodeId(componentName, template.id);
  return (
    pageInstances.value.find((instance) => instance.id === instanceId) ||
    pageInstances.value.find((instance) => instance.templateId === template.id && instance.name === componentName) ||
    pageInstances.value.find((instance) => instance.name === componentName) ||
    null
  );
}

function selectDefaultInstanceForCurrentTemplate(options = {}) {
  const { scroll = true } = options;
  const instance = defaultInstanceForCurrentTemplate();
  if (!instance) {
    clearDemoSelection();
    return;
  }
  selectedInspectorTab.value = "components";
  selectedWorkspaceMode.value = "components";
  selectedComponent.value = instance.name;
  selectedComponentCategoryId.value = componentCategoryForName(instance.name);
  selectedInstanceId.value = instance.id;
  selectedTokenName.value = "";
  tokensExpanded.value = false;
  if (scroll) {
    nextTick(() => {
      scrollInspectorToSelectedInstance();
      scrollDemoToSelectedNode();
    });
  }
}

function setSelectedTemplate(templateId, options = {}) {
  const { record = true } = options;
  if (!templateId || templateId === selectedTemplateId.value) return;
  if (record) {
    templateHistory.value = [...templateHistory.value.slice(-8), selectedTemplateId.value];
  }
  selectedTemplateId.value = templateId;
}

function scrollInspectorToSelectedInstance() {
  document
    .querySelector(`[data-instance-id="${selectedInstanceId.value}"]`)
    ?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function scrollDemoToSelectedNode() {
  const node =
    document.querySelector(`.nav-searchbar-target[data-node-id="${selectedInstanceId.value}"]`) ||
    document.querySelector(`.template-feed > [data-node-id="${selectedInstanceId.value}"]`) ||
    document.querySelector(`.template-feed [data-node-id="${selectedInstanceId.value}"]:not(.supplement-component-card)`) ||
    document.querySelector(`.phone-screen > [data-node-id="${selectedInstanceId.value}"]`) ||
    document.querySelector(`.supplement-component-card[data-node-id="${selectedInstanceId.value}"]`) ||
    document.querySelector(`[data-node-id="${selectedInstanceId.value}"]`);
  if (!node) return;
  node.scrollIntoView({ block: "center", behavior: "auto" });
}

function hoverLabelForNodeId(nodeId) {
  const instance = pageInstances.value.find((item) => item.id === nodeId);
  const hoverCategoryOverrides = {
    Button: "数据输入",
    Card: "数据输出",
    CharacterPanel: "数据输出",
    FAB: "导航",
    FeedSpuTag: "数据输出",
    Grid: "数据输出",
    HeroHeader: "数据输出",
    List: "数据输出",
    Steps: "数据输出",
  };
  const knownComponents = [...new Set([...componentCategorySpecs.flatMap((spec) => spec.components), ...Object.keys(hoverCategoryOverrides)])].sort((a, b) => kebabName(b).length - kebabName(a).length);
  const matchedName = knownComponents.find((componentName) => nodeId?.endsWith(`-${kebabName(componentName)}`));
  const name = instance?.name || matchedName || nodeId?.split("-").pop() || "";
  const category = componentCategorySpecs.find((spec) => spec.components.includes(name));
  const categoryLabel = category?.label || hoverCategoryOverrides[name] || "组件";
  return `组件 - ${categoryLabel} - ${componentDisplayName(name) || name}`;
}

function prepareMockupHoverLabel(event) {
  const target = event.target?.closest?.(".click-target[data-node-id], .nav-searchbar-target[data-node-id]");
  const screen = event.currentTarget;
  if (!target || !screen?.getBoundingClientRect) {
    clearMockupHoverLabel();
    return;
  }
  const label = hoverLabelForNodeId(target.dataset.nodeId);
  const screenRect = screen.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const labelHeight = 32 * mockupScale.value;
  const gap = 8 * mockupScale.value;
  const inset = 12 * mockupScale.value;
  let top = targetRect.top - screenRect.top - labelHeight - gap;
  if (top < inset) {
    top = targetRect.bottom - screenRect.top + gap;
  }
  top = Math.max(inset, Math.min(top, screenRect.height - labelHeight - inset));
  mockupHoverLabel.value = label;
  mockupHoverStyle.value = {
    top: `${top}px`,
    right: `${inset}px`,
    left: "auto",
  };
  target.dataset.hoverLabel = label;
  target.removeAttribute("title");
}

function clearMockupHoverLabel() {
  mockupHoverLabel.value = "";
  mockupHoverStyle.value = {};
}

function prepareMockupPopupHoverLabel(event) {
  const popup = event.target?.closest?.(".du-popup__content");
  if (!popup || document.documentElement.dataset.mockupPopup !== "select") return;
  let componentName = document.documentElement.dataset.mockupPopupComponent || "Popup";
  let hoverTarget = popup;
  const selectOption = event.target?.closest?.(".du-select__option");
  if (selectOption?.querySelector?.(".du-radio")) {
    componentName = "Radio";
    hoverTarget = selectOption;
  } else if (selectOption?.querySelector?.(".du-checkbox")) {
    componentName = "Checkbox";
    hoverTarget = selectOption;
  } else if (event.target?.closest?.(".du-radio")) {
    componentName = "Radio";
    hoverTarget = event.target.closest(".du-radio");
  } else if (event.target?.closest?.(".du-checkbox")) {
    componentName = "Checkbox";
    hoverTarget = event.target.closest(".du-checkbox");
  } else if (event.target?.closest?.(".du-cascader__search, .du-select__search, .du-search")) {
    componentName = "Search";
    hoverTarget = event.target.closest(".du-cascader__search, .du-select__search, .du-search");
  } else if (event.target?.closest?.(".du-tabs")) {
    componentName = "Tabs";
    hoverTarget = event.target.closest(".du-tabs");
  } else if (event.target?.closest?.(".du-cascader__option")) {
    componentName = "Cascader";
    hoverTarget = event.target.closest(".du-cascader__option");
  } else if (event.target?.closest?.(".du-select__options")) {
    componentName = "Select";
    hoverTarget = event.target.closest(".du-select__options");
  } else if (event.target?.closest?.(".du-cascader__options")) {
    componentName = "Cascader";
    hoverTarget = event.target.closest(".du-cascader__options");
  }
  const label = `组件 - ${componentCategorySpecs.find((spec) => spec.components.includes(componentName))?.label || "组件"} - ${componentDisplayName(componentName) || componentName}`;
  const screen = phoneRef.value?.querySelector?.(".phone-screen");
  const screenRect = screen?.getBoundingClientRect?.();
  const targetRect = hoverTarget.getBoundingClientRect?.();
  if (!screenRect || !targetRect) return;
  const labelHeight = 32 * mockupScale.value;
  const gap = 8 * mockupScale.value;
  const inset = 12 * mockupScale.value;
  let top = targetRect.top - screenRect.top - labelHeight - gap;
  if (top < inset) {
    top = targetRect.bottom - screenRect.top + gap;
  }
  top = Math.max(inset, Math.min(top, screenRect.height - labelHeight - inset));
  mockupHoverLabel.value = label;
  mockupHoverStyle.value = {
    top: `${top}px`,
    right: `${inset}px`,
    left: "auto",
  };
  popup.removeAttribute("data-hover-label");
}

function clearMockupPopupHoverLabel(event) {
  const popup = event.target?.closest?.(".du-popup__content");
  if (!popup) return;
  popup.removeAttribute("data-hover-label");
  clearMockupHoverLabel();
}

function syncMockupHoverLabels() {
  document.querySelectorAll(".phone-screen [data-node-id]").forEach((target) => {
    const label = hoverLabelForNodeId(target.dataset.nodeId);
    target.dataset.hoverLabel = label;
    target.removeAttribute("title");
  });
}

function selectInstance(instanceId, event) {
  if (event) {
    event.stopPropagation();
  }
  clearDemoSelection();
}

function restoreMockupSelection(event) {
  clearCanvasSelection();
}

function selectTemplate(templateId, options = {}) {
  const { inspectorTab = "components" } = options;
  selectedInspectorTab.value = inspectorTab;
  selectedWorkspaceMode.value = inspectorTab === "style" ? "style" : inspectorTab;
  setSelectedTemplate(templateId);
  clearDemoSelection();
}

function isTemplateTabActive(template) {
  return template.sourceIds ? template.sourceIds.includes(selectedTemplateId.value) : selectedTemplateId.value === template.id;
}

function pageDemoRank(template) {
  if (template.side === "publish") return 99;
  if (template.side === "distribution") return 0;
  if (template.side === "display") return 3;
  const text = `${template.tab || ""} ${template.name || ""} ${template.id || ""}`;
  if (/首页|home/i.test(text)) return 0;
  if (/资讯|公告|前瞻|forward|news/i.test(text)) return 1;
  if (/角色|档案|卡牌|archive|character|cards/i.test(text)) return 2;
  if (/影像|媒体|图库|media/i.test(text)) return 3;
  if (/发布|publish|发布器/i.test(text)) return 99;
  return 9;
}

function uniqueComponents(items) {
  return [...new Set(items.filter(Boolean))];
}

function pageCoverageComponents(template = selectedTemplate.value) {
  const text = `${template?.tab || ""} ${template?.name || ""} ${template?.id || ""}`;
  const base = template?.components || [];
  if (/首页|home/i.test(text)) {
    return uniqueComponents([
      ...base,
      "Search",
      "Tabs",
      "SegmentControl",
      "TabBar",
      "BottomBar",
      "Menu",
      "Grid",
      "List",
      "Card",
      "Button",
      "FAB",
    ]);
  }
  if (/资讯|公告|前瞻|forward|news/i.test(text)) {
    return uniqueComponents([
      ...base,
      "NoticeBar",
      "Badge",
      "Tag",
      "Empty",
      "Image",
      "Avatar",
      "Time",
      "PriceStatistic",
      "Swiper",
      "List",
      "Card",
      "Tabs",
      "Button",
    ]);
  }
  if (/角色|档案|卡牌|archive|character|cards/i.test(text)) {
    return uniqueComponents([
      ...base,
      "Image",
      "Avatar",
      "Badge",
      "Tag",
      "Rate",
      "Time",
      "PriceStatistic",
      "Tabs",
      "Card",
      "Popup",
    ]);
  }
  if (/影像|媒体|图库|media/i.test(text)) {
    return uniqueComponents([
      ...base,
      "Swiper",
      "Image",
      "Tabs",
      "Tag",
      "Badge",
      "Empty",
      "Skeleton",
      "Spin",
    ]);
  }
  if (/发布|publish|发布器/i.test(text)) {
    return uniqueComponents([
      ...base,
      "FormItem",
      "Input",
      "Textarea",
      "Radio",
      "Checkbox",
      "Switch",
      "Stepper",
      "Upload",
      "Tips",
      "Group",
      "DateTimePicker",
      "Rate",
      "Cascader",
      "Select",
      "Button",
      "Snackbar",
      "Toast",
      "Dialog",
      "Popup",
      "ShareSheet",
      "ResultPage",
    ]);
  }
  return uniqueComponents(base);
}

function selectTemplateTab(template) {
  selectTemplate(template.renderId || template.id, { inspectorTab: "pages" });
}

function templatePageTitle(template) {
  const title = `${template.name || ""} ${template.tab || ""} ${template.id || ""}`;
  if (/首页|home/i.test(title)) return "首页";
  if (template.sourceIds?.length) return template.tab || template.name;
  return template.name || template.tab;
}

function templateKindLabel(template) {
  if (template.kind) return template.kind;
  const sideKindMap = {
    distribution: "数据输出",
    display: "数据输出",
    publish: "数据输入",
    feedback: "反馈",
  };
  return sideKindMap[template.side] || "BAR";
}

function templateKindClass(template) {
  const kind = templateKindLabel(template);
  if (kind === "数据输出") return "output";
  if (kind === "数据输入") return "input";
  if (kind === "反馈") return "feedback";
  return "bar";
}

function templateDescription(template) {
  if (template.description) return template.description;
  if (template.sourceIds?.length) {
    const names = template.sourceIds
      .map((id) => currentTemplatePages.value.find((item) => item.id === id)?.tab)
      .filter(Boolean);
    return names.length ? names.join(" / ") : "当前参考站页面";
  }
  return "当前参考站页面";
}

function openRe1999HomePanel(panel) {
  re1999HomePanel.value = panel;
  const routes = {
    news: "re1999-news",
    archive: "re1999-archive",
    media: "re1999-media",
  };
  if (routes[panel]) selectTemplate(routes[panel], { inspectorTab: "pages" });
}

function openHpmaHomePanel(panel) {
  hpmaHomePanel.value = panel;
  const routes = {
    news: "hpma-news",
    cards: "hpma-cards",
    media: "hpma-media",
  };
  if (routes[panel]) selectTemplate(routes[panel], { inspectorTab: "pages" });
}

function openCznHomePanel(panel) {
  cznHomePanel.value = panel;
  const routes = {
    forward: "czn-forward",
    character: "czn-character",
    media: "czn-media",
  };
  if (routes[panel]) selectTemplate(routes[panel], { inspectorTab: "pages" });
}

function openPublishSide() {
  selectTemplate(publishTemplateId.value, { inspectorTab: "pages" });
}

function handleNavigationExampleShare() {
  console.log("[demo] share");
}

function selectStyle(styleId) {
  selectedStyleId.value = styleId;
  if (selectedInspectorTab.value === "style") {
    selectedWorkspaceMode.value = "style";
    selectedStyleCategoryId.value = "color";
  } else {
    selectedInspectorTab.value = "pages";
    selectedWorkspaceMode.value = "pages";
    selectedStyleCategoryId.value = "";
  }
  templateHistory.value = [];
  setSelectedTemplate(demoPagesByStyle[styleId]?.[0]?.id || "distribution", { record: false });
  clearDemoSelection();
}

function handleNavigationBarCapture(event) {
  if (!event.target?.closest?.(".du-navigation-bar__back")) return;
  event.preventDefault();
  event.stopPropagation();
  navigateBackInDemo();
}

function navigateBackInDemo() {
  const validIds = new Set(currentTemplatePages.value.map((template) => template.id));
  while (templateHistory.value.length) {
    const targetId = templateHistory.value.pop();
    if (targetId && targetId !== selectedTemplateId.value && validIds.has(targetId)) {
      setSelectedTemplate(targetId, { record: false });
      clearDemoSelection();
      return;
    }
  }
  const fallbackId = currentDemoPages.value[0]?.id || templatePages[0]?.id;
  if (fallbackId && fallbackId !== selectedTemplateId.value) {
    setSelectedTemplate(fallbackId, { record: false });
    clearDemoSelection();
  }
}

function showStyleMenu() {
  selectedInspectorTab.value = "style";
  selectedWorkspaceMode.value = "style";
  selectedStyleCategoryId.value = selectedStyleCategoryId.value || "color";
  clearDemoSelection();
}

function showPageMenu() {
  selectedInspectorTab.value = "pages";
  selectedWorkspaceMode.value = "pages";
  selectedStyleCategoryId.value = "";
  clearDemoSelection();
}

function showComponentMenu() {
  selectedInspectorTab.value = "components";
  selectedWorkspaceMode.value = "components";
  clearCanvasSelection();
  if (!selectedComponent.value) {
    selectedComponent.value = defaultComponentForCategory();
  }
  selectedComponentCategoryId.value = componentCategoryForName(selectedComponent.value);
}

function selectStyleCategory(categoryId) {
  selectedStyleCategoryId.value = categoryId;
  selectedWorkspaceMode.value = "style";
}

function selectToken(tokenName) {
  selectedTokenName.value = normalizeTokenName(tokenName);
  tokensExpanded.value = true;
}

function updateMockupScale() {
  const width = phoneRef.value?.getBoundingClientRect?.().width;
  if (!width) return;
  mockupScale.value = Math.min(1, Math.max(0.52, width / 395));
  syncMockupPopupBounds();
}

function syncMockupPopupBounds(componentName = "") {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const screen = phoneRef.value?.querySelector?.(".phone-screen") || phoneRef.value;
  const rect = screen?.getBoundingClientRect?.();
  if (!rect?.width || !rect?.height) return;
  const phoneStyle = window.getComputedStyle(phoneRef.value);
  const frameRadius = parseFloat(phoneStyle.getPropertyValue("--mockup-frame-radius-scaled")) || 42 * mockupScale.value;
  const frameBorder = parseFloat(phoneStyle.getPropertyValue("--mockup-frame-border-scaled")) || 10 * mockupScale.value;
  const homeIndicatorHeight = parseFloat(phoneStyle.getPropertyValue("--mockup-home-indicator-height")) || 34 * mockupScale.value;
  const screenRadius = Math.max(0, frameRadius - frameBorder);
  const root = document.documentElement;
  root.style.setProperty("--mockup-popup-left", `${rect.left}px`);
  root.style.setProperty("--mockup-popup-top", `${rect.top}px`);
  root.style.setProperty("--mockup-popup-right", `${Math.max(0, window.innerWidth - rect.right)}px`);
  root.style.setProperty("--mockup-popup-width", `${rect.width}px`);
  root.style.setProperty("--mockup-popup-height", `${rect.height}px`);
  root.style.setProperty("--mockup-popup-bottom", `${Math.max(0, window.innerHeight - rect.bottom)}px`);
  root.style.setProperty("--mockup-popup-radius", `${screenRadius}px`);
  root.style.setProperty("--mockup-popup-home-indicator", `${homeIndicatorHeight}px`);
  const popupSizeRatioMap = {
    Select: 0.3,
    DateTimePicker: 0.88,
    Cascader: 0.6,
    Popup: 0.88,
  };
  root.style.setProperty("--mockup-popup-size-ratio", `${popupSizeRatioMap[componentName] || 0.6}`);
  root.dataset.mockupPopup = "select";
  if (componentName) {
    root.dataset.mockupPopupComponent = componentName;
  }
}

onMounted(async () => {
  const response = await fetch("/data/dangoui.design-system.json");
  catalog.value = await response.json();
  await nextTick();
  updateMockupScale();
  if (typeof ResizeObserver !== "undefined" && phoneRef.value) {
    phoneResizeObserver = new ResizeObserver(updateMockupScale);
    phoneResizeObserver.observe(phoneRef.value);
  } else {
    window.addEventListener("resize", updateMockupScale);
  }
  syncMockupHoverLabels();
  syncMockupPopupBounds();
  document.addEventListener("mouseover", prepareMockupPopupHoverLabel);
  document.addEventListener("mouseout", clearMockupPopupHoverLabel);
});

onBeforeUnmount(() => {
  phoneResizeObserver?.disconnect?.();
  phoneResizeObserver = null;
  window.removeEventListener("resize", updateMockupScale);
  document.removeEventListener("mouseover", prepareMockupPopupHoverLabel);
  document.removeEventListener("mouseout", clearMockupPopupHoverLabel);
});

watch([selectedTemplateId, selectedInspectorTab, selectedStyleId], () => {
  nextTick(syncMockupHoverLabels);
});
</script>
