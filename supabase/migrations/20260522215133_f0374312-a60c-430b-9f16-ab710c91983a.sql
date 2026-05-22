
CREATE OR REPLACE FUNCTION public.next_devis_numero(_entreprise_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  _year TEXT := to_char(now(), 'YYYY');
  _count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO _count FROM public.devis
   WHERE entreprise_id = _entreprise_id AND numero LIKE 'DEV-' || _year || '-%';
  RETURN 'DEV-' || _year || '-' || lpad(_count::text, 3, '0');
END; $function$;

CREATE OR REPLACE FUNCTION public.next_facture_numero(_entreprise_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  _year TEXT := to_char(now(), 'YYYY');
  _count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO _count FROM public.factures
   WHERE entreprise_id = _entreprise_id AND numero LIKE 'FAC-' || _year || '-%';
  RETURN 'FAC-' || _year || '-' || lpad(_count::text, 3, '0');
END; $function$;
