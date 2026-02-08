# Dr. Green DApp API Integration Guide

## Overview

This document provides comprehensive documentation for the Dr. Green DApp API integration used in the Healing Buds storefront, admin portal, and patient dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HEALING BUDS FRONTEND                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Storefront  │  │ Admin Portal │  │   Patient    │               │
│  │   (Shop)     │  │  (Dashboard) │  │  Dashboard   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                       │
│         └────────────────┬┴─────────────────┘                       │
│                          │                                          │
│                   ┌──────▼──────┐                                   │
│                   │  ShopContext │ (React Context)                  │
│                   └──────┬──────┘                                   │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    SUPABASE (LOVABLE CLOUD)                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    drgreen-proxy                              │   │
│  │              (Edge Function - Request Signing)                │   │
│  │  • Signs requests with HMAC-SHA256                             │   │
│  │  • Routes to appropriate Dr. Green endpoint                   │   │
│  │  • Handles authentication headers                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ drgreen_clients │  │  drgreen_cart   │  │ drgreen_orders  │     │
│  │   (Local Cache) │  │  (User Carts)   │  │ (Order History) │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DR. GREEN DAPP API                               │
│            https://stage-api.drgreennft.com/api/v1                  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Clients   │  │   Orders    │  │    Carts    │  │  Products │  │
│  │   /clients  │  │   /orders   │  │   /carts    │  │  /strains │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication

All Dr. Green API requests require cryptographic signing:

### Required Headers

| Header | Type | Description |
|--------|------|-------------|
| `x-auth-apikey` | String (Base64) | API key for authentication |
| `x-auth-signature` | String (Base64) | Cryptographic signature of request payload |
| `Content-Type` | String | `application/json` |

### Signature Generation

> **Full details:** See [DRGREEN-API-SIGNING-KNOWLEDGE.md](./DRGREEN-API-SIGNING-KNOWLEDGE.md)

**Node.js (HMAC-SHA256):**

```javascript
const crypto = require('crypto');

function signRequest(dataToSign, secretKey) {
  const keyBuffer = Buffer.from(secretKey, 'base64');
  const hmac = crypto.createHmac('sha256', keyBuffer);
  hmac.update(dataToSign);
  return hmac.digest('base64');
}

// For GET requests: dataToSign = query string (e.g., "orderBy=desc&take=10&page=1")
// For POST requests: dataToSign = JSON.stringify(body)
```

**Deno / Web Crypto API (Edge Functions):**

```typescript
async function signRequest(dataToSign: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const binaryString = atob(secretKey);
  const keyBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    keyBytes[i] = binaryString.charCodeAt(i);
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
```

> ⚠️ **Important:** The `x-auth-apikey` header must contain the raw Base64 API key exactly as stored in secrets. Do NOT process it through `extractPemBody()` or any PEM-stripping utility.

### Secrets Required

| Secret Name | Description |
|-------------|-------------|
| `DRGREEN_API_KEY` | Production API key |
| `DRGREEN_PRIVATE_KEY` | Production signing key |
| `DRGREEN_STAGING_API_KEY` | Staging API key |
| `DRGREEN_STAGING_PRIVATE_KEY` | Staging signing key |
| `DRGREEN_STAGING_API_URL` | Staging base URL |

---

## Client Endpoints

### 1. Create a Client

**Endpoint:** `POST /dapp/clients`

Creates a new client in the DApp. Clients are created against the primary NFT selected in the dapp.

#### Request Body

