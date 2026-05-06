'use client'
import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'

const translations = {
  ru: {
    title: 'EduConnect AI',
    subtitle: 'Умная платформа для школьного общения',
    chooseRole: 'Выберите роль',
    teacher: 'Учитель',
    parent: 'Родитель',
    student: 'Ученик',
    email: 'Email',
    password: 'Пароль',
    login: 'Войти',
    register: 'Зарегистрироваться',
    haveAccount: 'Уже есть аккаунт?',
    noAccount: 'Нет аккаунта?',
    fullName: 'Имя и фамилия',
    error: 'Ошибка. Проверьте данные.',
    loading: 'Загрузка...'
  },
  kz: {
    title: 'EduConnect AI',
    subtitle: 'Мектеп байланысына арналған ақылды платформа',
    chooseRole: 'Рөлді таңдаңыз',
    teacher: 'Мұғалім',
    parent: 'Ата-ана',
    student: 'Оқушы',
    email: 'Email',
    password: 'Құпия сөз',
    login: 'Кіру',
    register: 'Тіркелу',
    haveAccount: 'Аккаунт бар ма?',
    noAccount: 'Аккаунт жоқ па?',
    fullName: 'Аты-жөні',
    error: 'Қате. Деректерді тексеріңіз.',
    loading: 'Жүктелуде...'
  }
}

type Role = 'teacher' | 'parent' | 'student'
type Lang = 'ru' | 'kz'

const roles: { key: Role; emoji: string; color: string }[] = [
  { key: 'teacher', emoji: '👨‍🏫', color: '#4f46e5' },
  { key: 'parent', emoji: '👨‍👩‍👦', color: '#0891b2' },
  { key: 'student', emoji: '🎒', color: '#059669' },
]

export default function Home() {
  const [lang, setLang] = useState<Lang>('ru')
  const [role, setRole] = useState<Role | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = translations[lang]

  const handleAuth = async () => {
    if (!role) return
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(`/dashboard/${role}`)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            language: lang
          })
          router.push(`/dashboard/${role}`)
        }
      }
    } catch (err) {
      setError(t.error)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Переключатель языка */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button
          onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {lang === 'ru' ? '🇰🇿 Қаз' : '🇷🇺 Рус'}
        </button>
      </div>

      {/* Карточка */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px 24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏫</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e1b4b' }}>{t.title}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{t.subtitle}</p>
        </div>

        <p style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '14px' }}>{t.chooseRole}</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {roles.map(r => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              style={{
                flex: 1,
                padding: '12px 4px',
                borderRadius: '12px',
                border: `2px solid ${role === r.key ? r.color : '#e5e7eb'}`,
                background: role === r.key ? r.color : 'white',
                color: role === r.key ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '20px' }}>{r.emoji}</span>
              {t[r.key]}
            </button>
          ))}
        </div>

        {!isLogin && (
          <input
            type="text"
            placeholder={t.fullName}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '12px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        )}
        <input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '12px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <input
          type="password"
          placeholder={t.password}
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px',
            fontSize: '14px',
            outline: 'none'
          }}
        />

        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>
        )}

        <button
          onClick={handleAuth}
          disabled={!role || loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: role ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#d1d5db',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: role ? 'pointer' : 'not-allowed',
            marginBottom: '16px'
          }}
        >
          {loading ? t.loading : isLogin ? t.login : t.register}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
          {isLogin ? t.noAccount : t.haveAccount}{' '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600' }}
          >
            {isLogin ? t.register : t.login}
          </span>
        </p>
      </div>
    </div>
  )
}