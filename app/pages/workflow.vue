<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref } from 'vue'
import type { Edge, GraphNode, Node, NodeDragEvent, XYPosition } from '@vue-flow/core'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

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
  //layout: 'workflow',
  title: 'Workflow'
})

type WorkflowNodeData = StartNodeData | IfElseNodeData | LoopNodeData | AppNodeData | EndNodeData | NoteNodeData

const LOOP_DRAG_HANDLE = '.loop-node__drag-handle'

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
    dragHandle: LOOP_DRAG_HANDLE,
    position: { x: 100, y: 360 },
    data: {
      label: 'While'
    }
  },
  {
    id: 'loop-task-1',
    type: 'app',
    parentNode: 'loop',
    position: { x: 32, y: 100 },
    data: { label: 'Clone Repo', icon: 'i-simple-icons-bitbucket', accent: '#cbd5f5' }
  },
  {
    id: 'loop-task-2',
    type: 'app',
    parentNode: 'loop',
    position: { x: 210, y: 100 },
    data: { label: 'Download Binary', icon: 'i-simple-icons-jfrog', accent: '#cbd5f5' }
  },
  {
    id: 'loop-task-3',
    type: 'app',
    parentNode: 'loop',
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
    type: 'simplebezier',
    data: { loopId: 'loop', loopRole: 'entry' }
  },
  {
    id: 'loop-task-1-2',
    source: 'loop-task-1',
    target: 'loop-task-2',
    data: { loopId: 'loop', loopRole: 'chain' }
  },
  {
    id: 'loop-task-2-3',
    source: 'loop-task-2',
    target: 'loop-task-3',
    data: { loopId: 'loop', loopRole: 'chain' }
  },
  {
    id: 'loop-exit',
    source: 'loop-task-3',
    sourceHandle: 'app-source',
    target: 'loop',
    targetHandle: 'loop-source-in',
    type: 'simplebezier',
    data: { loopId: 'loop', loopRole: 'exit' }
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
const isDarkMode = computed(() => colorMode.value === 'dark')
const canvasClasses = computed(() => (isDarkMode.value ? 'text-slate-100' : 'text-slate-900'))
const canvasStyle = computed(() => ({
  backgroundColor: isDarkMode.value ? '#0f172a' : '#ffffff'
}))
const gridColor = computed(() => (isDarkMode.value ? 'rgba(148,163,184,0.35)' : 'rgba(71,85,105,0.25)'))

const dropPaneRef = ref<HTMLElement | null>(null)
const { project, addNodes, getNodes, setEdges, updateNode, onNodeDragStop } = useVueFlow()
let seed = 1
const makeId = () => `dnd-${seed++}`

type LoopEdgeRole = 'entry' | 'exit' | 'chain'

const LOOP_ENTRY_HANDLE = 'loop-target-out'
const LOOP_EXIT_HANDLE = 'loop-source-in'

const getNodeRect = (node: GraphNode) => {
  const width = node.dimensions?.width ?? 0
  const height = node.dimensions?.height ?? 0
  const x = node.computedPosition?.x ?? node.position.x ?? 0
  const y = node.computedPosition?.y ?? node.position.y ?? 0
  return { x, y, width, height }
}

const isPointInsideNode = (point: XYPosition, node: GraphNode) => {
  const { x, y, width, height } = getNodeRect(node)
  if (!width || !height) { return false }
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
}

const findLoopAtPosition = (position: XYPosition) => {
  const loopNodes = getNodes.value.filter(node => node.type === 'loop')
  for (let index = loopNodes.length - 1; index >= 0; index -= 1) {
    const loopNode = loopNodes[index]
    if (loopNode && isPointInsideNode(position, loopNode)) {
      return loopNode
    }
  }
  return null
}

const getNodeCenterPosition = (node: GraphNode): XYPosition => {
  const rect = getNodeRect(node)
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  }
}

const getAbsoluteNodePosition = (node: GraphNode): XYPosition => ({
  x: node.computedPosition?.x ?? node.position.x ?? 0,
  y: node.computedPosition?.y ?? node.position.y ?? 0
})

const toChildPosition = (loopNode: GraphNode, absolutePosition: XYPosition): XYPosition => {
  const loopRect = getNodeRect(loopNode)
  return {
    x: absolutePosition.x - loopRect.x,
    y: absolutePosition.y - loopRect.y
  }
}

const sortLoopChildren = (children: GraphNode[]) => [
  ...children
].sort((a, b) => {
  if (a.position.x !== b.position.x) {
    return a.position.x - b.position.x
  }
  if (a.position.y !== b.position.y) {
    return a.position.y - b.position.y
  }
  return a.id.localeCompare(b.id)
})

const loopEdgeData = (loopId: string, loopRole: LoopEdgeRole) => ({
  loopId,
  loopRole
})

