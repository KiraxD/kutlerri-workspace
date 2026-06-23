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
      
      // Create task shortcut: C
      if (e.key === 'c' && e.target === document.body && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push('/tasks/new')
      }

      // Assign, Edit, Move
      if (['a', 'e', 'm'].includes(e.key) && e.target === document.body && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        console.log(`Shortcut ${e.key.toUpperCase()} pressed. (Requires task selection context)`)
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
          <CommandItem onSelect={() => { setOpen(false); router.push('/tasks/new') }}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Task</span>
            <span className="ml-auto text-xs tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">C</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); router.push('/search') }}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Tasks...</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { setOpen(false); router.push('/my-tasks') }}>
            <FileText className="mr-2 h-4 w-4" />
            <span>My Tasks</span>
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

