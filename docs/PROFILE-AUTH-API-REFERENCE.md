# Profile & Authentication API Reference

> **Authoritative reference** for all profile and authentication API integration in the Healing Buds platform.
> Complements `docs/DRGREEN-API-FULL-REFERENCE.md` (Dr. Green DApp API) by defining the profile/auth layer between the frontend and the DApp API.

---

## Base Configuration

| Item | Value |
|------|-------|
| **Base URL** | `{{baseUrl}}` (e.g., `https://api.example.com`) |
| **Content-Type** | `application/json` |
| **Accept** | `application/json` |

### Auth Mechanisms

| Mechanism | Header / Pattern |
|-----------|-----------------|
| Bearer JWT | `Authorization: Bearer {{accessToken}}` |
| Wallet signature | Nonce-based or SIWE |
| API key | `x-api-key` or `x-auth-apikey` + `x-auth-signature` (signed payloads) |
| Refresh tokens | Body-based exchange |

### Variable Reference

| Variable | Description |
|----------|-------------|
| `{{baseUrl}}` | API base URL |
| `{{accessToken}}` | JWT returned after login/verify |
| `{{refreshToken}}` | Refresh token (when applicable) |
| `{{clientId}}` | Client UUID |
| `{{walletAddress}}` | `0x...` Ethereum address |
| `{{nonce}}` | Server-issued nonce for signing |
| `{{signature}}` | `0x...` signature returned by wallet |

---

## 1 — Authentication & Wallet Flows

### 1.1 POST `/auth/wallet/nonce`

**Purpose:** Issue a nonce to be signed by a wallet. Used for login/create/link/delete confirmations.

**Auth:** None

**Request body:**

```json
{
  "address": "0x...",
  "chainId": 1,
  "purpose": "login|create|link|delete"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `address` | string | ✅ | Ethereum address |
| `chainId` | integer | ❌ | Default: 1 (mainnet) |
| `purpose` | string | ✅ | One of: `login`, `create`, `link`, `delete` |

**Response 200:**

```json
{
  "address": "0x...",
  "nonce": "random-string",
  "purpose": "login",
  "issuedAt": "ISO8601",
  "expiresAt": "ISO8601"
}
```

**cURL:**

```bash
curl -X POST "{{baseUrl}}/auth/wallet/nonce" \
  -H "Content-Type: application/json" \
  -d '{"address":"{{walletAddress}}","purpose":"login"}'
```

**fetch:**

```javascript
await fetch("{{baseUrl}}/auth/wallet/nonce", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ address, purpose: "login" })
});
```

---

### 1.2 POST `/auth/wallet/verify`

**Purpose:** Verify a wallet signature and issue session tokens.

**Auth:** None

**Request body:**

```json
{
  "address": "0x...",
  "message": "the exact message containing nonce",
  "signature": "0x...",
  "purpose": "login|create|link|delete",
  "chainId": 1
}
```

**Server behavior:**

1. Validate nonce for address and purpose; ensure unused and not expired.
2. Recover address from signature; ensure it matches.
3. Perform action based on `purpose`:
   - **login** — return access token + client (if exists)
   - **create** — create client, return access token + client
   - **link** — attach wallet to authenticated client (requires session or additional proof)
   - **delete** — perform soft/hard delete after verification

**Response 200/201:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "optional",
  "expiresIn": 3600,
  "client": { /* client object */ },
  "newUser": true
}
```

**cURL:**

```bash
curl -X POST "{{baseUrl}}/auth/wallet/verify" \
  -H "Content-Type: application/json" \
  -d '{"address":"{{walletAddress}}","message":"Sign this...","signature":"{{signature}}","purpose":"create"}'
```

---

### 1.3 POST `/auth/login`

**Purpose:** Traditional email/password login.

**Auth:** None

**Request:**

```json
{ "email": "user@example.com", "password": "plaintext" }
```

**Response 200:**

```json
{ "accessToken": "...", "refreshToken": "...", "client": {...} }
```

---

### 1.4 POST `/auth/logout`

**Purpose:** Revoke tokens / logout.

