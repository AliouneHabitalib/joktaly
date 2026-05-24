-- Change default plan to gratuit
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'gratuit'::plan_type;

-- Update quota enforcement to handle gratuit plan
CREATE OR REPLACE FUNCTION public.enforce_plan_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _plan plan_type;
  _count int;
  _limit int;
  _kind text := TG_ARGV[0];
  _month_start date := date_trunc('month', now())::date;
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO _user_id FROM public.entreprises WHERE id = NEW.entreprise_id;
  IF _user_id IS NULL THEN RETURN NEW; END IF;

  SELECT plan INTO _plan FROM public.profiles WHERE id = _user_id;
  IF _plan IS NULL OR _plan NOT IN ('gratuit','starter') THEN RETURN NEW; END IF;

  IF _kind = 'devis' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 3 WHEN 'starter' THEN 10 END;
    SELECT count(*) INTO _count FROM public.devis
      WHERE entreprise_id = NEW.entreprise_id AND date_emission >= _month_start;
  ELSIF _kind = 'factures' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 1 WHEN 'starter' THEN 5 END;
    SELECT count(*) INTO _count FROM public.factures
      WHERE entreprise_id = NEW.entreprise_id AND date_emission >= _month_start;
  ELSE
    RETURN NEW;
  END IF;

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan % atteinte (% % / mois). Passez au plan supérieur pour continuer.', _plan, _limit, _kind
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;