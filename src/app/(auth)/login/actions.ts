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

  const { data: signInData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  if (signInData?.user) {
    const userName = signInData.user.user_metadata?.full_name || signInData.user.email?.split('@')[0] || 'User'
    const phone = signInData.user.user_metadata?.phone_number ?? null
    try {
      await import('@/lib/init-workspace').then(m =>
        m.initializeUserWorkspace(signInData.user!.id, signInData.user!.email!, userName, phone)
      )
    } catch (initErr) {
      console.error('Failed to auto-initialize workspace during login:', initErr)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
