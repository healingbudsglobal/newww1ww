

## Fix Dr. Green API Private Key and Confirm Regional Gating

### 1. Update DRGREEN_PRIVATE_KEY Secret

The root cause of the 500 error is that the `DRGREEN_PRIVATE_KEY` secret currently contains an **EC Public Key** (SubjectPublicKeyInfo format) instead of a private key. This means the proxy cannot sign API requests.

**Action required from you:** You need to provide the correct secp256k1 private key from the Dr. Green DApp dashboard. I will prompt you to enter it securely.

The expected format is a Base64-encoded private key (either raw 32-byte key, SEC1/DER, or PKCS#8 PEM format). The proxy already supports all three formats.

---

### 2. Regional Gating - Already Correct (Confirmation)

The current architecture already matches the requested behavior:

```text
Region        | Browse Products | Add to Cart | Checkout/Orders
--------------+-----------------+-------------+-----------------
ZA (.co.za)   | Yes (open)      | Yes*        | Requires verification
TH (.co.th)   | Yes (open)      | Yes*        | Requires verification
GB (.co.uk)   | Requires login  | Yes*        | Requires verification
PT (.pt)      | Requires login  | Yes*        | Requires verification
```

*Cart requires login; Checkout requires full KYC + admin approval.

- `/shop` page: No `ComplianceGuard` -- uses `RestrictedRegionGate` internally, which only blocks GB/PT
- `/checkout` and `/orders`: Wrapped in `ComplianceGuard` -- requires authentication + verification for all regions
- South Africa (ZA) and Thailand (TH): Products display freely without login

No code changes needed for gating -- it is working as designed.

---

### Technical Summary

| Item | Status |
|------|--------|
| Regional gate (ZA browsing) | Already correct - no changes needed |
| Checkout/orders gating | Already correct - ComplianceGuard enforces verification |
| DRGREEN_PRIVATE_KEY | Needs replacement - currently contains a public key |
| Proxy signing code | Already supports multiple key formats - no changes needed |

