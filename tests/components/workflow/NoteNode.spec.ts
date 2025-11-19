import { mount } from '@vue/test-utils'
import type { NodeProps } from '@vue-flow/core'
import { describe, expect, it } from 'vitest'
import NoteNode, { type NoteNodeData } from '~/components/workflow/NoteNode.vue'
import { createNodeProps, hexToRgb } from './nodeTestUtils'
import { getNodesRef, setNodesSpy } from '../../mocks/vue-flow'
import { nextTick } from 'vue'

describe('NoteNode', () => {
  const baseProps = createNodeProps<NoteNodeData>({ id: 'note-1', type: 'note' })
  const mountNode = (props: Partial<NodeProps<NoteNodeData>> = {}) =>
    mount(NoteNode, {
      props: {
        ...baseProps,
        ...props
      }
    })

  it('renders default sticky note content', () => {
    const wrapper = mountNode()
    expect(wrapper.find('textarea').element.value).toBe('Sticky note')
    expect((wrapper.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#fed800'))
  })

  it('applies custom color and text', () => {
    const wrapper = mountNode({
      data: { text: 'Notas', color: '#fde68a' }
    })
    expect(wrapper.find('textarea').element.value).toBe('Notas')
    expect((wrapper.element as HTMLElement).style.backgroundColor).toBe(hexToRgb('#fde68a'))
  })

  it('persists text changes through the Vue Flow bridge', async () => {
    const nodesRef = getNodesRef()
    nodesRef.value = [
      { id: 'note-1', data: { text: 'Sticky note', color: '#fed800' }, style: {} }
    ]
    const wrapper = mountNode({
      data: { text: 'Sticky note', color: '#fed800' }
    })
    setNodesSpy.mockClear()

    const textarea = wrapper.get('textarea')
    await textarea.setValue('Nuevo contenido')
    await nextTick()

    expect(setNodesSpy).toHaveBeenCalled()
    expect(nodesRef.value[0].data?.text).toBe('Nuevo contenido')
  })
})
