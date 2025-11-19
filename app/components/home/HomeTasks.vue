<script setup lang="ts">
import { computed, h, resolveComponent, toRef } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Period, Range, Task, TaskStatus } from '~/types'

const UBadge = resolveComponent('UBadge')

const statusColors: Record<TaskStatus, string> = {
  success: 'success',
  failed: 'error',
  canceled: 'neutral',
  aborted: 'warning'
}

const props = defineProps<{ period: Period; range: Range }>()

const periodRef = toRef(props, 'period')
const rangeRef = toRef(props, 'range')
const rangeStartIso = computed(() => rangeRef.value?.start?.toISOString() ?? '')
const rangeEndIso = computed(() => rangeRef.value?.end?.toISOString() ?? '')
const fetchKey = computed(() => `tasks-list:${periodRef.value}:${rangeStartIso.value}:${rangeEndIso.value}`)
const queryParams = computed(() => ({
  period: periodRef.value,
  start: rangeStartIso.value,
  end: rangeEndIso.value
}))

const { data, pending, error } = await useApiFetch<{
  period: string
  count: number
  tasks: Task[]
}>('/tasks', {
  key: fetchKey,
  default: () => ({ period: 'weekly', count: 0, tasks: [] }),
  query: () => queryParams.value,
  watch: [periodRef, rangeStartIso, rangeEndIso]
})

const tasks = computed(() => data.value?.tasks ?? [])

const columns: TableColumn<Task>[] = [
  {
    accessorKey: 'id',
    header: 'Task',
    cell: ({ row }) => `#${row.getValue('id')}`
  },
  {
    accessorKey: 'userId',
    header: 'User'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TaskStatus
      const label = status.charAt(0).toUpperCase() + status.slice(1)

      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color: statusColors[status] },
        () => label
      )
    }
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      return new Date(row.getValue('date') as string).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTable
      :data="tasks"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="No se pudieron cargar las tareas"
      :description="error.message"
    />
  </div>
</template>
