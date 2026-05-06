'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type Lang = 'ru' | 'kz'
type Category = 'homework' | 'important' | 'announcement' | 'general'
type Tab = 'home' | 'chats' | 'tasks' | 'settings'
type Filter = Category | 'all'

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

export default function StudentDashboard() {
  const [lang, setLang] = useState<Lang>('ru')
  const [messages, setMessages] = useState<Message[]>([])
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [userName, setUserName] = useState('')
  const [isQuietMode, setIsQuietMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    setIsQuietMode(hour >= 20 || hour < 7)
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

    const saved = localStorage.getItem(`done_${user.id}`)
    if (saved) setDoneIds(new Set(JSON.parse(saved)))
  }

  const toggleDone = async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newDoneIds = new Set(doneIds)
    if (newDoneIds.has(messageId)) {
      newDoneIds.delete(messageId)
    } else {
      newDoneIds.add(messageId)
    }
    setDoneIds(newDoneIds)
    localStorage.setItem(`done_${user.id}`, JSON.stringify([...newDoneIds]))
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = filter === 'all' ? messages : messages.filter(m => m.category === filter)
  const homeworkMessages = messages.filter(m => m.category === 'homework')
  const doneHomework = homeworkMessages.filter(m => doneIds.has(m.id)).length
  const totalHomework = homeworkMessages.length

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: '⊞', label: lang === 'kz' ? 'Басты' : 'Главная' },
    { key: 'chats', icon: '💬', label: lang === 'kz' ? 'Чаттар' : 'Чаты' },
    { key: 'tasks', icon: '☰', label: lang === 'kz' ? 'Тапсырмалар' : 'Задания' },
    { key: 'settings', icon: '⚙', label: lang === 'kz' ? 'Баптаулар' : 'Настройки' },
  ]

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: lang === 'kz' ? '⊞ Барлығы' : '⊞ Все' },
    { key: 'homework', label: lang === 'kz' ? 'Үй жұмысы' : 'Дом. задание' },
    { key: 'announcement', label: lang === 'kz' ? 'Хабарландыру' : 'Объявления' },
    { key: 'important', label: lang === 'kz' ? 'Маңызды' : 'Важное' },
  ]

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
              {lang === 'kz' ? 'Оқушы:' : 'Ученик:'} {userName}
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

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: '0', marginTop: '12px', overflowX: 'auto' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '10px 14px', background: 'none', border: 'none',
              borderBottom: filter === f.key ? '2px solid #16a34a' : '2px solid transparent',
              color: filter === f.key ? '#16a34a' : '#94a3b8',
              fontSize: '13px', fontWeight: filter === f.key ? '700' : '500',
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
              {lang === 'kz' ? 'Хабарламалар 07:00-ге дейін өшірілген' : 'Уведомления отключены до 07:00'}
            </p>
          </div>
        </div>
      )}

      {/* Прогресс домашних заданий */}
      {totalHomework > 0 && (
        <div style={{
          margin: '12px 16px', background: 'white',
          borderRadius: '16px', padding: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              📚 {lang === 'kz' ? 'Үй тапсырмасы прогресі' : 'Прогресс заданий'}
            </p>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', margin: 0 }}>
              {doneHomework}/{totalHomework}
            </p>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(90deg, #16a34a, #22c55e)',
              height: '100%', borderRadius: '999px',
              width: `${totalHomework > 0 ? (doneHomework / totalHomework) * 100 : 0}%`,
              transition: 'width 0.4s ease'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', margin: '6px 0 0' }}>
            {totalHomework - doneHomework > 0
              ? `${totalHomework - doneHomework} ${lang === 'kz' ? 'тапсырма қалды' : 'заданий осталось'}`
              : (lang === 'kz' ? '✅ Барлығы орындалды!' : '✅ Всё выполнено!')}
          </p>
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
          const cat = categoryLabels[msg.category]
          const isDone = doneIds.has(msg.id)
          const isHomework = msg.category === 'homework'
          const time = new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={msg.id} style={{
              background: isDone ? '#f0fdf4' : 'white',
              borderRadius: '16px', padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: `1px solid ${isDone ? '#bbf7d0' : '#f1f5f9'}`
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
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                  🤖 AI Verified
                </span>
              </div>

              {/* Текст */}
              <p style={{
                fontSize: '14px', color: '#1e293b',
                lineHeight: '1.6', margin: '0 0 12px',
                textDecoration: isDone && isHomework ? 'line-through' : 'none',
                opacity: isDone && isHomework ? 0.6 : 1
              }}>
                {msg.content}
              </p>

              {/* Нижняя строка */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {lang === 'kz' ? 'Жіберді:' : 'От:'} {msg.sender_name} · {time}
                </span>
                {isHomework && (
                  <button
                    onClick={() => toggleDone(msg.id)}
                    style={{
                      padding: '8px 16px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '700', border: 'none',
                      background: isDone ? '#dcfce7' : '#16a34a',
                      color: isDone ? '#16a34a' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {isDone
                      ? (lang === 'kz' ? '✓ Орындалды' : '✓ Выполнено')
                      : (lang === 'kz' ? 'Орындадым' : 'Выполнил')}
                  </button>
                )}
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