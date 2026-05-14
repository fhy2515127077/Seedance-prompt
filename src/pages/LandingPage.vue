<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  type ComponentPublicInstance
} from 'vue'
import { useRouter } from 'vue-router'
import { withBasePath } from '../utils/asset'

const router = useRouter()
let revealRefs: HTMLElement[] = []
let revealObserver: IntersectionObserver | null = null
const heroVideos = [
  { src: withBasePath('/hero-videos/hero-01.mp4'), poster: withBasePath('/showcase/showcase-main.jpg') },
  { src: withBasePath('/hero-videos/hero-02.mp4'), poster: withBasePath('/showcase/showcase-ui.jpg') },
  { src: withBasePath('/hero-videos/hero-03.mp4'), poster: withBasePath('/showcase/showcase-case.jpg') },
  { src: withBasePath('/hero-videos/hero-04.mp4'), poster: withBasePath('/showcase/showcase-compare.jpg') },
  { src: withBasePath('/hero-videos/hero-05.mp4'), poster: withBasePath('/showcase/showcase-main.jpg') },
  { src: withBasePath('/hero-videos/hero-06.mp4'), poster: withBasePath('/showcase/showcase-ui.jpg') },
  { src: withBasePath('/hero-videos/hero-07.mp4'), poster: withBasePath('/showcase/showcase-case.jpg') },
  { src: withBasePath('/hero-videos/hero-08.mp4'), poster: withBasePath('/showcase/showcase-compare.jpg') },
  { src: withBasePath('/hero-videos/hero-09.mp4'), poster: withBasePath('/showcase/showcase-main.jpg') },
  { src: withBasePath('/hero-videos/hero-10.mp4'), poster: withBasePath('/showcase/showcase-ui.jpg') },
  { src: withBasePath('/hero-videos/hero-11.mp4'), poster: withBasePath('/showcase/showcase-case.jpg') }
]

const orbitRef = ref<HTMLDivElement | null>(null)
let bubbleRefs: HTMLDivElement[] = []
let heroVideoRefs: HTMLVideoElement[] = []
const conceptRef = ref<HTMLElement | null>(null)
const conceptPanelRef = ref<HTMLDivElement | null>(null)
const conceptProgress = ref(0)
const conceptActivated = ref(false)
const optimizedVideoPlayerRef = ref<HTMLVideoElement | null>(null)
const optimizedVideoSrc = withBasePath('/showcase/optimized-demo.mp4')
const isOptimizedVideoOpen = ref(false)
const optimizedFullVideoRef = ref<HTMLVideoElement | null>(null)
const isEditorialVideoOpen = ref(false)
const editorialFullVideoRef = ref<HTMLVideoElement | null>(null)
const editorialVideoSrc = withBasePath('/showcase/product-demo.mp4')
const detailShowcaseImages = {
  duration: withBasePath('/showcase/detail-duration.png'),
  scene: withBasePath('/showcase/showcase-ui.jpg'),
  gallery: withBasePath('/showcase/detail-gallery.png')
}

type BubbleCenter = {
  el: HTMLDivElement
  centerX: number
  centerY: number
}

type BubbleSize = 'lg' | 'md' | 'sm' | 'xs'
type OrbitBubble = {
  size: BubbleSize
  x: number
  y: number
  sizePx: number
  videoIndex: number
}

const orbitBubbles = ref<OrbitBubble[]>([])
const bubbleCenters = ref<BubbleCenter[]>([])
let orbitRectCache: DOMRect | null = null
let orbitMoveRaf = 0
let conceptProgressRaf = 0
let lastMouseX = 0
let lastMouseY = 0
let conceptInView = false
let lastScrollY = 0
let lastConceptWheelTs = 0
let lastConceptWheelDirection: -1 | 0 | 1 = 0
let heroObserver: IntersectionObserver | null = null
let conceptObserver: IntersectionObserver | null = null
let optimizedVideoObserver: IntersectionObserver | null = null
const heroVisible = ref(true)

function layoutOrbitBubbles(rect: DOMRect): OrbitBubble[] {
  const base = Math.min(rect.width, rect.height)
  const centerX = rect.width * 0.52
  const centerY = rect.height * 0.5
  const radiusX = rect.width * 0.46
  const radiusY = rect.height * 0.42
  const innerExcludeX = rect.width * 0.18
  const innerExcludeY = rect.height * 0.16

  const sizes: BubbleSize[] = [
    'lg',
    'lg',
    'md',
    'md',
    'md',
    'md',
    'md',
    'md',
    'sm',
    'sm',
    'sm',
    'sm',
    'sm',
    'xs',
    'xs',
    'xs'
  ]

  const sizeRange: Record<BubbleSize, [number, number]> = {
    lg: [0.36, 0.42],
    md: [0.28, 0.34],
    sm: [0.21, 0.26],
    xs: [0.16, 0.2]
  }

  const placed: OrbitBubble[] = []
  const maxAttempts = 260

  const randomInEllipse = () => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random())
      const x = centerX + Math.cos(angle) * radiusX * r
      const y = centerY + Math.sin(angle) * radiusY * r
      const ellipseCheck =
        Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2)
      const innerCheck =
        Math.pow((x - centerX) / innerExcludeX, 2) +
          Math.pow((y - centerY) / innerExcludeY, 2) <
        1
      if (ellipseCheck <= 0.98 && !innerCheck) {
        return { x, y }
      }
    }
    return null
  }

  sizes.sort((a, b) => (a === b ? 0 : a === 'lg' ? -1 : a === 'md' && b !== 'lg' ? -1 : 1))

  sizes.forEach((size, index) => {
    let attempt = 0
    let candidate: OrbitBubble | null = null
    const [minRatio, maxRatio] = sizeRange[size]
    const radiusPx = base * (minRatio + Math.random() * (maxRatio - minRatio))
    while (attempt < maxAttempts && !candidate) {
      const point = randomInEllipse()
      if (!point) break
      const isFree = placed.every((bubble) => {
        const dx = point.x - bubble.x
        const dy = point.y - bubble.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance > radiusPx / 2 + bubble.sizePx / 2 + 10
      })
      if (isFree) {
        candidate = {
          size,
          x: point.x,
          y: point.y,
          sizePx: radiusPx,
          videoIndex: (index + placed.length) % heroVideos.length
        }
      }
      attempt += 1
    }
    if (candidate) {
      placed.push(candidate)
    }
  })

  return placed.map((bubble) => ({
    ...bubble,
    x: (bubble.x / rect.width) * 100,
    y: (bubble.y / rect.height) * 100
  }))
}

