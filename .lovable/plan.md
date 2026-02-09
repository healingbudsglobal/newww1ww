

## Update All Email Senders to Verified Domain

### Problem
All 6 email edge functions currently use `onboarding@resend.dev` (Resend's sandbox address), which only delivers to the Resend account owner. This must be updated to `noreply@healingbuds.co.za` for production delivery.

### Files to Update

| File | Current Sender | New Sender |
|------|---------------|------------|
| `supabase/functions/send-onboarding-email/index.ts` | `Healing Buds <onboarding@resend.dev>` | `Healing Buds <noreply@healingbuds.co.za>` |
| `supabase/functions/send-contact-email/index.ts` | `Healing Buds <onboarding@resend.dev>` | `Healing Buds <noreply@healingbuds.co.za>` |
| `supabase/functions/send-order-confirmation/index.ts` | `${config.brandName} <onboarding@resend.dev>` | `${config.brandName} <noreply@healingbuds.co.za>` |
| `supabase/functions/send-client-email/index.ts` | `${domainConfig.brandName} <onboarding@resend.dev>` | `${domainConfig.brandName} <noreply@healingbuds.co.za>` |
| `supabase/functions/send-dispatch-email/index.ts` | `${config.brandName} <onboarding@resend.dev>` | `${config.brandName} <noreply@healingbuds.co.za>` |
| `supabase/functions/drgreen-webhook/index.ts` | `${config.brandName} <onboarding@resend.dev>` | `${config.brandName} <noreply@healingbuds.co.za>` |

### Prerequisite
The domain `healingbuds.co.za` must be verified in your Resend account at https://resend.com/domains. If it is not yet verified, emails will fail to send. Please confirm this domain is verified before approving.

### Changes
Each file gets a single-line replacement -- swapping `onboarding@resend.dev` to `noreply@healingbuds.co.za`. No other logic changes. All 6 functions will be redeployed automatically after the edits.

