-- Allow admins to insert drgreen_clients records for any user (needed for client sync)
CREATE POLICY "Admins can insert drgreen clients"
ON public.drgreen_clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete drgreen_clients records (for re-registration cleanup)
CREATE POLICY "Admins can delete drgreen clients"
ON public.drgreen_clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));