import { createClient } from '@/lib/supabase/server'
import { createInitiativeAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { redirect } from 'next/navigation'

async function handleCreateInitiative(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = (formData.get('status') as string) || 'Backlog'
  const projectId = formData.get('projectId') as string

  if (!name) {
    throw new Error('Initiative name is required')
  }

  const result = await createInitiativeAction({
    name,
    description,
    status,
    projectId: projectId || undefined,
  })

  if (result.success) {
    if (projectId) {
      redirect(`/projects/${projectId}`)
    } else {
      redirect('/projects')
    }
  } else {
    throw new Error(result.error)
  }
}

export default async function NewInitiativePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { projectId } = await searchParams

  return (
    <div className="flex flex-col h-full items-center justify-center bg-muted/20">
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Create New Initiative</h1>
          <p className="text-sm text-muted-foreground mt-1">Define a strategic goal that drives epics and tasks</p>
        </div>
        <form action={handleCreateInitiative} className="p-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId || ''} />

          <div className="space-y-2">
            <Label htmlFor="name">Initiative Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Mobile App Redesign"
              required
              autoFocus
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the initiative, goals, and expected outcomes..."
              className="min-h-[150px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              name="status"
              defaultValue="Backlog"
              items={[
                { label: 'Backlog', value: 'Backlog' },
                { label: 'Ready', value: 'Ready' },
                { label: 'Todo', value: 'Todo' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Review', value: 'Review' },
                { label: 'Testing', value: 'Testing' },
                { label: 'Blocked', value: 'Blocked' },
                { label: 'Done', value: 'Done' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Testing">Testing</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 border-t border-border mt-6 pt-6">
            <a
              href={projectId ? `/projects/${projectId}` : '/projects'}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Cancel
            </a>
            <Button type="submit">Create Initiative</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
