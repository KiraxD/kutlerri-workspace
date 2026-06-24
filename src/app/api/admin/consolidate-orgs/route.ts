import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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

    // Only super admin can run this
    if (orgMember.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can consolidate orgs' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // Get all organizations (ordered by creation)
    const { data: allOrgs } = await adminSupabase.from('organizations').select('id, name').order('created_at', { ascending: true })

    if (!allOrgs || allOrgs.length === 0) {
      return NextResponse.json({ error: 'No organizations found' }, { status: 400 })
    }

    const primaryOrgId = allOrgs[0].id
    const otherOrgs = allOrgs.slice(1)

    if (otherOrgs.length === 0) {
      return NextResponse.json({ message: 'Only one org exists, no consolidation needed', primaryOrgId, movedUsers: 0 })
    }

    let movedUsers = 0

    // For each other org, move its users to primary org
    for (const otherOrg of otherOrgs) {
      const { data: members } = await adminSupabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', otherOrg.id)

      if (!members) continue

      for (const member of members) {
        // Check if user already in primary org
        const { data: existing } = await adminSupabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', primaryOrgId)
          .eq('user_id', member.user_id)
          .single()

        if (!existing) {
          // Add to primary org with same role
          await adminSupabase.from('organization_members').insert({
            organization_id: primaryOrgId,
            user_id: member.user_id,
            role: member.role,
          })
          movedUsers++
        }

        // Delete from old org
        await adminSupabase.from('organization_members').delete().eq('organization_id', otherOrg.id).eq('user_id', member.user_id)
      }
    }

    // Get default team in primary org
    const { data: defaultTeam } = await adminSupabase
      .from('teams')
      .select('id')
      .eq('organization_id', primaryOrgId)
      .limit(1)
      .single()

    // Get all members of primary org
    if (defaultTeam) {
      const { data: allMembers } = await adminSupabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', primaryOrgId)

      if (allMembers) {
        for (const member of allMembers) {
          const { data: inTeam } = await adminSupabase
            .from('team_members')
            .select('id')
            .eq('team_id', defaultTeam.id)
            .eq('user_id', member.user_id)
            .single()

          if (!inTeam) {
            await adminSupabase.from('team_members').insert({
              team_id: defaultTeam.id,
              user_id: member.user_id,
              role: 'member',
            })
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Consolidation complete',
      primaryOrgId,
      consolidatedOrgs: otherOrgs.map((o) => o.id),
      movedUsers,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
