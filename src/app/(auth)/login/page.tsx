import { login } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;

  // Check if system is initialized
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('organization_members')
    .select('id')
    .limit(1)

  if (!members || members.length === 0) {
    redirect('/init')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center mb-6">
          <Image
            src="/images/kutlerri-logo.png"
            alt="Kutlerri"
            width={56}
            height={56}
            className="rounded-2xl shadow-md mb-2"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome to Kutlerri</h1>
          <p className="text-sm text-white/60">Enter your email to sign in to your account</p>
        </div>
        <form className="space-y-4" action={login}>
          {searchParams?.message && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
              {searchParams.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input id="password" name="password" type="password" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <SubmitButton className="w-full" pendingText="Signing in...">
              Sign In
            </SubmitButton>
            <Link href="/signup" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
