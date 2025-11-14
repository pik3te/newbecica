<script setup lang="ts">
const sections = [
  {
    title: 'Core',
    items: [
      {
        label: 'Agent',
        type: 'start',
        icon: 'i-lucide-bot',
        accent: '#5eead4',
        data: { label: 'Agent', icon: 'i-lucide-bot', accent: '#5eead4' }
      },
      {
        label: 'End',
        type: 'end',
        icon: 'i-material-symbols-stop-circle',
        accent: '#f87171',
        data: { label: 'End', icon: 'i-material-symbols-stop-circle', accent: '#f87171' }
      },
      {
        label: 'Note',
        type: 'note',
        icon: 'i-lucide-sticky-note',
        accent: '#fef3c7',
        data: { text: 'Nueva nota', color: '#fef3c7' },
        style: { width: 220, height: 140 }
      }
    ]
  },
  {
    title: 'Logic',
    items: [
      {
        label: 'If / Else',
        type: 'ifElse',
        icon: 'i-lucide-git-branch',
        accent: '#facc15',
        data: {
          label: 'If / Else',
          condition: 'input.status == true',
          icon: 'i-lucide-git-branch',
          accent: '#facc15'
        }
      },
      {
        label: 'While',
        type: 'loop',
        icon: 'i-lucide-refresh-ccw',
        accent: '#f5d0fe',
        data: { label: 'While' }
      },
      {
        label: 'User approval',
        type: 'end',
        icon: 'i-lucide-user-check',
        accent: '#c4b5fd',
        data: { label: 'User approval', icon: 'i-lucide-user-check', accent: '#c4b5fd' }
      }
    ]
  },
  {
    title: 'Data',
    items: [
      {
        label: 'Transform',
        type: 'app',
        icon: 'i-lucide-wand-2',
        accent: '#cbd5f5',
        data: { label: 'Transform', icon: 'i-lucide-wand-2', accent: '#cbd5f5' }
      },
      {
        label: 'Set state',
        type: 'app',
        icon: 'i-lucide-sliders',
        accent: '#a5b4fc',
        data: { label: 'Set state', icon: 'i-lucide-sliders', accent: '#a5b4fc' }
      }
    ]
  }
]

const onDragStart = (event: DragEvent, item: any) => {
  if (!event.dataTransfer) { return }
  event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside
    class="min-w-[220px] max-w-[240px] rounded-xl px-4 py-6 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.9))] shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] h-fit dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(30,41,59,0.82))] dark:shadow-[0_25px_70px_-40px_rgba(0,0,0,0.7)]"
  >
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
          @dragstart="onDragStart($event, item)"
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
</template>
