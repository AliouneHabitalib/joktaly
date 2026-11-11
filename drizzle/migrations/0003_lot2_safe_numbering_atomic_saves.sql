ALTER TABLE public.entreprises ADD COLUMN IF NOT EXISTS document_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS devis_entreprise_numero_uniq ON public.devis(entreprise_id, numero);
CREATE UNIQUE INDEX IF NOT EXISTS factures_entreprise_numero_uniq ON public.factures(entreprise_id, numero);

CREATE OR REPLACE FUNCTION public.next_devis_numero(_entreprise_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _year text := to_char(now(),'YYYY'); _n int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('devis:' || _entreprise_id::text));
  SELECT COALESCE(MAX((substring(numero from '^DEV-' || _year || '-([0-9]+)$'))::int),0) + 1 INTO _n
    FROM public.devis WHERE entreprise_id = _entreprise_id AND numero ~ ('^DEV-' || _year || '-[0-9]+$');
  RETURN 'DEV-' || _year || '-' || lpad(_n::text,3,'0');
END $$;

CREATE OR REPLACE FUNCTION public.next_facture_numero(_entreprise_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _year text := to_char(now(),'YYYY'); _n int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('facture:' || _entreprise_id::text));
  SELECT COALESCE(MAX((substring(numero from '^FAC-' || _year || '-([0-9]+)$'))::int),0) + 1 INTO _n
    FROM public.factures WHERE entreprise_id = _entreprise_id AND numero ~ ('^FAC-' || _year || '-[0-9]+$');
  RETURN 'FAC-' || _year || '-' || lpad(_n::text,3,'0');
END $$;

