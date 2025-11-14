import { getQuery, setResponseStatus } from 'h3'
import type { Period, Task } from '~/types'

const baseTasks: Task[] = [
  {
    id: 'task-4600',
    userId: 'usr-1042',
    status: 'success',
    date: '2024-03-11T15:30:00.000Z'
  },
  {
    id: 'task-4599',
    userId: 'usr-1088',
    status: 'failed',
    date: '2024-03-11T10:10:00.000Z'
  },
  {
    id: 'task-4598',
    userId: 'usr-2221',
    status: 'canceled',
    date: '2024-03-11T08:50:00.000Z'
  },
  {
    id: 'task-4597',
    userId: 'usr-3044',
    status: 'aborted',
    date: '2024-03-10T19:45:00.000Z'
  },
  {
    id: 'task-4596',
    userId: 'usr-5520',
    status: 'success',
    date: '2024-03-10T15:55:00.000Z'
  }
]

const mockedByPeriod: Record<Period, Task[]> = {
  daily: baseTasks,
  weekly: baseTasks,
  monthly: baseTasks
}

export default defineEventHandler((event) => {
  const { period } = getQuery(event)
  const key = (period as Period | undefined) ?? 'weekly'
  const tasks = mockedByPeriod[key] ?? mockedByPeriod.weekly

  setResponseStatus(event, 200)

  return {
    period: key,
    count: tasks.length,
    tasks
  }
})
