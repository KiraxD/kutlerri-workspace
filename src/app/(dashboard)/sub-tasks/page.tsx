import { createClient } from '@/lib/supabase/server'
import { GitBranch, AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { SubTasksListClient } from './SubTasksListClient'

export default async function SubTasksPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch sub-tasks assigned to the user, including the parent task
  const { data: subTasks, error } = await supabase
    .from('sub_tasks')
    .select(`
      id,
      task_id,
      name,
      status,
      priority,
      due_date,
      completed_at,
      created_at,
      task:task_id(id, title, identifier)
    `)
    .eq('assignee_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error loading sub-tasks:', error.message)
  }

  // Format and cast properly
  const formattedSubTasks = (subTasks ?? []).map((st: any) => ({
    id: st.id,
    taskId: st.task_id,
    title: st.name, // Map database name to title for consistency with other sub-task views
    status: st.status,
    completed_at: st.completed_at,
    priority: st.priority || 'None',
    due_date: st.due_date,
    taskIdentifier: st.task?.identifier,
    taskTitle: st.task?.title
  }))

  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-violet-50/50 to-background">
        <GitBranch className="w-5 h-5 text-violet-500 rotate-180" />
        <h1 className="text-lg font-semibold text-foreground">My Sub Tasks</h1>
        {formattedSubTasks.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">
            {formattedSubTasks.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <SubTasksListClient initialSubTasks={formattedSubTasks} />
      </div>
    </div>
  )
}
