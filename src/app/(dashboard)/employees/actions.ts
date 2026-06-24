'use server'

import { verifyPermission } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ROLE_HIERARCHY, type OrgRole } from '@/lib/permissions'
import * as XLSX from 'xlsx'

const ASSIGNABLE_ROLES: Record<OrgRole, OrgRole[]> = {
  super_admin: ['super_admin', 'admin', 'manager', 'employee', 'viewer'],
  admin: [],
  manager: [],
  employee: [],
  viewer: [],
}

function canAssignRole(actorRole: OrgRole, targetRole: OrgRole) {
  return ASSIGNABLE_ROLES[actorRole].includes(targetRole)
}

async function getCurrentUserRole(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
  const { data: currentUserRole } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single()

  return (currentUserRole?.role as OrgRole) || null
}

async function listAuthUsersByEmail(email: string) {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    throw new Error(error.message)
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null
}

async function ensureProfileForAuthUser(user: NonNullable<Awaited<ReturnType<typeof listAuthUsersByEmail>>>) {
  const adminSupabase = createAdminClient()

  await adminSupabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    phone_number: (user.user_metadata?.phone_number as string | undefined) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  })
}

async function getTargetMemberRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  employeeId: string
) {
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', employeeId)
    .single()

  return (member?.role as OrgRole) || null
}

function canManageExistingRole(actorRole: OrgRole, targetRole: OrgRole | null) {
  if (!targetRole) {
    return true
  }

  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
}

export async function getEmployeesAction() {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()
    const userRole = await getCurrentUserRole(supabase, orgId, userId)

    if (!userRole) {
      return { success: false, error: 'Role not found', employees: [] }
    }

    // Fetch ALL auth users (registered users), including old accounts
    const adminSupabase = createAdminClient()
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return { success: false, error: `Failed to fetch registered users: ${authError.message}`, employees: [] }
    }

    if (!authData?.users || authData.users.length === 0) {
      return { success: true, employees: [] }
    }

    // Ensure all auth users have profiles created
    for (const authUser of authData.users) {
      await adminSupabase.from('profiles').upsert({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: (authUser.user_metadata?.full_name as string | undefined) ?? null,
        phone_number: (authUser.user_metadata?.phone_number as string | undefined) ?? null,
        avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
      })
    }

    // Fetch organization members to see who has a role assigned
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return { success: false, error: `Failed to fetch members: ${membersError.message}`, employees: [] }
    }

    const memberMap = new Map(members?.map((member) => [member.user_id, member.role]) || [])
    
    console.log('DEBUG: Organization members:', members)
    console.log('DEBUG: Member map:', Array.from(memberMap.entries()))
    console.log('DEBUG: Auth users:', authData.users.map(u => ({ id: u.id, email: u.email })))

    // Build employee list from auth users with their org roles
    let employees = authData.users
      .map((authUser) => {
        const assigned = memberMap.has(authUser.id)
        const role = (memberMap.get(authUser.id) as OrgRole) || ('viewer' as OrgRole)
        console.log(`DEBUG: User ${authUser.email} (${authUser.id}): assigned=${assigned}, role=${role}`)
        return {
          id: authUser.id,
          email: authUser.email || '',
          full_name: (authUser.user_metadata?.full_name as string | null) || null,
          role,
          isAssigned: assigned,
        }
      })
      .filter((employee) => employee.email)
      .sort((a, b) => a.email.localeCompare(b.email))

    // Managers can only see employees below them
    if (userRole === 'manager') {
      employees = employees.filter((employee) => ROLE_HIERARCHY[employee.role] < ROLE_HIERARCHY.manager)
    }

    return { success: true, employees }
  } catch (error: any) {
    console.error('getEmployeesAction error:', error)
    return { success: false, error: error.message || 'Unknown error fetching employees', employees: [] }
  }
}

