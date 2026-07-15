import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { notify } from '../../lib/notify'
import { MOVEMENTS } from '../../lib/types'
import type { Absence, Assignment, Movement, Profile, Request, Stewardship } from '../../lib/types'
import { Btn, Field, MovementChip, SectionTitle, Spinner, TextArea } from '../../components/ui'

type Tab = 'requests' | 'stewardships' | 'people' | 'absences'

const emptyForm = {
  title: '',
  movement: 'create' as Movement,
  purpose: '',
  time_commitment: '',
  frequency: '',
  responsibilities: '',
  playbook: '',
  location: '',
  resources: '',
  capacity: 1,
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<Request[] | null>(null)
  const [stewardships, setStewardships] = useState<Stewardship[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [people, setPeople] = useState<Profile[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [editing, setEditing] = useState<Stewardship | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  async function load() {
    const [{ data: r }, { data: s }, { data: a }, { data: p }, { data: ab }] = await Promise.all([
      supabase
        .from('requests')
        .select('*, stewardship:stewardships(*), profile:profiles(*)')
        .eq('status', 'pending')
        .order('created_at'),
      supabase.from('stewardships').select('*').order('movement').order('title'),
      supabase.from('assignments').select('*, profile:profiles(*)').eq('status', 'active'),
      supabase.from('profiles').select('*').order('full_name'),
      supabase
        .from('absences')
        .select('*, stewardship:stewardships(title), profile:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setRequests((r as Request[]) ?? [])
    setStewardships((s as Stewardship[]) ?? [])
    setAssignments((a as Assignment[]) ?? [])
    setPeople((p as Profile[]) ?? [])
    setAbsences((ab as Absence[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  if (!requests) return <Spinner />

  const activeFor = (sid: string) => assignments.filter((a) => a.stewardship_id === sid)
  const vacant = stewardships.filter(
    (s) => s.status === 'active' && activeFor(s.id).length < s.capacity,
  )

  async function decide(req: Request, approve: boolean) {
    setBusy(true)
    const { error } = await supabase.rpc(approve ? 'approve_request' : 'decline_request', {
      req_id: req.id,
    })
    if (!error && approve) {
      notify(req.type === 'join' ? 'request_approved' : 'stepped_down', {
        stewardship: req.stewardship?.title,
        person: req.profile?.full_name,
        email: req.profile?.email,
        type: req.type,
      })
    }
    await load()
    setBusy(false)
  }

  function openEditor(s: Stewardship | 'new') {
    setEditing(s)
    if (s === 'new') setForm(emptyForm)
    else
      setForm({
        title: s.title,
        movement: s.movement,
        purpose: s.purpose,
        time_commitment: s.time_commitment,
        frequency: s.frequency,
        responsibilities: s.responsibilities.join('\n'),
        playbook: s.playbook,
        location: s.location,
        resources: s.resources,
        capacity: s.capacity,
      })
  }

  async function saveStewardship(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const payload = {
      title: form.title,
      movement: form.movement,
      purpose: form.purpose,
      time_commitment: form.time_commitment,
      frequency: form.frequency,
      responsibilities: form.responsibilities
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      playbook: form.playbook,
      location: form.location,
      resources: form.resources,
      capacity: form.capacity,
    }
    if (editing === 'new') await supabase.from('stewardships').insert(payload)
    else if (editing) await supabase.from('stewardships').update(payload).eq('id', editing.id)
    setEditing(null)
    await load()
    setBusy(false)
  }

  async function setArchived(s: Stewardship, archived: boolean) {
    await supabase
      .from('stewardships')
      .update({ status: archived ? 'archived' : 'active' })
      .eq('id', s.id)
    load()
  }

  async function setRole(p: Profile, role: 'member' | 'admin') {
    await supabase.from('profiles').update({ role }).eq('id', p.id)
    load()
  }

  const tabBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`rounded-full px-5 py-2.5 text-sm transition-colors cursor-pointer ${
        tab === t ? 'bg-ink text-white' : 'border border-line text-stone hover:border-ink hover:text-ink'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === t ? 'bg-white/20' : 'bg-mist'}`}>
          {count}
        </span>
      )}
    </button>
  )

  return (
    <div>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">Leadership</h1>
      <p className="mt-3 text-stone">
        {vacant.length > 0 ? (
          <>
            <span className="serif-accent text-ink">{vacant.length} stewardship{vacant.length > 1 ? 's' : ''} open</span>{' '}
            — the House can see the gap.
          </>
        ) : (
          'Every stewardship is covered. Well done, House.'
        )}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabBtn('requests', 'Requests', requests.length)}
        {tabBtn('stewardships', 'Stewardships')}
        {tabBtn('people', 'People')}
        {tabBtn('absences', 'Absences')}
      </div>

      {/* REQUESTS */}
      {tab === 'requests' && (
        <div className="mt-8 space-y-4">
          {requests.length === 0 && (
            <p className="rounded-3xl border border-line bg-white p-8 text-stone">
              No pending requests. Peace in the House.
            </p>
          )}
          {requests.map((r) => (
            <div key={r.id} className="rounded-3xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg">
                    <span className="font-medium">{r.profile?.full_name || r.profile?.email}</span>{' '}
                    <span className="text-stone">
                      {r.type === 'join' ? 'requests to steward' : 'asks to step down from'}
                    </span>{' '}
                    <span className="font-medium">{r.stewardship?.title}</span>
                  </p>
                  {r.message && <p className="serif-accent mt-2 text-stone">“{r.message}”</p>}
                  <p className="mt-2 text-xs text-stone">
                    {new Date(r.created_at).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    · {r.profile?.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Btn onClick={() => decide(r, true)} disabled={busy}>
                    {r.type === 'join' ? 'Approve' : 'Confirm'}
                  </Btn>
                  <Btn variant="ghost" onClick={() => decide(r, false)} disabled={busy}>
                    Decline
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEWARDSHIPS */}
      {tab === 'stewardships' && (
        <div className="mt-8">
          <Btn onClick={() => openEditor('new')}>+ New stewardship</Btn>
          <div className="mt-6 space-y-3">
            {stewardships.map((s) => {
              const active = activeFor(s.id)
              const open = s.capacity - active.length
              return (
                <div
                  key={s.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 ${
                    s.status === 'archived' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MovementChip movement={s.movement} />
                    <p className="font-medium">{s.title}</p>
                    {s.status === 'archived' ? (
                      <span className="text-xs uppercase tracking-widest text-stone">Archived</span>
                    ) : open > 0 ? (
                      <span
                        className="text-xs font-medium uppercase tracking-widest"
                        style={{ color: MOVEMENTS[s.movement].color }}
                      >
                        {open} open
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-widest text-stone">Full</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-stone">
                      {active.map((a) => (a.profile as Profile)?.full_name?.split(' ')[0]).filter(Boolean).join(', ') || '—'}
                    </span>
                    <button onClick={() => openEditor(s)} className="text-ink underline underline-offset-4 cursor-pointer">
                      Edit
                    </button>
                    <button
                      onClick={() => setArchived(s, s.status !== 'archived')}
                      className="text-stone underline underline-offset-4 cursor-pointer"
                    >
                      {s.status === 'archived' ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PEOPLE */}
      {tab === 'people' && (
        <div className="mt-8 space-y-3">
          {people.map((p) => {
            const theirs = assignments.filter((a) => a.profile_id === p.id)
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-medium">
                    {p.full_name || p.email}
                    {p.role === 'admin' && (
                      <span className="ml-2 text-xs font-medium uppercase tracking-widest text-ray-purple">
                        Leader
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-stone">
                    {p.email}
                    {theirs.length > 0 &&
                      ` · stewarding ${theirs
                        .map((a) => stewardships.find((s) => s.id === a.stewardship_id)?.title)
                        .filter(Boolean)
                        .join(', ')}`}
                  </p>
                </div>
                <button
                  onClick={() => setRole(p, p.role === 'admin' ? 'member' : 'admin')}
                  className="text-sm text-stone underline underline-offset-4 hover:text-ink cursor-pointer"
                >
                  {p.role === 'admin' ? 'Make member' : 'Make leader'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ABSENCES */}
      {tab === 'absences' && (
        <div className="mt-8 space-y-3">
          {absences.length === 0 && (
            <p className="rounded-3xl border border-line bg-white p-8 text-stone">
              No absences reported.
            </p>
          )}
          {absences.map((a) => (
            <div key={a.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <p>
                <span className="font-medium">{(a.profile as unknown as { full_name: string })?.full_name}</span>{' '}
                <span className="text-stone">is {a.kind === 'sick' ? 'sick' : 'away'} —</span>{' '}
                <span className="font-medium">
                  {(a.stewardship as unknown as { title: string })?.title}
                </span>
              </p>
              {a.note && <p className="serif-accent mt-1 text-stone">“{a.note}”</p>}
              <p className="mt-1 text-xs text-stone">
                {new Date(a.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* EDITOR */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveStewardship}
            className="my-8 w-full max-w-lg space-y-4 rounded-3xl bg-paper p-7"
          >
            <h3 className="text-2xl font-light">
              {editing === 'new' ? 'New stewardship' : `Edit ${editing.title}`}
            </h3>
            <Field
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div>
              <SectionTitle>Movement</SectionTitle>
              <div className="mt-2 flex gap-2">
                {(Object.keys(MOVEMENTS) as Movement[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, movement: m })}
                    className={`rounded-full px-4 py-2 text-sm cursor-pointer ${
                      form.movement === m ? 'bg-ink text-white' : 'border border-line text-stone'
                    }`}
                  >
                    {MOVEMENTS[m].label}
                  </button>
                ))}
              </div>
            </div>
            <TextArea
              label="Purpose — why it matters spiritually"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Time commitment"
                value={form.time_commitment}
                onChange={(e) => setForm({ ...form, time_commitment: e.target.value })}
                placeholder="90 minutes"
                required
              />
              <Field
                label="Frequency"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                placeholder="Weekly — Sunday"
                required
              />
            </div>
            <TextArea
              label="Responsibilities (one per line)"
              value={form.responsibilities}
              onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
            />
            <TextArea
              label="Playbook"
              value={form.playbook}
              onChange={(e) => setForm({ ...form, playbook: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Field
                label="How many stewards?"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <Field
              label="Resources"
              value={form.resources}
              onChange={(e) => setForm({ ...form, resources: e.target.value })}
              placeholder="Checklist location, guides…"
            />
            <div className="flex gap-3 pt-2">
              <Btn type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </Btn>
              <Btn variant="ghost" type="button" onClick={() => setEditing(null)}>
                Cancel
              </Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
