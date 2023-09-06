<script setup lang="ts">
import { useMainStore } from '../stores/main'
import { computed, ref } from 'vue'

const store = useMainStore()
const form = ref()
const isFetching = ref()
const playlistData = computed(
  () =>
    store.playlistData || {
      name: '',
      image: '',
      numberOfSongs: 0
    }
)

const playlistUrl = ref()

function validatePlaylistUrl(val): boolean | string {
  const spotifyPlaylistRegex = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]{22}$/
  return spotifyPlaylistRegex.test(val) || 'Invalid Playlist Url'
}

async function submit(): Promise<void> {
  const { valid } = await form.value.validate()

  if (!valid) {
    return
  }

  isFetching.value = true

  try {
    await store.setPlaylist(playlistUrl.value)
  } catch (e) {
    console.log('e', e)
  } finally {
    isFetching.value = false
  }
}
</script>

<template>
  <v-card rounded variant="outlined" prepend-icon="custom:playlist" color="#DFE0E233">
    <template #title> Playlist </template>

    <v-img aspect-ratio="1" :src="playlistData.image" cover class="rounded-lg ma-4">
      <template #placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-sheet height="100%" width="100%" color="rgba(18, 19, 20, 0.25)" />
        </v-row>
      </template>
    </v-img>

    <v-card-title class="text-h5">
      {{ playlistData.name }}
    </v-card-title>

    <v-container>
      <v-row>
        <v-col>
          <v-form ref="form" @submit.prevent="submit">
            <v-text-field
              v-model="playlistUrl"
              variant="outlined"
              density="compact"
              :loading="isFetching"
              :rules="[() => !!playlistUrl || 'This field is required', validatePlaylistUrl]"
              placeholder="https://open.spotify.com/..."
            />
          </v-form>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped lang="less"></style>
