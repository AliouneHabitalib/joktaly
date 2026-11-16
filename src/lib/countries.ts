export type CountryInfo = {
  nom: string;
  indicatif: string;
  /** Taux standard indicatif : l'utilisateur doit vérifier sa situation fiscale. */
  tva: number;
  /** Certains pays, comme la Côte d'Ivoire, conservent le zéro initial à l'international. */
  conserverZero?: boolean;
};

/** Pays proposés à l'inscription et dans les coordonnées, avec indicatif international. */
export const COUNTRIES: CountryInfo[] = [
  { nom: "Sénégal", indicatif: "221", tva: 18 },
  { nom: "Côte d'Ivoire", indicatif: "225", tva: 18, conserverZero: true },
  { nom: "Mali", indicatif: "223", tva: 18 },
  { nom: "Burkina Faso", indicatif: "226", tva: 18 },
  { nom: "Guinée", indicatif: "224", tva: 18 },
  { nom: "Togo", indicatif: "228", tva: 18 },
  { nom: "Bénin", indicatif: "229", tva: 18 },
  { nom: "Niger", indicatif: "227", tva: 19 },
  { nom: "Cameroun", indicatif: "237", tva: 19.25 },
  { nom: "Gabon", indicatif: "241", tva: 18 },
  { nom: "Congo", indicatif: "242", tva: 18 },
  { nom: "République démocratique du Congo", indicatif: "243", tva: 16 },
  { nom: "Tchad", indicatif: "235", tva: 18 },
  { nom: "Centrafrique", indicatif: "236", tva: 19 },
  { nom: "Mauritanie", indicatif: "222", tva: 16 },
  { nom: "Comores", indicatif: "269", tva: 10 },
  { nom: "Djibouti", indicatif: "253", tva: 10 },
  { nom: "Madagascar", indicatif: "261", tva: 20 },
  { nom: "Rwanda", indicatif: "250", tva: 18 },
  { nom: "Burundi", indicatif: "257", tva: 18 },
  { nom: "Maroc", indicatif: "212", tva: 20 },
  { nom: "Algérie", indicatif: "213", tva: 19 },
  { nom: "Tunisie", indicatif: "216", tva: 19 },
  { nom: "France", indicatif: "33", tva: 20 },
  { nom: "Belgique", indicatif: "32", tva: 21 },
];

export function getCountry(nom: string | null | undefined): CountryInfo | undefined {
  return COUNTRIES.find((country) => country.nom === nom);
}

export function defaultVatRate(nom: string | null | undefined, fallback = 18): number {
  return getCountry(nom)?.tva ?? fallback;
}
