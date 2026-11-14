ALTER TABLE public.entreprises ADD COLUMN IF NOT EXISTS solde_initial numeric NOT NULL DEFAULT 0;
ALTER TABLE public.entreprises ADD COLUMN IF NOT EXISTS solde_initial_date date;

CREATE TABLE public.depenses_paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depense_id uuid NOT NULL REFERENCES public.depenses(id) ON DELETE CASCADE,
  montant numeric NOT NULL CHECK (montant > 0),
  date_paiement date NOT NULL DEFAULT CURRENT_DATE,
  mode text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.depenses_paiements TO authenticated;
GRANT ALL ON public.depenses_paiements TO service_role;
ALTER TABLE public.depenses_paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own depense paiements" ON public.depenses_paiements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.depenses d WHERE d.id = depense_id AND public.user_owns_entreprise(d.entreprise_id)));
CREATE POLICY "users add own depense paiements" ON public.depenses_paiements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.depenses d WHERE d.id = depense_id AND public.user_owns_entreprise(d.entreprise_id)));
CREATE POLICY "users delete own depense paiements" ON public.depenses_paiements FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.depenses d WHERE d.id = depense_id AND public.user_owns_entreprise(d.entreprise_id)));

-- Backfill: existing paid amounts become one payment on the expense date.
INSERT INTO public.depenses_paiements(depense_id, montant, date_paiement)
SELECT id, montant_paye, date_depense FROM public.depenses WHERE montant_paye > 0;

-- montant_paye is always the sum of payments (client values ignored on update).
CREATE OR REPLACE FUNCTION public.depense_sync_paye()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
BEGIN
  NEW.montant_paye := COALESCE((SELECT SUM(montant) FROM public.depenses_paiements WHERE depense_id = NEW.id), 0);
  IF NEW.montant_paye > NEW.montant THEN
    RAISE EXCEPTION 'Le montant ne peut pas être inférieur à ce qui est déjà payé (%).', NEW.montant_paye;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER depense_sync_paye_upd BEFORE UPDATE ON public.depenses FOR EACH ROW EXECUTE FUNCTION public.depense_sync_paye();

-- A payment given at creation becomes the first payment, dated on the expense date.
CREATE OR REPLACE FUNCTION public.depense_initial_paiement()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.montant_paye > 0 THEN
    IF NEW.montant_paye > NEW.montant THEN RAISE EXCEPTION 'Le montant payé dépasse le montant de la dépense.'; END IF;
    INSERT INTO public.depenses_paiements(depense_id, montant, date_paiement) VALUES (NEW.id, NEW.montant_paye, NEW.date_depense);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER depense_initial_paiement_ins AFTER INSERT ON public.depenses FOR EACH ROW EXECUTE FUNCTION public.depense_initial_paiement();

CREATE OR REPLACE FUNCTION public.depense_paiement_refresh()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _id uuid := COALESCE(NEW.depense_id, OLD.depense_id);
BEGIN
  UPDATE public.depenses SET updated_at = now() WHERE id = _id;
  RETURN NULL;
END $$;
CREATE TRIGGER depense_paiement_refresh_trg AFTER INSERT OR DELETE ON public.depenses_paiements FOR EACH ROW EXECUTE FUNCTION public.depense_paiement_refresh();