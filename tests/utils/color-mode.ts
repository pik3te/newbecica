import { ref } from 'vue'

export type ColorMode = 'light' | 'dark'

export const colorModeRef = ref<ColorMode>('light')
