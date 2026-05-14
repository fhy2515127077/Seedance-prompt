<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const mouseX = ref(-1000)
const mouseY = ref(-1000)

let animationFrameId = 0
let targetX = -1000
let targetY = -1000
let isAnimating = false
let hidden = false

function animate() {
  mouseX.value += (targetX - mouseX.value) * 0.15
  mouseY.value += (targetY - mouseY.value) * 0.15

  const doneX = Math.abs(targetX - mouseX.value) < 0.2
  const doneY = Math.abs(targetY - mouseY.value) < 0.2

  if (doneX && doneY) {
    isAnimating = false
    animationFrameId = 0
    return
  }

  animationFrameId = requestAnimationFrame(animate)
}

function startAnimation() {
  if (isAnimating || hidden) return
  isAnimating = true
  animationFrameId = requestAnimationFrame(animate)
}

function updateMousePosition(e: MouseEvent) {
  targetX = e.clientX
  targetY = e.clientY
  startAnimation()
}

function handleVisibility() {
  hidden = document.hidden
  if (!hidden) {
    startAnimation()
    return
  }
  if (!animationFrameId) return
  cancelAnimationFrame(animationFrameId)
  animationFrameId = 0
  isAnimating = false
}

onMounted(() => {
  targetX = window.innerWidth / 2
  targetY = window.innerHeight / 2
  mouseX.value = targetX
  mouseY.value = targetY
  window.addEventListener('mousemove', updateMousePosition, { passive: true })
  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', updateMousePosition)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (!animationFrameId) return
  cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="mouse-aura" :style="{ transform: `translate(${mouseX}px, ${mouseY}px)` }"></div>
</template>

<style scoped>
.mouse-aura {
  position: fixed;
  top: -250px;
  left: -250px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(205, 230, 150, 0.95) 0%,
    rgba(205, 230, 150, 0.4) 40%,
    transparent 70%
  );
  filter: blur(38px);
  pointer-events: none;
  z-index: 0;
  will-change: transform;
}

@media (max-width: 1024px), (prefers-reduced-motion: reduce) {
  .mouse-aura {
    display: none;
  }
}
</style>
