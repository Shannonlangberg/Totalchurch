import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Shell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm transition-colors ${
      isActive ? 'bg-ink text-white' : 'text-stone hover:text-ink'
    }`

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/app" className="flex items-center gap-2.5">
            <img src="/brand/Futures3.png" alt="Futures Church" className="h-6 w-auto" />
            <span className="hidden text-sm font-medium tracking-wide sm:block">Total Church</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={link}>
              Home
            </NavLink>
            <NavLink to="/app/browse" className={link}>
              Browse
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/app/admin" className={link}>
                Admin
              </NavLink>
            )}
            <button
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
              className="ml-1 hidden rounded-full px-4 py-2 text-sm text-stone transition-colors hover:text-ink sm:block cursor-pointer"
            >
              Sign out
            </button>
            <NavLink to="/app/profile" className={link}>
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'Profile'}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">{children}</main>
    </div>
  )
}
