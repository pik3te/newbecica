<script setup lang="ts">
import { computed, h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Period, Task, TaskStatus } from '~/types'
import { randomFrom, randomInt } from '~/utils'

const props = defineProps<{
  period: Period
}>()

const UBadge = resolveComponent('UBadge')
const ULink = resolveComponent('ULink')

type SortColumn = 'date' | 'id' | 'userId' | 'status'

const taskStatuses: TaskStatus[] = ['success', 'failed', 'canceled', 'aborted']
const taskStatusOptions = taskStatuses.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status
}))

const sortColumnOptions: { label: string; value: SortColumn }[] = [
  { label: 'Date', value: 'date' },
  { label: 'Task ID', value: 'id' },
  { label: 'User ID', value: 'userId' },
  { label: 'Status', value: 'status' }
]

const searchTerm = ref('')
const statusFilter = ref<TaskStatus[]>([])
const sortColumn = ref<SortColumn>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')

const sampleUserIds = ['usr-1042', 'usr-1088', 'usr-2221', 'usr-3044', 'usr-5520', 'usr-6608']

const { data } = await useAsyncData('automation-tasks', async () => {
  const now = new Date()
  const tasks: Task[] = []

  for (let i = 0; i < 8; i++) {
    const hoursAgo = randomInt(0, 72)
    const date = new Date(now.getTime() - hoursAgo * 3600000)

    tasks.push({
      id: `task-${4600 + i}`,
      userId: randomFrom(sampleUserIds),
      status: randomFrom(taskStatuses),
      date: date.toISOString()
    })
  }

  return tasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}, {
  watch: [() => props.period],
  default: () => []
})

const tasks = computed(() => data.value ?? [])

const filteredTasks = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return tasks.value.filter((task) => {
    const matchesSearch =
      !term ||
      [task.id, task.userId].some((value) => value.toLowerCase().includes(term))

    const matchesStatus =
      statusFilter.value.length === 0 || statusFilter.value.includes(task.status)

    return matchesSearch && matchesStatus
  })
})

const sortedTasks = computed(() => {
  const column = sortColumn.value
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return [...filteredTasks.value].sort((a, b) => {
    if (column === 'date') {
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction
    }

    const aValue = String(a[column])
    const bValue = String(b[column])

    return aValue.localeCompare(bValue) * direction
  })
})

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

function formatStatus(status: TaskStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const statusColors: Record<TaskStatus, string> = {
  success: 'success',
  failed: 'error',
  canceled: 'neutral',
  aborted: 'warning'
}

const columns: TableColumn<Task>[] = [
  {
    accessorKey: 'id',
    header: 'Task',
    cell: ({ row }) =>
      h(
        ULink,
        {
          to: '#',
          class: 'text-primary font-medium underline-offset-4 hover:underline'
        },
        () => row.getValue('id')
      )
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

      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color: statusColors[status] },
        () => formatStatus(status)
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
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <UInput
          v-model="searchTerm"
          icon="i-lucide-search"
          placeholder="Search by task or user"
          class="w-full md:w-64"
        />

        <USelectMenu
          v-model="statusFilter"
          :options="taskStatusOptions"
          multiple
          searchable
          clearable
          placeholder="Filter status"
          class="w-full md:w-56"
        />
      </div>

      <div class="flex items-center gap-2 md:justify-end">
        <USelectMenu
          v-model="sortColumn"
          :options="sortColumnOptions"
          placeholder="Sort by"
          class="w-full md:w-40"
        />
        <UButton
          color="neutral"
          variant="soft"
          :icon="sortDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
          @click="toggleSortDirection"
        >
          {{ sortDirection === 'asc' ? 'Asc' : 'Desc' }}
        </UButton>
      </div>
    </div>

    <UTable
      :data="sortedTasks"
      :columns="columns"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />
  </div>
</template>
