<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onScopeDispose, ref, toRaw, watch } from 'vue'
import type { ConnectingHandle, Edge, GraphNode, Node, NodeDragEvent, XYPosition } from '@vue-flow/core'
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
import NewNodePlaceholder from '~/components/workflow/NewNodePlaceholder.vue'
import type { NewNodePlaceholderData, TemplateAnchorInfo } from '~/components/workflow/NewNodePlaceholder.vue'
import NodePalette from '~/components/workflow/NodePalette.vue'
import type { PaletteItem } from '~/components/workflow/NodePalette.vue'

definePageMeta({
  //layout: 'workflow',
  title: 'Workflow'
})

type WorkflowNodeData = StartNodeData | IfElseNodeData | LoopNodeData | AppNodeData | EndNodeData | NoteNodeData | NewNodePlaceholderData

type NodePaletteInstance = InstanceType<typeof NodePalette> & {
  openWithHighlight?: () => void
  startSelectionMode?: () => void
  stopSelectionMode?: () => void
  closePalette?: () => void
  getRootEl?: () => HTMLElement | null
}

type TemplateSelectionState = {
  anchorHandle: TemplateAnchorInfo
  nodeId: string
}

const LOOP_DRAG_HANDLE = '.loop-node__drag-handle'
const LOOP_CHILD_ELIGIBLE_TYPES = new Set<string>(['app', 'ifElse', 'newNode'])

const canTypeBeLoopChild = (type?: string | null): type is string =>
  typeof type === 'string' && LOOP_CHILD_ELIGIBLE_TYPES.has(type)
const canNodeBeLoopChild = (node?: GraphNode | null) =>
  Boolean(node && canTypeBeLoopChild(node.type))

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPaletteItemPayload = (value: unknown): value is PaletteItem => {
  if (!isPlainObject(value)) {
    return false
  }
  if (typeof value.type !== 'string' || typeof value.label !== 'string') {
    return false
  }
  if (typeof value.icon !== 'string' || typeof value.accent !== 'string') {
    return false
  }
  if ('data' in value && value.data !== undefined && !isPlainObject(value.data)) {
    return false
  }
  if ('style' in value && value.style !== undefined && !isPlainObject(value.style)) {
    return false
  }
  return true
}

const nodes = ref<Node<WorkflowNodeData>[]>([])

const edges = ref<Edge[]>([])

type WorkflowSnapshot = {
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
}

const HISTORY_LIMIT = 50

const deepClone = <T>(value: T): T => {
  const rawValue = toRaw(value)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(rawValue)
    } catch {
      // Fall back to JSON strategy below.
    }
  }
  return JSON.parse(JSON.stringify(rawValue))
}

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

const toSnapshotSignature = (snapshot: WorkflowSnapshot) => {
  const serialize = (input: Record<string, unknown>) =>
    Object.values(input)
      .map(value => value == null ? '' : String(value))
      .join(':')
  const nodeSummary = snapshot.nodes
    .map(node => serialize({
      id: node.id,
      type: node.type,
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
      parent: node.parentNode ?? '',
      data: node.data ? safeStringify(node.data) : ''
    }))
    .join('|')
  const edgeSummary = snapshot.edges
    .map(edge => serialize({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? '',
      targetHandle: edge.targetHandle ?? '',
      type: edge.type ?? '',
      data: edge.data ? safeStringify(edge.data) : ''
    }))
    .join('|')
  return `${nodeSummary}::${edgeSummary}`
}

const history = ref<WorkflowSnapshot[]>([])
let isRestoringHistory = false
let lastSnapshotSignature: string | null = null
let historyWriteScheduled = false
let suppressHistorySnapshots = false

const createSnapshot = (): WorkflowSnapshot => ({
  nodes: deepClone(nodes.value),
  edges: deepClone(edges.value)
})

const pushHistorySnapshot = () => {
  if (isRestoringHistory) {
    return
  }
  const snapshot = createSnapshot()
  const signature = toSnapshotSignature(snapshot)
  if (signature === lastSnapshotSignature) {
    return
  }
  history.value = [...history.value, snapshot].slice(-HISTORY_LIMIT)
  lastSnapshotSignature = signature
}

