CREATE OR REPLACE FUNCTION public.enforce_plan_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _user_id uuid;
  _plan plan_type;
  _count int;
  _limit int;
  _kind text := TG_ARGV[0];
  _month_start date := date_trunc('month', now())::date;
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN RETURN NEW; END IF;
  SELECT user_id INTO _user_id FROM public.entreprises WHERE id = NEW.entreprise_id;
  IF _user_id IS NULL THEN RETURN NEW; END IF;
  SELECT plan INTO _plan FROM public.profiles WHERE id = _user_id;
  IF _plan IS NULL OR _plan = 'business' THEN RETURN NEW; END IF;
  IF _kind = 'devis' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 3 WHEN 'starter' THEN 10 WHEN 'essentiel' THEN 20 WHEN 'pro' THEN 20 END;
    SELECT count(*) INTO _count FROM public.devis WHERE entreprise_id = NEW.entreprise_id AND date_emission >= _month_start;
  ELSIF _kind = 'factures' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 1 WHEN 'starter' THEN 5 WHEN 'essentiel' THEN 10 WHEN 'pro' THEN 10 END;
    SELECT count(*) INTO _count FROM public.factures WHERE entreprise_id = NEW.entreprise_id AND date_emission >= _month_start;
  ELSIF _kind = 'clients' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 5 WHEN 'starter' THEN 30 WHEN 'essentiel' THEN 50 WHEN 'pro' THEN 50 END;
    SELECT count(*) INTO _count FROM public.clients WHERE entreprise_id = NEW.entreprise_id;
  ELSE RETURN NEW;
  END IF;
  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan % atteinte (% % %). Passez au plan supérieur pour continuer.', CASE WHEN _plan = 'essentiel' THEN 'Pro' ELSE initcap(_plan::text) END, _limit, _kind, CASE WHEN _kind = 'clients' THEN 'maximum' ELSE '/ mois' END USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.enforce_plan_quota() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER clients_enforce_plan_quota BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_quota('clients');