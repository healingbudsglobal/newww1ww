

# Save API Gap Analysis as Reference Document

## Overview
Create a structured reference document at `docs/API-GAP-ANALYSIS.md` that captures the full gap analysis of the 37-endpoint API specification against the existing Healing Buds codebase. The document will clearly separate admin-only (wallet/NFT) features from patient-facing features, serving as a planning roadmap for future development.

## Document Structure

The file will be organized into the following sections:

1. **Header and Purpose** -- What this document is, when it was created, and how to use it
2. **Architecture Summary** -- The two-track auth model (Patient = email/Supabase, Admin = wallet/NFT/SIWE)
3. **Coverage Matrix** -- A table listing all 37 endpoints with status (Covered / Partial / New) and which user type they apply to
4. **Admin-Only Endpoints (Wallet/NFT)** -- Detailed breakdown of admin-scoped endpoints, noting which are already implemented via `wallet-auth` edge function and `drgreen-proxy`
5. **Patient-Facing Endpoints** -- Detailed breakdown of patient/client endpoints, noting coverage by Supabase Auth and the Dr. Green API
6. **Genuinely New Gaps** -- Prioritized list of endpoints that do not exist yet, separated by user type
7. **Recommended Build Priorities** -- Ordered by compliance importance and user value
8. **Notes and Constraints** -- Reminders about what NOT to build (e.g., no wallet features for patients, no duplicating Supabase Auth)

## Key Content Highlights

### Coverage breakdown:
- **Fully Covered (16 endpoints):** Login, logout, refresh, password reset, email verify, client create, client read, client update, client delete, KYC submit, KYC status, admin list clients, admin get client, admin ban, wallet nonce (via SIWE message), wallet verify (via wallet-auth edge function)
- **Partially Covered (4 endpoints):** Wallet-email mappings exist but lack multi-wallet support; profiles exist but lack public/private distinction; preferences JSON column exists but has no dedicated API
- **Genuinely New (17 endpoints):** GDPR export, activity/audit logs, session management, notification preferences API, public profile display, billing/payment methods, webhooks

### Admin-only features (wallet/NFT holders):
- Wallet linking/unlinking (endpoints 11-13) -- admin only, not for patients
- Admin client management (endpoints 33-35) -- already covered via drgreen-proxy
- Wallet nonce/verify pattern -- already covered by wallet-auth edge function using SIWE

### Patient-facing gaps (priority order):
1. GDPR data export (regulatory compliance)
2. Profile preferences API (notification/privacy settings)
3. Activity logs (healthcare audit requirements)
4. Public profile display (optional, low priority)

## File Changed

| File | Change |
|------|--------|
| `docs/API-GAP-ANALYSIS.md` | New file -- complete gap analysis reference document |

## Technical Details

- The document will use Markdown tables for the coverage matrix for easy scanning
- Each endpoint entry will reference the existing implementation file where applicable (e.g., `supabase/functions/wallet-auth/index.ts`, `supabase/functions/drgreen-proxy/index.ts`)
- Status labels: COVERED, PARTIAL, NEW, NOT APPLICABLE (for patient-irrelevant wallet endpoints)
- No code changes, database changes, or edge function modifications -- this is purely a reference document

