import { createClient } from '@/lib/supabase/server'
import { BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NewStoryForm } from './form'

export default async function NewStoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
  const orgIds = orgMembers?.map((m: any) => m.organization_id) ?? []

  let epics: any[] = []
  let members: any[] = []

  if (orgIds.length > 0) {
    const { data: epicsData } = await supabase
      .from('epics')
      .select('id, name, initiative:initiatives(name)')
      .in('organization_id', orgIds)
      .order('name')
    epics = epicsData ?? []

    const { data: membersData } = await supabase
      .from('organization_members')
      .select('user_id, profiles:profiles(id, full_name, email)')
      .in('organization_id', orgIds)
    members = membersData?.map((m: any) => m.profiles).filter(Boolean) ?? []
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-border bg-gradient-to-r from-emerald-50 to-background">
        <Link href="/stories">
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">New Story</h1>
          <p className="text-xs text-muted-foreground">Create a user or business requirement</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-8 py-2 border-b border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
        <span>Initiatives</span>
        <span>→</span>
        <span>Epics</span>
        <span>→</span>
        <span className="text-foreground font-medium">Stories</span>
        <span>→</span>
        <span>Tasks</span>
        <span>→</span>
        <span>Sub Tasks</span>
      </div>

      <NewStoryForm epics={epics} members={members} />
    </div>
  )
}
