<script setup lang="ts">
import { computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position, useNodeConnections, useNodeId } from '@vue-flow/core'

export type StartNodeData = {
  label: string
  icon?: string
  accent?: string
}

const props = defineProps<NodeProps<StartNodeData>>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const label = computed(() => props.data?.label ?? `Paso ${props.id}`)
const accent = computed(() => props.data?.accent ?? (isDark.value ? '#5eead4' : '#0ea5e9'))
const iconName = computed(() => props.data?.icon ?? 'i-lucide-play')

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId ?? props.id ?? null)

const wrapperClasses = computed(() => [
  'relative inline-flex items-center gap-3 rounded-xl border px-4 py-2 text-sm font-semibold tracking-tight shadow-lg backdrop-blur transition',
  isDark.value ? 'bg-slate-900/90 text-slate-100 border-white/10' : 'bg-white text-slate-900 border-slate-200',
  props.selected ? 'ring-1' : 'ring-0'
])

const wrapperStyle = computed(() => (
  props.selected ? { '--tw-ring-color': accent.value } : undefined
))

const sourceConnections = useNodeConnections({
  handleType: 'source',
  nodeId
})

const canvasColor = computed(() => (isDark.value ? '#0f172a' : '#f8fafc'))

const sourceHandleStyle = computed(() => ({
  borderColor: accent.value,
  backgroundColor: sourceConnections.value.length ? accent.value : canvasColor.value
}))
</script>

<template>
  <div :class="wrapperClasses" :style="wrapperStyle">
    <span
      class="flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold text-slate-950 shadow-inner"
      :style="{ backgroundColor: accent }"
    >
      <UIcon :name="iconName" class="text-base leading-none" />
    </span>

    <span class="text-base font-semibold">{{ label }}</span>

    <Handle
      type="source"
      :position="Position.Right"
      class="absolute -right-3 top-1/2  -translate-y-1/4 rounded-full border-4 transition-colors duration-200"
      :style="sourceHandleStyle"
    />
  </div>
</template>
