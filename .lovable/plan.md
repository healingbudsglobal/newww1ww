

## Add NFT Ownership Check Action and Verify On-Chain Balance

### What We Learned from the HAR File

The HAR capture from `dapp.drgreennft.com/profile` shows the DApp's initial page load but does NOT contain any API calls to `api.drgreennft.com`. The capture only includes:
- Static assets (JS, CSS, images) from CloudFront/S3
- WalletConnect WebSocket connection to `relay.walletconnect.org`
- An Ethereum RPC call via `eth.merkle.io` that queries on-chain data for wallet `0x0B60d85fEFcD9064A29f7DF0F8CBC7901B9e6C84`
- Google Fonts

To capture the actual API authentication headers for client listing, you would need to navigate to the Clients section within the DApp and capture a new HAR. However, we can still proceed with the NFT ownership verification right now.

### What We Will Build

Add an `nft-check` diagnostic action to the existing `wallet-auth` edge function. This allows us to verify NFT ownership on-chain without requiring a MetaMask signature, which we cannot produce programmatically from Lovable.

### Changes

**File: `supabase/functions/wallet-auth/index.ts`**

Add approximately 40 lines at the top of the main `serve()` handler, right after the CORS check and body parsing, before the existing signature validation logic:

```text
serve(async (req) => {
  // ... existing CORS handling (unchanged) ...

  const body = await req.json();

  // --- NEW: NFT Check Action (read-only diagnostic) ---
  if (body.action === 'nft-check') {
    // Validate address format
    // Call existing checkNFTOwnership(body.address)
    // Also check fallback admin list
    // Return: { ownsNFT, balance, method, contract, chainId, rpcUsed, checkedAt,
    //           isInAdminWhitelist, hasDbMapping }
  }

  // --- EXISTING: Full wallet auth flow (unchanged) ---
  const { message, signature, address } = body;
  // ... rest of existing code ...
});
```

The new action will:
1. Accept `{ action: "nft-check", address: "0x..." }`
2. Validate the address format (must be valid Ethereum address)
3. Call the existing `checkNFTOwnership()` function which tries 3 RPC endpoints
4. Also check whether the address is in the `ADMIN_WALLET_ADDRESSES` fallback list
5. Also check whether the address has a `wallet_email_mappings` DB entry
6. Return a comprehensive diagnostic result

**Response format:**
```json
{
  "address": "0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84",
  "ownsNFT": true,
  "balance": 2,
  "method": "on-chain",
  "contract": "0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a",
  "chainId": 1,
  "isInAdminWhitelist": true,
  "hasDbMapping": true,
  "mappedEmail": "healingbudsglobal@gmail.com",
  "checkedAt": "2026-02-08T22:35:00.000Z"
}
```

### Security

- This endpoint is read-only (blockchain data and admin list checks only)
- No session tokens are issued
- No authentication secrets are exposed
- The `balanceOf` call reads public blockchain state
- Email addresses from DB mappings are partially masked in the response (e.g., `hea***@gmail.com`)

### What This Tells Us

Once deployed and called, we will know definitively:
- Whether wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` holds any Dr. Green Digital Key NFTs on Ethereum mainnet
- The exact token balance
- Which RPC endpoint responded
- Whether the wallet is recognized in our admin whitelist and DB mappings

### Next Step After Verification

With NFT ownership confirmed, we can then:
1. Test client creation via `POST /dapp/clients` using `production-write` credentials
2. Request a new HAR capture from the Clients page of the DApp (not the Profile page) to see the actual API authentication headers
3. Implement the correct auth flow in our proxy based on those findings

### No Other Files Changed

This is a single-file, minimal modification. The existing auth flow is completely untouched -- we only add a new code path that triggers when `body.action === "nft-check"`.
