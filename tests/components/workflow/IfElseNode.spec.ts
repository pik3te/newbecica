import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import IfElseNode, { type IfElseNodeData } from '~/components/workflow/IfElseNode.vue'
import { createNodeProps, hexToRgb, setConnectionState } from './nodeTestUtils'

describe('IfElseNode', () => {
  const baseProps = createNodeProps<IfElseNodeData>({ id: 'if-1', type: 'ifElse' })
  const mountNode = (props: Partial<NodeProps<IfElseNodeData>> = {}) =>
    mount(IfElseNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('shows the default label and condition text', () => {
    const wrapper = mountNode()
    expect(wrapper.text()).toContain('If / Else')
    expect(wrapper.text()).toContain('input.output_parsed.classification')
    const ifHandle = wrapper.get('[id="if"]')
    expect((ifHandle.element as HTMLElement).style.borderColor).toBe(hexToRgb('#34d399'))
  })

  it('respects custom data and selection style', () => {
    const wrapper = mountNode({
      data: {
        label: 'Aprobación manual',
        condition: 'approval.status === "approved"',
        accent: '#fb923c'
      },
      selected: true
    })
    expect(wrapper.text()).toContain('Aprobación manual')
    expect(wrapper.text()).toContain('approval.status === "approved"')
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--tw-ring-color')).toBe('#fb923c')
  })

  it('updates target handle color when connected', async () => {
    const wrapper = mountNode()
    const targetHandle = wrapper.get('[type="target"]')
    expect((targetHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    setConnectionState({ handleType: 'target', nodeId: baseProps.id })
    await nextTick()
    expect((targetHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#475569'))
  })

  it('activates branch handles when their connections exist', async () => {
    const wrapper = mountNode()
    const ifHandle = wrapper.get('#if')
    const elseHandle = wrapper.get('#else')
    expect((ifHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))
    expect((elseHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#f8fafc'))

    setConnectionState({ handleType: 'source', handleId: 'if', nodeId: baseProps.id })
    await nextTick()
    expect((ifHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#34d399'))

    setConnectionState({ handleType: 'source', handleId: 'else', nodeId: baseProps.id })
    await nextTick()
    expect((elseHandle.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#fb7185'))
  })
})
