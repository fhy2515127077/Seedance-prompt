<script setup lang="ts">
import { ref } from 'vue'
import {
  generateStoryboardFrame,
  type OptimizeResult,
  type StoryboardFrameInput,
  type StoryboardFrameResult
} from '../engine/promptEngine'
import { sceneTypeConfig, type SceneType } from '../engine/vocabularyData'

const props = defineProps<{
  result: OptimizeResult
}>()

const copiedIndex = ref<string | number | null>(null)
const expandedVersions = ref<number[]>([])
const storyboardFrames = ref<Record<number, StoryboardFrameResult[]>>({})
const storyboardLoading = ref<Record<number, boolean>>({})
const storyboardErrors = ref<Record<number, string>>({})
const storyboardProgress = ref<Record<number, string>>({})

const MAX_STORYBOARD_FRAMES = 6

function buildFullVersionText(version: OptimizeResult['versions'][number]) {
  if (!version.segments || version.segments.length === 0) {
    return version.content
  }

  const sections = [
    version.content.trim(),
    ...version.segments.map((segment) =>
      [
        `${segment.partTitle} - ${segment.action}`,
        segment.prompt.trim(),
        segment.transition ? `衔接建议：${segment.transition}` : ''
      ]
        .filter(Boolean)
        .join('\n')
    )
  ]

  return sections.filter(Boolean).join('\n\n')
}

async function copyToClipboard(text: string, index: string | number) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  copiedIndex.value = index
  window.setTimeout(() => {
    copiedIndex.value = null
  }, 2000)
}

function sceneLabel() {
  const config = sceneTypeConfig[(props.result.sceneType ?? 'general') as SceneType]
  return config?.label ?? '通用 / 自由创作'
}

function hasSegments(version: OptimizeResult['versions'][number]) {
  return Array.isArray(version.segments) && version.segments.length > 0
}

function toggleSegments(index: number) {
  if (expandedVersions.value.includes(index)) {
    expandedVersions.value = expandedVersions.value.filter((item) => item !== index)
    return
  }

  expandedVersions.value = [...expandedVersions.value, index]
}

function isExpanded(index: number) {
  return expandedVersions.value.includes(index)
}

function buildStoryboardInputs(version: OptimizeResult['versions'][number]): StoryboardFrameInput[] {
  if (Array.isArray(version.segments) && version.segments.length > 0) {
    return version.segments.slice(0, MAX_STORYBOARD_FRAMES).map((segment) => ({
      title: segment.partTitle,
      prompt: segment.prompt
    }))
  }

  return version.content.trim()
    ? [
        {
          title: version.title,
          prompt: version.content
        }
      ]
    : []
}

function getStoryboardFrames(index: number) {
  return storyboardFrames.value[index] ?? []
}

function isStoryboardLoading(index: number) {
  return storyboardLoading.value[index] ?? false
}

function getStoryboardError(index: number) {
  return storyboardErrors.value[index] ?? ''
}

function getStoryboardProgress(index: number) {
  return storyboardProgress.value[index] ?? ''
}

async function handleGenerateStoryboard(index: number, version: OptimizeResult['versions'][number]) {
  if (isStoryboardLoading(index)) {
    return
  }

  const inputs = buildStoryboardInputs(version)
  if (inputs.length === 0) {
    storyboardErrors.value = { ...storyboardErrors.value, [index]: '当前版本缺少可生成分镜的文本内容。' }
    return
  }

  storyboardLoading.value = { ...storyboardLoading.value, [index]: true }
  storyboardErrors.value = { ...storyboardErrors.value, [index]: '' }
  storyboardProgress.value = { ...storyboardProgress.value, [index]: '' }
  storyboardFrames.value = { ...storyboardFrames.value, [index]: [] }

  const frames: StoryboardFrameResult[] = []
  try {
    for (const [frameIndex, frame] of inputs.entries()) {
      storyboardProgress.value = {
        ...storyboardProgress.value,
        [index]: `正在生成第 ${frameIndex + 1} / ${inputs.length} 张分镜图`
      }
      const generated = await generateStoryboardFrame(frame)
      frames.push(generated)
      storyboardFrames.value = { ...storyboardFrames.value, [index]: [...frames] }
    }
  } catch (error: any) {
    storyboardErrors.value = {
      ...storyboardErrors.value,
      [index]: error?.message || '分镜图片生成失败，请稍后重试。'
    }
  } finally {
    storyboardLoading.value = { ...storyboardLoading.value, [index]: false }
    storyboardProgress.value = { ...storyboardProgress.value, [index]: '' }
  }
}
</script>