CREATE OR REPLACE FUNCTION public.save_devis(_id uuid, _data jsonb, _lignes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _eid uuid := (_data->>'entreprise_id')::uuid; _rid uuid; _num text;
BEGIN
  IF _id IS NULL THEN
    _num := public.next_devis_numero(_eid);
    INSERT INTO public.devis(entreprise_id, client_id, numero, titre, objet, date_emission, date_validite, statut,
      tva_active, tva_taux, remise_pourcent, remise_montant, sous_total, montant_tva, total_ttc, notes, conditions_paiement)
    VALUES (_eid, (_data->>'client_id')::uuid, _num, _data->>'titre', _data->>'objet',
      (_data->>'date_emission')::date, (_data->>'date_validite')::date, (_data->>'statut')::devis_statut,
      (_data->>'tva_active')::boolean, (_data->>'tva_taux')::numeric, (_data->>'remise_pourcent')::numeric,
      (_data->>'remise_montant')::numeric, (_data->>'sous_total')::numeric, (_data->>'montant_tva')::numeric,
      (_data->>'total_ttc')::numeric, _data->>'notes', _data->>'conditions_paiement')
    RETURNING id INTO _rid;
  ELSE
    UPDATE public.devis SET client_id=(_data->>'client_id')::uuid, titre=_data->>'titre', objet=_data->>'objet',
      date_emission=(_data->>'date_emission')::date, date_validite=(_data->>'date_validite')::date,
      statut=(_data->>'statut')::devis_statut, tva_active=(_data->>'tva_active')::boolean,
      tva_taux=(_data->>'tva_taux')::numeric, remise_pourcent=(_data->>'remise_pourcent')::numeric,
      remise_montant=(_data->>'remise_montant')::numeric, sous_total=(_data->>'sous_total')::numeric,
      montant_tva=(_data->>'montant_tva')::numeric, total_ttc=(_data->>'total_ttc')::numeric,
      notes=_data->>'notes', conditions_paiement=_data->>'conditions_paiement'
    WHERE id=_id RETURNING id, numero INTO _rid, _num;
    IF _rid IS NULL THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
    DELETE FROM public.devis_lignes WHERE devis_id=_rid;
  END IF;
  INSERT INTO public.devis_lignes(devis_id, description, quantite, unite, prix_unitaire, tva_taux, total_ht, total_ttc, ordre)
  SELECT _rid, l->>'description', (l->>'quantite')::numeric, COALESCE(l->>'unite','unité'), (l->>'prix_unitaire')::numeric,
    (l->>'tva_taux')::numeric, (l->>'total_ht')::numeric, (l->>'total_ttc')::numeric, (l->>'ordre')::int
  FROM jsonb_array_elements(COALESCE(_lignes,'[]'::jsonb)) l;
  RETURN jsonb_build_object('id',_rid,'numero',_num);
END $$;

CREATE OR REPLACE FUNCTION public.save_facture(_id uuid, _data jsonb, _lignes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE _eid uuid := (_data->>'entreprise_id')::uuid; _rid uuid; _num text;
BEGIN
  IF _id IS NULL THEN
    _num := public.next_facture_numero(_eid);
    INSERT INTO public.factures(entreprise_id, client_id, devis_id, numero, titre, objet, date_emission, date_echeance, statut,
      tva_active, tva_taux, remise_pourcent, remise_montant, sous_total, montant_tva, total_ttc, notes, conditions_paiement)
    VALUES (_eid, (_data->>'client_id')::uuid, NULLIF(_data->>'devis_id','')::uuid, _num, _data->>'titre', _data->>'objet',
      (_data->>'date_emission')::date, (_data->>'date_echeance')::date, (_data->>'statut')::facture_statut,
      (_data->>'tva_active')::boolean, (_data->>'tva_taux')::numeric, (_data->>'remise_pourcent')::numeric,
      (_data->>'remise_montant')::numeric, (_data->>'sous_total')::numeric, (_data->>'montant_tva')::numeric,
      (_data->>'total_ttc')::numeric, _data->>'notes', _data->>'conditions_paiement')
    RETURNING id INTO _rid;
  ELSE
    UPDATE public.factures SET client_id=(_data->>'client_id')::uuid, titre=_data->>'titre', objet=_data->>'objet',
      date_emission=(_data->>'date_emission')::date, date_echeance=(_data->>'date_echeance')::date,
      statut=(_data->>'statut')::facture_statut, tva_active=(_data->>'tva_active')::boolean,
      tva_taux=(_data->>'tva_taux')::numeric, remise_pourcent=(_data->>'remise_pourcent')::numeric,
      remise_montant=(_data->>'remise_montant')::numeric, sous_total=(_data->>'sous_total')::numeric,
      montant_tva=(_data->>'montant_tva')::numeric, total_ttc=(_data->>'total_ttc')::numeric,
      notes=_data->>'notes', conditions_paiement=_data->>'conditions_paiement'
    WHERE id=_id RETURNING id, numero INTO _rid, _num;
    IF _rid IS NULL THEN RAISE EXCEPTION 'Facture introuvable'; END IF;
    DELETE FROM public.factures_lignes WHERE facture_id=_rid;
  END IF;
  INSERT INTO public.factures_lignes(facture_id, description, quantite, unite, prix_unitaire, tva_taux, total_ht, total_ttc, ordre)
  SELECT _rid, l->>'description', (l->>'quantite')::numeric, COALESCE(l->>'unite','unité'), (l->>'prix_unitaire')::numeric,
    (l->>'tva_taux')::numeric, (l->>'total_ht')::numeric, (l->>'total_ttc')::numeric, (l->>'ordre')::int
  FROM jsonb_array_elements(COALESCE(_lignes,'[]'::jsonb)) l;
  RETURN jsonb_build_object('id',_rid,'numero',_num);
END $$;

CREATE OR REPLACE FUNCTION public.convert_devis_to_facture(_devis_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE d public.devis%ROWTYPE; _fid uuid; _num text;
BEGIN
  SELECT * INTO d FROM public.devis WHERE id=_devis_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
  _num := public.next_facture_numero(d.entreprise_id);
  INSERT INTO public.factures(entreprise_id, client_id, devis_id, numero, titre, objet, tva_active, tva_taux,
    remise_pourcent, remise_montant, sous_total, montant_tva, total_ttc, notes, conditions_paiement)
  VALUES (d.entreprise_id, d.client_id, d.id, _num, d.titre, d.objet, d.tva_active, d.tva_taux,
    d.remise_pourcent, d.remise_montant, d.sous_total, d.montant_tva, d.total_ttc, d.notes, d.conditions_paiement)
  RETURNING id INTO _fid;
  INSERT INTO public.factures_lignes(facture_id, description, quantite, unite, prix_unitaire, tva_taux, total_ht, total_ttc, ordre)
  SELECT _fid, description, quantite, unite, prix_unitaire, tva_taux, total_ht, total_ttc, ordre
  FROM public.devis_lignes WHERE devis_id=d.id;
  UPDATE public.devis SET statut='accepte' WHERE id=d.id;
  RETURN jsonb_build_object('id',_fid,'numero',_num);
END $$;

REVOKE EXECUTE ON FUNCTION public.save_devis(uuid,jsonb,jsonb), public.save_facture(uuid,jsonb,jsonb), public.convert_devis_to_facture(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_devis(uuid,jsonb,jsonb), public.save_facture(uuid,jsonb,jsonb), public.convert_devis_to_facture(uuid), public.next_devis_numero(uuid), public.next_facture_numero(uuid) TO authenticated;