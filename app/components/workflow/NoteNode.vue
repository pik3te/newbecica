<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { useNodeId, useVueFlow } from '@vue-flow/core'

export type NoteNodeData = {
  text?: string
  color?: string
}

type NoteNodeProps = NodeProps<NoteNodeData> & {
  style?: {
    width?: string | number
    height?: string | number
  }
}

const props = defineProps<NoteNodeProps>()

const colorMode = useColorMode()
const defaultColor = '#fed800'

const text = ref(props.data?.text ?? 'Sticky note')
const color = ref(props.data?.color ?? defaultColor)

const injectedNodeId = useNodeId()
const nodeId = computed(() => injectedNodeId || props.id || null)
const { setNodes, updateNodeInternals } = useVueFlow()

const parseSize = (value?: string | number) => {
  if (typeof value === 'number') { return value }
  if (typeof value === 'string') { return parseFloat(value) }
  return undefined
}

const dimensions = ref({
  width: parseSize(props.style?.width as string) ?? 220,
  height: parseSize(props.style?.height as string) ?? 140
})

const noteClasses = computed(() => [
  'relative flex flex-col rounded-xl border border-black/10 p-3 shadow-lg bg-transparent cursor-grab active:cursor-grabbing',
  colorMode.value === 'dark' ? 'text-slate-900' : 'text-slate-900',
  props.selected ? 'ring-1 ring-offset-1 transition' : 'ring-0'
])

const noteStyle = computed(() => ({
  backgroundColor: color.value,
  width: `${dimensions.value.width}px`,
  height: `${dimensions.value.height}px`,
  minWidth: '160px',
  minHeight: '110px',
  paddingRight: '24px',
  ...(props.selected ? { '--tw-ring-color': color.value } : {})
}))

const persistData = () => {
  const id = nodeId.value
  if (!id) { return }
  setNodes(nodes =>
    nodes.map(node =>
      node.id === id
        ? {
            ...node,
            data: {
              ...(node.data ?? {}),
              text: text.value,
              color: color.value
            },
            style: {
              ...(node.style ?? {}),
              width: `${dimensions.value.width}px`,
              height: `${dimensions.value.height}px`
            }
          }
        : node
    )
  )
}

watch([text, color], persistData)

onMounted(() => {
  persistData()
  if (nodeId.value) {
    updateNodeInternals([nodeId.value])
  }
})

const noteRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)
let startPointer = { x: 0, y: 0 }
let startSize = { width: 0, height: 0 }

const startResize = (event: PointerEvent) => {
  event.stopPropagation()
  isResizing.value = true
  startPointer = { x: event.clientX, y: event.clientY }
  startSize = { ...dimensions.value }
  document.addEventListener('pointermove', resize)
  document.addEventListener('pointerup', stopResize, { once: true })
}

const resize = (event: PointerEvent) => {
  if (!isResizing.value) { return }
  const deltaX = event.clientX - startPointer.x
  const deltaY = event.clientY - startPointer.y
  dimensions.value = {
    width: Math.max(160, startSize.width + deltaX),
    height: Math.max(110, startSize.height + deltaY)
  }
}

const stopResize = () => {
  if (!isResizing.value) { return }
  isResizing.value = false
  document.removeEventListener('pointermove', resize)
  persistData()
  const id = nodeId.value
  if (id) {
    updateNodeInternals([id])
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', resize)
})
</script>

<template>
  <div
    ref="noteRef"
    :class="noteClasses"
    :style="noteStyle"
  >
    <textarea
      v-model="text"
      class="scrollbar nodrag nowheel note-textarea h-full w-full resize-none bg-transparent text-base font-medium text-black/80 placeholder:text-black/40 focus:outline-none"
      placeholder="Write something..."
      rows="4"
      @mousedown.stop
    />
    <button
      class="nodrag absolute bottom-0 right-0 flex h-6 w-6 translate-x-1 translate-y-1 items-center justify-center rounded-full text-black/60 transition active:scale-95"
      style="cursor: se-resize"
      @pointerdown="startResize"
    >
      <UIcon name="i-cil-resize-both" class="text-[10px]" />
    </button>
  </div>
</template>