```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required)",
  "phoneCode": "string (required, e.g., +44)",
  "phoneCountryCode": "string (required, e.g., GB)",
  "contactNumber": "string (required)",
  "clientBusiness": {
    "businessType": "string (optional)",
    "name": "string (optional)",
    "address1": "string (optional)",
    "address2": "string (optional)",
    "landmark": "string (optional)",
    "city": "string (optional)",
    "state": "string (optional)",
    "country": "string (optional)",
    "countryCode": "string (optional)",
    "postalCode": "string (optional)"
  },
  "shipping": {
    "address1": "string (required)",
    "address2": "string (optional)",
    "landmark": "string (optional)",
    "city": "string (required)",
    "state": "string (required)",
    "country": "string (required)",
    "countryCode": "string (required)",
    "postalCode": "string (required)"
  },
  "medicalRecord": {
    "dob": "string (required, YYYY-MM-DD)",
    "gender": "string (required)",
    "medicalConditions": ["array of strings (optional)"],
    "otherMedicalCondition": "string (optional)",
    "medicinesTreatments": ["array of strings (optional)"],
    "medicalHistory0": "boolean (required)",
    "medicalHistory1": "boolean (required)",
    "medicalHistory2": "boolean (required)",
    "medicalHistory3": "boolean (required)",
    "medicalHistory4": "boolean (required)",
    "medicalHistory5": ["array of strings (required)"],
    "medicalHistory6": "boolean (optional)",
    "medicalHistory7": ["array of strings (optional)"],
    "medicalHistory7Relation": "string (optional)",
    "medicalHistory8": "boolean (required)",
    "medicalHistory9": "boolean (required)",
    "medicalHistory10": "boolean (required)",
    "medicalHistory11": "string (optional)",
    "medicalHistory12": "boolean (required)",
    "medicalHistory13": "string (required)",
    "medicalHistory14": ["array of strings (required)"],
    "medicalHistory15": "string (optional)",
    "medicalHistory16": "boolean (optional)",
    "prescriptionsSupplements": "string (optional)"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "client-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "isKYCVerified": false,
    "adminApproval": "PENDING",
    "kycLink": "https://kyc-verification-link.com/...",
    "createdAt": "2026-01-30T00:00:00.000Z"
  }
}
```

---

### 2. Get All Clients

**Endpoint:** `GET /dapp/clients`

Retrieves a paginated list of all clients.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `orderBy` | string | `desc` | Sort order (asc/desc) |
| `take` | number | `10` | Items per page (max 100) |
| `page` | number | `1` | Page number |
| `search` | string | - | Search term |
| `searchBy` | string | `clientName` | Field to search |

#### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "client-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "isKYCVerified": true,
        "adminApproval": "VERIFIED"
      }
    ],
    "total": 100,
    "page": 1,
    "take": 10
  }
}
```

---

### 3. Get Client Details

**Endpoint:** `GET /dapp/clients/:clientId`

Retrieves detailed information for a specific client.

#### Response

```json
{
  "success": true,
  "data": {
    "id": "client-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+44 7123456789",
    "isKYCVerified": true,
    "adminApproval": "VERIFIED",
    "kycLink": null,
    "shipping": {
      "address1": "123 Main St",
      "city": "London",
      "country": "United Kingdom",
      "postalCode": "SW1A 1AA"
    },
    "medicalRecord": { ... },
    "createdAt": "2026-01-30T00:00:00.000Z",
    "updatedAt": "2026-01-30T00:00:00.000Z"
  }
}
```

---

### 4. Update Client Details

**Endpoint:** `PATCH /dapp/clients/:clientId`

Updates existing client information.

#### Request Body (partial update)

```json
{
  "firstName": "John Updated",
  "shipping": {
    "address1": "456 New Address"
  }
}
```

---

### 5. Get Client Summary

**Endpoint:** `GET /dapp/clients/summary`

Retrieves aggregated client statistics for admin dashboards.

#### Response

```json
{
  "success": true,
  "data": {
    "totalClients": 150,
    "verifiedClients": 100,
    "pendingClients": 40,
    "rejectedClients": 10
  }
}
```

---

## Order Endpoints

### 1. Create an Order

**Endpoint:** `POST /dapp/orders`

Creates a new order for a client. The cart items are automatically included.

#### Request Body

```json
{
  "clientId": "client-uuid (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "clientId": "client-uuid",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "items": [
      {
        "strainId": "strain-uuid",
        "name": "Blue Dream",
        "quantity": 5,
        "unitPrice": 12.50,
        "totalPrice": 62.50
      }
    ],
    "totalAmount": 62.50,
    "createdAt": "2026-01-30T00:00:00.000Z"
  }
}
```

---

### 2. Get All Orders

**Endpoint:** `GET /dapp/orders`

Retrieves a paginated list of all orders with filtering.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderBy` | string | Sort order (asc/desc) |
| `take` | number | Items per page |
| `page` | number | Page number |
| `search` | string | Search term |
| `searchBy` | string | Field to search (clientName) |
| `adminApproval` | string | Filter by status (PENDING, VERIFIED, REJECTED) |
| `clientIds` | array | Filter by specific client IDs |