**Auth:** Bearer

**Response:** `204 No Content`

---

### 1.5 POST `/auth/refresh`

**Purpose:** Exchange refresh token for a new access token.

**Auth:** None (accepts refresh token in body)

**Request:**

```json
{ "refreshToken": "..." }
```

**Response 200:**

```json
{ "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 }
```

---

### 1.6 SIWE (Optional)

Use Sign-In With Ethereum (SIWE) standard for structured messages and improved interoperability. The endpoints above work with SIWE messages; the message format should follow the [SIWE spec](https://eips.ethereum.org/EIPS/eip-4361).

---

## 2 — Client (Profile) CRUD

### 2.1 POST `/clients`

**Purpose:** Create a client record.

**Auth:** None OR wallet-signed (`x-wallet-*` headers)

**Wallet-signed headers (alternative):**

| Header | Value |
|--------|-------|
| `x-wallet-address` | `0x...` |
| `x-wallet-signature` | `0x...` |
| `x-wallet-message` | Exact string with nonce |

**Request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "contactNumber": "+123456789",
  "walletAddress": "0x..."
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "firstName": "Jane",
  "email": "jane@example.com",
  "wallets": [{ "address": "0x...", "primary": true }],
  "createdAt": "ISO8601"
}
```

---

### 2.2 GET `/clients/:clientId`

**Purpose:** Retrieve public client profile (limited fields).

**Auth:** None

**Response 200:**

```json
{ "id": "uuid", "displayName": "Jane D", "avatarUrl": "...", "publicBio": "..." }
```

---

### 2.3 GET `/clients/me`

**Purpose:** Retrieve authenticated client's full profile.

**Auth:** Bearer

**Response 200:**

```json
{ "id": "uuid", "firstName": "Jane", "email": "jane@example.com", "wallets": [...] }
```

---

### 2.4 PATCH `/clients/:clientId`

**Purpose:** Update client profile (partial).

**Auth:** Bearer (must belong to `clientId`)

**Request:** Partial fields, e.g. `{ "firstName": "New" }`

**Response 200:** Updated client object.

---

### 2.5 DELETE `/clients/:clientId`

**Purpose:** Delete client account.

**Auth:** Bearer (owner) OR wallet-signed message with `purpose=delete`

**Response:** `204 No Content`

---

## 3 — Wallet Linking & Management

### 3.1 POST `/clients/:clientId/wallets`

**Purpose:** Link a wallet to a client.

**Auth:** Bearer (owner) OR wallet signature with `purpose=link`

**Request:**

```json
{ "address": "0x...", "signature": "0x...", "message": "..." }
```

**Server behavior:**

1. If using Bearer: verify `payload.sub === clientId`.
2. Verify signature & nonce for `purpose=link`.
3. Ensure wallet not already linked to another client (→ `409 Conflict`).
4. Add to `client.wallets` and return updated client.

**Response 200:** `{ "client": {...} }`

---

### 3.2 GET `/clients/:clientId/wallets`

**Purpose:** List wallets linked to client.

**Auth:** Bearer (owner) or returns limited info publicly.

**Response 200:**

```json
{ "wallets": [{ "address": "0x...", "primary": true, "addedAt": "ISO8601" }] }
```

---

### 3.3 DELETE `/clients/:clientId/wallets/:address`

**Purpose:** Remove wallet from client.

**Auth:** Bearer (owner) OR wallet-signed confirmation.

**Policy:** Prevent removing last linked wallet unless alternate auth is present.

**Response:** `204 No Content`

---

## 4 — Sessions, Tokens & Security

### 4.1 GET `/clients/:clientId/sessions`

**Purpose:** List active sessions/tokens.

**Auth:** Bearer (owner)

**Response 200:**

```json
{ "sessions": [{ "id": "uuid", "device": "Chrome", "createdAt": "ISO8601", "ip": "..." }] }
```

---

### 4.2 DELETE `/clients/:clientId/sessions/:sessionId`

**Purpose:** Revoke a session.

**Auth:** Bearer (owner)

**Response:** `204 No Content`

---

### 4.3 GET `/clients/:clientId/activity`

**Purpose:** Audit logs (login attempts, wallet links/unlinks).

**Auth:** Bearer (owner) or admin

**Query params:** `page`, `limit`, `startDate`, `endDate`

**Response 200:**

```json
{ "items": [{ "type": "login", "ip": "1.2.3.4", "timestamp": "ISO8601" }], "meta": {...} }
```

---

### 4.4 POST `/auth/password/reset/request`

**Purpose:** Request password reset email.

**Auth:** None

**Request:** `{ "email": "user@example.com" }`

**Response:** `200 OK`

---

### 4.5 POST `/auth/password/reset/confirm`

**Purpose:** Confirm password reset with token.

**Auth:** None

**Request:** `{ "token": "...", "newPassword": "..." }`

**Response:** `200 OK`

---

## 5 — Preferences, Notifications & Public Profile

### 5.1 GET `/clients/:clientId/preferences`

**Auth:** Bearer (owner)

**Response 200:**

```json
{ "notifications": { "email": true, "sms": false }, "privacy": { "publicProfile": true } }
```

---

### 5.2 PATCH `/clients/:clientId/preferences`

**Auth:** Bearer (owner)

**Request:** `{ "notifications": { "email": false } }`

---

### 5.3 GET `/clients/:clientId/public`

**Purpose:** Public-facing profile.

**Auth:** None

**Response 200:** `{ "displayName": "Jane D", "bio": "...", "avatarUrl": "..." }`

---

### 5.4 PATCH `/clients/:clientId/public`

**Auth:** Bearer (owner)

**Request:** `{ "displayName": "New", "bio": "..." }`

---

## 6 — Identity Verification (KYC) & Compliance

### 6.1 POST `/clients/:clientId/verify/identity`

**Purpose:** Submit KYC documents.

**Auth:** Bearer (owner)

**Request:** `multipart/form-data` or JSON with document URLs.

**Response:** `202 Accepted` with `verificationId`.

---

### 6.2 GET `/clients/:clientId/verify/identity/:verificationId`

**Auth:** Bearer (owner) or admin

**Response 200:**

```json
{ "status": "pending|approved|rejected", "notes": "..." }
```

---

## 7 — Billing & Payments (Profile-Linked)

### 7.1 GET `/clients/:clientId/billing`

**Purpose:** Get billing info & invoices.

**Auth:** Bearer (owner)

---

### 7.2 POST `/clients/:clientId/billing/methods`

**Purpose:** Add payment method (tokenized).

**Auth:** Bearer (owner)

**Response:** `201 Created`

---

## 8 — Data Export & GDPR

### 8.1 POST `/clients/:clientId/data/export`

**Purpose:** Request a full data export (GDPR).

**Auth:** Bearer (owner)

**Response:** `202 Accepted` with `exportId`.

---

### 8.2 GET `/clients/:clientId/data/export/:exportId`

**Auth:** Bearer (owner)

**Response:** `200 OK` (download ready) or `202 Accepted` (still processing).

---

## 9 — Webhooks & Integrations

### 9.1 POST `/clients/:clientId/webhooks`

**Auth:** Bearer (owner)

**Request:**

```json
{ "url": "https://...", "events": ["order.created", "wallet.linked"] }
```

**Response:** `201 Created`

---

### 9.2 GET `/clients/:clientId/webhooks`

**Auth:** Bearer (owner)

---

## 10 — Admin & Moderation

### 10.1 GET `/admin/clients`

**Purpose:** Admin listing of clients with filters.

**Auth:** Bearer (admin)

**Query params:** `q`, `page`, `limit`, `status`

---

### 10.2 POST `/admin/clients/:clientId/ban`

**Auth:** Bearer (admin)

**Request:** `{ "reason": "...", "until": "ISO8601" }`

---

## 11 — Notifications, Subscriptions & History

### 11.1 POST `/clients/:clientId/notifications/email/subscribe`

**Auth:** Optional

**Request:** `{ "email": "...", "list": "marketing" }`

---

### 11.2 GET `/clients/:clientId/notifications`

**Auth:** Bearer (owner)

---

## 12 — Policies & Edge Cases

| Policy | Rule |
|--------|------|
| **Wallet uniqueness** | Do not allow a wallet to be linked to more than one client unless explicitly allowed with strong verification. |
| **Nonce usage** | Single-use, tied to purpose, short expiry (≤5 min), rate-limited per address. |
| **Deletion** | Soft-delete with grace period; require signed confirmation when wallet is primary auth. |
| **Email changes** | Require re-verification via token. |
| **Primary wallet change** | Require session auth + signature from new wallet. |
| **Session revocation** | Server-side invalidation (store token IDs); immediate logout. |
| **Data minimization** | Public endpoints return only `displayName`/`avatar`; hide emails and full wallet lists. |
| **Logging & alerts** | Email on wallet link/unlink and unusual login attempts. |
| **Rate limits** | Anti-abuse limits on nonce and verify endpoints. |

---

## End-to-End Example: Client Wallet Login Flow

### Step 1 — Request nonce (`purpose=create`)

```bash
curl -X POST "{{baseUrl}}/auth/wallet/nonce" \
  -H "Content-Type: application/json" \
  -d '{"address":"{{walletAddress}}","purpose":"create"}'
