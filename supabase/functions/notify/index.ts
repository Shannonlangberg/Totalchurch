// TOTAL CHURCH · notify edge function
// Sends stewardship emails via Resend. Best-effort: if RESEND_API_KEY is not
// set, notifications are logged to the notifications table but not sent.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FROM = Deno.env.get('NOTIFY_FROM') ?? 'Total Church <onboarding@resend.dev>'

type Payload = {
  kind:
    | 'join_requested'
    | 'request_approved'
    | 'request_declined'
    | 'stepped_down'
    | 'absence_reported'
    | 'cover_offered'
  payload: Record<string, string | undefined>
}

function template(kind: Payload['kind'], p: Record<string, string | undefined>) {
  switch (kind) {
    case 'join_requested':
      return {
        subject: `${p.person} has requested to steward ${p.stewardship}`,
        html: `<p><strong>${p.person}</strong> has requested to steward <strong>${p.stewardship}</strong>.</p>${
          p.message ? `<p>“${p.message}”</p>` : ''
        }<p>Open the Leadership area of Total Church to approve or decline.</p>`,
        toAdmins: true,
      }
    case 'request_approved':
      return {
        subject: `${p.stewardship} is now on your watch`,
        html: `<p>Hey ${p.person?.split(' ')[0] ?? ''},</p><p><strong>${p.stewardship}</strong> has been entrusted to you. It's now on your watch.</p><p>“Whoever is faithful with very little will also be faithful with much.” — Luke 16:10</p><p>Open Total Church to see your playbook.</p>`,
        toAdmins: false,
      }
    case 'request_declined':
      return {
        subject: `About your request for ${p.stewardship}`,
        html: `<p>Hey ${p.person?.split(' ')[0] ?? ''},</p><p>A leader would love to chat about your request for <strong>${p.stewardship}</strong> — keep an eye out, they'll be in touch soon.</p>`,
        toAdmins: false,
      }
    case 'stepped_down':
      return {
        subject: `${p.person} is stepping down from ${p.stewardship}`,
        html: `<p><strong>${p.person}</strong> has asked to step down from <strong>${p.stewardship}</strong>.</p>${
          p.note ? `<p>“${p.note}”</p>` : ''
        }<p>The stewardship is now visible as a gap the House can fill.</p>`,
        toAdmins: true,
      }
    case 'cover_offered':
      return {
        subject: `${p.person} is covering ${p.stewardship} this week`,
        html: `<p><strong>${p.person}</strong> has stepped in to cover <strong>${p.stewardship}</strong> for the week. The watch is covered.</p>`,
        toAdmins: true,
      }
    case 'absence_reported':
      return {
        subject: `${p.person} can't make it — ${p.stewardship}`,
        html: `<p><strong>${p.person}</strong> has flagged they can't make it for <strong>${p.stewardship}</strong>.</p>${
          p.note ? `<p>“${p.note}”</p>` : ''
        }<p>Cover the gap if you can.</p>`,
        toAdmins: true,
      }
  }
}

Deno.serve(async (req) => {
  try {
    const body = (await req.json()) as Payload
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const t = template(body.kind, body.payload)
    let to: string[] = []
    if (t.toAdmins) {
      const { data } = await supabase.from('profiles').select('email').eq('role', 'admin')
      to = (data ?? []).map((r: { email: string }) => r.email).filter(Boolean)
    } else if (body.payload.email) {
      to = [body.payload.email]
    }

    const key = Deno.env.get('RESEND_API_KEY')
    let sent = false
    if (key && to.length > 0) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to, subject: t.subject, html: t.html }),
      })
      sent = res.ok
    }

    await supabase.from('notifications').insert({
      kind: body.kind,
      payload: body.payload,
      email_to: to,
      sent,
    })

    return new Response(JSON.stringify({ ok: true, sent, to: to.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 400 })
  }
})
