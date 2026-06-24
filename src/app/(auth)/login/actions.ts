'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)

  revalidatePath('/', 'layout')
  redirect(memberships && memberships.length > 0 ? '/' : '/init')
}