function scrollToLandingSection() {
  const target = document.getElementById('landing-content')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function enterStudio() {
  router.push('/studio')
}

function registerBubble(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLDivElement)) return
  if (!bubbleRefs.includes(el)) {
    bubbleRefs.push(el)
  }
}

function registerHeroVideo(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLVideoElement)) return
  if (!heroVideoRefs.includes(el)) {
    heroVideoRefs.push(el)
  }
}

function registerReveal(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLElement)) return
  if (!revealRefs.includes(el)) {
    revealRefs.push(el)
  }
}

function registerConceptSection(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLElement)) return
  conceptRef.value = el
  registerReveal(el)
}

function registerConceptPanel(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLDivElement)) return
  conceptPanelRef.value = el
}

function registerOptimizedVideoPlayer(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLVideoElement)) return
  optimizedVideoPlayerRef.value = el
}

function openEditorialVideo() {
  isEditorialVideoOpen.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => {
    const video = editorialFullVideoRef.value
    if (!video) return
    const playPromise = video.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  })
}

function closeEditorialVideo() {
  isEditorialVideoOpen.value = false
  document.body.style.overflow = ''
  const video = editorialFullVideoRef.value
  if (!video) return
  video.pause()
}

function handleVideoPlaceholderKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  openEditorialVideo()
}

function openOptimizedVideo() {
  isOptimizedVideoOpen.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => {
    const video = optimizedFullVideoRef.value
    if (!video) return
    const playPromise = video.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  })
}

function closeOptimizedVideo() {
  isOptimizedVideoOpen.value = false
  document.body.style.overflow = ''
  const video = optimizedFullVideoRef.value
  if (!video) return
  video.pause()
}

function handleOptimizedVideoKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  openOptimizedVideo()
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (isEditorialVideoOpen.value) {
    closeEditorialVideo()
  } else if (isOptimizedVideoOpen.value) {
    closeOptimizedVideo()
  }
}

function handleDetailImageError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target) return
  if (target.dataset.fallbackApplied === '1') return
  target.dataset.fallbackApplied = '1'
  target.src = detailShowcaseImages.scene
}

function initOptimizedVideoObserver() {
  optimizedVideoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = optimizedVideoPlayerRef.value
        if (!video) return
        if (entry.isIntersecting) {
          const playPromise = video.play()
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {})
          }
        } else {
          video.pause()
        }
      })
    },
    { threshold: 0.2 }
  )
  if (optimizedVideoPlayerRef.value) {
    optimizedVideoObserver.observe(optimizedVideoPlayerRef.value)
  }
}

function isConceptPanelFullyVisible() {
  const panel = conceptPanelRef.value
  if (!panel) return false
  const rect = panel.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  return rect.top <= viewportHeight * 0.2 && rect.bottom >= viewportHeight * 0.8
}

function isConceptPanelInteractionReady() {
  const panel = conceptPanelRef.value
  if (!panel) return false
  const rect = panel.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const panelHeight = Math.max(rect.height, 1)
  const visibleTop = Math.max(rect.top, 0)
  const visibleBottom = Math.min(rect.bottom, viewportHeight)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)
  const visibleRatio = visibleHeight / panelHeight
  const panelCenterY = (rect.top + rect.bottom) / 2
  const centerDelta = Math.abs(panelCenterY - viewportHeight / 2)
  const inFocusBand = rect.top <= viewportHeight * 0.24 && rect.bottom >= viewportHeight * 0.76

  return visibleRatio >= 0.82 && centerDelta <= viewportHeight * 0.22 && inFocusBand
}

function updateBubbleCenters() {
  const orbit = orbitRef.value
  if (!orbit) return
  orbitRectCache = orbit.getBoundingClientRect()
  const rect = orbitRectCache
  bubbleCenters.value = bubbleRefs.map((bubble) => {
    const bubbleRect = bubble.getBoundingClientRect()
    return {
      el: bubble,
      centerX: bubbleRect.left - rect.left + bubbleRect.width / 2,
      centerY: bubbleRect.top - rect.top + bubbleRect.height / 2
    }
  })
}

function applyOrbitMove() {
  orbitMoveRaf = 0
  if (!orbitRectCache || bubbleCenters.value.length === 0) return
  const maxShift = 22
  const influenceRadius = 300

  bubbleCenters.value.forEach(({ el, centerX, centerY }) => {
    const dx = lastMouseX - centerX
    const dy = lastMouseY - centerY
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
    const strength =
      distance < influenceRadius ? maxShift * (1 - distance / influenceRadius) : 0
    const offsetX = (dx / distance) * strength
    const offsetY = (dy / distance) * strength

    el.style.setProperty('--tx', `${offsetX.toFixed(2)}px`)
    el.style.setProperty('--ty', `${offsetY.toFixed(2)}px`)
  })
}

function handleOrbitMove(event: MouseEvent) {
  if (!orbitRectCache) return
  lastMouseX = event.clientX - orbitRectCache.left
  lastMouseY = event.clientY - orbitRectCache.top
  if (orbitMoveRaf) return
  orbitMoveRaf = window.requestAnimationFrame(applyOrbitMove)
}

function handleOrbitLeave() {
  if (orbitMoveRaf) {
    window.cancelAnimationFrame(orbitMoveRaf)
    orbitMoveRaf = 0
  }
  bubbleRefs.forEach((bubble) => {
    bubble.style.setProperty('--tx', '0px')
    bubble.style.setProperty('--ty', '0px')
  })
}

function updateOrbitLayout() {
  const orbit = orbitRef.value
  if (!orbit) return
  const rect = orbit.getBoundingClientRect()
  orbitBubbles.value = layoutOrbitBubbles(rect)
  nextTick(() => {
    updateBubbleCenters()
  })
}

function scheduleConceptProgressUpdate() {
  if (conceptProgressRaf) return
  conceptProgressRaf = window.requestAnimationFrame(() => {
    conceptProgressRaf = 0
    updateConceptProgress()
  })
}

function syncHeroVideoPlayback() {
  const shouldPlay = heroVisible.value
  heroVideoRefs.forEach((video) => {
    if (shouldPlay) {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
      return
    }
    video.pause()
  })
}

