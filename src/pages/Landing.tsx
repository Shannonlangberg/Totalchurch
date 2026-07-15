import { Link } from 'react-router-dom'
import { MOVEMENTS } from '../lib/types'
import type { Movement } from '../lib/types'

const passages = [
  {
    ref: '1 Chronicles 27',
    text: 'David entrusted every part of the kingdom to someone. Armies. Vineyards. Olive trees. Camels. Every responsibility mattered.',
  },
  {
    ref: 'Luke 16:10',
    text: 'Whoever is faithful with very little will also be faithful with much.',
  },
  {
    ref: '1 Corinthians 4:2',
    text: 'Now it is required that those who have been given a trust must prove faithful.',
  },
  {
    ref: 'Matthew 16:18',
    text: 'I will build My Church, and the gates of Hades will not overcome it.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-dvh bg-paper">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-40 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <img src="/brand/Futures2.png" alt="Futures Church" className="h-5 w-auto" />
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm text-ink transition-colors hover:bg-mist"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto flex max-w-6xl flex-col items-start px-5 pb-24 pt-36 md:pt-44">
        <img src="/brand/Futures1.png" alt="" className="mb-10 h-14 w-auto md:h-20" />
        <h1 className="max-w-4xl text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
          What has God <br />
          entrusted <span className="serif-accent">you</span> to steward?
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-stone md:text-xl">
          Nobody owns a ministry. Everything belongs to Jesus. At Futures, every one of us
          faithfully stewards a part of His House — and together, we build it.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/signup"
            className="rounded-full bg-ink px-8 py-4 text-[15px] font-medium text-white transition-transform hover:scale-[1.03]"
          >
            Find your stewardship
          </Link>
          <Link to="/login" className="px-2 py-4 text-[15px] text-stone hover:text-ink">
            I already have an account →
          </Link>
        </div>
      </section>

      {/* THE IDEA */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone">The idea</p>
          <h2 className="mt-6 max-w-3xl text-3xl font-light leading-snug md:text-5xl">
            We don't ask <span className="text-stone line-through decoration-1">which team are you on?</span>
            <br />
            We ask <span className="serif-accent">what are you stewarding?</span>
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <div>
              <p className="text-lg font-medium">Everything belongs to Jesus.</p>
              <p className="mt-2 leading-relaxed text-stone">
                People steward areas of His House for a season — then faithfully hand them on. The
                mission continues.
              </p>
            </div>
            <div>
              <p className="text-lg font-medium">Every stewardship matters.</p>
              <p className="mt-2 leading-relaxed text-stone">
                In David's kingdom, someone looked after armies and someone looked after donkeys.
                The smallest trust is as sacred as the largest.
              </p>
            </div>
            <div>
              <p className="text-lg font-medium">Everyone sees the whole.</p>
              <p className="mt-2 leading-relaxed text-stone">
                Like Total Football — everyone understands the whole mission. When a stewardship
                becomes vacant, the whole House can see the gap and fill it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THREE MOVEMENTS */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone">Three movements</p>
        <h2 className="mt-6 text-3xl font-light md:text-5xl">One House. Three movements.</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {(Object.keys(MOVEMENTS) as Movement[]).map((key) => {
            const m = MOVEMENTS[key]
            return (
              <div
                key={key}
                className="group relative overflow-hidden rounded-3xl border border-line bg-white p-8 transition-shadow hover:shadow-lg"
              >
                <img
                  src={m.ray}
                  alt=""
                  className="absolute -right-8 -top-8 h-32 w-auto opacity-15 transition-opacity group-hover:opacity-30"
                />
                <p className="text-2xl font-light tracking-tight">{m.label}</p>
                <p className="mt-3 leading-relaxed text-stone">{m.tagline}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* SCRIPTURE */}
      <section className="border-y border-line bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/50">
            Built on the Word
          </p>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {passages.map((p) => (
              <blockquote key={p.ref}>
                <p className="serif-accent text-xl leading-relaxed text-white/90 md:text-2xl">
                  “{p.text}”
                </p>
                <cite className="mt-4 block text-sm not-italic text-white/50">{p.ref}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone">How it works</p>
        <div className="mt-12 grid gap-10 md:grid-cols-4">
          {[
            ['01', 'Create your account', 'Scan the QR code on Sunday or sign up right here.'],
            ['02', 'Browse the House', 'See every stewardship across Create, Connect and Develop.'],
            ['03', 'Request a stewardship', 'Choose the area God is stirring in you.'],
            ['04', 'Steward it faithfully', 'A leader confirms you — then it’s on your watch.'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <p className="serif-accent text-3xl text-stone">{n}</p>
              <p className="mt-3 text-lg font-medium">{t}</p>
              <p className="mt-2 leading-relaxed text-stone">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <Link
            to="/signup"
            className="inline-block rounded-full bg-ink px-8 py-4 text-[15px] font-medium text-white transition-transform hover:scale-[1.03]"
          >
            Start stewarding
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
          <img src="/brand/Futures2.png" alt="Futures Church" className="h-4 w-auto" />
          <p className="text-sm text-stone">
            “I will build My Church.” — <span className="serif-accent">Matthew 16:18</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
