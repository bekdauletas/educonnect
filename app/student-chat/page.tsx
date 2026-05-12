'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

type Lang = 'ru' | 'kz'

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_role: 'teacher' | 'student'
  content: string
  is_flagged: boolean
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  role: 'teacher' | 'parent' | 'student'
  language: string
}

export default function StudentChatPage() {
  const [lang, setLang] = useState<Lang>('ru')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [aiWarning, setAiWarning] = useState(false)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('student_chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'student_chat_messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      // Родители не могут заходить в этот чат
      if (profile.role === 'parent') {
        router.push('/dashboard/parent')
        return
      }
      setCurrentUser(profile)
      setLang(profile.language || 'ru')
    }

    const { data: msgs } = await supabase
      .from('student_chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (msgs) setMessages(msgs)
  }

  const checkWithGemini = async (text: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      return data.isSafe
    } catch { return true }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || loading) return

    // Для учеников проверяем AI
    if (currentUser.role === 'student') {
      setChecking(true)
      setAiWarning(false)
      const isSafe = await checkWithGemini(newMessage)
      setChecking(false)
      if (!isSafe) {
        // Логируем заблокированное сообщение
        await supabase.from('moderation_logs').insert({
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          blocked_content: newMessage,
          ai_reason: 'Student chat: AI moderation blocked'
        })
        setAiWarning(true)
        return
      }
    }

    setLoading(true)
    await supabase.from('student_chat_messages').insert({
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      content: newMessage,
      is_flagged: false
    })

    setNewMessage('')
    setLoading(false)
  }

  const goBack = () => {
    if (currentUser) router.push(`/dashboard/${currentUser.role}`)
  }

  const roleColors: Record<'teacher' | 'student', { bg: string; text: string }> = {
    teacher: { bg: '#ede9fe', text: '#6b21a8' },
    student: { bg: '#dcfce7', text: '#15803d' }
  }

  const roleLabels = {
    teacher: { ru: 'Учитель', kz: 'Мұғалім' },
    student: { ru: 'Ученик', kz: 'Оқушы' }
  }

  return (
    <div style={{
      height: '100vh',
      background: '#f8fafc',
      maxWidth: '480px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    }}>
      {/* Шапка */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button onClick={goBack} style={{
          background: 'none', border: 'none',
          fontSize: '24px', cursor: 'pointer'
        }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            💬 {lang === 'kz' ? 'Оқушылар чаты' : 'Чат учеников'}
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
            {lang === 'kz' ? '10-А Сыныбы' : '10-А Класс'}
          </p>
        </div>
        <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{
          background: '#f1f5f9', border: 'none', borderRadius: '20px',
          padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
          color: '#475569', fontWeight: '600'
        }}>
          {lang === 'ru' ? '🇰🇿 ҚАЗ' : '🇷🇺 РУС'}
        </button>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: '40px' }}>💬</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              {lang === 'kz' ? 'Чат бос. Бірінші жазыңыз!' : 'Чат пуст. Напишите первым!'}
            </p>
          </div>
        )}
        {messages.map(msg => {
          const isCurrentUser = currentUser?.id === msg.sender_id
          const roleColor = roleColors[msg.sender_role]
          const roleLabel = roleLabels[msg.sender_role][lang]

          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
            }}>
              {!isCurrentUser && (
                <div style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    background: roleColor.bg,
                    color: roleColor.text,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    {roleLabel}
                  </span>
                  {msg.sender_name}
                </div>
              )}
              <div style={{
                background: isCurrentUser ? '#16a34a' : 'white',
                color: isCurrentUser ? 'white' : '#1e293b',
                padding: '12px 14px',
                borderRadius: isCurrentUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '75%',
                boxShadow: isCurrentUser ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                border: isCurrentUser ? 'none' : '1px solid #f1f5f9'
              }}>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {msg.content}
                </p>
              </div>
              <span style={{
                fontSize: '10px',
                color: '#94a3b8',
                marginTop: '2px'
              }}>
                {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* AI предупреждение */}
      {aiWarning && (
        <div style={{
          margin: '0 16px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', margin: 0 }}>
              {lang === 'kz' ? 'Қолайсыз мазмұн анықталды' : 'Обнаружен недопустимый контент'}
            </p>
            <p style={{ fontSize: '11px', color: '#ef4444', margin: '2px 0 0' }}>
              {lang === 'kz' ? 'Хабарламаны өзгертіңіз' : 'Измените сообщение'}
            </p>
          </div>
          <button onClick={() => setAiWarning(false)} style={{
            background: 'none', border: 'none',
            fontSize: '18px', cursor: 'pointer', color: '#dc2626'
          }}>×</button>
        </div>
      )}

      {/* Поле ввода */}
      <div style={{
        background: 'white',
        borderTop: '1px solid #f1f5f9',
        padding: '12px 16px 16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={newMessage}
          onChange={e => { setNewMessage(e.target.value); setAiWarning(false) }}
          placeholder={lang === 'kz' ? 'Хабарлама жазыңыз...' : 'Написать сообщение...'}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 100) + 'px'
          }}
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            maxHeight: '100px',
            overflowY: 'auto'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || checking || !newMessage.trim()}
          style={{
            background: (!newMessage.trim() || loading || checking) ? '#cbd5e1' : '#16a34a',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!newMessage.trim() || loading || checking) ? 'not-allowed' : 'pointer',
            fontSize: '20px'
          }}
        >
          {checking ? '🤖' : loading ? '...' : '📤'}
        </button>
      </div>
    </div>
  )
}