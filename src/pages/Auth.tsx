import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Btn, Field } from '../components/ui'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
      navigate('/onboarding')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
      navigate(from)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="px-5 py-5">
        <Link to="/">
          <img src="/brand/Futures2.png" alt="Futures Church" className="h-5 w-auto" />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm">
          <img src="/brand/raysPurple.png" alt="" className="mb-8 h-10 w-auto" />
          <h1 className="text-3xl font-light tracking-tight">
            {mode === 'signup' ? 'Join the House.' : 'Welcome back.'}
          </h1>
          <p className="mt-2 text-stone">
            {mode === 'signup'
              ? 'Create your account and find what you’re called to steward.'
              : 'Log in to your stewardship.'}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <Field
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              hint={mode === 'signup' ? 'At least 8 characters' : undefined}
            />
            {error && <p className="text-sm text-ray-pink">{error}</p>}
            <Btn type="submit" disabled={busy} className="w-full">
              {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Log in'}
            </Btn>
          </form>
          <p className="mt-6 text-sm text-stone">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-ink underline underline-offset-4">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link to="/signup" className="text-ink underline underline-offset-4">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
