import { describe, it, expect } from "vitest";
import { getMonthStartISO, isInCurrentMonth } from "./quota-period";

describe("getMonthStartISO", () => {
  it("retourne le 1er du mois pour une date du milieu de mois", () => {
    expect(getMonthStartISO(new Date(2026, 4, 15))).toBe("2026-05-01");
  });

  it("retourne le 1er du mois pour le 1er à minuit", () => {
    expect(getMonthStartISO(new Date(2026, 0, 1, 0, 0, 0))).toBe("2026-01-01");
  });

  it("retourne le 1er du mois suivant au passage de minuit", () => {
    const dernierJanvier = new Date(2026, 0, 31, 23, 59, 59);
    const premierFevrier = new Date(2026, 1, 1, 0, 0, 0);
    expect(getMonthStartISO(dernierJanvier)).toBe("2026-01-01");
    expect(getMonthStartISO(premierFevrier)).toBe("2026-02-01");
  });

  it("gère les années bissextiles (février 29)", () => {
    expect(getMonthStartISO(new Date(2028, 1, 29))).toBe("2028-02-01");
  });

  it("gère décembre → janvier", () => {
    expect(getMonthStartISO(new Date(2026, 11, 31))).toBe("2026-12-01");
    expect(getMonthStartISO(new Date(2027, 0, 1))).toBe("2027-01-01");
  });
});

describe("isInCurrentMonth — réinitialisation mensuelle", () => {
  it("inclut un devis émis le 1er du mois courant", () => {
    const now = new Date(2026, 4, 20);
    expect(isInCurrentMonth("2026-05-01", now)).toBe(true);
  });

  it("inclut un devis émis aujourd'hui", () => {
    const now = new Date(2026, 4, 20);
    expect(isInCurrentMonth("2026-05-20", now)).toBe(true);
  });

  it("EXCLUT un devis émis le dernier jour du mois précédent (compteur réinitialisé)", () => {
    const now = new Date(2026, 4, 1);
    expect(isInCurrentMonth("2026-04-30", now)).toBe(false);
  });

  it("EXCLUT un devis émis le mois précédent même tard dans la journée", () => {
    const now = new Date(2026, 4, 1, 0, 0, 1);
    expect(isInCurrentMonth("2026-04-30", now)).toBe(false);
  });

  it("EXCLUT tous les devis de l'année précédente", () => {
    const now = new Date(2026, 0, 5);
    expect(isInCurrentMonth("2025-12-31", now)).toBe(false);
    expect(isInCurrentMonth("2025-01-01", now)).toBe(false);
  });

  it("simulation rollover : un compteur de 10 devis en avril retombe à 0 le 1er mai", () => {
    const avril = [
      "2026-04-01", "2026-04-05", "2026-04-08", "2026-04-12", "2026-04-15",
      "2026-04-18", "2026-04-22", "2026-04-25", "2026-04-28", "2026-04-30",
    ];
    const finAvril = new Date(2026, 3, 30, 23, 59);
    const debutMai = new Date(2026, 4, 1, 0, 0);
    expect(avril.filter((d) => isInCurrentMonth(d, finAvril)).length).toBe(10);
    expect(avril.filter((d) => isInCurrentMonth(d, debutMai)).length).toBe(0);
  });
});