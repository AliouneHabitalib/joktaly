
-- Block self plan upgrades via a trigger; only service_role can change plan fields
CREATE OR REPLACE FUNCTION public.prevent_profile_plan_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
    RAISE EXCEPTION 'Modification du plan interdite';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_plan_self_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_plan_self_update ON public.profiles;
CREATE TRIGGER profiles_prevent_plan_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_plan_self_update();
