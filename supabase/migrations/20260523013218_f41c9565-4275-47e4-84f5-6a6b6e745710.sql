
-- Enum for activity types
CREATE TYPE public.activity_type AS ENUM (
  'devis_created',
  'facture_created',
  'quota_refused_devis',
  'quota_refused_facture'
);

-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entreprise_id uuid,
  type public.activity_type NOT NULL,
  target_id uuid,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_type ON public.activity_logs (type);
CREATE INDEX idx_activity_logs_user ON public.activity_logs (user_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read; no insert/update/delete from clients (writes via SECURITY DEFINER)
CREATE POLICY "admins can view activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function: log devis/facture creations
CREATE OR REPLACE FUNCTION public.log_document_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _kind text := TG_ARGV[0];
  _type public.activity_type;
BEGIN
  SELECT user_id INTO _user_id FROM public.entreprises WHERE id = NEW.entreprise_id;

  IF _kind = 'devis' THEN
    _type := 'devis_created';
  ELSE
    _type := 'facture_created';
  END IF;

  INSERT INTO public.activity_logs (user_id, entreprise_id, type, target_id, message, metadata)
  VALUES (
    _user_id,
    NEW.entreprise_id,
    _type,
    NEW.id,
    _kind || ' ' || NEW.numero || ' créé(e)',
    jsonb_build_object('numero', NEW.numero, 'total_ttc', NEW.total_ttc)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_devis_creation
AFTER INSERT ON public.devis
FOR EACH ROW EXECUTE FUNCTION public.log_document_creation('devis');

CREATE TRIGGER trg_log_facture_creation
AFTER INSERT ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.log_document_creation('facture');

-- Function called from server to log quota refusals (in its own transaction via server fn)
CREATE OR REPLACE FUNCTION public.log_quota_refusal(_user_id uuid, _entreprise_id uuid, _kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _type public.activity_type;
BEGIN
  IF _kind = 'devis' THEN
    _type := 'quota_refused_devis';
  ELSIF _kind = 'facture' THEN
    _type := 'quota_refused_facture';
  ELSE
    RAISE EXCEPTION 'kind invalide';
  END IF;

  INSERT INTO public.activity_logs (user_id, entreprise_id, type, message, metadata)
  VALUES (
    _user_id,
    _entreprise_id,
    _type,
    'Limite mensuelle atteinte pour ' || _kind,
    jsonb_build_object('kind', _kind)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_quota_refusal(uuid, uuid, text) FROM public, anon, authenticated;
