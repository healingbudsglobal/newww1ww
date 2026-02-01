
# Plan: Admin Role Management UI

## Overview

Create a new admin page for managing user roles that allows administrators to:
- View all registered users with their current roles
- Assign roles (admin, moderator, user)
- Remove roles from users
- Search and filter users

## Architecture

The system already has:
- `user_roles` table with proper RLS policies
- `app_role` enum: `admin | moderator | user`
- `has_role()` RPC function for role checking
- `AdminLayout` component for consistent admin UI

## Implementation Plan

### 1. Create New Admin Component: `AdminUserRoles.tsx`

**Location:** `src/components/admin/AdminUserRoles.tsx`

A CRM-style data table component that displays:
- User email
- User name (from profiles)
- Current role(s)
- Account creation date
- Role assignment controls

**Features:**
- Search by email or name
- Filter by role (All / Admin / Moderator / User / No Role)
- Assign/remove role buttons with confirmation
- Visual role badges

### 2. Create New Admin Page: `AdminRoles.tsx`

**Location:** `src/pages/AdminRoles.tsx`

Page wrapper using `AdminLayout` with title "User Role Management"

### 3. Add Route to App.tsx

```
/admin/roles → AdminRoles
```

### 4. Update AdminLayout Navigation

Add "User Roles" navigation item in sidebar:
```typescript
{ to: "/admin/roles", label: "User Roles", icon: Shield }
```

---

## Technical Details

### Data Fetching Strategy

Since we cannot directly query `auth.users` from the client due to security restrictions, we'll:
1. Query `profiles` table (linked to auth.users by id)
2. Left join with `user_roles` to get current roles
3. Use Supabase client API for role operations

```typescript
// Fetch users with roles
const { data: users } = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    created_at,
    user_roles (role)
  `)
  .order('created_at', { ascending: false });
```

### Role Assignment Operations

```typescript
// Assign role
const assignRole = async (userId: string, role: app_role) => {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
};

// Remove role
const removeRole = async (userId: string, role: app_role) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);
};
```

### RLS Policy Verification

Current policies allow admins to manage roles:
- `Admins can manage roles` (ALL) - Using `has_role(auth.uid(), 'admin')`
- `Admins can view all roles` (SELECT)
- `Users can view their own roles` (SELECT)

---

## UI Components

### User Table Row

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 admin@healingbuds.test                                       │
│    Admin User                                                   │
│    Created: Jan 30, 2026                                        │
│                                                                 │
│    Roles: [ADMIN ✓]                                             │
│                                                                 │
│    [+ Add Role ▼]  [Remove Admin ✕]                             │
└─────────────────────────────────────────────────────────────────┘
```

### Filter Tabs

```
[All (3)] [Admins (1)] [Moderators (0)] [Users (0)] [No Role (2)]
```

### Role Badges

- Admin: Red badge with Shield icon
- Moderator: Blue badge with ShieldCheck icon
- User: Green badge with User icon

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/AdminUserRoles.tsx` | Main role management component |
| `src/pages/AdminRoles.tsx` | Page wrapper with AdminLayout |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/admin/roles` route |
| `src/layout/AdminLayout.tsx` | Add "User Roles" to navigation |

---

## Security Considerations

1. **Server-side validation**: All role operations go through Supabase RLS
2. **Admin-only access**: Component only renders for admins (via AdminLayout)
3. **Confirmation dialogs**: Role changes require confirmation
4. **Audit trail**: `created_at` timestamp on role assignments

## Edge Cases

1. **Self-demotion prevention**: Admin cannot remove their own admin role
2. **Last admin protection**: Cannot remove admin role if it's the only admin
3. **Empty states**: Handle users with no roles gracefully
4. **Error handling**: Display toast messages for failures

---

## Testing Checklist

After implementation:
1. Login as admin → navigate to `/admin/roles`
2. Verify all users are displayed with correct roles
3. Test assigning "moderator" role to a user without roles
4. Test removing a role from a user
5. Verify self-demotion prevention works
6. Test search functionality
7. Test filter tabs
