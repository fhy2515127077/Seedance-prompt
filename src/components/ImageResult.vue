<script setup lang="ts">
import type { GeneratedImageResult } from '../engine/promptEngine'

const props = defineProps<{
  result: GeneratedImageResult
  ratio: string
}>()

const emit = defineEmits<{
  edit: [prompt: string]
}>()

function filenameFromPrompt(prompt: string) {
  const safeName = prompt
    .trim()
    .slice(0, 24)
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeName || 'gpt-image2'}-${Date.now()}.png`
}

async function downloadImage() {
  const filename = filenameFromPrompt(props.result.prompt)

  try {
    const response = await fetch(props.result.imageUrl)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch {
    const link = document.createElement('a')
    link.href = props.result.imageUrl
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener'
    link.click()
  }
}

function editPrompt() {
  emit('edit', props.result.prompt)
}
</script>

<template>
  <section class="image-result-section">
    <header class="image-result-header">
      <div>
        <p class="image-kicker">Generated Image</p>
        <h2 class="image-result-title">GPT-image 2 生成结果</h2>
        <p class="image-result-desc">已按当前描述生成单张图片，可下载，也可以回到输入区继续调整提示词。</p>
      </div>
      <div class="image-result-tools">
        <span class="image-meta-tag">{{ ratio }}</span>
        <button type="button" class="image-action-btn" @click="downloadImage">下载图片</button>
        <button type="button" class="image-action-btn primary" @click="editPrompt">继续编辑</button>
      </div>
    </header>

    <article class="image-result-card">
      <div class="image-frame">
        <img :src="result.imageUrl" alt="生成图片结果" class="generated-image" />
      </div>
      <div class="image-copy">
        <div class="copy-block">
          <h3>原始描述</h3>
          <p>{{ result.prompt }}</p>
        </div>
        <div v-if="result.revisedPrompt" class="copy-block">
          <h3>模型修订提示词</h3>
          <p>{{ result.revisedPrompt }}</p>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.image-result-section {
  display: grid;
  gap: 18px;
  animation: fadeInUp 0.44s var(--ease-out);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.image-result-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.image-kicker {
  margin: 0 0 6px;
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.image-result-title {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: clamp(26px, 4vw, 38px);
  line-height: 1.05;
}

.image-result-desc {
  margin: 0;
  max-width: 54ch;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.image-result-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.image-action-btn,
.image-meta-tag {
  min-height: 36px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 800;
}

.image-action-btn {
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s var(--ease-out), color 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}

.image-action-btn:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
  transform: translateY(-1px);
}

.image-action-btn.primary {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.image-meta-tag {
  display: inline-flex;
  align-items: center;
  background: var(--accent-soft);
  color: var(--text-primary);
}

.image-result-card {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  background: oklch(0.988 0.008 98 / 0.84);
  box-shadow: var(--shadow-md);
}

.image-frame {
  display: grid;
  min-height: 420px;
  place-items: center;
  background: var(--surface-strong);
}

.generated-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-copy {
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 24px;
}

.copy-block {
  display: grid;
  gap: 8px;
}

.copy-block h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
}

.copy-block p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

@media (max-width: 820px) {
  .image-result-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .image-frame {
    min-height: 320px;
  }
}

@media (max-width: 640px) {
  .image-result-header,
  .image-result-tools {
    align-items: flex-start;
    justify-content: flex-start;
  }
}
</style>