function updateConceptProgress() {
  const section = conceptRef.value
  const panel = conceptPanelRef.value
  if (!section || !panel) return
  const now = performance.now()
  const recentlyWheelingUp =
    now - lastConceptWheelTs < 260 && lastConceptWheelDirection < 0
  const currentScrollY = window.scrollY
  const scrollingDown = currentScrollY >= lastScrollY
  lastScrollY = currentScrollY
  const sectionRect = section.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const panelVisible = isConceptPanelFullyVisible()
  const interactionReady = isConceptPanelInteractionReady()

  conceptActivated.value = interactionReady
  if (!interactionReady) {
    return
  }

  if (panelVisible && !recentlyWheelingUp && conceptProgress.value < 0.2) {
    conceptProgress.value = 0.2
  }

  // Fallback progression: if wheel-capture is skipped, sync progress with actual scroll depth.
  // Keeps the interaction deterministic and prevents "scrolled past but still hidden" states.
  const totalTrack = Math.max(sectionRect.height - viewportHeight * 0.55, 1)
  const enteredTrack = viewportHeight * 0.72 - sectionRect.top
  const scrollProgress = Math.min(1, Math.max(0, enteredTrack / (totalTrack * 1.18)))
  if (scrollingDown && !recentlyWheelingUp && scrollProgress > conceptProgress.value) {
    conceptProgress.value = scrollProgress
  }

  // Once this section leaves viewport bottom area, keep completed state.
  if (sectionRect.bottom < viewportHeight * 0.22) {
    if (conceptProgress.value < 1) {
      conceptProgress.value = 1
    }
  }

  // Trigger video playback is now handled by IntersectionObserver

}

function handleConceptWheel(event: WheelEvent) {
  const interactionReady = isConceptPanelInteractionReady()
  const section = conceptRef.value
  if (!section) return
  const sectionRect = section.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const inLockWindow =
    sectionRect.top <= viewportHeight * 0.82 && sectionRect.bottom >= viewportHeight * 0.18

  if (!interactionReady) {
    conceptActivated.value = false
    return
  }
  conceptActivated.value = true
  if (!inLockWindow) return
  if (!conceptInView && !isConceptPanelFullyVisible()) return

  const delta = event.deltaY
  const now = performance.now()
  const goingDown = delta > 0
  const goingUp = delta < 0
  lastConceptWheelTs = now
  lastConceptWheelDirection = goingDown ? 1 : goingUp ? -1 : 0

  if (goingDown && conceptProgress.value >= 1) {
    return
  }

  if (goingUp && conceptProgress.value <= 0) {
    return
  }

  if (!goingDown && !goingUp) {
    return
  }

  // Capture wheel while text transition is in progress (both directions).
  event.preventDefault()
  const progressDelta = goingUp ? delta / 280 : delta / 420
  const next = conceptProgress.value + progressDelta
  const clamped = Math.min(1, Math.max(0, next))

  conceptProgress.value = clamped
}

onMounted(() => {
  const orbit = orbitRef.value
  if (orbit) {
    orbit.addEventListener('mousemove', handleOrbitMove)
    orbit.addEventListener('mouseleave', handleOrbitLeave)
    updateOrbitLayout()
  }
  window.addEventListener('resize', updateOrbitLayout)
  window.addEventListener('resize', updateBubbleCenters)
  window.addEventListener('resize', scheduleConceptProgressUpdate)

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
        }
      })
    },
    { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
  )

  revealRefs.forEach((section) => revealObserver?.observe(section))
  if (conceptRef.value) {
    conceptObserver = new IntersectionObserver(
      (entries) => {
        conceptInView = entries.some((entry) => entry.isIntersecting)
      },
      { threshold: 0.22, rootMargin: '-10% 0px -10% 0px' }
    )
    conceptObserver.observe(conceptRef.value)
  }

  heroObserver = new IntersectionObserver(
    (entries) => {
      heroVisible.value = entries.some((entry) => entry.isIntersecting)
      syncHeroVideoPlayback()
    },
    { threshold: 0.08 }
  )
  if (orbitRef.value) {
    heroObserver.observe(orbitRef.value)
  }

  updateConceptProgress()
  syncHeroVideoPlayback()
  initOptimizedVideoObserver()
  window.addEventListener('scroll', scheduleConceptProgressUpdate, { passive: true })
  window.addEventListener('wheel', handleConceptWheel, { passive: false })
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  const orbit = orbitRef.value
  if (orbit) {
    orbit.removeEventListener('mousemove', handleOrbitMove)
    orbit.removeEventListener('mouseleave', handleOrbitLeave)
  }
  if (orbitMoveRaf) {
    window.cancelAnimationFrame(orbitMoveRaf)
    orbitMoveRaf = 0
  }
  if (conceptProgressRaf) {
    window.cancelAnimationFrame(conceptProgressRaf)
    conceptProgressRaf = 0
  }
  window.removeEventListener('resize', updateOrbitLayout)
  window.removeEventListener('resize', updateBubbleCenters)
  window.removeEventListener('resize', scheduleConceptProgressUpdate)
  window.removeEventListener('scroll', scheduleConceptProgressUpdate)
  window.removeEventListener('wheel', handleConceptWheel)
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.body.style.overflow = ''
  revealObserver?.disconnect()
  heroObserver?.disconnect()
  conceptObserver?.disconnect()
  optimizedVideoObserver?.disconnect()
  revealObserver = null
  heroObserver = null
  conceptObserver = null
  optimizedVideoObserver = null
})

// 娉ㄦ剰: bubbleRefs / heroVideoRefs / revealRefs 宸叉敼涓洪潪鍝嶅簲寮忔櫘閫氭暟缁勶紝
// 涓嶅啀闇€瑕?onBeforeUpdate 閽╁瓙鏉ユ竻绌哄畠浠€?</script>

