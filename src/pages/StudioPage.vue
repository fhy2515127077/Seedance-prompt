<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import ImageResult from '../components/ImageResult.vue'
import PromptInput from '../components/PromptInput.vue'
import PromptResult from '../components/PromptResult.vue'
import {
  generatePromptImage,
  optimizePrompt,
  type GeneratedImageResult,
  type OptimizeResult
} from '../engine/promptEngine'
import type { SceneType, DurationType, AspectRatioType } from '../engine/vocabularyData'

const props = withDefaults(
  defineProps<{
    mode?: 'prompt' | 'image'
  }>(),
  {
    mode: 'prompt'
  }
)

const result = ref<OptimizeResult | null>(null)
const imageResult = ref<GeneratedImageResult | null>(null)
const imageRatio = ref<AspectRatioType>('16:9')
const isGenerating = ref(false)
const activeMode = ref<'prompt' | 'image'>('prompt')
const draftText = ref('')
const draftMode = ref<'prompt' | 'image'>('prompt')
const draftVersion = ref(0)

const HISTORY_KEY = 'seedance_prompt_history'
const HISTORY_SELECTED_KEY = 'seedance_selected_history_item'
const historyList = ref<OptimizeResult[]>([])
const USAGE_COUNT_KEY = 'seedance_usage_count'
const usageCount = ref(128503)

function loadHistory() {
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  if (savedHistory) {
    try {
      historyList.value = JSON.parse(savedHistory)
    } catch {
      localStorage.removeItem(HISTORY_KEY)
    }
  }

  const savedCount = localStorage.getItem(USAGE_COUNT_KEY)
  if (savedCount) {
    usageCount.value = parseInt(savedCount, 10)
  } else {
    localStorage.setItem(USAGE_COUNT_KEY, usageCount.value.toString())
  }
}

loadHistory()

watch(
  () => props.mode,
  (mode) => {
    activeMode.value = mode
    result.value = null
    imageResult.value = null
    draftMode.value = mode
  },
  { immediate: true }
)

function applySelectedHistory() {
  const selectedRaw = localStorage.getItem(HISTORY_SELECTED_KEY)
  if (!selectedRaw) return

  try {
    const selected = JSON.parse(selectedRaw) as OptimizeResult
    if (!selected || !Array.isArray(selected.versions) || selected.versions.length === 0) {
      localStorage.removeItem(HISTORY_SELECTED_KEY)
      return
    }
    result.value = selected
    imageResult.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    // Ignore invalid history payloads.
  } finally {
    localStorage.removeItem(HISTORY_SELECTED_KEY)
  }
}

function handleHistorySelected() {
  applySelectedHistory()
}

function handleEditImage(prompt: string) {
  draftText.value = prompt
  draftMode.value = 'image'
  draftVersion.value += 1
  imageResult.value = null
  result.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  applySelectedHistory()
  window.addEventListener('seedance:history-selected', handleHistorySelected)
})

onUnmounted(() => {
  window.removeEventListener('seedance:history-selected', handleHistorySelected)
})

async function handleOptimize(payload: {
  mode: 'prompt' | 'image'
  input: string
  sceneType: SceneType
  duration: DurationType
  ratio: AspectRatioType
  customSeconds?: number
  images?: string[]
}) {
  isGenerating.value = true
  activeMode.value = payload.mode
  result.value = null
  imageResult.value = null

  try {
    if (payload.mode === 'image') {
      imageRatio.value = payload.ratio
      imageResult.value = await generatePromptImage(payload.input, payload.ratio)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    result.value = await optimizePrompt(
      payload.input,
      payload.sceneType,
      payload.duration,
      payload.ratio,
      payload.customSeconds,
      payload.images
    )

    if (result.value) {
      usageCount.value += 1
      localStorage.setItem(USAGE_COUNT_KEY, usageCount.value.toString())

      historyList.value = [
        result.value,
        ...historyList.value.filter((item) => item.versions?.[0]?.content !== result.value?.versions?.[0]?.content)
      ]
      if (historyList.value.length > 20) {
        historyList.value.pop()
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (error: any) {
    alert(error.message || '请求失败，请稍后重试或检查后端配置。')
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="view-wrapper">
    <main class="app-main" id="studio-main">
      <PromptInput
        :is-generating="isGenerating"
        :mode="props.mode"
        :draft-text="draftText"
        :draft-mode="draftMode"
        :draft-version="draftVersion"
        @optimize="handleOptimize"
      />

      <div v-if="isGenerating" class="generating-panel" role="status" aria-live="polite">
        <div class="progress-track">
          <span class="progress-fill"></span>
        </div>
        <span class="progress-text">
          {{ activeMode === 'prompt' ? '正在优化提示词' : '正在生成图片' }}
        </span>
      </div>

      <PromptResult v-if="result" :result="result" />
      <ImageResult v-if="imageResult" :result="imageResult" :ratio="imageRatio" @edit="handleEditImage" />
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
  overflow-x: hidden;
}

.app-main {
  position: relative;
  z-index: 10;
  width: min(1040px, 100%);
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 28px;
}

.generating-panel {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: oklch(0.985 0.008 98 / 0.72);
  box-shadow: var(--shadow-sm);
}

.progress-track {
  position: relative;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: oklch(0.86 0.025 100 / 0.72);
}

.progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 38%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
  animation: progressSweep 1.25s var(--ease-out) infinite;
}

.progress-text {
  width: max-content;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 750;
}

@keyframes progressSweep {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(270%);
  }
}

@media (max-width: 720px) {
  .view-wrapper {
    padding: 96px 14px 24px;
  }

  .app-main {
    gap: 22px;
  }
}
</style>