export async function addEmployeeAction({
  email,
  role,
}: {
  email: string
  full_name: string
  role: OrgRole
}) {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()
    const userRole = await getCurrentUserRole(supabase, orgId, userId)

    if (!userRole) {
      return { success: false, error: 'Role not found' }
    }

    // Only super_admin can add employees
    if (userRole !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can add employees' }
    }

    if (!canAssignRole(userRole, role)) {
      return { success: false, error: 'You do not have permission to assign that role' }
    }

    const authUser = await listAuthUsersByEmail(email)
    if (!authUser) {
      return {
        success: false,
        error: 'That user has not signed up yet. Ask them to create an account first, then assign their role here.',
      }
    }

    await ensureProfileForAuthUser(authUser)

    const targetRole = await getTargetMemberRole(supabase, orgId, authUser.id)
    if (!canManageExistingRole(userRole, targetRole)) {
      return { success: false, error: 'You cannot change the role of a peer or higher-level member' }
    }

    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: orgId,
          user_id: authUser.id,
          role,
        },
        { onConflict: 'organization_id,user_id' }
      )

    if (memberError) {
      return { success: false, error: memberError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEmployeeRoleAction({
  employeeId,
  newRole,
}: {
  employeeId: string
  newRole: OrgRole
}) {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()
    const userRole = await getCurrentUserRole(supabase, orgId, userId)

    if (!userRole) {
      return { success: false, error: 'Role not found' }
    }

    // Only super_admin can change roles
    if (userRole !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can change employee roles' }
    }

    if (!canAssignRole(userRole, newRole)) {
      return { success: false, error: 'You do not have permission to assign that role' }
    }

    const targetRole = await getTargetMemberRole(supabase, orgId, employeeId)
    if (!canManageExistingRole(userRole, targetRole)) {
      return { success: false, error: 'You cannot change the role of a peer or higher-level member' }
    }

    const { error } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: orgId,
          user_id: employeeId,
          role: newRole,
        },
        { onConflict: 'organization_id,user_id' }
      )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function importEmployeesAction(formData: FormData) {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()
    const userRole = await getCurrentUserRole(supabase, orgId, userId)

    if (!userRole) {
      return { success: false, error: 'Role not found' }
    }

    // Only super_admin can import employees
    if (userRole !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can import employees' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<{
      email: string
      role?: OrgRole
    }>(worksheet)

    if (!data || data.length === 0) {
      return { success: false, error: 'No data found in file' }
    }

    let imported = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        if (!row.email) {
          errors.push('Row missing email')
          continue
        }

        const role = (row.role || 'employee') as OrgRole
        if (!canAssignRole(userRole, role)) {
          errors.push(`${row.email}: You do not have permission to assign ${role}`)
          continue
        }

        const authUser = await listAuthUsersByEmail(row.email)
        if (!authUser) {
          errors.push(`${row.email}: user must sign up before they can be added`)
          continue
        }

        await ensureProfileForAuthUser(authUser)

        const existingRole = await getTargetMemberRole(supabase, orgId, authUser.id)
        if (!canManageExistingRole(userRole, existingRole)) {
          errors.push(`${row.email}: cannot modify a peer or higher-level member`)
          continue
        }

        const { error } = await supabase
          .from('organization_members')
          .upsert(
            {
              organization_id: orgId,
              user_id: authUser.id,
              role,
            },
            { onConflict: 'organization_id,user_id' }
          )

        if (error) {
          errors.push(`${row.email}: ${error.message}`)
          continue
        }

        imported++
      } catch (err: any) {
        errors.push(`${row.email}: ${err.message}`)
      }
    }

    return {
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRoleAuditLogsAction() {
  try {
    const { orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    const { data: auditLogs, error } = await supabase
      .from('role_audit_log')
      .select(
        `
        id,
        user_id,
        action_type,
        role_type,
        old_role,
        new_role,
        team_id,
        created_at,
        changed_by_user_id,
        reason,
        user:user_id(email, full_name),
        team:team_id(name)
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return { success: false, error: error.message, logs: [] }
    }

    return {
      success: true,
      logs: auditLogs || [],
    }
  } catch (error: any) {
    return { success: false, error: error.message, logs: [] }
  }
}
