<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ParticleBackground from './components/ParticleBackground.vue'
import MouseAura from './components/MouseAura.vue'
import { withBasePath } from './utils/asset'

const router = useRouter()
const route = useRoute()

const showBackToTop = ref(false)
const isScrolled = ref(false)

const USAGE_COUNT_KEY = 'seedance_usage_count'
const usageCount = ref(128503)
const authorQrCode = withBasePath('/qrcode_for_gh_f6baa4997e1d_1280.jpg')

const currentView = computed(() => {
  if (route.path.startsWith('/studio')) return 'studio'
  if (route.path.startsWith('/image')) return 'image'
  if (route.path.startsWith('/discover')) return 'discover'
  if (route.path.startsWith('/history')) return 'history'
  if (route.path.startsWith('/admin')) return 'admin'
  return 'landing'
})

const navigationItems = [
  {
    view: 'landing',
    label: '首页',
    path: '/',
    icon: 'home'
  },
  {
    view: 'studio',
    label: '提示词优化',
    path: '/studio',
    icon: 'edit'
  },
  {
    view: 'image',
    label: '图片生成',
    path: '/image',
    icon: 'image'
  },
  {
    view: 'discover',
    label: '案例画廊',
    path: '/discover',
    icon: 'gallery'
  }
] as const

function handleScroll() {
  showBackToTop.value = window.scrollY > 300
  isScrolled.value = window.scrollY > 50
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()

  const savedCount = localStorage.getItem(USAGE_COUNT_KEY)
  if (savedCount) {
    usageCount.value = parseInt(savedCount, 10)
  } else {
    localStorage.setItem(USAGE_COUNT_KEY, usageCount.value.toString())
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="app-container">
    <ParticleBackground v-if="currentView !== 'admin'" />
    <MouseAura v-if="currentView !== 'admin'" />

    <nav v-if="currentView !== 'admin'" class="top-nav" :class="{ 'nav-scrolled': isScrolled }">
      <button type="button" class="nav-brand" @click="router.push('/')">
        <span class="brand-mark">S</span>
        <span class="brand-text">Seedance Studio</span>
      </button>

      <div class="nav-pills" aria-label="主导航">
        <button
          v-for="item in navigationItems"
          :key="item.path"
          type="button"
          class="nav-pill"
          :class="{ 'selected-pill': currentView === item.view }"
          @click="router.push(item.path)"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg v-if="item.icon === 'home'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 10 9-7 9 7" />
              <path d="M5 9v11h14V9" />
              <path d="M9 20v-6h6v6" />
            </svg>
            <svg v-else-if="item.icon === 'edit'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            <svg v-else-if="item.icon === 'image'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </span>
          <span class="nav-text">{{ item.label }}</span>
        </button>
      </div>

      <div class="nav-action">
        <button
          type="button"
          class="nav-pill history-pill"
          :class="{ 'selected-pill': currentView === 'history' }"
          @click="router.push('/history')"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.7 2.7L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </span>
          <span class="nav-text">历史记录</span>
        </button>
      </div>
    </nav>

    <RouterView />

    <Transition name="fade">
      <button
        v-if="showBackToTop && currentView !== 'admin'"
        type="button"
        class="back-to-top"
        aria-label="返回顶部"
        @click="scrollToTop"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </Transition>

    <footer v-if="currentView !== 'admin'" class="app-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <h3>Seedance Studio</h3>
          <p>
            面向视频创作者的提示词工作台，支持结构化扩写、参考图输入、分镜图生成和图片生成。
          </p>
          <div class="usage-stats">
            <span>累计优化</span>
            <strong>{{ usageCount.toLocaleString() }}</strong>
            <span>次</span>
          </div>
        </div>

        <div class="footer-column">
          <h4>快速入口</h4>
          <button type="button" @click="router.push('/studio')">提示词优化</button>
          <button type="button" @click="router.push('/image')">图片生成</button>
          <button type="button" @click="router.push('/discover')">案例画廊</button>
          <button type="button" @click="router.push('/history')">历史记录</button>
        </div>

        <div class="footer-column footer-notes">
          <h4>使用说明</h4>
          <p>生成内容仅供创作参考，请在符合法律法规和平台规则的范围内使用。</p>
          <p>
            项目基于
            <a href="https://github.com/songguoxs/seedance-prompt-skill" target="_blank" rel="noopener">
              seedance-prompt-skill
            </a>
            构建。
          </p>
        </div>

        <div class="footer-contact">
          <img :src="authorQrCode" alt="作者微信二维码" class="qrcode-image" />
          <div>
            <h4>联系作者</h4>
            <p>扫码交流需求与合作。</p>
          </div>
        </div>
      </div>
      <p class="footer-copyright">© {{ new Date().getFullYear() }} Seedance Studio</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.top-nav {
  position: fixed;
  inset: 18px 24px auto;
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto minmax(180px, 1fr);
  align-items: center;
  gap: 18px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: oklch(0.985 0.008 98 / 0.82);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition:
    inset 0.38s var(--ease-out),
    background 0.38s var(--ease-out),
    box-shadow 0.38s var(--ease-out);
}

.top-nav.nav-scrolled {
  inset: 10px 18px auto;
  background: oklch(0.985 0.008 98 / 0.92);
  box-shadow: var(--shadow-md);
}

.nav-brand,
.nav-pill,
.footer-column button {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
}

.nav-brand {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 5px 12px 5px 6px;
  border-radius: 999px;
  font-weight: 750;
  color: var(--text-primary);
}

.brand-mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--text-inverse);
  font-size: 14px;
  letter-spacing: 0;
}

