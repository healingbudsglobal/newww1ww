
-- Create team_commissions table
CREATE TABLE public.team_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  display_name TEXT NOT NULL,
  role_type TEXT NOT NULL,
  wallet_address TEXT,
  commission_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admins can read team_commissions"
ON public.team_commissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only insert
CREATE POLICY "Admins can insert team_commissions"
ON public.team_commissions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only update
CREATE POLICY "Admins can update team_commissions"
ON public.team_commissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only delete
CREATE POLICY "Admins can delete team_commissions"
ON public.team_commissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_team_commissions_updated_at
BEFORE UPDATE ON public.team_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
