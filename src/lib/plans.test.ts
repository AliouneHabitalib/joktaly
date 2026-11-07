import { describe, it, expect } from "vitest";
import { PLANS, PUBLIC_PLANS, checkLimit, type PlanType } from "./plans";
import { PRICING, monthlyPrice, chargedAmount } from "./pricing";

const reference: Record<PlanType, [number, number | null, number | null, number | null, number, boolean, boolean, boolean]> = {
  gratuit: [0, 3, 1, 5, 1, false, false, false],
  starter: [3000, 10, 5, 30, 1, false, false, false],
  pro: [6000, 20, 10, 50, 1, false, true, false],
  essentiel: [6000, 20, 10, 50, 1, false, true, false],
  business: [15000, null, null, null, 5, true, true, true],
};

describe("Catalogue unique des formules", () => {
  for (const id of Object.keys(reference) as PlanType[]) {
    const [price, devis, factures, clients, users, stats, reminders, api] = reference[id];
    it(`${id} applique les limites et droits de la référence`, () => {
      expect(PLANS[id].prix_fcfa).toBe(price);
      expect(PLANS[id].limites).toEqual({
        devis_par_mois: devis, factures_par_mois: factures, clients_max: clients,
        utilisateurs: users, statistiques_avancees: stats, rappels_auto: reminders, api_access: api,
      });
    });
    it(`${id} expose les mêmes limites dans PRICING`, () => {
      const features = PRICING[id].features;
      expect(PRICING[id].base).toBe(price);
      for (const [limit, pattern] of [
        [devis, /^(\d+) devis \/ mois$/],
        [factures, /^(\d+) factures? \/ mois$/],
        [clients, /^(\d+) clients$/],
      ] as const) {
        const match = features.map((feature) => feature.match(pattern)).find(Boolean);
        expect(match ? Number(match[1]) : null).toBe(limit);
      }
      if (devis === null || factures === null) expect(features).toContain("Devis et factures illimités");
      if (clients === null) expect(features).toContain("Clients illimités");
      const userClaim = features.map((feature) => feature.match(/^Jusqu'à (\d+) utilisateurs$/)).find(Boolean);
      expect(userClaim ? Number(userClaim[1]) : 1).toBe(users);
      expect(features.includes("Statistiques avancées")).toBe(stats);
      expect(features.includes("Rappels automatiques")).toBe(reminders);
      expect(features.includes("Accès API et webhooks")).toBe(api);
      expect(features).toEqual(PLANS[id].features);
    });
    for (const [kind, limit] of [["devis", devis], ["factures", factures]] as const) {
      it(`${id} bloque ${kind} au quota et non avant`, () => {
        if (limit === null) expect(checkLimit(id, kind, 100000).allowed).toBe(true);
        else {
          expect(checkLimit(id, kind, limit - 1)).toEqual({ allowed: true, limit });
          expect(checkLimit(id, kind, limit).allowed).toBe(false);
          expect(checkLimit(id, kind, limit).limit).toBe(limit);
        }
      });
    }
    it(`${id} conserve la remise annuelle de 20 %`, () => {
      expect(monthlyPrice(id, "yearly")).toBe(price * 0.8);
      expect(chargedAmount(id, "yearly")).toBe(price * 0.8 * 12);
    });
  }
  it("Essentiel est seulement un alias identique à Pro", () => {
    expect(PLANS.essentiel).toBe(PLANS.pro);
    expect(PRICING.essentiel).toEqual(PRICING.pro);
    expect(PUBLIC_PLANS).toEqual(["gratuit", "starter", "pro", "business"]);
  });
});