<template>
  <section class="result-section">
    <header class="result-header">
      <div>
        <p class="result-kicker">Optimized Result</p>
        <h2 class="result-title">优化结果</h2>
      </div>
      <div class="result-meta">
        <span class="meta-tag">{{ sceneLabel() }}</span>
        <span class="meta-tag">{{ result.duration }}</span>
        <span class="meta-tag">{{ result.ratio }}</span>
      </div>
    </header>

    <div class="version-list">
      <article
        v-for="(version, index) in result.versions"
        :key="`${version.title}-${index}`"
        class="version-card"
        :style="{ animationDelay: `${index * 0.08}s` }"
      >
        <div class="version-header">
          <div class="version-title-row">
            <span class="version-index">版本 {{ index + 1 }}</span>
            <h3 class="version-title">{{ version.title }}</h3>
            <span class="version-style">{{ version.style }}</span>
          </div>
          <div class="version-actions">
            <button
              type="button"
              class="action-btn storyboard-btn"
              :disabled="isStoryboardLoading(index)"
              @click="handleGenerateStoryboard(index, version)"
            >
              <span v-if="!isStoryboardLoading(index)">
                {{ getStoryboardFrames(index).length > 0 ? '重新生成分镜' : '生成分镜图' }}
              </span>
              <span v-else>{{ getStoryboardProgress(index) || '正在生成分镜' }}</span>
            </button>
            <button
              type="button"
              class="action-btn"
              :class="{ copied: copiedIndex === index }"
              @click="copyToClipboard(buildFullVersionText(version), index)"
            >
              <span v-if="copiedIndex !== index">复制整版</span>
              <span v-else>已复制</span>
            </button>
          </div>
        </div>

        <pre class="prompt-text">{{ version.content }}</pre>

        <div class="storyboard-panel">
          <div class="storyboard-head">
            <div>
              <h4 class="storyboard-title">分镜预览</h4>
              <p class="storyboard-desc">
                {{
                  hasSegments(version)
                    ? `按前 ${Math.min(version.segments?.length ?? 0, MAX_STORYBOARD_FRAMES)} 个分段生成故事板。`
                    : '当前版本未拆段，将按整版提示词生成 1 张关键分镜图。'
                }}
              </p>
            </div>
            <span class="storyboard-note">由后端代理生成，不暴露密钥</span>
          </div>

          <div v-if="getStoryboardError(index)" class="storyboard-error">{{ getStoryboardError(index) }}</div>

          <div v-if="isStoryboardLoading(index) && getStoryboardFrames(index).length === 0" class="storyboard-loading">
            <span class="storyboard-loading-bar"></span>
            <span>{{ getStoryboardProgress(index) || '正在生成分镜图' }}</span>
          </div>

          <div v-if="getStoryboardFrames(index).length > 0" class="storyboard-grid">
            <article
              v-for="(frame, frameIndex) in getStoryboardFrames(index)"
              :key="`${index}-${frameIndex}`"
              class="storyboard-card"
            >
              <img :src="frame.imageUrl" :alt="frame.title" class="storyboard-image" />
              <div class="storyboard-copy">
                <h5 class="storyboard-card-title">{{ frame.title }}</h5>
                <p class="storyboard-card-prompt">{{ frame.prompt }}</p>
              </div>
            </article>
          </div>
        </div>

        <div v-if="hasSegments(version)" class="segments-panel">
          <button type="button" class="segments-toggle" @click="toggleSegments(index)">
            <span>{{ isExpanded(index) ? '收起分段拆解' : '查看分段拆解' }}</span>
            <span class="segments-toggle-note">适合长视频逐段微调</span>
          </button>

          <div v-if="isExpanded(index)" class="segments-container">
            <article v-for="(segment, segIndex) in version.segments" :key="segIndex" class="segment-card">
              <div class="segment-header">
                <div class="segment-title-wrap">
                  <h4 class="segment-title">{{ segment.partTitle }}</h4>
                  <span class="segment-action">{{ segment.action }}</span>
                </div>
                <button
                  type="button"
                  class="action-btn action-btn-small"
                  :class="{ copied: copiedIndex === `${index}-${segIndex}` }"
                  @click="copyToClipboard(segment.prompt, `${index}-${segIndex}`)"
                >
                  <span v-if="copiedIndex !== `${index}-${segIndex}`">复制本段</span>
                  <span v-else>已复制</span>
                </button>
              </div>
              <pre class="prompt-text segment-text">{{ segment.prompt }}</pre>
              <div v-if="segment.transition" class="segment-transition">
                <strong>衔接建议：</strong>
                <span>{{ segment.transition }}</span>
              </div>
            </article>
          </div>
        </div>
      </article>
    </div>

    <aside class="tips-card">
      <h3 class="tips-title">使用建议</h3>
      <ul class="tips-list">
        <li v-for="(tip, index) in result.tips" :key="index" class="tip-item">
          {{ tip }}
        </li>
      </ul>
    </aside>
  </section>
