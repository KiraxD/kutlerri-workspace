'use client'

import { useState, useEffect, useRef } from 'react'
import { Inbox as InboxIcon, Bell, Send, User, MessageSquare, Loader2, ArrowLeft, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskAcceptanceCard } from '@/components/task-acceptance-card'
import Link from 'next/link'
import { 
  getEmployeesAction, 
  getMessagesAction, 
  sendMessageAction,
  getConversationsAction 
} from './actions'

interface InboxClientProps {
  initialNotifications: any[]
  currentUserId: string
}

export default function InboxClient({ initialNotifications, currentUserId }: InboxClientProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>('notifications')
  const [notifications, setNotifications] = useState(initialNotifications)
  
  // Chat States
  const [employees, setEmployees] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (activeTab === 'chat') {
      loadConversations()
      loadEmployees()
    }
  }, [activeTab])

  // Poll messages every 3 seconds when a chat is open
  useEffect(() => {
    if (!selectedUser) return

    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedUser])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadEmployees() {
    try {
      setLoadingEmployees(true)
      const data = await getEmployeesAction()
      setEmployees(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  async function loadConversations() {
    try {
      const data = await getConversationsAction()
      setConversations(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadMessages() {
    if (!selectedUser) return
    try {
      const data = await getMessagesAction(selectedUser.id)
      setMessages(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || sending) return

    const tempMessage = newMessage
    setNewMessage('')
    setSending(true)

    try {
      const result = await sendMessageAction(selectedUser.id, tempMessage)
      if (result.success && result.message) {
        setMessages(prev => [...prev, result.message])
        // Refresh conversations list to bring this user to the top if needed
        loadConversations()
      } else {
        setNewMessage(tempMessage) // restore message on error
      }
    } catch (err) {
      console.error(err)
      setNewMessage(tempMessage)
    } finally {
      setSending(false)
    }
  }

  const startChatWithUser = (user: any) => {
    setSelectedUser(user)
    setMessages([])
    // Add to conversations locally if not already in list
    if (!conversations.some(c => c.id === user.id)) {
      setConversations(prev => [user, ...prev])
    }
  }

  async function handleArchiveNotification(id: string) {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function handleDeleteNotification(id: string) {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationMessage = (notification: any) => {
    const actor = notification.actor?.full_name || notification.actor?.email || 'Someone'

    switch (notification.type) {
      case 'task_acceptance_required':
        return null
      case 'subtask_acceptance_required':
        return null
      case 'task_assignment_accepted':
        return `${actor} accepted your task assignment`
      case 'task_assignment_declined':
        return `${actor} declined your task assignment`
      case 'task_assigned':
        return `${actor} assigned you to a task`
      case 'task_updated':
        return `${actor} updated a task`
      case 'task_completed':
        return `${actor} completed a task`
      case 'team_created':
        return `${actor} created a team`
      case 'team_member_added':
        return `${actor} added you to a team`
      case 'task_comment':
        return `${actor} commented on a task`
      case 'task_mentioned':
        return `${actor} mentioned you in a task`
      case 'mention':
        return `${actor} mentioned you`
      case 'assignment':
        return `${actor} assigned you to a task`
      case 'status_update':
        return `${actor} updated the status`
      case 'comment':
        return `${actor} commented on`
      case 'completed_work':
        return `${actor} completed`
      default:
        return `${actor} sent you a notification`
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const name = (emp.full_name || '').toLowerCase()
    const email = (emp.email || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header and Tabs */}
      <div className="flex flex-col border-b border-border bg-gradient-to-r from-primary/5 via-background to-background">
        <div className="flex items-center gap-3 px-8 pt-6 pb-4">
          <InboxIcon className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold font-heading tracking-tight text-foreground">Inbox</h1>
        </div>

        <div className="flex gap-1 px-8">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all capitalize -mb-[2px] ${
              activeTab === 'notifications'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                {notifications.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all capitalize -mb-[2px] ${
              activeTab === 'chat'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Employee Chat</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notifications' ? (
          <div className="h-full overflow-y-auto p-6 max-w-4xl">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">You&apos;re all caught up.</p>
                <p className="text-xs mt-1 opacity-60">Notifications will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: any) => {
                  const actor = notification.actor?.full_name || notification.actor?.email || 'Someone'
                  const isAcceptance = notification.type === 'task_acceptance_required' || notification.type === 'subtask_acceptance_required'
                  
                  if (isAcceptance && notification.task) {
                    return (
                      <div key={notification.id} className="py-1">
                        <TaskAcceptanceCard
                          taskId={notification.task.id}
                          taskIdentifier={notification.task.identifier}
                          taskTitle={notification.task.title}
                          assignedBy={actor}
                          notificationId={notification.id}
                          onResponded={() => {
                            setNotifications(prev => prev.filter(n => n.id !== notification.id))
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 px-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    )
                  }

                  const message = getNotificationMessage(notification)

                  return (
                    <div
                      key={notification.id}
                      className="p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all shadow-sm group"
                    >
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">
                            {message}
                          </p>
                          {notification.task && (
                            <Link href={`/task/${notification.task.identifier}`}>
                              <p className="text-xs font-semibold text-primary mt-1 hover:underline truncate">
                                {notification.task.identifier} – {notification.task.title}
                              </p>
                            </Link>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            title="Archive"
                            onClick={() => handleArchiveNotification(notification.id)}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" 
                            title="Delete"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Chat Section Layout */
          <div className="flex h-full overflow-hidden">
            {/* Sidebar list of chats and employees */}
            <div className="w-72 border-r border-border bg-muted/10 flex flex-col h-full shrink-0">
              <div className="p-3 border-b border-border">
                <input
                  type="text"
                  placeholder="Find or start chat with employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Chat conversations / search results */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {searchQuery ? (
                  // Search Results
                  <>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Employees</p>
                    {loadingEmployees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredEmployees.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground px-2 italic">No employees match "{searchQuery}"</p>
                    ) : (
                      filteredEmployees.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            startChatWithUser(emp)
                            setSearchQuery('')
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left text-xs transition-colors"
                        >
                          <Avatar className="w-6 h-6 text-[10px] shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {emp.full_name
                                ? emp.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                : emp.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-foreground">{emp.full_name || emp.email}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                ) : (
                  // Active Chats
                  <>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Recent Chats</p>
                    {conversations.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground px-2 italic">No recent chats. Search above to start one.</p>
                    ) : (
                      conversations.map(conv => {
                        const isSelected = selectedUser?.id === conv.id
                        return (
                          <button
                            key={conv.id}
                            onClick={() => setSelectedUser(conv)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                              isSelected 
                                ? 'bg-primary/10 font-medium border border-primary/20' 
                                : 'hover:bg-muted/40 border border-transparent'
                            }`}
                          >
                            <Avatar className="w-6 h-6 text-[10px] shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {conv.full_name
                                  ? conv.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                  : conv.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate text-foreground">{conv.full_name || conv.email}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{conv.email}</p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chat conversation panel */}
            <div className="flex-1 flex flex-col h-full bg-card/20 relative">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
                    <button 
                      onClick={() => setSelectedUser(null)} 
                      className="md:hidden p-1 rounded hover:bg-muted"
                    >
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <Avatar className="w-8 h-8 text-xs shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedUser.full_name
                          ? selectedUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          : selectedUser.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {selectedUser.full_name || selectedUser.email}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* Messages Log */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">No messages yet. Send a message to start communicating!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.sender_id === currentUserId
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                              <div className={`px-3 py-2 rounded-2xl text-xs ${
                                isMine 
                                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                  : 'bg-muted text-foreground rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              <span className="text-[8px] text-muted-foreground mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input Footer */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1 px-4 py-2 bg-muted/20 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!newMessage.trim() || sending}
                      className="rounded-xl h-8 w-8 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {sending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                /* No Active Chat Screen */
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Direct Messaging</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Select an employee from the sidebar or search to start a direct private conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
