export type Movement = 'create' | 'connect' | 'develop'

export type Role = 'member' | 'admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  onboarded: boolean
  created_at: string
}

export interface Stewardship {
  id: string
  title: string
  movement: Movement
  purpose: string
  time_commitment: string
  frequency: string
  responsibilities: string[]
  playbook: string
  location: string
  resources: string
  capacity: number
  status: 'active' | 'archived'
  needs_cover: boolean
  created_at: string
}

export interface Assignment {
  id: string
  stewardship_id: string
  profile_id: string
  status: 'active' | 'stepped_down'
  started_at: string
  ended_at: string | null
  stewardship?: Stewardship
  profile?: Profile
}

export interface Request {
  id: string
  stewardship_id: string
  profile_id: string
  type: 'join' | 'step_down'
  message: string | null
  status: 'pending' | 'approved' | 'declined'
  created_at: string
  decided_at: string | null
  stewardship?: Stewardship
  profile?: Profile
}

export interface Absence {
  id: string
  profile_id: string
  stewardship_id: string
  kind: 'sick' | 'away' | 'other'
  note: string | null
  date_from: string
  date_to: string | null
  created_at: string
  stewardship?: Stewardship
  profile?: Profile
}

export const MOVEMENTS: Record<
  Movement,
  { label: string; tagline: string; color: string; ray: string }
> = {
  create: {
    label: 'Create',
    tagline: 'Creating environments where people encounter Jesus.',
    color: 'var(--color-ray-orange)',
    ray: '/brand/raysOrange.png',
  },
  connect: {
    label: 'Connect',
    tagline: 'Helping people feel welcomed, known and valued.',
    color: 'var(--color-ray-blue)',
    ray: '/brand/raysBlue.png',
  },
  develop: {
    label: 'Develop',
    tagline: 'Helping people become disciples.',
    color: 'var(--color-ray-pink)',
    ray: '/brand/raysPink.png',
  },
}