const scheduleHistorySnapshot = () => {
  if (isRestoringHistory || suppressHistorySnapshots || historyWriteScheduled) {
    return
  }
  historyWriteScheduled = true
  queueMicrotask(() => {
    historyWriteScheduled = false
    pushHistorySnapshot()
  })
}

const initializeHistory = () => {
  const snapshot = createSnapshot()
  history.value = [snapshot]
  lastSnapshotSignature = toSnapshotSignature(snapshot)
}

initializeHistory()

watch([nodes, edges], () => {
  scheduleHistorySnapshot()
}, { deep: true })

const undoLastAction = () => {
  if (history.value.length < 2) {
    return
  }
  const updatedHistory = history.value.slice(0, -1)
  const previousSnapshot = updatedHistory[updatedHistory.length - 1]
  if (!previousSnapshot) {
    return
  }
  history.value = updatedHistory
  isRestoringHistory = true
  const restoredNodes = deepClone(previousSnapshot.nodes)
  const restoredEdges = deepClone(previousSnapshot.edges)
  nodes.value = restoredNodes
  edges.value = restoredEdges
  setNodes(() => deepClone(restoredNodes))
  setEdges(() => deepClone(restoredEdges))
  lastSnapshotSignature = toSnapshotSignature(previousSnapshot)
  nextTick(() => {
    isRestoringHistory = false
  })
}

const handleUndoKey = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    undoLastAction()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleUndoKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleUndoKey)
  disableTemplatePointerListener()
})

const colorMode = useColorMode()
const isDarkMode = computed(() => colorMode.value === 'dark')
const canvasClasses = computed(() => (isDarkMode.value ? 'text-slate-100' : 'text-slate-900'))
const canvasStyle = computed(() => ({
  backgroundColor: isDarkMode.value ? '#0f172a' : '#ffffff'
}))
const gridColor = computed(() => (isDarkMode.value ? 'rgba(148,163,184,0.35)' : 'rgba(71,85,105,0.25)'))

const nodePaletteRef = ref<NodePaletteInstance | null>(null)
const templateSelectionState = ref<TemplateSelectionState | null>(null)
const dropPaneRef = ref<HTMLElement | null>(null)
let isTemplatePointerListenerActive = false
const {
  project,
  addNodes,
  addEdges,
  getNodes,
  setEdges,
  setNodes,
  updateNode,
  addSelectedNodes,
  removeSelectedElements,
  onNodeDragStart,
  onNodeDragStop,
  onNodeClick,
  onConnectStart,
  onConnectEnd,
  connectionStartHandle,
  connectionEndHandle
} = useVueFlow()
let seed = 1
const makeId = () => `dnd-${seed++}`
let edgeSeed = 1
const makeEdgeId = () => `edge-${edgeSeed++}`
const pendingConnectionHandle = ref<ConnectingHandle | null>(null)
const NEW_NODE_LABEL = 'New node'

const focusTemplateNode = (nodeId: string) => {
  const targetNode = getNodes.value.find(node => node.id === nodeId)
  if (!targetNode) {
    return
  }
  removeSelectedElements()
  addSelectedNodes([targetNode])
}

const activateTemplateSelection = (nodeId: string, anchorHandle: TemplateAnchorInfo) => {
  templateSelectionState.value = { nodeId, anchorHandle }
  focusTemplateNode(nodeId)
  nodePaletteRef.value?.startSelectionMode?.()
}

const finalizeTemplateSelection = (options?: { collapsePalette?: boolean }) => {
  if (!templateSelectionState.value) {
    return
  }
  templateSelectionState.value = null
  nodePaletteRef.value?.stopSelectionMode?.()
  if (options?.collapsePalette ?? true) {
    nodePaletteRef.value?.closePalette?.()
  }
}

