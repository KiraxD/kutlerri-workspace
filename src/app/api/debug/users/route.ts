import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's org
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization membership' }, { status: 403 })
    }

    // Only super admin can see debug info
    if (orgMember.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can access debug info' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()
    const orgId = orgMember.organization_id

    // Fetch all auth users
    const { data: authData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    const authUsers = authData?.users || []

    // Fetch all organization members
    const { data: members } = await supabase.from('organization_members').select('user_id, role').eq('organization_id', orgId)

    // Fetch all profiles
    const { data: profiles } = await adminSupabase.from('profiles').select('id, email, full_name')

    // Build member map
    const memberMap = new Map(members?.map((m) => [m.user_id, m.role]) || [])

    // Show details
    const details = {
      orgId,
      authUsersCount: authUsers.length,
      organizationMembersCount: members?.length || 0,
      profilesCount: profiles?.length || 0,
      authUsers: authUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name,
      })),
      organizationMembers: members || [],
      profiles: profiles || [],
      mapping: Array.from(authUsers)
        .map((u) => ({
          authEmail: u.email,
          authId: u.id,
          assignedRole: memberMap.get(u.id) || 'NOT FOUND',
          matchesAuth: memberMap.has(u.id),
        })),
    }

    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
