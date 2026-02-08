# API Gap Analysis — Healing Buds vs 37-Endpoint Specification

> **Created:** 2026-02-08
> **Purpose:** Map the full 37-endpoint API specification against the existing Healing Buds codebase. Separates admin-only (wallet/NFT) features from patient-facing features. Use this as a planning roadmap for future development.
> **Status labels:** `COVERED` · `PARTIAL` · `NEW` · `N/A` (not applicable to this user type)

---

## 1. Architecture Summary

Healing Buds uses a **two-track authentication model**:

| Track | User Type | Auth Method | Implementation |
|-------|-----------|-------------|----------------|
| **Patient** | Clients / Patients | Email + password via Supabase Auth | `src/pages/Auth.tsx`, Supabase built-in |
| **Admin** | NFT holders / Operators | Wallet + SIWE + on-chain NFT check | `supabase/functions/wallet-auth/index.ts` |

**Key rule:** Wallet/NFT features are **admin-only**. Patients never interact with wallets, NFTs, or blockchain. Patient checkout and eligibility are gated by KYC + admin approval via the Dr. Green DApp API, proxied through `supabase/functions/drgreen-proxy/index.ts`.

---

## 2. Coverage Matrix

| # | Endpoint | Method | User Type | Status | Implementation |
|---|----------|--------|-----------|--------|----------------|
| 1 | `/auth/login` | POST | Patient | COVERED | Supabase Auth `signInWithPassword` |
| 2 | `/auth/logout` | POST | Patient | COVERED | Supabase Auth `signOut` |
| 3 | `/auth/refresh` | POST | Patient | COVERED | Supabase Auth auto-refresh |
| 4 | `/auth/password/reset` | POST | Patient | COVERED | Supabase Auth `resetPasswordForEmail` |
| 5 | `/auth/password/update` | PUT | Patient | COVERED | Supabase Auth `updateUser` |
| 6 | `/auth/email/verify` | POST | Patient | COVERED | Supabase Auth email confirmation flow |
| 7 | `/auth/email/resend` | POST | Patient | COVERED | Supabase Auth `resend` |
| 8 | `/auth/signup` | POST | Patient | COVERED | Supabase Auth `signUp` |
| 9 | `/auth/wallet/nonce` | GET | Admin | COVERED | SIWE message generation in `useWalletAuth.ts` |
| 10 | `/auth/wallet/verify` | POST | Admin | COVERED | `supabase/functions/wallet-auth/index.ts` |
| 11 | `/auth/wallet/link` | POST | Admin | PARTIAL | `wallet_email_mappings` table exists; no multi-wallet per user |
| 12 | `/auth/wallet/unlink` | DELETE | Admin | NEW | No unlinking endpoint |
| 13 | `/auth/wallet/list` | GET | Admin | PARTIAL | Admin UI at `/admin/wallet-mappings`; no dedicated API |
| 14 | `/clients` | POST | Patient | COVERED | `drgreen-proxy` → Dr. Green `POST /api/v1/client` |
| 15 | `/clients/me` | GET | Patient | COVERED | `drgreen-proxy` → Dr. Green `GET /api/v1/client/:id` |
| 16 | `/clients/me` | PATCH | Patient | COVERED | `drgreen-proxy` → Dr. Green `PATCH /api/v1/client/:id` |
| 17 | `/clients/me` | DELETE | Patient | COVERED | `drgreen-proxy` → Dr. Green `DELETE /api/v1/client/:id` |
| 18 | `/clients/me/kyc` | POST | Patient | COVERED | `drgreen-proxy` KYC submission |
| 19 | `/clients/me/kyc/status` | GET | Patient | COVERED | `drgreen-proxy` KYC polling + `drgreen_clients` table |
| 20 | `/clients/me/profile` | GET | Patient | PARTIAL | `profiles` table exists; no public/private distinction |
| 21 | `/clients/me/profile` | PUT | Patient | PARTIAL | `profiles` table updatable; no dedicated endpoint |
| 22 | `/clients/me/profile/public` | GET | Patient | NEW | No public profile display |
| 23 | `/clients/me/preferences` | GET | Patient | PARTIAL | `profiles.preferences` JSON column exists; no API |
| 24 | `/clients/me/preferences` | PUT | Patient | PARTIAL | Same as above |
| 25 | `/clients/me/activity` | GET | Patient | NEW | No activity/audit log |
| 26 | `/clients/me/sessions` | GET | Patient | NEW | No session management |
| 27 | `/clients/me/sessions/:id` | DELETE | Patient | NEW | No session revocation |
| 28 | `/clients/me/notifications/preferences` | GET | Patient | NEW | No notification preferences API |
| 29 | `/clients/me/notifications/preferences` | PUT | Patient | NEW | No notification preferences API |
| 30 | `/clients/me/billing` | GET | Patient | NEW | No billing/payment methods |
| 31 | `/clients/me/data/export` | POST | Patient | NEW | No GDPR data export |
| 32 | `/clients/me/data/export/:id` | GET | Patient | NEW | No GDPR export download |
| 33 | `/admin/clients` | GET | Admin | COVERED | `drgreen-proxy` admin list clients |
| 34 | `/admin/clients/:id` | GET | Admin | COVERED | `drgreen-proxy` admin get client |
| 35 | `/admin/clients/:id/ban` | POST | Admin | COVERED | `drgreen-proxy` admin ban |
| 36 | `/webhooks/kyc` | POST | System | NEW | No incoming webhook handler for KYC events |
| 37 | `/webhooks/payment` | POST | System | NEW | No incoming webhook handler for payment events |

