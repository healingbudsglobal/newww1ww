
# Plan: Insert Client Records to Enable Checkout

## Problem
The `drgreen_clients` table is **empty** - this is why checkout fails. The client linking for Kayliegh and Scott was never actually executed.

## Solution
Execute a single database INSERT to link both users to their Dr. Green client IDs.

## Database Migration

**SQL to Execute:**
```sql
INSERT INTO public.drgreen_clients (
  user_id,
  drgreen_client_id,
  email,
  full_name,
  country_code,
  is_kyc_verified,
  admin_approval
) VALUES 
(
  '7b4c7b03-7630-46e3-9337-4c56cad600c8',  -- Kayliegh's Supabase user ID
  '47542db8-3982-4204-bd32-2f36617c5d3d',  -- Her Dr. Green client ID
  'kayliegh.sm@gmail.com',
  'Kayliegh Moutinho',
  'ZA',
  true,
  'VERIFIED'
),
(
  'f9ceca52-abd4-4da7-a747-e8fa1e971867',  -- Scott's Supabase user ID
  'fb70d208-8f12-4444-9b1b-e92bd68f675f',  -- His Dr. Green client ID  
  'scott@healingbuds.global',
  'Healing Buds',
  'ZA',
  true,
  'VERIFIED'
);
```

## What This Enables

Once inserted:
- ✅ Kayliegh can browse shop (country_code = ZA)
- ✅ Kayliegh can add items to cart
- ✅ Checkout will find her `drgreen_client_id` for order creation
- ✅ Shipping address fetched from Dr. Green API (or fallback form shown)
- ✅ Same for Scott

## Files Modified

| Type | Change |
|------|--------|
| Database | INSERT 2 records into `drgreen_clients` |

## Testing After Insert

1. Kayliegh logs in via MetaMask/wallet
2. Navigates to `/shop` 
3. Adds products to cart (prices show in ZAR - ~R190)
4. Proceeds to checkout
5. Enters shipping address (fallback form)
6. Places order

No code changes needed - this is a one-time data fix.
