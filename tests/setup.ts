import { config } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'
import { colorModeRef } from './utils/color-mode'
import './mocks/vue-flow'
import { resetVueFlowMocks } from './mocks/vue-flow'

vi.stubGlobal('useColorMode', () => colorModeRef)

config.global.stubs = {
  UIcon: {
    template: '<i class="uicon-stub" />'
  },
  Transition: {
    template: '<div><slot /></div>'
  }
}

afterEach(() => {
  vi.clearAllMocks()
  colorModeRef.value = 'light'
  resetVueFlowMocks()
})
