import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import StartNode, { type StartNodeData } from '~/components/workflow/StartNode.vue'
import { createNodeProps, hexToRgb, setConnectionState } from './nodeTestUtils'

describe('StartNode', () => {
  const baseProps = createNodeProps<StartNodeData>({ id: 'start-1', type: 'start' })
  const mountNode = (props: Partial<NodeProps<StartNodeData>> = {}) =>
    mount(StartNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders default label and accent values', () => {
    const wrapper = mountNode()
    expect(wrapper.text()).toContain('Paso start-1')
    const accentBadge = wrapper.get('span.flex.h-10.w-10')
    expect((accentBadge.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#0ea5e9'))
  })

  it('applies provided props and selection styles', () => {
    const wrapper = mountNode({
      data: { label: 'Inicio', accent: '#34d399' },
      selected: true
    })
    expect(wrapper.text()).toContain('Inicio')
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--tw-ring-color')).toBe('#34d399')
  })

  it('highlights the source handle when connections are present', async () => {
    const wrapper = mountNode()
    const handle = wrapper.get('.vf-handle-stub')
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    setConnectionState({ handleType: 'source', nodeId: baseProps.id })
    await nextTick()
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#0ea5e9'))
  })
})
