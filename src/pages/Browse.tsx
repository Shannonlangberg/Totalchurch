import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { notify } from '../lib/notify'
import { MOVEMENTS } from '../lib/types'
import type { Movement, Stewardship } from '../lib/types'
import { SectionTitle, Spinner } from '../components/ui'
import { TeamSlots } from '../components/TeamSlots'
import type { Slot } from '../components/TeamSlots'

interface CoverInfo {
  profileId: string
  name: string
}

interface FieldData {
  stewardships: Stewardship[]
  slots: Record<string, Slot[]>
  covers: Record<string, CoverInfo[]>
}

export default function Browse() {
  const { session, profile } = useAuth()
  const [data, setData] = useState<FieldData | null>(null)
  const [coverTarget, setCoverTarget] = useState<Stewardship | null>(null)
  const [busy, setBusy] = useState(false)
  const [params, setParams] = useSearchParams()
  const filter = (params.get('m') as Movement | null) ?? 'all'

  const load = useCallback(async () => {
    const [{ data: s }, { data: a }, { data: names }, { data: abs }, { data: cov }] =
      await Promise.all([
        supabase.from('stewardships').select('*').eq('status', 'active').order('title'),
        supabase.from('assignments').select('stewardship_id, profile_id').eq('status', 'active'),
        supabase.from('steward_names').select('*'),
        supabase.from('current_absences').select('stewardship_id, profile_id'),
        supabase.from('current_covers').select('stewardship_id, profile_id'),
      ])
    const nameById: Record<string, string> = {}
    for (const n of names ?? []) nameById[n.id] = n.full_name || 'Steward'
    const awaySet = new Set((abs ?? []).map((x) => `${x.stewardship_id}:${x.profile_id}`))
    const slots: Record<string, Slot[]> = {}
    for (const row of a ?? []) {
      ;(slots[row.stewardship_id] ??= []).push({
        profileId: row.profile_id,
        name: nameById[row.profile_id] ?? 'Steward',
        away: awaySet.has(`${row.stewardship_id}:${row.profile_id}`),
      })
    }
    const covers: Record<string, CoverInfo[]> = {}
    for (const row of cov ?? []) {
      ;(covers[row.stewardship_id] ??= []).push({
        profileId: row.profile_id,
        name: nameById[row.profile_id] ?? 'Someone',
      })
    }
    setData({ stewardships: (s as Stewardship[]) ?? [], slots, covers })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    if (!data) return null
    let filled = 0
    let total = 0
    let away = 0
    for (const s of data.stewardships) {
      const sl = data.slots[s.id] ?? []
      filled += sl.length
      total += s.capacity
      away += sl.filter((x) => x.away).length
    }
    return { filled, total, open: Math.max(0, total - filled), away }
  }, [data])

  // Stewardships that need a hand this week: someone away, or pinned by a leader
  const coverNeeds = useMemo(() => {
    if (!data) return []
    return data.stewardships
      .map((s) => {
        const sl = data.slots[s.id] ?? []
        const away = sl.filter((x) => x.away)
        const covers = data.covers[s.id] ?? []
        const reason = away.length > 0 ? ('away' as const) : s.needs_cover ? ('pinned' as const) : null
        return reason ? { s, away, covers, reason } : null
      })
      .filter(Boolean) as { s: Stewardship; away: Slot[]; covers: CoverInfo[]; reason: 'away' | 'pinned' }[]
  }, [data])

  if (!data || !stats) return <Spinner />

  const visible = data.stewardships.filter((s) => filter === 'all' || s.movement === filter)
  const movements = filter === 'all' ? (Object.keys(MOVEMENTS) as Movement[]) : [filter as Movement]
  const myId = session?.user.id

  async function coverIt() {
    if (!coverTarget || !session) return
    setBusy(true)
    const { error } = await supabase.from('covers').insert({
      stewardship_id: coverTarget.id,
      profile_id: session.user.id,
    })
    if (!error) {
      notify('cover_offered', {
        stewardship: coverTarget.title,
        person: profile?.full_name ?? session.user.email,
      })
    }
    setBusy(false)
    setCoverTarget(null)
    load()
  }

  return (
    <div>
      <p className="serif-accent text-lg text-stone">Everything belongs to Jesus.</p>
      <h1 className="mt-1 text-4xl font-light tracking-tight md:text-5xl">The House</h1>

      {/* THE HOUSE AT A GLANCE */}
      <div className="mt-8 grid grid-cols-3 gap-4 rounded-3xl border border-line bg-white p-6 md:p-8">
        <div>
          <p className="text-3xl font-light md:text-5xl">
            {stats.filled}
            <span className="text-stone/50">/{stats.total}</span>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-stone">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            Being stewarded
          </p>
        </div>
        <div>
          <p className="text-3xl font-light md:text-5xl">{stats.open}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-stone">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-ray-blue)' }} />
            Waiting for a steward
          </p>
        </div>
        <div>
          <p className="text-3xl font-light md:text-5xl">{stats.away}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-stone">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-ray-orange)' }} />
            Needing cover this week
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* MAIN LIST */}
        <div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'create', 'connect', 'develop'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setParams(m === 'all' ? {} : { m })}
                className={`rounded-full px-5 py-2.5 text-sm transition-colors cursor-pointer ${
                  filter === m
                    ? 'bg-ink text-white'
                    : 'border border-line text-stone hover:border-ink hover:text-ink'
                }`}
              >
                {m === 'all' ? 'The whole House' : MOVEMENTS[m].label}
              </button>
            ))}
          </div>

          {movements.map((mv) => {
            const group = visible.filter((s) => s.movement === mv)
            if (group.length === 0) return null
            const m = MOVEMENTS[mv]
            return (
              <section key={mv} className="mt-10">
                <div className="flex items-baseline gap-3">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  <h2 className="text-2xl font-light tracking-tight">{m.label}</h2>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {group.map((s) => {
                    const sl = data.slots[s.id] ?? []
                    const open = Math.max(0, s.capacity - sl.length)
                    const awayHere = sl.filter((x) => x.away).length
                    const coveredBy = data.covers[s.id] ?? []
                    return (
                      <Link
                        key={s.id}
                        to={`/app/stewardship/${s.id}`}
                        className="group rounded-3xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xl font-medium tracking-tight">{s.title}</p>
                          {open > 0 ? (
                            <span
                              className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white"
                              style={{ background: m.color }}
                            >
                              {open} open
                            </span>
                          ) : (
                            <span className="whitespace-nowrap rounded-full bg-mist px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">
                              Fully stewarded
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-stone">
                          {s.time_commitment} · {s.frequency}
                        </p>
                        <div className="mt-4">
                          <TeamSlots slots={sl} capacity={s.capacity} />
                        </div>
                        <p className="mt-3 text-sm text-stone">
                          {sl.length > 0
                            ? sl.map((x) => x.name.split(' ')[0]).join(', ')
                            : 'No steward yet — this could be yours.'}
                          {awayHere > 0 && coveredBy.length === 0 && (
                            <span className="text-ray-orange">
                              {' '}
                              · {awayHere} away this week — could you cover their watch?
                            </span>
                          )}
                          {coveredBy.length > 0 && (
                            <span className="text-ink">
                              {' '}
                              · covered this week by {coveredBy.map((c) => c.name.split(' ')[0]).join(', ')}
                            </span>
                          )}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* COVER RAIL */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SectionTitle>Cover a watch</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            When a steward is away, the House covers the gap — for a week, not forever.
          </p>
          <div className="mt-4 space-y-3">
            {coverNeeds.length === 0 && (
              <div className="rounded-2xl border border-line bg-white p-5 text-sm text-stone">
                Every watch is covered right now. Beautiful.
              </div>
            )}
            {coverNeeds.map(({ s, away, covers, reason }) => {
              const iCover = covers.some((c) => c.profileId === myId)
              const covered = covers.length > 0
              return (
                <div key={s.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: MOVEMENTS[s.movement].color }}
                    />
                    <p className="font-medium">{s.title}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-stone">
                    {reason === 'away'
                      ? `${away.map((x) => x.name.split(' ')[0]).join(' & ')} ${away.length > 1 ? 'are' : 'is'} away this week.`
                      : 'A leader has asked the House for a hand here.'}
                  </p>
                  {iCover ? (
                    <p className="mt-3 text-sm font-medium text-ink">
                      You've got this week. Thank you. ✓
                    </p>
                  ) : covered ? (
                    <p className="mt-3 text-sm text-stone">
                      Covered by {covers.map((c) => c.name.split(' ')[0]).join(', ')} this week.
                    </p>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setCoverTarget(s)
                      }}
                      className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] cursor-pointer"
                    >
                      I can cover this
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      {/* COVER OVERVIEW MODAL */}
      {coverTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-paper p-7">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone">
              Covering · one week
            </p>
            <h3 className="mt-2 text-3xl font-light tracking-tight">{coverTarget.title}</h3>
            <p className="serif-accent mt-3 leading-relaxed">{coverTarget.purpose}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Time</p>
                <p className="mt-0.5 font-medium">{coverTarget.time_commitment}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">When</p>
                <p className="mt-0.5 font-medium">{coverTarget.frequency}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Where</p>
                <p className="mt-0.5 font-medium">{coverTarget.location || '—'}</p>
              </div>
            </div>

            {coverTarget.playbook && (
              <div className="mt-4 rounded-2xl bg-mist p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">
                  What to know for the week
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {coverTarget.playbook}
                </p>
              </div>
            )}

            <p className="mt-4 text-sm text-stone">
              You're covering, not committing — one week on their watch, then it hands straight
              back. A leader will be told you've got it.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={coverIt}
                disabled={busy}
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
              >
                {busy ? 'One moment…' : "I've got this week"}
              </button>
              <button
                onClick={() => setCoverTarget(null)}
                className="rounded-full border border-line px-6 py-3 text-sm text-stone cursor-pointer"
              >
                Not this time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
