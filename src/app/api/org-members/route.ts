import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ members: [] }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  const orgId = searchParams.get('orgId')

  if (teamId) {
    // Team members
    const { data } = await supabase
      .from('team_members')
      .select('user:profiles!user_id(id, full_name, email)')
      .eq('team_id', teamId)
    const members = (data ?? []).map((m: any) => m.user).filter(Boolean)
    return NextResponse.json({ members })
  }

  if (orgId) {
    // Org members
    const { data } = await supabase
      .from('organization_members')
      .select('user:profiles!user_id(id, full_name, email)')
      .eq('organization_id', orgId)
    const members = (data ?? []).map((m: any) => m.user).filter(Boolean)
    return NextResponse.json({ members })
  }

  // Fallback: look up the current user's org and return its members
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)

  const currentOrgId = orgMembers?.[0]?.organization_id
  if (!currentOrgId) return NextResponse.json({ members: [] })

  const { data } = await supabase
    .from('organization_members')
    .select('user:profiles!user_id(id, full_name, email)')
    .eq('organization_id', currentOrgId)

  const members = (data ?? []).map((m: any) => m.user).filter(Boolean)
  return NextResponse.json({ members })
}
