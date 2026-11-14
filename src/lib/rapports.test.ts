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

import { computeTresorerie } from "./rapports";
describe("trésorerie", () => {
  it("solde début/fin à partir du solde de départ et des paiements datés", () => {
    const t = computeTresorerie(
      {
        soldeInitial: 100000,
        soldeInitialDate: "2026-10-01",
        entrees: [{ date: "2026-10-15", montant: 20000 }, { date: "2026-11-05", montant: 30000 }, { date: "2026-09-01", montant: 999 }],
        sorties: [{ date: "2026-10-20", montant: 5000 }, { date: "2026-11-10", montant: 12000 }],
      },
      { debut: "2026-11-01", fin: "2026-11-30" },
    );
    expect(t.soldeDebut).toBe(115000);
    expect(t.entrees).toBe(30000);
    expect(t.sorties).toBe(12000);
    expect(t.soldeFin).toBe(133000);
  });
});
