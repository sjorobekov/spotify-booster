import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PlaylistData } from '../types'
// Custom APIs for renderer

const api = {
  onStatus: (callback): void => {
    ipcRenderer.on('status', callback)
  },

  runStream: (playlistUrl: string, settings: string, accounts: string): Promise<void> => {
    return ipcRenderer.invoke('stream:run', playlistUrl, settings, accounts)
  },

  stopStream: (email: string): Promise<void> => {
    return ipcRenderer.invoke('stream:stop', email)
  },

  fetchPlaylistData: (playlistUrl: string): Promise<PlaylistData> =>
    ipcRenderer.invoke('stream:fetchPlaylistData', playlistUrl),

  onDailyReport: (callback): void => {
    ipcRenderer.on('daily-report', callback)
  },

  onMonthlyReport: (callback): void => {
    ipcRenderer.on('monthly-report', callback)
  },

  sendCompletedMail: (): Promise<void> => {
    return ipcRenderer.invoke('mail:send', 0, '0')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
