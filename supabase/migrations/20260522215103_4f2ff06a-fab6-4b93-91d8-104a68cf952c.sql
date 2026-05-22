
-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- Trigger-only functions: revoke EXECUTE from all API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_facture_paiement() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: only authenticated needs them (used inside policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_owns_entreprise(uuid) FROM PUBLIC, anon;

-- Numbering helpers: signed-in users only
REVOKE EXECUTE ON FUNCTION public.next_devis_numero(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.next_facture_numero(uuid) FROM PUBLIC, anon;
