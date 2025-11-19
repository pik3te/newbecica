import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const r = (path: string) => resolve(dirname(fileURLToPath(import.meta.url)), path)
const appDir = r('app')

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [r('tests/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov']
    }
  },
  resolve: {
    alias: {
      '~': appDir,
      '~/': appDir,
      '@': appDir,
      '@/': appDir
    }
  }
})