---

### 3. Get Orders by Client

**Endpoint:** `GET /dapp/client/:clientId/orders`

Retrieves all orders for a specific client.

---

### 4. Get Order Details

**Endpoint:** `GET /dapp/orders/:orderId`

Retrieves detailed information for a specific order.

---

### 5. Get Client Order Details

**Endpoint:** `GET /dapp/clients/:clientId/orders/:orderId`

Retrieves order details scoped to a specific client.

---

## Cart Endpoints

### 1. Get All Cart Items

**Endpoint:** `GET /dapp/carts`

Retrieves all cart items across all clients (admin view).

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderBy` | string | Sort order |
| `take` | number | Items per page |
| `page` | number | Page number |
| `search` | string | Search term |
| `searchBy` | string | Field to search |

---

## User Flow Diagrams

### Patient Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sign Up   │────▶│  Complete   │────▶│   KYC via   │────▶│   Admin     │
│  (Supabase) │     │  Medical    │     │  First AML  │     │  Approval   │
│             │     │  Questionnaire│   │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                    POST /dapp/clients   External KYC      Manual in DApp
                    (Creates client,     verification      Admin Portal
                     returns kycLink)
```

### Purchase Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browse    │────▶│   Add to    │────▶│  Checkout   │────▶│   Payment   │
│   Products  │     │    Cart     │     │  (Create    │     │ Processing  │
│             │     │             │     │   Order)    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
 GET /strains        Local Cart         POST /dapp/orders    External
 (Products API)      (Supabase)         (Dr. Green API)      Payment