---

## 3. Admin-Only Endpoints (Wallet/NFT)

These endpoints apply **only** to NFT holders with admin access. Patients must never interact with these.

### Already Implemented

| Endpoint | Notes |
|----------|-------|
| Wallet nonce (#9) | SIWE-style message generated client-side in `src/hooks/useWalletAuth.ts` |
| Wallet verify (#10) | `supabase/functions/wallet-auth/index.ts` — full EIP-191 recovery + on-chain `balanceOf` NFT check against contract `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` |
| Admin list clients (#33) | `drgreen-proxy` with `production-write` environment routing for elevated permissions |
| Admin get client (#34) | `drgreen-proxy` |
| Admin ban (#35) | `drgreen-proxy` |

### Partially Implemented

| Endpoint | Current State | Gap |
|----------|---------------|-----|
| Wallet link (#11) | `wallet_email_mappings` table + admin UI at `/admin/wallet-mappings` | No formal API endpoint; only DB + admin UI. No multi-wallet support (one wallet → one email) |
| Wallet list (#13) | Admin can view mappings in UI | No dedicated REST endpoint |

### New (Not Built)

| Endpoint | Priority | Notes |
|----------|----------|-------|
| Wallet unlink (#12) | Low | Only needed if multi-wallet support is added. Admin-only. |

---

## 4. Patient-Facing Endpoints

These endpoints serve patients/clients using email + password auth via Supabase.

### Fully Covered

| Endpoint | Implementation |
|----------|----------------|
| Auth login/logout/refresh (#1-3) | Supabase Auth built-in |
| Password reset/update (#4-5) | Supabase Auth `resetPasswordForEmail` / `updateUser` |
| Email verify/resend (#6-7) | Supabase Auth email confirmation |
| Signup (#8) | Supabase Auth `signUp` in `src/pages/Auth.tsx` |
| Client CRUD (#14-17) | `drgreen-proxy` → Dr. Green API |
| KYC submit/status (#18-19) | `drgreen-proxy` + `drgreen_clients` table + `kyc_journey_logs` |

### Partially Covered

| Endpoint | Current State | Gap |
|----------|---------------|-----|
| Profile read/update (#20-21) | `profiles` table with `full_name`, `avatar_url`, `preferences` | No public/private distinction; no dedicated REST API (direct Supabase client calls) |
| Preferences (#23-24) | `profiles.preferences` JSON column exists | No structured API; no validation schema; no UI for managing preferences |

### New (Not Built)

| Endpoint | Priority | Rationale |
|----------|----------|-----------|
| **GDPR data export** (#31-32) | 🔴 HIGH | Regulatory compliance. Must compile profile, medical records, orders into downloadable package |
| **Activity/audit logs** (#25) | 🔴 HIGH | Healthcare audit trail. Required for regulated medical platform |
| **Notification preferences** (#28-29) | 🟡 MEDIUM | Patient communication control. Can extend `profiles.preferences` JSON |
| **Session management** (#26-27) | 🟡 MEDIUM | Security feature. Supabase handles sessions but no user-facing list/revoke |
| **Billing/payment methods** (#30) | 🟢 LOW | Payments handled externally. Only needed if self-service billing is added |
| **Public profile** (#22) | 🟢 LOW | Optional social/community feature. Not core to medical platform |

---

## 5. System Endpoints (Webhooks)

| Endpoint | Priority | Notes |
|----------|----------|-------|
| KYC webhook (#36) | 🟡 MEDIUM | `supabase/functions/drgreen-webhook/index.ts` exists but may not handle inbound KYC status events. Needs audit. |
| Payment webhook (#37) | 🟡 MEDIUM | No handler for external payment processor callbacks |

---

## 6. Recommended Build Priorities

Ordered by compliance importance and user value:

### Priority 1 — Regulatory Compliance
1. **GDPR data export** (#31-32) — Create edge function that aggregates `profiles`, `drgreen_clients`, `drgreen_orders`, `dosage_logs`, `prescription_documents` into a downloadable archive
2. **Activity/audit logs** (#25) — Create `activity_logs` table + RLS policies + logging triggers on sensitive operations

### Priority 2 — Patient Experience
3. **Notification preferences API** (#28-29) — Structured endpoint over `profiles.preferences` with validation
4. **Profile preferences API** (#23-24) — Formalize the existing JSON column with schema + UI

### Priority 3 — Security Hardening
5. **Session management** (#26-27) — Expose Supabase session list with user-facing revocation
6. **KYC webhook** (#36) — Audit `drgreen-webhook` for inbound event handling

### Priority 4 — Future Features
7. **Wallet unlink** (#12) — Only if multi-wallet support is needed
8. **Public profile** (#22) — Only if community features are planned
9. **Billing** (#30) — Only if self-service payment management is required
10. **Payment webhook** (#37) — When payment processor integration is finalized

---

## 7. Notes and Constraints

### What NOT to Build

| Don't Build | Reason |
|-------------|--------|
| Wallet features for patients | Wallets are admin-only (NFT holders). Patients use email/password. |
| Duplicate Supabase Auth endpoints | Login, logout, refresh, password reset are already handled by Supabase Auth. Don't wrap them in custom edge functions. |
| Custom token management | Supabase handles JWT refresh automatically. Don't build a separate `/auth/refresh` endpoint. |
| Direct browser-to-Dr. Green API calls | All Dr. Green API calls must go through `drgreen-proxy` for cryptographic signing. Never expose API keys client-side. |

### Architecture Reminders

- **Signing:** Dr. Green API uses HMAC-SHA256 symmetric signing (with `DRGREEN_USE_HMAC` toggle for legacy secp256k1 fallback)
- **Credential scoping:** Client records are scoped to the NFT/API key pair that created them
- **Environment routing:** Admin read operations use `production-write` environment for elevated permissions
- **Eligibility enforcement:** Cart/checkout blocked unless `isKYCVerified === true` AND `adminApproval === "VERIFIED"` — this is non-negotiable

### File Reference

| File | Purpose |
|------|---------|
| `supabase/functions/wallet-auth/index.ts` | Admin wallet + SIWE + NFT verification |
| `supabase/functions/drgreen-proxy/index.ts` | Backend proxy for all Dr. Green API calls |
| `supabase/functions/drgreen-webhook/index.ts` | Inbound webhook handler (needs audit) |
| `src/hooks/useWalletAuth.ts` | Client-side wallet auth hook |
| `src/hooks/useDrGreenApi.ts` | Client-side Dr. Green API hook |
| `src/hooks/useDrGreenClientSync.ts` | Client sync between local DB and Dr. Green |
| `src/pages/Auth.tsx` | Patient login/signup UI |
| `src/components/shop/ClientOnboarding.tsx` | Medical questionnaire + client creation |
| `src/components/admin/WalletEmailMappings.tsx` | Admin wallet-email linking UI |
