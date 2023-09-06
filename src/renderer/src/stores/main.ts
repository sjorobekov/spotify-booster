import { defineStore } from 'pinia'
import { Account, AccountStatus, PlaylistData, StreamSettings } from '../../../types'
import Papa from 'papaparse'
import { useStreamStore } from './steams'
import { DateTime } from 'luxon'
import Decimal from 'decimal.js'

const streamPrice = '0.0035'

export const useMainStore = defineStore({
  id: 'main',
  persist: true,
  state: () => ({
    accounts: [] as Account[],
    playlistDataFetching: false as boolean,
    settings: {
      numberOfStreams: 100,
      numberOfSongs: 0,
      numberOfBreaks: 0,
      breakDurationFrom: 0,
      breakDurationTo: 0
    } as StreamSettings,
    playlistUrl: null as string | null,
    playlistData: null as PlaylistData | null,
    error: null,
    lastRunningAt: null as Date | null,
    currentStreams: { value: 0, revenue: '0' } as { value: number; revenue: string },
    daylyStreams: {} as Record<string, { value: number; revenue: string; sent: boolean }>,
    monthlyStreams: {} as Record<string, { value: number; revenue: string; sent: boolean }>
  }),
  getters: {
    running() {
      if (this.playlistDataFetching) {
        return true
      }
      const stream = useStreamStore()
      return Boolean(Object.keys(stream.running).length)
    },

    accountsWithStatus(): Array<Account & AccountStatus> {
      const stream = useStreamStore()
      return this.accounts.map((account) => {
        return {
          ...account,
          ...(stream.running[account.email] || { running: false })
        }
      })
    },

    songsDuration(): string {
      if (!this.playlistData?.duration) {
        return '00:00:00'
      }
      const accountsCount = this.accounts.length !== 0 ? this.accounts.length : 1
      const [h, m, s] = this.playlistData.duration.split(':')
      let totalSeconds = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
      totalSeconds = (totalSeconds * this.settings.numberOfStreams) / accountsCount
      return secondsToTime(totalSeconds)
    }
  },
  actions: {
    async runAll() {
      if (!this.playlistUrl || !this.accounts.length) {
        return
      }

      await this.refreshPlaylist()

      this.accounts.forEach((account, i) => {
        setTimeout(() => this.run(account, false), i * 1000)
      })
    },

    async stopAll() {
      this.accountsWithStatus.forEach((account) => {
        this.stop(account.email)
      })

      this.lastRunningAt = new Date()
    },

    async stop(email: string) {
      const stream = useStreamStore()

      try {
        await window.api.stopStream(email)
      } catch (e) {
        console.error('Error while trying to stop stream', e)
      } finally {
        delete stream.running[email]
      }
    },

    async run(account: Account, prefetchPlaylistData = true) {
      const stream = useStreamStore()

      stream.running[account.email] = { startedAt: new Date(), running: true }

      if (prefetchPlaylistData) {
        try {
          await this.refreshPlaylist()
        } catch (e) {
          delete stream.running[account.email]
        }
      }

      if (!this.playlistUrl) {
        return
      }

      try {
        await window.api.runStream(
          this.playlistUrl,
          JSON.stringify({
            ...this.settings,
            numberOfStreams: Math.floor(this.settings.numberOfStreams / this.accounts.length)
          }),
          JSON.stringify(account)
        )
      } catch (e) {
        console.error('Unable to run stream', e)
        delete stream.running[account.email]
      }
    },

    async setPlaylist(playlistUrl: string) {
      this.playlistDataFetching = true
      try {
        this.playlistData = await window.api.fetchPlaylistData(playlistUrl)
        this.playlistUrl = playlistUrl
        this.settings.numberOfSongs = this.playlistData?.numberOfSongs || 0
      } catch (e) {
        console.error('Error while trying to fetch playlist data', e)
      } finally {
        this.playlistDataFetching = false
      }
    },

    async refreshPlaylist() {
      if (!this.playlistUrl) {
        return
      }

      await this.setPlaylist(this.playlistUrl)
    },

    async uploadAccounts() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'text/csv'
      input.onchange = (e): void => {
        const target = e.target as HTMLInputElement

        if (!target.files || !target.files.length) {
          return
        }

        const file = target.files[0]
        const reader = new FileReader()

        // Define a callback function to run, when FileReader finishes its job
        reader.onload = (e): void => {
          const result = Papa.parse(e.target?.result, {
            header: true
          })
          console.log('result', result)
          this.accounts = result.data
        }
        reader.readAsText(file)
      }

      input.click()
    },

    setStatus(email, { data, running }) {
      const stream = useStreamStore()

      if (!stream.running[email]) {
        return
      }

      stream.running[email].statusText = data

      if (running === false) {
        stream.running[email].running = false
        this.lastRunningAt = new Date()
      }
      if (stream.running[email].statusText === 'Completed') {
        this.incrementCurrentStreams()
        this.incrementDailyStreams()
        this.incrementMonthlyStreams()
      }
      this.checkStreamsCompleted()
    },

    checkStreamsCompleted() {
      const stream = useStreamStore()
      const completed = Object.values(stream.running).every(
        (value) => value.statusText === 'Completed'
      )
      if (completed) {
        stream.running = {}
        window.api.sendCompletedMail()
        this.currentStreams = { value: 0, revenue: '0' }
      }
    },

    incrementCurrentStreams() {
      this.currentStreams.value += 1
      this.currentStreams.revenue = new Decimal(this.currentStreams.revenue)
        .plus(new Decimal(streamPrice))
        .toFixed()
    },

    incrementDailyStreams() {
      const today = DateTime.now().toFormat('dd-MM-yyyy')
      if (today in this.daylyStreams) {
        this.daylyStreams[today].value += 1
        this.daylyStreams[today].revenue = new Decimal(this.daylyStreams[today].revenue)
          .plus(new Decimal(streamPrice))
          .toFixed()
      } else {
        this.daylyStreams[today] = { value: 1, sent: false, revenue: streamPrice }
      }
    },

    incrementMonthlyStreams() {
      const month = DateTime.now().toFormat('MM-yyyy')
      if (month in this.monthlyStreams) {
        this.monthlyStreams[month].value += 1
        this.monthlyStreams[month].revenue = new Decimal(this.monthlyStreams[month].revenue)
          .plus(new Decimal(streamPrice))
          .toFixed()
      } else {
        this.monthlyStreams[month] = { value: 1, sent: false, revenue: streamPrice }
      }
    },

    sendDailyStreams(day: string) {
      this.daylyStreams[day].sent = true
      return this.daylyStreams[day]
    },

    sendMonthlyStreams(month: string) {
      this.monthlyStreams[month].sent = true
      return this.monthlyStreams[month]
    }
  }
})

function secondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds %= 3600
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${hours}:${minutes}:${seconds}`
}
