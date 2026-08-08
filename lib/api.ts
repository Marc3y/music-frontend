import type { AudioFile, Playlist, User } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.marcey.xyz'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return res.ok
    } catch {
      return false
    } finally {
      isRefreshing = false
    }
  })()
  return refreshPromise
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip the automatic 401 -> refresh -> retry flow. */
  skipRefresh?: boolean
}

/**
 * Central API client. Always sends credentials (httpOnly cookies), parses the
 * `{ error }` envelope, and transparently refreshes the access token on 401.
 */
export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipRefresh, headers, ...rest } = options

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let res = await doFetch()

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await doFetch()
    }
  }

  if (res.status === 204) {
    return undefined as T
  }

  let data: unknown = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : null) || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }

  return data as T
}

/* ----------------------------- Auth ----------------------------- */

export const authApi = {
  register: (body: { email: string; username: string; password: string }) =>
    apiClient<{ message: string }>('/auth/register', { method: 'POST', body }),

  verifyEmail: (body: { email: string; code: string }) =>
    apiClient<{ message: string }>('/auth/verify-email', { method: 'POST', body }),

  resendVerification: (body: { email: string }) =>
    apiClient<{ message: string }>('/auth/resend-verification-code', {
      method: 'POST',
      body,
    }),

  login: (body: { email: string; password: string }) =>
    apiClient<{ message: string; user: User }>('/auth/login', {
      method: 'POST',
      body,
      skipRefresh: true,
    }),

  logout: () => apiClient<{ message: string }>('/auth/logout', { method: 'POST' }),

  forgotPassword: (body: { email: string }) =>
    apiClient<{ message: string }>('/auth/forgot-password', { method: 'POST', body }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    apiClient<{ message: string }>('/auth/reset-password', { method: 'POST', body }),
}

/* --------------------------- Playlists --------------------------- */

export const playlistApi = {
  list: () => apiClient<Playlist[]>('/playlists'),
  get: (id: string) => apiClient<Playlist>(`/playlists/${id}`),
  create: (name: string) =>
    apiClient<Playlist>('/playlists', { method: 'POST', body: { name } }),
  update: (id: string, name: string) =>
    apiClient<Playlist>(`/playlists/${id}`, { method: 'PATCH', body: { name } }),
  remove: (id: string) =>
    apiClient<{ message: string }>(`/playlists/${id}`, { method: 'DELETE' }),
  coverUploadUrl: (id: string, body: { filename: string; contentType: string }) =>
    apiClient<{ uploadUrl: string; key: string }>(`/playlists/${id}/cover-upload-url`, {
      method: 'POST',
      body,
    }),
}

/* -------------------------- Audio files -------------------------- */

export const audioApi = {
  listByPlaylist: (playlistId: string) =>
    apiClient<AudioFile[]>(`/audio-files/playlists/${playlistId}`),
  get: (id: string) => apiClient<AudioFile>(`/audio-files/${id}`),
  initUpload: (
    playlistId: string,
    body: { filename: string; contentType: string; fileSize: number },
  ) =>
    apiClient<{ uploadUrl: string; key: string; fileSize: number; mimeType: string }>(
      `/audio-files/playlists/${playlistId}/init-upload`,
      { method: 'POST', body },
    ),
  confirmUpload: (
    playlistId: string,
    body: { key: string; originalFilename: string; fileSize: number; mimeType: string },
  ) =>
    apiClient<AudioFile>(`/audio-files/playlists/${playlistId}/confirm-upload`, {
      method: 'POST',
      body,
    }),
  update: (
    id: string,
    body: { title?: string; artist?: string; description?: string },
  ) => apiClient<AudioFile>(`/audio-files/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiClient<{ message: string }>(`/audio-files/${id}`, { method: 'DELETE' }),
  coverUploadUrl: (id: string, body: { filename: string; contentType: string }) =>
    apiClient<{ uploadUrl: string; key: string }>(`/audio-files/${id}/cover-upload-url`, {
      method: 'POST',
      body,
    }),
  stream: (id: string) =>
    apiClient<{ streamUrl: string }>(`/audio-files/${id}/stream`),
  share: (id: string) =>
    apiClient<{ shareToken: string; shareUrl: string }>(`/audio-files/${id}/share`, {
      method: 'POST',
    }),
  unshare: (id: string) =>
    apiClient<{ message: string }>(`/audio-files/${id}/unshare`, { method: 'POST' }),
  publicStream: (shareToken: string) =>
    apiClient<{
      streamUrl: string
      title: string
      artist?: string
      description?: string
    }>(`/audio-files/public/stream/${shareToken}`, { skipRefresh: true }),
}

/* ------------------------- Direct uploads ------------------------ */

/**
 * Uploads a file directly to the presigned MinIO/S3 URL with real progress.
 * Uses XMLHttpRequest because fetch has no upload-progress support.
 */
export function uploadToPresignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error('Upload fehlgeschlagen, bitte erneut versuchen'))
    }
    xhr.onerror = () => reject(new Error('Upload fehlgeschlagen, bitte erneut versuchen'))
    xhr.onabort = () => reject(new Error('Upload abgebrochen'))
    xhr.send(file)
  })
}
