<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  sceneTypeConfig,
  durationOptions,
  aspectRatioOptions,
  type SceneType,
  type DurationType,
  type AspectRatioType
} from '../engine/vocabularyData'
import CustomSelect from './CustomSelect.vue'

type GeneratorMode = 'prompt' | 'image'

const props = defineProps<{
  isGenerating: boolean
  mode: GeneratorMode
  draftText?: string
  draftMode?: GeneratorMode
  draftVersion?: number
}>()

const emit = defineEmits<{
  optimize: [payload: {
    mode: GeneratorMode
    input: string
    sceneType: SceneType
    duration: DurationType
    ratio: AspectRatioType
    customSeconds?: number
    images?: string[]
  }]
}>()

const inputText = ref('')
const selectedScene = ref<SceneType>('auto')
const selectedDuration = ref<DurationType>('long')
const selectedRatio = ref<AspectRatioType>('16:9')
const selectedMode = ref<GeneratorMode>(props.mode)
const customSeconds = ref(30)
const isFocused = ref(false)
const uploadError = ref('')

const MAX_UPLOAD_IMAGES = 4
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

interface UploadedImage {
  id: string
  url: string
}

const uploadedImages = ref<UploadedImage[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const quickPrompts = [
  '赛博朋克城市雨夜，霓虹灯反射在潮湿街面上，角色高速奔跑，镜头贴地推进。',
  '仙侠对决，剑气掀起落叶与尘土，衣袍在风中翻飞，节奏紧张，有史诗感。',
  '可乐产品 360 度旋转展示，冰块飞溅，商业广告质感，高级棚拍灯光。',
  '一只猫在月球表面跳舞，远处能看到地球和星空，荒诞但可爱。',
  '都市短剧名场面，女主在会议室当众反击上司，情绪爆发，镜头慢慢推近。'
]

const sceneTypes = Object.entries(sceneTypeConfig) as [SceneType, typeof sceneTypeConfig[SceneType]][]
const durationList = Object.entries(durationOptions) as [DurationType, typeof durationOptions[DurationType]][]
const ratioList = Object.entries(aspectRatioOptions) as [AspectRatioType, typeof aspectRatioOptions[AspectRatioType]][]

const sceneOptions = sceneTypes.map(([value, config]) => ({ label: config.label, value }))
const durationOptionsList = durationList.map(([value, config]) => ({ label: config.label, value }))
const ratioOptionsList = ratioList.map(([value, config]) => ({ label: config.label, value }))

const normalizedCustomSeconds = computed(() => {
  const value = Number(customSeconds.value)
  if (Number.isNaN(value)) {
    return 30
  }
  return Math.min(60, Math.max(1, Math.round(value)))
})

const canSubmit = computed(() => inputText.value.trim().length > 0)

watch(
  () => props.draftVersion,
  () => {
    if (props.draftText !== undefined) {
      inputText.value = props.draftText
    }
    if (props.draftMode) {
      selectedMode.value = props.draftMode
    }
  }
)

watch(
  () => props.mode,
  (mode) => {
    selectedMode.value = mode
  }
)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  uploadError.value = ''
  const remainingSlots = MAX_UPLOAD_IMAGES - uploadedImages.value.length

  if (remainingSlots <= 0) {
    uploadError.value = `最多上传 ${MAX_UPLOAD_IMAGES} 张参考图。`
    target.value = ''
    return
  }

  let skippedForType = 0
  let skippedForSize = 0

  Array.from(files).slice(0, remainingSlots).forEach((file) => {
    if (!file.type.startsWith('image/')) {
      skippedForType += 1
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      skippedForSize += 1
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        uploadedImages.value.push({
          id: crypto.randomUUID(),
          url: loadEvent.target.result
        })
      }
    }
    reader.readAsDataURL(file)
  })

  const skippedForCount = Math.max(0, files.length - remainingSlots)
  if (skippedForType > 0) {
    uploadError.value = '仅支持上传图片文件。'
  } else if (skippedForSize > 0) {
    uploadError.value = '单张参考图不能超过 5 MB。'
  } else if (skippedForCount > 0) {
    uploadError.value = `最多上传 ${MAX_UPLOAD_IMAGES} 张参考图。`
  }

  target.value = ''
}

