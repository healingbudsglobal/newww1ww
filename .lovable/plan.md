

# Save Profile & Authentication API Reference Document

## What This Does
Save the comprehensive Profile & Authentication API specification you provided as a new markdown reference document in the project's `docs/` folder. This document covers wallet auth flows, client CRUD, wallet linking, session management, KYC, billing, GDPR, webhooks, and admin endpoints — serving as the authoritative reference for all profile and authentication API integration work.

## File to Create
- **`docs/PROFILE-AUTH-API-REFERENCE.md`** — The full API specification, properly formatted as clean markdown with:
  - All 12 endpoint sections (Auth/Wallet, Client CRUD, Wallet Linking, Sessions, Preferences, KYC, Billing, GDPR, Webhooks, Admin, Notifications, Policies)
  - cURL and fetch examples
  - Node/Express reference snippets
  - OpenAPI YAML starter
  - Postman collection JSON template
  - Security policies and edge case guidance
  - End-to-end wallet login flow example

## How It Relates to Existing Code
- **Current `wallet-auth` edge function**: Implements a subset of this spec (SIWE sign + NFT check + OTP session). The new doc provides the full nonce-based pattern (Sections 1.1-1.2) that could replace or extend the current timestamp-based approach.
- **Current `drgreen-proxy`**: Already handles client creation, cart, orders. The new doc adds wallet linking (Section 3), session management (Section 4), and preferences (Section 5) as future capabilities.
- **Existing `docs/DRGREEN-API-FULL-REFERENCE.md`**: Covers the Dr. Green DApp API specifically. This new document is complementary — it defines the profile/auth layer that sits between the frontend and the DApp API.

## Technical Notes
- No code changes are made — this is documentation only
- The document will be formatted with proper markdown headings, code blocks, and tables for readability
- All variable placeholders (e.g., `{{baseUrl}}`, `{{accessToken}}`) are preserved as-is for Postman/API client compatibility

