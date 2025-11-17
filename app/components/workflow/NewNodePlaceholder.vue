<script setup lang="ts">
import { computed } from 'vue'
import type { HandleType, NodeProps } from '@vue-flow/core'
import { Handle, Position, useNodeConnections, useNodeId } from '@vue-flow/core'

export type TemplateAnchorInfo = {
  nodeId: string
  handleId?: string | null
  type: HandleType
}

export type NewNodePlaceholderData = {
  label?: string
  templateAnchor?: TemplateAnchorInfo
}

const props = defineProps<NodeProps<NewNodePlaceholderData>>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => props.data?.label ?? '+ New node')

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId ?? props.id ?? null)

const sourceConnections = useNodeConnections({
  handleType: 'source',
  nodeId
})
const targetConnections = useNodeConnections({
  handleType: 'target',
  nodeId
})

const canvasColor = computed(() => (isDark.value ? '#0f172a' : '#f8fafc'))

const wrapperClasses = computed(() => [
  'relative inline-flex items-center gap-3 rounded-2xl border px-5 py-2 text-sm font-semibold tracking-tight shadow-lg backdrop-blur transition',
  isDark.value
    ? 'border-slate-700/70 bg-slate-900/70 text-slate-200/80'
    : 'border-slate-200/80 bg-white/70 text-slate-500',
  props.selected
    ? 'ring-2 ring-sky-400 shadow-[0_25px_45px_-32px_rgba(14,165,233,0.85)] text-slate-900 dark:text-white'
    : 'opacity-80'
])

const iconClasses = computed(() => [
  'flex h-9 w-9 items-center justify-center rounded-xl border text-base transition',
  isDark.value ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-500'
])

const targetHandleStyle = computed(() => ({
  borderColor: isDark.value ? '#cdd5f8' : '#94a3b8',
  backgroundColor: targetConnections.value.length
    ? isDark.value ? '#cdd5f8' : '#94a3b8'
    : canvasColor.value
}))

const sourceHandleStyle = computed(() => ({
  borderColor: isDark.value ? '#38bdf8' : '#0ea5e9',
  backgroundColor: sourceConnections.value.length
    ? isDark.value ? '#38bdf8' : '#0ea5e9'
    : canvasColor.value
}))
</script>

<template>
  <div :class="wrapperClasses">
    <Handle
      id="new-node-target"
      type="target"
      :position="Position.Left"
      class="absolute -left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-4 transition-colors duration-200"
      :style="targetHandleStyle"
    />

    <span :class="iconClasses">
      <UIcon name="i-lucide-plus" class="text-lg" />
    </span>

    <span class="text-base font-semibold">
      {{ label }}
    </span>
  </div>
</template>