```

### Eligibility Check Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ELIGIBILITY CHECK                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Logs In                                                       │
│       │                                                             │
│       ▼                                                             │
│  Check local drgreen_clients table                                  │
│       │                                                             │
│       ├── Found ──▶ Check is_kyc_verified && admin_approval         │
│       │                    │                                        │
│       │                    ├── VERIFIED ──▶ ✅ Access Shop          │
│       │                    │                                        │
│       │                    └── PENDING ──▶ ⏳ Show Status Page      │
│       │                                                             │
│       └── Not Found ──▶ Call get-client-by-auth-email               │
│                              │                                      │
│                              ├── Found ──▶ Link & Check Status      │
│                              │                                      │
│                              └── Not Found ──▶ 📝 Registration      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Edge Function Implementation

### drgreen-proxy Actions

| Action | Method | Dr. Green Endpoint | Description |
|--------|--------|-------------------|-------------|
| `create-client` | POST | `/dapp/clients` | Create new client |
| `get-client` | GET | `/dapp/clients/:id` | Get client details |
| `update-client` | PATCH | `/dapp/clients/:id` | Update client |
| `get-clients` | GET | `/dapp/clients` | List all clients |
| `get-client-by-auth-email` | GET | `/dapp/clients` | Find client by email |
| `create-order` | POST | `/dapp/orders` | Create new order |
| `get-orders` | GET | `/dapp/orders` | List orders |
| `get-client-orders` | GET | `/dapp/client/:id/orders` | Client's orders |
| `get-products` | GET | `/dapp/strains` | List products |

---

## Local Database Tables

### drgreen_clients

Caches client data for quick eligibility checks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Local primary key |
| `user_id` | uuid | Supabase auth user ID |
| `drgreen_client_id` | string | Dr. Green client ID |
| `email` | string | Client email |
| `full_name` | string | Full name |
| `country_code` | string | ISO country code |
| `is_kyc_verified` | boolean | KYC status |
| `admin_approval` | string | PENDING/VERIFIED/REJECTED |
| `kyc_link` | string | KYC verification URL |

### drgreen_cart

Local cart storage per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Supabase auth user ID |
| `strain_id` | string | Product ID |
| `strain_name` | string | Product name |
| `quantity` | integer | Quantity |
| `unit_price` | decimal | Price in EUR |

### drgreen_orders

Order history cache.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Supabase auth user ID |
| `drgreen_order_id` | string | Dr. Green order ID |
| `status` | string | Order status |
| `payment_status` | string | Payment status |
| `total_amount` | decimal | Total in EUR |
| `items` | jsonb | Order items |

---

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed error message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid API key or signature |
| `FORBIDDEN` | 403 | Client not eligible |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Medical Questionnaire Options

### Medical Conditions

```javascript
const medicalConditions = [
  "adhd", "agoraphobia", "anxiety", "appetite_disorders",
  "arthritis", "autistic_spectrum_disorder", "back_and_neck_pain",
  "bipolar", "bladder_pain", "cancer_pain_and_nausea",
  "chronic_and_long_term_pain", "chronic_fatigue_syndrome",
  "cluster_headaches", "complex_regional_pain_syndrome",
  "depression", "epilepsy", "fibromyalgia", "migraine",
  "multiple_sclerosis_pain_and_muscle_spasm", "nerve_pain",
  "ptsd", "sleep_disorders", "other_medical_condition"
];
```

### Cannabis Usage Frequency

```javascript
const usageFrequency = [
  "everyday",
  "every_other_day", 
  "1_2_times_per_week",
  "never"
];
```

### Cannabis Methods

```javascript
const usageMethods = [
  "smoking_joints",
  "vaporizing",
  "ingestion",
  "topical",
  "never"
];
```

---

## Testing

### Test with Edge Function

```bash
# Create client
curl -X POST https://your-project.supabase.co/functions/v1/drgreen-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "create-client", "data": {...}}'

