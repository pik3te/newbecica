<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position, useNodeConnections, useNodeId, useVueFlow } from '@vue-flow/core'

export type LoopNodeData = {
  label?: string
  width?: number
  height?: number
}

const props = defineProps<NodeProps<LoopNodeData>>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const label = computed(() => props.data?.label ?? 'Loop')

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId ?? props.id ?? null)
const {
  getNodes,
  setNodes,
  updateNodeInternals,
  onPaneClick,
  project,
  removeSelectedElements,
  addSelectedNodes
} = useVueFlow()

const collapsed = ref(false)

const wrapperClasses = computed(() => [
  'pointer-events-none relative flex h-full w-full flex-col gap-1 rounded-xl border-2 border-dashed px-2 py-1 transition-all duration-300 select-none',
  isDark.value
    ? 'border-slate-500/70 text-slate-100 bg-transparent'
    : 'border-slate-400 text-slate-900 bg-transparent',
  collapsed.value ? 'bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm ring-1 ring-white/20 dark:ring-slate-900/50' : '',
  props.selected ? 'ring-2 ring-offset-2 ring-violet-400/80 dark:ring-violet-500/60' : ''
])

const canvasColor = computed(() => (isDark.value ? '#0f172a' : '#f8fafc'))

const targetConnections = useNodeConnections({ handleType: 'target', nodeId })
const sourceConnections = useNodeConnections({ handleType: 'source', nodeId })

const targetHandleStyle = computed(() => ({
  borderColor: isDark.value ? '#94a3b8' : '#64748b',
  backgroundColor: targetConnections.value.length
    ? isDark.value ? '#94a3b8' : '#64748b'
    : canvasColor.value
}))

const sourceHandleStyle = computed(() => ({
  borderColor: '#a855f7',
  backgroundColor: sourceConnections.value.length ? '#a855f7' : canvasColor.value
}))

const childNodes = computed(() =>
  getNodes.value.filter(node => node.parentNode === nodeId.value)
)

const entryNode = computed(() => {
  return childNodes.value.slice().sort((a, b) => a.position.x - b.position.x)[0]
})
const exitNode = computed(() => {
  return childNodes.value.slice().sort((a, b) => b.position.x - a.position.x)[0]
})

const entryAccent = computed(() => entryNode.value?.data?.accent ?? '#818cf8')
const entryIcon = computed(() => entryNode.value?.data?.icon ?? 'i-lucide-box')
const exitAccent = computed(() => exitNode.value?.data?.accent ?? '#f472b6')
const exitIcon = computed(() => exitNode.value?.data?.icon ?? 'i-lucide-cog')

const MIN_WIDTH = 360
const MIN_HEIGHT = 200
const CHILD_PADDING_X = 45
const CHILD_PADDING_Y = 25

const baseSize = {
  width: props.data?.width ?? 520,
  height: props.data?.height ?? 220
}
const expandedSize = ref({ ...baseSize })
const collapsedSize = { width: 190, height: 85 }

const isResizing = ref(false)

const currentSize = computed(() => (collapsed.value ? collapsedSize : expandedSize.value))

const childBounds = () => {
  const children = childNodes.value
  if (!children.length) {
    return { width: MIN_WIDTH, height: MIN_HEIGHT }
  }
  const rightEdge = Math.max(...children.map(child =>
    child.position.x + (child.dimensions?.width ?? 0)
  ))
  const bottomEdge = Math.max(...children.map(child =>
    child.position.y + (child.dimensions?.height ?? 0)
  ))
  return {
    width: Math.max(MIN_WIDTH, rightEdge + CHILD_PADDING_X),
    height: Math.max(MIN_HEIGHT, bottomEdge + CHILD_PADDING_Y)
  }
}

const nodeStyle = computed(() => ({
  width: `${currentSize.value.width}px`,
  height: `${currentSize.value.height}px`,
  ...(collapsed.value ? {} : { minWidth: `${MIN_WIDTH}px`, minHeight: `${MIN_HEIGHT}px` }),
  transition: isResizing.value ? 'none' : 'width 250ms cubic-bezier(0.4, 0, 0.2, 1), height 250ms cubic-bezier(0.4, 0, 0.2, 1)'
}))

const persistSize = () => {
  const id = nodeId.value
  if (!id) { return }
  setNodes(nodes =>
    nodes.map(node =>
      node.id === id
        ? {
            ...node,
            data: {
              ...(node.data ?? {}),
              width: expandedSize.value.width,
              height: expandedSize.value.height
            }
          }
        : node
    )
  )
  updateNodeInternals([id])
}

const syncChildVisibility = () => {
  const id = nodeId.value
  if (!id) { return }
  setNodes(nodes =>
    nodes.map(node =>
      node.parentNode === id ? { ...node, hidden: collapsed.value } : node
    )
  )
}

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const ensureChildCoverage = () => {
  if (collapsed.value) {
    return
  }
  const { width, height } = childBounds()
  const nextWidth = Math.max(expandedSize.value.width, width)
  const nextHeight = Math.max(expandedSize.value.height, height)
  if (nextWidth !== expandedSize.value.width || nextHeight !== expandedSize.value.height) {
    expandedSize.value = { width: nextWidth, height: nextHeight }
    persistSize()
  }
}

watch(collapsed, () => {
  syncChildVisibility()
}, { immediate: true })

const childSignature = computed(() =>
  childNodes.value
    .map(node => node.id)
    .sort()
    .join('|')
)

watch(
  childSignature,
  (current, previous) => {
    if (current === previous) { return }
    ensureChildCoverage()
  },
  { immediate: true }
)

