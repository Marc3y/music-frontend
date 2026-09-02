export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string | null
}

export interface Playlist {
  _id: string
  name: string
  coverKey?: string
  coverUrl?: string | null
  owner: string
  createdAt: string
  updatedAt: string
}

export type AudioStatus = 'processing' | 'ready' | 'failed'

export interface AudioFile {
  _id: string
  playlistId: string
  owner: string
  key: string
  coverKey?: string
  coverUrl?: string | null
  originalFilename: string
  title: string
  artist?: string
  description?: string
  duration?: number
  fileSize: number
  mimeType: string
  status: AudioStatus
  order?: number
  shareEnabled: boolean
  shareToken?: string
  createdAt: string
  updatedAt: string
}