<template>
  <div class="view-wrapper">
    <section class="hero-section">
      <div class="hero-orbit" ref="orbitRef">
        <div
          v-for="(bubble, index) in orbitBubbles"
          :key="`orbit-${index}`"
          class="orbit-node"
          :class="`bubble-${bubble.size}`"
          :style="{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,

            width: `${bubble.sizePx}px`,
            height: `${bubble.sizePx}px`
          }"
          :ref="registerBubble"
        >
          <div class="orbit-bubble orbit-float" :class="`float-${String.fromCharCode(97 + (index % 10))}`">
            <video
              autoplay
              muted
              loop
              playsinline
              preload="none"
              :ref="registerHeroVideo"
              :poster="heroVideos[bubble.videoIndex].poster"
            >
              <source :src="heroVideos[bubble.videoIndex].src" type="video/mp4" />
            </video>
          </div>
        </div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <p class="hero-eyebrow">Seedance 2.0 - Prompt Studio</p>
          <h1 class="hero-title">SeedancePrompt</h1>
          <p class="hero-subtitle">Turn one rough idea into an executable shot script.</p>
          <div class="hero-actions">
            <button type="button" class="hero-cta" @click="enterStudio">Start Creating</button>
            <button type="button" class="hero-ghost" @click="scrollToLandingSection">Learn More</button>
          </div>
        </div>
      </div>
    </section>

    <section class="content-band" id="landing-content">
      <div class="editorial-stage reveal-section" :ref="registerReveal">
        <div class="editorial-copy">
          <div class="editorial-mark">Seedance / Product Story</div>
          <p class="editorial-kicker">Prompt Direction System</p>
          <div class="editorial-clean-copy">
            <div class="editorial-clean-en">
              <h2 class="editorial-title">Turn one rough idea into an executable shot plan.</h2>
              <p class="editorial-desc">
                SeedancePrompt is not simple copy polishing. It restructures style, lens, action, pacing, and mood into production-ready shot language.
              </p>
              <div class="editorial-points">
                <p>Start with one rough idea and complete the camera narrative automatically.</p>
                <p>Export reusable output for generation tools and storyboard collaboration.</p>
                <p>Reduce trial-and-error and get closer to target visuals from the first run.</p>
              </div>
            </div>
            <h2 class="editorial-title">把一句灵感，直接翻译成可执行的镜头计划。</h2>
            <p class="editorial-desc">
              SeedancePrompt 不只是润色文字，而是把风格、镜头、动作、节奏与情绪拆成可落地的拍摄语言，帮助个人与团队快速进入创作状态。
            </p>
            <div class="editorial-points">
              <p>输入模糊想法，自动补齐镜头结构与叙事节奏。</p>
              <p>输出可直接复用到生成工具与分镜协作流程。</p>
              <p>减少反复试错，让第一版结果更接近目标画面。</p>
            </div>
          </div>
          <div class="editorial-tags">
            <span>Prompt to Shot</span>
            <span>Narrative Control</span>
            <span>Production Ready</span>
          </div>
        </div>

        <div class="editorial-video">
          <div class="editorial-video-frame">
            <video
              class="editorial-video-media"
              autoplay
              muted
              loop
              playsinline
              :src="editorialVideoSrc"
            ></video>
            <div class="video-glow"></div>
            <div
              class="video-placeholder"
              role="button"
              tabindex="0"
              @click="openEditorialVideo"
              @keydown="handleVideoPlaceholderKeydown"
            >
              <div class="video-play">
                <span class="play-triangle"></span>
              </div>
              <div class="video-copy">
                <div class="video-copy-clean">
                  <div class="video-copy-en">
                    <p>Play full demo</p>
                    <h3>Open the complete product walkthrough in one click</h3>
                    <span>Click this card to watch the full video and review the full interaction flow.</span>
                  </div>
                  <p>点击播放完整版</p>
                  <h3>产品演示窗口，支持一键全屏观看</h3>
                  <span>点击该区域即可打开完整视频，查看完整交互流程与结果展示。</span>
                </div>
              </div>
              <button type="button" class="video-full-btn">Play Full Demo</button>
            </div>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <Transition name="video-modal">
          <div
            v-if="isEditorialVideoOpen"
            class="video-modal-backdrop"
            @click.self="closeEditorialVideo"
          >
            <div class="video-modal-dialog">
              <button type="button" class="video-modal-close" @click="closeEditorialVideo">
                Close
              </button>
              <video
                ref="editorialFullVideoRef"
                class="video-modal-player"
                controls
                playsinline
                preload="metadata"
                :src="editorialVideoSrc"
              ></video>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="video-modal">
          <div
            v-if="isOptimizedVideoOpen"
            class="video-modal-backdrop"
            @click.self="closeOptimizedVideo"
          >
            <div class="video-modal-dialog">
              <button type="button" class="video-modal-close" @click="closeOptimizedVideo">
                Close
              </button>
              <video
                ref="optimizedFullVideoRef"
                class="video-modal-player"
                controls
                playsinline
                preload="metadata"
                :src="optimizedVideoSrc"
              ></video>
            </div>
          </div>
        </Transition>
      </Teleport>

      <section class="concept-scroll reveal-section" :ref="registerConceptSection">
        <div class="concept-scroll-sticky">
          <div class="concept-scroll-head">
            <p class="concept-scroll-kicker">Prompt Expansion</p>
            <h3 class="concept-scroll-title">One line in, full narrative shot script out.</h3>
          </div>
          <div
            class="concept-scroll-panel"
            :style="{
              '--concept-progress': conceptProgress.toFixed(3)
            }"
            :ref="registerConceptPanel"
          >
            <div class="concept-short">
              <span class="concept-label">Raw Input</span>
              <p>A short film where a sleepy kitten dreams of a giant mouse.</p>
            </div>
            <div class="concept-long">
              <span class="concept-label">Optimized Output</span>
              <div class="concept-long-body">
                <p>
                  This is a 30-second narrative short. The first part shows a warm, healing afternoon nap in realistic detail. The middle transitions into a surreal dream with extreme scale contrast and pressure. The final part returns to reality and closes the emotional loop through expression changes.
                </p>

                <h4>Part 1: Real-world sleep (0-10s) | Baseline generation</h4>
                <p>
                  0-5s: 16:9 close shot of a small orange kitten curled on a sunlit window cushion. Subtle breathing motion, soft bokeh background, floating dust particles. 5-10s: macro view of the kitten face, whisker twitch, closed eyes, tiny paw scratching in sleep. Audio: gentle purr, distant birds, soft lullaby piano. Transition: blur + ripple distortion, warm orange shifting to deep blue.
                </p>

                <h4>Part 2: Giant mouse dream (10-25s) | Escalation</h4>
                <p>
                  10-15s: camera pulls back; the kitten stands in a vast misty wasteland. Ground shakes, giant shadow covers frame. 15-25s: low-angle reveal of a hill-sized gray mouse with glowing red eyes and heavy whiskers. Each step cracks the ground. The kitten looks tiny below it, back arched, fur raised. Audio: heavy foot hits, low monster growl, rising orchestral tension. Transition: giant mouse lunges into lens, hard cut to reality.
                </p>

                <h4>Part 3: Wake and return (25-30s) | Resolution</h4>
                <p>
                  25-30s: kitten jolts awake, body pops up, fast breathing, alert ears. It scans the warm living room, confirms safety, then lies down again with slight lingering confusion. Audio: short sharp meow, music stops, returns to calm afternoon ambience. Transition: fade to black.
                </p>
              </div>
            </div>
            
            <div class="concept-progress-rail" style="position: absolute; left: 40px; right: 40px; bottom: 28px; height: 4px; border-radius: 999px; overflow: hidden; max-width: 1320px; margin: 0 auto;">
              <span class="concept-progress-fill" :style="{ transform: `scaleX(${conceptProgress})` }"></span>
            </div>
          </div>
          
        </div>
      </section>

      <section class="optimized-showcase-section reveal-section" :ref="registerReveal" style="display: flex; justify-content: center; padding: 0 0 100px; width: min(1360px, 95vw); margin: -40px auto 0; position: relative; z-index: 5;">
        <div class="optimized-showcase" style="width: 100%;">
          <div class="optimized-copy">
            <h3 class="optimized-showcase-title">经过提示词优化后的视频效果</h3>
            <p class="optimized-showcase-desc">
              这里用于放置“优化后”的最终演示视频。滑动至该区域即可自动播放体验。
            </p>
          </div>
          <div
            class="optimized-video-wrapper"
            role="button"
            tabindex="0"
            @click="openOptimizedVideo"
            @keydown="handleOptimizedVideoKeydown"
          >
            <video
              class="optimized-video-media"
              loop
              muted
              playsinline
              :ref="registerOptimizedVideoPlayer"
              :src="optimizedVideoSrc"
            ></video>
            <div class="optimized-overlay">
              <span class="optimized-play-icon"></span>
            </div>
          </div>
        </div>
      </section>
      <section class="detail-showcase reveal-section" :ref="registerReveal">
        <div class="detail-showcase-head">
          <p class="detail-showcase-kicker">Detail Views</p>
          <h3 class="detail-showcase-title">页面详情展示</h3>
          <p class="detail-showcase-desc">这里用于展示参数面板与案例卡片细节，方便用户快速理解界面能力。</p>
        </div>
        <div class="detail-showcase-grid">
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.duration"
              alt="时长选项展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>时长选项</strong>
              <span>短片 / 中等 / 长片 / 超长 / 自定义</span>
            </div>
          </article>
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.scene"
              alt="场景类型展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>场景类型</strong>
              <span>自动识别 / 电商广告 / 仙侠奇幻 / 短剧对白 / 科普教学</span>
            </div>
          </article>
          <article class="detail-card detail-card-wide">
            <img
              class="detail-media"
              :src="detailShowcaseImages.gallery"
              alt="案例卡片展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>案例卡片</strong>
              <span>封面、文案、标签、作者与来源信息一体展示</span>
            </div>
          </article>
        </div>
      </section>

      <div class="intro-section reveal-section" :ref="registerReveal">
        <div class="intro-grid">
          <div class="intro-card">
            <p class="intro-label">Vision</p>
            <h3 class="intro-title">Turn inspiration into deliverable shot language</h3>
            <p class="intro-desc">Creators should move from idea to reusable prompt script in one clean pass.</p>
          </div>
          <div class="intro-card">
            <p class="intro-label">Story</p>
            <h3 class="intro-title">From one sentence to full script</h3>
            <p class="intro-desc">SeedancePrompt fills motion, lens, rhythm, and sound to produce near-shoot-ready boards.</p>
          </div>
          <div class="intro-card">
            <p class="intro-label">Cases</p>
            <h3 class="intro-title">Complete examples and reusable results</h3>
            <p class="intro-desc">Use the gallery to inspect structure and build your own repeatable creation templates.</p>
          </div>
        </div>
        <div class="intro-actions">
          <button type="button" class="intro-cta" @click="router.push('/discover')">Open Gallery</button>
          <button type="button" class="intro-ghost" @click="enterStudio">Open Studio</button>
        </div>
      </div>

    </section>
  </div>
