// src/lib/heartbeat.ts
// Bridge to Futures Heartbeat (futures-OS Supabase project). Every signup and
// serving movement lands on the person's ONE Heartbeat record: signup and
// role_interest raise pastoral visibility; role_confirmed writes the serving
// milestone and moves their journey + heartbeat scores.
//
// Fail-soft: if the secret env isn't set or Heartbeat is down, Total Church
// keeps working and we just log. Matching happens Heartbeat-side by
// email → phone, never duplicating people.

const WEBHOOK_URL =
  'https://dzgiirkdmrtzbchrlebe.supabase.co/functions/v1/tc-webhook'

export interface HeartbeatPerson {
  first_name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

export async function sendToHeartbeat(
  event: 'signup' | 'role_interest' | 'role_confirmed',
  person: HeartbeatPerson,
  role?: { area?: string; title?: string },
): Promise<void> {
  const secret = import.meta.env.VITE_TC_WEBHOOK_SECRET as string | undefined
  if (!secret) return
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tc-secret': secret },
      body: JSON.stringify({ event, person, role }),
    })
  } catch (err) {
    console.error('[heartbeat] webhook failed', event, err)
  }
}

/** Split a full name into Heartbeat's first/last shape. */
export function splitName(fullName: string | null | undefined, fallbackEmail?: string | null): HeartbeatPerson {
  const name = (fullName ?? '').trim()
  const [first, ...rest] = name.split(/\s+/)
  return {
    first_name: first || fallbackEmail?.split('@')[0] || 'Unknown',
    last_name: rest.join(' ') || null,
    email: fallbackEmail ?? null,
  }
}
