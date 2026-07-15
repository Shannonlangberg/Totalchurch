import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Btn, Field } from '../components/ui'

export default function ProfilePage() {
  const { session, profile, refreshProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', session.user.id)
    await refreshProfile()
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl font-light tracking-tight">Profile</h1>
      <p className="mt-2 text-stone">{profile?.email}</p>
      {profile?.role === 'admin' && (
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-ray-purple">Leader</p>
      )}
      <form onSubmit={save} className="mt-8 space-y-4">
        <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Field
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="So a leader can reach you about your stewardship"
        />
        <Btn type="submit" disabled={busy}>
          {saved ? 'Saved ✓' : busy ? 'Saving…' : 'Save changes'}
        </Btn>
      </form>
      <hr className="my-10 border-line" />
      <Btn
        variant="ghost"
        onClick={async () => {
          await signOut()
          navigate('/')
        }}
      >
        Sign out
      </Btn>
    </div>
  )
}