const handleGlobalPointerDown = (event: PointerEvent) => {
  if (!templateSelectionState.value) {
    return
  }
  const paletteEl = nodePaletteRef.value?.getRootEl?.()
  if (paletteEl?.contains(event.target as HTMLElement)) {
    return
  }
  finalizeTemplateSelection()
}

const enableTemplatePointerListener = () => {
  if (isTemplatePointerListenerActive) {
    return
  }
  window.addEventListener('pointerdown', handleGlobalPointerDown, true)
  isTemplatePointerListenerActive = true
}

const disableTemplatePointerListener = () => {
  if (!isTemplatePointerListenerActive) {
    return
  }
  window.removeEventListener('pointerdown', handleGlobalPointerDown, true)
  isTemplatePointerListenerActive = false
}

watch(templateSelectionState, value => {
  if (value) {
    enableTemplatePointerListener()
  } else {
    disableTemplatePointerListener()
  }
})

watch(getNodes, nodesList => {
  const activeId = templateSelectionState.value?.nodeId
  if (activeId && !nodesList.some(node => node.id === activeId)) {
    finalizeTemplateSelection({ collapsePalette: false })
  }
})

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

let isSyncingLoopEdges = false
let isPruningLoopEdges = false

const runWithEdgeMutationGuard = (mutator: Parameters<typeof setEdges>[0]) => {
  isPruningLoopEdges = true
  setEdges(mutator)
  nextTick(() => {
    isPruningLoopEdges = false
  })
}

const normalizeLoopExitEdge = (edge: Edge, loopOfSource?: string) => {
  if (
    loopOfSource &&
    edge.target === loopOfSource &&
    edge.targetHandle === LOOP_EXIT_HANDLE &&
    edge.type !== 'simplebezier'
  ) {
    return {
      ...edge,
      type: 'simplebezier'
    }
  }
  return edge
}

const registerLoopExitEdge = (
  loopId: string,
  edge: Edge,
  bucket: Edge[],
  indexMap: Map<string, number>
) => {
  const existingIndex = indexMap.get(loopId)
  if (existingIndex !== undefined) {
    bucket[existingIndex] = edge
    return
  }
  indexMap.set(loopId, bucket.length)
  bucket.push(edge)
}

const pruneLoopExternalEdges = () => {
  const loopNodes = getNodes.value.filter(node => node.type === 'loop')
  if (!loopNodes.length) {
    return
  }
  const loopIds = new Set(loopNodes.map(loopNode => loopNode.id))
  const childParentMap = new Map<string, string>()
  getNodes.value.forEach(node => {
    if (node.parentNode && loopIds.has(node.parentNode)) {
      childParentMap.set(node.id, node.parentNode)
    }
  })
  runWithEdgeMutationGuard(currentEdges => {
    const nextEdges: Edge[] = []
    const exitEdgeIndex = new Map<string, number>()
    currentEdges.forEach(edge => {
      const loopOfSource = childParentMap.get(edge.source)
      const loopOfTarget = childParentMap.get(edge.target)
      const entryLoopId =
        edge.sourceHandle === LOOP_ENTRY_HANDLE && loopIds.has(edge.source)
          ? edge.source
          : undefined
      if (entryLoopId && loopOfTarget !== entryLoopId) {
        return
      }

      const targetLoopId =
        edge.targetHandle === LOOP_EXIT_HANDLE && loopIds.has(edge.target)
          ? edge.target
          : undefined

      if (targetLoopId) {
        if (loopOfSource === targetLoopId) {
          const normalizedEdge = normalizeLoopExitEdge(edge, targetLoopId)
          registerLoopExitEdge(targetLoopId, normalizedEdge, nextEdges, exitEdgeIndex)
        }
        return
      }

      if (loopOfSource) {
        if (loopOfTarget === loopOfSource) {
          nextEdges.push(edge)
        }
        return
      }

      nextEdges.push(edge)
    })
    return nextEdges
  })
}

const removeEdgesConnectedToNode = (nodeId: string) => {
  runWithEdgeMutationGuard(currentEdges =>
    currentEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
  )
}

