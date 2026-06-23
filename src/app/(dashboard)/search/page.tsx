import { createClient } from '@/lib/supabase/server'
import { Search as SearchIcon } from 'lucide-react'
import { IssueList } from '@/components/issues/issue-list'
import { Issue } from '@/lib/types'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user's teams
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = teamMembers?.map(tm => tm.team_id) || []

  let issues: any[] = []

  if (q && teamIds.length > 0) {
    // Simple text search on title or identifier
    const { data } = await supabase
      .from('issues')
      .select('*')
      .in('team_id', teamIds)
      .or(`title.ilike.%${q}%,identifier.ilike.%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(50)
      
    if (data) issues = data
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <SearchIcon className="w-5 h-5" />
          Search
        </h1>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto flex flex-col">
        <form method="GET" action="/search" className="mb-6 max-w-2xl">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search issues by title or ID (e.g. KT-12)..."
              className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
        </form>

        {q && (
          <div className="mb-4 text-sm text-muted-foreground">
            {issues.length} {issues.length === 1 ? 'result' : 'results'} for "{q}"
          </div>
        )}

        <div className="flex-1">
          {!q ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p>Type to start searching across your workspace.</p>
            </div>
          ) : (
            <IssueList issues={issues as unknown as Issue[]} />
          )}
        </div>
      </div>
    </div>
  )
}
