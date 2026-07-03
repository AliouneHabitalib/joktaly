import { useEffect } from "react";
import type { PdfDoc } from "@/lib/pdf";
import { formatMontant, formatDate } from "@/lib/format";

interface Props {
  doc: PdfDoc;
  autoPrint?: boolean;
}

/**
 * Document imprimable HTML — utilisé pour l'export PDF via la boîte
 * d'impression du navigateur (window.print → Enregistrer au format PDF).
 * Le rendu utilise le logo et la couleur primaire de l'entreprise.
 */
export function PrintDocument({ doc, autoPrint = true }: Props) {
  const couleur = doc.entreprise.couleur_primaire || "#1D9E75";
  const devise = doc.entreprise.devise || "FCFA";
  const isDevis = doc.type === "devis";

  useEffect(() => {
    if (!autoPrint) return;
    // Laisse au navigateur le temps de charger logo + polices
    const t = setTimeout(() => {
      try {
        window.print();
      } catch {
        /* noop */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [autoPrint]);

  const clientName = [doc.client.prenom, doc.client.nom].filter(Boolean).join(" ").trim();

  return (
    <>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        .pp-root {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          background: #f4f5f7;
          min-height: 100vh;
          padding: 24px 16px;
        }
        .pp-sheet {
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border-radius: 6px;
          overflow: hidden;
        }
        @media print {
          .pp-root { background: #fff; padding: 0; }
          .pp-sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
        }
        .pp-header {
          background: ${couleur};
          color: #fff;
          padding: 28px 32px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .pp-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .pp-logo {
          width: 56px; height: 56px;
          background: #fff;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pp-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .pp-logo-fallback { color: ${couleur}; font-weight: 800; font-size: 22px; }
        .pp-brand-name { font-size: 20px; font-weight: 800; line-height: 1.15; }
        .pp-brand-slogan { font-size: 11px; opacity: 0.9; margin-top: 2px; }
        .pp-doctype { text-align: right; }
        .pp-doctype-label { font-size: 24px; font-weight: 800; letter-spacing: 1px; }
        .pp-doctype-num { font-size: 12px; opacity: 0.95; margin-top: 4px; }
        .pp-body { padding: 24px 32px 32px; }
        .pp-row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
        .pp-col { flex: 1; min-width: 0; }
        .pp-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.6px;
          color: ${couleur}; text-transform: uppercase; margin-bottom: 6px;
        }
        .pp-text { font-size: 12px; color: #2d2d2d; line-height: 1.55; }
        .pp-text strong { color: #1a1a1a; }
        .pp-meta-line { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
        .pp-meta-line span:first-child { color: #666; }
        .pp-meta-line span:last-child { font-weight: 600; }
        .pp-objet {
          background: #f8f9fa; border-left: 3px solid ${couleur};
          padding: 10px 14px; border-radius: 4px; margin-bottom: 18px;
          font-size: 12px;
        }
        .pp-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; }
        .pp-table thead th {
          background: ${couleur}; color: #fff; text-align: left;
          padding: 9px 8px; font-weight: 700; font-size: 10px; letter-spacing: 0.3px;
        }
        .pp-table tbody td {
          padding: 8px; border-bottom: 1px solid #eee; vertical-align: top;
        }
        .pp-table tbody tr:nth-child(even) td { background: #fafbfc; }
        .pp-num { text-align: right; white-space: nowrap; }
        .pp-center { text-align: center; }
        .pp-totals { margin-left: auto; width: 280px; font-size: 12px; }
        .pp-totals .pp-meta-line { padding: 4px 0; }
        .pp-total-final {
          background: ${couleur}; color: #fff;
          padding: 10px 14px; border-radius: 4px;
          display: flex; justify-content: space-between;
          font-size: 14px; font-weight: 800; margin-top: 6px;
        }
        .pp-section { margin-top: 18px; font-size: 11px; color: #333; }
        .pp-section-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          color: ${couleur}; text-transform: uppercase; margin-bottom: 4px;
        }
        .pp-section p { white-space: pre-wrap; line-height: 1.5; }
        .pp-footer {
          margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e5e5;
          font-size: 10px; color: #888; text-align: center;
        }
        .pp-toolbar {
          max-width: 800px; margin: 0 auto 16px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; color: #333;
        }
        .pp-btn {
          background: ${couleur}; color: #fff; border: 0;
          padding: 8px 14px; border-radius: 6px; cursor: pointer;
          font-weight: 600; font-size: 13px;
        }
        .pp-btn.secondary { background: #e9ecef; color: #333; margin-right: 8px; }
      `}</style>

      <div className="pp-root">
        <div className="pp-toolbar no-print">
          <div>
            Aperçu d'impression — utilisez <strong>« Enregistrer au format PDF »</strong> dans la boîte d'impression.
          </div>
          <div>
            <button className="pp-btn secondary" onClick={() => window.close()}>Fermer</button>
            <button className="pp-btn" onClick={() => window.print()}>Imprimer / PDF</button>
          </div>
        </div>

        <div className="pp-sheet">
          <div className="pp-header">
            <div className="pp-brand">
              <div className="pp-logo">
                {doc.entreprise.logo_url ? (
                  <img src={doc.entreprise.logo_url} alt={doc.entreprise.nom} />
                ) : (
                  <span className="pp-logo-fallback">
                    {doc.entreprise.nom?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <div className="pp-brand-name">{doc.entreprise.nom}</div>
                {doc.entreprise.slogan && (
                  <div className="pp-brand-slogan">{doc.entreprise.slogan}</div>
                )}
              </div>
            </div>
            <div className="pp-doctype">
              <div className="pp-doctype-label">{isDevis ? "DEVIS" : "FACTURE"}</div>
              <div className="pp-doctype-num">N° {doc.numero}</div>
            </div>
          </div>

          <div className="pp-body">
            <div className="pp-row">
              <div className="pp-col">
                <div className="pp-label">Émetteur</div>
                <div className="pp-text">
                  <strong>{doc.entreprise.nom}</strong><br />
                  {doc.entreprise.adresse && <>{doc.entreprise.adresse}<br /></>}
                  {(doc.entreprise.ville || doc.entreprise.pays) && (
                    <>{[doc.entreprise.ville, doc.entreprise.pays].filter(Boolean).join(", ")}<br /></>
                  )}
                  {doc.entreprise.telephone && <>Tél : {doc.entreprise.telephone}<br /></>}
                  {doc.entreprise.email && <>{doc.entreprise.email}<br /></>}
                  {doc.entreprise.site_web && <>{doc.entreprise.site_web}<br /></>}
                  {doc.entreprise.ninea && <>NINEA : {doc.entreprise.ninea}<br /></>}
                  {doc.entreprise.rc && <>RC : {doc.entreprise.rc}</>}
                </div>
              </div>
              <div className="pp-col">
                <div className="pp-label">{isDevis ? "Devis adressé à" : "Facturé à"}</div>
                <div className="pp-text">
                  <strong>{clientName || "—"}</strong><br />
                  {doc.client.entreprise_nom && <>{doc.client.entreprise_nom}<br /></>}
                  {doc.client.adresse && <>{doc.client.adresse}<br /></>}
                  {doc.client.ville && <>{doc.client.ville}<br /></>}
                  {doc.client.telephone && <>Tél : {doc.client.telephone}<br /></>}
                  {doc.client.email && <>{doc.client.email}</>}
                </div>
              </div>
              <div className="pp-col" style={{ maxWidth: 220 }}>
                <div className="pp-label">Détails</div>
                <div className="pp-meta-line">
                  <span>Date d'émission</span><span>{formatDate(doc.date_emission)}</span>
                </div>
                <div className="pp-meta-line">
                  <span>{isDevis ? "Valable jusqu'au" : "Date d'échéance"}</span>
                  <span>{formatDate(isDevis ? doc.date_validite : doc.date_echeance)}</span>
                </div>
                {doc.statut && (
                  <div className="pp-meta-line">
                    <span>Statut</span><span style={{ textTransform: "capitalize" }}>{doc.statut.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            </div>

            {doc.objet && (
              <div className="pp-objet">
                <strong>Objet :</strong> {doc.objet}
              </div>
            )}

            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }} className="pp-center">N°</th>
                  <th>Description</th>
                  <th className="pp-num" style={{ width: 50 }}>Qté</th>
                  <th className="pp-center" style={{ width: 60 }}>Unité</th>
                  <th className="pp-num" style={{ width: 90 }}>P.U. HT</th>
                  {doc.tva_active && <th className="pp-center" style={{ width: 50 }}>TVA</th>}
                  <th className="pp-num" style={{ width: 100 }}>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {doc.lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="pp-center">{i + 1}</td>
                    <td>{l.description}</td>
                    <td className="pp-num">{l.quantite}</td>
                    <td className="pp-center">{l.unite}</td>
                    <td className="pp-num">{formatMontant(l.prix_unitaire, devise)}</td>
                    {doc.tva_active && <td className="pp-center">{l.tva_taux}%</td>}
                    <td className="pp-num"><strong>{formatMontant(l.total_ttc, devise)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pp-totals">
              <div className="pp-meta-line">
                <span>Sous-total HT</span><span>{formatMontant(doc.sous_total, devise)}</span>
              </div>
              {doc.remise_montant > 0 && (
                <div className="pp-meta-line">
                  <span>Remise</span><span>- {formatMontant(doc.remise_montant, devise)}</span>
                </div>
              )}
              {doc.tva_active ? (
                doc.montant_tva > 0 && (
                  <div className="pp-meta-line">
                    <span>TVA</span><span>{formatMontant(doc.montant_tva, devise)}</span>
                  </div>
                )
              ) : (
                <div className="pp-meta-line" style={{ color: "#999", fontSize: 10 }}>
                  <span>TVA non applicable</span><span>—</span>
                </div>
              )}
              <div className="pp-total-final">
                <span>TOTAL TTC</span>
                <span>{formatMontant(doc.total_ttc, devise)}</span>
              </div>
            </div>

            {doc.conditions_paiement && (
              <div className="pp-section">
                <div className="pp-section-title">Conditions de paiement</div>
                <p>{doc.conditions_paiement}</p>
              </div>
            )}
            {doc.notes && (
              <div className="pp-section">
                <div className="pp-section-title">Notes</div>
                <p>{doc.notes}</p>
              </div>
            )}
            {doc.entreprise.coordonnees_bancaires && (
              <div className="pp-section">
                <div className="pp-section-title">Coordonnées bancaires</div>
                <p>{doc.entreprise.coordonnees_bancaires}</p>
              </div>
            )}

            <div className="pp-footer">
              {doc.entreprise.nom} — Document généré avec TERA-DEVIS
            </div>
          </div>
        </div>
      </div>
    </>
  );
}