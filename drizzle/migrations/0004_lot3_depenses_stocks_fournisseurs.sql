CREATE TABLE public.fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom text NOT NULL,
  telephone text, email text, adresse text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fournisseurs TO authenticated;
GRANT ALL ON public.fournisseurs TO service_role;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users CRUD fournisseurs of own entreprise" ON public.fournisseurs FOR ALL TO authenticated
  USING (public.user_owns_entreprise(entreprise_id)) WITH CHECK (public.user_owns_entreprise(entreprise_id));

CREATE TABLE public.depenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  fournisseur_id uuid REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  categorie text NOT NULL DEFAULT 'Autre',
  description text,
  montant numeric NOT NULL DEFAULT 0 CHECK (montant >= 0),
  montant_paye numeric NOT NULL DEFAULT 0 CHECK (montant_paye >= 0),
  justificatif_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.depenses TO authenticated;
GRANT ALL ON public.depenses TO service_role;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users CRUD depenses of own entreprise" ON public.depenses FOR ALL TO authenticated
  USING (public.user_owns_entreprise(entreprise_id)) WITH CHECK (public.user_owns_entreprise(entreprise_id));

CREATE TABLE public.stock_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom text NOT NULL,
  reference text,
  unite text NOT NULL DEFAULT 'unité',
  quantite numeric NOT NULL DEFAULT 0,
  prix_achat numeric NOT NULL DEFAULT 0,
  seuil_alerte numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_articles TO authenticated;
GRANT ALL ON public.stock_articles TO service_role;
ALTER TABLE public.stock_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users CRUD stock of own entreprise" ON public.stock_articles FOR ALL TO authenticated
  USING (public.user_owns_entreprise(entreprise_id)) WITH CHECK (public.user_owns_entreprise(entreprise_id));

CREATE TABLE public.stock_mouvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.stock_articles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entree','sortie')),
  quantite numeric NOT NULL CHECK (quantite > 0),
  date_mouvement date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_mouvements TO authenticated;
GRANT ALL ON public.stock_mouvements TO service_role;
ALTER TABLE public.stock_mouvements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read mouvements of own stock" ON public.stock_mouvements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stock_articles a WHERE a.id = article_id AND public.user_owns_entreprise(a.entreprise_id)));
CREATE POLICY "users add mouvements to own stock" ON public.stock_mouvements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stock_articles a WHERE a.id = article_id AND public.user_owns_entreprise(a.entreprise_id)));

CREATE OR REPLACE FUNCTION public.apply_stock_mouvement()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _q numeric;
BEGIN
  SELECT quantite INTO _q FROM public.stock_articles WHERE id = NEW.article_id FOR UPDATE;
  IF NEW.type = 'sortie' AND _q < NEW.quantite THEN
    RAISE EXCEPTION 'Stock insuffisant (disponible : %)', _q;
  END IF;
  UPDATE public.stock_articles
    SET quantite = quantite + CASE WHEN NEW.type = 'entree' THEN NEW.quantite ELSE -NEW.quantite END,
        updated_at = now()
  WHERE id = NEW.article_id;
  RETURN NEW;
END $$;
CREATE TRIGGER stock_mouvement_apply BEFORE INSERT ON public.stock_mouvements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_mouvement();

CREATE OR REPLACE FUNCTION public.check_depense_fournisseur()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.fournisseur_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.fournisseurs f WHERE f.id = NEW.fournisseur_id AND f.entreprise_id = NEW.entreprise_id) THEN
    RAISE EXCEPTION 'Fournisseur invalide';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER depense_fournisseur_check BEFORE INSERT OR UPDATE ON public.depenses
  FOR EACH ROW EXECUTE FUNCTION public.check_depense_fournisseur();

CREATE TRIGGER fournisseurs_updated BEFORE UPDATE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER depenses_updated BEFORE UPDATE ON public.depenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "justificatifs read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'justificatifs' AND public.user_owns_entreprise(((storage.foldername(name))[1])::uuid));
CREATE POLICY "justificatifs insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'justificatifs' AND public.user_owns_entreprise(((storage.foldername(name))[1])::uuid));
CREATE POLICY "justificatifs delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'justificatifs' AND public.user_owns_entreprise(((storage.foldername(name))[1])::uuid));