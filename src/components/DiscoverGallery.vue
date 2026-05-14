<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchGalleryItems, type GalleryItem } from '../api/admin'

const copiedId = ref<string | null>(null)
const expandedIds = ref<string[]>([])
const galleryItems = ref<GalleryItem[]>([])
const isLoading = ref(true)
const loadError = ref('')
const PROMPT_PREVIEW_LENGTH = 220

const tagMap: Record<string, string> = {
  cinematic: '电影感',
  futuristic: '未来感',
  'slow motion': '慢动作',
  'dramatic transitions': '戏剧转场',
  music: '音乐',
  crowd: '人群',
  comedy: '喜剧',
  anime: '动漫',
  action: '动作',
  humor: '幽默',
  food: '美食',
  underwater: '水下',
  emotional: '情绪',
  realistic: '写实',
  fantasy: '奇幻',
  VFX: '视效',
  chase: '追逐',
  'sci-fi': '科幻',
  dance: '舞蹈',
  '3d': '3D',
  war: '战争',
  night: '夜景',
  transformation: '变身',
  'first-person': '第一视角',
  tech: '科技',
  epic: '史诗',
  urban: '都市',
  surreal: '超现实',
  animation: '动画',
  pastel: '粉彩',
  calm: '治愈',
  water: '水元素',
  nature: '自然',
  photorealistic: '照片级',
  dynamic: '动态',
  vlog: 'Vlog',
  drama: '剧情'
}

const titleMap: Record<string, string> = {
  's2-107': '暗黑超现实反乌托邦短片',
  's2-108': '博物馆万人卡点掉落',
  's2-109': '猫咪教师 ADHD',
  's2-110': '三文鱼入口·海底幻境',
  's2-111': '金色双节棍弧光轨迹',
  's2-112': '霓虹都市极速追车',
  's2-113': '穿屏入龙域（Cinema版）',
  's2-114': '灵感救急：猫咪热巧摊',
  's2-115': '正常走路也能拍大片',
  's2-116': '手机扭转穿越·科技忍者',
  's2-117': '末世能量饮觉醒变身',
  's2-118': '天台午睡少女战甲变身',
  's2-119': '英雄挡子弹·霓虹宫殿群舞',
  's2-120': '高速动作压迫追杀 Oner',
  's2-121': '东京夜幕过山车第一视角',
  's2-122': '量子计算机世界',
  's2-123': '涩谷路口空间折叠',
  's2-124': '粉彩云朵动画',
  's2-125': '东京午夜街头竞速',
  's2-126': '晴空塔电磁炮发射',
  's2-127': '扑克遮镜无缝变装',
  's2-128': '贴海追逐与海怪突袭',
  's2-129': '冰湖裂变·巨熊出水',
  's2-130': '写实幼龙与陶匠火窟',
  's2-201': '赛博雨巷追逃',
  's2-202': '西部黄昏对峙',
  's2-203': '奇幻能量之门',
  's2-204': '废土幸存者清晨行进',
  's2-301': '港风雨夜电话亭',
  's2-302': '巨型橘猫城市漫游',
  's2-303': '维伦纽瓦沙海史诗',
  's2-304': '旅行博主冰淇淋街拍',
  's2-305': '午夜雨夜复古餐厅',
  's2-306': '镜像现实偏移'
}

async function loadGallery() {
  isLoading.value = true
  loadError.value = ''

  try {
    galleryItems.value = await fetchGalleryItems(false)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '画廊加载失败'
  } finally {
    isLoading.value = false
  }
}

async function copyPrompt(id: string, prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt)
    copiedId.value = id
    window.setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null
    }, 1800)
  } catch {
    alert('复制失败，请手动复制')
  }
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = 'https://picsum.photos/seed/seedance-fallback/1200/675'
}

function isExpanded(id: string) {
  return expandedIds.value.includes(id)
}

function togglePrompt(id: string) {
  if (isExpanded(id)) {
    expandedIds.value = expandedIds.value.filter((v) => v !== id)
    return
  }
  expandedIds.value = [...expandedIds.value, id]
}

function displayPrompt(id: string, prompt: string) {
  if (isExpanded(id) || prompt.length <= PROMPT_PREVIEW_LENGTH) {
    return prompt
  }
  return `${prompt.slice(0, PROMPT_PREVIEW_LENGTH)}...`
}

function displayTitle(id: string, title: string) {
  return titleMap[id] ?? title
}

function displayTag(tag: string) {
  return tagMap[tag] ?? tag
}

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'awesomevideoprompts.com'
  }
}