</template>

<style scoped>
.view-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
}

.hero-section {
  width: 100%;
  padding: 20px 0 0;
}

.hero-orbit {
  position: relative;
  width: min(2000px, 100vw);
  height: clamp(540px, 72vw, 900px);
  margin: 0 auto;
  border-radius: 999px;
  overflow: hidden;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.12), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.08), transparent 40%),
    radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.04), transparent 45%),
    linear-gradient(140deg, rgba(5, 5, 5, 0.96), rgba(16, 16, 16, 0.6));
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.16);
}

.orbit-node {
  position: absolute;
  transform: translate(-50%, -50%) translate3d(var(--tx, 0px), var(--ty, 0px), 0px);
  transition: transform 0.35s ease;
  will-change: transform;
}

.orbit-node:hover {
  transform: translate(-50%, -50%) translate3d(var(--tx, 0px), var(--ty, 0px), 0px) scale(1.09);
}

.orbit-bubble {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: box-shadow 0.35s ease;
  background: rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  contain: layout paint;
}

.orbit-node:hover .orbit-bubble {
  box-shadow: 0 34px 72px rgba(0, 0, 0, 0.5);
}

.orbit-float {
  width: 100%;
  height: 100%;
  animation-name: floatSlow;
  animation-duration: 14s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

.orbit-float video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}


.float-a { animation-name: floatA; animation-duration: 12s; }
.float-b { animation-name: floatB; animation-duration: 10s; }
.float-c { animation-name: floatC; animation-duration: 14s; }
.float-d { animation-name: floatD; animation-duration: 11s; }
.float-e { animation-name: floatE; animation-duration: 13s; }
.float-f { animation-name: floatF; animation-duration: 16s; }
.float-g { animation-name: floatG; animation-duration: 15s; }
.float-h { animation-name: floatH; animation-duration: 12s; }
.float-i { animation-name: floatI; animation-duration: 14s; }
.float-j { animation-name: floatJ; animation-duration: 18s; }

@keyframes floatSlow {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -8px, 0); }
}

@keyframes floatA {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -10px, 0); }
}
@keyframes floatB {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(6px, -8px, 0); }
}
@keyframes floatC {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(8px, 6px, 0); }
}
@keyframes floatD {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-8px, 6px, 0); }
}
@keyframes floatE {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-6px, -10px, 0); }
}
@keyframes floatF {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(10px, -6px, 0); }
}
@keyframes floatG {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-10px, -4px, 0); }
}
@keyframes floatH {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(6px, 10px, 0); }
}
@keyframes floatI {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(10px, 8px, 0); }
}
@keyframes floatJ {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-6px, 6px, 0); }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(5, 5, 5, 0.82), rgba(5, 5, 5, 0.2) 45%, rgba(5, 5, 5, 0.9)),
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1), transparent 45%);
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 5vw, 48px);
  color: #fff;
  text-align: center;
  gap: 12px;
  z-index: 2;
}

.hero-eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.7;
}

.hero-title {
  font-size: clamp(56px, 7vw, 128px);
  font-weight: 600;
  letter-spacing: -0.06em;
  color: #ffffff;
  line-height: 0.9;
  margin: 0;
}

