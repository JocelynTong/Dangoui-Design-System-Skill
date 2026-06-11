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
        </nav>

        <template v-if="selectedInspectorTab === 'style'">
          <div class="token-category-list rail-list" aria-label="token categories">
            <div
              v-for="category in styleCategories"
              :key="category.id"
              class="token-category"
              :class="{ active: selectedWorkspaceMode === 'style' && selectedStyleCategoryId === category.id }"
            >
              <button class="node-button token-category-button" type="button" @click="selectStyleCategory(category.id)">
                <strong>{{ category.label }} <em>{{ category.zh }}</em><span>{{ category.meta }}</span></strong>
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <nav class="side-tabs workflow-tabs component-page-tabs" aria-label="component pages">
            <button
              v-for="template in templatePages"
              :key="template.id"
              type="button"
              :class="{ active: selectedTemplateId === template.id }"
              @click="selectTemplate(template.id)"
            >
              {{ template.tab }}
            </button>
          </nav>

          <div class="component-list rail-list">
            <div
              v-for="instance in pageInstances"
              :key="instance.id"
              class="component"
              :class="{ active: selectedInstanceId === instance.id, missing: isMissing(instance.name) }"
              :data-instance-id="instance.id"
            >
              <button
                class="node-button"
                type="button"
                @click="selectInstance(instance.id)"
              >
                <strong>
                  {{ instance.label }} <em>{{ componentChineseName(instance.name) }}</em>
                  <span>{{ componentMeta(instance.name)?.className || missingMeta(instance.name)?.status || "unknown" }}</span>
                </strong>
              </button>
              <div v-if="selectedInstanceId === instance.id" class="node-detail">
                <p>
                  {{ humanDescription }}
                  <a class="inline-doc-link" :href="componentDocsUrl(selectedComponent)" target="_blank" rel="noreferrer">docs</a>
                </p>
                <div class="editable-list">
                  <span v-for="field in editableFields" :key="field" class="mini-token">可改：{{ field }}</span>
                </div>

                <details class="node-token-section">
                  <summary>展开 tokens</summary>
                  <p class="token-doc-row">
                    <a class="inline-doc-link" :href="tokenDocsUrl" target="_blank" rel="noreferrer">token docs</a>
                  </p>
                  <div v-if="selectedTokens.length" class="token-grid rail-tokens">
                    <button
                      v-for="token in visibleTokens"
                      :key="token.name"
                      class="token"
                      :class="{ active: selectedTokenName === token.name }"
                      type="button"
                      @click="selectToken(token.name)"
                    >
                      <i class="swatch" :style="{ background: token.value }"></i>
                      <span><strong>{{ token.name }}</strong><span>{{ token.usage }}</span></span>
                      <span>{{ token.value }}</span>
                    </button>
                    <button v-if="selectedTokens.length > tokenPreviewLimit" class="collapse-button" type="button" @click="tokensExpanded = !tokensExpanded">
                      {{ tokensExpanded ? "收起 tokens" : `展开全部 ${selectedTokens.length} 个 tokens` }}
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <section class="workspace">
      <div class="demo-stage">
        <article class="component-showcase" aria-label="dangoui component showcase">
          <section class="template-preview">
            <aside class="workspace-context" aria-label="Brand learning evidence">
              <div class="context-card brand-summary-card">
                <div class="context-section">
                  <strong>{{ selectedStyle.label }}</strong>
                  <p>{{ selectedStyle.notice }}</p>
                </div>

                <div v-if="currentDemoPages.length" class="context-section">
                  <nav class="workspace-demo-tabs" aria-label="brand demo rooms">
                    <button
                      v-for="template in currentDemoPages"
                      :key="template.id"
                      type="button"
                      :class="{ active: selectedTemplateId === template.id }"
                      @click="selectTemplate(template.id)"
                    >
                      <span>{{ template.tab }}</span>
                      <small>{{ template.name }}</small>
                    </button>
                  </nav>
                </div>
              </div>
            </aside>

            <div class="phone template-phone">
              <div class="phone-screen">
                <div
                  class="click-target"
                  :class="{ selected: selectedInstanceId === pageNodeId('NavigationBar') }"
                  :data-node-id="pageNodeId('NavigationBar')"
                  tabindex="0"
                  @click="selectInstance(pageNodeId('NavigationBar'))"
                  @keydown.enter.prevent="selectInstance(pageNodeId('NavigationBar'))"
                >
                  <span class="tag">NavigationBar</span>
                  <DuNavigationBar color="white" :back="false" :share="true">
                    <strong class="nav-title">{{ selectedWorkspaceMode === 'style' ? '风格' : selectedTemplate.name }}</strong>
                  </DuNavigationBar>
                </div>
                <div class="feed template-feed" :class="{ 'style-phone-feed': selectedWorkspaceMode === 'style' }">
                  <template v-if="selectedWorkspaceMode === 'style'">
                    <section class="style-mockup-page" aria-label="style preview page">
                      <h2>{{ selectedStyleCategory?.label }} <span>{{ selectedStyleCategory?.zh }}</span></h2>
                      <p>{{ currentStyleCategoryDescription }}</p>
                    </section>

                    <section class="style-evidence-mockup-card" aria-label="style evidence">
                      <div class="style-preview-heading">
                        <span>映射与频次</span>
                      </div>
                      <div v-if="selectedStyleCategoryId === 'color'" class="palette-stack">
                        <section class="palette-list" aria-label="complete color inventory ranked by frequency">
                          <div class="style-preview-heading compact-heading">
                            <span>{{ selectedStyle.id === 'dango' ? 'DangoUI token 色彩结构' : '完整色板 · 按频次排序' }}</span>
                          </div>
                          <p v-if="selectedStyle.id !== 'dango'" class="style-evidence-note">所有颜色统一进入一张表；无证据但存在于 token / 候选映射里的颜色显示为 0 次。</p>
                          <div v-if="selectedStyle.id === 'dango'" class="color-hierarchy-panel" aria-label="DangoUI color token hierarchy">
                            <strong>DangoUI 三级映射结构</strong>
                            <small>Baseline 直接展示 token 结构，不做频次统计；`--du-c-*` 属于废弃层，不作为一级色板。</small>
                            <div class="color-hierarchy-grid">
                              <div
                                v-for="group in dangoColorStructureRows"
                                :key="group.title"
                                class="color-hierarchy-group"
                              >
                                <span>{{ group.title }}</span>
                                <p>{{ group.description }}</p>
                                <div class="color-chain-list">
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
                          <div
                            v-else
                            v-for="color in selectedColorInventoryRows"
                            :key="`${selectedStyle.id}-color-inventory-${color.raw}-${color.target}`"
                            class="palette-row"
                            :class="{ primary: color.target.includes('primary'), empty: color.count === 0 }"
                          >
                            <i class="palette-swatch" :style="{ background: color.swatch }"></i>
                            <div class="palette-meta">
                              <div>
                                <strong>{{ color.raw }}</strong>
                                <span>{{ color.count }} 次 · {{ color.percent }}</span>
                              </div>
                              <em>{{ color.target }}</em>
                              <p>{{ color.value }}</p>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div v-else-if="selectedStyleCategoryId === 'typography' && selectedStyleRecipeRows.length" class="mockup-type-specimens type-evidence-specimens">
                        <div
                          v-for="item in selectedStyleRecipeRows"
                          :key="`page-type-evidence-${item.title}`"
                          :style="recipeSwatchStyle(item)"
                        >
                          <span>{{ item.title }} · {{ item.stat }}</span>
                          <strong>Design system rhythm</strong>
                          <em>{{ item.target }}</em>
                          <small>{{ item.value }}</small>
                          <p>{{ item.note }}</p>
                        </div>
                      </div>
                      <div v-else-if="selectedStyleCategoryId === 'spacing' && spacingScaleRows.length" class="evidence-scale-panel spacing-evidence-list" aria-label="spacing evidence">
                        <p class="style-evidence-note">色块宽度 = spacing value；下方保留次数、映射和值。</p>
                        <div class="spacing-scale-track evidence-scale-list">
                          <div
                            v-for="item in spacingScaleRows"
                            :key="`page-spacing-evidence-${item.title}`"
                            class="spacing-scale-item evidence-scale-item"
                            :style="{ '--scale-width': `${item.width}px` }"
                          >
                            <i></i>
                            <span>{{ item.title }} · {{ item.label }}</span>
                            <em>{{ item.stat }}</em>
                            <small>{{ item.target }}</small>
                            <b>{{ item.value }}</b>
                            <p>{{ item.note }}</p>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="selectedStyleCategoryId === 'radius' && radiusScaleRows.length" class="recipe-scale-panel mockup-scale-panel evidence-scale-panel radius-scale" aria-label="radius evidence">
                        <strong>Border radius scale</strong>
                        <small>形状圆角 = radius value；下方保留次数、映射和值。</small>
                        <div class="radius-scale-track evidence-scale-list">
                          <div
                            v-for="item in radiusScaleRows"
                            :key="`page-radius-evidence-${item.title}`"
                            class="radius-scale-card evidence-scale-item"
                            :style="{ '--recipe-radius': item.radius }"
                          >
                            <i></i>
                            <span>{{ item.label }}</span>
                            <em>{{ item.stat }}</em>
                            <small>{{ item.target }}</small>
                            <b>{{ item.value }}</b>
                            <p>{{ item.note }}</p>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="selectedStyleCategoryId === 'divider' && dividerScaleRows.length" class="recipe-scale-panel mockup-scale-panel evidence-scale-panel divider-scale" aria-label="divider and frame evidence">
                        <strong>Divider / Frame recipe</strong>
                        <small>拆分普通分割线、框体边界和选中线；特殊框必须落到 frame recipe。</small>
                        <div class="divider-override-note" aria-label="style override rule">
                          <span>普通样式</span>
                          <b>--du-border-1 / Divider color</b>
                          <em>被风格化覆盖</em>
                          <strong>frame/divider recipe：作用域、线宽、角线或 asset fallback、排除区</strong>
                        </div>
                        <div class="divider-scale-list evidence-scale-list">
                          <div
                            v-for="item in dividerScaleRows"
                            :key="`page-divider-evidence-${item.title}`"
                            class="divider-scale-card evidence-scale-item"
                            :class="`divider-scale-card-${item.kind}`"
                            :style="recipeSwatchStyle(item)"
                          >
                            <i></i>
                            <span>{{ item.title }}</span>
                            <em>{{ item.stat }}</em>
                            <small>{{ item.target }}</small>
                            <b>{{ item.value }}</b>
                            <p>{{ item.note }}</p>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="selectedStyleRecipeRows.length" class="palette-list">
                        <div
                          v-for="item in selectedStyleRecipeRows"
                          :key="`page-evidence-${item.title}`"
                          class="palette-row"
                        >
                          <i
                            class="palette-swatch recipe-swatch"
                            :class="recipeSwatchClass"
                            :style="recipeSwatchStyle(item)"
                          >
                            <span>{{ recipeSwatchText(item) }}</span>
                          </i>
                          <div class="palette-meta">
                            <div>
                              <strong>{{ item.title }}</strong>
                              <span>{{ item.stat }}</span>
                            </div>
                            <em>{{ item.target }}</em>
                            <span class="recipe-value">{{ item.value }}</span>
                            <p>{{ item.note }}</p>
                          </div>
                        </div>
                      </div>
                      <div v-else class="recipe-placeholder">
                        <span>{{ selectedStyleCategory?.status }}</span>
                        <strong>{{ selectedStyleCategory?.nextStep }}</strong>
                        <p>{{ selectedStyleCategory?.scope }}</p>
                      </div>
                    </section>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-home'">
                    <div class="click-target hpma-hero" :class="{ selected: selectedInstanceId === pageNodeId('Hero') }" :data-node-id="pageNodeId('Hero')" @click="selectInstance(pageNodeId('Hero'))">
                      <span class="tag">Hero</span>
                      <p>HOGWARTS LETTER</p>
                      <strong>录取通知书已寄出</strong>
                      <span>棕金主视觉、羊皮纸正文和魔法徽章承担官网首页的入学氛围。</span>
                    </div>
                    <div class="click-target hpma-download-panel" :class="{ selected: selectedInstanceId === pageNodeId('DownloadPanel') }" :data-node-id="pageNodeId('DownloadPanel')" @click="selectInstance(pageNodeId('DownloadPanel'))">
                      <span class="tag">DownloadPanel</span>
                      <strong>开学季预约开启</strong>
                      <div class="hpma-platform-row">
                        <span>App Store</span>
                        <span>Android</span>
                        <span>PC</span>
                      </div>
                      <DuButton text="进入霍格沃茨" type="primary" />
                    </div>
                    <div class="click-target hpma-qr-panel" :class="{ selected: selectedInstanceId === pageNodeId('QRCode') }" :data-node-id="pageNodeId('QRCode')" @click="selectInstance(pageNodeId('QRCode'))">
                      <span class="tag">QRCode</span>
                      <i></i>
                      <div>
                        <strong>扫码领取入学清单</strong>
                        <p>二维码独立成块，保留官网下载入口的高识别度。</p>
                      </div>
                    </div>
                    <div class="click-target hpma-letter-actions" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="立即预约" type="primary" />
                        <DuButton text="查看学院" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-news'">
                    <div class="click-target hpma-news-feature" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'))">
                      <span class="tag">Swiper</span>
                      <div class="hpma-news-poster" aria-hidden="true">
                        <span>SEASON</span>
                        <strong>魔法觉醒赛季更新</strong>
                      </div>
                      <p>轮播位保留暗场大图、金线框和活动标题，适合接真实运营 banner。</p>
                    </div>
                    <div class="click-target hpma-news-tabs" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'))">
                      <span class="tag">Tabs</span>
                      <DuTabs value="event" type="tag" size="normal">
                        <DuTab name="event">活动</DuTab>
                        <DuTab name="news">新闻</DuTab>
                        <DuTab name="notice">公告</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target hpma-news-list" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <article>
                        <time>06.12</time>
                        <div>
                          <strong>禁林调查限时开启</strong>
                          <p>羊皮纸列表用于承接资讯摘要、日期和跳转入口。</p>
                        </div>
                      </article>
                      <article>
                        <time>06.08</time>
                        <div>
                          <strong>伙伴卡平衡性调整</strong>
                          <p>细金线分隔比普通卡片边框更贴近官网资讯区。</p>
                        </div>
                      </article>
                    </div>
                    <div class="click-target hpma-news-actions" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'))">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>限时活动</DuTag>
                        <DuTag color="default" round>赛季情报</DuTag>
                      </div>
                      <DuButton text="查看更多资讯" type="outline" />
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'hpma-cards'">
                    <div class="click-target hpma-search-panel" :class="{ selected: selectedInstanceId === pageNodeId('Search') }" :data-node-id="pageNodeId('Search')" @click="selectInstance(pageNodeId('Search'))">
                      <span class="tag">Search</span>
                      <DuSearch readonly :placeholder="['搜索魔咒、伙伴、回响']" />
                    </div>
                    <div class="click-target hpma-card-media" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'))">
                      <span class="tag">Image</span>
                      <div class="hpma-spell-orbit" aria-hidden="true">
                        <i></i><i></i><i></i>
                      </div>
                      <strong>魔咒图鉴</strong>
                      <p>图鉴页用卡面、轨迹光效和稀有度标签区别于首页/资讯页。</p>
                    </div>
                    <div class="click-target hpma-spell-grid" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
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
                    <div class="click-target hpma-rarity-row" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'))">
                      <span class="tag">Badge</span>
                      <DuBadge value="LEGEND" color="primary" always-show>
                        <span class="badge-anchor">稀有度</span>
                      </DuBadge>
                      <DuTabs value="spell" type="tag" size="normal" :data-node-id="pageNodeId('Tabs')" @click.stop="selectInstance(pageNodeId('Tabs'))">
                        <DuTab name="spell">魔咒</DuTab>
                        <DuTab name="partner">伙伴</DuTab>
                      </DuTabs>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-home'">
                    <div class="click-target czn-hero" :class="{ selected: selectedInstanceId === pageNodeId('Hero') }" :data-node-id="pageNodeId('Hero')" @click="selectInstance(pageNodeId('Hero'))">
                      <span class="tag">Hero</span>
                      <p>CHAOS ZERO NIGHTMARE</p>
                      <strong>卡厄思梦境现已正式上线</strong>
                      <span>角色群像、白色笔刷和亮橙行动入口承担官网首屏识别。</span>
                    </div>
                    <div class="click-target czn-download-panel" :class="{ selected: selectedInstanceId === pageNodeId('DownloadPanel') }" :data-node-id="pageNodeId('DownloadPanel')" @click="selectInstance(pageNodeId('DownloadPanel'))">
                      <span class="tag">DownloadPanel</span>
                      <strong>官网下载注册专属福利</strong>
                      <div class="button-row">
                        <DuButton text="PC 下载" type="primary" />
                        <DuButton text="Android" type="outline" />
                        <DuButton text="App Store" type="outline" />
                      </div>
                    </div>
                    <div class="click-target czn-qr" :class="{ selected: selectedInstanceId === pageNodeId('QRCode') }" :data-node-id="pageNodeId('QRCode')" @click="selectInstance(pageNodeId('QRCode'))">
                      <span class="tag">QRCode</span>
                      <i></i>
                      <div>
                        <strong>扫码下载</strong>
                        <p>移动端下载入口保留为独立模块，方便后续替换真实二维码。</p>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="进入官网" type="primary" />
                        <DuButton text="查看配置" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-forward'">
                    <div class="click-target czn-forward-card" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'))">
                      <span class="tag">Swiper</span>
                      <div class="czn-swiper-frame" aria-hidden="true">
                        <div class="czn-swiper-window">
                          <div class="czn-swiper-track">
                            <div class="czn-slide is-prev">
                              <img src="https://vasd-cms.qq.com/vasd-cms/final_ecac332305.jpg" alt="" />
                            </div>
                            <div class="czn-slide is-active">
                              <img src="https://vasd-cms.qq.com/vasd-cms/1920x1080_21_f5c8e03743.jpg" alt="" />
                            </div>
                            <div class="czn-slide is-next">
                              <img src="https://vasd-cms.qq.com/vasd-cms/_68c3b0fcab.jpg" alt="" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <strong>公测内容一览</strong>
                      <p>轮播位以白灰信息区、橙色描边和大图内容承载公测更新。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'))">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>全新角色</DuTag>
                        <DuTag color="primary" round>公测内容</DuTag>
                        <DuTag color="default" round>限时活动</DuTag>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <DuCard title="全新东方气质主战员「绯」" guide-text="" size="large">
                        <p class="card-copy">服务端内容卡保留 dangoui Card 结构，品牌视觉由 token value 与 demo 资产共同承接。</p>
                      </DuCard>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                      <span class="tag">Button</span>
                      <DuButton text="查看详情 MORE" type="primary" />
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'czn-character'">
                    <div class="click-target czn-character-panel" :class="{ selected: selectedInstanceId === pageNodeId('CharacterPanel') }" :data-node-id="pageNodeId('CharacterPanel')" @click="selectInstance(pageNodeId('CharacterPanel'))">
                      <span class="tag">CharacterPanel</span>
                      <p>RENOA</p>
                      <strong>蕾诺娅</strong>
                      <span>黑玫瑰诗人。不会凋零的黑玫瑰，即将绽放。</span>
                      <div class="button-row">
                        <DuButton text="+ 查看更多 MORE" type="primary" />
                      </div>
                    </div>
                    <div class="click-target display-summary czn-avatar-row" :class="{ selected: selectedInstanceId === pageNodeId('Avatar') }" :data-node-id="pageNodeId('Avatar')" @click="selectInstance(pageNodeId('Avatar'))">
                      <span class="tag">Avatar</span>
                      <DuAvatar type="primary" size="large" bordered>R</DuAvatar>
                      <div>
                        <strong>角色档案</strong>
                        <p>头像、角色名和状态适合后续接入真实角色数据。</p>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <DuCard title="CHARACTER VOICE" guide-text="" size="large">
                        <div class="tag-row">
                          <DuTag color="primary" round>技能卡</DuTag>
                          <DuTag color="default" round>支援</DuTag>
                        </div>
                      </DuCard>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'))">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>危险人物</DuTag>
                        <DuTag color="default" round>黑玫瑰</DuTag>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-home'">
                    <div class="click-target notion-hero" :class="{ selected: selectedInstanceId === pageNodeId('Hero') }" :data-node-id="pageNodeId('Hero')" @click="selectInstance(pageNodeId('Hero'))">
                      <span class="tag">Hero</span>
                      <p>Write, plan, organize</p>
                      <strong>Your team's calm operating system</strong>
                      <span>白纸感画布、近黑大字和单一蓝色行动入口，彩色贴纸只负责人格。</span>
                      <div class="button-row">
                        <DuButton text="Start building" type="primary" />
                        <DuButton text="Browse templates" type="outline" />
                      </div>
                    </div>
                    <div class="click-target notion-sticker-row" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'))">
                      <span class="tag">Tag</span>
                      <DuTag color="primary" round>docs</DuTag>
                      <DuTag color="default" round>wiki</DuTag>
                      <DuTag color="default" round>projects</DuTag>
                    </div>
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <DuCard title="Company home" guide-text="" size="large">
                        <p class="card-copy">用 dangoui Card 承接 Notion 的文档卡片模式；纸面、圆角和 hairline 是 demo 视觉控制。</p>
                      </DuCard>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="Get Notion free" type="primary" />
                        <DuButton text="Request demo" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-wiki'">
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Search') }" :data-node-id="pageNodeId('Search')" @click="selectInstance(pageNodeId('Search'))">
                      <span class="tag">Search</span>
                      <DuSearch readonly :placeholder="['搜索文档、项目、成员']" />
                    </div>
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <DuCard title="Team wiki" guide-text="" size="large">
                        <div class="notion-list">
                          <span>Getting started</span>
                          <span>Product roadmap</span>
                          <span>Design system notes</span>
                        </div>
                      </DuCard>
                    </div>
                    <div class="click-target notion-doc-card" :class="{ selected: selectedInstanceId === pageNodeId('NoticeBar') }" :data-node-id="pageNodeId('NoticeBar')" @click="selectInstance(pageNodeId('NoticeBar'))">
                      <span class="tag">NoticeBar</span>
                      <DuNoticeBar text="新成员已加入工作区，建议先阅读 onboarding 页面。" link-text="打开" />
                    </div>
                    <div class="click-target notion-sticker-panel" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'))">
                      <span class="tag">Image</span>
                      <i></i><i></i><i></i><i></i>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'notion-pricing'">
                    <div class="click-target notion-plan-card" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <strong>Plus</strong>
                      <p>For small teams and professionals.</p>
                      <b>$10 <small>/ seat</small></b>
                      <DuButton text="Get started" type="primary" />
                    </div>
                    <div class="click-target notion-plan-card featured" :class="{ selected: selectedInstanceId === pageNodeId('Badge') }" :data-node-id="pageNodeId('Badge')" @click="selectInstance(pageNodeId('Badge'))">
                      <span class="tag">Badge</span>
                      <strong>Business</strong>
                      <p>Advanced permissions, SSO and shared teamspaces.</p>
                      <b>$20 <small>/ seat</small></b>
                      <DuTag color="primary" round>Recommended</DuTag>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                      <span class="tag">Button</span>
                      <div class="button-row">
                        <DuButton text="Contact sales" type="primary" />
                        <DuButton text="Compare plans" type="outline" />
                      </div>
                    </div>
                  </template>

                  <template v-else-if="selectedTemplateId === 'distribution'">
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Search') }" :data-node-id="pageNodeId('Search')" @click="selectInstance(pageNodeId('Search'))">
                      <span class="tag">Search</span>
                      <DuSearch readonly :placeholder="['搜索活动、商品、内容']" />
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('NoticeBar') }" :data-node-id="pageNodeId('NoticeBar')" @click="selectInstance(pageNodeId('NoticeBar'))">
                      <span class="tag">NoticeBar</span>
                      <DuNoticeBar text="运营位：本周重点活动上线" link-text="查看" />
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tabs') }" :data-node-id="pageNodeId('Tabs')" @click="selectInstance(pageNodeId('Tabs'))">
                      <span class="tag">Tabs</span>
                      <DuTabs value="hot" type="tag" size="normal">
                        <DuTab name="hot">推荐</DuTab>
                        <DuTab name="new">最新</DuTab>
                        <DuTab name="ops">运营</DuTab>
                      </DuTabs>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Card') }" :data-node-id="pageNodeId('Card')" @click="selectInstance(pageNodeId('Card'))">
                      <span class="tag">Card</span>
                      <DuCard title="活动 Feed 卡片" guide-text="" size="large">
                        <div class="media" aria-hidden="true"></div>
                        <div class="card-meta">
                          <DuTag type="success" size="small">主推</DuTag>
                          <span class="meta">服务端推荐</span>
                        </div>
                        <p class="card-copy">分发侧样板间把搜索、分组、公告和内容卡片放在同一条用户路径里。</p>
                      </DuCard>
                    </div>
                  </template>
                  
                  <template v-else-if="selectedTemplateId === 'display'">
                    <div class="click-target display-summary" :class="{ selected: selectedInstanceId === pageNodeId('Avatar') }" :data-node-id="pageNodeId('Avatar')" @click="selectInstance(pageNodeId('Avatar'))">
                      <span class="tag">Avatar</span>
                      <DuAvatar type="primary" size="large" bordered>DU</DuAvatar>
                      <div>
                        <strong>服务器返回的用户信息</strong>
                        <p>昵称、状态、数量和图片资源都属于展示侧。</p>
                      </div>
                      <DuBadge value="12" color="primary" always-show>
                        <span class="badge-anchor">更新</span>
                      </DuBadge>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Tag') }" :data-node-id="pageNodeId('Tag')" @click="selectInstance(pageNodeId('Tag'))">
                      <span class="tag">Tag</span>
                      <div class="tag-row">
                        <DuTag color="primary" round>活跃</DuTag>
                        <DuTag color="primary" round>已同步</DuTag>
                        <DuTag color="default" round>服务端状态</DuTag>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Image') }" :data-node-id="pageNodeId('Image')" @click="selectInstance(pageNodeId('Image'))">
                      <span class="tag">Image</span>
                      <DuImage :src="imagePreviewSrc" width="100%" height="160px" mode="aspectFill" radius="16" />
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Swiper') }" :data-node-id="pageNodeId('Swiper')" @click="selectInstance(pageNodeId('Swiper'))">
                      <span class="tag">Swiper</span>
                      <strong>横滑图片 / Banner</strong>
                      <p>展示侧常见多图输出，当前 demo 用占位表达轮播结构。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Steps') }" :data-node-id="pageNodeId('Steps')" @click="selectInstance(pageNodeId('Steps'))">
                      <span class="tag">Steps</span>
                      <DuSteps :active-index="1" status="process" color="primary" :steps="[{ title: '提交' }, { title: '审核' }, { title: '完成' }]" />
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Rate') }" :data-node-id="pageNodeId('Rate')" @click="selectInstance(pageNodeId('Rate'))">
                      <span class="tag">Rate</span>
                      <DuRate :default-value="4" size="medium" color="primary" />
                    </div>
                  </template>
                  <template v-else-if="selectedTemplateId === 'publish'">
                    <div class="form-demo">
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Group') }" :data-node-id="pageNodeId('Group')" @click="selectInstance(pageNodeId('Group'))">
                        <span class="tag">Group</span>
                        <strong>基础信息</strong>
                        <p>把标题、说明、时间、上传等字段组织成同一发布分组。</p>
                      </div>
                      <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Input') }" :data-node-id="pageNodeId('Input')" @click="selectInstance(pageNodeId('Input'))">
                        <span class="tag">Input</span>
                        <DuInput value="周末市集" prefix="标题" bordered allow-clear />
                      </div>
                      <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Textarea') }" :data-node-id="pageNodeId('Textarea')" @click="selectInstance(pageNodeId('Textarea'))">
                        <span class="tag">Textarea</span>
                        <DuTextarea value="用户输入内容后，发布侧负责校验并提交到服务器。" bordered show-count :maxlength="80" />
                      </div>
                      <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Select') }" :data-node-id="pageNodeId('Select')" @click="selectInstance(pageNodeId('Select'))">
                        <span class="tag">Select</span>
                        <DuSelect title="发布类型" :options="selectOptions" value="figma" />
                      </div>
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('DateTimePicker') }" :data-node-id="pageNodeId('DateTimePicker')" @click="selectInstance(pageNodeId('DateTimePicker'))">
                        <span class="tag">DateTimePicker</span>
                        <strong>2026-06-08 20:00</strong>
                        <p>发布时间、预约时间、截止时间这类服务端字段。</p>
                      </div>
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Upload') }" :data-node-id="pageNodeId('Upload')" @click="selectInstance(pageNodeId('Upload'))">
                        <span class="tag">Upload</span>
                        <strong>上传封面图</strong>
                        <p>图片或附件提交到服务器，依赖文件选择和上传回调。</p>
                      </div>
                      <div class="click-target control-grid" :class="{ selected: selectedInstanceId === pageNodeId('Checkbox') }" :data-node-id="pageNodeId('Checkbox')" @click="selectInstance(pageNodeId('Checkbox'))">
                        <span class="tag">Checkbox</span>
                        <DuCheckbox checked label="同步到首页" />
                        <DuCheckbox label="需要审核" />
                      </div>
                      <div class="click-target setting-row compact" :class="{ selected: selectedInstanceId === pageNodeId('Switch') }" :data-node-id="pageNodeId('Switch')" @click="selectInstance(pageNodeId('Switch'))">
                        <span class="tag">Switch</span>
                        <span>立即发布</span>
                        <DuSwitch :on="true" />
                      </div>
                      <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Button') }" :data-node-id="pageNodeId('Button')" @click="selectInstance(pageNodeId('Button'))">
                        <span class="tag">Button</span>
                        <div class="button-row">
                          <DuButton text="提交发布" type="primary" />
                          <DuButton text="保存草稿" type="outline" />
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="feedback-stack">
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Dialog') }" :data-node-id="pageNodeId('Dialog')" @click="selectInstance(pageNodeId('Dialog'))">
                        <span class="tag">Dialog</span>
                        <strong>模态重反馈：需要用户决策</strong>
                        <p>确认、删除、付款等高风险动作再使用。</p>
                      </div>
                      <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Popup') }" :data-node-id="pageNodeId('Popup')" @click="selectInstance(pageNodeId('Popup'))">
                        <span class="tag">Popup</span>
                        <strong>模态中反馈：承载临时内容</strong>
                        <p>适合筛选、说明、二次操作等底部或居中浮层。</p>
                      </div>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Empty') }" :data-node-id="pageNodeId('Empty')" @click="selectInstance(pageNodeId('Empty'))">
                      <span class="tag">Empty</span>
                      <DuEmpty text="非模态中反馈：占据局部页面，给出下一步动作。" button-text="去创建" />
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('Skeleton') }" :data-node-id="pageNodeId('Skeleton')" @click="selectInstance(pageNodeId('Skeleton'))">
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
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Spin') }" :data-node-id="pageNodeId('Spin')" @click="selectInstance(pageNodeId('Spin'))">
                      <span class="tag">Spin</span>
                      <strong>非模态轻反馈：加载中</strong>
                      <p>局部异步等待，打扰程度低于空状态和弹层。</p>
                    </div>
                    <div class="click-target" :class="{ selected: selectedInstanceId === pageNodeId('NoticeBar') }" :data-node-id="pageNodeId('NoticeBar')" @click="selectInstance(pageNodeId('NoticeBar'))">
                      <span class="tag">NoticeBar</span>
                      <DuNoticeBar text="非模态轻反馈：页面内提示，不打断用户操作。" link-text="知道了" />
                    </div>
                    <div class="click-target placeholder-card" :class="{ selected: selectedInstanceId === pageNodeId('Snackbar') }" :data-node-id="pageNodeId('Snackbar')" @click="selectInstance(pageNodeId('Snackbar'))">
                      <span class="tag">Snackbar</span>
                      <strong>非模态轻反馈：短提示</strong>
                      <p>需要由动作触发，默认不常驻。</p>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import {
  DuAvatar,
  DuAvatarGroup,
  DuBadge,
  DuButton,
  DuCard,
  DuCheckbox,
  DuDivider,
  DuEmpty,
  DuImage,
  DuInput,
  DuInputNumber,
  DuNavigationBar,
  DuNoticeBar,
  DuRadio,
  DuRate,
  DuSearch,
  DuSelect,
  DuSkeleton,
  DuSkeletonAvatar,
  DuSkeletonParagraph,
  DuSkeletonRectangle,
  DuSteps,
  DuSwitch,
  DuTab,
  DuTabs,
  DuTag,
  DuTextarea,
} from "dangoui";

