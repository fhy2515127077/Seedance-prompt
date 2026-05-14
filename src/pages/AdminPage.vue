<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createGalleryItem,
  deleteGalleryItem,
  fetchAdminConfig,
  fetchAdminSession,
  fetchGalleryItems,
  loginAdmin,
  logoutAdmin,
  saveAdminConfig,
  updateGalleryItem,
  type GalleryItem
} from '../api/admin'

const isCheckingSession = ref(true)
const isAuthenticated = ref(false)
const isBusy = ref(false)
const loginPassword = ref('')
const loginError = ref('')
const loadError = ref('')
const saveMessage = ref('')
const galleryItems = ref<GalleryItem[]>([])
const selectedGalleryId = ref('')
const isSavingGallery = ref(false)

const configForm = reactive({
  promptEndpoint: '',
  promptModel: '',
  promptApiKey: '',
  promptApiKeyConfigured: false,
  imageEndpoint: '',
  imageModel: '',
  imageSize: '',
  imageApiKey: '',
  imageApiKeyConfigured: false
})

const galleryForm = reactive<GalleryItem>({
  id: '',
  title: '',
  prompt: '',
  thumbnail: '',
  tags: [],
  author: '',
  date: '',
  badge: 'Seedance 2.0',
  sourceUrl: ''
})

const galleryTagsText = ref('')

const selectedGalleryItem = computed(() =>
  galleryItems.value.find((item) => item.id === selectedGalleryId.value) ?? null
)

