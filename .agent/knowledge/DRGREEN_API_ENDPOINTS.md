# Dr. Green DApp API — Full Endpoint Reference

> **Source:** Dr. Green Postman workspace + project knowledge
> **Last Updated:** 2026-02-08
> **Base URL:** `https://api.drgreennft.com/api/v1`

---

## Authentication

All requests require:
- `x-auth-apikey` — Base64-encoded API key (sent as-is, no processing)
- `x-auth-signature` — secp256k1 ECDSA signature for `/dapp/*` endpoints, HMAC-SHA256 for `/strains`
- `Content-Type: application/json`

**Environments:** Only `production` and `railway` exist. All operations (read + write) use the same credentials per environment. No separate write keys.

See [DRGREEN-API-SIGNING-KNOWLEDGE.md](../../docs/DRGREEN-API-SIGNING-KNOWLEDGE.md) for signing details.

---

## NFT Endpoints

### List NFTs
```
GET /dapp/nfts?orderBy=desc&take=10&page=1
```
Fetches NFTs linked to or owned by the authenticated dApp.

---

## Client Endpoints

### List Clients
```
GET /dapp/clients?orderBy=desc&take=10&page=1
```
Returns all clients registered under the current API key's NFT scope.

### Get Client by ID
```
GET /dapp/clients/{clientId}
```

### Create Client
```
POST /dapp/clients
```
**Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required)",
  "phoneCode": "string (required, e.g. +44)",
  "phoneCountryCode": "string (required, e.g. GB)",
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
    "dob": "YYYY-MM-DD (required)",
    "gender": "string (required)",
    "medicalConditions": ["array of strings"],
    "otherMedicalCondition": "string (optional)",
    "medicinesTreatments": ["array of strings"],
    "otherMedicalTreatments": "string (optional)",
    "medicalHistory0": "boolean (required)",
    "medicalHistory1": "boolean (required)",
    "medicalHistory2": "boolean (required)",
    "medicalHistory3": "boolean (required)",
    "medicalHistory4": "boolean (required)",
    "medicalHistory5": ["array of strings (required)"],
    "medicalHistory6": "boolean (optional)",
    "medicalHistory7": ["array of strings (optional)"],
    "medicalHistory7Relation": "string (optional, if medicalHistory7 != 'none')",
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
**Note:** Optional fields with no value must be omitted entirely from the payload.

### Update Client
```
PATCH /dapp/clients/{clientId}
```

### Verify Client (KYC)
```
POST /dapp/clients/{clientId}/verify
```

### Activate / Deactivate Client
```
PATCH /dapp/clients/{clientId}/activate
PATCH /dapp/clients/{clientId}/deactivate
```

### Client Summary
```
GET /dapp/clients/summary
```
Returns aggregated client stats (total, verified, unverified counts).

### Bulk Delete Clients
```
DELETE /dapp/clients/bulk
```
**Body:**
```json
{
  "ids": ["clientId1", "clientId2"]
}
```

> **⚠️ Proxy discrepancy:** The proxy currently sends `POST /dapp/clients/bulk-delete` with `{ "clientIds": [...] }`. Postman confirms the API expects `DELETE /dapp/clients/bulk` with `{ "ids": [...] }`. Needs testing to confirm which the live API accepts.

### List Clients — Additional Query Parameters

The `GET /dapp/clients` endpoint also supports:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Search term |
| `searchBy` | string | `clientName` | Field to search by |

---

## Strain (Product) Endpoints

### List Strains
```
GET /strains?orderBy=desc&take=10&page=1&countryCode=ZAF
```
Filter by `countryCode` (ISO 3166-1 alpha-3).

### Get Strain by ID
```
GET /strains/{strainId}
```

---

## Cart Endpoints

### Get Cart
```
GET /dapp/carts/{clientId}
```
Retrieves the cart for a specific client.

### Add to Cart
```
POST /dapp/carts
```
**Body:**
```json
{
  "clientId": "string",
  "strainId": "string",
  "quantity": 1
}
```

### Update Cart Item
```
PATCH /dapp/carts/{cartItemId}
```

### Remove from Cart
```
DELETE /dapp/carts/{cartItemId}
```

### Empty Cart
```
DELETE /dapp/carts/client/{clientId}
```

---

## Order Endpoints

### List Orders
```
GET /dapp/orders?orderBy=desc&take=10&page=1
```

### Get Order by ID
```
GET /dapp/orders/{orderId}
```

### Create Order
```
POST /dapp/orders
```
**Body:**
```json
{
  "clientId": "string",
  "items": [
    {
      "strainId": "string",
      "quantity": 1,
      "price": 100.00
    }
  ],
  "shippingAddress": {
    "address1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "countryCode": "string",
    "postalCode": "string"
  },
  "currency": "ZAR"
}
```

### Update Order Status
```
PATCH /dapp/orders/{orderId}
```
**Body:**
```json
{
  "status": "pending | paid | shipped | delivered | cancelled",
  "paymentStatus": "pending | paid | failed | refunded"
}
```

---

## Sales / Dashboard Endpoints

### Sales Summary
```
GET /dapp/dashboard/sales?from=2025-01-01&to=2025-12-31
```

### Dashboard Analytics
```
GET /dapp/dashboard/analytics
```

---

## Proxy Action Mapping

The `drgreen-proxy` edge function maps frontend actions to these API endpoints:

| Frontend Action | HTTP Method | API Endpoint |
|----------------|-------------|-------------|
| `get-strains` | GET | `/strains` |
| `get-strain` | GET | `/strains/{id}` |
| `get-client` | GET | `/dapp/clients/{id}` |
| `dapp-clients` | GET | `/dapp/clients` |
| `create-client` | POST | `/dapp/clients` |
| `get-cart` | GET | `/dapp/carts/{clientId}` |
| `add-to-cart` | POST | `/dapp/carts` |
| `remove-from-cart` | DELETE | `/dapp/carts/{id}` |
| `get-orders` | GET | `/dapp/orders` |
| `create-order` | POST | `/dapp/orders` |
| `update-order` | PATCH | `/dapp/orders/{id}` |
| `dapp-nfts` | GET | `/dapp/nfts` |
| `sales-summary` | GET | `/dapp/dashboard/sales` |
| `dashboard-analytics` | GET | `/dapp/dashboard/analytics` |
| `activate-client` | PATCH | `/dapp/clients/{id}/activate` |
| `deactivate-client` | PATCH | `/dapp/clients/{id}/deactivate` |
| `bulk-delete-clients` | DELETE | `/dapp/clients/bulk` |
| `get-clients-summary` | GET | `/dapp/clients/summary` |
| `patch-client` | PATCH | `/dapp/clients/{id}` |
| `delete-client` | DELETE | `/dapp/clients/{id}` |

---

## Medical Questionnaire Options

See the custom knowledge base for the full list of medical questionnaire options and their exact string values. These must match exactly when submitting client creation payloads.

Key rules:
- Multi-select values are arrays of lowercase snake_case strings
- Boolean values are `true`/`false`
- If an optional field has no value, **omit the key entirely** from the payload
- The `medicalHistory7Relation` field is only included when `medicalHistory7` contains values other than "none"
