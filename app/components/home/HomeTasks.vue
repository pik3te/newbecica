<script setup lang="ts">
import { computed, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Task, TaskStatus } from '~/types'

const UBadge = resolveComponent('UBadge')

const statusColors: Record<TaskStatus, string> = {
  success: 'success',
  failed: 'error',
  canceled: 'neutral',
  aborted: 'warning'
}

const { data, pending, error } = await useApiFetch<{
  period: string
  count: number
  tasks: Task[]
}>('/tasks', {
  key: 'tasks-list',
  default: () => ({ period: 'weekly', count: 0, tasks: [] })
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
