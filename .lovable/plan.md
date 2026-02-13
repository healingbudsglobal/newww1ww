

# Implement Plan: Fix Email Region + Enhance Order Views

## API Health Check Result
The Dr. Green API credentials are verified and working -- health check returned "healthy" with 510ms response time.

---

## Step 1: Fix Country Code Fallback in Checkout

**File:** `src/pages/Checkout.tsx`

Two lines (295 and 357) hardcode `'PT'` as the fallback country code. This causes South Africa orders to be tagged as Portugal, which cascades into wrong email branding.

**Change:** Replace `'PT'` with `'ZA'` on both lines so the South Africa store defaults correctly.

---

## Step 2: Region-Aware Email Domains Across 6 Edge Functions

All 6 email-sending functions hardcode `noreply@send.healingbuds.co.za` as the "from" address. Each must use the store's country domain.

**Domain mapping to add:**
- ZA: `send.healingbuds.co.za`
- PT: `send.healingbuds.pt`
- GB: `send.healingbuds.co.uk`
- Global fallback: `send.healingbuds.co.za`

**Files to update:**

| File | Current | Fix |
|------|---------|-----|
| `send-order-confirmation/index.ts` | Hardcoded `.co.za`, PT uses `suporte@` | Add `sendDomain` to DOMAIN_CONFIG, fix PT to `support@` |
| `send-dispatch-email/index.ts` | Hardcoded `.co.za` | Same pattern |
| `send-client-email/index.ts` | Hardcoded `.co.za` | Same pattern |
| `drgreen-webhook/index.ts` | Hardcoded `.co.za` | Same pattern |
| `send-onboarding-email/index.ts` | Hardcoded `.co.za`, no region awareness | Add region param + domain config |
| `send-contact-email/index.ts` | Hardcoded `.co.za`, no region awareness | Add region param + domain config |

Note: Non-ZA domains must be verified in Resend for emails to actually deliver from those domains.

---

## Step 3: Add Status Banner to Order Detail Page

**File:** `src/pages/OrderDetail.tsx`

Currently shows badges and a timeline but lacks the prominent status message banner that the email has. Add a status card between the header and timeline:

- **Amber banner** for pending/local orders: "Order Queued for Processing" with explanation text ("Your order has been received and saved securely. Our team will process it and confirm via email.")
- **Green banner** for confirmed/paid orders: "Order Confirmed"
- Uses the same visual treatment as the email notification

---

## Step 4: Improve Mobile Visibility in Orders Table

**File:** `src/components/shop/OrdersTable.tsx`

On mobile, columns for Payment, Status, Qty, and Total are hidden (`hidden md:table-cell`). Users only see date, truncated ref, and a reorder button.

**Fix:** Show total amount and a combined status badge on mobile by removing `hidden md:table-cell` from the Total and Status columns (or adding a compact mobile summary below the ref).

---

## Implementation Order

1. Checkout.tsx -- 2-line fix (root cause)
2. 6 edge functions -- region-aware from addresses
3. OrderDetail.tsx -- status banner
4. OrdersTable.tsx -- mobile columns

