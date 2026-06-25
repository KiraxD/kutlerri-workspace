import { createClient } from '@/lib/supabase/server'
import { createEpicAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { redirect } from 'next/navigation'

async function handleCreateEpic(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = (formData.get('status') as string) || 'Backlog'
  const initiativeId = (formData.get('initiative_id') as string) || undefined
  const projectId = formData.get('projectId') as string

  if (!name) {
    throw new Error('Epic name is required')
  }

  const result = await createEpicAction({
    name,
    description,
    status,
    initiativeId,
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

export default async function NewEpicPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orgMembers } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
  const orgIds = orgMembers?.map((om: any) => om.organization_id) ?? []

  const { projectId } = await searchParams

  let initiatives: any[] = []
  if (orgIds.length > 0) {
    const query = supabase
      .from('initiatives')
      .select('id, name')
      .in('organization_id', orgIds)
      
    // If projectId is present, only fetch initiatives linked to this project
    if (projectId) {
      query.eq('project_id', projectId)
    }

    const { data } = await query.order('name')
    initiatives = data ?? []
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-muted/20">
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Create New Epic</h1>
          <p className="text-sm text-muted-foreground mt-1">Large bodies of work that contain multiple tasks</p>
        </div>
        <form action={handleCreateEpic} className="p-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId || ''} />

          <div className="space-y-2">
            <Label htmlFor="name">Epic Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., User Authentication System"
              required
              autoFocus
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initiative_id">Link to Initiative (Optional)</Label>
            <Select name="initiative_id">
              <SelectTrigger>
                <SelectValue placeholder="Select initiative" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No initiative</SelectItem>
                {initiatives.map((initiative: any) => (
                  <SelectItem key={initiative.id} value={initiative.id}>
                    {initiative.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the epic, scope, and acceptance criteria..."
              className="min-h-[150px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select name="status" defaultValue="Backlog">
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
            <Button type="submit">Create Epic</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
