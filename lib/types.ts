export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string | null
  hasPassword?: boolean
}

export interface Playlist {
  _id: string
  name: string
  coverKey?: string
  coverUrl?: string | null
  owner: string
  createdAt: string
  updatedAt: string
  role?: 'owner' | 'collaborator'
  shareEnabled?: boolean
  shareToken?: string
  shareRestricted?: boolean
  shareAllowDownload?: boolean
  allowedUsernames?: string[]
  collabToken?: string
  collaborators?: { username: string; userId?: string }[]
  /** Only on the single-playlist endpoint (getPlaylistById). */
  ownerUser?: UserBrief | null
  activeCollaborators?: UserBrief[]
}

export interface UserBrief {
  username: string
  avatarUrl?: string | null
}

export interface PublicPlaylistTrack {
  _id: string
  title: string
  artist?: string
  bpm?: number | null
  musicalKey?: string | null
  duration?: number | null
  kind: 'track' | 'project'
  hasProject: boolean
}

export interface PublicPlaylist {
  accessible: boolean
  needsLogin?: boolean
  name: string
  coverUrl?: string | null
  trackCount?: number
  canDownload?: boolean
  tracks?: PublicPlaylistTrack[]
}

export interface StorageSummary {
  used: number
  limit: number
}

export interface UsageTrack {
  _id: string
  title: string
  kind?: 'track' | 'project'
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

export interface SavedShare {
  _id: string
  type: 'audio' | 'project' | 'playlist' | 'collab'
  token: string
  title: string
  artist?: string
  bpm?: number | null
  musicalKey?: string | null
  projectFilename?: string
  projectSize?: number
  playlistId?: string
  coverUrl?: string | null
  trackCount?: number
  addedAt: string
}

export type AudioStatus = 'processing' | 'ready' | 'failed'

export interface TrackVersion {
  _id: string
  label: string
  originalFilename?: string
  fileSize?: number
  mimeType?: string
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
  kind?: 'track' | 'project'
  key?: string
  coverKey?: string
  coverUrl?: string | null
  originalFilename?: string
  title: string
  artist?: string
  description?: string
  duration?: number
  fileSize?: number
  mimeType?: string
  status: AudioStatus
  order?: number
  shareEnabled: boolean
  shareToken?: string
  shareProject?: boolean
  projectShareEnabled?: boolean
  projectShareToken?: string
  bpm?: number | null
  musicalKey?: string | null
  versions: TrackVersion[]
  selectedVersionId: string
  createdAt: string
  updatedAt: string
}