watch(
  () => [props.data?.width, props.data?.height],
  ([width, height]) => {
    if (typeof width === 'number' && typeof height === 'number') {
      expandedSize.value = { width, height }
      ensureChildCoverage()
    }
  }
)

let startPointer = { x: 0, y: 0 }
let startSize = { width: 0, height: 0 }

const startResize = (event: PointerEvent) => {
  if (collapsed.value) { return }
  event.stopPropagation()
  isResizing.value = true
  startPointer = { x: event.clientX, y: event.clientY }
  startSize = { ...expandedSize.value }
  document.addEventListener('pointermove', resize)
  document.addEventListener('pointerup', stopResize, { once: true })
}

const resize = (event: PointerEvent) => {
  if (!isResizing.value) { return }
  const deltaX = event.clientX - startPointer.x
  const deltaY = event.clientY - startPointer.y
  const { width: minWidth, height: minHeight } = childBounds()
  expandedSize.value = {
    width: Math.max(minWidth, startSize.width + deltaX),
    height: Math.max(minHeight, startSize.height + deltaY)
  }
}

const stopResize = () => {
  if (!isResizing.value) { return }
  isResizing.value = false
  document.removeEventListener('pointermove', resize)
  persistSize()
}

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', resize)
})

const getLoopNode = () => {
  const id = nodeId.value
  if (!id) { return null }
  return getNodes.value.find(node => node.id === id) ?? null
}

const selectLoopIfPaneClickWithinBounds = (event: MouseEvent) => {
  const loopNode = getLoopNode()
  if (!loopNode) { return }
  const paneElement = event.currentTarget as HTMLElement | null
  const bounds = paneElement?.getBoundingClientRect()
  if (!bounds || typeof project !== 'function') {
    return
  }
  const pointerPosition = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })
  const loopX = loopNode.computedPosition?.x ?? loopNode.position.x ?? 0
  const loopY = loopNode.computedPosition?.y ?? loopNode.position.y ?? 0
  const withinX = pointerPosition.x >= loopX && pointerPosition.x <= loopX + currentSize.value.width
  const withinY = pointerPosition.y >= loopY && pointerPosition.y <= loopY + currentSize.value.height
  if (!withinX || !withinY) {
    return
  }
  removeSelectedElements?.()
  addSelectedNodes?.([loopNode])
}

const paneClickSubscription = onPaneClick(selectLoopIfPaneClickWithinBounds)

onBeforeUnmount(() => {
  paneClickSubscription.off()
})
</script>

<template>
  <div class="pointer-events-none relative h-full w-full" :style="nodeStyle">
    <div :class="wrapperClasses">
      <div
        class="loop-node__drag-handle loop-node__interactive pointer-events-auto flex items-center gap-2 text-sm font-semibold text-current cursor-grab active:cursor-grabbing"
        @dblclick.stop.prevent="toggleCollapsed"
      >
        <UIcon name="i-lucide-refresh-ccw" class="text-sm text-slate-400" />
        <span class="leading-tight">{{ label }}</span>
      </div>

      <transition name="loop-collapse" mode="out-in">
        <div v-if="collapsed" key="collapsed" class="mt-1 flex items-center justify-center">
          <div class="relative flex items-center">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-900 shadow-inner opacity-70 transition-all duration-300"
              :style="{ backgroundColor: entryAccent }"
            >
              <UIcon :name="entryIcon" class="text-base" />
            </div>
            <div
              class="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-900 shadow-xl  dark:ring-slate-900/60 transition-all duration-300"
              :style="{ backgroundColor: exitAccent }"
            >
              <UIcon :name="exitIcon" class="text-base" />
            </div>
          </div>
        </div>
        <div
          v-else
          key="expanded"
          class="pointer-events-none mt-2 flex-1 rounded-xl border border-dashed border-white/10"
        />
      </transition>
    </div>

    <Handle
      id="loop-target-in"
      type="target"
      :position="Position.Left"
      class="loop-node__interactive pointer-events-auto absolute -left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl border-4 transition-colors duration-200"
      :style="targetHandleStyle"
    />
    <Handle
      id="loop-target-out"
      type="source"
      :position="Position.Left"
      class="loop-node__interactive pointer-events-auto absolute -left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 opacity-0"
    />

    <Handle
      id="loop-source-in"
      type="target"
      :position="Position.Right"
      class="loop-node__interactive pointer-events-auto absolute -right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 opacity-0"
    />
    <Handle
      id="loop-source-out"
      type="source"
      :position="Position.Right"
      class="loop-node__interactive pointer-events-auto absolute -right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 transition-colors duration-200"
      :style="sourceHandleStyle"
    />

    <button
      v-show="!collapsed"
      class="nodrag loop-node__interactive pointer-events-auto absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-500/40 bg-slate-100 text-slate-600 shadow-sm transition active:scale-95 dark:border-slate-500/60 dark:bg-slate-800 dark:text-slate-200"
      style="cursor: se-resize"
      @pointerdown="startResize"
    >
      <UIcon name="i-cil-resize-both" class="text-[10px]" />
    </button>
  </div>
</template>

<style scoped>
.loop-collapse-enter-active,
.loop-collapse-leave-active {
  transition: opacity 350ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
.loop-collapse-enter-from,
.loop-collapse-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
:global(.vue-flow__node-loop) {
  pointer-events: none !important;
}
:global(.vue-flow__node-loop .loop-node__interactive) {
  pointer-events: auto !important;
}
</style>
