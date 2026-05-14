import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import express from 'express'
import dotenv from 'dotenv'

const rootDir = process.cwd()

loadEnvFiles([
  '.env',
  '.env.local',
  '.env.server',
  '.env.server.local'
])

const app = express()
const distDir = path.join(rootDir, 'dist')
const dataDir = path.join(rootDir, 'server', 'data')
const configFile = path.join(dataDir, 'config.json')
const galleryFile = path.join(dataDir, 'gallery.json')

const PORT = Number(process.env.PORT || 8787)
const ADMIN_PASSWORD = process.env.SEEDANCE_ADMIN_PASSWORD?.trim() || 'change-this-password'
const SESSION_TTL_MS = Number(process.env.SEEDANCE_SESSION_TTL_HOURS || 12) * 60 * 60 * 1000
const sessions = new Map()

app.use(express.json({ limit: '30mb' }))

const DEFAULT_ENDPOINT = 'https://api.gemai.cc/v1'
const DEFAULT_MODEL = 'deepseek-chat'
const IMAGE_GENERATE_PATH = '/v1/api/generate'
const IMAGE_RESULT_PATH = '/v1/api/result'
const DRAW_POLL_INTERVAL_MS = 2000
const DRAW_POLL_TIMEOUT_MS = 600000

const defaultConfig = {
  prompt: {
    endpoint: process.env.SEEDANCE_ENDPOINT?.trim() || process.env.VITE_SEEDANCE_ENDPOINT?.trim() || DEFAULT_ENDPOINT,
    apiKey: process.env.SEEDANCE_API_KEY?.trim() || process.env.VITE_SEEDANCE_API_KEY?.trim() || '',
    model: normalizeModelName(process.env.SEEDANCE_MODEL || process.env.VITE_SEEDANCE_MODEL, DEFAULT_MODEL)
  },
  image: {
    endpoint:
      process.env.SEEDANCE_IMAGE_ENDPOINT?.trim() ||
      process.env.VITE_SEEDANCE_IMAGE_ENDPOINT?.trim() ||
      'https://grsai.dakka.com.cn',
    apiKey: process.env.SEEDANCE_IMAGE_API_KEY?.trim() || process.env.VITE_SEEDANCE_IMAGE_API_KEY?.trim() || '',
    model: process.env.SEEDANCE_IMAGE_MODEL?.trim() || process.env.VITE_SEEDANCE_IMAGE_MODEL?.trim() || 'gpt-image-2',
    size: process.env.SEEDANCE_IMAGE_SIZE?.trim() || process.env.VITE_SEEDANCE_IMAGE_SIZE?.trim() || 'auto'
  }
}

await ensureStorage()

app.get('/api/health', async (_req, res) => {
  const config = await readConfig()
  res.json({
    ok: true,
    promptConfigured: Boolean(config.prompt.apiKey),
    imageConfigured: Boolean(config.image.apiKey)
  })
})

app.get('/api/gallery', async (_req, res, next) => {
  try {
    res.json(await readGallery())
  } catch (error) {
    next(error)
  }
})

