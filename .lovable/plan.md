

## Update Admin Trigger to Support Both Emails

### What Changes
A single database migration to update the `auto_assign_admin_role()` function so it assigns the `admin` role to **both** emails on signup:

- `scott@healingbuds.global`
- `healingbudsglobal@gmail.com`

### Technical Details

**Migration SQL:**
```text
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('scott@healingbuds.global', 'healingbudsglobal@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
```

No other files or code changes are needed -- the trigger already exists, and this replaces the function body only.

### After Migration
You can sign up with either email to test admin auto-assignment. The trigger fires on `auth.users` INSERT, so the role will be assigned immediately upon account creation.
