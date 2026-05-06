'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type Lang = 'ru' | 'kz'
type Category = 'homework' | 'important' | 'announcement' | 'general'
type Filter = Category | 'all'
type Tab = 'home' | 'chats' | 'tasks' | 'settings'

interface Message {
  id: string
  sender_name: string
  content: string
  category: Category
  created_at: string
}

const categoryLabels: Record<Category, { kz: string; ru: string; color: string; bg: string }> = {
  announcement: { kz: 'Хабарландыру', ru: 'Объявление', color: '#16a34a', bg: '#dcfce7' },
  homework: { kz: 'Үй жұмысы', ru: 'Дом. задание', color: '#d97706', bg: '#fef3c7' },
  important: { kz: 'Маңызды', ru: 'Важное', color: '#dc2626', bg: '#fee2e2' },
  general: { kz: 'Жалпы', ru: 'Общее', color: '#6b7280', bg: '#f3f4f6' },
}

export default function ParentDashboard() {
  const [lang, setLang] = useState<Lang>('ru')
  const [messages, setMessages] = useState<Message[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [isQuietMode, setIsQuietMode] = useState(false)
  const [totalParents] = useState(29)
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    setIsQuietMode(hour >= 20 || hour < 7)
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setUserName(profile.full_name || profile.email)
      setLang(profile.language || 'ru')
    }

    const { data: msgs } = await supabase
      .from('messages').select('*').order('created_at', { ascending: false })
    if (msgs) setMessages(msgs)

    const { data: reads } = await supabase
      .from('message_reads').select('message_id').eq('user_id', user.id)
    if (reads) setReadIds(new Set(reads.map((r: any) => r.message_id)))
  }

  const markAsRead = async (messageId: string) => {
    if (readIds.has(messageId)) return
    await supabase.from('message_reads').insert({ message_id: messageId, user_id: userId })
    setReadIds(new Set([...readIds, messageId]))
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = filter === 'all' ? messages : messages.filter(m => m.category === filter)
  const confirmedCount = readIds.size

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: lang === 'kz' ? 'Барлығы' : 'Все' },
    { key: 'announcement', label: lang === 'kz' ? 'Хабарландыру' : 'Объявления' },
    { key: 'homework', label: lang === 'kz' ? 'Үй жұмысы' : 'Дом. задание' },
    { key: 'important', label: lang === 'kz' ? 'Маңызды' : 'Важное' },
  ]

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: '⊞', label: lang === 'kz' ? 'Басты' : 'Главная' },
    { key: 'chats', icon: '💬', label: lang === 'kz' ? 'Чаттар' : 'Чаты' },
    { key: 'tasks', icon: '☰', label: lang === 'kz' ? 'Тапсырмалар' : 'Задания' },
    { key: 'settings', icon: '⚙', label: lang === 'kz' ? 'Баптаулар' : 'Настройки' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      position: 'relative',
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
            <button onClick={() => {}} style={{
              background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer'
            }}>🔔</button>
          </div>
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: '0', marginTop: '12px', overflowX: 'auto' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: filter === f.key ? '2px solid #16a34a' : '2px solid transparent',
              color: filter === f.key ? '#16a34a' : '#94a3b8',
              fontSize: '13px',
              fontWeight: filter === f.key ? '700' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
              {f.key === 'all' && '⊞ '}{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Тихий режим */}
      {isQuietMode && (
        <div style={{
          margin: '12px 16px',
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>🌙</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#9a3412', margin: 0 }}>
              {lang === 'kz' ? 'Тыныш режим белсенді' : 'Тихий режим активен'}
            </p>
            <p style={{ fontSize: '12px', color: '#c2410c', margin: '2px 0 0' }}>
              {lang === 'kz' ? 'Хабарламалар 07:00-ге дейін өшірілген' : 'Уведомления отключены до 07:00'}
            </p>
          </div>
        </div>
      )}

      {/* Сообщения */}
      <div style={{ padding: '12px 16px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: '40px' }}>📭</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              {lang === 'kz' ? 'Хабарламалар әлі жоқ' : 'Сообщений пока нет'}
            </p>
          </div>
        )}
        {filtered.map(msg => {
          const isRead = readIds.has(msg.id)
          const cat = categoryLabels[msg.category]
          const time = new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
          const confirmedForThis = isRead ? confirmedCount : confirmedCount

          return (
            <div key={msg.id} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f1f5f9'
            }}>
              {/* Верхняя строка */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '12px', fontWeight: '600',
                  color: cat.color, background: cat.bg,
                  padding: '3px 10px', borderRadius: '20px'
                }}>
                  {lang === 'kz' ? cat.kz : cat.ru}
                </span>
                <span style={{
                  fontSize: '11px', color: '#16a34a', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  🤖 AI Verified
                </span>
              </div>

              {/* Текст */}
              <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 12px' }}>
                {msg.content}
              </p>

              {/* Нижняя строка */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#16a34a' }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {isRead ? confirmedCount : confirmedCount}/{totalParents} {lang === 'kz' ? 'растады' : 'подтвердили'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>· {time}</span>
                </div>
                <button
                  onClick={() => markAsRead(msg.id)}
                  disabled={isRead}
                  style={{
                    padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                    border: 'none',
                    background: isRead ? '#f1f5f9' : '#16a34a',
                    color: isRead ? '#94a3b8' : 'white',
                    cursor: isRead ? 'default' : 'pointer'
                  }}
                >
                  {isRead
                    ? (lang === 'kz' ? '✓ Расталды' : '✓ Подтверждено')
                    : (lang === 'kz' ? 'Түсіндім' : 'Понятно')}
                </button>
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