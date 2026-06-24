'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notification-helper'

export async function createInitiativeAction({
  name,
  description,
  status,
}: {
  name: string
  description?: string
  status?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createInitiative')

    const supabase = await createClient()

    const { data: initiative, error } = await supabase
      .from('initiatives')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        status: status || 'Backlog',
        owner_id: userId,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, initiative }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createEpicAction({
  name,
  description,
  status,
  initiativeId,
}: {
  name: string
  description?: string
  status?: string
  initiativeId?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createEpic')

    const supabase = await createClient()

    const { data: epic, error } = await supabase
      .from('epics')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        status: status || 'Backlog',
        owner_id: userId,
        initiative_id: initiativeId || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, epic }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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
