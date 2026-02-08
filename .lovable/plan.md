
## Definitive API Diagnostic Results — Client Listing

### Test: All 3 Environments × 2 Endpoints

| Environment | `/strains` | `/dapp/clients` |
|-------------|-----------|-----------------|
| Production (`DRGREEN_API_KEY`) | ✅ 200 OK | ❌ 401 Unauthorized |
| Alt-Production (`DRGREEN_ALT_API_KEY`) | ✅ 200 OK | ❌ 401 Unauthorized |
| Production-Write (`DRGREEN_WRITE_API_KEY`) | ✅ 200 OK | ❌ 401 Unauthorized |

### Key Details
- All 3 credential sets have API key length 232, prefix `LS0tLS1CRUdJ...` (Base64-encoded PEM)
- All 3 credential sets have private key length 316
- Signing method (HMAC-SHA256 on query string) is **confirmed correct** — `/strains` works
- The 401 on `/dapp/clients` is an **API authorization issue**, not a signing/credential bug

### Root Cause
The `/dapp/clients` endpoint requires NFT-scoped permissions that none of our 3 credential sets currently possess. The `/strains` endpoint is likely a non-scoped (global) endpoint that works with any valid API key.

This is consistent with the Dr. Green API's NFT-scoped access model:
> "Each API key pair is associated with a specific NFT and dApp identity. Client records created with Key A cannot be accessed by Key B."

### Current State
- `admin-list-all-clients` is in `DEBUG_ACTIONS` (harmless, still requires debug key)
- `PUBLIC_ACTIONS` reverted to `[]`
- All temporary diagnostic changes reverted
- Proxy deployed clean

### Next Steps
1. **Contact Dr. Green team** — Request `/dapp/clients` read permission for the `healingbudscoza` NFT
2. **Alternatively, create fresh clients** via `POST /dapp/clients` (write may still work even if list doesn't)
3. **Verify NFT ownership** — Check the NFT contract `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` for our wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`
