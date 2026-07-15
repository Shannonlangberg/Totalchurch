import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { notify } from '../lib/notify'
import { MOVEMENTS } from '../lib/types'
import type { Assignment, Stewardship } from '../lib/types'
import { Btn, MovementChip, SectionTitle, Spinner, TextArea } from '../components/ui'

type Modal = null | { kind: 'help' | 'absence' | 'stepdown'; assignment: Assignment }

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [assignments, setAssignments] = useState<(Assignment & { stewardship: Stewardship })[] | null>(null)
  const [pending, setPending] = useState<string[]>([])
  const [modal, setModal] = useState<Modal>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  async function load() {
    if (!session) return
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase
        .from('assignments')
        .select('*, stewardship:stewardships(*)')
        .eq('profile_id', session.user.id)
        .eq('status', 'active'),
      supabase
        .from('requests')
        .select('stewardship_id, type, status, stewardship:stewardships(title)')
        .eq('profile_id', session.user.id)
        .eq('status', 'pending'),
    ])
    setAssignments((a as (Assignment & { stewardship: Stewardship })[]) ?? [])
    const rows = (r ?? []) as unknown as { type: string; stewardship: { title: string } | null }[]
    setPending(rows.filter((x) => x.type === 'join').map((x) => x.stewardship?.title ?? ''))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (!assignments) return <Spinner />

  const firstName = profile?.full_name?.split(' ')[0] || 'friend'

  async function submitModal() {
    if (!modal || !session) return
    setBusy(true)
    const s = modal.assignment.stewardship!
    if (modal.kind === 'absence') {
      await supabase.from('absences').insert({
        profile_id: session.user.id,
        stewardship_id: s.id,
        kind: 'sick',
        note: note || null,
      })
      notify('absence_reported', {
        stewardship: s.title,
        person: profile?.full_name,
        note,
      })
      setFlash('Thanks for saying so early — the House has it covered. Rest up.')
    } else if (modal.kind === 'stepdown') {
      await supabase.from('requests').insert({
        stewardship_id: s.id,
        profile_id: session.user.id,
        type: 'step_down',
        message: note || null,
      })
      notify('stepped_down', {
        stewardship: s.title,
        person: profile?.full_name,
        note,
      })
      setFlash('Request sent. Handing something back faithfully is honourable — a leader will be in touch.')
    } else {
      notify('absence_reported', {
        stewardship: s.title,
        person: profile?.full_name,
        note: `NEEDS HELP: ${note}`,
      })
      setFlash('A leader has been notified and will reach out soon.')
    }
    setBusy(false)
    setModal(null)
    setNote('')
    load()
  }

  return (
    <div>
      <p className="serif-accent text-lg text-stone">On your watch</p>
      <h1 className="mt-1 text-4xl font-light tracking-tight md:text-5xl">
        Hey {firstName}.
      </h1>

      {flash && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm">
          {flash}{' '}
          <button onClick={() => setFlash(null)} className="text-stone underline underline-offset-4 cursor-pointer">
            dismiss
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-6 rounded-2xl bg-mist p-4 text-sm text-stone">
          Awaiting confirmation: <span className="font-medium text-ink">{pending.join(', ')}</span> — a
          leader will approve you soon.
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-line bg-white p-10 text-center">
          <img src="/brand/Futures1.png" alt="" className="mx-auto h-12 w-auto opacity-60" />
          <p className="mt-6 text-2xl font-light">Nothing on your watch yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-stone">
            Every part of the House is someone's to steward. Find the area God is stirring in you.
          </p>
          <Link to="/app/browse">
            <Btn className="mt-8">Browse the House</Btn>
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {assignments.map((a) => {
            const s = a.stewardship
            const m = MOVEMENTS[s.movement]
            return (
              <div key={a.id} className="overflow-hidden rounded-3xl border border-line bg-white">
                <div className="h-1.5 w-full" style={{ background: m.color }} />
                <div className="p-7 md:p-9">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <MovementChip movement={s.movement} />
                    <p className="text-xs text-stone">
                      Stewarding since{' '}
                      {new Date(a.started_at).toLocaleDateString('en-AU', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <h2 className="mt-4 text-3xl font-light tracking-tight">{s.title}</h2>
                  <p className="serif-accent mt-3 text-lg leading-relaxed">{s.purpose}</p>

                  {s.playbook && (
                    <div className="mt-6 rounded-2xl bg-mist p-5">
                      <SectionTitle>Playbook</SectionTitle>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                        {s.playbook}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Btn variant="ghost" onClick={() => setModal({ kind: 'help', assignment: a })}>
                      Need help
                    </Btn>
                    <Btn variant="ghost" onClick={() => setModal({ kind: 'absence', assignment: a })}>
                      I'm sick / away
                    </Btn>
                    <Btn variant="danger" onClick={() => setModal({ kind: 'stepdown', assignment: a })}>
                      Request to step down
                    </Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-paper p-7">
            <h3 className="text-2xl font-light">
              {modal.kind === 'help' && 'What do you need?'}
              {modal.kind === 'absence' && "Can't make it?"}
              {modal.kind === 'stepdown' && 'Hand it back faithfully.'}
            </h3>
            <p className="mt-2 text-sm text-stone">
              {modal.kind === 'help' &&
                `A leader over ${modal.assignment.stewardship!.title} will be notified straight away.`}
              {modal.kind === 'absence' &&
                'No guilt — thanks for telling the House early so the gap can be covered.'}
              {modal.kind === 'stepdown' &&
                'The stewardship belongs to the House. A leader will confirm and open it for the next person.'}
            </p>
            <div className="mt-5">
              <TextArea
                label={modal.kind === 'help' ? 'Tell us what you need' : 'Add a note (optional)'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required={modal.kind === 'help'}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <Btn onClick={submitModal} disabled={busy || (modal.kind === 'help' && !note)}>
                {busy ? 'Sending…' : 'Send'}
              </Btn>
              <Btn variant="ghost" onClick={() => { setModal(null); setNote('') }}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
