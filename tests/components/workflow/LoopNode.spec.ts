import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import LoopNode, { type LoopNodeData } from '~/components/workflow/LoopNode.vue'
import { createNodeProps } from './nodeTestUtils'

describe('LoopNode', () => {
  const baseProps = createNodeProps<LoopNodeData>({ id: 'loop-1', type: 'loop' })
  const mountNode = (props: Partial<NodeProps<LoopNodeData>> = {}) =>
    mount(LoopNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders the loop header and resize handle by default', () => {
    const wrapper = mountNode()
    expect(wrapper.get('.loop-node__drag-handle').text()).toContain('Loop')
    const resizeButton = wrapper.get('button[style*="cursor: se-resize"]')
    expect(resizeButton.element.style.display).not.toContain('none')
  })

  it('collapses and expands when double clicking the header', async () => {
    const wrapper = mountNode()
    const dragHandle = wrapper.get('.loop-node__drag-handle')
    const resizeButton = wrapper.get('button[style*="cursor: se-resize"]')

    await dragHandle.trigger('dblclick')
    await nextTick()
    expect(resizeButton.element.style.display).toBe('none')

    await dragHandle.trigger('dblclick')
    await nextTick()
    expect(resizeButton.element.style.display).not.toBe('none')
  })
})
