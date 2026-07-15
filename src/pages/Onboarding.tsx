import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Btn } from '../components/ui'

const steps = [
  {
    kicker: 'Stewardship',
    title: 'Nothing here is ours.',
    body: 'Everything belongs to Jesus. We don’t own ministries — we steward areas of His House for a season, and then we faithfully hand them on. In David’s kingdom, someone was entrusted with armies and someone with olive trees. Both were stewards. Both mattered.',
    verse: '“Now it is required that those who have been given a trust must prove faithful.” — 1 Corinthians 4:2',
    ray: '/brand/raysPurple.png',
  },
  {
    kicker: 'Faithfulness',
    title: 'Small is sacred.',
    body: 'Faithfulness with little always comes before faithfulness with much. The way you steward a coffee machine, a garden bed or a row of chairs is the way you’ll steward everything else God gives you. Show up. Keep your word. Be found faithful.',
    verse: '“Whoever can be trusted with very little can also be trusted with much.” — Luke 16:10',
    ray: '/brand/raysBlue.png',
  },
  {
    kicker: 'Excellence',
    title: 'Leave it better.',
    body: 'Builders notice. Builders care. A steward walks their area and sees what others walk past — the flickering light, the tired welcome, the small thing that could be beautiful. Excellence isn’t perfectionism. It’s love expressed through detail.',
    verse: 'Notice. Care. Improve. Leave things better than you found them.',
    ray: '/brand/raysOrange.png',
  },
  {
    kicker: 'Communication',
    title: 'Never go quiet.',
    body: 'The House can cover any gap it can see. If you’re sick, away, or it’s becoming too much — say so early. That’s not failure, that’s stewardship. Handing something back faithfully is as honourable as picking it up.',
    verse: 'A gap we can see is a gap we can fill — together.',
    ray: '/brand/raysPink.png',
  },
  {
    kicker: 'Building God’s House',
    title: 'He builds. We steward.',
    body: 'Jesus said “I will build My Church.” The pressure is off — the outcome is His. Our part is to be found faithful with what He’s entrusted to us, and to help others do the same. Welcome to Total Church. Everyone sees the whole. Everyone builds.',
    verse: '“I will build My Church.” — Matthew 16:18',
    ray: '/brand/raysPurple.png',
  },
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const [busy, setBusy] = useState(false)
  const { session, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const step = steps[i]
  const last = i === steps.length - 1

  async function finish() {
    if (!session) return
    setBusy(true)
    await supabase.from('profiles').update({ onboarded: true }).eq('id', session.user.id)
    await refreshProfile()
    navigate('/app/browse')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between px-5 py-5">
        <img src="/brand/Futures2.png" alt="Futures Church" className="h-5 w-auto" />
        <div className="flex gap-1.5">
          {steps.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === i ? 'w-6 bg-ink' : n < i ? 'w-1.5 bg-ink' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-xl">
          <img src={step.ray} alt="" className="h-12 w-auto" />
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-stone">
            {step.kicker}
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">{step.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-stone">{step.body}</p>
          <p className="serif-accent mt-8 border-l-2 border-line pl-5 text-lg leading-relaxed">
            {step.verse}
          </p>
          <div className="mt-12 flex items-center gap-4">
            {i > 0 && (
              <Btn variant="ghost" onClick={() => setI(i - 1)}>
                Back
              </Btn>
            )}
            {last ? (
              <Btn onClick={finish} disabled={busy}>
                {busy ? 'One moment…' : 'Enter the House →'}
              </Btn>
            ) : (
              <Btn onClick={() => setI(i + 1)}>Continue</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
