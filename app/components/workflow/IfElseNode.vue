<script setup lang="ts">
import { computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position, useNodeConnections, useNodeId } from '@vue-flow/core'
import { xid } from 'zod/v4'

export type IfElseNodeData = {
  label?: string
  condition?: string
  icon?: string
  accent?: string
}

const props = defineProps<NodeProps<IfElseNodeData>>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => props.data?.label ?? 'If / Else')
const condition = computed(() => props.data?.condition ?? 'input.output_parsed.classification == "flight_info"')
const iconName = computed(() => props.data?.icon ?? 'i-lucide-git-branch')
const accent = computed(() => props.data?.accent ?? '#facc15')

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId ?? props.id ?? null)

const cardClasses = computed(() => [
  'relative w-80 rounded-xl border px-5 py-4 text-sm shadow-lg backdrop-blur transition',
  isDark.value ? 'bg-slate-900/85 text-slate-100 border-white/10' : 'bg-white text-slate-900 border-slate-200',
  props.selected ? 'ring-1' : 'ring-0'
])

const cardStyle = computed(() => (
  props.selected ? { '--tw-ring-color': accent.value } : {}
))

const canvasColor = computed(() => (isDark.value ? '#0f172a' : '#f8fafc'))

const targetConnections = useNodeConnections({
  handleType: 'target',
  nodeId
})
const ifConnections = useNodeConnections({
  handleType: 'source',
  handleId: 'if',
  nodeId
})
const elseConnections = useNodeConnections({
  handleType: 'source',
  handleId: 'else',
  nodeId
})

const conditionClasses = computed(() =>
  isDark.value
    ? 'rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100'
    : 'rounded-xl bg-slate-100 border border-slate-200 text-slate-800'
)

const elseClasses = conditionClasses

const handleBase = {
  class: 'absolute -right-3 top-1/2 -translate-y-1/8 translate-x-5  h-[24px] w-[10px]  border-4 transition-colors duration-200',
}

const targetHandleStyle = computed(() => ({
  borderColor: isDark.value ? '#cbd5f5' : '#475569',
  backgroundColor: targetConnections.value.length ? (isDark.value ? '#cbd5f5' : '#475569') : canvasColor.value
}))

const ifHandleStyle = computed(() => ({
  borderColor: '#34d399',
  backgroundColor: ifConnections.value.length ? '#34d399' : canvasColor.value
}))

const elseHandleStyle = computed(() => ({
  borderColor: '#fb7185',
  backgroundColor: elseConnections.value.length ? '#fb7185' : canvasColor.value
}))
</script>

<template>
  <div :class="cardClasses" :style="cardStyle">
    <Handle
      type="target"
      :position="Position.Left"
      class="absolute -left-3 top-12  -translate-y-1/4  h-6 w-10 border-4 transition-colors duration-200"
      :style="targetHandleStyle"
    />

    <div class="mb-3 flex items-center gap-3">
      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
        <UIcon :name="iconName" class="text-base leading-none" />
      </span>
      <p class="text-base font-semibold">{{ label }}</p>
    </div>

    <div class="space-y-2">
      <div class="relative">
        <p :class="[conditionClasses, 'px-3 py-2 font-mono text-[0.7rem] whitespace-nowrap overflow-hidden text-ellipsis']">
          {{ condition }}
        </p>
        <Handle
          type="source"
          :position="Position.Right"
          id="if"
          v-bind="handleBase"
          :style="ifHandleStyle"
        />
      </div>
      <div class="relative">
        <p :class="[elseClasses, 'px-3 py-2 font-mono text-[0.7rem] whitespace-nowrap']">
          else
        </p>
        <Handle
          type="source"
          :position="Position.Right"
          id="else"
          v-bind="handleBase"
          :style="elseHandleStyle"
        />
      </div>
    </div>
  </div>
</template>
