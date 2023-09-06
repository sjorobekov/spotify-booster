<script setup lang="ts">
import { ref } from 'vue'
import { useMainStore } from '../stores/main'
const dialog = ref(false)

const main = useMainStore()
</script>

<template>
  <v-dialog v-model="dialog" :scrim="false" transition="dialog-bottom-transition" max-width="400">
    <template #activator="data">
      <slot name="activator" v-bind="data" />
    </template>
    <v-card>
      <v-toolbar>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-list>
        <v-list-item v-for="account in main.accountsWithStatus" :key="account.email">
          <template #prepend>
            <v-icon>mdi-robot</v-icon>
          </template>
          <v-list-item-title>{{ account.email }}</v-list-item-title>
          <v-list-item-subtitle>{{
            account.statusText || account.proxy || 'No proxy is set'
          }}</v-list-item-subtitle>
          <template #append>
            <v-btn v-if="!account.running" icon="mdi-play" @click="main.run(account)"></v-btn>
            <v-btn v-else icon="mdi-stop" @click="main.stop(account.email)"></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less"></style>
