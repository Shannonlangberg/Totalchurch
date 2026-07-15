import { supabase } from './supabase'

export type NotifyKind =
  | 'join_requested'
  | 'request_approved'
  | 'request_declined'
  | 'stepped_down'
  | 'absence_reported'

/**
 * Fire-and-forget notification. The `notify` edge function looks up
 * admin emails / the member's email and sends via Resend.
 * Never blocks or breaks the UI if email sending is unavailable.
 */
export async function notify(kind: NotifyKind, payload: Record<string, unknown>) {
  try {
    await supabase.functions.invoke('notify', { body: { kind, payload } })
  } catch {
    // email is best-effort in V1
  }
}
