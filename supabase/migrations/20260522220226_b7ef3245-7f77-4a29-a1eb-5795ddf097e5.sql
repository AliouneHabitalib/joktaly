
CREATE OR REPLACE FUNCTION public.enforce_plan_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _plan plan_type;
  _count int;
  _limit int;
  _kind text := TG_ARGV[0];
  _month_start date := date_trunc('month', now())::date;
BEGIN
  -- Service role bypasses quota
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO _user_id FROM public.entreprises WHERE id = NEW.entreprise_id;
  IF _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO _plan FROM public.profiles WHERE id = _user_id;
  IF _plan IS NULL OR _plan <> 'starter' THEN
    RETURN NEW; -- pro/business = unlimited
  END IF;

  IF _kind = 'devis' THEN
    _limit := 10;
    SELECT count(*) INTO _count FROM public.devis
      WHERE entreprise_id = NEW.entreprise_id
        AND date_emission >= _month_start;
  ELSIF _kind = 'factures' THEN
    _limit := 5;
    SELECT count(*) INTO _count FROM public.factures
      WHERE entreprise_id = NEW.entreprise_id
        AND date_emission >= _month_start;
  ELSE
    RETURN NEW;
  END IF;

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan Starter atteinte (% % / mois). Passez au plan Pro pour continuer.', _limit, _kind
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_plan_quota() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS devis_enforce_plan_quota ON public.devis;
CREATE TRIGGER devis_enforce_plan_quota
BEFORE INSERT ON public.devis
FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_quota('devis');

DROP TRIGGER IF EXISTS factures_enforce_plan_quota ON public.factures;
CREATE TRIGGER factures_enforce_plan_quota
BEFORE INSERT ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_quota('factures');