```

**Response:**

```json
{
  "address": "0xABC...",
  "nonce": "abc123",
  "issuedAt": "2025-02-01T12:00:00Z",
  "expiresAt": "2025-02-01T12:05:00Z"
}
```

### Step 2 — Client signs message

```
Sign this message to create an account on ExampleApp

Action: create
Address: 0xABC...
Nonce: abc123
Issued At: 2025-02-01T12:00:00Z
```

### Step 3 — Verify and create

```bash
curl -X POST "{{baseUrl}}/auth/wallet/verify" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xABC...","message":"...exact...","signature":"0xSIG...","purpose":"create"}'
```

**Response:**

```json
{
  "accessToken": "eyJ...",
  "client": { "id": "uuid", "wallets": [...] },
  "newUser": true
}
```

### Step 4 — Use access token

```bash
curl -X GET "{{baseUrl}}/clients/me" \
  -H "Authorization: Bearer {{accessToken}}"
```

---

## Node/Express Reference Snippet

> Minimal example — wallet nonce + verify + JWT issuance.

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const nonces = new Map(); // address => { nonce, purpose, expiresAt, used }
const clients = new Map();
const addressToClient = new Map();

function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// --- Request nonce ---
app.post('/auth/wallet/nonce', (req, res) => {
  const { address, purpose } = req.body;
  if (!address || !purpose) return res.status(400).json({ error: 'address and purpose required' });

  const nonce = generateNonce();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  nonces.set(address.toLowerCase(), { nonce, purpose, issuedAt, expiresAt, used: false });
  res.json({ address, nonce, purpose, issuedAt, expiresAt });
});

// --- Verify signature ---
app.post('/auth/wallet/verify', async (req, res) => {
  const { address, message, signature, purpose } = req.body;
  if (!address || !message || !signature || !purpose)
    return res.status(400).json({ error: 'missing fields' });

  const record = nonces.get(address.toLowerCase());
  if (!record || record.purpose !== purpose) return res.status(400).json({ error: 'invalid nonce' });
  if (record.used) return res.status(400).json({ error: 'nonce already used' });
  if (new Date() > new Date(record.expiresAt)) return res.status(400).json({ error: 'nonce expired' });

  try {
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase())
      return res.status(401).json({ error: 'invalid signature' });
    record.used = true;

    let clientId = addressToClient.get(address.toLowerCase());
    let client;

    if (purpose === 'login') {
      if (!clientId) return res.status(404).json({ error: 'client not found' });
      client = clients.get(clientId);
    } else if (purpose === 'create') {
      if (clientId) return res.status(409).json({ error: 'client exists' });
      clientId = crypto.randomUUID();
      client = {
        id: clientId,
        wallets: [{ address: address.toLowerCase(), primary: true, addedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      };
      clients.set(clientId, client);
      addressToClient.set(address.toLowerCase(), clientId);
    } else {
      return res.status(400).json({ error: 'unsupported purpose' });
    }

    const token = issueToken({ sub: client.id, address: address.toLowerCase() });
    res.json({ accessToken: token, expiresIn: 3600, client, newUser: purpose === 'create' });
  } catch (err) {
    res.status(500).json({ error: 'verification failed', details: err.message });
  }
});

// --- Get current client ---
app.get('/clients/me', (req, res) => {
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(auth, JWT_SECRET);
    const client = clients.get(payload.sub);
    if (!client) return res.status(404).json({ error: 'client not found' });
    res.json(client);
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

app.listen(3000, () => console.log('Listening on 3000'));
```

