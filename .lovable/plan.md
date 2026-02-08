

# Secret Configuration for Remixed Project

## Overview
Your remixed project needs 12 secrets re-entered to restore full functionality. These secrets are not carried over during a remix — only the secret names exist, but the values are empty.

## Secrets to Update (in order of priority)

### Dr. Green API — Production (Read)
1. **DRGREEN_API_KEY** — Primary production API key
2. **DRGREEN_PRIVATE_KEY** — Primary production HMAC signing key

### Dr. Green API — Production (Write)
3. **DRGREEN_WRITE_API_KEY** — Write-enabled key for client creation and orders
4. **DRGREEN_WRITE_PRIVATE_KEY** — Write-enabled signing key

### Dr. Green API — Alternate Production
5. **DRGREEN_ALT_API_KEY** — Alternate production API key
6. **DRGREEN_ALT_PRIVATE_KEY** — Alternate production signing key

### Dr. Green API — Staging
7. **DRGREEN_STAGING_API_URL** — Staging API base URL
8. **DRGREEN_STAGING_API_KEY** — Staging API key
9. **DRGREEN_STAGING_PRIVATE_KEY** — Staging signing key

### Platform and Services
10. **ADMIN_WALLET_ADDRESSES** — Comma-separated Ethereum wallet addresses for admin access
11. **RESEND_API_KEY** — Email delivery service key
12. **EXTERNAL_SUPABASE_SERVICE_KEY** — Service key for external backend project

## Implementation
Once approved, I will prompt you to enter each secret value using the secure input form. You will need to retrieve the original values from your previous project's settings or from your credentials store.

## What You Need Ready
- Access to your Dr. Green DApp API dashboard (for all API keys and signing keys)
- Your Resend account dashboard (for the email API key)
- Your admin wallet addresses
- The external backend service key (if still in use)

