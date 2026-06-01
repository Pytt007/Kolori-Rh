-- Politique d'accès totale pour les admins sur la table user_roles
CREATE POLICY "user_roles_admin_all" ON public.user_roles 
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin')) 
WITH CHECK (public.has_role(auth.uid(), 'admin'));
