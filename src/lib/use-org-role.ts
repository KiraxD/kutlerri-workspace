'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OrgRole } from '@/lib/permissions'

/**
 * Hook to get the current user's organization role
 * Client-side only - use getOrgRoleServer for server components
 */
export function useOrgRole(orgId: string | null) {
  const [role, setRole] = useState<OrgRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) {
      setRole(null)
      setLoading(false)
      return
    }

    const fetchRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          setError('Not authenticated')
          return
        }

        const { data: orgMember, error } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          setError(error.message)
          setRole(null)
          return
        }

        setRole(orgMember?.role as OrgRole || null)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [orgId])

  return { role, loading, error }
}

/**
 * Server-side function to get user's organization role
 * Use this in server components
 */
export async function getOrgRoleServer(
  supabase: any,
  userId: string,
  orgId: string
): Promise<OrgRole | null> {
  try {
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    return orgMember?.role as OrgRole || null
  } catch {
    return null
  }
}

/**
 * Server-side function to check if user has permission
 */
export async function checkPermissionServer(
  supabase: any,
  userId: string,
  orgId: string,
  permission: string
): Promise<boolean> {
  const { hasPermission } = await import('@/lib/permissions')
  const role = await getOrgRoleServer(supabase, userId, orgId)
  return hasPermission(role, permission)
}
