<script setup lang="ts">
import LfPlaylistForm from './components/LfPlaylistForm.vue'
import LfSettingsForm from './components/LfSettingsForm.vue'
import { useMainStore } from './stores/main'
import { DateTime } from 'luxon'

const store = useMainStore()

window.api.onStatus((_e, value) => {
  const { email, data, running } = JSON.parse(value)
  store.setStatus(email, { data, running })
})

window.api.onDailyReport((event, _v) => {
  const yesterday = DateTime.now().minus({ day: 1 }).toFormat('dd-MM-yyyy')
  const yesterdayRevenue = store.sendDailyStreams(yesterday)
  event.sender.send('yesterday-revenue', JSON.stringify({ ...yesterdayRevenue, date: yesterday }))
})

window.api.onMonthlyReport((event, _v) => {
  const lastMonth = DateTime.now().minus({ month: 1 }).toFormat('MM-yyyy')
  const lastMonthRevenue = store.sendMonthlyStreams(lastMonth)
  event.sender.send('last-month-revenue', JSON.stringify({ ...lastMonthRevenue, date: lastMonth }))
})
</script>

<template>
  <v-layout :full-height="true">
    <v-main class="px-10">
      <div class="flex-shrink-1 flex-grow-0 my-4" style="height: 60px; width: 100%">
        <v-list-item class="px-0">
          <template #prepend>
            <v-icon size="50">custom:spotify</v-icon>
          </template>
          <v-list-item-title>{{
            store.running ? 'Running' : 'No active deployments'
          }}</v-list-item-title>
          <v-list-item-subtitle v-if="!store.running && store.lastRunningAt"
            >Last run on
            {{
              DateTime.fromJSDate(store.lastRunningAt).toFormat('M/d/yy h:mma')
            }}</v-list-item-subtitle
          >
        </v-list-item>
      </div>
      <div class="flex-grow-1" style="width: 100%">
        <div class="d-flex flex-row fill-height" style="gap: 40px">
          <div class="flex-grow-0 flex-shrink-0" style="flex: 250px">
            <lf-playlist-form />
          </div>
          <div class="flex-grow-1">
            <lf-settings-form />
          </div>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<style lang="less">
@import './assets/css/styles.less';
</style>
