import { describe, it, expect } from "vitest";
import { periodBounds, computeRapport, toCsv } from "./rapports";

describe("rapports", () => {
  it("semaine du lundi au dimanche", () => {
    expect(periodBounds("semaine", new Date(2026, 10, 12))).toEqual({ debut: "2026-11-09", fin: "2026-11-15" });
  });
  it("mois complet", () => {
    expect(periodBounds("mois", new Date(2026, 1, 10))).toEqual({ debut: "2026-02-01", fin: "2026-02-28" });
  });
  it("bénéfice = encaissé − dépenses, factures annulées exclues", () => {
    const r = computeRapport(
      {
        factures: [
          { date_emission: "2026-11-02", total_ttc: 10000, statut: "payee" },
          { date_emission: "2026-11-03", total_ttc: 5000, statut: "annulee" },
        ],
        paiements: [{ date_paiement: "2026-11-05", montant: 8000 }, { date_paiement: "2026-10-30", montant: 999 }],
        depenses: [{ date_depense: "2026-11-06", montant: 3000, montant_paye: 1000 }],
      },
      { debut: "2026-11-01", fin: "2026-11-30" },
    );
    expect(r.facture).toBe(10000);
    expect(r.encaisse).toBe(8000);
    expect(r.depense).toBe(3000);
    expect(r.benefice).toBe(5000);
  });
  it("CSV échappe le séparateur", () => {
    expect(toCsv([["a;b", 1]])).toBe('\uFEFF"a;b";1');
  });
});
