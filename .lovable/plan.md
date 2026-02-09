

## Email System Audit and Dispatch Email Implementation

### Current State

**Existing email functions:**
1. `send-onboarding-email` -- Triggered on signup (welcome + registration CTA)
2. `send-order-confirmation` -- Triggered at checkout (order received/confirmed)
3. `send-client-email` -- Handles: welcome, kyc-link, kyc-approved, kyc-rejected, eligibility-approved, eligibility-rejected
4. `send-contact-email` -- Contact form submissions

**Missing:**
- **Dispatch/Shipping notification email** -- No email is sent when an admin changes order status to SHIPPED

**Issue with all existing emails:**
- All use `onboarding@resend.dev` as sender (Resend's sandbox address). This only delivers to the Resend account owner's email. Production requires a verified domain.

### Plan

#### 1. Create `send-dispatch-email` Edge Function

A new edge function that sends a shipping notification email when an order is dispatched. Includes:
- Order reference number
- Tracking information (optional field)
- Items being shipped
- Shipping address confirmation
- Estimated delivery timeframe
- Region-aware branding (ZA/PT/GB/global)
- Same HTML email template style as existing functions

#### 2. Auto-Trigger Dispatch Email on Status Change

Update `useAdminOrderSync.ts` -- the `updateOrderStatusMutation` to automatically invoke `send-dispatch-email` when an admin changes order status to `SHIPPED`. The mutation will:
- Fetch the order details (customer email, name, items, shipping address)
- Call the edge function non-blocking (fire-and-forget, errors logged but don't block status update)

#### 3. Password Reset Flow Verification

The password reset flow is already implemented in `Auth.tsx` using `supabase.auth.resetPasswordForEmail()`. The redirect URL correctly uses `getProductionPath('/auth')`. No changes needed here -- this works with the built-in auth email system.

### Technical Details

**New file:** `supabase/functions/send-dispatch-email/index.ts`
- Accepts: `{ email, customerName, orderId, items, shippingAddress, trackingNumber?, estimatedDelivery?, region? }`
- Requires auth (same pattern as `send-order-confirmation`)
- Uses Resend API with region-aware branding
- Logs to `kyc_journey_logs` if client ID provided

**Modified file:** `src/hooks/useAdminOrderSync.ts`
- In `updateOrderStatusMutation.mutationFn`, after successful DB update:
  - If `status === "SHIPPED"`, fetch order details and invoke `send-dispatch-email`
  - Non-blocking: wrapped in try/catch, errors logged but don't fail the mutation

**No test accounts will be created.** All client data comes exclusively from the Dr. Green API via the existing sync and auto-discovery mechanisms.

