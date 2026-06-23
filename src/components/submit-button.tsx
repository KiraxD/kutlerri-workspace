'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ 
  children, 
  pendingText = 'Submitting...', 
  ...props 
}: React.ComponentProps<typeof Button> & { pendingText?: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