const docsBaseUrl = "https://dumpling.echo.tech";
const introductionUrl = `${docsBaseUrl}/get-started/introduction`;
const tokenDocsUrl = `${docsBaseUrl}/guide/theme`;
const tokenPreviewLimit = 5;
const selectedStyleId = ref("dango");
const starterTemplates = [
  {
    side: "分发侧",
    name: "内容分发模板",
    goal: "把服务端内容按推荐、搜索、分类和运营位送到用户面前，适合首页、活动列表、商品流和内容 feed。",
    parts: "NavigationBar / Search / Tabs / NoticeBar / Card / Tag",
  },
  {
    side: "展示侧",
    name: "数据展示模板",
    goal: "承接服务器数据输出，把用户、状态、图片、指标、进度和空结果展示清楚。",
    parts: "NavigationBar / Card / Image / Avatar / Badge / Rate / Steps / Empty",
  },
  {
    side: "发布侧",
    name: "数据发布模板",
    goal: "承接用户输入并提交到服务器，适合报名、资料编辑、配置发布和内容创建。",
    parts: "Input / Select / Checkbox / Radio / Switch",
  },
  {
    side: "通用反馈",
    name: "轻量到重量反馈模板",
    goal: "按打扰程度组织反馈：轻量提示常驻，中量状态占位，重量弹层需要用户决策。",
    parts: "NoticeBar / Skeleton / Empty / Snackbar / Dialog / Popup",
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
    evidenceNote: "这是 baseline，不来自外部品牌采样；用于对照 Button、Card、Divider、Tabs 等组件在未风格化时的默认语义和可编辑面。",
    sectionTitle: "Default Components",
    tabs: ["组件", "Token", "状态"],
    cards: [
      { title: "原始组件语义", copy: "先识别 dangoui 组件本身：Card 承载内容、Divider 组织层级、Button 表达行动，不急着加入品牌纹理。" },
      { title: "未覆盖状态", copy: "圆角、弱文字、hairline 和主色都保持初始化 token，作为对比迁移后变化的参照物。" },
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
      { raw: "#0000001f", count: 1, percent: "baseline", target: "--du-border-1", value: "默认 hairline / Divider / Card boundary" },
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
    evidenceNote: "依据截图校准：导航激活、官网按钮、下载按钮和轮播描边高频使用亮橙；角色页大面积黑紫/深红，公测内容页使用白灰底和细线框。",
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
      { name: "--du-primary-color", value: "#ff5a1f" },
      { name: "--du-primary-border", value: "#ff5a1f" },
      { name: "--du-primary-outline-color", value: "#ff5a1f" },
      { name: "--du-primary-soft-bg", value: "#32180f" },
      { name: "--du-primary-solid-bg", value: "#ff5a1f" },
    ],
    style: {
      cardRadius: "10px",
      controlRadius: "6px",
      pageSpacing: "16px",
      cardShadow: "0 20px 50px rgba(0,0,0,.45), 0 0 28px rgba(32,216,255,.16)",
      media: "linear-gradient(135deg, transparent 0 18%, rgba(255,90,31,.92) 18% 20%, transparent 20% 58%, rgba(255,255,255,.28) 58% 59%, transparent 59%), radial-gradient(circle at 24% 18%, rgba(255,90,31,.95), transparent 25%), radial-gradient(circle at 76% 68%, rgba(151,71,255,.78), transparent 30%), repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 14px), linear-gradient(135deg,#12070b,#251038 48%,#5a0f1d)",
    },
    signals: [
      { raw: "#ff5a1f", count: 6, percent: "约 30%", target: "--du-primary-color", value: "首页导航、官网按钮、下载 CTA、轮播描边" },
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
      controlRadius: "5px",
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
      { raw: "#e6e6e6", count: 2, percent: "6.1%", target: "--du-border-1", value: "hairline、table row、drawer divider" },
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
  Group: ["标题", "分组说明", "字段列表", "间距"],
  Popup: ["打开状态", "位置", "遮罩", "关闭方式"],
  Swiper: ["图片列表", "当前项", "自动播放", "指示器"],
  Upload: ["文件类型", "数量限制", "上传状态", "回调"],
  Hero: ["主视觉", "标题", "行动按钮", "背景图"],
  DownloadPanel: ["下载入口", "平台", "二维码", "福利信息"],
  QRCode: ["二维码", "说明文案", "下载动作"],
  CharacterPanel: ["角色名", "角色立绘", "语音", "档案卡片"],
  TabBar: ["选中项", "图标", "文字", "激活色", "底部分隔线"],
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
  DateTimePicker: "日期时间选择器，用来输入预约、发布、截止等时间字段。",
  Group: "表单分组，用来把一组相关输入项组织在同一语义区域。",
  Popup: "弹层组件，用来承载需要临时浮出的内容或操作。",
  Upload: "上传组件，用来把图片、文件或素材提交到服务器。",
  Hero: "游戏官网首屏主视觉，承载角色群像、核心标题和主要行动入口。",
  DownloadPanel: "下载入口面板，聚合 PC、移动端、二维码和平台下载动作。",
  QRCode: "扫码下载模块，用来承接移动端下载或预约转换。",
  CharacterPanel: "角色详情面板，展示角色名、语音、立绘、技能卡片和查看更多动作。",
  TabBar: "页面底部一级导航。当前 dangoui 没有内置 TabBar，需要后续补 schema。",
};
const componentChineseNames = {
  Avatar: "头像",
  Badge: "徽标",
  Button: "按钮",
  Card: "内容卡片",
  Checkbox: "复选框",
  Dialog: "弹窗",
  Empty: "空状态",
  Image: "图片",
  Input: "输入框",
  NavigationBar: "顶部导航",
  NoticeBar: "公告条",
  Rate: "评分",
  Search: "搜索",
  Select: "选择器",
  Skeleton: "骨架屏",
  Spin: "加载",
  Snackbar: "轻提示",
  Steps: "步骤条",
  Switch: "开关",
  Swiper: "轮播",
  Tabs: "标签切换",
  Tag: "标签",
  Textarea: "多行输入",
  DateTimePicker: "日期时间",
  Group: "分组",
  Popup: "弹层",
  Upload: "上传",
  Hero: "首屏主视觉",
  DownloadPanel: "下载面板",
  QRCode: "二维码",
  CharacterPanel: "角色详情",
};

const catalog = ref({ source: {}, tokens: [], components: [], missingComponents: [] });
const selectedInstanceId = ref("node-czn-home-navigation-bar");
const selectedComponent = ref("NavigationBar");
const selectedTokenName = ref("");
const tokensExpanded = ref(false);
const selectedTemplateId = ref("czn-home");
const selectedInspectorTab = ref("style");
const selectedWorkspaceMode = ref("components");
const selectedStyleCategoryId = ref("");

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
    meta: "recipe",
    description: "提取字体族、字号层级、字重、行高和标题/正文/辅助文字的使用节奏。",
    status: "待提取",
    nextStep: "先补 display / title / body / caption 四级文字样式。",
    scope: "保留 dangoui 组件结构，优先映射到文本 token；品牌字体气质只作为风格配方说明。",
  },
  {
    id: "icon",
    label: "Icon",
    zh: "图标",
    meta: "recipe",
    description: "记录图标线宽、填充方式、圆角、尺寸和图标在按钮/导航/状态中的角色。",
    status: "待提取",
    nextStep: "先判断参考站偏线性、填充、品牌符号还是系统图标。",
    scope: "不新造 icon name；缺失图标只记录为 demo-only 或 ask-user。",
  },
  {
    id: "divider",
    label: "Divider",
    zh: "分割线",
    meta: "token",
    description: "提取 hairline、卡片边界、列表分割、模块分区的颜色、透明度和粗细。",
    status: "待提取",
    nextStep: "先补 border / divider / hairline 三类证据。",
    scope: "优先映射到 dangoui border token；特殊装饰线保留为 style-only。",
  },
  {
    id: "layout",
    label: "Layout",
    zh: "布局",
    meta: "recipe",
    description: "记录页面宽度、单双列关系、内容密度、首屏比例和信息分组方式。",
    status: "待提取",
    nextStep: "先补页面节奏：顶部、主体、卡片流、底部模块的结构规则。",
    scope: "布局是风格配方，不伪装成 dangoui token；落地时由模板和组件组合承接。",
  },
  {
    id: "spacing",
    label: "Spacing",
    zh: "间距",
    meta: "token",
    description: "提取模块外边距、卡片内边距、控件间距、列表行距和栅格间距。",
    status: "待提取",
    nextStep: "优先统计 4 / 8 / 12 / 16 / 20 / 24 等高频 spacing。",
    scope: "可匹配 primitives 则 mapped；只能近似表达则 fallback。",
  },
  {
    id: "radius",
    label: "Radius",
    zh: "圆角",
    meta: "token",
    description: "提取卡片、按钮、图片、输入框、标签和容器的圆角比例。",
    status: "待提取",
    nextStep: "先补 card / control / media / tag 四类圆角。",
    scope: "准确匹配 2 / 4 / 8 / 12 / 16 等 primitives；超大 pill 记录为控制形态。",
  },
  {
    id: "shadow",
    label: "Shadow",
    zh: "阴影",
    meta: "token",
    description: "提取卡片层级、悬浮、媒体容器、弹层和暗色发光效果。",
    status: "待提取",
    nextStep: "先区分真实 elevation、边框替代和品牌氛围光。",
    scope: "dangoui 缺少精确 shadow 时标记 style-only，不新造正式 --du-*。",
  },
  {
    id: "motion",
    label: "Motion",
    zh: "动效",
    meta: "recipe",
    description: "记录 hover、press、展开、切换、滚动和反馈的速度、缓动和打扰程度。",
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
      { title: "Hairline", value: "#0000001f / 1px", note: "默认 Divider 与普通卡片边界都来自 --du-border-1。" },
      { title: "Frame", value: "none / component border", note: "初始化状态没有装饰框、角线或图片边框；只有组件自身 border。" },
      { title: "Selection", value: "#7c66ff active indicator", note: "选中态由 primary token 标识，不引入 shadow、纹理或特殊 frame recipe。" },
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
      { title: "Hairline", value: "rgba(255,90,31,.38) / 1px", note: "资讯区和导航分隔使用橙色低透明 hairline，映射到 --du-border-1 / --du-primary-border。" },
      { title: "Frame", value: "angled HUD frame", note: "卡片边界是斜切线框 recipe，不是普通 Divider；需要 style-only frame pattern。" },
      { title: "Selection", value: "orange active underline", note: "选中态用底线和斜切边界，不额外加无依据阴影。" },
    ],
    radius: [
      { title: "Card", value: "10px", note: "卡片圆角较克制，配合斜切/HUD 边界，不走柔和卡片风。" },
      { title: "Control", value: "6px", note: "按钮和输入类控件更硬朗，强调游戏工具属性。" },
      { title: "Media", value: "10-12px", note: "媒体容器可略大，但避免全 pill。" },
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
      { title: "Hairline", value: "rgba(200,176,139,.72) / 1px", note: "普通分割线使用古铜金 hairline，可映射到 --du-border-1。" },
      { title: "Frame", value: "ornate corner frame / 22px", note: "媒体框和卡牌框需要贴边角线 recipe；只设置 border 色不算完成。" },
      { title: "Scope", value: "demo/page frames only", note: "装饰框只能套到目标页面框体、媒体壳、卡牌壳；证据区和 mapping 区必须排除。" },
    ],
    radius: [
      { title: "Card", value: "0px", note: "官网装饰框和媒体框更接近直角，主要识别来自边框、纹理和手绘资产。" },
      { title: "Control", value: "5px", note: "输入框 CSS 出现 5px，按钮可近似到 Echo Radius/Small 或 Normal。" },
      { title: "Media", value: "0-8px", note: "特色图和壁纸更多依赖装饰边框，圆角不是主要 token 特征。" },
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
      { title: "Hairline", value: "rgba(0,0,0,.08) / 1px", note: "分割线极弱，主要依靠留白和模块节奏建立层级。" },
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
      { title: "Hairline", value: "#d9d9d9 / 1px", note: "工具面板、列表和属性区使用清晰 hairline，映射到 --du-border-1。" },
      { title: "Frame", value: "plain panel border", note: "边框是普通面板线，不需要图片或角线 recipe。" },
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
      { title: "Hairline", value: "#e6e6e6 / 1px", note: "文档表格、抽屉和列表使用低对比 hairline，映射到 --du-border-1。" },
      { title: "Frame", value: "paper card border", note: "卡片是纸面 hairline，不需要装饰框 recipe。" },
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
      { title: "Hairline", value: "rgba(255,255,255,.12) / 1px", note: "暗色页面使用弱白分隔线，避免破坏封面图和品牌绿。" },
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

const recipeStatsByCategory = {
  typography: ["4 次 · 40%", "4 次 · 40%", "2 次 · 20%"],
  spacing: ["5 次 · 45%", "3 次 · 27%", "3 次 · 27%"],
  divider: ["6 次 · 50%", "4 次 · 33%", "2 次 · 17%"],
  radius: ["4 次 · 40%", "4 次 · 40%", "2 次 · 20%"],
};

const imagePreviewSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' rx='24' fill='%23f5f5f5'/%3E%3Ccircle cx='92' cy='76' r='44' fill='%23874fff' fill-opacity='.82'/%3E%3Ccircle cx='160' cy='92' r='48' fill='%2300b6ff' fill-opacity='.72'/%3E%3Ccircle cx='224' cy='82' r='38' fill='%23ff7237' fill-opacity='.78'/%3E%3C/svg%3E";
const selectOptions = [
  { label: "Figma", value: "figma" },
  { label: "Apple", value: "apple" },
  { label: "Spotify", value: "spotify" },
];
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
const categorySpecs = [
  {
    name: "分发侧：内容送达",
    description: "面向首页、活动页、内容流和搜索分发，重点是导航、筛选、公告、卡片与标签。",
    components: ["NavigationBar", "NavigationBarRight", "Search", "SearchRight", "Tabs", "Tab", "TabPane", "TabsRight", "NoticeBar", "Card", "Tag", "TagsPanel", "Swiper", "SwiperItem", "Sticky"],
  },
  {
    name: "展示侧：服务器数据输出",
    description: "面向详情、列表、用户信息和状态展示，把服务端返回的数据组织成可读界面。",
    components: [
      "Avatar",
      "AvatarGroup",
      "Badge",
      "Image",
      "Rate",
      "Steps",
      "StepCheck",
      "Divider",
      "Empty",
      "Skeleton",
      "SkeletonAvatar",
      "SkeletonParagraph",
      "SkeletonRectangle",
    ],
  },
  {
    name: "发布侧：用户数据输入",
    description: "面向创建、编辑、报名和配置发布，把用户输入校验后提交给服务器。",
    components: [
      "Input",
      "InputNumber",
      "Textarea",
      "Select",
      "Checkbox",
      "CheckboxGroup",
      "CheckboxIcon",
      "Radio",
      "RadioGroup",
      "RadioIcon",
      "Switch",
      "Upload",
      "Form",
      "FormItem",
      "FormField",
      "Cascader",
      "Calendar",
      "Picker",
      "PickerView",
      "Button",
      "ActionButton",
    ],
  },
  {
    name: "通用反馈：从轻到重",
    description: "从轻量信息提示到重量决策弹层，帮助开发者判断什么时候该打扰用户。",
    components: ["NoticeBar", "Skeleton", "Empty", "Snackbar", "Tooltip", "Dropdown", "ActionSheet", "Dialog", "Popup", "ToastProvider", "RootPortal"],
  },
  {
    name: "通用基础：动作与系统能力",
    description: "跨分发、展示、发布都可能使用的基础动作、图标、主题与过渡能力。",
    components: ["Button", "Icon", "IconButton", "Divider", "Theme", "Transition"],
  },
];
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
  "NavigationBar",
  "NoticeBar",
  "Radio",
  "Rate",
  "Search",
  "Select",
  "Skeleton",
  "SkeletonAvatar",
  "SkeletonParagraph",
  "SkeletonRectangle",
  "Steps",
  "Switch",
  "Tabs",
  "Tag",
  "Textarea",
]);

