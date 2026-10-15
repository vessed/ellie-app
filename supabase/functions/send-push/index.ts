// Supabase Edge Function: send one Web Push notification to a phone.
//
// Deploy once:
//   supabase functions deploy send-push
//   supabase secrets set \
//     VAPID_PUBLIC_KEY=BHq8FRzKlAKDyF_OPE1ROxsk3BCkx8fC2a-WybRbQZlQOSAOQEUJLmJwpNED9iv-44rwe6y5BOOq89dQajSmFro \
//     VAPID_PRIVATE_KEY=<the private key> \
//     VAPID_SUBJECT=mailto:you@example.com
//
// The private key is a secret and must never be committed to the repo.

import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''

/* The VAPID subject must be a mailto: or https: URL. Accept a bare email too. */
let subject = (Deno.env.get('VAPID_SUBJECT') ?? '').trim()
if (!/^(mailto:|https?:)/i.test(subject)) {
  subject = subject ? `mailto:${subject}` : 'mailto:ellie@example.com'
}

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405)
  if (!publicKey || !privateKey) {
    return json({ ok: false, error: 'VAPID keys not set' }, 500)
  }

  try {
    const { sub, title, body } = await req.json()
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return json({ ok: false, error: 'bad subscription' }, 400)
    }
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title: title ?? 'Ellie 💗',
        body: body ?? 'You have a new love note 💗',
      }),
    )
    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500)
  }
})