.hero-subtitle {
  margin: 0;
  max-width: 36ch;
  font-size: clamp(15px, 2vw, 20px);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.hero-cta {
  border: none;
  background: #ffffff;
  color: #111;
  font-weight: 700;
  padding: 12px 22px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.hero-ghost {
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: #fff;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.8);
}

.content-band {
  width: 100%;
  margin: -64px 0 96px;
  padding: 126px 0 56px;
  position: relative;
  z-index: 4;
}

.content-band::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(1320px, 96vw);
  height: 260px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.58), transparent 60%),
    radial-gradient(circle at 18% 26%, rgba(214, 232, 156, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(243, 243, 241, 0.02), rgba(243, 243, 241, 0.24));
  filter: blur(22px);
  pointer-events: none;
  z-index: -1;
}

.reveal-section {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-section.is-revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.editorial-stage {
  width: min(1360px, 95vw);
  margin: 0 auto 80px;
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(400px, 0.78fr);
  gap: 34px;
  align-items: start;
}

.editorial-copy {
  position: relative;
  padding: 56px 56px 52px;
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.18)),
    radial-gradient(circle at 0% 0%, rgba(214, 232, 156, 0.1), transparent 40%);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.035),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
  overflow: hidden;
  transition:
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.editorial-copy::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(214, 232, 156, 0.12), transparent 70%);
  filter: blur(18px);
  pointer-events: none;
}

.editorial-mark {
  margin-bottom: 16px;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.28);
}

.editorial-kicker {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.42);
}

.editorial-copy > .editorial-title,
.editorial-copy > .editorial-desc,
.editorial-copy > .editorial-points {
  display: none;
}

.editorial-clean-copy > :not(.editorial-clean-en) {
  display: none;
}

.editorial-title {
  margin: 0;
  max-width: none;
  font-size: clamp(32px, 3.1vw, 46px);
  line-height: 1.08;
  letter-spacing: -0.05em;
  color: #111;
  text-wrap: pretty;
}

.editorial-desc {
  margin: 26px 0 0;
  max-width: 60ch;
  font-size: 15px;
  line-height: 1.9;
  color: rgba(17, 17, 17, 0.6);
}

.editorial-points {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.editorial-points p {
  margin: 0;
  padding-left: 16px;
  position: relative;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(17, 17, 17, 0.68);
}

.editorial-points p::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(132, 160, 52, 0.84);
}

.editorial-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.editorial-tags span {
  padding: 9px 13px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.52);
  background: rgba(255, 255, 255, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.editorial-video {
  display: grid;
  gap: 18px;
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
  align-self: start;
}

.editorial-video-frame {
  position: relative;
  min-height: 520px;
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(214, 232, 156, 0.08), transparent 28%),
    linear-gradient(155deg, rgba(18, 18, 18, 0.96), rgba(38, 38, 38, 0.88));
  box-shadow:
    0 20px 54px rgba(0, 0, 0, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition:
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.editorial-video-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.96) contrast(0.96) brightness(0.78);
}

.video-glow {
  position: absolute;
  inset: auto auto -60px -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(214, 232, 156, 0.22);
  filter: blur(40px);
}

.video-placeholder {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 30px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(10, 10, 10, 0.08), rgba(10, 10, 10, 0.22) 56%, rgba(10, 10, 10, 0.52)),
    linear-gradient(90deg, rgba(10, 10, 10, 0.14), transparent 42%);
  cursor: pointer;
}

.video-play {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.28s ease, background 0.28s ease;
}

.editorial-video-frame:hover .video-play {
  transform: scale(1.04);
  background: rgba(255, 255, 255, 0.18);
}

.play-triangle {
  width: 0;
  height: 0;
  margin-left: 4px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid #ffffff;
}

.video-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 24ch;
}

.video-copy > :not(.video-copy-clean) {
  display: none;
}

.video-copy-clean > :not(.video-copy-en) {
  display: none;
}

.video-copy p {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.54);
}

.video-copy h3 {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.14;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.video-copy span {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.66);
}

.video-full-btn {
  align-self: flex-start;
  margin-top: 14px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.video-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(10, 10, 10, 0.72);
  display: grid;
  place-items: center;
  padding: 22px;
}

.video-modal-dialog {
  width: min(1200px, 92vw);
  position: relative;
  display: grid;
  gap: 10px;
}

.video-modal-player {
  width: 100%;
  max-height: min(82vh, 760px);
  background: #000;
  border-radius: 14px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
}

.video-modal-close {
  justify-self: end;
  border: 1px solid rgba(255, 255, 255, 0.42);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.video-modal-enter-active,
.video-modal-leave-active {
  transition: opacity 0.22s ease;
}

.video-modal-enter-from,
.video-modal-leave-to {
  opacity: 0;
}

.concept-scroll {
  width: min(1360px, 95vw);
  min-height: 132vh;
  margin: 0 auto;
  position: relative;
}

.concept-scroll-sticky {
  position: sticky;
  top: 86px;
  display: grid;
  gap: 26px;
}

.concept-scroll-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.concept-scroll-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.42);
}

.concept-scroll-title {
  margin: 0;
  max-width: 34ch;
  font-size: clamp(29px, 2.35vw, 38px);
  line-height: 1.08;
  letter-spacing: -0.045em;
  color: #111;
  text-wrap: pretty;
}

.concept-scroll-panel {
  --concept-progress: 0;
  position: relative;
  min-height: 520px;
  padding: 38px 40px 54px;
  display: grid;
  grid-template-columns: minmax(320px, 0.48fr) minmax(0, 1.52fr);
  align-items: start;
  gap: 56px;
  border-radius: 34px;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.18)),
    radial-gradient(circle at 16% 18%, rgba(214, 232, 156, 0.14), transparent 36%),
    radial-gradient(circle at 82% 22%, rgba(255, 255, 255, 0.54), transparent 28%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.56);
  box-shadow:
    0 24px 56px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.concept-scroll-panel::before {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.06)),
    linear-gradient(135deg, rgba(17, 17, 17, 0.02), rgba(17, 17, 17, 0.08));
  pointer-events: none;
}

.concept-short,
.concept-long {
  position: relative;
  z-index: 1;
}

