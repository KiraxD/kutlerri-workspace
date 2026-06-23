import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center mb-6">
          <Image src="/images/logo.webp" alt="Kutlerri Logo" width={140} height={40} className="mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Kutlerri</h1>
          <p className="text-sm text-muted-foreground">Enter your email to sign in to your account</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button formAction={login} className="w-full">
              Sign In
            </Button>
            <Button formAction={signup} variant="outline" className="w-full">
              Create an account
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
