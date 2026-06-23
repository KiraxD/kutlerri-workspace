import { createClient } from '@/lib/supabase/server'
import { Target, Calendar } from 'lucide-react'

export default async function CyclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = teamMembers?.map(tm => tm.team_id) ?? []

  let cycles: any[] = []
  if (teamIds.length > 0) {
    const { data, error } = await supabase
      .from('cycles')
      .select('*, team:teams(*)')
      .in('team_id', teamIds)
      .order('starts_at', { ascending: false })
    if (!error && data) cycles = data
    if (error) console.error('Error loading cycles:', error.message)
  }

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Target className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Cycles</h1>
        {cycles.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {cycles.length}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <Target className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-medium">No cycles yet</p>
            <p className="text-xs mt-1 opacity-60">Cycles help you organize work into fixed timeframes.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cycles.map((cycle: any) => (
              <div key={cycle.id} className="border border-border rounded-lg p-5 hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{cycle.name}</h3>
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(cycle.starts_at).toLocaleDateString()} – {new Date(cycle.ends_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground font-medium">
                  Team: {cycle.team?.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