function removeImage(id: string) {
  uploadedImages.value = uploadedImages.value.filter((img) => img.id !== id)
  if (uploadedImages.value.length < MAX_UPLOAD_IMAGES && uploadError.value.includes('最多上传')) {
    uploadError.value = ''
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleQuickPrompt(prompt: string) {
  inputText.value = prompt
}

function setMode(mode: GeneratorMode) {
  selectedMode.value = mode
}

function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  if (selectedDuration.value === 'custom') {
    customSeconds.value = normalizedCustomSeconds.value
  }

  emit('optimize', {
    mode: selectedMode.value,
    input: inputText.value.trim(),
    sceneType: selectedScene.value,
    duration: selectedDuration.value,
    ratio: selectedRatio.value,
    customSeconds: selectedDuration.value === 'custom' ? normalizedCustomSeconds.value : undefined,
    images: uploadedImages.value.length > 0 ? uploadedImages.value.map((img) => img.url) : undefined
  })
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <section class="input-section">
    <header class="studio-hero">
      <div class="mode-switch" aria-label="生成模式">
        <button type="button" class="mode-chip" :class="{ active: selectedMode === 'prompt' }" @click="setMode('prompt')">
          提示词优化
        </button>
        <button type="button" class="mode-chip" :class="{ active: selectedMode === 'image' }" @click="setMode('image')">
          图片生成
        </button>
      </div>

      <div class="hero-copy">
        <p class="hero-kicker">{{ selectedMode === 'prompt' ? 'Seedance Prompt' : 'GPT-image 2' }}</p>
        <h1>{{ selectedMode === 'prompt' ? '把一句灵感整理成可执行的视频提示词' : '直接生成一张可继续编辑的画面' }}</h1>
        <p>
          {{
            selectedMode === 'prompt'
              ? '补齐镜头、风格、节奏和画面细节，适合即梦、Seedance 等视频模型使用。'
              : '输入画面描述，选择比例，生成后可回填到输入框继续迭代。'
          }}
        </p>
      </div>
    </header>

    <div class="input-card" :class="{ focused: isFocused }">
      <div class="input-toolbar">
        <span class="toolbar-label">{{ selectedMode === 'prompt' ? '创意描述' : '画面描述' }}</span>
        <span class="input-count">{{ inputText.trim().length }} 字</span>
      </div>

      <textarea
        v-model="inputText"
        :placeholder="selectedMode === 'prompt'
          ? '描述你想创作的视频内容，例如：雨夜巷口，一名黑色风衣人物回头看向镜头，远处霓虹闪烁，镜头缓慢推进。'
          : '描述你想生成的画面，例如：电影感雨夜街口，霓虹反射在湿润地面上，一名黑色风衣人物回头看向镜头。'"
        class="prompt-textarea"
        rows="6"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="handleKeydown"
      />

      <div v-if="selectedMode === 'prompt' && uploadedImages.length > 0" class="image-preview-area">
        <div v-for="(img, idx) in uploadedImages" :key="img.id" class="preview-item">
          <img :src="img.url" alt="参考图预览" class="preview-img" />
          <span class="preview-badge">图 {{ idx + 1 }}</span>
          <button type="button" class="remove-btn" aria-label="移除参考图" @click="removeImage(img.id)">
            ×
          </button>
        </div>
      </div>

      <p v-if="selectedMode === 'prompt' && uploadError" class="upload-error">{{ uploadError }}</p>

      <div class="input-footer">
        <div class="footer-left">
          <input
            v-if="selectedMode === 'prompt'"
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*"
            hidden
            @change="handleFileChange"
          />

          <button v-if="selectedMode === 'prompt'" type="button" class="upload-btn" title="上传参考图" @click="triggerUpload">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>参考图</span>
          </button>

          <div v-if="selectedMode === 'image'" class="inline-ratio-select">
            <span class="inline-ratio-label">图片比例</span>
            <CustomSelect v-model="selectedRatio" :options="ratioOptionsList" compact />
          </div>

          <span class="input-hint">
            {{
              selectedMode === 'prompt'
                ? `Ctrl / Cmd + Enter 快速生成，最多 ${MAX_UPLOAD_IMAGES} 张参考图，每张不超过 5 MB`
                : 'Ctrl / Cmd + Enter 快速生成图片'
            }}
          </span>
        </div>

        <button
          type="button"
          class="send-btn"
          :class="{ disabled: !canSubmit || isGenerating }"
          :disabled="!canSubmit || isGenerating"
          :aria-label="selectedMode === 'prompt' ? '发送提示词优化请求' : '发送图片生成请求'"
          @click="handleSubmit"
        >
          <span v-if="!isGenerating" class="send-btn-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M21 3 10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="m21 3-7 18-4-7-7-4 18-7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span v-else class="spinner send-spinner"></span>
        </button>
      </div>
    </div>

    <div class="quick-prompts">
      <div class="quick-prompts-head">
        <span class="quick-label">{{ selectedMode === 'prompt' ? '灵感样例' : '画面样例' }}</span>
        <span class="quick-scroll-hint">点击即可填入输入框</span>
      </div>
      <div class="quick-prompts-scroll">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          type="button"
          class="quick-btn"
          @click="handleQuickPrompt(prompt)"
        >
          {{ prompt }}
        </button>
      </div>
    </div>

    <div v-if="selectedMode === 'prompt'" class="config-row">
      <div class="config-item">
        <label class="config-label">场景类型</label>
        <CustomSelect v-model="selectedScene" :options="sceneOptions" />
      </div>

      <div class="config-item">
        <label class="config-label">视频时长</label>
        <div class="duration-group">
          <CustomSelect v-model="selectedDuration" :options="durationOptionsList" />
          <Transition name="fade">
            <div v-if="selectedDuration === 'custom'" class="custom-duration-wrap">
              <input
                v-model.number="customSeconds"
                type="number"
                min="1"
                max="60"
                class="custom-duration-input"
                aria-label="自定义视频时长秒数"
              />
              <span class="custom-duration-unit">秒</span>
            </div>
          </Transition>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">画面比例</label>
        <CustomSelect v-model="selectedRatio" :options="ratioOptionsList" />
      </div>
    </div>

    <button
      v-if="selectedMode === 'prompt'"
      type="button"
      class="generate-btn"
      :class="{ disabled: !canSubmit || isGenerating }"
      :disabled="!canSubmit || isGenerating"
      @click="handleSubmit"
    >
      <span v-if="!isGenerating" class="btn-content">优化提示词</span>
      <span v-else class="btn-content">
        <span class="spinner"></span>
        <span>正在生成提示词</span>
      </span>
    </button>
  </section>
</template>

<style scoped>
.input-section {
  display: grid;
  gap: 18px;
}

.studio-hero {
  display: grid;
  gap: 20px;
}

.mode-switch {
  display: inline-flex;
  justify-self: center;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: oklch(0.985 0.008 98 / 0.74);
  box-shadow: var(--shadow-sm);
}

.mode-chip {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.24s var(--ease-out), color 0.24s var(--ease-out);
}

.mode-chip.active {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.hero-copy {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.hero-kicker {
  margin: 0;
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  max-width: 18ch;
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(36px, 6vw, 68px);
  font-weight: 850;
  line-height: 0.98;
  letter-spacing: 0;
  text-wrap: balance;
}

.hero-copy p:last-child {
  max-width: 58ch;
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.input-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  background: oklch(0.988 0.008 98 / 0.84);
  box-shadow: var(--shadow-md);
  transition: border-color 0.24s var(--ease-out), box-shadow 0.24s var(--ease-out), transform 0.24s var(--ease-out);
}

.input-card.focused {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.input-toolbar,
.input-footer,
.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-toolbar {
  justify-content: space-between;
}

.toolbar-label {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.input-count,
.input-hint,
.inline-ratio-label {
  color: var(--text-muted);
  font-size: 12px;
}

.prompt-textarea {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 188px;
  border: 0;
  outline: 0;
  resize: vertical;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 18px;
  font-weight: 520;
  line-height: 1.7;
}

.prompt-textarea::placeholder {
  color: oklch(0.58 0.012 96 / 0.86);
  font-weight: 450;
}

.image-preview-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.preview-item {
  position: relative;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 3px 7px;
  border-radius: 999px;
  background: oklch(0.18 0.012 96 / 0.72);
  color: var(--text-inverse);
  font-size: 11px;
  font-weight: 750;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: oklch(0.18 0.012 96 / 0.72);
  color: var(--text-inverse);
  cursor: pointer;
}

.upload-error {
  color: var(--danger);
  font-size: 12px;
  font-weight: 650;
}

.input-footer {
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.footer-left {
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-strong);
  color: var(--text-secondary);
  padding: 0 12px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.2s var(--ease-out), color 0.2s var(--ease-out);
}

.upload-btn:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}

.inline-ratio-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.send-btn {
  display: inline-grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--text-inverse);
  box-shadow: 0 12px 26px oklch(0.2 0.04 126 / 0.18);
  cursor: pointer;
  transition: transform 0.22s var(--ease-out), opacity 0.22s var(--ease-out), background 0.22s var(--ease-out);
}

.send-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  background: var(--accent-hover);
}

.send-btn.disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn-icon {
  display: inline-flex;
}

.quick-prompts {
  display: grid;
  gap: 10px;
}

.quick-prompts-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
}

.quick-label {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.quick-scroll-hint {
  color: var(--text-muted);
  font-size: 12px;
}

.quick-prompts-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 4px 8px;
  scrollbar-width: none;
}

.quick-prompts-scroll::-webkit-scrollbar {
  display: none;
}

.quick-btn {
  max-width: 330px;
  flex: 0 0 auto;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: oklch(0.985 0.008 98 / 0.72);
  color: var(--text-secondary);
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background 0.22s var(--ease-out), color 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}

.quick-btn:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
  transform: translateY(-1px);
}

.config-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.config-item {
  display: grid;
  gap: 8px;
}

.config-label {
  padding-left: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.duration-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-duration-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface);
}