.concept-label {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.52);
  background: rgba(255, 255, 255, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.concept-short {
  align-self: start;
  max-width: none;
  opacity: clamp(0.06, calc(1 - var(--concept-progress) * 1.32), 1);
  transform: translate3d(
      calc(var(--concept-progress) * -42px),
      calc(var(--concept-progress) * -20px),
      0
    )
    scale(calc(1 - var(--concept-progress) * 0.06));
  filter: blur(calc(var(--concept-progress) * 1.8px));
  transition: opacity 0.16s linear, transform 0.16s linear, filter 0.16s linear;
}

.concept-short p {
  margin: 0;
  font-size: clamp(32px, 2.9vw, 44px);
  line-height: 1.04;
  letter-spacing: -0.05em;
  color: #111;
  text-wrap: pretty;
}

.concept-long {
  align-self: end;
  justify-self: end;
  width: min(100%, 92ch);
  margin-top: 0;
  padding-top: 84px;
  opacity: clamp(0.08, calc(1 - var(--video-reveal-progress, 0) * 1.3), 1);
  transform: translate3d(0, calc(var(--video-reveal-progress, 0) * -14px), 0);
  transition: opacity 0.2s linear, transform 0.2s linear;
}

.concept-long-body {
  opacity: clamp(0, calc((var(--concept-progress) - 0.04) * 1.46), 1);
  transform: translate3d(
    calc(48px - var(--concept-progress) * 48px),
    calc(28px - var(--concept-progress) * 28px),
    0
  );
  filter: blur(calc((1 - var(--concept-progress)) * 2.2px));
  transition: opacity 0.16s linear, transform 0.16s linear, filter 0.16s linear;
}

.concept-long-body h4 {
  margin: 18px 0 8px;
  font-size: 17px;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: rgba(17, 17, 17, 0.92);
}

.concept-long-body p {
  margin: 0 0 12px;
  font-size: 16px;
  line-height: 1.78;
  letter-spacing: -0.008em;
  color: rgba(17, 17, 17, 0.85);
  text-align: left;
  text-wrap: pretty;
}

.concept-long-body p:first-child {
  font-size: 17px;
  line-height: 1.8;
  color: rgba(17, 17, 17, 0.9);
}

.concept-long-body p:last-child {
  margin-bottom: 0;
}

.concept-long-body {
  mask-image: none;
}

.concept-video-stage {
  position: absolute;
  left: 40px;
  right: 40px;
  top: 84px;
  bottom: 46px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 14px;
  pointer-events: none;
  opacity: clamp(0, calc((var(--video-reveal-progress, 0) - 0.06) * 1.2), 1);
  transform: translate3d(0, calc(56px - var(--video-reveal-progress, 0) * 56px), 0) scale(calc(0.94 + var(--video-reveal-progress, 0) * 0.06));
  transition: opacity 0.16s linear, transform 0.16s linear;
}

.concept-video-stage.is-active {
  pointer-events: auto;
}

.concept-video-frame {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.9);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.concept-video-player {
  width: 100%;
  height: clamp(260px, 36vw, 460px);
  display: block;
  object-fit: cover;
  background: #090909;
}

.editorial-stage,
.concept-scroll,
.intro-section {
  content-visibility: auto;
  contain-intrinsic-size: 900px;
}

.concept-progress-rail {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 28px;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.08);
}

.concept-progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(185, 215, 90, 0.95), rgba(17, 17, 17, 0.72));
}

.concept-next-cta,
.optimized-video-section {
  display: none !important;
}

.concept-next-cta {
  width: min(1360px, 95vw);
  margin: -20px auto 70px;
  display: flex;
  justify-content: center;
}

.concept-next-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(17, 17, 17, 0.14);
  background: rgba(255, 255, 255, 0.48);
  color: rgba(17, 17, 17, 0.82);
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.concept-next-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  animation: arrowDrop 1.2s ease-in-out infinite;
}

@keyframes arrowDrop {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  50% {
    transform: translateY(3px);
    opacity: 1;
  }
}

.optimized-video-section {
  --video-reveal-progress: 0;
  width: min(1360px, 95vw);
  margin: 0 auto 100px;
  display: grid;
  gap: 18px;
  opacity: calc(0.34 + var(--video-reveal-progress) * 0.66);
  transform: translate3d(0, calc(56px - var(--video-reveal-progress) * 56px), 0);
  transition: opacity 0.16s linear, transform 0.16s linear;
}

.optimized-video-head {
  display: grid;
  gap: 10px;
  opacity: calc(0.22 + var(--video-reveal-progress) * 0.78);
  transform: translate3d(0, calc(28px - var(--video-reveal-progress) * 28px), 0);
  transition: opacity 0.16s linear, transform 0.16s linear;
}

.optimized-video-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.44);
}

.optimized-video-title {
  margin: 0;
  font-size: clamp(28px, 2.5vw, 36px);
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: #111;
}

.optimized-video-desc {
  margin: 0;
  max-width: 72ch;
  font-size: 15px;
  line-height: 1.85;
  color: rgba(17, 17, 17, 0.62);
}

.optimized-video-frame {
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.46);
  box-shadow:
    0 22px 46px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transform: translate3d(0, calc(70px - var(--video-reveal-progress) * 70px), 0);
  opacity: calc(0.24 + var(--video-reveal-progress) * 0.76);
  transition: opacity 0.16s linear, transform 0.16s linear;
  pointer-events: auto;
}

.optimized-video-player {
  width: 100%;
  min-height: min(48vw, 620px);
  max-height: 72vh;
  display: block;
  object-fit: cover;
  background: #0b0b0b;
}

.detail-showcase {
  width: min(1360px, 95vw);
  margin: 0 auto 56px;
  display: grid;
  gap: 20px;
}

.detail-showcase-head {
  display: grid;
  gap: 10px;
}

.detail-showcase-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.44);
}

.detail-showcase-title {
  margin: 0;
  font-size: clamp(28px, 2.5vw, 36px);
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #111;
}

.detail-showcase-desc {
  margin: 0;
  max-width: 58ch;
  font-size: 15px;
  line-height: 1.85;
  color: rgba(17, 17, 17, 0.62);
}

.detail-showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.detail-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.45);
  box-shadow:
    0 18px 38px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.detail-card-small {
  min-height: 330px;
}

.detail-card-wide {
  grid-column: 1 / -1;
  min-height: 420px;
}

.detail-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: linear-gradient(135deg, rgba(240, 242, 236, 0.8), rgba(222, 228, 206, 0.8));
}

.detail-caption {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(12, 12, 12, 0.54);
  color: rgba(255, 255, 255, 0.92);
}

.detail-caption strong {
  font-size: 14px;
  letter-spacing: 0.01em;
}

.detail-caption span {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.76);
}

.image-badge {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.42);
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.34);
}

.image-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 26ch;
}

.image-copy strong {
  font-size: 18px;
  color: #111;
}

.image-copy span {
  font-size: 13px;
  line-height: 1.75;
  color: rgba(17, 17, 17, 0.6);
}

.intro-section {
  width: min(1360px, 95vw);
  margin: 0 auto 28px;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.intro-card {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 24px;
  padding: 28px 28px;
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  transition:
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.intro-label {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.5);
  margin: 0 0 10px;
}

.intro-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--text-primary);
  line-height: 1.14;
  letter-spacing: -0.03em;
  min-height: 0;
  text-wrap: pretty;
}