async function bootstrap() {
  isCheckingSession.value = true
  loadError.value = ''

  try {
    const session = await fetchAdminSession()
    isAuthenticated.value = session.authenticated

    if (session.authenticated) {
      await Promise.all([loadConfig(), loadGallery()])
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '后台初始化失败'
  } finally {
    isCheckingSession.value = false
  }
}

async function handleLogin() {
  isBusy.value = true
  loginError.value = ''

  try {
    await loginAdmin(loginPassword.value)
    isAuthenticated.value = true
    loginPassword.value = ''
    await Promise.all([loadConfig(), loadGallery()])
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    isBusy.value = false
  }
}

async function handleLogout() {
  await logoutAdmin()
  isAuthenticated.value = false
  saveMessage.value = ''
}

async function loadConfig() {
  const data = await fetchAdminConfig()
  configForm.promptEndpoint = data.prompt.endpoint
  configForm.promptModel = data.prompt.model
  configForm.promptApiKey = ''
  configForm.promptApiKeyConfigured = data.prompt.apiKeyConfigured
  configForm.imageEndpoint = data.image.endpoint
  configForm.imageModel = data.image.model
  configForm.imageSize = data.image.size
  configForm.imageApiKey = ''
  configForm.imageApiKeyConfigured = data.image.apiKeyConfigured
}

async function loadGallery() {
  galleryItems.value = await fetchGalleryItems(true)

  if (selectedGalleryId.value) {
    const current = galleryItems.value.find((item) => item.id === selectedGalleryId.value)
    if (current) {
      applyGalleryForm(current)
      return
    }
  }

  if (galleryItems.value[0]) {
    applyGalleryForm(galleryItems.value[0])
  } else {
    resetGalleryForm()
  }
}

function applyGalleryForm(item: GalleryItem) {
  selectedGalleryId.value = item.id
  galleryForm.id = item.id
  galleryForm.title = item.title
  galleryForm.prompt = item.prompt
  galleryForm.thumbnail = item.thumbnail
  galleryForm.tags = [...item.tags]
  galleryForm.author = item.author
  galleryForm.date = item.date
  galleryForm.badge = item.badge
  galleryForm.sourceUrl = item.sourceUrl
  galleryTagsText.value = item.tags.join(', ')
}

function resetGalleryForm() {
  selectedGalleryId.value = ''
  galleryForm.id = ''
  galleryForm.title = ''
  galleryForm.prompt = ''
  galleryForm.thumbnail = ''
  galleryForm.tags = []
  galleryForm.author = ''
  galleryForm.date = new Date().toISOString().slice(0, 10)
  galleryForm.badge = 'Seedance 2.0'
  galleryForm.sourceUrl = ''
  galleryTagsText.value = ''
}

async function handleSaveConfig() {
  isBusy.value = true
  saveMessage.value = ''

  try {
    const data = await saveAdminConfig({
      prompt: {
        endpoint: configForm.promptEndpoint,
        model: configForm.promptModel,
        apiKey: configForm.promptApiKey
      },
      image: {
        endpoint: configForm.imageEndpoint,
        model: configForm.imageModel,
        size: configForm.imageSize,
        apiKey: configForm.imageApiKey
      }
    })

    configForm.promptApiKey = ''
    configForm.imageApiKey = ''
    configForm.promptApiKeyConfigured = data.prompt.apiKeyConfigured
    configForm.imageApiKeyConfigured = data.image.apiKeyConfigured
    saveMessage.value = '后端配置已保存。新的模型和密钥立即生效。'
  } catch (error) {
    saveMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    isBusy.value = false
  }
}

async function handleSaveGallery() {
  isSavingGallery.value = true
  saveMessage.value = ''

  try {
    const payload: GalleryItem = {
      id: galleryForm.id.trim(),
      title: galleryForm.title.trim(),
      prompt: galleryForm.prompt.trim(),
      thumbnail: galleryForm.thumbnail.trim(),
      tags: galleryTagsText.value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      author: galleryForm.author.trim(),
      date: galleryForm.date.trim(),
      badge: galleryForm.badge.trim(),
      sourceUrl: galleryForm.sourceUrl.trim()
    }

    if (!selectedGalleryItem.value || selectedGalleryId.value !== payload.id) {
      await createGalleryItem(payload)
    } else {
      await updateGalleryItem(payload)
    }

    await loadGallery()
    applyGalleryForm(payload)
    saveMessage.value = '画廊作品已保存。前台刷新后即可看到变更。'
  } catch (error) {
    saveMessage.value = error instanceof Error ? error.message : '画廊保存失败'
  } finally {
    isSavingGallery.value = false
  }
}

async function handleDeleteGallery() {
  if (!selectedGalleryId.value) return

  const confirmed = window.confirm(`确认删除作品 ${selectedGalleryId.value} 吗？`)
  if (!confirmed) return

  isSavingGallery.value = true
  saveMessage.value = ''

  try {
    await deleteGalleryItem(selectedGalleryId.value)
    await loadGallery()
    saveMessage.value = '作品已删除。'
  } catch (error) {
    saveMessage.value = error instanceof Error ? error.message : '删除失败'
  } finally {
    isSavingGallery.value = false
  }
}

onMounted(bootstrap)
</script>

<template>
  <div class="admin-page">
    <main class="admin-main">
      <section class="admin-hero">
        <div>
          <p class="admin-kicker">Administrator</p>
          <h1 class="admin-heading">Secure Control Console</h1>
          <p class="admin-copy">
            后台现在通过独立密码登录。API 密钥只保存在服务端，这里负责切换模型、更新接口配置，以及维护公开画廊作品。
          </p>
        </div>

        <button v-if="isAuthenticated" type="button" class="logout-btn" @click="handleLogout">退出登录</button>
      </section>

      <section v-if="isCheckingSession" class="panel loading-panel">
        <p>正在检查后台登录状态...</p>
      </section>

      <section v-else-if="!isAuthenticated" class="panel login-panel">
        <div class="panel-head">
          <h2>管理员登录</h2>
          <p>输入单独的后台密码后，才能修改模型、密钥和画廊作品。</p>
        </div>

        <label class="field">
          <span>后台密码</span>
          <input v-model="loginPassword" type="password" placeholder="输入管理员密码" @keydown.enter="handleLogin" />
        </label>

        <button type="button" class="primary-btn" :disabled="isBusy || !loginPassword.trim()" @click="handleLogin">
          {{ isBusy ? '登录中...' : '登录后台' }}
        </button>

        <p v-if="loginError" class="feedback error">{{ loginError }}</p>
        <p v-if="loadError" class="feedback error">{{ loadError }}</p>
      </section>

      <template v-else>
        <section class="panel">
          <div class="panel-head">
            <h2>服务端模型与密钥</h2>
            <p>这里保存的是后端配置，不会再下发到浏览器。</p>
          </div>

          <div class="config-grid">
            <label class="field">
              <span>Prompt API Endpoint</span>
              <input v-model="configForm.promptEndpoint" type="text" />
            </label>
            <label class="field">
              <span>Prompt Model</span>
              <input v-model="configForm.promptModel" type="text" />
            </label>
            <label class="field">
              <span>Prompt API Key</span>
              <input v-model="configForm.promptApiKey" type="password" placeholder="留空表示保持现有密钥" />
              <small>{{ configForm.promptApiKeyConfigured ? '已配置服务端密钥' : '尚未配置服务端密钥' }}</small>
            </label>

            <label class="field">
              <span>Image API Endpoint</span>
              <input v-model="configForm.imageEndpoint" type="text" />
            </label>
            <label class="field">
              <span>Image Model</span>
              <input v-model="configForm.imageModel" type="text" />
            </label>
            <label class="field">
              <span>Image Size</span>
              <input v-model="configForm.imageSize" type="text" />
            </label>
            <label class="field">
              <span>Image API Key</span>
              <input v-model="configForm.imageApiKey" type="password" placeholder="留空表示保持现有密钥" />
              <small>{{ configForm.imageApiKeyConfigured ? '已配置服务端密钥' : '尚未配置服务端密钥' }}</small>
            </label>
          </div>

          <button type="button" class="primary-btn" :disabled="isBusy" @click="handleSaveConfig">
            {{ isBusy ? '保存中...' : '保存服务端配置' }}
          </button>
        </section>

        <section class="panel gallery-panel">
          <div class="panel-head">
            <h2>画廊作品管理</h2>
            <p>新增、编辑、删除后，会写入后端数据文件，前台画廊刷新即可生效。</p>
          </div>

          <div class="gallery-layout">
            <aside class="gallery-list">
              <button type="button" class="secondary-btn" @click="resetGalleryForm">新增作品</button>

              <button
                v-for="item in galleryItems"
                :key="item.id"
                type="button"
                class="gallery-list-item"
                :class="{ active: selectedGalleryId === item.id }"
                @click="applyGalleryForm(item)"
              >
                <strong>{{ item.id }}</strong>
                <span>{{ item.title }}</span>
              </button>
            </aside>

            <div class="gallery-editor">
              <div class="config-grid">
                <label class="field">
                  <span>ID</span>
                  <input v-model="galleryForm.id" type="text" placeholder="例如 s2-401" />
                </label>
                <label class="field">
                  <span>标题</span>
                  <input v-model="galleryForm.title" type="text" />
                </label>
                <label class="field">
                  <span>缩略图 URL</span>
                  <input v-model="galleryForm.thumbnail" type="text" />
                </label>
                <label class="field">
                  <span>作者</span>
                  <input v-model="galleryForm.author" type="text" />
                </label>
                <label class="field">
                  <span>日期</span>
                  <input v-model="galleryForm.date" type="date" />
                </label>
                <label class="field">
                  <span>徽标</span>
                  <input v-model="galleryForm.badge" type="text" />
                </label>
                <label class="field full-width">
                  <span>来源链接</span>
                  <input v-model="galleryForm.sourceUrl" type="text" />
                </label>
                <label class="field full-width">
                  <span>标签</span>
                  <input v-model="galleryTagsText" type="text" placeholder="cinematic, action, urban" />
                </label>
                <label class="field full-width">
                  <span>提示词正文</span>
                  <textarea v-model="galleryForm.prompt" rows="12"></textarea>
                </label>
              </div>

              <div class="editor-actions">
                <button type="button" class="primary-btn" :disabled="isSavingGallery" @click="handleSaveGallery">
                  {{ isSavingGallery ? '保存中...' : '保存作品' }}
                </button>
                <button
                  type="button"
                  class="secondary-btn danger-btn"
                  :disabled="isSavingGallery || !selectedGalleryId"
                  @click="handleDeleteGallery"
                >
                  删除当前作品
                </button>
              </div>
            </div>
          </div>
        </section>

        <p v-if="saveMessage" class="feedback" :class="{ error: saveMessage.includes('失败') || saveMessage.includes('required') }">
          {{ saveMessage }}
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.admin-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 64px 24px;
}