onMounted(loadGallery)
</script>

<template>
  <div class="gallery-container">
    <div class="gallery-header">
      <h2 class="gallery-title">Seedance 2.0 案例画廊</h2>
      <span class="gallery-count">已收录 {{ galleryItems.length }} 个案例 · 持续更新</span>
    </div>

    <section v-if="isLoading" class="gallery-state">
      <p>正在加载画廊...</p>
    </section>

    <section v-else-if="loadError" class="gallery-state error-state">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-btn" @click="loadGallery">重试</button>
    </section>

    <div v-else class="gallery-grid">
      <article v-for="item in galleryItems" :key="item.id" class="gallery-card">
        <div class="card-media">
          <img
            :src="item.thumbnail"
            :alt="item.title"
            class="media-image"
            loading="lazy"
            @error="handleImageError"
          />
          <span class="card-badge">{{ item.badge }}</span>
        </div>

        <div class="card-content">
          <h3 class="card-title">{{ displayTitle(item.id, item.title) }}</h3>
          <p class="card-prompt">{{ displayPrompt(item.id, item.prompt) }}</p>

          <button
            v-if="item.prompt.length > PROMPT_PREVIEW_LENGTH"
            class="toggle-btn"
            @click="togglePrompt(item.id)"
          >
            {{ isExpanded(item.id) ? '收起' : '展开' }}
          </button>

          <button class="copy-btn" @click="copyPrompt(item.id, item.prompt)">
            {{ copiedId === item.id ? '已复制提示词' : '复制提示词' }}
          </button>

          <div class="card-tags">
            <span v-for="tag in item.tags" :key="tag" class="tag-item">{{ displayTag(tag) }}</span>
          </div>

          <div class="card-footer">
            <span class="author-info">作者：{{ item.author }}</span>
            <span class="date-info">{{ item.date }}</span>
          </div>

          <a class="source-link" :href="item.sourceUrl" target="_blank" rel="noopener">来源：{{ sourceHost(item.sourceUrl) }}</a>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.gallery-container {
  width: 100%;
  max-width: 1760px;
  margin: 0 auto;
  padding: 28px 18px;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 14px;
}

.gallery-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.gallery-count {
  font-size: 14px;
  color: var(--text-muted);
}

.gallery-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(17, 17, 17, 0.66);
}

.error-state {
  gap: 12px;
  align-content: center;
}

.retry-btn {
  border: none;
  border-radius: 999px;
  background: #111;
  color: #fff;
  padding: 10px 16px;
  cursor: pointer;
}

.gallery-grid {
  column-count: 5;
  column-gap: 14px;
}

@media (max-width: 1700px) {
  .gallery-grid { column-count: 4; }
}
@media (max-width: 1200px) {
  .gallery-grid { column-count: 3; }
}
@media (max-width: 900px) {
  .gallery-grid { column-count: 2; }
}
@media (max-width: 600px) {
  .gallery-grid { column-count: 1; }
}

.gallery-card {
  break-inside: avoid;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.gallery-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.12);
}

.card-media {
  position: relative;
  width: 100%;
  min-height: 180px;
  overflow: hidden;
  background: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-image {
  width: 100%;
  height: auto;
  max-height: 560px;
  object-fit: contain;
  transition: transform 0.6s ease;
  display: block;
}

.gallery-card:hover .media-image {
  transform: scale(1.01);
}

.card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 0, 0, 0.72);
  border-radius: 999px;
  padding: 4px 8px;
}

.card-content {
  padding: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  color: #111;
  margin: 0 0 10px 0;
  line-height: 1.35;
}

.card-prompt {
  font-size: 13px;
  color: #4d4d4d;
  line-height: 1.65;
  margin: 0 0 8px 0;
  white-space: pre-wrap;
}

.toggle-btn {
  border: none;
  background: transparent;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 700;
  padding: 0;
  margin: 0 0 12px 0;
  cursor: pointer;
}

.toggle-btn:hover {
  text-decoration: underline;
}

.copy-btn {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
  color: #222;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 14px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tag-item {
  font-size: 11px;
  padding: 4px 9px;
  background: rgba(0, 0, 0, 0.06);
  color: #555;
  border-radius: 999px;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8c8c8c;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 10px;
  margin-bottom: 6px;
}

.author-info {
  font-weight: 600;
}

.source-link {
  display: inline-block;
  font-size: 12px;
  color: var(--accent-dark);
  text-decoration: none;
  font-weight: 700;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
