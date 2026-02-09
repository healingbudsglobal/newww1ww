

## Update 8 Required Secrets

Update the following secrets with new values for this remixed project:

1. **DRGREEN_API_KEY** -- Dr. Green production API key
2. **DRGREEN_PRIVATE_KEY** -- Dr. Green production private/secret key for request signing
3. **DRGREEN_STAGING_API_KEY** -- Dr. Green Railway (staging) API key
4. **DRGREEN_STAGING_PRIVATE_KEY** -- Dr. Green Railway (staging) private key
5. **DRGREEN_STAGING_API_URL** -- Dr. Green Railway staging API base URL
6. **ADMIN_WALLET_ADDRESSES** -- Comma-separated list of admin wallet addresses
7. **RESEND_API_KEY** -- Resend email service API key
8. **EXTERNAL_SUPABASE_SERVICE_KEY** -- External Supabase service role key

### Process

Each secret will be requested one at a time using the secure secret input tool. You will be prompted to paste each value.

### After Secrets Are Set

Run the Dr. Green health check endpoint to verify production and staging API connectivity are working with the new credentials.