function kebabName(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function pageNodeId(name) {
  return `node-${selectedTemplateId.value}-${kebabName(name)}`;
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
const templatePages = [
  {
    id: "distribution",
    tab: "分发侧",
    name: "内容分发页",
    description: "把服务端内容通过搜索、分组、公告和 Feed 卡片送到用户面前。",
    components: ["NavigationBar", "Search", "NoticeBar", "Tabs", "Card", "Tag"],
  },
  {
    id: "display",
    tab: "展示侧",
    name: "数据展示页",
    description: "承接服务器数据输出，展示用户信息、图片资源、进度和评价状态。",
    components: ["NavigationBar", "Avatar", "Badge", "Tag", "Image", "Swiper", "Steps", "Rate"],
  },
  {
    id: "publish",
    tab: "发布侧",
    name: "数据发布页",
    description: "承接用户输入，把表单、选项、开关和提交动作组合成发布路径。",
    components: ["NavigationBar", "Group", "Input", "Textarea", "Select", "DateTimePicker", "Upload", "Checkbox", "Switch", "Button"],
  },
  {
    id: "feedback",
    tab: "反馈",
    name: "反馈状态页",
    description: "从轻量提示到重量弹层，按打扰程度组织页面状态和用户决策。",
    components: ["NavigationBar", "Dialog", "Popup", "Empty", "Skeleton", "Spin", "NoticeBar", "Snackbar"],
  },
];
const cznTemplatePages = [
  {
    id: "czn-home",
    tab: "官网首页",
    name: "卡厄思梦境官网首页",
    description: "对应 CZN 首页首屏：大主视觉、下载面板、二维码和强 CTA。",
    components: ["NavigationBar", "Hero", "DownloadPanel", "QRCode", "Button"],
  },
  {
    id: "czn-forward",
    tab: "公测内容",
    name: "公测内容一览",
    description: "对应 CZN 公测内容区：白灰资讯底、橙色轮播描边、内容卡和状态标签。",
    components: ["NavigationBar", "Swiper", "Tag", "Card", "Button"],
  },
  {
    id: "czn-character",
    tab: "角色详情",
    name: "角色详情页",
    description: "对应 CZN 角色页：黑紫沉浸底、角色档案、语音面板和技能卡片。",
    components: ["NavigationBar", "CharacterPanel", "Avatar", "Card", "Tag"],
  },
];
const hpmaTemplatePages = [
  {
    id: "hpma-home",
    tab: "官网首页",
    name: "霍格沃茨入学首页",
    description: "对应官网首页：顶部导航、下载入口、录取通知书式文案和棕金魔法氛围。",
    components: ["NavigationBar", "Hero", "DownloadPanel", "QRCode", "Button"],
  },
  {
    id: "hpma-news",
    tab: "资讯/活动",
    name: "魔法资讯活动页",
    description: "对应官网新闻与活动轮播：羊皮纸列表、金棕标签、媒体缩略图和查看更多。",
    components: ["NavigationBar", "Swiper", "Tabs", "Card", "Tag", "Button"],
  },
  {
    id: "hpma-cards",
    tab: "魔咒卡牌",
    name: "魔咒与伙伴图鉴",
    description: "对应魔咒&伙伴介绍和壁纸图库：卡牌框、角色媒体、图鉴网格和装饰边界。",
    components: ["NavigationBar", "Search", "Image", "Card", "Badge", "Tabs"],
  },
];
const notionTemplatePages = [
  {
    id: "notion-home",
    tab: "文档首页",
    name: "Notion 文档首页",
    description: "对应 Notion 首页：暖白画布、近黑大标题、蓝色 CTA 和贴纸人格层。",
    components: ["NavigationBar", "Hero", "Tag", "Card", "Button"],
  },
  {
    id: "notion-wiki",
    tab: "知识库",
    name: "团队知识库",
    description: "对应 Notion 文档/知识库：搜索、文档列表、轻提示和多色插画块。",
    components: ["NavigationBar", "Search", "Card", "NoticeBar", "Image"],
  },
  {
    id: "notion-pricing",
    tab: "团队计划",
    name: "团队计划页",
    description: "对应 Notion pricing card：白卡、hairline、少量蓝色行动入口和 featured 反相卡。",
    components: ["NavigationBar", "Card", "Badge", "Button"],
  },
];
const demoPagesByStyle = {
  czn: cznTemplatePages,
  hpma: hpmaTemplatePages,
  notion: notionTemplatePages,
};
const currentDemoPages = computed(() => demoPagesByStyle[selectedStyleId.value] || []);
const currentTemplatePages = computed(() => [...templatePages, ...currentDemoPages.value]);
const selectedTemplate = computed(() => currentTemplatePages.value.find((template) => template.id === selectedTemplateId.value) || currentTemplatePages.value[0]);
const pageInstances = computed(() =>
  selectedTemplate.value.components.map((name) => ({
    id: pageNodeId(name),
    name,
    label: name,
    rendered: staticallyRenderedComponents.has(name),
    reason: placeholderReasons[name] || defaultPlaceholderReason,
  })),
);

const componentsByName = computed(() =>
  Object.fromEntries(catalog.value.components.map((component) => [component.name, component])),
);
const missingByName = computed(() =>
  Object.fromEntries((catalog.value.missingComponents || []).map((component) => [component.name, component])),
);
const uniqueComponentCount = computed(() => new Set(pageInstances.value.map((item) => item.name)).size);
const selectedStyle = computed(() => stylePresets.find((preset) => preset.id === selectedStyleId.value) || stylePresets[0]);
const selectedStyleCategory = computed(() =>
  styleCategories.find((category) => category.id === selectedStyleCategoryId.value),
);
const currentStyleCategoryDescription = computed(() =>
  selectedStyleCategoryId.value === "color" ? selectedStyle.value.evidenceNote : selectedStyleCategory.value?.description || "",
);
const recipeSwatchClass = computed(() => `recipe-swatch-${selectedStyleCategoryId.value}`);
const selectedStyleRecipeRows = computed(() => {
  const recipe = styleRecipeDetails[selectedStyle.value.id];
  const stats = recipeStatsByCategory[selectedStyleCategoryId.value] || [];
  return (recipe?.[selectedStyleCategoryId.value] || []).map((item, index) => ({
    ...item,
    stat: item.stat || stats[index] || "待统计",
    target: item.target || styleRecipeMappingTarget(selectedStyleCategoryId.value, item),
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
      stat: item.stat,
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
      stat: item.stat,
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
        : "hairline";
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
  const tokenMap = Object.fromEntries(catalog.value.tokens.map((token) => [token.name, token.value]));
  const firstColor = (value) => extractColorValues(value)[0] || "transparent";
  const refName = (value) => String(value).match(/var\((--[^)]+)\)/)?.[1] || "";
  const item = (name, chain = "") => ({
    name,
    value: tokenMap[name] || "当前 token 快照未包含",
    swatch: firstColor(tokenMap[name]),
    chain,
  });
  const refItem = (name) => {
    const value = tokenMap[name] || "";
    const ref = refName(value);
    return {
      name,
      value: value || "当前 token 快照未包含",
      swatch: firstColor(tokenMap[ref] || value),
      chain: ref ? `${name} -> ${ref} -> ${tokenMap[ref] || "未解析"}` : "当前快照未保留 var 引用",
    };
  };
  const placeholder = (message) => ({
    name: message,
    value: "当前 token 快照未包含",
    swatch: "transparent",
    chain: "",
  });
  return [
    {
      title: "一级：基础色板",
      description: "无具体业务语义的色阶族，例如 purplegray-9。这里只表达颜色家族和色阶，不表达业务状态。",
      items: [
        placeholder("purplegray-9 / gray-9"),
      ],
    },
    {
      title: "二级：语义 token",
      description: "语义层引用一级色板；当前快照缺少一级源时只显示 token 名和值。",
      items: [
        item("--du-bg-1"),
        item("--du-text-1"),
        item("--du-border-1"),
        item("--du-primary-color"),
        item("--du-default-color"),
      ],
    },
    {
      title: "三级：组件别名",
      description: "组件别名层必须通过 var(...) 继承二级语义 token，不直接写最终色值。",
      items: [
        refItem("--du-bt-color"),
        refItem("--du-bt-border"),
        refItem("--du-bt-solid-bg"),
        refItem("--du-in-solid-bg"),
        refItem("--du-checkbox-color"),
        refItem("--du-switch-bg"),
      ],
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
      value: "token / 候选映射色，当前证据频次为 0",
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
      value: "style recipe 中出现的候选颜色，当前证据频次为 0",
      source: "style",
    });
  });
  return Array.from(rows.values()).map((row) => ({
    ...row,
    target: row.targetNames.join(" / "),
  })).sort((a, b) => b.sortCount - a.sortCount || a.raw.localeCompare(b.raw));
});
const themeVars = computed(() => ({
  "--du-bg-2": selectedStyleTokenMap.value["--du-bg-2"],
  "--du-bg-1": selectedStyleTokenMap.value["--du-bg-1"],
  "--du-text-1": selectedStyleTokenMap.value["--du-text-1"],
  "--du-text-3": selectedStyleTokenMap.value["--du-text-3"],
  "--du-border-1": selectedStyleTokenMap.value["--du-border-1"],
  "--du-primary-color": selectedStyleTokenMap.value["--du-primary-color"],
  "--du-primary-border": selectedStyleTokenMap.value["--du-primary-border"],
  "--du-primary-outline-color": selectedStyleTokenMap.value["--du-primary-outline-color"],
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

function componentChineseName(name) {
  return componentChineseNames[name] || "组件";
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
    return "dangoui missing: typography token · style-only";
  }
  if (category === "spacing") {
    const primitive = closestPrimitive(item.value, "Spacing");
    const adapter = item.title === "Page" ? "--style-page-spacing" : "demo layout CSS";
    return `Echo ${primitive.label} (${primitive.status}) · dangoui style-only: ${adapter}`;
  }
  if (category === "divider") {
    if (/frame|角线|ornate|HUD|panel|card/i.test(`${item.title} ${item.value}`)) {
      return "dangoui --du-border-1 + style-only frame/divider recipe";
    }
    return "--du-border-1 / --du-primary-border";
  }
  if (category === "radius") {
    const primitive = item.value.includes("999")
      ? { label: "Radius/Pill", status: "fallback" }
      : closestPrimitive(item.value, "Radius");
    const adapter = item.title === "Control" ? "--style-control-radius" : "--style-card-radius";
    return `Echo ${primitive.label} (${primitive.status}) · dangoui style-only: ${adapter}`;
  }
  return selectedStyleCategory.value?.meta || "style-only";
}

function recipeSwatchText(item) {
  if (selectedStyleCategoryId.value === "typography") return "Aa";
  if (selectedStyleCategoryId.value === "spacing") return `${firstNumber(item.value, 8)}px`;
  if (selectedStyleCategoryId.value === "divider") return item.title === "Frame" ? "frame" : "1px";
  if (selectedStyleCategoryId.value === "radius") return item.value.includes("999") ? "pill" : `${firstNumber(item.value, 8)}px`;
  return item.value;
}

function recipeSwatchStyle(item) {
  const category = selectedStyleCategoryId.value;
  if (category === "typography") {
    const [sizePart, weightPart] = String(item.value).split("/");
    return {
      fontSize: `${Math.min(firstNumber(sizePart, 14), 22)}px`,
      fontWeight: String(firstNumber(weightPart, 700)),
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

function selectInstance(instanceId) {
  const instance = pageInstances.value.find((item) => item.id === instanceId);
  if (!instance) return;
  selectedWorkspaceMode.value = "components";
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

function selectTemplate(templateId) {
  selectedWorkspaceMode.value = "components";
  selectedTemplateId.value = templateId;
  nextTick(() => {
    const first = pageInstances.value[0];
    if (first) selectInstance(first.id);
  });
}

function selectStyle(styleId) {
  selectedStyleId.value = styleId;
  selectedInspectorTab.value = "style";
  selectedWorkspaceMode.value = "components";
  selectedStyleCategoryId.value = "";
  selectedTemplateId.value = demoPagesByStyle[styleId]?.[0]?.id || "distribution";
  nextTick(() => {
    const first = pageInstances.value[0];
    if (first) selectInstance(first.id);
  });
}

function showStyleMenu() {
  selectedInspectorTab.value = "style";
}

function showComponentMenu() {
  selectedInspectorTab.value = "components";
  selectedWorkspaceMode.value = "components";
}

function selectStyleCategory(categoryId) {
  selectedStyleCategoryId.value = categoryId;
  selectedWorkspaceMode.value = "style";
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
