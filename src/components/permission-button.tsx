'use client'

import React from 'react'
import { hasPermission, isAtLeastRole, type OrgRole } from '@/lib/permissions'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PermissionButtonProps extends ButtonProps {
  role: OrgRole | null
  permission?: string
  minRole?: OrgRole
  deniedReason?: string
}

/**
 * Button component that respects permissions
 * Disables button if user doesn't have required permission
 */
export function PermissionButton({
  role,
  permission,
  minRole,
  deniedReason,
  disabled,
  children,
  className,
  ...rest
}: PermissionButtonProps) {
  const hasAccess = permission
    ? hasPermission(role, permission)
    : minRole
      ? isAtLeastRole(role, minRole)
      : false

  const isDisabled = !hasAccess || disabled

  const defaultDeniedReason = permission
    ? `You don't have permission to perform this action`
    : minRole
      ? `This action requires a higher role`
      : 'You do not have access'

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button disabled={isDisabled} className={className} {...rest}>
            {children}
          </Button>
        </TooltipTrigger>
        {isDisabled && (
          <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
            {deniedReason || defaultDeniedReason}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
