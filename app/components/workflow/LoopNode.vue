<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position, useNodeConnections, useNodeId, useVueFlow } from '@vue-flow/core'

export type LoopNodeData = {
  label?: string
}

const props = defineProps<NodeProps<LoopNodeData>>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const label = computed(() => props.data?.label ?? 'Loop')

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId ?? props.id ?? null)
const { getNodes, setNodes } = useVueFlow()

const collapsed = ref(false)

const wrapperClasses = computed(() => [
  'relative flex h-full w-full flex-col gap-1 rounded-xl border-2 border-dashed px-2 py-1 transition-all duration-300 cursor-pointer select-none',
  isDark.value
    ? 'border-slate-500/70 text-slate-100 bg-transparent'
    : 'border-slate-400 text-slate-900 bg-transparent',
  collapsed.value ? 'bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm ring-1 ring-white/20 dark:ring-slate-900/50' : ''
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

const nodeSize = ref({ width: 520, height: 220 })
const collapsedSize = { width: 190, height: 85 }

const nodeStyle = computed(() => ({
  width: `${nodeSize.value.width}px`,
  height: `${nodeSize.value.height}px`,
  transition: 'width 450ms cubic-bezier(0.4, 0, 0.2, 1), height 450ms cubic-bezier(0.4, 0, 0.2, 1)'
}))

const updateNodeSize = () => {
  const id = nodeId.value
  if (!id) { return }
  if (collapsed.value) {
    nodeSize.value = collapsedSize
    return
  }
  const children = childNodes.value
  if (!children.length) {
    nodeSize.value = { width: 420, height: 200 }
    return
  }
  const rightEdge = Math.max(...children.map(child =>
    child.position.x + (child.dimensions?.width ?? 0)
  ))
  const bottomEdge = Math.max(...children.map(child =>
    child.position.y + (child.dimensions?.height ?? 0)
  ))
  const paddingX = 45
  const paddingY = 25
  nodeSize.value = {
    width: Math.max(360, rightEdge + paddingX),
    height: Math.max(200, bottomEdge + paddingY)
  }
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

watch(collapsed, async () => {
  syncChildVisibility()
  await nextTick()
  updateNodeSize()
}, { immediate: true })

watch(
  () => childNodes.value.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: node.dimensions?.width ?? 0,
    height: node.dimensions?.height ?? 0
  })),
  async () => {
    if (!collapsed.value) {
      await nextTick()
      updateNodeSize()
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="relative h-full w-full" :style="nodeStyle">
    <div :class="wrapperClasses" @dblclick.stop.prevent="toggleCollapsed">
      <div class="flex items-center gap-2 text-sm font-semibold text-current">
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
      class="absolute -left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl border-4 transition-colors duration-200"
      :style="targetHandleStyle"
    />
    <Handle
      id="loop-target-out"
      type="source"
      :position="Position.Left"
      class="absolute -left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 opacity-0"
    />

    <Handle
      id="loop-source-in"
      type="target"
      :position="Position.Right"
      class="absolute -right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 opacity-0"
    />
    <Handle
      id="loop-source-out"
      type="source"
      :position="Position.Right"
      class="absolute -right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 transition-colors duration-200"
      :style="sourceHandleStyle"
    />
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
</style>
