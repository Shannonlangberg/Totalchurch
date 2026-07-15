import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MOVEMENTS } from '../lib/types'
import type { Movement, Stewardship } from '../lib/types'
import { Spinner } from '../components/ui'
import { TeamSlots } from '../components/TeamSlots'
import type { Slot } from '../components/TeamSlots'

interface FieldData {
  stewardships: Stewardship[]
  slots: Record<string, Slot[]>
}

export default function Browse() {
  const [data, setData] = useState<FieldData | null>(null)
  const [params, setParams] = useSearchParams()
  const filter = (params.get('m') as Movement | null) ?? 'all'

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: a }, { data: names }, { data: abs }] = await Promise.all([
        supabase.from('stewardships').select('*').eq('status', 'active').order('title'),
        supabase.from('assignments').select('stewardship_id, profile_id').eq('status', 'active'),
        supabase.from('steward_names').select('*'),
        supabase.from('current_absences').select('stewardship_id, profile_id'),
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
      setData({ stewardships: (s as Stewardship[]) ?? [], slots })
    }
    load()
  }, [])

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

  if (!data || !stats) return <Spinner />

  const visible = data.stewardships.filter((s) => filter === 'all' || s.movement === filter)
  const movements = (filter === 'all' ? (Object.keys(MOVEMENTS) as Movement[]) : [filter as Movement])

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

      <div className="mt-8 flex flex-wrap gap-2">
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
          <section key={mv} className="mt-12">
            <div className="flex items-baseline gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
              <h2 className="text-2xl font-light tracking-tight">{m.label}</h2>
              <p className="hidden text-sm text-stone sm:block">{m.tagline}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {group.map((s) => {
                const sl = data.slots[s.id] ?? []
                const open = Math.max(0, s.capacity - sl.length)
                const awayHere = sl.filter((x) => x.away).length
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
                      {awayHere > 0 && (
                        <span className="text-ray-orange">
                          {' '}
                          · {awayHere} away this week — could you cover their watch?
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
  )
}
