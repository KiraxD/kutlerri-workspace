'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { initializeSystemAction } from './actions'

export default function InitPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if system is already initialized
    const checkInit = async () => {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        if (data.initialized) {
          router.push('/home')
        }
      }
    }
    checkInit()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await initializeSystemAction(email)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error || 'Initialization failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/kutlerri-logo.png"
            alt="Kutlerri"
            width={200}
            height={60}
            priority
          />
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Kutlerri</h1>
          <p className="text-white/60 mb-6">Initialize your workspace by setting the super admin email</p>

          {success ? (
            <div className="bg-green-500/20 border border-green-500 rounded p-4 mb-6">
              <p className="text-green-400">✓ System initialized successfully!</p>
              <p className="text-green-400/80 text-sm mt-2">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white text-sm">
                  Super Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="roychoudhury.124@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#0d0d0d] border-[#333] text-white placeholder:text-white/40 mt-2"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#9F7CEF] hover:bg-[#8f6cdf] text-white font-semibold py-2 rounded"
              >
                {loading ? 'Initializing...' : 'Initialize System'}
              </Button>
            </form>
          )}

          <p className="text-white/40 text-xs mt-6 text-center">
            This will create your organization and assign super admin role to the provided email.
          </p>

          <div className="mt-6 pt-6 border-t border-[#333]">
            <p className="text-white/60 text-sm mb-3">
              Don't have an account yet?
            </p>
            <Link
              href="/signup"
              className="w-full inline-block text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
