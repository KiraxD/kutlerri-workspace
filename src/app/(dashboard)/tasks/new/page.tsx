import { createClient } from '@/lib/supabase/server'
import { createTask } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { redirect } from 'next/navigation'

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team:teams(*)')
    .eq('user_id', user.id)

  const teams: any[] = teamMembers?.map((teamMember) => Array.isArray(teamMember.team) ? teamMember.team[0] : teamMember.team).filter(Boolean) || []

  if (teams.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">No teams found</h2>
        <p className="text-muted-foreground mb-4">You need to be part of a team to create a task.</p>
        <a href="/teams" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Go to Teams
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-muted/20">
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Create New Task</h1>
        </div>
        <form action={createTask} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="team_id">Team</Label>
                <Select name="team_id" defaultValue={teams[0].id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.identifier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="Todo">
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

              <div className="flex-1 space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="no_priority">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_priority">No Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Task title" required autoFocus className="text-lg font-medium" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Add a description..." className="min-h-[150px] resize-y" />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border mt-6 pt-6">
            <a href="/my-tasks" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Cancel
            </a>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