const syncLoopEdges = (loopId: string) => {
  const children = sortLoopChildren(
    getNodes.value.filter(node => node.parentNode === loopId)
  )

  setEdges(currentEdges => {
    const preserved = currentEdges.filter(edge => edge.data?.loopId !== loopId)
    if (!children.length) {
      return preserved
    }

    const firstChild = children[0]
    const lastChild = children[children.length - 1]

    if (!firstChild || !lastChild) {
      return preserved
    }

    const loopSpecificEdges: Edge[] = [
      {
        id: `loop:${loopId}:entry`,
        source: loopId,
        sourceHandle: LOOP_ENTRY_HANDLE,
        target: firstChild.id,
        type: 'simplebezier',
        data: loopEdgeData(loopId, 'entry')
      }
    ]

    for (let index = 0; index < children.length - 1; index += 1) {
      const currentChild = children[index]
      const nextChild = children[index + 1]
      if (!currentChild || !nextChild) {
        continue
      }
      loopSpecificEdges.push({
        id: `loop:${loopId}:chain:${currentChild.id}:${nextChild.id}`,
        source: currentChild.id,
        target: nextChild.id,
        data: loopEdgeData(loopId, 'chain')
      })
    }

    loopSpecificEdges.push({
      id: `loop:${loopId}:exit`,
      source: lastChild.id,
      target: loopId,
      targetHandle: LOOP_EXIT_HANDLE,
      type: 'simplebezier',
      data: loopEdgeData(loopId, 'exit')
    })

    return [...preserved, ...loopSpecificEdges]
  })
}

const convertNodeToLoopChildIfNeeded = (node: GraphNode) => {
  if (node.type === 'loop') {
    return
  }
  const targetLoop = findLoopAtPosition(getNodeCenterPosition(node))
  if (!targetLoop || node.parentNode === targetLoop.id) {
    return
  }
  const relativePosition = toChildPosition(targetLoop, getAbsoluteNodePosition(node))
  updateNode(node.id, {
    parentNode: targetLoop.id,
    extent: undefined,
    position: relativePosition
  })
  syncLoopEdges(targetLoop.id)
}

const detachNodeFromLoopIfNeeded = (node: GraphNode) => {
  const parentLoopId = node.parentNode
  if (!parentLoopId) {
    return
  }
  const parentLoop = getNodes.value.find(n => n.id === parentLoopId && n.type === 'loop')
  if (!parentLoop) {
    return
  }
  const loopAtPosition = findLoopAtPosition(getNodeCenterPosition(node))
  if (loopAtPosition?.id === parentLoopId) {
    return
  }
  updateNode(node.id, {
    parentNode: undefined,
    extent: undefined,
    hidden: false,
    position: getAbsoluteNodePosition(node)
  })
  syncLoopEdges(parentLoop.id)
}

const nodeDragStopSubscription = onNodeDragStop((event: NodeDragEvent) => {
  const processed = new Set<string>()
  const processNode = (currentNode?: GraphNode) => {
    if (!currentNode || processed.has(currentNode.id)) {
      return
    }
    processed.add(currentNode.id)
    convertNodeToLoopChildIfNeeded(currentNode)
    const updatedNode = getNodes.value.find(node => node.id === currentNode.id) ?? currentNode
    detachNodeFromLoopIfNeeded(updatedNode)
  }

  processNode(event.node)
  event.nodes.forEach(processNode)
})

onScopeDispose(() => {
  nodeDragStopSubscription.off()
})

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = async (event: DragEvent) => {
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
  const absolutePosition = project({
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0)
  })

  const loopNode = findLoopAtPosition(absolutePosition)

  const newNode: Node<WorkflowNodeData> = {
    id: makeId(),
    type: nodeMeta.type,
    position: loopNode ? toChildPosition(loopNode, absolutePosition) : absolutePosition,
    data: nodeMeta.data ?? {},
    style: nodeMeta.style
  }

  if (loopNode) {
    newNode.parentNode = loopNode.id
  }
  if (newNode.type === 'loop') {
    newNode.dragHandle = LOOP_DRAG_HANDLE
  }

  addNodes(newNode)

  if (loopNode) {
    await nextTick()
    syncLoopEdges(loopNode.id)
  }
}
</script>

<template>
  <UDashboardPanel id="workflow">
    <template #header>
      <UDashboardNavbar title="Workflows" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        :class="['relative min-h-[calc(100vh-8rem)] w-full overflow-hidden transition-colors', canvasClasses]"
        :style="canvasStyle"
      >
        <div
          ref="dropPaneRef"
          class="absolute inset-0"
        >
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :class="canvasClasses"
            :style="canvasStyle"
            auto-connect
            class="h-full w-full"
            @dragover="onDragOver"
            @drop="onDrop"
          >
            <MiniMap />
            <Controls />
            <Background
              :gap="24"
              :color="gridColor"
            />

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

        <div class="absolute left-6 top-6 z-20 flex flex-col gap-4">
          <NodePalette class="w-80 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/90" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
