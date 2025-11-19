import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import EndNode, { type EndNodeData } from '~/components/workflow/EndNode.vue'
import { createNodeProps, hexToRgb, setConnectionState } from './nodeTestUtils'

describe('EndNode', () => {
  const baseProps = createNodeProps<EndNodeData>({ id: 'end-1', type: 'end' })
  const mountNode = (props: Partial<NodeProps<EndNodeData>> = {}) =>
    mount(EndNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders default label and handle state', () => {
    const wrapper = mountNode()
    expect(wrapper.text()).toContain('Paso end-1')
    const handle = wrapper.get('.vf-handle-stub')
    expect((handle.element as HTMLElement).style.borderColor).toBe(hexToRgb('#dc2626'))
  })

  it('applies custom label and accent', () => {
    const wrapper = mountNode({
      data: { label: 'Cierre', accent: '#ef4444' }
    })
    expect(wrapper.text()).toContain('Cierre')
    const handle = wrapper.get('.vf-handle-stub')
    expect((handle.element as HTMLElement).style.borderColor).toBe(hexToRgb('#ef4444'))
  })

  it('fills the inbound handle background when there is a connection', async () => {
    const wrapper = mountNode()
    const handle = wrapper.get('.vf-handle-stub')
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    setConnectionState({ handleType: 'target', nodeId: baseProps.id })
    await nextTick()
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#dc2626'))
  })
})
