import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { vi } from 'vitest'

type ConnectionOptions = {
  handleType?: string
  handleId?: string
  nodeId?: unknown
} | undefined

const toKey = (options: ConnectionOptions) => {
  if (!options) {
    return '__default__'
  }
  const rawNodeId = options.nodeId as { value?: unknown } | string | null | undefined
  const nodeId =
    rawNodeId && typeof rawNodeId === 'object' && 'value' in rawNodeId
      ? rawNodeId.value
      : rawNodeId
  return [options.handleType ?? '', options.handleId ?? '', nodeId ?? ''].join(':')
}

const connectionMap = new Map<string, Ref<unknown[]>>()
const nodesRef = ref<any[]>([])
const paneListeners = new Set<(event: MouseEvent) => void>()

const ensureConnectionRef = (options: ConnectionOptions) => {
  const key = toKey(options)
  if (!connectionMap.has(key)) {
    connectionMap.set(key, ref([]))
  }
  return connectionMap.get(key)!
}

const applySetNodes = (updater: any) => {
  if (typeof updater === 'function') {
    const draft = nodesRef.value.map(node => ({ ...node }))
    const result = updater(draft)
    if (Array.isArray(result)) {
      nodesRef.value = result
    } else {
      nodesRef.value = draft
    }
    return
  }
  if (Array.isArray(updater)) {
    nodesRef.value = updater
  }
}

export const setNodesSpy = vi.fn((updater?: any) => {
  applySetNodes(updater)
})

export const updateNodeInternalsSpy = vi.fn()
export const addSelectedNodesSpy = vi.fn()
export const removeSelectedElementsSpy = vi.fn()

export const resetVueFlowMocks = () => {
  nodesRef.value = []
  connectionMap.clear()
  paneListeners.clear()
  setNodesSpy.mockClear()
  updateNodeInternalsSpy.mockClear()
  addSelectedNodesSpy.mockClear()
  removeSelectedElementsSpy.mockClear()
}

export const getConnectionRef = (options: ConnectionOptions) => ensureConnectionRef(options)
export const getNodesRef = () => nodesRef

export const triggerPaneClick = (event: MouseEvent) => {
  paneListeners.forEach(handler => handler(event))
}

vi.mock('@vue-flow/core', () => {
  const Handle = defineComponent({
    name: 'HandleStub',
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      return () => {
        const { class: className, ...rest } = attrs as Record<string, unknown> & { class?: string }
        return h('div', { class: ['vf-handle-stub', className], ...rest }, slots.default?.())
      }
    }
  })

  const VueFlow = defineComponent({
    name: 'VueFlowStub',
    setup(_, { slots }) {
      return () => h('div', { class: 'vue-flow-stub' }, slots.default?.())
    }
  })

  const Position = {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom'
  } as const

  const useNodeConnections = (options?: ConnectionOptions) => ensureConnectionRef(options)

  const useNodeId = () => null

  const onPaneClick = (handler: (event: MouseEvent) => void) => {
    paneListeners.add(handler)
    return {
      off: () => paneListeners.delete(handler)
    }
  }

  return {
    Handle,
    VueFlow,
    Position,
    useNodeConnections,
    useNodeId,
    useVueFlow: () => ({
      getNodes: nodesRef,
      setNodes: setNodesSpy,
      updateNodeInternals: updateNodeInternalsSpy,
      onPaneClick,
      project: (point: { x: number; y: number }) => point,
      removeSelectedElements: removeSelectedElementsSpy,
      addSelectedNodes: addSelectedNodesSpy
    })
  }
})
