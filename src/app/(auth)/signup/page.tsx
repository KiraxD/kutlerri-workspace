import { signup } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'

export default async function SignupPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d] px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center mb-6">
          <Image
            src="/images/kutlerri-logo.png"
            alt="Kutlerri"
            width={56}
            height={56}
            className="rounded-2xl shadow-md mb-2"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create an account</h1>
          <p className="text-sm text-white/60">Enter your details below to create your account</p>
        </div>
        <form className="space-y-4" action={signup}>
          {searchParams?.message && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
              {searchParams.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white">Full Name</Label>
            <Input id="full_name" name="full_name" type="text" placeholder="John Doe" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-white">Phone Number</Label>
            <Input id="phone_number" name="phone_number" type="tel" placeholder="+1 (555) 000-0000" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input id="password" name="password" type="password" required className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-white/40" />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <SubmitButton className="w-full" pendingText="Creating account...">
              Sign Up
            </SubmitButton>
            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
