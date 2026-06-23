'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Settings, FileText } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle palette: Ctrl+K or Cmd+K, or Q (when not in input)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === 'q' && e.target === document.body)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      // Create issue shortcut: C
      if (e.key === 'c' && e.target === document.body && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push('/issues/new')
      }

      // Assign, Edit, Move
      if (['a', 'e', 'm'].includes(e.key) && e.target === document.body && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        console.log(`Shortcut ${e.key.toUpperCase()} pressed. (Requires issue selection context)`)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [router])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => { setOpen(false); router.push('/issues/new') }}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Issue</span>
            <span className="ml-auto text-xs tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">C</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); router.push('/search') }}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Issues...</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { setOpen(false); router.push('/my-issues') }}>
            <FileText className="mr-2 h-4 w-4" />
            <span>My Issues</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); router.push('/settings') }}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