const syncLoopEdges = (loopId: string) => {
  const children = sortLoopChildren(
    getNodes.value.filter(node => node.parentNode === loopId)
  )

  const childIds = new Set(children.map(child => child.id))
  isSyncingLoopEdges = true
  setEdges(currentEdges => {
    const preserved = currentEdges.filter(edge => {
      if (edge.data?.loopId === loopId) {
        return false
      }
      if (childIds.has(edge.source) && edge.target !== loopId && !childIds.has(edge.target)) {
        return false
      }
      return true
    })
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
  nextTick(() => {
    isSyncingLoopEdges = false
  })
}
watch(edges, () => {
  if (isSyncingLoopEdges || isPruningLoopEdges) {
    return
  }
  pruneLoopExternalEdges()
}, { deep: true })

const convertNodeToLoopChildIfNeeded = (node: GraphNode) => {
  if (!canNodeBeLoopChild(node)) {
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
  removeEdgesConnectedToNode(node.id)
  syncLoopEdges(parentLoop.id)
}

type ClientPoint = { x: number; y: number }

const getClientPoint = (event?: MouseEvent | TouchEvent): ClientPoint | null => {
  if (!event) {
    return null
  }
  if ('changedTouches' in event) {
    const touch = event.changedTouches.item(0)
    if (touch) {
      return { x: touch.clientX, y: touch.clientY }
    }
  }
  if ('touches' in event) {
    const touch = event.touches.item(0)
    if (touch) {
      return { x: touch.clientX, y: touch.clientY }
    }
  }
  return { x: event.clientX, y: event.clientY }
}

const projectClientPointToFlow = (point: ClientPoint): XYPosition | null => {
  const bounds = dropPaneRef.value?.getBoundingClientRect()
  if (!bounds) {
    return null
  }
  return project({
    x: point.x - bounds.left,
    y: point.y - bounds.top
  })
}

const createPlaceholderFromConnection = async (
  startHandle: ConnectingHandle,
  absolutePosition: XYPosition
) => {
  const anchorHandle: TemplateAnchorInfo = {
    nodeId: startHandle.nodeId,
    handleId: startHandle.id ?? null,
    type: startHandle.type
  }
  const loopNode = findLoopAtPosition(absolutePosition)
  const loopThatAcceptsNode = loopNode && canTypeBeLoopChild('newNode') ? loopNode : null

  const newNodeId = makeId()
  const placeholderNode: Node<WorkflowNodeData> = {
    id: newNodeId,
    type: 'newNode',
    position: loopThatAcceptsNode ? toChildPosition(loopThatAcceptsNode, absolutePosition) : absolutePosition,
    data: { label: NEW_NODE_LABEL, templateAnchor: anchorHandle }
  }

  if (loopThatAcceptsNode) {
    placeholderNode.parentNode = loopThatAcceptsNode.id
  }

  addNodes(placeholderNode)

  const placeholderEdge: Edge =
    startHandle.type === 'source'
      ? {
          id: makeEdgeId(),
          source: startHandle.nodeId,
          sourceHandle: startHandle.id ?? undefined,
          target: newNodeId,
          targetHandle: 'new-node-target'
        }
      : {
          id: makeEdgeId(),
          source: newNodeId,
          sourceHandle: 'new-node-source',
          target: startHandle.nodeId,
          targetHandle: startHandle.id ?? undefined
        }

  addEdges(placeholderEdge)

  await nextTick()
  if (loopThatAcceptsNode) {
    syncLoopEdges(loopThatAcceptsNode.id)
  }
  activateTemplateSelection(newNodeId, anchorHandle)
}

const handlePaletteSelection = async (item: PaletteItem) => {
  const selection = templateSelectionState.value
  if (!selection) {
    return
  }
  const nodeId = selection.nodeId
  removeEdgesConnectedToNode(nodeId)
  updateNode(nodeId, {
    type: item.type,
    data: item.data ?? {},
    style: item.style,
    dragHandle: item.type === 'loop' ? LOOP_DRAG_HANDLE : undefined
  })
  await nextTick()
  focusTemplateNode(nodeId)

  const newEdge: Edge = selection.anchorHandle.type === 'source'
    ? {
        id: makeEdgeId(),
        source: selection.anchorHandle.nodeId,
        sourceHandle: selection.anchorHandle.handleId ?? undefined,
        target: nodeId
      }
    : {
        id: makeEdgeId(),
        source: nodeId,
        target: selection.anchorHandle.nodeId,
        targetHandle: selection.anchorHandle.handleId ?? undefined
      }

  addEdges(newEdge)

  await nextTick()
  const updatedNode = getNodes.value.find(node => node.id === nodeId)
  if (updatedNode?.parentNode) {
    if (canNodeBeLoopChild(updatedNode)) {
      syncLoopEdges(updatedNode.parentNode)
    } else {
      detachNodeFromLoopIfNeeded(updatedNode)
    }
  }
  scheduleHistorySnapshot()
}

const connectStartSubscription = onConnectStart(() => {
  pendingConnectionHandle.value = connectionStartHandle.value
    ? { ...connectionStartHandle.value }
    : null
})

const connectEndSubscription = onConnectEnd(event => {
  const startHandle = pendingConnectionHandle.value
  pendingConnectionHandle.value = null
  if (!startHandle || connectionEndHandle.value) {
    return
  }
  const clientPoint = getClientPoint(event)
  if (!clientPoint) {
    return
  }
  const absolutePosition = projectClientPointToFlow(clientPoint)
  if (!absolutePosition) {
    return
  }
  void createPlaceholderFromConnection(startHandle, absolutePosition)
})

const nodeClickSubscription = onNodeClick(event => {
  if (event.node.type !== 'newNode') {
    return
  }
  const nodeData = event.node.data as NewNodePlaceholderData
  if (!nodeData?.templateAnchor) {
    return
  }
  activateTemplateSelection(event.node.id, nodeData.templateAnchor)
})

const nodeDragStartSubscription = onNodeDragStart(() => {
  suppressHistorySnapshots = true
})

const nodeDragStopSubscription = onNodeDragStop((event: NodeDragEvent) => {
  suppressHistorySnapshots = false
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
  scheduleHistorySnapshot()
})

onScopeDispose(() => {
  nodeDragStartSubscription.off()
  nodeDragStopSubscription.off()
  connectStartSubscription.off()
  connectEndSubscription.off()
  nodeClickSubscription.off()
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

  let nodeMeta: unknown
  try {
    nodeMeta = JSON.parse(payload)
  } catch {
    return
  }
  if (!isPaletteItemPayload(nodeMeta)) {
    return
  }
  const bounds = dropPaneRef.value?.getBoundingClientRect()
  const absolutePosition = project({
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0)
  })

  const loopNode = findLoopAtPosition(absolutePosition)
  const loopThatAcceptsNode = loopNode && canTypeBeLoopChild(nodeMeta.type) ? loopNode : null

  const newNode: Node<WorkflowNodeData> = {
    id: makeId(),
    type: nodeMeta.type,
    position: loopThatAcceptsNode ? toChildPosition(loopThatAcceptsNode, absolutePosition) : absolutePosition,
    data: nodeMeta.data ?? {},
    style: nodeMeta.style
  }

  if (loopThatAcceptsNode) {
    newNode.parentNode = loopThatAcceptsNode.id
  }
  if (newNode.type === 'loop') {
    newNode.dragHandle = LOOP_DRAG_HANDLE
  }

  addNodes(newNode)

  if (loopThatAcceptsNode) {
    await nextTick()
    syncLoopEdges(loopThatAcceptsNode.id)
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

            <template #node-newNode="nodeProps">
              <NewNodePlaceholder v-bind="nodeProps" />
            </template>
          </VueFlow>
        </div>

        <div class="absolute left-6 top-6 z-20 flex flex-col gap-4">
          <NodePalette ref="nodePaletteRef" @select="handlePaletteSelection" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
