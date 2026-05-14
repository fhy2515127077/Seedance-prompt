const baseUrl = import.meta.env.BASE_URL || '/'

export function withBasePath(path: string) {
  if (!path) return baseUrl

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.replace(/^\/+/, '')

  return `${normalizedBase}${normalizedPath}`
}