---

## OpenAPI (YAML) Starter

```yaml
openapi: 3.0.3
info:
  title: Profile & Auth API
  version: "1.0.0"
servers:
  - url: "{{baseUrl}}"
paths:
  /auth/wallet/nonce:
    post:
      summary: Issue a nonce for wallet signature
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [address, purpose]
              properties:
                address: { type: string }
                chainId: { type: integer }
                purpose: { type: string, enum: [login, create, link, delete] }
      responses:
        '200':
          description: Nonce issued
          content:
            application/json:
              schema:
                type: object
                properties:
                  address: { type: string }
                  nonce: { type: string }
                  purpose: { type: string }
                  issuedAt: { type: string, format: date-time }
                  expiresAt: { type: string, format: date-time }

  /auth/wallet/verify:
    post:
      summary: Verify signed wallet message and issue tokens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [address, message, signature, purpose]
              properties:
                address: { type: string }
                message: { type: string }
                signature: { type: string }
                purpose: { type: string, enum: [login, create, link, delete] }
      responses:
        '200':
          description: Verified
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken: { type: string }
                  client: { type: object }
```

---

## Postman Collection Template

```json
{
  "info": {
    "name": "Profile Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "description": "Collection for profile and authentication endpoints (wallet & traditional)"
  },
  "item": [
    {
      "name": "Request Wallet Nonce",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"address\":\"{{walletAddress}}\",\"purpose\":\"create\"}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/wallet/nonce",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "wallet", "nonce"]
        }
      }
    },
    {
      "name": "Verify Wallet Signature",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"address\":\"{{walletAddress}}\",\"message\":\"...\",\"signature\":\"{{signature}}\",\"purpose\":\"create\"}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/wallet/verify",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "wallet", "verify"]
        }
      }
    },
    {
      "name": "Get Current Client",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }],
        "url": {
          "raw": "{{baseUrl}}/clients/me",
          "host": ["{{baseUrl}}"],
          "path": ["clients", "me"]
        }
      }
    }
  ],
  "variable": [
    { "key": "baseUrl", "value": "https://api.example.com" },
    { "key": "walletAddress", "value": "0x..." },
    { "key": "signature", "value": "0x..." },
    { "key": "accessToken", "value": "" }
  ]
}
```

---

## Authorization Summary

| Method | Pattern | Use Case |
|--------|---------|----------|
| **JWT (Bearer)** | `Authorization: Bearer <token>` | All authenticated client/admin endpoints |
| **API key** | `x-api-key` header | Server-to-server calls |
| **Signed payloads** | `x-auth-apikey` + `x-auth-signature` | HMAC/RSA verified requests (Dr. Green DApp API) |
| **Wallet-based** | Nonce → sign → verify → JWT | Primary Web3 auth flow |

---

## Relationship to Existing Codebase

| Current Component | Coverage | This Doc Adds |
|-------------------|----------|---------------|
| `wallet-auth` edge function | SIWE sign + NFT check + OTP session | Full nonce-based pattern (§1.1–1.2), link/delete purposes |
| `drgreen-proxy` | Client creation, cart, orders | Wallet linking (§3), sessions (§4), preferences (§5) |
| `docs/DRGREEN-API-FULL-REFERENCE.md` | Dr. Green DApp API | Profile/auth layer between frontend and DApp API |