app.post('/api/prompt/optimize', async (req, res, next) => {
  try {
    const payload = req.body ?? {}
    const result = await optimizePrompt(payload)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.post('/api/image/generate', async (req, res, next) => {
  try {
    const payload = req.body ?? {}
    const result = await generatePromptImage(payload)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.post('/api/image/storyboard', async (req, res, next) => {
  try {
    const payload = req.body ?? {}
    const result = await generateStoryboardFrame(payload)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: isAuthenticated(req) })
})

app.post('/api/admin/login', async (req, res) => {
  const candidate = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!matchesPassword(candidate, ADMIN_PASSWORD)) {
    res.status(401).json({ message: 'Invalid admin password.' })
    return
  }

  const token = crypto.randomUUID()
  sessions.set(token, Date.now() + SESSION_TTL_MS)
  res.setHeader('Set-Cookie', buildSessionCookie(token))
  res.json({ authenticated: true })
})

app.post('/api/admin/logout', (req, res) => {
  const token = getSessionToken(req)
  if (token) {
    sessions.delete(token)
  }
  res.setHeader('Set-Cookie', buildExpiredSessionCookie())
  res.json({ authenticated: false })
})

app.get('/api/admin/config', requireAuth, async (_req, res, next) => {
  try {
    res.json(toAdminConfigResponse(await readConfig()))
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/config', requireAuth, async (req, res, next) => {
  try {
    const current = await readConfig()
    const payload = req.body ?? {}
    const nextConfig = {
      prompt: {
        endpoint: requiredString(payload.prompt?.endpoint, 'Prompt API endpoint'),
        apiKey:
          typeof payload.prompt?.apiKey === 'string' && payload.prompt.apiKey.trim()
            ? payload.prompt.apiKey.trim()
            : current.prompt.apiKey,
        model: normalizeModelName(requiredString(payload.prompt?.model, 'Prompt model'), DEFAULT_MODEL)
      },
      image: {
        endpoint: requiredString(payload.image?.endpoint, 'Image API endpoint'),
        apiKey:
          typeof payload.image?.apiKey === 'string' && payload.image.apiKey.trim()
            ? payload.image.apiKey.trim()
            : current.image.apiKey,
        model: requiredString(payload.image?.model, 'Image model'),
        size: requiredString(payload.image?.size, 'Image size')
      }
    }

    await writeConfig(nextConfig)
    res.json(toAdminConfigResponse(nextConfig))
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/gallery', requireAuth, async (_req, res, next) => {
  try {
    res.json(await readGallery())
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/gallery', requireAuth, async (req, res, next) => {
  try {
    const gallery = await readGallery()
    const item = normalizeGalleryItem(req.body)
    if (gallery.some((entry) => entry.id === item.id)) {
      throw httpError(409, 'A gallery item with this ID already exists.')
    }
    const nextGallery = [item, ...gallery]
    await writeGallery(nextGallery)
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/gallery/:id', requireAuth, async (req, res, next) => {
  try {
    const gallery = await readGallery()
    const currentId = req.params.id
    const item = normalizeGalleryItem({ ...req.body, id: currentId })
    const index = gallery.findIndex((entry) => entry.id === currentId)
    if (index === -1) {
      throw httpError(404, 'Gallery item not found.')
    }
    gallery[index] = item
    await writeGallery(gallery)
    res.json(item)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/gallery/:id', requireAuth, async (req, res, next) => {
  try {
    const gallery = await readGallery()
    const nextGallery = gallery.filter((entry) => entry.id !== req.params.id)
    if (nextGallery.length === gallery.length) {
      throw httpError(404, 'Gallery item not found.')
    }
    await writeGallery(nextGallery)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  const status = Number(error?.status) || 500
  const message = error instanceof Error ? error.message : 'Internal server error.'
  res.status(status).json({ message })
})

app.listen(PORT, () => {
  console.log(`Seedance backend listening on http://127.0.0.1:${PORT}`)
})

function loadEnvFiles(files) {
  for (const file of files) {
    const fullPath = path.join(rootDir, file)
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: true })
    }
  }
}

async function ensureStorage() {
  await fsp.mkdir(dataDir, { recursive: true })

  if (!fs.existsSync(configFile)) {
    await writeJson(configFile, defaultConfig)
  }

  if (!fs.existsSync(galleryFile)) {
    await writeJson(galleryFile, loadSeedGallery())
  }
}

async function readConfig() {
  const saved = await readJson(configFile)
  return {
    prompt: {
      endpoint: saved?.prompt?.endpoint?.trim() || defaultConfig.prompt.endpoint,
      apiKey: typeof saved?.prompt?.apiKey === 'string' ? saved.prompt.apiKey.trim() : defaultConfig.prompt.apiKey,
      model: normalizeModelName(saved?.prompt?.model, defaultConfig.prompt.model)
    },
    image: {
      endpoint: saved?.image?.endpoint?.trim() || defaultConfig.image.endpoint,
      apiKey: typeof saved?.image?.apiKey === 'string' ? saved.image.apiKey.trim() : defaultConfig.image.apiKey,
      model: saved?.image?.model?.trim() || defaultConfig.image.model,
      size: saved?.image?.size?.trim() || defaultConfig.image.size
    }
  }
}

async function writeConfig(config) {
  await writeJson(configFile, config)
}

async function readGallery() {
  const saved = await readJson(galleryFile)
  if (!Array.isArray(saved)) {
    return []
  }
  return saved.map(normalizeGalleryItem)
}

async function writeGallery(gallery) {
  await writeJson(galleryFile, gallery.map(normalizeGalleryItem))
}

async function readJson(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

async function writeJson(filePath, value) {
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function loadSeedGallery() {
  const gallerySource = fs.readFileSync(path.join(rootDir, 'src', 'engine', 'galleryData.ts'), 'utf8')
  const marker = 'export const galleryItems: GalleryItem[] ='
  const markerIndex = gallerySource.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error('Unable to seed gallery data from src/engine/galleryData.ts')
  }
  const sourceBaseMatch = gallerySource.match(/const sourceBase = '([^']+)'/)
  const sourceBase = sourceBaseMatch?.[1] || ''
  const arrayStart = gallerySource.indexOf('[', markerIndex)
  const arrayEnd = gallerySource.lastIndexOf(']')
  const literal = gallerySource.slice(arrayStart, arrayEnd + 1)
  return Function('sourceBase', `"use strict"; return (${literal});`)(sourceBase)
}

function normalizeGalleryItem(value) {
  return {
    id: requiredString(value?.id, 'Gallery ID'),
    title: requiredString(value?.title, 'Gallery title'),
    prompt: requiredString(value?.prompt, 'Gallery prompt'),
    thumbnail: requiredString(value?.thumbnail, 'Gallery thumbnail'),
    tags: Array.isArray(value?.tags)
      ? value.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : String(value?.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    author: requiredString(value?.author, 'Gallery author'),
    date: requiredString(value?.date, 'Gallery date'),
    badge: requiredString(value?.badge, 'Gallery badge'),
    sourceUrl: requiredString(value?.sourceUrl, 'Gallery source URL')
  }
}

function requiredString(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    throw httpError(400, `${label} is required.`)
  }
  return normalized
}

function toAdminConfigResponse(config) {
  return {
    prompt: {
      endpoint: config.prompt.endpoint,
      model: config.prompt.model,
      apiKeyConfigured: Boolean(config.prompt.apiKey)
    },
    image: {
      endpoint: config.image.endpoint,
      model: config.image.model,
      size: config.image.size,
      apiKeyConfigured: Boolean(config.image.apiKey)
    }
  }
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [name, ...rest] = part.split('=')
      acc[name] = decodeURIComponent(rest.join('='))
      return acc
    }, {})
}

function getSessionToken(req) {
  return parseCookies(req.headers.cookie).seedance_admin_session
}

function isAuthenticated(req) {
  const token = getSessionToken(req)
  if (!token) return false
  const expiresAt = sessions.get(token)
  if (!expiresAt || expiresAt < Date.now()) {
    sessions.delete(token)
    return false
  }
  sessions.set(token, Date.now() + SESSION_TTL_MS)
  return true
}

function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ message: 'Authentication required.' })
    return
  }
  next()
}

function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : ''
  return `seedance_admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000
  )};${secure}`
}

