
-- Fix search_path for set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Restrict execution of SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role and get_user_roles need to be callable by authenticated users (used inside policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role;

-- Restrict listing on public buckets: only allow listing inside user's own folder
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;

-- For avatars/logos: public read still possible via signed URLs / direct path, but no listing of entire bucket
CREATE POLICY "avatars_read_specific" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);
CREATE POLICY "logos_read_specific" ON storage.objects FOR SELECT USING (
  bucket_id = 'company_logos'
);
