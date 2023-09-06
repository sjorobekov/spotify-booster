import { h } from 'vue'
import type { IconSet, IconProps } from 'vuetify'
import playlist from './playlist.vue'
import settings from './settings.vue'
import spotify from './spotify.vue'
import clock from './clock.vue'
import stick from './stick.vue'

// @ts-ignore needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customSvgNameToComponent: any = {
  playlist,
  settings,
  spotify,
  clock,
  stick
}

const icons: IconSet = {
  // @ts-ignore needed
  component: (props: IconProps) => h(customSvgNameToComponent[props.icon])
}

export { icons /* aliases */ }
