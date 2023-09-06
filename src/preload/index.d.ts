import { ElectronAPI } from '@electron-toolkit/preload'
import { PlaylistData } from '../renderer/src/stores/stream'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runStream: (playlistUrl: string, settings: string, account: string) => Promise<void>
      stopStream: (email: string) => Promise<void>
      fetchPlaylistData: (playlistUrl: string) => Promise<PlaylistData>
      onStatus: (callback: function) => Promise<void>
      onDailyReport: (callback: function) => Promise<void>
      onMonthlyReport: (callback: function) => Promise<void>
      sendCompletedMail: () => Promis<void>
    }
  }
}
