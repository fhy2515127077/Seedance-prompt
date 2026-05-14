<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { sceneTypeConfig, type SceneType } from '../engine/vocabularyData'
import type { OptimizeResult } from '../engine/promptEngine'

const router = useRouter()

const HISTORY_KEY = 'seedance_prompt_history'
const HISTORY_SELECTED_KEY = 'seedance_selected_history_item'

const historyList = ref<OptimizeResult[]>([])

const hasHistory = computed(() => historyList.value.length > 0)

function loadHistory() {
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  if (!savedHistory) {
    historyList.value = []
    return
  }

  try {
    const parsed = JSON.parse(savedHistory)
    historyList.value = Array.isArray(parsed) ? parsed : []
  } catch {
    historyList.value = []
    localStorage.removeItem(HISTORY_KEY)
  }
}

function historyMeta(item: OptimizeResult) {
  const sceneKey = (item.sceneType ?? 'general') as SceneType
  const sceneLabel = sceneTypeConfig[sceneKey]?.label ?? '通用场景'
  return `${item.duration ?? '未记录时长'} · ${sceneLabel} · ${item.ratio ?? '16:9'}`
}

function historyPreview(item: OptimizeResult) {
  return item.versions?.[0]?.content?.trim() ?? '暂无内容预览'
}

function openHistoryItem(item: OptimizeResult) {
  localStorage.setItem(HISTORY_SELECTED_KEY, JSON.stringify(item))
  window.dispatchEvent(new Event('seedance:history-selected'))
  router.push('/studio')
}

function clearHistory() {
  historyList.value = []
  localStorage.removeItem(HISTORY_KEY)
}

onMounted(loadHistory)
</script>

<template>
  <div class="view-wrapper">
    <main class="history-page">
      <header class="history-header">
        <div class="history-heading">
          <p class="history-kicker">History</p>
          <h1 class="history-title">生成历史</h1>
          <p class="history-desc">查看最近生成过的提示词结果，继续编辑，或重新载入到工作台。</p>
        </div>
        <div class="history-actions">
          <button type="button" class="secondary-btn" @click="router.push('/studio')">进入工作台</button>
          <button
            type="button"
            class="secondary-btn danger-btn"
            :disabled="!hasHistory"
            @click="clearHistory"
          >
            清空历史
          </button>
        </div>
      </header>

      <section v-if="hasHistory" class="history-grid">
        <article v-for="(item, index) in historyList" :key="`${item.theme}-${index}`" class="history-card">
          <div class="history-card-top">
            <span class="history-index">#{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="history-meta">{{ historyMeta(item) }}</span>
          </div>

          <h2 class="history-theme">{{ item.theme || '未命名主题' }}</h2>
          <p class="history-preview">{{ historyPreview(item) }}</p>

          <div v-if="item.tips?.length" class="history-tips">
            <span v-for="tip in item.tips.slice(0, 3)" :key="tip" class="tip-chip">{{ tip }}</span>
          </div>

          <button type="button" class="primary-btn" @click="openHistoryItem(item)">载入到工作台</button>
        </article>
      </section>

      <section v-else class="empty-state">
        <div class="empty-card">
          <p class="empty-title">暂无历史记录</p>
          <p class="empty-desc">先生成一条提示词，之后这里会自动保存最近的结果。</p>
          <button type="button" class="primary-btn" @click="router.push('/studio')">开始生成</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.view-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 124px 20px 32px;
}

.history-page {
  position: relative;
  z-index: 10;
  display: grid;
  width: min(1180px, 100%);
  gap: 26px;
}

.history-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.history-heading {
  display: grid;
  gap: 8px;
}

.history-kicker {
  margin: 0;
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.history-title {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1;
  letter-spacing: 0;
}

.history-desc {
  margin: 0;
  max-width: 56ch;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.history-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.history-card,
.empty-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  background: oklch(0.988 0.008 98 / 0.84);
  box-shadow: var(--shadow-md);
}

.history-card {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.history-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-index {
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.history-meta {
  color: var(--text-muted);
  font-size: 12px;
  text-align: right;
}

.history-theme {
  margin: 0;
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1.22;
}

.history-preview {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.history-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tip-chip {
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--surface-strong);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.primary-btn,
.secondary-btn {
  min-height: 40px;
  border-radius: 999px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  transition: transform 0.2s var(--ease-out), background 0.2s var(--ease-out), color 0.2s var(--ease-out);
}

.primary-btn {
  border: 0;
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.primary-btn:hover {
  transform: translateY(-1px);
  background: var(--accent-hover);
}

.secondary-btn {
  border: 1px solid var(--border-subtle);
  background: var(--surface);
  color: var(--text-primary);
}

.secondary-btn:hover:not(:disabled) {
  background: var(--surface-strong);
  transform: translateY(-1px);
}

.danger-btn:not(:disabled):hover {
  color: var(--danger);
}

.danger-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.empty-state {
  min-height: 340px;
  display: grid;
  place-items: center;
}

.empty-card {
  display: grid;
  width: min(440px, 100%);
  justify-items: center;
  gap: 14px;
  padding: 32px;
  text-align: center;
}

.empty-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 850;
}

.empty-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 840px) {
  .view-wrapper {
    padding: 96px 14px 24px;
  }

  .history-header {
    align-items: stretch;
    flex-direction: column;
  }

  .history-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
