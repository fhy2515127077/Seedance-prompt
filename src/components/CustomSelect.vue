<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  modelValue: string
  options: { label: string; value: string }[]
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function selectOption(value: string) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function getSelectedLabel() {
  const selected = props.options.find((opt) => opt.value === props.modelValue)
  return selected ? selected.label : ''
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="custom-select" ref="selectRef">
    <button
      type="button"
      class="select-trigger"
      :class="{ 'is-open': isOpen, compact: compact }"
      :aria-expanded="isOpen"
      @click="toggleOpen"
    >
      <span>{{ getSelectedLabel() }}</span>
      <svg class="chevron" :class="{ rotated: isOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <Transition name="fade-slide">
      <div v-if="isOpen" class="select-dropdown">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="select-option"
          :class="{ 'is-selected': modelValue === option.value }"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: oklch(0.985 0.008 98 / 0.82);
  color: var(--text-primary);
  padding: 0 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.22s var(--ease-out), border-color 0.22s var(--ease-out);
}

.select-trigger.compact {
  min-width: 132px;
  min-height: 38px;
  border-radius: var(--radius-md);
  padding: 0 12px;
  box-shadow: none;
  font-size: 12px;
}

.select-trigger:hover,
.select-trigger.is-open {
  border-color: var(--border-strong);
  background: var(--surface);
}

.chevron {
  flex: 0 0 auto;
  color: var(--text-muted);
  transition: transform 0.22s var(--ease-out);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 100;
  display: grid;
  width: 100%;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: oklch(0.99 0.006 98 / 0.96);
  box-shadow: var(--shadow-md);
}

.select-option {
  width: 100%;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  padding: 11px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  text-align: left;
  transition: background 0.18s var(--ease-out), color 0.18s var(--ease-out);
}

.select-option:hover {
  background: var(--surface-strong);
  color: var(--text-primary);
}

.select-option.is-selected {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s var(--ease-out), transform 0.18s var(--ease-out);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