function buildExpiredSessionCookie() {
  return 'seedance_admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0;'
}

function matchesPassword(candidate, actual) {
  const left = Buffer.from(candidate)
  const right = Buffer.from(actual)
  if (left.length !== right.length) {
    return false
  }
  return crypto.timingSafeEqual(left, right)
}

function normalizeModelName(value, fallback) {
  if (!value) return fallback
  const cleaned = String(value).trim().replace(/\s+/g, ' ')
  if (!cleaned) return fallback
  if (cleaned === 'gpt-5-mini') return DEFAULT_MODEL
  return cleaned
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function resolveApiBase(endpoint) {
  return requiredString(endpoint, 'Prompt API endpoint').replace(/\/$/, '')
}

function resolveImageApiBase(endpoint) {
  return requiredString(endpoint, 'Image API endpoint').replace(/\/$/, '')
}

function isOpenRouterEndpoint(endpoint) {
  return resolveApiBase(endpoint).includes('openrouter.ai')
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildOptimizeHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.prompt.apiKey}`
  }

  if (isOpenRouterEndpoint(config.prompt.endpoint)) {
    headers['HTTP-Referer'] = 'https://seedance.local'
    headers['X-Title'] = 'Seedance Studio'
  }

  return headers
}

function supportsPromptImages(config) {
  const endpoint = resolveApiBase(config.prompt.endpoint).toLowerCase()
  const model = String(config.prompt.model || '').toLowerCase()

  if (endpoint.includes('generativelanguage.googleapis.com')) {
    return true
  }

  return ['vision', 'vlm', 'gpt-4o', 'gemini', 'claude-3', 'qwen-vl'].some((token) => model.includes(token))
}

function mapAspectRatioToImageSize(ratio, fallbackSize) {
  if (fallbackSize !== defaultConfig.image.size) {
    return fallbackSize
  }
  return mapAspectRatioToImageApiValue(ratio)
}

function mapAspectRatioToImageApiValue(ratio) {
  const normalized = String(ratio || '').trim()
  if (!normalized || normalized === 'auto') {
    return 'auto'
  }
  return normalized
}

function resolveGeneratedImageUrl(payload) {
  const firstImage = Array.isArray(payload?.results) ? payload.results[0] : null
  if (typeof firstImage?.url === 'string' && firstImage.url) {
    return firstImage.url
  }
  if (typeof payload?.url === 'string' && payload.url) {
    return payload.url
  }
  throw httpError(502, 'Image API response did not include a usable image URL.')
}

function unwrapImageApiPayload(payload) {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    if (payload.code !== 0 || !payload.data) {
      throw httpError(502, payload.msg || 'Image provider request failed.')
    }
    return payload.data
  }

  if (payload && typeof payload === 'object') {
    return payload
  }

  throw httpError(502, 'Image provider returned an invalid response.')
}

async function createDrawTask(config, prompt, aspectRatio) {
  if (!config.image.apiKey) {
    throw httpError(500, 'Image API key is not configured on the server.')
  }

  let response
  try {
    response = await fetch(`${resolveImageApiBase(config.image.endpoint)}${IMAGE_GENERATE_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.image.apiKey}`
      },
      body: JSON.stringify({
        model: config.image.model,
        prompt,
        aspectRatio
      })
    })
  } catch {
    throw httpError(502, 'Unable to connect to the image generation provider.')
  }

  if (!response.ok) {
    throw httpError(response.status, `Image task creation failed: ${await response.text()}`)
  }

  const payload = unwrapImageApiPayload(await response.json())

  if (payload.status === 'succeeded' || payload.status === 'success') {
    return payload
  }

  if (!payload.id) {
    throw httpError(502, 'Image task creation failed without a task ID.')
  }

  return payload
}

async function pollDrawTaskResult(config, id) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < DRAW_POLL_TIMEOUT_MS) {
    let response
    try {
      const url = new URL(`${resolveImageApiBase(config.image.endpoint)}${IMAGE_RESULT_PATH}`)
      url.searchParams.set('id', id)
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.image.apiKey}`
        }
      })
    } catch {
      throw httpError(502, 'Unable to poll the image generation provider.')
    }

    if (!response.ok) {
      throw httpError(response.status, `Image task polling failed: ${await response.text()}`)
    }

    const payload = unwrapImageApiPayload(await response.json())

    if (payload.status === 'succeeded' || payload.status === 'success') {
      return payload
    }

    if (payload.status === 'failed') {
      throw httpError(502, payload.error || payload.failure_reason || 'Image generation failed.')
    }

    await delay(DRAW_POLL_INTERVAL_MS)
  }

  throw httpError(504, 'Image generation timed out.')
}

