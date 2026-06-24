'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createTask(formData: FormData) {
  const { userId } = await verifyPermission('createTask')

  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const team_id = formData.get('team_id') as string
  const status = (formData.get('status') as string) || 'Todo'
  const priority = (formData.get('priority') as string) || 'no_priority'

  if (!title || !team_id) {
    throw new Error('Title and Team are required')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      team_id,
      status,
      priority,
      creator_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error('Failed to create task')
  }

  revalidatePath('/my-tasks')
  redirect(`/task/${task.identifier}`)
}
