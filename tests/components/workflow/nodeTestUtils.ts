import type { NodeProps } from '@vue-flow/core'
import { getConnectionRef } from '../../mocks/vue-flow'

export const createNodeProps = <T>(options: {
  id: string
  type: string
  data?: T
}): NodeProps<T> => ({
  id: options.id,
  type: options.type,
  data: (options.data ?? {}) as T,
  selected: false,
  connectable: true,
  position: { x: 0, y: 0 },
  dimensions: { width: 200, height: 80 },
  dragging: false,
  resizing: false,
  zIndex: 0,
  events: {}
})

export const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  const bigint = Number.parseInt(value, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgb(${r}, ${g}, ${b})`
}

type ConnectionKey = {
  handleType?: string
  handleId?: string
  nodeId?: string | null
}

export const setConnectionState = (options: ConnectionKey, count = 1) => {
  const ref = getConnectionRef(options)
  ref.value = count > 0 ? Array.from({ length: count }, (_, index) => ({ id: index })) : []
  return ref
}