async function runDrawGeneration(prompt, size) {
  const config = await readConfig()
  const task = await createDrawTask(config, prompt, size)
  if (task.status === 'succeeded' || task.status === 'success') {
    return task
  }
  return pollDrawTaskResult(config, task.id)
}

function buildStoryboardImagePrompt(frame) {
  return [
    '请把下面的内容生成成单张高完成度中文影视分镜图。',
    '要求：单镜头、无拼贴、无文字水印、无界面元素，突出人物、场景、镜头、光影与构图。',
    '如果原文包含台词或音效，请只保留有助于画面表达的视觉信息。',
    `分镜标题：${frame.title}`,
    `分镜描述：${frame.prompt}`
  ].join('\n')
}

async function generateStoryboardFrame(payload) {
  const title = requiredString(payload.title, 'Storyboard title')
  const prompt = requiredString(payload.prompt, 'Storyboard prompt')
  const config = await readConfig()
  const data = await runDrawGeneration(buildStoryboardImagePrompt({ title, prompt }), config.image.size)
  return {
    title,
    prompt,
    imageUrl: resolveGeneratedImageUrl(data)
  }
}

async function generatePromptImage(payload) {
  const input = requiredString(payload.input, 'Image prompt')
  const ratio = requiredString(payload.ratio, 'Aspect ratio')
  const config = await readConfig()
  const size = mapAspectRatioToImageSize(ratio, config.image.size)
  const data = await runDrawGeneration(input, size)

  return {
    prompt: input,
    imageUrl: resolveGeneratedImageUrl(data)
  }
}

