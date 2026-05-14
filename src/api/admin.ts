export interface AdminConfigResponse {
  prompt: {
    endpoint: string
    model: string
    apiKeyConfigured: boolean
  }
  image: {
    endpoint: string
    model: string
    size: string
    apiKeyConfigured: boolean
  }
}

export interface AdminConfigUpdate {
  prompt: {
    endpoint: string
    model: string
    apiKey?: string
  }
  image: {
    endpoint: string
    model: string
    size: string
    apiKey?: string
  }
}

export interface GalleryItem {
  id: string
  title: string
  prompt: string
  thumbnail: string
  tags: string[]
  author: string
  date: string
  badge: string
  sourceUrl: string
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      message = await response.text()
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function fetchAdminSession() {
  return readJson<{ authenticated: boolean }>(await fetch('/api/admin/session', { credentials: 'include' }))
}

export async function loginAdmin(password: string) {
  return readJson<{ authenticated: boolean }>(
    await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
  )
}

export async function logoutAdmin() {
  return readJson<{ authenticated: boolean }>(
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include'
    })
  )
}

export async function fetchAdminConfig() {
  return readJson<AdminConfigResponse>(await fetch('/api/admin/config', { credentials: 'include' }))
}

export async function saveAdminConfig(payload: AdminConfigUpdate) {
  return readJson<AdminConfigResponse>(
    await fetch('/api/admin/config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  )
}

export async function fetchGalleryItems(admin = false) {
  return readJson<GalleryItem[]>(
    await fetch(admin ? '/api/admin/gallery' : '/api/gallery', {
      credentials: admin ? 'include' : 'same-origin'
    })
  )
}

export async function createGalleryItem(item: GalleryItem) {
  return readJson<GalleryItem>(
    await fetch('/api/admin/gallery', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
  )
}

export async function updateGalleryItem(item: GalleryItem) {
  return readJson<GalleryItem>(
    await fetch(`/api/admin/gallery/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
  )
}

export async function deleteGalleryItem(id: string) {
  await readJson<void>(
    await fetch(`/api/admin/gallery/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
  )
}
