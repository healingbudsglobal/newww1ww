

## Update Email Sender Domain to send.healingbuds.co.za

### Problem
The current sender `noreply@healingbuds.co.za` is failing because the verified Resend domain is `send.healingbuds.co.za` (a sending subdomain). All 6 email functions need updating.

### Changes

| File | Current | New |
|------|---------|-----|
| `supabase/functions/send-onboarding-email/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |
| `supabase/functions/send-contact-email/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |
| `supabase/functions/send-order-confirmation/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |
| `supabase/functions/send-client-email/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |
| `supabase/functions/send-dispatch-email/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |
| `supabase/functions/drgreen-webhook/index.ts` | `noreply@healingbuds.co.za` | `noreply@send.healingbuds.co.za` |

### Scope
Single-line replacement in each file. No logic changes. All 6 functions redeploy automatically. Will re-test after deployment to confirm emails deliver successfully.

