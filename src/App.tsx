import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Protected } from './components/Protected'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Browse from './pages/Browse'
import StewardshipDetail from './pages/StewardshipDetail'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/Profile'
import Admin from './pages/admin/Admin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route
            path="/onboarding"
            element={
              <Protected>
                <Onboarding />
              </Protected>
            }
          />
          <Route
            path="/app"
            element={
              <Protected>
                <Shell>
                  <Dashboard />
                </Shell>
              </Protected>
            }
          />
          <Route
            path="/app/browse"
            element={
              <Protected>
                <Shell>
                  <Browse />
                </Shell>
              </Protected>
            }
          />
          <Route
            path="/app/stewardship/:id"
            element={
              <Protected>
                <Shell>
                  <StewardshipDetail />
                </Shell>
              </Protected>
            }
          />
          <Route
            path="/app/profile"
            element={
              <Protected>
                <Shell>
                  <ProfilePage />
                </Shell>
              </Protected>
            }
          />
          <Route
            path="/app/admin"
            element={
              <Protected admin>
                <Shell>
                  <Admin />
                </Shell>
              </Protected>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
