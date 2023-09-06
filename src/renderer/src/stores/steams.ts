import { defineStore } from 'pinia'
import { AccountStatus } from '../../../types'

export const useStreamStore = defineStore({
  id: 'stream',
  persist: false,
  state: () => ({
    songsInPlaylist: 0,
    streamsToPlayInTotal: 0,
    streamsLeftToPlay: 0,
    running: {} as { [key: string]: AccountStatus }
  })
})