</template>

<style scoped>
.result-section {
  display: grid;
  gap: 20px;
  animation: fadeInUp 0.48s var(--ease-out);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.result-kicker,
.version-index {
  margin: 0 0 6px;
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.result-title {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(26px, 4vw, 38px);
  line-height: 1.05;
  letter-spacing: 0;
}

.result-meta,
.version-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 7px 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
}

.version-list {
  display: grid;
  gap: 18px;
}

.version-card,
.tips-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  background: oklch(0.988 0.008 98 / 0.84);
  box-shadow: var(--shadow-md);
}

.version-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  animation: cardSlideIn 0.42s var(--ease-out) both;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.version-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.version-title-row {
  display: grid;
  gap: 4px;
}

.version-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1.25;
}

.version-style {
  color: var(--text-muted);
  font-size: 13px;
}

.action-btn {
  min-height: 36px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-primary);
  padding: 0 14px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  transition: background 0.2s var(--ease-out), color 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}

.action-btn:hover:not(:disabled) {
  background: var(--accent-primary);
  color: var(--text-inverse);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.66;
  cursor: wait;
}

.storyboard-btn {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.action-btn.copied {
  border-color: var(--accent-soft);
  background: var(--accent-soft);
  color: var(--text-primary);
}

.action-btn-small {
  min-height: 30px;
  padding: 0 10px;
}

.prompt-text {
  margin: 0;
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: oklch(0.965 0.014 100 / 0.62);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.82;
  white-space: pre-wrap;
  word-break: break-word;
}

.storyboard-panel,
.segments-panel {
  display: grid;
  gap: 14px;
  padding-top: 18px;
  border-top: 1px solid var(--border-subtle);
}

.storyboard-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.storyboard-title {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 15px;
}

.storyboard-desc,
.storyboard-note {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.65;
}

.storyboard-note {
  white-space: nowrap;
}

.storyboard-loading,
.storyboard-error {
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 650;
}

.storyboard-loading {
  display: grid;
  gap: 10px;
  background: var(--surface-strong);
  color: var(--text-secondary);
}

.storyboard-loading-bar {
  position: relative;
  display: block;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: oklch(0.86 0.025 100 / 0.72);
}

.storyboard-loading-bar::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
  animation: storyboardSweep 1.2s var(--ease-out) infinite;
}

@keyframes storyboardSweep {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(270%);
  }
}

.storyboard-error {
  background: oklch(0.94 0.045 32);
  color: var(--danger);
}

.storyboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.storyboard-card {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.storyboard-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: var(--surface-muted);
}

.storyboard-copy {
  display: grid;
  gap: 6px;
  padding: 14px;
}

.storyboard-card-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
}

.storyboard-card-prompt {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.segments-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text-primary);
  padding: 14px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
}

.segments-toggle-note {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.segments-container {
  display: grid;
  gap: 14px;
}

.segment-card {
  display: grid;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
  padding: 18px;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.segment-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.segment-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
}

.segment-action {
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--accent-primary);
  color: var(--text-inverse);
  font-size: 11px;
  font-weight: 800;
}

.segment-text {
  background: var(--surface-strong);
}

.segment-transition {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.tips-card {
  display: grid;
  gap: 12px;
  padding: 22px 24px;
}

.tips-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
}

.tips-list {
  display: grid;
  gap: 8px;
  list-style: none;
}

.tip-item {
  position: relative;
  padding-left: 16px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.tip-item::before {
  content: '';
  position: absolute;
  top: 0.72em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
}

@media (max-width: 720px) {
  .version-card {
    padding: 18px;
    border-radius: 24px;
  }

  .version-header,
  .segment-header,
  .storyboard-head {
    flex-direction: column;
  }

  .version-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }

  .storyboard-note {
    white-space: normal;
  }

  .storyboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .segments-toggle {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