.brand-text {
  white-space: nowrap;
}

.nav-pills {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--surface-strong);
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 650;
  transition:
    color 0.24s var(--ease-out),
    background 0.24s var(--ease-out),
    transform 0.24s var(--ease-out);
}

.nav-pill:hover {
  color: var(--text-primary);
  background: oklch(0.92 0.02 100 / 0.8);
  transform: translateY(-1px);
}

.selected-pill,
.selected-pill:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
  box-shadow: 0 9px 18px oklch(0.2 0.04 126 / 0.18);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.nav-action {
  justify-self: end;
}

.history-pill:not(.selected-pill) {
  border: 1px solid var(--border-subtle);
  background: oklch(0.99 0.006 98 / 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s var(--ease-out), transform 0.24s var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

.back-to-top {
  position: fixed;
  right: 26px;
  bottom: 28px;
  z-index: 40;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.24s var(--ease-out), box-shadow 0.24s var(--ease-out);
}

.back-to-top:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.app-footer {
  position: relative;
  z-index: 10;
  margin-top: clamp(64px, 8vw, 104px);
  padding: 42px 24px 22px;
  border-top: 1px solid var(--border-subtle);
  background: oklch(0.955 0.015 100 / 0.72);
}

.footer-inner {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) minmax(140px, 0.7fr) minmax(260px, 1fr) minmax(240px, 0.8fr);
  gap: 34px;
  width: min(1320px, 100%);
  margin: 0 auto;
}

.footer-brand,
.footer-column,
.footer-contact {
  display: grid;
  align-content: start;
  gap: 12px;
}

.footer-brand h3,
.footer-column h4,
.footer-contact h4 {
  margin: 0;
  color: var(--text-primary);
}

.footer-brand h3 {
  font-size: 26px;
  letter-spacing: 0;
}

.footer-brand p,
.footer-column p,
.footer-contact p {
  margin: 0;
  max-width: 54ch;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.usage-stats {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  width: max-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
}

.usage-stats strong {
  color: var(--text-primary);
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.footer-column button {
  width: max-content;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
  text-align: left;
}

.footer-column button:hover,
.footer-notes a:hover {
  color: var(--accent-primary);
}

.footer-contact {
  grid-template-columns: 74px 1fr;
  align-items: center;
}

.qrcode-image {
  width: 74px;
  height: 74px;
  border-radius: var(--radius-md);
  object-fit: contain;
  padding: 5px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.footer-copyright {
  width: min(1320px, 100%);
  margin: 28px auto 0;
  color: var(--text-muted);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 1060px) {
  .top-nav {
    grid-template-columns: 1fr auto;
  }

  .nav-brand {
    display: none;
  }

  .nav-pills {
    justify-self: start;
  }

  .footer-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .top-nav {
    inset: 10px 10px auto;
    display: flex;
    justify-content: center;
    padding: 8px;
    border-radius: 24px;
  }

  .nav-pills {
    width: 100%;
    min-width: 0;
    max-width: calc(100vw - 36px);
    overflow-x: auto;
    scrollbar-width: none;
    justify-content: flex-start;
  }

  .nav-pills::-webkit-scrollbar {
    display: none;
  }

  .nav-pill {
    flex: 0 0 auto;
    height: 38px;
    padding: 0 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  .nav-action {
    display: none;
  }

  .app-footer {
    padding: 30px 18px 18px;
  }

  .footer-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .footer-copyright {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .nav-pill:not(.selected-pill) {
    width: 38px;
    justify-content: center;
    padding: 0;
  }

  .nav-pill:not(.selected-pill) .nav-text {
    display: none;
  }
}
</style>
