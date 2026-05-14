<script setup lang="ts">
// Decorative background only. Keep it isolated so large soft shapes never affect layout width.
</script>

<template>
  <div class="abstract-background" aria-hidden="true">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
</template>

<style scoped>
.abstract-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: clip;
  contain: paint;
  background: var(--bg-primary);
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(86px);
  opacity: 0.44;
  animation: floatOrb 24s infinite ease-in-out alternate;
  will-change: transform;
}

.orb-1 {
  width: min(70vw, 900px);
  height: min(70vw, 900px);
  top: -22%;
  left: -12%;
  background: radial-gradient(circle, oklch(0.86 0.055 86 / 0.8) 0%, transparent 70%);
  animation-duration: 25s;
}

.orb-2 {
  width: min(78vw, 960px);
  height: min(78vw, 960px);
  right: -24%;
  bottom: -32%;
  background: radial-gradient(circle, oklch(0.84 0.05 118 / 0.78) 0%, transparent 62%);
  animation-delay: -5s;
  animation-duration: 30s;
}

.orb-3 {
  width: min(56vw, 760px);
  height: min(56vw, 760px);
  top: 18%;
  left: 30%;
  background: radial-gradient(circle, oklch(0.88 0.042 76 / 0.58) 0%, transparent 72%);
  animation-delay: -10s;
  animation-duration: 22s;
}

@keyframes floatOrb {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(3vw, 4vh, 0) scale(1.04);
  }
  100% {
    transform: translate3d(-2vw, -3vh, 0) scale(0.96);
  }
}

@media (max-width: 720px), (prefers-reduced-motion: reduce) {
  .orb {
    animation: none;
    filter: blur(54px);
    opacity: 0.34;
  }

  .orb-1 {
    width: 360px;
    height: 360px;
  }

  .orb-2 {
    width: 340px;
    height: 340px;
    right: -170px;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    left: 34%;
  }
}
</style>
