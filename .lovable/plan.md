

## Cleanup: Remove Dead Code

Two small changes to remove legacy references that are no longer relevant after the role simplification.

### 1. useUserRole.ts — Remove dead `root_admin` check

Line 55 contains a fallback check for the removed `root_admin` role. This will be simplified to only check for `'admin'`.

### 2. Auth.tsx — Remove Dev Admin Bypass button

The "Dev Admin Bypass (Testing Only)" button (roughly lines 310-340) will be removed entirely. This was a development shortcut that should not ship to production.

---

### Technical Details

**File: `src/hooks/useUserRole.ts`**
- Remove the `|| role === 'root_admin'` condition from the `isAdmin` derivation around line 55.

**File: `src/pages/Auth.tsx`**
- Delete the entire Dev Admin Bypass `<Button>` block (the ghost button with the wrench emoji and its `onClick` handler that creates/signs in with `admin-test@healingbuds.dev`).

Both changes are safe removals with no downstream impact since `root_admin` no longer exists in the enum and the bypass button is a dev-only artifact.

