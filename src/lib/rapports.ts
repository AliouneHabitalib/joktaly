export type Periode = "jour" | "semaine" | "mois" | "annee";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Bornes incluses [debut, fin] (AAAA-MM-JJ) de la période contenant `ref`. Semaine du lundi au dimanche. */
export function periodBounds(periode: Periode, ref: Date): { debut: string; fin: string } {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();
  if (periode === "jour") return { debut: iso(ref), fin: iso(ref) };
  if (periode === "semaine") {
    const offset = (ref.getDay() + 6) % 7;
    const start = new Date(y, m, d - offset);
    return { debut: iso(start), fin: iso(new Date(y, m, d - offset + 6)) };
  }
  if (periode === "mois") return { debut: iso(new Date(y, m, 1)), fin: iso(new Date(y, m + 1, 0)) };
  return { debut: `${y}-01-01`, fin: `${y}-12-31` };
}

export const inRange = (date: string, b: { debut: string; fin: string }) =>
  date.slice(0, 10) >= b.debut && date.slice(0, 10) <= b.fin;

export interface RapportInput {
  factures: { date_emission: string; total_ttc: number; statut: string }[];
  paiements: { date_paiement: string; montant: number }[];
  depenses: { date_depense: string; montant: number; montant_paye: number }[];
}

/** Bénéfice estimé = encaissements reçus − dépenses enregistrées sur la période (factures annulées exclues). */
export function computeRapport(input: RapportInput, b: { debut: string; fin: string }) {
  const factures = input.factures.filter((f) => f.statut !== "annulee" && inRange(f.date_emission, b));
  const paiements = input.paiements.filter((p) => inRange(p.date_paiement, b));
  const depenses = input.depenses.filter((x) => inRange(x.date_depense, b));
  const facture = factures.reduce((s, f) => s + Number(f.total_ttc), 0);
  const encaisse = paiements.reduce((s, p) => s + Number(p.montant), 0);
  const depense = depenses.reduce((s, x) => s + Number(x.montant), 0);
  const depensePayee = depenses.reduce((s, x) => s + Number(x.montant_paye), 0);
  return {
    nbFactures: factures.length,
    facture,
    encaisse,
    depense,
    depensePayee,
    benefice: encaisse - depense,
  };
}

/** CSV compatible Excel (séparateur « ; », BOM UTF-8). */
export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}
