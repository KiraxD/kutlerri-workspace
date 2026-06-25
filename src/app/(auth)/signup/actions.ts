'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
        phone_number: formData.get('phone_number') as string,
      },
    },
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/signup?message=' + encodeURIComponent(error.message))
  }

  if (signUpData?.user) {
    const userName = signUpData.user.user_metadata?.full_name || signUpData.user.email?.split('@')[0] || 'User'
    const phone = signUpData.user.user_metadata?.phone_number ?? null
    try {
      await import('@/lib/init-workspace').then(m =>
        m.initializeUserWorkspace(signUpData.user!.id, signUpData.user!.email!, userName, phone)
      )
    } catch (initErr) {
      console.error('Failed to auto-initialize workspace during signup:', initErr)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
