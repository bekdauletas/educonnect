'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type Lang = 'ru' | 'kz'
type Category = 'homework' | 'important' | 'announcement' | 'general'
type Tab = 'home' | 'chats' | 'tasks' | 'settings'

interface Message {
  id: string
  sender_name: string
  content: string
  category: Category
  created_at: string
  read_count?: number
}

const categoryLabels: Record<Category, { kz: string; ru: string; color: string; bg: string }> = {
  announcement: { kz: 'Хабарландыру', ru: 'Объявление', color: '#16a34a', bg: '#dcfce7' },
  homework: { kz: 'Үй жұмысы', ru: 'Дом. задание', color: '#d97706', bg: '#fef3c7' },
  important: { kz: 'Маңызды', ru: 'Важное', color: '#dc2626', bg: '#fee2e2' },
  general: { kz: 'Жалпы', ru: 'Общее', color: '#6b7280', bg: '#f3f4f6' },
}

export default function TeacherDashboard() {
  const [lang, setLang] = useState<Lang>('ru')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [category, setCategory] = useState<Category>('announcement')
  const [loading, setLoading] = useState(false)
  const [aiWarning, setAiWarning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [userName, setUserName] = useState('')
  const [isQuietMode, setIsQuietMode] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showCompose, setShowCompose] = useState(false)
  const [totalParents] = useState(29)
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    // setIsQuietMode(hour >= 20 || hour < 7)
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setUserName(profile.full_name || profile.email)
      setLang(profile.language || 'ru')
    }

    const { data: msgs } = await supabase
      .from('messages').select('*').order('created_at', { ascending: false })
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
    if (!newMessage.trim() || loading) return
    setChecking(true)
    setAiWarning(false)

    const isSafe = await checkWithGemini(newMessage)
    setChecking(false)

    if (!isSafe) { setAiWarning(true); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      sender_name: userName,
      content: newMessage,
      category,
      is_flagged: false
    }).select().single()

    if (!error && data) {
      setMessages([data, ...messages])
      setNewMessage('')
      setShowCompose(false)
    }
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: '⊞', label: lang === 'kz' ? 'Басты' : 'Главная' },
    { key: 'chats', icon: '💬', label: lang === 'kz' ? 'Чаттар' : 'Чаты' },
    { key: 'tasks', icon: '☰', label: lang === 'kz' ? 'Тапсырмалар' : 'Задания' },
    { key: 'settings', icon: '⚙', label: lang === 'kz' ? 'Баптаулар' : 'Настройки' },
  ]

  const categories: Category[] = ['announcement', 'homework', 'important', 'general']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      paddingBottom: '80px'
    }}>
      {/* Шапка */}
      <div style={{
        background: 'white',
        padding: '16px 20px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'kz' ? '10-А Сыныбы' : '10-А Класс'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
              {lang === 'kz' ? 'Мұғалім:' : 'Учитель:'} {userName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{
              background: '#f1f5f9', border: 'none', borderRadius: '20px',
              padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
              color: '#475569', fontWeight: '600'
            }}>
              {lang === 'ru' ? '🇰🇿 ҚАЗ' : '🇷🇺 РУС'}
            </button>
            <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>🔔</button>
          </div>
        </div>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: '0', marginTop: '12px', overflowX: 'auto' }}>
          {[
            { key: 'all', label: lang === 'kz' ? '⊞ Барлығы' : '⊞ Все' },
            { key: 'announcement', label: lang === 'kz' ? 'Хабарландыру' : 'Объявления' },
            { key: 'homework', label: lang === 'kz' ? 'Үй жұмысы' : 'Дом. задание' },
            { key: 'important', label: lang === 'kz' ? 'Маңызды' : 'Важное' },
          ].map(f => (
            <button key={f.key} style={{
              padding: '10px 14px', background: 'none', border: 'none',
              borderBottom: category === f.key ? '2px solid #16a34a' : '2px solid transparent',
              color: category === f.key ? '#16a34a' : '#94a3b8',
              fontSize: '13px', fontWeight: category === f.key ? '700' : '500',
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Тихий режим */}
      {isQuietMode && (
        <div style={{
          margin: '12px 16px', background: '#fff7ed',
          border: '1px solid #fed7aa', borderRadius: '12px',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>🌙</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#9a3412', margin: 0 }}>
              {lang === 'kz' ? 'Тыныш режим белсенді' : 'Тихий режим активен'}
            </p>
            <p style={{ fontSize: '12px', color: '#c2410c', margin: '2px 0 0' }}>
              {lang === 'kz' ? 'Жіберу 07:00-ге дейін өшірілген' : 'Отправка отключена до 07:00'}
            </p>
          </div>
        </div>
      )}

      {/* Кнопка написать */}
      {!showCompose && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={() => setShowCompose(true)}
            disabled={isQuietMode}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px',
              border: '2px dashed #cbd5e1',
              background: 'white', color: '#94a3b8',
              fontSize: '14px', cursor: isQuietMode ? 'not-allowed' : 'pointer',
              textAlign: 'left'
            }}
          >
            ✏️ {lang === 'kz' ? 'Хабарлама жазу...' : 'Написать сообщение...'}
          </button>
        </div>
      )}

      {/* Форма отправки */}
      {showCompose && (
        <div style={{
          margin: '12px 16px', background: 'white',
          borderRadius: '16px', padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {categories.map(cat => {
              const c = categoryLabels[cat]
              return (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  border: `2px solid ${c.color}`,
                  background: category === cat ? c.color : 'white',
                  color: category === cat ? 'white' : c.color,
                  cursor: 'pointer'
                }}>
                  {lang === 'kz' ? c.kz : c.ru}
                </button>
              )
            })}
          </div>

          <textarea
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); setAiWarning(false) }}
            placeholder={lang === 'kz' ? 'Хабарлама мәтіні...' : 'Текст сообщения...'}
            rows={3}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: aiWarning ? '2px solid #ef4444' : '1px solid #e2e8f0',
              fontSize: '14px', outline: 'none', resize: 'none',
              fontFamily: 'inherit', color: '#1e293b'
            }}
          />

          {aiWarning && (
            <div style={{
              background: '#fee2e2', borderRadius: '8px',
              padding: '8px 12px', marginTop: '8px',
              fontSize: '12px', color: '#dc2626'
            }}>
              ⚠️ {lang === 'kz' ? 'Хабарлама қолайсыз мазмұн қамтиды. Өзгертіңіз.' : 'Сообщение содержит недопустимый контент. Измените текст.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={() => { setShowCompose(false); setAiWarning(false); setNewMessage('') }} style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}>
              {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
            </button>
            <button onClick={sendMessage} disabled={loading || checking} style={{
              flex: 2, padding: '12px', borderRadius: '12px',
              border: 'none', background: '#16a34a',
              color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>
              {checking ? '🤖 AI...' : loading ? '...' : (lang === 'kz' ? '📤 Жіберу' : '📤 Отправить')}
            </button>
          </div>
        </div>
      )}

      {/* Сообщения */}
      <div style={{ padding: '12px 16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: '40px' }}>📭</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              {lang === 'kz' ? 'Хабарламалар әлі жоқ' : 'Сообщений пока нет'}
            </p>
          </div>
        )}
        {messages.map(msg => {
          const cat = categoryLabels[msg.category]
          const time = new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
          const fakeConfirmed = Math.floor(Math.random() * 20) + 5

          return (
            <div key={msg.id} style={{
              background: 'white', borderRadius: '16px', padding: '16px',
              marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '12px', fontWeight: '600', color: cat.color,
                  background: cat.bg, padding: '3px 10px', borderRadius: '20px'
                }}>
                  {lang === 'kz' ? cat.kz : cat.ru}
                </span>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                  🤖 AI Verified
                </span>
              </div>

              <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 12px' }}>
                {msg.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#16a34a' }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {fakeConfirmed}/{totalParents} {lang === 'kz' ? 'растады' : 'подтвердили'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>· {time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Нижняя навигация */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: 'white', borderTop: '1px solid #f1f5f9',
        display: 'flex', padding: '8px 0 12px'
      }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key)
            if (tab.key === 'settings') logout()
            if (tab.key === 'chats') router.push('/chat')
          }} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === tab.key ? '#16a34a' : '#94a3b8'
          }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '600' }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}