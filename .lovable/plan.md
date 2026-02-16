

## Update All 12 Secrets for Remixed Project

### What This Does
Configures all required API keys and credentials so the backend functions (strain sync, Dr. Green proxy, emails, etc.) work correctly in this remixed project.

### Secrets to Update

| # | Secret | Purpose |
|---|--------|---------|
| 1 | ADMIN_WALLET_ADDRESSES | Wallet addresses granted admin role |
| 2 | DRGREEN_API_KEY | Production API key for Dr. Green DApp |
| 3 | DRGREEN_PRIVATE_KEY | Production signing key |
| 4 | DRGREEN_ALT_API_KEY | Alternate API key |
| 5 | DRGREEN_ALT_PRIVATE_KEY | Alternate signing key |
| 6 | DRGREEN_WRITE_API_KEY | Write-operation API key |
| 7 | DRGREEN_WRITE_PRIVATE_KEY | Write-operation signing key |
| 8 | DRGREEN_STAGING_API_KEY | Staging/test API key |
| 9 | DRGREEN_STAGING_PRIVATE_KEY | Staging signing key |
| 10 | DRGREEN_STAGING_API_URL | Staging API base URL |
| 11 | RESEND_API_KEY | Transactional email service |
| 12 | EXTERNAL_SUPABASE_SERVICE_KEY | External database access |

### How It Works
- On approval, you will be prompted with 12 secure input forms (one per secret)
- Paste each value from your original project into the corresponding field
- Once all are saved, the backend functions will have the credentials they need
- No code changes required -- only secret values are being set

### After Completion
- Run the health check endpoint to verify API connectivity
- Test strain sync to confirm the "credentials not configured" error is resolved

