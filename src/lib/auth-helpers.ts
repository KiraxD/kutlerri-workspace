/**
 * Server-side permission checking utilities
 * Use these in all server actions to verify user permissions
 */

import { createClient } from '@/lib/supabase/server'
import { hasPermission, type OrgRole } from '@/lib/permissions'

/**
 * Verify user has permission to perform action
 * Throws error if permission denied, returns true if allowed
 */
export async function verifyPermission(
  permission: string,
  orgId?: string
): Promise<{ allowed: true; userId: string; orgId: string; role: OrgRole }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // If no orgId provided, get from first organization user is member of
  let targetOrgId = orgId
  if (!targetOrgId) {
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)

    if (!orgMembers || orgMembers.length === 0) {
      throw new Error('User is not member of any organization')
    }

    targetOrgId = orgMembers[0].organization_id
  }

  // Get user's role
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', targetOrgId)
    .eq('user_id', user.id)
    .single()

  const role = (orgMember?.role as OrgRole) || null

  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }

  return {
    allowed: true,
    userId: user.id,
    orgId: targetOrgId,
    role: role as OrgRole,
  }
}

/**
 * Wrap a server action with permission checking
 */
export function withPermissionCheck(permission: string) {
  return async function (action: Function, ...args: any[]) {
    await verifyPermission(permission)
    return action(...args)
  }
}