function buildContentSpec(seconds) {
  if (seconds <= 15) {
    return [
      '对于 15 秒及以内的视频，content 必须直接写成可复制使用的完整成片提示词。',
      '必须按秒数或时间片拆解，例如“画面（0-3 秒）”“画面（3-6 秒）”。',
      '每个时间片都要明确主体动作、镜头运动、环境变化、表情或情绪推进。',
      '如果是剧情类，可以补 1 到 2 句关键台词；如果不适合台词，可以省略。',
      '必须补充声音设计，至少包含环境声、动作音效或背景音乐方向。'
    ].join('\n')
  }

  return [
    '对于超过 15 秒的视频，可以使用 segments 数组分段，但每个 segment.prompt 仍然必须写出具体时间片。',
    'version.content 用于概括整条视频的结构、节奏和总设定。',
    '每个 segment 至少包含分段目标、分镜时间片、台词或旁白、音效或配乐、转场方式。'
  ].join('\n')
}

function buildSystemPrompt(sceneType, ratio, durationLabel, seconds, imageCount) {
  const sceneTypeMap = {
    general: '通用场景',
    dialogue: '对话剧情',
    action: '动作场景',
    ad: '商业广告',
    fantasy: '奇幻风格',
    emotion: '情绪剧情',
    auto: '请根据用户内容自动判断最合适的场景类型'
  }
  const versionRule =
    seconds <= 15
      ? '必须输出 3 个版本，三者保留同一个核心创意，但在镜头组织、情绪侧重、节奏设计上有明显区别。'
      : '输出 1 到 2 个版本即可，重点保证长视频结构完整、段落清晰。'
  const imageHint =
    imageCount > 0
      ? `7. 用户提供了 ${imageCount} 张参考图。如果要将不同图片分配到不同分镜或角色刻画，请在 prompt 中显式使用 @图片1、@图片2 等标记。`
      : ''

  return `
你是 Seedance 2.0 / 即梦视频模型的高级提示词优化师。你的职责不是改题材，而是在保留用户原始创意的前提下，把一句简短灵感扩写成更完整、更可执行、更适合视频模型生成的中文提示词。
工作原则：
1. 忠于原意，不擅自替换题材、人物关系、时代背景、场景地点和故事方向。
2. 补全缺失信息，包括主体形象、动作过程、场景环境、镜头语言、灯光氛围、材质细节、节奏变化。
3. 重点恢复“分镜感”，让输出具体到时间片，而不是泛泛描述。
4. 剧情类内容可以补少量关键台词；非剧情类内容重点写视觉动作、材质细节和镜头运动。
5. 必须补充音效、环境声、背景音乐或节奏建议，不能只写画面。
6. 输出语言要可直接复制使用，不要解释思路，也不要写分析过程。
${imageHint}

本次任务参数：
- 画面比例：${ratio}
- 视频时长：${durationLabel}（约 ${seconds} 秒）
- 场景类型：${sceneTypeMap[sceneType] || sceneType}

输出要求：
- 只能返回一个合法 JSON 对象，不要输出 markdown 代码块，也不要输出额外说明。
- ${versionRule}
- ${buildContentSpec(seconds)}

JSON 结构必须是：
{
  "theme": "一句话概括主题",
  "versions": [
    {
      "title": "中文版本标题",
      "style": "中文风格标签",
      "content": "完整提示词正文",
      "segments": [
        {
          "partTitle": "例如：第一段 0-15 秒",
          "action": "例如：正常生成 / 承接上一段 / 情绪升级",
          "prompt": "该段完整提示词",
          "transition": "与下一段的衔接建议"
        }
      ]
    }
  ],
  "tips": ["最多 3 条实用建议"]
}`.trim()
}

function buildUserPrompt(input) {
  return [
    '请严格保留我原始创意的核心，不要改题。',
    '请补全成更适合 Seedance / 即梦生成的视频提示词。',
    `原始灵感：${input}`
  ].join('\n')
}

