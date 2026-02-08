import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.4.0/sha3";
import { hmac } from "https://esm.sh/@noble/hashes@1.4.0/hmac";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256";

// Initialize secp256k1 HMAC (required for noble/secp256k1 v2)
secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  for (const msg of messages) h.update(msg);
  return h.digest();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Constants ────────────────────────────────────────────

/** Dr. Green Digital Key NFT contract on Ethereum mainnet */
const DR_GREEN_NFT_CONTRACT = '0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a';

/** Free public Ethereum RPC endpoints (tried in order) */
const ETHEREUM_RPC_URLS = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum-rpc.publicnode.com',
];

/** ERC-721 balanceOf(address) function selector */
const BALANCE_OF_SELECTOR = '0x70a08231';

/** RPC call timeout in milliseconds */
const RPC_TIMEOUT_MS = 10_000;

/**
 * Wallet-to-email mapping for account linking.
 * When a mapped wallet connects, the edge function reuses the existing
 * email-based Supabase user instead of creating a wallet-derived one.
 */
const WALLET_EMAIL_MAP: Record<string, string> = {
  '0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84': 'healingbudsglobal@gmail.com',
};

// ─── Helpers ───────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Recover Ethereum address from a signed message.
 * Implements EIP-191 personal_sign recovery using noble/secp256k1.
 */
function recoverAddress(message: string, signature: string): string {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${messageBytes.length}`);
  const prefixed = new Uint8Array(prefix.length + messageBytes.length);
  prefixed.set(prefix);
  prefixed.set(messageBytes, prefix.length);
  const messageHash = keccak_256(prefixed);

  const sigBytes = hexToBytes(signature);
  if (sigBytes.length !== 65) {
    throw new Error(`Invalid signature length: ${sigBytes.length}, expected 65`);
  }

  const r = BigInt('0x' + bytesToHex(sigBytes.slice(0, 32)));
  const s = BigInt('0x' + bytesToHex(sigBytes.slice(32, 64)));
  const v = sigBytes[64];
  const recovery = v >= 27 ? v - 27 : v;

  if (recovery !== 0 && recovery !== 1) {
    throw new Error(`Invalid recovery value: ${v}`);
  }

  const sig = new secp256k1.Signature(r, s).addRecoveryBit(recovery);
  const publicKey = sig.recoverPublicKey(messageHash);

  const pubKeyBytes = publicKey.toRawBytes(false).slice(1);
  const addressHash = keccak_256(pubKeyBytes);
  return '0x' + bytesToHex(addressHash.slice(-20));
}

// ─── On-Chain NFT Verification ────────────────────────────

/**
 * Check if a wallet holds a Dr. Green Digital Key NFT via on-chain
 * ERC-721 balanceOf call. Tries multiple RPC endpoints with timeout.
 *
 * @returns { ownsNFT: boolean, method: 'on-chain' | 'fallback', balance?: number }
 */
async function checkNFTOwnership(
  walletAddress: string
): Promise<{ ownsNFT: boolean; method: 'on-chain' | 'fallback'; balance?: number }> {
  const addressClean = walletAddress.toLowerCase().replace('0x', '');
  const callData = `${BALANCE_OF_SELECTOR}000000000000000000000000${addressClean}`;

  const rpcPayload = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: DR_GREEN_NFT_CONTRACT,
        data: callData,
      },
      'latest',
    ],
    id: 1,
  });

  // Try each RPC endpoint in sequence until one succeeds
  for (const rpcUrl of ETHEREUM_RPC_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rpcPayload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[wallet-auth] RPC ${rpcUrl} returned HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.warn(`[wallet-auth] RPC ${rpcUrl} returned error:`, data.error);
        continue;
      }

      // Parse hex balance (uint256)
      const hexBalance = data.result;
      if (!hexBalance || hexBalance === '0x') {
        console.warn(`[wallet-auth] RPC ${rpcUrl} returned empty result`);
        continue;
      }

      const balance = parseInt(hexBalance, 16);
      console.log(
        `[wallet-auth] On-chain NFT check via ${rpcUrl}: wallet=${walletAddress.slice(0, 10)}..., balance=${balance}`
      );

      return { ownsNFT: balance > 0, method: 'on-chain', balance };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[wallet-auth] RPC ${rpcUrl} failed: ${errMsg}`);
      continue;
    }
  }

  // ── Fallback: static ADMIN_WALLET_ADDRESSES secret ──
  console.warn('[wallet-auth] All RPC endpoints failed — falling back to ADMIN_WALLET_ADDRESSES');
  const fallbackWallets = getFallbackWallets();
  const isInFallback = fallbackWallets.includes(walletAddress.toLowerCase());
  return { ownsNFT: isInFallback, method: 'fallback' };
}

/**
 * Get fallback admin wallet addresses from the ADMIN_WALLET_ADDRESSES secret.
 */
function getFallbackWallets(): string[] {
  const envWallets = Deno.env.get('ADMIN_WALLET_ADDRESSES');
  if (envWallets) {
    return envWallets.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
  }
  // Hardcoded safety net
  return ['0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84'];
}

/**
 * Parse and validate the SIWE-style auth message.
 */
function parseAuthMessage(message: string): { wallet: string; timestamp: number } | null {
  try {
    const walletMatch = message.match(/Wallet:\s*(0x[a-fA-F0-9]{40})/);
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (!walletMatch || !timestampMatch) return null;
    return {
      wallet: walletMatch[1].toLowerCase(),
      timestamp: parseInt(timestampMatch[1], 10),
    };
  } catch {
    return null;
  }
}

