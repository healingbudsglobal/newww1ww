-- Auto-link drgreen_clients when a new user signs up with a matching email
CREATE OR REPLACE FUNCTION public.auto_link_drgreen_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.drgreen_clients
  SET user_id = NEW.id,
      updated_at = now()
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger fires after a new auth user is created
CREATE TRIGGER on_auth_user_created_link_drgreen
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_drgreen_client();
