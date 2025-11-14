<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Edge, Node } from '@vue-flow/core'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'

import StartNode from '~/components/workflow/StartNode.vue'
import type { StartNodeData } from '~/components/workflow/StartNode.vue'
import IfElseNode from '~/components/workflow/IfElseNode.vue'
import type { IfElseNodeData } from '~/components/workflow/IfElseNode.vue'
import LoopNode from '~/components/workflow/LoopNode.vue'
import type { LoopNodeData } from '~/components/workflow/LoopNode.vue'
import AppNode from '~/components/workflow/AppNode.vue'
import type { AppNodeData } from '~/components/workflow/AppNode.vue'
import EndNode from '~/components/workflow/EndNode.vue'
import type { EndNodeData } from '~/components/workflow/EndNode.vue'
import NoteNode from '~/components/workflow/NoteNode.vue'
import type { NoteNodeData } from '~/components/workflow/NoteNode.vue'
import NodePalette from '~/components/workflow/NodePalette.vue'

definePageMeta({
  layout: 'workflow',
  title: 'Workflow'
})

type WorkflowNodeData = StartNodeData | IfElseNodeData | LoopNodeData | AppNodeData | EndNodeData | NoteNodeData

const nodes = ref<Node<WorkflowNodeData>[]>([
  {
    id: 'start',
    type: 'start',
    position: { x: 120, y: 150 },
    data: { label: 'Start', icon: 'i-lucide-play', accent: '#5eead4' }
  },
  {
    id: 'if',
    type: 'ifElse',
    position: { x: 380, y: 120 },
    data: {
      label: 'If / Else',
      condition: 'input.output_parsed.classification == "flight_info"',
      icon: 'i-lucide-split'
    }
  },
  {
    id: 'loop',
    type: 'loop',
    position: { x: 100, y: 360 },
    data: {
      label: 'While'
    }
  },
  {
    id: 'loop-task-1',
    type: 'app',
    parentNode: 'loop',
    extent: 'parent',
    position: { x: 32, y: 100 },
    data: { label: 'Clone Repo', icon: 'i-simple-icons-bitbucket', accent: '#cbd5f5' }
  },
  {
    id: 'loop-task-2',
    type: 'app',
    parentNode: 'loop',
    extent: 'parent',
    position: { x: 210, y: 100 },
    data: { label: 'Download Binary', icon: 'i-simple-icons-jfrog', accent: '#cbd5f5' }
  },
  {
    id: 'loop-task-3',
    type: 'app',
    parentNode: 'loop',
    extent: 'parent',
    position: { x: 370, y: 100 },
    data: { label: 'Custom Stage', icon: 'i-game-icons-samus-helmet', accent: '#cbd5f5' }
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 720, y: 360 },
    data: { label: 'End', icon: 'i-material-symbols-stop-outline-rounded', accent: '#f87171' }
  },
  {
    id: 'note-1',
    type: 'note',
    position: { x: 640, y: 80 },
    style: { width: 220, height: 130 },
    data: {
      text: 'Recordatorio: revisar métricas del loop.'
    }
  }
])

const edges = ref<Edge[]>([
  {
    id: 'start-to-if',
    source: 'start',
    target: 'if'
  },
  {
    id: 'if-to-loop',
    source: 'if',
    sourceHandle: 'else',
    target: 'loop'
  },
  {
    id: 'loop-entry',
    source: 'loop',
    sourceHandle: 'loop-target-out',
    target: 'loop-task-1',
    targetHandle: 'app-target',
    type: 'simplebezier'
  },
  {
    id: 'loop-task-1-2',
    source: 'loop-task-1',
    target: 'loop-task-2'
  },
  {
    id: 'loop-task-2-3',
    source: 'loop-task-2',
    target: 'loop-task-3'
  },
  {
    id: 'loop-exit',
    source: 'loop-task-3',
    sourceHandle: 'app-source',
    target: 'loop',
    targetHandle: 'loop-source-in',
    type: 'simplebezier'
  },
  {
    id: 'loop-to-end',
    source: 'loop',
    sourceHandle: 'loop-source-out',
    target: 'end',
    type: 'simplebezier'
  },
  {
    id: 'if-to-end',
    source: 'if',
    sourceHandle: 'if',
    target: 'end',
    type: 'simplebezier'
  }
])

const colorMode = useColorMode()
const canvasClasses = computed(() =>
  colorMode.value === 'dark'
    ? 'text-slate-100'
    : 'text-slate-900'
)
const canvasStyle = computed(() => ({
  backgroundColor: colorMode.value === 'dark' ? '#0f172a' : '#f8fafc'
}))
const gridColor = computed(() =>
  colorMode.value === 'dark'
    ? 'rgba(148,163,184,0.35)'
    : 'rgba(71,85,105,0.25)'
)

const dropPaneRef = ref<HTMLElement | null>(null)
const { project, addNodes } = useVueFlow()
let seed = 1
const makeId = () => `dnd-${seed++}`

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  const payload = event.dataTransfer?.getData('application/vueflow')
  if (!payload) { return }

  let nodeMeta: any
  try {
    nodeMeta = JSON.parse(payload)
  } catch {
    return
  }
  const bounds = dropPaneRef.value?.getBoundingClientRect()
  const position = project({
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0)
  })

  addNodes({
    id: makeId(),
    type: nodeMeta.type,
    position,
    data: nodeMeta.data ?? {},
    style: nodeMeta.style
  })
}
</script>

<template>
  <div
    :class="['h-screen w-screen transition-colors', canvasClasses]"
    :style="canvasStyle"
  >
    <div class="mx-auto flex h-full w-full  gap-6 px-4 py-6">
      <NodePalette class="sticky top-8 self-start" />
        <VueFlow
          :nodes="nodes"
          :edges="edges"
          :class="gridColor"
          class="h-full w-full"
          fit-view-on-init
          @dragover="onDragOver"
          @drop="onDrop"
        >
          <Background :gap="24" />

          <template #node-start="nodeProps">
            <StartNode v-bind="nodeProps" />
          </template>

          <template #node-ifElse="nodeProps">
            <IfElseNode v-bind="nodeProps" />
          </template>

          <template #node-loop="nodeProps">
            <LoopNode v-bind="nodeProps" />
          </template>

          <template #node-app="nodeProps">
            <AppNode v-bind="nodeProps" />
          </template>

          <template #node-end="nodeProps">
            <EndNode v-bind="nodeProps" />
          </template>

          <template #node-note="nodeProps">
            <NoteNode v-bind="nodeProps" />
          </template>
        </VueFlow>
    </div>
  </div>
</template>
