import { createClient } from '@/lib/supabase/server'
import { TaskList } from '@/components/tasks/task-list'
import { Task } from '@/lib/types'
import { CheckCircle2 } from 'lucide-react'

export default async function MyTasksPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch tasks assigned to the user
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Supabase error loading tasks:', error.message, error.details)
  }

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">My Tasks</h1>
        {tasks && tasks.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <TaskList tasks={(tasks as unknown as Task[]) ?? null} />
      </div>
    </div>
  )
}