.custom-duration-input {
  width: 48px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 750;
  text-align: center;
}

.custom-duration-unit {
  color: var(--text-muted);
  font-size: 12px;
}

.generate-btn {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-primary);
  color: var(--text-inverse);
  box-shadow: 0 16px 32px oklch(0.2 0.04 126 / 0.18);
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  transition: transform 0.22s var(--ease-out), background 0.22s var(--ease-out), opacity 0.22s var(--ease-out);
}

.generate-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  background: var(--accent-hover);
}

.generate-btn.disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid oklch(0.98 0.006 98 / 0.28);
  border-top-color: var(--text-inverse);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.send-spinner {
  width: 16px;
  height: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .input-section,
  .studio-hero,
  .input-card,
  .config-row,
  .quick-prompts {
    width: 100%;
    min-width: 0;
  }

  .hero-copy h1 {
    max-width: 12ch;
    font-size: clamp(34px, 10vw, 48px);
  }

  .hero-copy p:last-child {
    width: min(100%, 320px);
  }

  .input-card {
    padding: 18px;
    border-radius: 24px;
    overflow: hidden;
  }

  .prompt-textarea {
    min-height: 170px;
    font-size: 16px;
  }

  .input-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .footer-left {
    width: 100%;
    min-width: 0;
  }

  .input-hint {
    max-width: 100%;
    line-height: 1.55;
    white-space: normal;
  }

  .send-btn {
    align-self: flex-end;
  }

  .config-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .duration-group {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-prompts-head {
    align-items: baseline;
  }

  .quick-scroll-hint {
    display: none;
  }
}
</style>
