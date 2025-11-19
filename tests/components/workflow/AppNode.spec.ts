import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import AppNode, { type AppNodeData } from '~/components/workflow/AppNode.vue'
import { createNodeProps, hexToRgb, setConnectionState } from './nodeTestUtils'

describe('AppNode', () => {
  const baseProps = createNodeProps<AppNodeData>({ id: 'app-1', type: 'app' })
  const mountNode = (props: Partial<NodeProps<AppNodeData>> = {}) =>
    mount(AppNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders with the base width when label is short', () => {
    const wrapper = mountNode()
    const width = Number.parseFloat((wrapper.element as HTMLElement).style.width)
    expect(width).toBeGreaterThanOrEqual(150)
  })

  it('expands width for long labels and respects accent data', () => {
    const wrapper = mountNode({
      data: {
        label: 'Proceso automático extendido',
        accent: '#a855f7'
      }
    })
    const width = Number.parseFloat((wrapper.element as HTMLElement).style.width)
    expect(width).toBeGreaterThan(150)
    const accentBadge = wrapper.get('span.flex.h-10.w-10')
    expect((accentBadge.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#a855f7'))
  })

  it('updates handle fill colors when connections are attached', async () => {
    const wrapper = mountNode()
    const targetHandle = wrapper.get('#app-target')
    const sourceHandle = wrapper.get('#app-source')
    expect((targetHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    expect((sourceHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))

    setConnectionState({ handleType: 'target', nodeId: baseProps.id })
    await nextTick()
    expect((targetHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#64748b'))

    setConnectionState({ handleType: 'source', nodeId: baseProps.id })
    await nextTick()
    expect((sourceHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#6366f1'))
  })
})
