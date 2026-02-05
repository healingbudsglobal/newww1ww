## Visual Edits Plan

### Summary of Required Changes

Based on the previous conversation, the following visual edits were requested but not yet completed:

---

## 1. Remove Quick Login (Dev) Dropdown from Auth Page

**File:** `src/pages/Auth.tsx`

**Current State (lines 300-340):**
The "Quick Login (Dev)" dropdown with Admin and Kayliegh options is still present.

**Action:** Remove the entire dropdown block:

```tsx
// DELETE this entire block (lines 300-340):
{isLogin && !isForgotPassword && (
  <div className="px-8 pt-4">
    <DropdownMenu>
      {/* ... entire dropdown ... */}
    </DropdownMenu>
  </div>
)}
```

---

## 2. Rename "Cultivar" to "Strains" Globally

Found **233 matches in 10 files**. Changes required:

| File                                        | Changes                                                              |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `src/App.tsx`                               | Rename route `/shop/cultivar/:cultivarId` → `/shop/strain/:strainId` |
| `src/pages/CultivarDetail.tsx`              | Rename file to `StrainDetail.tsx`, update component name             |
| `src/components/shop/CultivarQuickView.tsx` | Rename to `StrainQuickView.tsx`, update component/props              |
| `src/components/shop/ProductCard.tsx`       | Update navigation path                                               |
| `src/components/shop/ProductGrid.tsx`       | Update import and component usage                                    |
| `src/i18n/locales/en/shop.json`             | Replace "cultivars" → "strains"                                      |
| `src/i18n/locales/pt/shop.json`             | Replace "cultivares" → "estirpes" (strains in Portuguese)            |
| `src/pages/Shop.tsx`                        | Update SEO text                                                      |

---

## 3. Update CTAs for Verified Registered Clients

**File:** `src/pages/Index.tsx`

**Current State (lines 124-131):**
The primary CTA always shows "Check Eligibility" for all users.

**Required Change:** For verified users (`isEligible === true`), show "Browse Strains" instead:

```tsx
// Hero CTA (around line 124)
{isEligible ? (
  <Button
    size="lg"
    className="text-lg px-8 py-6 bg-highlight hover:bg-highlight/90 text-highlight-foreground shadow-lg"
    onClick={() => navigate('/shop')}
  >
    Browse Strains
    <ArrowRight className="ml-2 w-5 h-5" />
  </Button>
) : (
  <Button
    size="lg"
    className="text-lg px-8 py-6 bg-highlight hover:bg-highlight/90 text-highlight-foreground shadow-lg"
    onClick={() => navigate('/eligibility')}
  >
    Check Eligibility
    <ArrowRight className="ml-2 w-5 h-5" />
  </Button>
)}
```

**Also update the "Get Started" section (lines 373-381):**

```tsx
// Change for verified users
{isEligible ? (
  <Button onClick={() => navigate('/shop')}>
    Browse Our Strains
    <ArrowRight className="ml-2 w-5 h-5" />
  </Button>
) : (
  <Button onClick={() => navigate('/eligibility')}>
    Start Medical Assessment
    <ArrowRight className="ml-2 w-5 h-5" />
  </Button>
)}
```

---

## Files to Modify

| File                                        | Change                                      |
| ------------------------------------------- | ------------------------------------------- |
| `src/pages/Auth.tsx`                        | Remove Quick Login dropdown (lines 300-340) |
| `src/pages/Index.tsx`                       | Dynamic CTAs based on eligibility           |
| `src/App.tsx`                               | Update route path from cultivar to strain   |
| `src/pages/CultivarDetail.tsx`              | Rename to `StrainDetail.tsx`                |
| `src/components/shop/CultivarQuickView.tsx` | Rename to `StrainQuickView.tsx`             |
| `src/components/shop/ProductCard.tsx`       | Update navigation path                      |
| `src/components/shop/ProductGrid.tsx`       | Update imports                              |
| `src/i18n/locales/en/shop.json`             | Replace cultivar terminology                |
| `src/i18n/locales/pt/shop.json`             | Replace cultivar terminology                |
| `src/pages/Shop.tsx`                        | Update SEO/meta text                        |

---

## Testing Steps

After implementation:

1. Verify Auth page no longer shows Quick Login dropdown
2. Log in as Kayliegh (verified patient) and confirm homepage shows "Browse Strains"
3. Log out and confirm homepage shows "Check Eligibility"
4. Navigate to `/shop` and click a product → verify URL is `/shop/strain/{id}`
5. Search for "cultivar" in codebase → should return 0 results
