-- 1. Profils : impossible de s'attribuer une formule payante à la création
CREATE OR REPLACE FUNCTION public.prevent_profile_plan_self_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','') IN ('anon','authenticated') THEN
    NEW.plan := 'gratuit';
    NEW.plan_expires_at := NULL;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_plan_self_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS profiles_prevent_plan_self_insert ON public.profiles;
CREATE TRIGGER profiles_prevent_plan_self_insert BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_plan_self_insert();

-- 2. Devis/factures : client (et devis d'origine) de la même entreprise uniquement
CREATE OR REPLACE FUNCTION public.check_document_same_entreprise()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = NEW.client_id AND c.entreprise_id = NEW.entreprise_id) THEN
    RAISE EXCEPTION 'Client introuvable pour cette entreprise' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_TABLE_NAME = 'factures' AND NEW.devis_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.devis d WHERE d.id = NEW.devis_id AND d.entreprise_id = NEW.entreprise_id) THEN
    RAISE EXCEPTION 'Devis introuvable pour cette entreprise' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.check_document_same_entreprise() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS devis_same_entreprise ON public.devis;
CREATE TRIGGER devis_same_entreprise BEFORE INSERT OR UPDATE OF client_id, entreprise_id ON public.devis
FOR EACH ROW EXECUTE FUNCTION public.check_document_same_entreprise();
DROP TRIGGER IF EXISTS factures_same_entreprise ON public.factures;
CREATE TRIGGER factures_same_entreprise BEFORE INSERT OR UPDATE OF client_id, entreprise_id, devis_id ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.check_document_same_entreprise();

-- 3. Abonnements : lecture de ses propres abonnements rétablie, écritures client toujours interdites
DROP POLICY IF EXISTS "Deny client writes on abonnements" ON public.abonnements;
CREATE POLICY "Deny client insert on abonnements" ON public.abonnements AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny client update on abonnements" ON public.abonnements AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Deny client delete on abonnements" ON public.abonnements AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "admins view abonnements" ON public.abonnements FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Formule effective : une formule payante expirée vaut Gratuit
CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS plan_type LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN p.plan = 'gratuit' THEN 'gratuit'::plan_type
    WHEN p.plan_expires_at IS NOT NULL AND p.plan_expires_at < now() THEN 'gratuit'::plan_type
    ELSE p.plan END
  FROM public.profiles p WHERE p.id = _user_id
$$;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_plan_quota()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid; _plan plan_type; _count int; _limit int;
  _kind text := TG_ARGV[0];
  _month_start date := date_trunc('month', now())::date;
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN RETURN NEW; END IF;
  SELECT user_id INTO _user_id FROM public.entreprises WHERE id = NEW.entreprise_id;
  IF _user_id IS NULL THEN RETURN NEW; END IF;
  _plan := coalesce(public.effective_plan(_user_id), 'gratuit');
  IF _plan = 'business' THEN RETURN NEW; END IF;

  IF _kind = 'devis' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 3 WHEN 'starter' THEN 10 ELSE 20 END;
    SELECT count(*) INTO _count FROM public.devis WHERE entreprise_id = NEW.entreprise_id AND created_at >= _month_start;
  ELSIF _kind = 'factures' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 1 WHEN 'starter' THEN 5 ELSE 10 END;
    SELECT count(*) INTO _count FROM public.factures WHERE entreprise_id = NEW.entreprise_id AND created_at >= _month_start;
  ELSIF _kind = 'clients' THEN
    _limit := CASE _plan WHEN 'gratuit' THEN 5 WHEN 'starter' THEN 30 ELSE 50 END;
    SELECT count(*) INTO _count FROM public.clients WHERE entreprise_id = NEW.entreprise_id;
  ELSE
    RETURN NEW;
  END IF;

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan % atteinte (% % ). Passez au plan supérieur pour continuer.', _plan, _limit, _kind
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;