# Get client by email
curl -X POST https://your-project.supabase.co/functions/v1/drgreen-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "get-client-by-auth-email"}'
```

---

## Security Considerations

1. **Never expose API keys client-side** - All requests go through edge functions
2. **Signature verification** - Every request is cryptographically signed
3. **Email matching** - Clients are linked by email from JWT, not user input
4. **RLS policies** - Local tables have row-level security
5. **KYC gating** - Shop access requires verified status

---

## NFT-Scoped Access Control (Critical)

The Dr. Green API enforces **strict NFT-scoped access control**. This means:

### How It Works

1. Each API key pair (public key + private key) is associated with a specific **NFT** and **dApp identity**
2. When a client is created via `POST /dapp/clients`, that client record is **bound** to the NFT/API key that created it
3. Only the same API key can perform operations on that client (PATCH, carts, orders)

### Current Credentials

| Property | Value |
|----------|-------|
| dApp Name | `healingbudscoza` |
| NFT Owner | `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` |

### Common 401 Errors

If you see `401 Unauthorized` when trying to:
- PATCH a client's shipping address
- POST items to a client's cart
- POST an order for a client

This usually means the client was created under **different API credentials** (different NFT scope).

### Solutions

#### Option A: Re-Register Client (Recommended)

If a client was created under different credentials:
1. Create a new client record via `POST /dapp/clients` with current credentials
2. Store the new `drgreen_client_id` in local database
3. User completes KYC verification again via the new `kycLink`

This is available in the Patient Dashboard under **Quick Actions → Re-Sync Account**.

#### Option B: Admin Credentials

If you have admin-level API credentials from Dr. Green:
1. Add `DRGREEN_ADMIN_API_KEY` and `DRGREEN_ADMIN_PRIVATE_KEY` secrets
2. Use admin credentials for order operations (bypasses NFT scoping)

#### Option C: Mock Mode (Testing Only)

For development and testing:
1. Add `DRGREEN_MOCK_MODE=true` to Edge Function secrets
2. Order creation will return simulated success
3. No actual order is created in Dr. Green

---

## Mock Mode

When `DRGREEN_MOCK_MODE` environment variable is set to `true`, the `create-order` action will:

1. Skip all Dr. Green API calls
2. Return a simulated successful response with a mock order ID
3. Include a `mockMode: true` flag in the response

### Enabling Mock Mode

Add the secret via Lovable Cloud:
- **Name**: `DRGREEN_MOCK_MODE`
- **Value**: `true`

### Mock Response Example

```json
{
  "success": true,
  "orderId": "mock_ord_abc123_xyz",
  "message": "[MOCK MODE] Order simulated successfully",
  "mockMode": true,
  "requestId": "ord_abc123_xyz",
  "items": [...],
  "status": "PENDING"
}
```

---

## Key Rotation / Credential Migration

If API credentials change:

### 1. Existing Clients Become Inaccessible

Clients created under old credentials cannot be modified with new credentials.

### 2. Migration Steps

1. **Identify affected users**: Query `drgreen_clients` table for users who cannot place orders
2. **Prompt re-registration**: Show "Re-Sync Account" option in dashboard
3. **Create new client records**: Use new credentials to create fresh client records
4. **Update local database**: Replace old `drgreen_client_id` with new one
5. **User completes KYC**: New verification required for each re-registered user

### 3. Preventing Issues

- Keep API credentials consistent across environments
- Document which NFT/credentials are used for production
- Test with a dedicated test account before real user registration

---

## Troubleshooting

### Order Creation Fails with 401

**Cause**: Client record created under different NFT/API credentials

**Solution**: 
1. Check `DRGREEN_MOCK_MODE` is not enabled (unless testing)
2. Have user click "Re-Sync Account" in Patient Dashboard
3. User completes KYC again with new client record

### Signature Verification Fails

**Cause**: Incorrect signing method or API key format

**Solution**:
1. Verify signing uses **HMAC-SHA256** (not secp256k1 ECDSA) — see [Signing Knowledge Base](./DRGREEN-API-SIGNING-KNOWLEDGE.md)
2. Verify `x-auth-apikey` sends the raw Base64 key (no PEM stripping via `extractPemBody()`)
3. Verify GET requests sign the **query string**, not `"{}"` or empty string
4. Run `drgreen-health` to confirm credentials are valid
5. Run `debug-signing-test` to compare signing methods

### Client Not Found

**Cause**: `drgreen_client_id` doesn't exist in Dr. Green system

**Solution**:
1. Verify client was created successfully
2. Check if client was deleted in Dr. Green admin
3. Re-register client if needed

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-30 | Initial documentation |
| 1.1.0 | 2026-02-02 | Added NFT-scoped access control, mock mode, troubleshooting |
| 1.2.0 | 2026-02-08 | **CRITICAL FIX**: Corrected signing method from secp256k1 ECDSA to HMAC-SHA256. Updated all code examples. Added cross-references to [Signing Knowledge Base](./DRGREEN-API-SIGNING-KNOWLEDGE.md) and [API Infrastructure](../.agent/knowledge/API_INFRASTRUCTURE.md). |

---

## Related Documentation

- **[API Signing Knowledge Base](./DRGREEN-API-SIGNING-KNOWLEDGE.md)** — Detailed signing mechanics, root cause analysis, and reference implementations
- **[API Infrastructure Knowledge](../.agent/knowledge/API_INFRASTRUCTURE.md)** — Architecture, multi-environment config, security patterns, and operational procedures