function sanitizeContent(raw) {
  return String(raw || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*```json/i, '')
    .replace(/^\s*```/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

function parseProviderJson(content) {
  const text = sanitizeContent(content)
  try {
    return JSON.parse(text)
  } catch {
    const extracted = extractFirstJsonObject(text)
    if (extracted) {
      return JSON.parse(extracted)
    }
    throw new Error('Provider response did not contain a JSON object.')
  }
}

function extractFirstJsonObject(text) {
  const start = text.indexOf('{')
  if (start === -1) return ''

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  return ''
}

function normalizeResult(parsedData, input, durationLabel, ratio, sceneType) {
  const normalizedVersions = Array.isArray(parsedData?.versions)
    ? parsedData.versions
        .filter((item) => item && (item.content || Array.isArray(item.segments)))
        .map((item, index) => ({
          title: item.title || `版本 ${index + 1}`,
          style: item.style || '默认风格',
          content: item.content || '',
          segments: Array.isArray(item.segments)
            ? item.segments
                .filter((segment) => segment?.prompt)
                .map((segment, segmentIndex) => ({
                  partTitle: segment.partTitle || `段落 ${segmentIndex + 1}`,
                  action: segment.action || '继续生成',
                  prompt: segment.prompt,
                  transition: segment.transition || ''
                }))
            : undefined
        }))
    : []

  return {
    theme: parsedData?.theme || input,
    duration: durationLabel,
    ratio,
    sceneType: sceneType === 'auto' ? 'general' : sceneType,
    versions: normalizedVersions,
    tips:
      Array.isArray(parsedData?.tips) && parsedData.tips.length > 0
        ? parsedData.tips.slice(0, 3)
        : ['建议先确认主角造型和镜头节奏，再按需微调台词与音效描述。']
  }
}

async function optimizePrompt(payload) {
  const config = await readConfig()
  if (!config.prompt.apiKey) {
    throw httpError(500, 'Prompt API key is not configured on the server.')
  }

  const input = requiredString(payload.input, 'Prompt input')
  const sceneType = requiredString(payload.sceneType, 'Scene type')
  const duration = requiredString(payload.duration, 'Duration')
  const ratio = requiredString(payload.ratio, 'Aspect ratio')
  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : []
  const customSeconds = Number(payload.customSeconds)

  const durationMap = {
    short: { label: '短视频', seconds: 8 },
    medium: { label: '中视频', seconds: 15 },
    long: { label: '长视频', seconds: 30 },
    custom: { label: '自定义时长', seconds: Number.isFinite(customSeconds) ? customSeconds : 30 }
  }

  const durationConfig = durationMap[duration] || durationMap.long
  const seconds = duration === 'custom' ? durationConfig.seconds : durationConfig.seconds
  const durationLabel =
    duration === 'custom' ? `自定义时长（${durationConfig.seconds} 秒）` : durationConfig.label

  let response
  try {
    response = await fetch(`${resolveApiBase(config.prompt.endpoint)}/chat/completions`, {
      method: 'POST',
      headers: buildOptimizeHeaders(config),
      body: JSON.stringify({
        model: config.prompt.model,
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(sceneType, ratio, durationLabel, seconds, images.length)
          },
          {
            role: 'user',
            content:
              images.length > 0
                ? [
                    { type: 'text', text: buildUserPrompt(input) },
                    ...images.map((img) => ({ type: 'image_url', image_url: { url: img } }))
                  ]
                : buildUserPrompt(input)
          }
        ]
      })
    })
  } catch {
    throw httpError(502, 'Unable to connect to the prompt provider.')
  }

  if (!response.ok) {
    const errText = await response.text()
    if (errText.includes('model_not_found')) {
      throw httpError(400, 'The configured prompt model is unavailable. Update it in the admin console.')
    }
    
    let cleanMessage = errText
    try {
      const parsedErr = JSON.parse(errText)
      cleanMessage = parsedErr?.error?.message || errText
    } catch {
      // Ignored
    }

    if (cleanMessage.includes('VLM') || cleanMessage.includes('纯文本') || cleanMessage.includes('vision')) {
      throw httpError(400, '当前配置的大模型不支持图片解析，请更换为视觉大模型（VLM）或移除参考图片后重试。')
    }

    throw httpError(response.status, `提示优化请求失败：${cleanMessage}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  try {
    return normalizeResult(parseProviderJson(content), input, durationLabel, ratio, sceneType)
  } catch {
    throw httpError(502, 'Prompt provider returned invalid JSON.')
  }
}
