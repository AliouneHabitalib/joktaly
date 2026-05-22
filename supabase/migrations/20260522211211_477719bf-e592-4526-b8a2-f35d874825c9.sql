
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.plan_type AS ENUM ('starter', 'pro', 'business');
CREATE TYPE public.devis_statut AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');
CREATE TYPE public.facture_statut AS ENUM ('non_payee', 'partiellement_payee', 'payee', 'annulee');
CREATE TYPE public.produit_type AS ENUM ('produit', 'service');
CREATE TYPE public.mode_paiement AS ENUM ('virement', 'wave', 'orange_money', 'especes', 'cheque');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  telephone TEXT,
  plan plan_type NOT NULL DEFAULT 'starter',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ ENTREPRISES ============
CREATE TABLE public.entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  slogan TEXT,
  logo_url TEXT,
  adresse TEXT,
  ville TEXT,
  pays TEXT NOT NULL DEFAULT 'Sénégal',
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  ninea TEXT,
  rc TEXT,
  devise TEXT NOT NULL DEFAULT 'FCFA',
  tva_taux NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  couleur_primaire TEXT NOT NULL DEFAULT '#1D9E75',
  coordonnees_bancaires TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_entreprises_user ON public.entreprises(user_id);

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  entreprise_nom TEXT,
  email TEXT,
  telephone TEXT,
  whatsapp TEXT,
  adresse TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'Sénégal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_entreprise ON public.clients(entreprise_id);

-- ============ PRODUITS ============
CREATE TABLE public.produits_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type produit_type NOT NULL DEFAULT 'service',
  prix_unitaire NUMERIC(14,2) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'unité',
  tva_applicable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produits_services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_produits_entreprise ON public.produits_services(entreprise_id);

-- ============ DEVIS ============
CREATE TABLE public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  numero TEXT NOT NULL,
  titre TEXT,
  objet TEXT,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  statut devis_statut NOT NULL DEFAULT 'brouillon',
  tva_taux NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tva_active BOOLEAN NOT NULL DEFAULT true,
  remise_pourcent NUMERIC(5,2) NOT NULL DEFAULT 0,
  remise_montant NUMERIC(14,2) NOT NULL DEFAULT 0,
  sous_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  conditions_paiement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entreprise_id, numero)
);
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_devis_entreprise ON public.devis(entreprise_id);
CREATE INDEX idx_devis_client ON public.devis(client_id);

CREATE TABLE public.devis_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite NUMERIC(14,2) NOT NULL DEFAULT 1,
  unite TEXT NOT NULL DEFAULT 'unité',
  prix_unitaire NUMERIC(14,2) NOT NULL DEFAULT 0,
  tva_taux NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  total_ht NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devis_lignes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_devis_lignes_devis ON public.devis_lignes(devis_id);

-- ============ FACTURES ============
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  titre TEXT,
  objet TEXT,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  statut facture_statut NOT NULL DEFAULT 'non_payee',
  tva_taux NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tva_active BOOLEAN NOT NULL DEFAULT true,
  remise_pourcent NUMERIC(5,2) NOT NULL DEFAULT 0,
  remise_montant NUMERIC(14,2) NOT NULL DEFAULT 0,
  sous_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_paye NUMERIC(14,2) NOT NULL DEFAULT 0,
  mode_paiement mode_paiement,
  notes TEXT,
  conditions_paiement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entreprise_id, numero)
);
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_factures_entreprise ON public.factures(entreprise_id);
CREATE INDEX idx_factures_client ON public.factures(client_id);

CREATE TABLE public.factures_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite NUMERIC(14,2) NOT NULL DEFAULT 1,
  unite TEXT NOT NULL DEFAULT 'unité',
  prix_unitaire NUMERIC(14,2) NOT NULL DEFAULT 0,
  tva_taux NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  total_ht NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.factures_lignes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_factures_lignes_facture ON public.factures_lignes(facture_id);

-- ============ PAIEMENTS ============
CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  montant NUMERIC(14,2) NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  mode mode_paiement NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_paiements_facture ON public.paiements(facture_id);

