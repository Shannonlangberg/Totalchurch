export interface Slot {
  profileId: string
  name: string
  away: boolean
}

export function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  )
}

export function TeamSlots({
  slots,
  capacity,
  size = 'md',
}: {
  slots: Slot[]
  capacity: number
  size?: 'md' | 'lg'
}) {
  const open = Math.max(0, capacity - slots.length)
  const dim = size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-[11px]'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {slots.map((s) => (
        <div key={s.profileId} className="relative" title={s.away ? `${s.name} — away this week` : s.name}>
          <div
            className={`flex ${dim} items-center justify-center rounded-full font-medium text-white ${
              s.away ? 'bg-stone' : 'bg-ink'
            }`}
          >
            {initials(s.name)}
          </div>
          {s.away && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-ray-orange" />
          )}
        </div>
      ))}
      {Array.from({ length: Math.min(open, 12) }).map((_, i) => (
        <div
          key={`open-${i}`}
          title="Open — this could be you"
          className={`flex ${dim} items-center justify-center rounded-full border-2 border-dashed border-line text-stone`}
        >
          +
        </div>
      ))}
    </div>
  )
}
