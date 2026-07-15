import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MOVEMENTS } from '../lib/types'
import type { Movement, Stewardship } from '../lib/types'
import { MovementChip, Spinner } from '../components/ui'

type Counts = Record<string, number>

export default function Browse() {
  const [stewardships, setStewardships] = useState<Stewardship[] | null>(null)
  const [counts, setCounts] = useState<Counts>({})
  const [params, setParams] = useSearchParams()
  const filter = (params.get('m') as Movement | null) ?? 'all'

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from('stewardships').select('*').eq('status', 'active').order('title'),
        supabase.from('assignments').select('stewardship_id').eq('status', 'active'),
      ])
      setStewardships((s as Stewardship[]) ?? [])
      const c: Counts = {}
      for (const row of a ?? []) c[row.stewardship_id] = (c[row.stewardship_id] ?? 0) + 1
      setCounts(c)
    }
    load()
  }, [])

  const filtered = useMemo(
    () =>
      (stewardships ?? []).filter((s) => filter === 'all' || s.movement === filter),
    [stewardships, filter],
  )

  if (!stewardships) return <Spinner />

  const vacantCount = stewardships.filter((s) => (counts[s.id] ?? 0) < s.capacity).length

  return (
    <div>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">The House</h1>
      <p className="mt-3 max-w-lg text-stone">
        Every stewardship in one place.{' '}
        {vacantCount > 0 && (
          <>
            <span className="serif-accent text-ink">{vacantCount} open</span> and waiting for a
            faithful steward.
          </>
        )}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(['all', 'create', 'connect', 'develop'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setParams(m === 'all' ? {} : { m })}
            className={`rounded-full px-5 py-2.5 text-sm transition-colors cursor-pointer ${
              filter === m ? 'bg-ink text-white' : 'border border-line text-stone hover:border-ink hover:text-ink'
            }`}
          >
            {m === 'all' ? 'Everything' : MOVEMENTS[m].label}
          </button>
        ))}
      </div>

      {filter !== 'all' && (
        <p className="serif-accent mt-6 text-lg text-stone">{MOVEMENTS[filter as Movement].tagline}</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const filled = counts[s.id] ?? 0
          const open = s.capacity - filled
          return (
            <Link
              key={s.id}
              to={`/app/stewardship/${s.id}`}
              className="group flex flex-col rounded-3xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <MovementChip movement={s.movement} />
                {open > 0 ? (
                  <span className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: MOVEMENTS[s.movement].color }}>
                    {open} open
                  </span>
                ) : (
                  <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone">
                    Stewarded
                  </span>
                )}
              </div>
              <p className="mt-4 text-xl font-medium tracking-tight">{s.title}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">{s.purpose}</p>
              <p className="mt-4 text-xs text-stone">
                {s.time_commitment} · {s.frequency}
              </p>
            </Link>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-12 text-stone">Nothing here yet.</p>
      )}
    </div>
  )
}
