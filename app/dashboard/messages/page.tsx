'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
import { Message, Profile } from '@/types/database'
import { format } from 'date-fns'

interface Conversation {
  user: Profile
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const withUserId = searchParams.get('with')
  const taskId = searchParams.get('task')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(withUserId)
  const [activeUser, setActiveUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return
    // Get unique conversation partners
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Build conversations map
    const convMap = new Map<string, Conversation>()
    for (const msg of data as Message[]) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const otherUser = msg.sender_id === user.id
        ? (msg as Message & { receiver: Profile }).receiver
        : (msg as Message & { sender: Profile }).sender

      if (!convMap.has(otherId) && otherUser) {
        convMap.set(otherId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        })
      }
    }

    // Count unread
    for (const [, conv] of Array.from(convMap)) {
      const unread = (data as Message[]).filter(
        m => m.sender_id === conv.user.id && m.receiver_id === user.id && !m.is_read
      ).length
      conv.unreadCount = unread
    }

    setConversations(Array.from(convMap.values()))
    setLoading(false)
  }, [user])

  const fetchMessages = useCallback(async (otherId: string) => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    setMessages((data as Message[]) || [])

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }, [user])

  const fetchActiveUser = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setActiveUser(data as Profile)
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv)
      fetchActiveUser(activeConv)
    }
  }, [activeConv, fetchMessages, fetchActiveUser])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.sender_id === activeConv) {
          setMessages(prev => [...prev, newMsg])
        }
        fetchConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, activeConv, fetchConversations])

  const sendMessage = async () => {
    if (!user || !activeConv || !newMessage.trim()) return
    setSending(true)
    try {
      const { data } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: activeConv,
        content: newMessage.trim(),
        task_id: taskId || null,
      }).select().single()

      if (data) setMessages(prev => [...prev, data as Message])
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex">
      {/* Conversations List */}
      <div className={`w-full lg:w-72 border-r border-[#1e2b1e] bg-[#0d140d] flex flex-col ${activeConv ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#1e2b1e]">
          <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Messages</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={24} className="animate-spin text-green-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
            <MessageSquare size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-600 text-xs mt-1">Apply to tasks or post tasks to start chatting</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.user.id}
                onClick={() => setActiveConv(conv.user.id)}
                className={`w-full p-4 flex items-center gap-3 border-b border-[#1e2b1e] hover:bg-white/5 transition-colors text-left ${
                  activeConv === conv.user.id ? 'bg-green-500/5 border-l-2 border-l-green-500' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold shrink-0">
                  {conv.user.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{conv.user.full_name}</span>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{conv.lastMessage.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden lg:flex' : 'flex'}`}>
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <MessageSquare size={48} className="text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">Select a conversation</h3>
            <p className="text-gray-600 text-sm">Choose a conversation from the list</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-[#1e2b1e] flex items-center gap-3 px-4 bg-[#0d140d]">
              <button
                onClick={() => setActiveConv(null)}
                className="lg:hidden btn-ghost p-1.5"
              >
                ←
              </button>
              {activeUser && (
                <>
                  <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">
                    {activeUser.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{activeUser.full_name}</div>
                    <div className="text-xs text-gray-600">{activeUser.country}</div>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-600 text-sm">No messages yet. Send the first one!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? 'bg-green-500 text-black rounded-br-sm'
                          : 'bg-[#1a2a1a] text-gray-200 rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <div className={`text-xs mt-1 ${isMe ? 'text-green-900' : 'text-gray-600'}`}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                          {isMe && <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#1e2b1e] bg-[#0d140d]">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn-primary px-4 flex items-center gap-2"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