-- ============ HELPER : entreprise of current user ============
CREATE OR REPLACE FUNCTION public.user_owns_entreprise(_entreprise_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.entreprises WHERE id = _entreprise_id AND user_id = auth.uid())
$$;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- entreprises
CREATE POLICY "users CRUD own entreprises" ON public.entreprises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- clients
CREATE POLICY "users CRUD clients of own entreprise" ON public.clients FOR ALL
  USING (public.user_owns_entreprise(entreprise_id))
  WITH CHECK (public.user_owns_entreprise(entreprise_id));

-- produits
CREATE POLICY "users CRUD produits of own entreprise" ON public.produits_services FOR ALL
  USING (public.user_owns_entreprise(entreprise_id))
  WITH CHECK (public.user_owns_entreprise(entreprise_id));

-- devis
CREATE POLICY "users CRUD devis of own entreprise" ON public.devis FOR ALL
  USING (public.user_owns_entreprise(entreprise_id))
  WITH CHECK (public.user_owns_entreprise(entreprise_id));

-- devis_lignes
CREATE POLICY "users CRUD devis_lignes of own devis" ON public.devis_lignes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.devis d WHERE d.id = devis_id AND public.user_owns_entreprise(d.entreprise_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.devis d WHERE d.id = devis_id AND public.user_owns_entreprise(d.entreprise_id)));

-- factures
CREATE POLICY "users CRUD factures of own entreprise" ON public.factures FOR ALL
  USING (public.user_owns_entreprise(entreprise_id))
  WITH CHECK (public.user_owns_entreprise(entreprise_id));

-- factures_lignes
CREATE POLICY "users CRUD factures_lignes of own facture" ON public.factures_lignes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.factures f WHERE f.id = facture_id AND public.user_owns_entreprise(f.entreprise_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.factures f WHERE f.id = facture_id AND public.user_owns_entreprise(f.entreprise_id)));

-- paiements
CREATE POLICY "users CRUD paiements of own facture" ON public.paiements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.factures f WHERE f.id = facture_id AND public.user_owns_entreprise(f.entreprise_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.factures f WHERE f.id = facture_id AND public.user_owns_entreprise(f.entreprise_id)));

-- ============ AUTO-PROFILE TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_entreprises_updated BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_produits_updated BEFORE UPDATE ON public.produits_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_devis_updated BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_factures_updated BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUTO-NUMBERING FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.next_devis_numero(_entreprise_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _year TEXT := to_char(now(), 'YYYY');
  _count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO _count FROM public.devis
   WHERE entreprise_id = _entreprise_id AND numero LIKE 'DEV-' || _year || '-%';
  RETURN 'DEV-' || _year || '-' || lpad(_count::text, 3, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.next_facture_numero(_entreprise_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _year TEXT := to_char(now(), 'YYYY');
  _count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO _count FROM public.factures
   WHERE entreprise_id = _entreprise_id AND numero LIKE 'FAC-' || _year || '-%';
  RETURN 'FAC-' || _year || '-' || lpad(_count::text, 3, '0');
END; $$;

-- ============ FACTURE STATUS AUTO-UPDATE ON PAIEMENT ============
CREATE OR REPLACE FUNCTION public.update_facture_paiement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _total NUMERIC;
  _paye NUMERIC;
  _facture_id UUID;
BEGIN
  _facture_id := COALESCE(NEW.facture_id, OLD.facture_id);
  SELECT total_ttc INTO _total FROM public.factures WHERE id = _facture_id;
  SELECT COALESCE(SUM(montant), 0) INTO _paye FROM public.paiements WHERE facture_id = _facture_id;
  UPDATE public.factures SET
    montant_paye = _paye,
    statut = CASE
      WHEN _paye >= _total AND _total > 0 THEN 'payee'::facture_statut
      WHEN _paye > 0 THEN 'partiellement_payee'::facture_statut
      ELSE 'non_payee'::facture_statut
    END
  WHERE id = _facture_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_paiement_update_facture
  AFTER INSERT OR UPDATE OR DELETE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.update_facture_paiement();
