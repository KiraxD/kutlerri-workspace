'use client'

import React from 'react'
import { hasPermission, isAtLeastRole, type OrgRole } from '@/lib/permissions'

interface PermissionGuardProps {
  role: OrgRole | null
  permission?: string
  minRole?: OrgRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Component to conditionally render content based on permissions
 * Checks either a specific permission or minimum role level
 */
export function PermissionGuard({
  role,
  permission,
  minRole,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasAccess = permission
    ? hasPermission(role, permission)
    : minRole
      ? isAtLeastRole(role, minRole)
      : false

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * HOC to protect a component with permission checks
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string | null,
  minRole: OrgRole | null = null,
  fallback: React.ReactNode = null
) {
  return function ProtectedComponent(props: P & { role: OrgRole | null }) {
    const { role, ...rest } = props

    const hasAccess = permission
      ? hasPermission(role, permission)
      : minRole
        ? isAtLeastRole(role, minRole)
        : true

    if (!hasAccess) {
      return <>{fallback}</>
    }

    return <Component {...(rest as P)} />
  }
}
