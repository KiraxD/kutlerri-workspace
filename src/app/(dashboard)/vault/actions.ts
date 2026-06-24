'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { createBulkNotifications } from '@/lib/notification-helper'

export async function createVaultAction({
  name,
  description,
}: {
  name: string
  description?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createVault')

    const supabase = await createClient()

    const { data: vault, error } = await supabase
      .from('vaults')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify org members about new vault
    if (vault?.id) {
      try {
        const supabaseAdmin = await createClient()
        const { data: members } = await supabaseAdmin
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .neq('user_id', userId)

        if (members && members.length > 0) {
          await createBulkNotifications(
            members.map((m) => ({
              type: 'vault_created',
              actorId: userId,
              userId: m.user_id,
              organizationId: orgId,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to create vault notifications:', err)
      }
    }

    return { success: true, vault }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
