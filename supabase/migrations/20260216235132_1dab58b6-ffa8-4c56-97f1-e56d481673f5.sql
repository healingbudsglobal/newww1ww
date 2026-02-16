
-- Make user_id nullable on drgreen_clients so unlinked Dr. Green clients can be stored
ALTER TABLE drgreen_clients ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable on drgreen_orders so unlinked orders can be stored
ALTER TABLE drgreen_orders ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy for admins to insert clients with null user_id
CREATE POLICY "Admins can insert any drgreen client"
ON drgreen_clients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to insert orders with null user_id
CREATE POLICY "Admins can insert any drgreen order"
ON drgreen_orders FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
