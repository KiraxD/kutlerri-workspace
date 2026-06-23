import { createClient } from '@/lib/supabase/server'
import { createTeamAndOrg } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch teams the user belongs to
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team:teams(*, org:organizations(*))')
    .eq('user_id', user.id)

  const teams = teamMembers?.map((tm: any) => tm.team) || []

  return (
    <div className="flex flex-col bg-background">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Teams</h1>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto space-y-8">
        
        {/* Existing Teams */}
        {teams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Teams</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team: any) => (
                <div key={team.id} className="border border-border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{team.name}</h3>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{team.identifier}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Org: {team.org?.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Team Form */}
        <div className="space-y-4 max-w-md border border-border rounded-lg p-6 bg-muted/10">
          <div>
            <h2 className="text-base font-semibold">Create Workspace & Team</h2>
            <p className="text-sm text-muted-foreground mb-4">Set up a new organization and team.</p>
          </div>
          
          <form action={createTeamAndOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" name="orgName" placeholder="e.g. Acme Corp" required />
            </div>
            
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="teamName">Team Name</Label>
                <Input id="teamName" name="teamName" placeholder="e.g. Engineering" required />
              </div>
              <div className="space-y-2 w-24">
                <Label htmlFor="teamIdentifier">Identifier</Label>
                <Input id="teamIdentifier" name="teamIdentifier" placeholder="ENG" maxLength={5} required className="uppercase" />
              </div>
            </div>

            <Button type="submit" className="w-full">Create Team</Button>
          </form>
        </div>

      </div>
    </div>
  )
}
