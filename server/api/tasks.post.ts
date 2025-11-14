import { createError, readBody, setResponseStatus } from 'h3'
import type { Task, TaskStatus } from '~/types'

type TaskPayload = Partial<Omit<Task, 'id'>> & { id?: string }

export default defineEventHandler(async (event) => {
  const body = (await readBody<TaskPayload | undefined>(event)) ?? {}
  const { id, userId, status, date } = body

  if (!userId || !status) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        message: 'Los campos `userId` y `status` son obligatorios.'
      }
    })
  }

  const allowedStatus: TaskStatus[] = ['success', 'failed', 'canceled', 'aborted']
  if (!allowedStatus.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        message: `El estado debe ser uno de: ${allowedStatus.join(', ')}.`
      }
    })
  }

  const newTask: Task = {
    id: id ?? `task-${Math.floor(Math.random() * 5000) + 5000}`,
    userId,
    status,
    date: date ?? new Date().toISOString()
  }

  setResponseStatus(event, 201)

  return {
    message: 'Tarea creada (mock)',
    task: newTask
  }
})
