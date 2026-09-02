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

export interface StorageSummary {
  used: number
  limit: number
}

export interface UsageTrack {
  _id: string
  title: string
  size: number
  versionCount: number
  playlistId: string
  playlistName: string | null
  status: AudioStatus
}

export interface UsageProject {
  trackId: string
  versionId: string
  trackTitle: string
  versionLabel: string
  playlistName: string | null
  filename: string
  size: number
}

export interface UsageInfo extends StorageSummary {
  tracks: UsageTrack[]
  projects: UsageProject[]
}

export type AudioStatus = 'processing' | 'ready' | 'failed'

export interface TrackVersion {
  _id: string
  label: string
  originalFilename: string
  fileSize: number
  mimeType: string
  duration?: number
  bpm?: number | null
  musicalKey?: string | null
  projectFilename?: string
  projectSize?: number
  status: AudioStatus
  createdAt: string
}

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
  shareProject?: boolean
  bpm?: number | null
  musicalKey?: string | null
  versions: TrackVersion[]
  selectedVersionId: string
  createdAt: string
  updatedAt: string
}
