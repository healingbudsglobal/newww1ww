

## Client Lookup Results — All Environments

### Finding
**All 3 credential sets (production, alt-production, production-write) return HTTP 401** for both `/dapp/clients` and `/dapp/clients/list` endpoints.

This means none of our current API keys have permission to list clients from the Dr. Green API.

### What Was Tested
| Environment | `/dapp/clients` | `/dapp/clients/list` |
|-------------|----------------|---------------------|
| Production | 401 Unauthorized | 401 Unauthorized |
| Alt-Production | 401 Unauthorized | 401 Unauthorized |
| Production-Write | 401 Unauthorized | 401 Unauthorized |

### Implication
- The API credentials may have had their client-listing permissions revoked or changed
- The health check (`/strains`) still works, so the credentials themselves are valid
- Kayliegh and Scott cannot be looked up via the API with current credentials

### Changes Made (Reverted)
- `PUBLIC_ACTIONS` was temporarily opened and has been reverted to `[]`
- `admin-list-all-clients` was added to `DEBUG_ACTIONS` (still there, harmless)
- The multi-env scan logic was reverted to the original single-env implementation

### Next Steps
1. **Contact Dr. Green team** to verify if `/dapp/clients` endpoint permissions have changed
2. **Try creating fresh test clients** via the `create-client` action (POST) to test if write access still works
3. **Log in via wallet auth** and test the admin dashboard client manager (which may use a different flow)
