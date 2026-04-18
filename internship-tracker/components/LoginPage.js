'use client'
import { createClient } from '../lib/supabase'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.icon}>📋</div>
        <h1 style={s.title}>实习投递追踪</h1>
        <p style={s.sub}>登录后即可在任何设备上管理你的实习申请进度</p>
        <button style={s.googleBtn} onClick={handleGoogleLogin}>
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          使用 Google 账号登录
        </button>
        <p style={s.note}>登录即代表你的数据将存储在你的专属空间，其他人无法访问</p>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '48px 40px',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    animation: 'slideUp 0.4s ease',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text)',
    marginBottom: 10,
    letterSpacing: '-0.5px',
  },
  sub: {
    fontSize: 14,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    padding: '13px 20px',
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.2s, transform 0.15s',
    marginBottom: 20,
  },
  note: {
    fontSize: 11,
    color: '#aaa',
    lineHeight: 1.5,
  }
}
