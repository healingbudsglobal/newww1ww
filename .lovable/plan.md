
# On-Chain NFT Ownership Verification for Admin Wallet Auth

## Overview

Replace the static `ADMIN_WALLET_ADDRESSES` list in the `wallet-auth` edge function with **live on-chain ERC-721 balanceOf verification** against the Dr. Green Digital Key NFT contract. Additionally, link the `healingbudsglobal@gmail.com` email to wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` so both auth methods resolve to the same account.

## Current Problem

The `wallet-auth` edge function uses a hardcoded fallback list and an `ADMIN_WALLET_ADDRESSES` secret to determine who can sign in as admin. This is:
- **Static**: New NFT holders must be manually added
- **Disconnected from reality**: The whole point of NFT-gated access is that the blockchain IS the access list
- **Not aligned with the Dr. Green model**: The Digital Key NFT is designed to be the licensing/access layer

## Solution: On-Chain Verification via `eth_call`

The edge function will make a direct JSON-RPC call to Ethereum mainnet to check if the connecting wallet holds a Dr. Green Digital Key NFT (contract `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a`).

### How It Works

```text
1. User connects MetaMask and signs auth message (unchanged)
2. Edge function verifies signature (unchanged)
3. NEW: Edge function calls Ethereum via public RPC
   - Encodes ERC-721 balanceOf(walletAddress) call
   - Sends eth_call to the NFT contract
   - Checks if balance > 0
4. If wallet holds NFT -> authorized as admin
5. If not -> 403 Forbidden
6. Create/find Supabase user and assign admin role (unchanged)
```

### RPC Call Details

The `balanceOf` function selector is `0x70a08231`. The call is:

```text
POST https://eth.llamarpc.com (free, no API key needed)

{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a",
    "data": "0x70a08231000000000000000000000000<wallet_address_without_0x>"
  }, "latest"],
  "id": 1
}
```

Response: hex-encoded uint256 balance. If > 0, wallet holds NFT.

### Fallback Strategy

The function will use a **layered verification approach**:

1. **Primary**: On-chain NFT ownership check via Ethereum RPC
2. **Fallback**: If the RPC call fails (network issue, rate limit), fall back to the `ADMIN_WALLET_ADDRESSES` secret list
3. **Logging**: Log which method was used for audit purposes

This ensures admin access is never locked out by a temporary RPC outage.

## Account Linking: healingbudsglobal@gmail.com + Wallet

### Problem

Currently, if the admin signs in via email/password with `healingbudsglobal@gmail.com`, they get one Supabase user. If they sign in via wallet, they get a different user (`0x0b60d85...@wallet.healingbuds`). This creates two separate accounts.

### Solution

When a wallet-authenticated user is created or logs in, the edge function will:

1. Check if an existing user with `healingbudsglobal@gmail.com` (or any email matching a known mapping) already exists
2. If found, update that user's metadata to include the wallet address and reuse that user ID
3. If not found, create a new wallet-derived user as before

This will be implemented via a `wallet_email_map` lookup in the edge function. For now, this is a simple hardcoded mapping:

```text
0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84 -> healingbudsglobal@gmail.com
```

In future, this could be stored in the database for dynamic mapping.

## Changes Required

### File 1: `supabase/functions/wallet-auth/index.ts`

**Replace** the `getAuthorizedWallets()` function with a new `checkNFTOwnership()` function that:
- Makes an `eth_call` to `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` on Ethereum mainnet
- Encodes the `balanceOf(address)` call data using the function selector `0x70a08231`
- Parses the hex response to get the NFT balance
- Returns `true` if balance > 0
- Falls back to `ADMIN_WALLET_ADDRESSES` if the RPC call fails
- Uses a 10-second timeout for the RPC call

**Update** the user creation/lookup logic to:
- Check for an existing user matching `healingbudsglobal@gmail.com` when wallet `0x0b60d85...` connects
- Reuse that existing user account instead of creating a `@wallet.healingbuds` user
- Update the existing user's metadata to include `wallet_address` and `auth_method: 'wallet'`

**Add** the NFT contract address as a constant:
```text
DR_GREEN_NFT_CONTRACT = "0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a"
ETHEREUM_RPC_URL = "https://eth.llamarpc.com" (free, no key needed)
```

### File 2: `supabase/config.toml`

Add `verify_jwt = false` for the wallet-auth function (required for it to work with the signing-keys system).

### No Other File Changes

- The frontend (`useWalletAuth.ts`, `Auth.tsx`) remains unchanged -- it already sends the correct payload
- The NFT ownership hooks (`useNFTOwnership.ts`) remain unchanged -- they are used client-side for UI gating, separate from server-side auth

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| RPC provider could be spoofed | Use multiple fallback RPC endpoints; the `ADMIN_WALLET_ADDRESSES` secret acts as a safety net |
| RPC provider could be rate-limited | 10-second timeout with fallback to static list |
| NFT could be transferred after login | Session tokens are short-lived (configurable); re-auth required periodically |
| Free RPC endpoint reliability | Llama RPC is reliable for simple `eth_call`; no state-changing operations needed |
| Wallet-email mapping is hardcoded | Acceptable for a single admin; can be moved to database later if more admins are added |

## Testing Plan

After deployment:
1. Test wallet sign-in with the NFT-holding wallet (`0x0b60d85...`) -- should succeed
2. Test wallet sign-in with a random wallet that does NOT hold the NFT -- should get 403
3. Verify that the Supabase user created has `healingbudsglobal@gmail.com` as the email (not a wallet-derived email)
4. Verify the admin role is assigned in `user_roles`
5. Check edge function logs to confirm on-chain verification is logged
