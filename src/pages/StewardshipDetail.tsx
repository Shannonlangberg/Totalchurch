import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { notify } from '../lib/notify'
import { MOVEMENTS } from '../lib/types'
import type { Assignment, Request, Stewardship } from '../lib/types'
import { MovementChip, SectionTitle, Spinner, TextArea } from '../components/ui'

export default function StewardshipDetail() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const [s, setS] = useState<Stewardship | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [myRequest, setMyRequest] = useState<Request | null>(null)
  const [message, setMessage] = useState('')
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id || !session) return
      const [{ data: st }, { data: asg }, { data: req }] = await Promise.all([
        supabase.from('stewardships').select('*').eq('id', id).single(),
        supabase.from('assignments').select('*').eq('stewardship_id', id).eq('status', 'active'),
        supabase
          .from('requests')
          .select('*')
          .eq('stewardship_id', id)
          .eq('profile_id', session.user.id)
          .eq('type', 'join')
          .eq('status', 'pending')
          .maybeSingle(),
      ])
      setS(st as Stewardship)
      setAssignments((asg as Assignment[]) ?? [])
      setMyRequest(req as Request | null)
      setLoading(false)
    }
    load()
  }, [id, session])

  if (loading || !s) return <Spinner />

  const m = MOVEMENTS[s.movement]
  const filled = assignments.length
  const open = s.capacity - filled
  const mine = assignments.some((a) => a.profile_id === session?.user.id)

  async function requestStewardship() {
    if (!session || !s) return
    setBusy(true)
    const { error } = await supabase.from('requests').insert({
      stewardship_id: s.id,
      profile_id: session.user.id,
      type: 'join',
      message: message || null,
    })
    if (!error) {
      setDone(true)
      notify('join_requested', {
        stewardship: s.title,
        person: profile?.full_name ?? session.user.email,
        message,
      })
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app/browse" className="text-sm text-stone hover:text-ink">
        ← Back to the House
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <MovementChip movement={s.movement} size="lg" />
        {open > 0 ? (
          <span className="text-xs font-medium uppercase tracking-[0.15em]" style={{ color: m.color }}>
            {open} of {s.capacity} open
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-stone">
            Fully stewarded
          </span>
        )}
      </div>

      <h1 className="mt-5 text-4xl font-light tracking-tight md:text-5xl">{s.title}</h1>

      <div className="mt-10 space-y-10">
        <section>
          <SectionTitle>Why it matters</SectionTitle>
          <p className="serif-accent mt-3 text-xl leading-relaxed">{s.purpose}</p>
        </section>

        <section className="grid grid-cols-2 gap-6 rounded-3xl border border-line bg-white p-6">
          <div>
            <SectionTitle>Time</SectionTitle>
            <p className="mt-2 font-medium">{s.time_commitment}</p>
          </div>
          <div>
            <SectionTitle>Frequency</SectionTitle>
            <p className="mt-2 font-medium">{s.frequency}</p>
          </div>
          <div>
            <SectionTitle>Location</SectionTitle>
            <p className="mt-2 font-medium">{s.location || '—'}</p>
          </div>
          <div>
            <SectionTitle>Resources</SectionTitle>
            <p className="mt-2 font-medium">{s.resources || '—'}</p>
          </div>
        </section>

        {s.responsibilities.length > 0 && (
          <section>
            <SectionTitle>On your watch</SectionTitle>
            <ul className="mt-4 space-y-3">
              {s.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: m.color }}
                  />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {s.playbook && (
          <section>
            <SectionTitle>Playbook</SectionTitle>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-stone">{s.playbook}</p>
          </section>
        )}

        <section className="rounded-3xl bg-ink p-8 text-white">
          {mine ? (
            <>
              <p className="text-xl font-light">This is on your watch.</p>
              <p className="mt-2 text-white/60">
                Head to your dashboard for your playbook, help and availability.
              </p>
              <Link
                to="/app"
                className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-ink"
              >
                My dashboard
              </Link>
            </>
          ) : done || myRequest ? (
            <>
              <p className="text-xl font-light">Request received.</p>
              <p className="mt-2 text-white/60">
                A leader will confirm you soon — you'll get an email the moment it's yours.
              </p>
            </>
          ) : asking ? (
            <>
              <p className="text-xl font-light">Request {s.title}.</p>
              <div className="mt-4 [&_span]:text-white/50 [&_textarea]:border-white/20 [&_textarea]:bg-white/10 [&_textarea]:text-white">
                <TextArea
                  label="Anything a leader should know? (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Why this area, experience, availability…"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={requestStewardship}
                  disabled={busy}
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
                >
                  {busy ? 'Sending…' : 'Send request'}
                </button>
                <button
                  onClick={() => setAsking(false)}
                  className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 cursor-pointer"
                >
                  Not yet
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="serif-accent text-2xl font-light leading-snug">
                “Whoever is faithful with little will be faithful with much.”
              </p>
              <p className="mt-2 text-white/60">Sense God stirring you toward this?</p>
              <button
                onClick={() => setAsking(true)}
                className="mt-6 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-[1.03] cursor-pointer"
              >
                Request this stewardship
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
