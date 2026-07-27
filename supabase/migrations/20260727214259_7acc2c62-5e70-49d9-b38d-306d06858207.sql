ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'essentiel';

CREATE TABLE public.abonnements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL,
  cycle text NOT NULL DEFAULT 'monthly',
  montant integer NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  statut text NOT NULL DEFAULT 'en_attente',
  provider text NOT NULL DEFAULT 'paydunya',
  provider_token text,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.abonnements TO authenticated;
GRANT ALL ON public.abonnements TO service_role;

ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own abonnements"
  ON public.abonnements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Deny client writes on abonnements"
  ON public.abonnements AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE INDEX idx_abonnements_user_statut ON public.abonnements (user_id, statut);
CREATE INDEX idx_abonnements_token ON public.abonnements (provider_token);

CREATE TRIGGER set_abonnements_updated_at
  BEFORE UPDATE ON public.abonnements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();