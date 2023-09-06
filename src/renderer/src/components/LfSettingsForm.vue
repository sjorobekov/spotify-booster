<script setup lang="ts">
import { computed } from 'vue'
import { StreamSettings } from '../../../types'
import { useMainStore } from '../stores/main'
import LfAccountsModal from './LfAccountsModal.vue'

const store = useMainStore()

const settings = computed({
  get() {
    return store.settings
  },
  set(newValue: StreamSettings) {
    store.settings = newValue
  }
})
</script>

<template>
  <v-card rounded variant="outlined" prepend-icon="custom:settings" color="#DFE0E233" class="blur">
    <template #title> Settings </template>

    <v-container>
      <v-row>
        <v-col cols="12">
          <h3 class="card-title mb-4">Number of streams</h3>

          <v-text-field
            v-model="settings.numberOfStreams"
            class="mb-2"
            type="number"
            style="max-width: 150px"
            hide-details
            variant="outlined"
            density="compact"
            :min="1"
            required
            suffix="streams"
          />

          <div class="d-flex pl-2 mb-4">
            <v-icon>custom:stick</v-icon>
            <h3 class="card-title pt-2">
              <v-icon size="15" class="mr-2">custom:clock</v-icon>Estimated run time
            </h3>
          </div>

          <v-text-field
            v-model="store.songsDuration"
            class="mb-2 pl-12"
            style="max-width: 150px"
            hide-details
            :readonly="true"
            variant="outlined"
            density="compact"
          />

          <div>
            <strong>Upload Accounts</strong>
            <a class="replace-file" @click.prevent="store.uploadAccounts">replace file</a>
          </div>
          <div>
            <span v-if="!store.accounts.length">No accounts uploaded</span>
            <lf-accounts-modal v-else>
              <template #activator="{ props }">
                <a v-bind="props" class="replace-file"
                  >{{ store.accounts.length }} accounts uploaded</a
                >
              </template>
            </lf-accounts-modal>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn
            v-if="!store.running"
            variant="outlined"
            width="192"
            height="59"
            class="btn-start"
            @click="store.runAll()"
            >Start</v-btn
          >

          <v-btn
            v-else
            variant="outlined"
            width="192"
            height="59"
            class="btn-start"
            @click="store.stopAll()"
            >Stop</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped lang="less">
.blur {
  backdrop-filter: blur(14px);
}

.btn-start {
  border-color: rgba(0, 0, 0, 0.25);
  background: rgba(18, 19, 20, 0.25);
  color: #fefefe;
  text-transform: initial;
  font-size: 28px;
  font-weight: 600;
}

.replace-file {
  color: #1ed760;
  cursor: pointer;
}
</style>
