import { ElectronAPI } from '@electron-toolkit/preload'
import { PlaylistData } from '../../types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runStream: (playlistUrl: string, settings: string, accounts: string) => Promise<void>
      stopStream: () => Promise<void>
      fetchPlaylistData: (playlistUrl: string) => Promise<PlaylistData>
    }
  }
}
