export interface Account {
  email: string
  password: string
  proxy: string
}

export interface StreamSettings {
  numberOfStreams: number
  numberOfBreaks: number
  breakDurationFrom: number
  breakDurationTo: number
  numberOfSongs: number
}

export interface PlaylistData {
  name: string
  image: string
  numberOfSongs: number
  duration: string
}

export interface AccountStatus {
  running: boolean
  startedAt?: Date
  statusText?: string
}
