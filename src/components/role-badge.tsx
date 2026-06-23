'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ROLE_DISPLAY_NAMES, type OrgRole } from '@/lib/permissions'

interface RoleBadgeProps {
  role: OrgRole | null
  className?: string
}

/**
 * Badge component to display user role with color coding
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null

  const getRoleColor = (role: OrgRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-300'
      case 'admin':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300'
      case 'manager':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300'
      case 'employee':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-300'
      case 'viewer':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-300'
      default:
        return 'bg-gray-500/20 text-gray-700'
    }
  }

  return (
    <Badge variant="outline" className={`${getRoleColor(role)} ${className || ''}`}>
      {ROLE_DISPLAY_NAMES[role]}
    </Badge>
  )
}