.intro-desc {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
  max-width: 34ch;
}

.intro-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 24px 42px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.46);
  border-color: rgba(255, 255, 255, 0.72);
}

.intro-actions {
  display: flex;
  gap: 14px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.intro-cta {
  border: none;
  background: #111;
  color: #fff;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
}

.intro-ghost {
  border: 1px solid rgba(17, 17, 17, 0.2);
  background: transparent;
  color: #111;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
}

.reveal-section.is-revealed .editorial-copy,
.reveal-section.is-revealed .editorial-video,
.reveal-section.is-revealed .intro-card {
  animation: softRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.reveal-section.is-revealed .editorial-video,
.reveal-section.is-revealed .atmosphere-montage,
.reveal-section.is-revealed .intro-card:nth-child(2),
.reveal-section.is-revealed .project-card:nth-child(2),
.reveal-section.is-revealed .step-item:nth-child(2) {
  animation-delay: 0.08s;
}

.reveal-section.is-revealed .intro-card:nth-child(3),
.reveal-section.is-revealed .project-card:nth-child(3),
.reveal-section.is-revealed .step-item:nth-child(3) {
  animation: softRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.14s;
}

@keyframes softRise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .editorial-stage,
  .brand-atmosphere {
    grid-template-columns: minmax(0, 1fr);
  }
  .editorial-stage,
  .brand-atmosphere,
  .intro-section,
  .project-section {
    width: min(1240px, 94vw);
  }
  .intro-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .project-grid,
  .project-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .optimized-video-player {
    min-height: min(54vw, 520px);
  }
  .detail-showcase-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .detail-card-small,
  .detail-card-wide {
    min-height: 360px;
  }
  .detail-card-wide {
    grid-column: auto;
  }
  .concept-scroll {
    min-height: 122vh;
  }
  .concept-scroll-sticky {
    top: 82px;
  }
  .concept-scroll-panel {
    min-height: 460px;
    grid-template-columns: minmax(220px, 0.44fr) minmax(0, 1.56fr);
    gap: 34px;
  }
}

@media (max-width: 1024px) {
  .editorial-copy,
  .concept-scroll-panel,
  .montage-card,
  .intro-card,
  .project-card,
  .step-item {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@media (max-width: 720px) {
  .content-band {
    margin-top: 16px;
    padding-top: 24px;
  }
  .editorial-stage,
  .brand-atmosphere,
  .optimized-video-section,
  .detail-showcase,
  .intro-section,
  .project-section {
    width: min(100%, 92vw);
  }
  .concept-scroll {
    width: min(100%, 92vw);
    min-height: 118vh;
    margin-bottom: 72px;
  }
  .concept-scroll-sticky {
    top: 72px;
  }
  .concept-scroll-panel {
    min-height: 420px;
    padding: 28px 22px 48px;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    border-radius: 26px;
  }
  .concept-progress-rail {
    left: 22px;
    right: 22px;
  }
  .editorial-copy {
    padding: 26px 20px 24px;
  }
  .editorial-video-frame {
    min-height: 360px;
  }
  .atmosphere-title,
  .project-title,
  .editorial-title,
  .intro-title,
  .project-card h4,
  .step-item h5 {
    max-width: none;
    white-space: normal;
    text-wrap: balance;
  }
  .concept-scroll-title,
  .concept-short p {
    max-width: none;
  }
  .concept-short {
    max-width: none;
  }
  .concept-long {
    width: 100%;
    justify-self: stretch;
    padding-top: 0;
  }
  .concept-long-body h4 {
    font-size: 15px;
    line-height: 1.45;
  }
  .concept-long-body p,
  .concept-long-body p:first-child {
    font-size: 14px;
    line-height: 1.72;
  }
  .concept-video-player {
    height: 220px;
  }
  .concept-video-stage {
    left: 22px;
    right: 22px;
    top: 74px;
    bottom: 40px;
  }
  .video-placeholder {
    padding: 20px;
  }
  .atmosphere-montage {
    min-height: 520px;
  }
  .montage-card-a,
  .montage-card-b,
  .montage-card-c,
  .montage-card-d {
    border-radius: 24px;
  }
  .montage-card-a {
    width: 62%;
    height: 34%;
  }
  .montage-card-b {
    width: 32%;
    height: 22%;
  }
  .montage-card-c {
    width: 36%;
    height: 20%;
  }
  .montage-card-d {
    width: 44%;
    height: 24%;
  }
  .intro-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .project-grid,
  .project-steps {
    grid-template-columns: minmax(0, 1fr);
  }
  .concept-next-cta {
    width: min(100%, 92vw);
    margin: -8px auto 48px;
  }
  .optimized-video-player {
    min-height: 280px;
  }
  .detail-card-small,
  .detail-card-wide {
    min-height: 280px;
  }
}

@media (max-width: 640px) {
  .hero-content {
    padding: 28px 18px;
  }
  .concept-short p {
    font-size: clamp(28px, 8vw, 42px);
  }
  .concept-long p {
    font-size: 18px;
    line-height: 1.75;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-float,
  .reveal-section.is-revealed .editorial-copy,
  .reveal-section.is-revealed .editorial-video,
  .reveal-section.is-revealed .atmosphere-headline,
  .reveal-section.is-revealed .atmosphere-montage,
  .reveal-section.is-revealed .intro-card,
  .reveal-section.is-revealed .project-card,
  .reveal-section.is-revealed .step-item {
    animation: none !important;
  }

  .orbit-node,
  .orbit-bubble,
  .editorial-copy,
  .editorial-video,
  .montage-card,
  .intro-card,
  .project-card,
  .step-item {
    transition: none !important;
  }
}

.optimized-showcase {
  margin-top: 10px;
  display: grid;
  gap: 24px;
}

.optimized-copy {
  text-align: center;
  max-width: 680px;
  margin: 0 auto;
}

.optimized-showcase-title {
  font-size: clamp(24px, 2vw, 32px);
  margin: 0 0 12px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.02em;
}

.optimized-showcase-desc {
  font-size: 15px;
  color: rgba(17, 17, 17, 0.6);
  line-height: 1.6;
  margin: 0;
}

.optimized-showcase-desc code {
  background: rgba(17, 17, 17, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: monospace;
}

.optimized-video-wrapper {
  position: relative;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  aspect-ratio: 16 / 9;
}

.optimized-video-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.optimized-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.optimized-video-wrapper:hover .optimized-overlay,
.optimized-video-wrapper:focus .optimized-overlay {
  opacity: 1;
}

.optimized-play-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.optimized-play-icon::after {
  content: '';
  margin-left: 5px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 15px solid #fff;
}
</style>
