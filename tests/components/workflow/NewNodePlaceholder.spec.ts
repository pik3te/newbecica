import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import NewNodePlaceholder, { type NewNodePlaceholderData } from '~/components/workflow/NewNodePlaceholder.vue'
import { createNodeProps, hexToRgb, setConnectionState } from './nodeTestUtils'

describe('NewNodePlaceholder', () => {
  const baseProps = createNodeProps<NewNodePlaceholderData>({ id: 'new-1', type: 'newNode' })
  const mountNode = (props: Partial<NodeProps<NewNodePlaceholderData>> = {}) =>
    mount(NewNodePlaceholder, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders the default call to action', () => {
    const wrapper = mountNode()
    expect(wrapper.text()).toContain('+ New node')
    const handle = wrapper.get('.vf-handle-stub')
    expect((handle.element as HTMLElement).style.borderColor).not.toBe('')
  })

  it('shows selection ring when selected', () => {
    const wrapper = mountNode({
      data: { label: 'Añadir etapa' },
      selected: true
    })
    expect(wrapper.text()).toContain('Añadir etapa')
    expect(wrapper.classes()).toContain('ring-2')
  })

  it('fills the target handle with the active color when connected', async () => {
    const wrapper = mountNode()
    const handle = wrapper.get('#new-node-target')
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    setConnectionState({ handleType: 'target', nodeId: baseProps.id })
    await nextTick()
    expect((handle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#94a3b8'))
  })
})
