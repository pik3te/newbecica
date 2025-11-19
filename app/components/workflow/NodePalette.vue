<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { Styles } from '@vue-flow/core'

const accentPalette = {
  start: '#6EE7B7',
  automation: '#FB923C',
  http: '#93C5FD',
  end: '#F87171',
  condition: '#FCD34D',
  approval: '#FCD34D',
  loop: '#A78BFA',
  note: '#FDE68A'
} as const

type PaletteSection = {
  title: string
  items: PaletteItem[]
}

export type PaletteItem = {
  label: string
  type: string
  icon: string
  accent: string
  data?: Record<string, unknown>
  style?: Styles
}

const sections: PaletteSection[] = [
  {
    title: 'Main flow',
    items: [
      {
        label: 'Start',
        type: 'start',
        icon: 'i-lucide-play',
        accent: accentPalette.start,
        data: { label: 'Start', icon: 'i-lucide-play', accent: accentPalette.start }
      },
      {
        label: 'Automated action',
        type: 'app',
        icon: 'i-lucide-bolt',
        accent: accentPalette.automation,
        data: {
          label: 'Automated action',
          icon: 'i-lucide-bolt',
          accent: accentPalette.automation
        }
      },
      {
        label: 'HTTP request',
        type: 'app',
        icon: 'i-lucide-globe',
        accent: accentPalette.http,
        data: { label: 'HTTP request', icon: 'i-lucide-globe', accent: accentPalette.http }
      },
      {
        label: 'End',
        type: 'end',
        icon: 'i-material-symbols-stop-outline-rounded',
        accent: accentPalette.end,
        data: {
          label: 'End',
          icon: 'i-material-symbols-stop-outline-rounded',
          accent: accentPalette.end
        }
      }
    ]
  },
  {
    title: 'Logic & control',
    items: [
      {
        label: 'If / Else condition',
        type: 'ifElse',
        icon: 'i-lucide-git-branch',
        accent: accentPalette.condition,
        data: {
          label: 'If / Else condition',
          condition: 'payload.status === "success"',
          icon: 'i-lucide-git-branch',
          accent: accentPalette.condition
        }
      },
      {
        label: 'Manual approval',
        type: 'ifElse',
        icon: 'i-lucide-user-check',
        accent: accentPalette.approval,
        data: {
          label: 'Manual approval',
          condition: 'approval.status === "approved"',
          icon: 'i-lucide-user-check',
          accent: accentPalette.approval
        }
      },
      {
        label: 'Loop over items',
        type: 'loop',
        icon: 'i-lucide-refresh-ccw',
        accent: accentPalette.loop,
        data: { label: 'Loop over items', accent: accentPalette.loop }
      }
    ]
  },
  {
    title: 'Notes & context',
    items: [
      {
        label: 'Quick note',
        type: 'note',
        icon: 'i-lucide-sticky-note',
        accent: accentPalette.note,
        data: { text: 'Sticky note', color: accentPalette.note }
      }
    ]
  }
]

const onDragStart = (event: DragEvent, item: PaletteItem) => {
  if (!event.dataTransfer) { return }
  event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
  event.dataTransfer.effectAllowed = 'move'
}

const emit = defineEmits<{
  (event: 'select', item: PaletteItem): void
}>()

const paletteRootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isHighlighted = ref(false)
let highlightTimer: ReturnType<typeof setTimeout> | null = null
const isPersistentHighlight = ref(false)
const isSelectionMode = ref(false)

const clearHighlightTimer = () => {
  if (highlightTimer) {
    clearTimeout(highlightTimer)
    highlightTimer = null
  }
}

const triggerHighlight = () => {
  isHighlighted.value = true
  clearHighlightTimer()
  highlightTimer = setTimeout(() => {
    isHighlighted.value = false
  }, 1800)
}

const openPalette = (withHighlight = false) => {
  if (!isOpen.value) {
    isOpen.value = true
  }
  if (withHighlight) {
    triggerHighlight()
  }
}

const openWithHighlight = () => openPalette(true)

const closePalette = () => {
  isOpen.value = false
  isHighlighted.value = false
  clearHighlightTimer()
}

const togglePalette = () => {
  if (isOpen.value) {
    if (!isSelectionMode.value) {
      closePalette()
    }
    return
  }
  openPalette()
}

const highlightActive = computed(() => isHighlighted.value || isPersistentHighlight.value)

const paletteClasses = computed(() => [
  'node-palette-panel w-72 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-slate-800/70 dark:bg-slate-900/90',
  highlightActive.value
    ? 'ring-2 ring-sky-400 shadow-[0_20px_45px_-26px_rgba(14,165,233,0.75)]'
    : 'ring-0'
])

const flashHighlight = () => triggerHighlight()

const startSelectionMode = () => {
  isSelectionMode.value = true
  isPersistentHighlight.value = true
  openPalette()
}

const stopSelectionMode = () => {
  isSelectionMode.value = false
  isPersistentHighlight.value = false
  isHighlighted.value = false
  clearHighlightTimer()
}

const handleItemClick = (item: PaletteItem) => {
  if (!isSelectionMode.value) {
    return
  }
  emit('select', item)
}

onBeforeUnmount(() => {
  clearHighlightTimer()
})

defineExpose({
  openPalette,
  openWithHighlight,
  closePalette,
  togglePalette,
  flashHighlight,
  startSelectionMode,
  stopSelectionMode,
  isSelectionMode,
  isOpen,
  getRootEl: () => paletteRootRef.value
})
</script>

<template>
  <div ref="paletteRootRef" class="relative">
    <Transition name="palette-fade" mode="out-in">
      <aside
        v-if="isOpen"
        :class="paletteClasses"
      >
        <div class="mb-4 flex items-center justify-between">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Samus Stages</p>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Collapse palette"
            @click="togglePalette"
          >
            <UIcon name="i-lucide-chevron-left" class="text-lg" />
          </button>
        </div>
        <div v-for="section in sections" :key="section.title" class="mb-5">
          <p class="px-3 text-xs font-semibold  tracking-wide text-slate-400">
            {{ section.title }}
          </p>
          <div class="mt-2 flex flex-col gap-1.5">
            <button
              v-for="item in section.items"
              :key="item.label"
              class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-black/20 dark:text-slate-100 dark:hover:bg-slate-800/60"
              draggable="true"
              type="button"
              @dragstart="onDragStart($event, item)"
              @click="handleItemClick(item)"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-900 dark:text-slate-900"
                :style="{ backgroundColor: item.accent }"
              >
                <UIcon :name="item.icon" class="text-base" />
              </span>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>
      </aside>
      <button
        v-else
        type="button"
        class="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-700 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-200"
        aria-label="Open node palette"
        @click="togglePalette"
      >
        <UIcon name="i-lucide-plus" class="text-xl" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
