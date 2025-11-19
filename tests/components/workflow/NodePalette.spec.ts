import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import NodePalette from '~/components/workflow/NodePalette.vue'

const mountPalette = () => mount(NodePalette)

describe('NodePalette', () => {
  it('renders the collapsed toggle by default and matches the snapshot', () => {
    const wrapper = mountPalette()
    const toggle = wrapper.get('button[aria-label="Open node palette"]')
    expect(toggle.exists()).toBe(true)
    expect(wrapper.find('aside').exists()).toBe(false)
    expect(wrapper.html()).toMatchSnapshot('node-palette-collapsed')
  })

  it('opens the palette and lists all palette items', async () => {
    const wrapper = mountPalette()
    await wrapper.get('button[aria-label="Open node palette"]').trigger('click')
    await nextTick()

    const panel = wrapper.find('aside')
    expect(panel.exists()).toBe(true)

    const sections = panel.findAll('.mb-5')
    expect(sections).toHaveLength(3)

    const items = panel.findAll('button[draggable="true"]')
    expect(items).toHaveLength(8)
    expect(items[0].text()).toContain('Start')
  })

  it('emits a select event only when selection mode is enabled', async () => {
    const wrapper = mountPalette()
    await wrapper.vm.openPalette()
    await nextTick()

    const firstItem = wrapper.get('button[draggable="true"]')
    await firstItem.trigger('click')
    expect(wrapper.emitted('select')).toBeFalsy()

    wrapper.vm.startSelectionMode()
    await nextTick()
    await firstItem.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toMatchObject({ label: 'Start', type: 'start' })
  })

  it('adds and removes the highlight ring when flashing the palette', async () => {
    vi.useFakeTimers()
    const wrapper = mountPalette()
    wrapper.vm.openWithHighlight()
    await nextTick()

    let panel = wrapper.find('aside')
    expect(panel.classes().some(cls => cls.includes('ring-2'))).toBe(true)

    vi.advanceTimersByTime(2000)
    await nextTick()

    panel = wrapper.find('aside')
    expect(panel.classes().some(cls => cls.includes('ring-2'))).toBe(false)
    vi.useRealTimers()
  })

  it('closes the palette when togglePalette is invoked', async () => {
    const wrapper = mountPalette()
    await wrapper.vm.openPalette()
    await nextTick()
    expect(wrapper.find('aside').exists()).toBe(true)

    wrapper.vm.togglePalette()
    await nextTick()
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('sets the drag payload when a palette item starts dragging', async () => {
    const wrapper = mountPalette()
    await wrapper.get('button[aria-label="Open node palette"]').trigger('click')
    await nextTick()

    const firstItem = wrapper.get('button[draggable="true"]')
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: ''
    }
    await firstItem.trigger('dragstart', { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith('application/vueflow', expect.any(String))
    expect(dataTransfer.effectAllowed).toBe('move')
  })
})