.admin-main {
  width: min(1280px, 100%);
  display: grid;
  gap: 24px;
}

.admin-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.admin-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.46);
}

.admin-heading {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
  color: #111;
}

.admin-copy {
  margin: 14px 0 0;
  max-width: 68ch;
  font-size: 15px;
  line-height: 1.75;
  color: rgba(17, 17, 17, 0.64);
}

.panel {
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.06);
  box-shadow: 0 18px 40px rgba(17, 17, 17, 0.05);
}

.panel-head {
  display: grid;
  gap: 6px;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
  color: #111;
}

.panel-head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(17, 17, 17, 0.62);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.68);
}

.field small {
  color: rgba(17, 17, 17, 0.44);
  font-size: 11px;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  padding: 12px 14px;
  color: #111;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 240px;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(17, 17, 17, 0.28);
}

.full-width {
  grid-column: 1 / -1;
}

.gallery-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
}

.gallery-list {
  display: grid;
  align-content: start;
  gap: 10px;
  max-height: 760px;
  overflow: auto;
}

.gallery-list-item {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  text-align: left;
  border-radius: 16px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.gallery-list-item strong {
  font-size: 12px;
  color: rgba(17, 17, 17, 0.48);
}

.gallery-list-item span {
  font-size: 14px;
  color: #111;
}

.gallery-list-item.active {
  background: #111;
  border-color: #111;
}

.gallery-list-item.active strong,
.gallery-list-item.active span {
  color: #fff;
}

.gallery-editor {
  display: grid;
  gap: 16px;
}

.editor-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn,
.logout-btn {
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  border: none;
  background: #111;
  color: #fff;
  padding: 12px 18px;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.secondary-btn,
.logout-btn {
  border: 1px solid rgba(17, 17, 17, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: #111;
  padding: 12px 16px;
}

.danger-btn {
  color: #8f1d1d;
}

.feedback {
  margin: 0;
  font-size: 13px;
  color: rgba(17, 17, 17, 0.7);
}

.feedback.error {
  color: #9f2222;
}

.loading-panel,
.login-panel {
  min-height: 220px;
  align-content: center;
}

@media (max-width: 960px) {
  .config-grid,
  .gallery-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-page {
    padding: 40px 16px;
  }

  .admin-hero {
    flex-direction: column;
  }
}
</style>