// ─── Account Linking ──────────────────────────────────────

/**
 * Resolve the email to use for this wallet.
 * If a mapping exists, use the mapped email (account linking).
 * Otherwise, use the wallet-derived email.
 */
function resolveEmail(walletAddress: string): { email: string; isLinked: boolean } {
  const normalized = walletAddress.toLowerCase();
  const mappedEmail = WALLET_EMAIL_MAP[normalized];
  if (mappedEmail) {
    return { email: mappedEmail, isLinked: true };
  }
  return { email: `${normalized}@wallet.healingbuds`, isLinked: false };
}

// ─── Main Handler ──────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, signature, address } = await req.json();

    // ── Input validation ──
    if (!message || !signature || !address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, signature, address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Ethereum address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Parse message & validate timestamp (5 min window) ──
    const parsed = parseAuthMessage(message);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication message format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(now - parsed.timestamp) > fiveMinutes) {
      return new Response(
        JSON.stringify({ error: 'Authentication message expired. Please try again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Verify signature ──
    let recoveredAddress: string;
    try {
      recoveredAddress = recoverAddress(message, signature);
    } catch (err) {
      console.error('[wallet-auth] Signature recovery failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn(`[wallet-auth] Address mismatch: claimed=${address}, recovered=${recoveredAddress}`);
      return new Response(
        JSON.stringify({ error: 'Signature does not match the provided address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (parsed.wallet !== address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Message wallet does not match provided address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Check NFT ownership (on-chain with fallback) ──
    const nftResult = await checkNFTOwnership(address);
    console.log(
      `[wallet-auth] NFT verification: ownsNFT=${nftResult.ownsNFT}, method=${nftResult.method}, balance=${nftResult.balance ?? 'N/A'}`
    );

    if (!nftResult.ownsNFT) {
      console.warn(`[wallet-auth] Unauthorized wallet (no NFT): ${address.slice(0, 10)}...`);
      return new Response(
        JSON.stringify({
          error: 'This wallet is not authorized for admin access.',
          detail: 'Only wallets holding a Dr. Green Digital Key NFT can sign in as admin.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Resolve email (account linking) ──
    const { email: userEmail, isLinked } = resolveEmail(address);
    console.log(
      `[wallet-auth] Email resolved: ${userEmail} (linked=${isLinked})`
    );

    // ── Create/find Supabase user and generate session ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to find existing user by the resolved email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    let userId: string | null = null;
    let isNewUser = false;

    const existingUser = existingUsers?.users?.find(u => u.email === userEmail);

    // Also check for a legacy wallet-derived user that should be merged
    const walletEmail = `${address.toLowerCase()}@wallet.healingbuds`;
    const legacyWalletUser = isLinked
      ? existingUsers?.users?.find(u => u.email === walletEmail)
      : null;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[wallet-auth] Existing user found: ${userId.slice(0, 8)}... (email=${userEmail})`);

      // Update metadata to include wallet info
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          wallet_address: address.toLowerCase(),
          auth_method: 'wallet',
          nft_verified: true,
          nft_verification_method: nftResult.method,
        },
      });
    } else {
      // Create new user with the resolved email
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          wallet_address: address.toLowerCase(),
          auth_method: 'wallet',
          full_name: isLinked
            ? 'Admin'
            : `Admin (${address.slice(0, 6)}...${address.slice(-4)})`,
          nft_verified: true,
          nft_verification_method: nftResult.method,
        },
      });

      if (createError) {
        console.error('[wallet-auth] User creation failed:', createError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`[wallet-auth] New user created: ${userId.slice(0, 8)}... (email=${userEmail})`);
    }

    // Clean up legacy wallet-derived user if account was linked
    if (legacyWalletUser && legacyWalletUser.id !== userId) {
      console.log(
        `[wallet-auth] Legacy wallet user found (${legacyWalletUser.id.slice(0, 8)}...), ` +
        `linked account will be used instead`
      );
      // Note: We don't delete the legacy user automatically to avoid data loss.
      // It can be cleaned up manually or via an admin tool.
    }

    // ── Ensure admin role is assigned ──
    if (userId) {
      const { data: hasRole } = await adminClient.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (!hasRole) {
        const { error: roleError } = await adminClient
          .from('user_roles')
          .upsert(
            { user_id: userId, role: 'admin' },
            { onConflict: 'user_id,role' }
          );

        if (roleError) {
          console.error('[wallet-auth] Role assignment failed:', roleError.message);
        } else {
          console.log(`[wallet-auth] Admin role assigned to ${userId.slice(0, 8)}...`);
        }
      }
    }

    // ── Generate magic link token for session ──
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('[wallet-auth] Link generation failed:', linkError?.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate authentication session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const properties = linkData.properties;

    console.log(
      `[wallet-auth] Auth successful: wallet=${address.slice(0, 10)}..., ` +
      `email=${userEmail}, nft_method=${nftResult.method}, new=${isNewUser}, linked=${isLinked}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        email: userEmail,
        token: properties.email_otp,
        hashed_token: properties.hashed_token,
        is_new_user: isNewUser,
        is_linked_account: isLinked,
        nft_verification: nftResult.method,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[wallet-auth] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
