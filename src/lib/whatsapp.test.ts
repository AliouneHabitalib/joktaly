import { describe, expect, it } from "vitest";
import { defaultVatRate, getCountry } from "./countries";
import { normalizePhone, whatsappUrl } from "./whatsapp";
import { calculerTotaux } from "./devis-facture-shared";

describe("numéros internationaux", () => {
  it("ajoute l'indicatif du Sénégal à un numéro local", () => {
    expect(normalizePhone("77 123 45 67", "Sénégal")).toBe("221771234567");
  });

  it("ajoute l'indicatif ivoirien et retire le zéro initial", () => {
    expect(normalizePhone("01 02 03 04 05", "Côte d'Ivoire")).toBe("2250102030405");
  });

  it("conserve un numéro international saisi avec +", () => {
    expect(normalizePhone("+33 6 12 34 56 78", "Sénégal")).toBe("33612345678");
  });

  it("accepte le préfixe international 00", () => {
    expect(normalizePhone("00225 01 02 03 04 05", "Sénégal")).toBe("2250102030405");
  });

  it("ne duplique pas un indicatif déjà présent", () => {
    expect(normalizePhone("2250102030405", "Côte d'Ivoire")).toBe("2250102030405");
  });

  it("utilise le pays du client dans le lien WhatsApp", () => {
    expect(whatsappUrl("06 12 34 56 78", "Bonjour", "Cameroun")).toBe(
      "https://wa.me/237612345678?text=Bonjour",
    );
  });
});

describe("taux indicatifs par pays", () => {
  it("propose 18 % au Sénégal", () => {
    expect(defaultVatRate("Sénégal")).toBe(18);
  });

  it("propose 19,25 % au Cameroun", () => {
    expect(defaultVatRate("Cameroun")).toBe(19.25);
  });

  it("garde le taux actuel pour un pays hors liste", () => {
    expect(defaultVatRate("Autre", 7)).toBe(7);
    expect(getCountry("Autre")).toBeUndefined();
  });

  it("calcule la TVA camerounaise à 19,25 % sur les lignes", () => {
    const totaux = calculerTotaux([
      { id: "1", description: "Prestation", quantite: 2, unite: "unité", prix_unitaire: 10000, tva_taux: 19.25 },
    ], true, 0);
    expect(totaux.sous_total).toBe(20000);
    expect(totaux.montant_tva).toBe(3850);
    expect(totaux.total_ttc).toBe(23850);
  });
});
