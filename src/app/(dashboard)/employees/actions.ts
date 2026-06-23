'use server'

import { verifyPermission } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { type OrgRole, ROLE_HIERARCHY } from '@/lib/permissions'
import * as XLSX from 'xlsx'

export async function getEmployeesAction() {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    // Get current user's role
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    const userRole = currentUserRole?.role as OrgRole

    // Get all organization members
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)

    if (error) {
      return { success: false, error: error.message, employees: [] }
    }

    // For managers, filter to show only employees below them
    let filteredMembers = members
    if (userRole === 'manager') {
      filteredMembers = members.filter((m) => {
        const memberHierarchy = ROLE_HIERARCHY[m.role as OrgRole] || 0
        return memberHierarchy < ROLE_HIERARCHY.manager
      })
    }

    // Fetch user profiles for these members
    const userIds = filteredMembers.map((m) => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    // Combine data
    const employees = filteredMembers.map((member) => {
      const profile = profiles?.find((p) => p.id === member.user_id)
      return {
        id: member.user_id,
        email: profile?.email || '',
        full_name: profile?.full_name || null,
        role: member.role as OrgRole,
      }
    })

    return { success: true, employees }
  } catch (error: any) {
    return { success: false, error: error.message, employees: [] }
  }
}

export async function addEmployeeAction({
  email,
  full_name,
  role,
}: {
  email: string
  full_name: string
  role: OrgRole
}) {
  try {
    // Verify permission
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    // Get current user's role
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    const userRole = currentUserRole?.role as OrgRole

    // Managers can only assign viewer and employee roles
    if (userRole === 'manager' && (role === 'manager' || role === 'admin' || role === 'super_admin')) {
      return { success: false, error: 'Managers can only assign Viewer and Employee roles' }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    let userId_to_add = existingUser?.id

    // If user doesn't exist, create a profile
    if (!userId_to_add) {
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert([{ email, full_name }])
        .select('id')
        .single()

      if (createError) {
        return { success: false, error: createError.message }
      }
      userId_to_add = newUser?.id
    }

    // Add/update organization membership with role
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: orgId,
          user_id: userId_to_add,
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
    // Verify permission
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    // Get current user's role
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    const userRole = currentUserRole?.role as OrgRole

    // Managers can only assign viewer and employee roles
    if (userRole === 'manager' && (newRole === 'manager' || newRole === 'admin' || newRole === 'super_admin')) {
      return { success: false, error: 'Managers can only assign Viewer and Employee roles' }
    }

    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('organization_id', orgId)
      .eq('user_id', employeeId)

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
    // Verify permission
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    // Get current user's role
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    const userRole = currentUserRole?.role as OrgRole

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<{
      email: string
      full_name?: string
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

        // Managers can only import viewer and employee roles
        if (userRole === 'manager' && (role === 'manager' || role === 'admin' || role === 'super_admin')) {
          errors.push(`${row.email}: Managers can only assign Viewer and Employee roles`)
          continue
        }

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.email)
          .single()

        let userId_to_add = existingUser?.id

        // Create profile if doesn't exist
        if (!userId_to_add) {
          const { data: newUser } = await supabase
            .from('profiles')
            .insert([{ email: row.email, full_name: row.full_name || '' }])
            .select('id')
            .single()

          userId_to_add = newUser?.id
        }

        if (!userId_to_add) {
          errors.push(`Failed to process ${row.email}`)
          continue
        }

        // Add to organization
        await supabase
          .from('organization_members')
          .upsert(
            {
              organization_id: orgId,
              user_id: userId_to_add,
              role,
            },
            { onConflict: 'organization_id,user_id' }
          )

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
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    // Fetch audit logs for the organization
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
