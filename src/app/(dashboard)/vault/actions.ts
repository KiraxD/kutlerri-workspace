'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createVaultAction({
  name,
  description,
}: {
  name: string
  description?: string
}) {
  try {
    const { orgId } = await verifyPermission('createVault')

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

    return { success: true, vault }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
