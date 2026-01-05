-- Add admin policy to view all drgreen_clients for email management
CREATE POLICY "Admins can view all drgreen clients"
ON public.drgreen_clients
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update any drgreen_clients record
CREATE POLICY "Admins can update all drgreen clients"
ON public.drgreen_clients
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));