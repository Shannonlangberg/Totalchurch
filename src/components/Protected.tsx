import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile && !profile.onboarded && location.pathname !== '/onboarding')
    return <Navigate to="/onboarding" replace />
  if (admin && profile?.role !== 'admin') return <Navigate to="/app" replace />
  return <>{children}</>
}
