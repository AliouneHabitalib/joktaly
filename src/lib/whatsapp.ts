import { formatMontant } from "./format";
import { getCountry } from "./countries";

export interface WhatsappTarget {
  phone: string | null;
  message: string;
}

/** Convertit un numéro local ou international au format attendu par wa.me. */
export function normalizePhone(
  raw: string | null | undefined,
  country: string | null | undefined = "Sénégal",
): string {
  if (!raw) return "";
  const value = raw.trim();
  if (!value) return "";
  const international = value.startsWith("+") || value.startsWith("00");
  let digits = value.replace(/\D/g, "");
  if (value.startsWith("00")) digits = digits.slice(2);
  if (international) return digits;

  const countryInfo = getCountry(country);
  const indicatif = countryInfo?.indicatif;
  if (!indicatif || digits.startsWith(indicatif)) return digits;
  const localDigits = countryInfo.conserverZero ? digits : digits.replace(/^0+/, "");
  return `${indicatif}${localDigits}`;
}

export function buildDocumentMessage(params: {
  type: "devis" | "facture";
  numero: string;
  montant: number;
  devise?: string | null;
  clientNom?: string | null;
  entrepriseNom?: string | null;
  reste?: number | null;
}): string {
  const devise = params.devise ?? "FCFA";
  const label = params.type === "devis" ? "devis" : "facture";
  const salutation = params.clientNom ? `Bonjour ${params.clientNom}` : "Bonjour";
  const lines = [
    `${salutation},`,
    "",
    `Veuillez trouver ci-joint votre ${label} N°${params.numero} d'un montant de ${formatMontant(params.montant, devise)}.`,
  ];
  if (params.reste != null && params.reste > 0 && params.reste < params.montant) {
    lines.push(`Reste à payer : ${formatMontant(params.reste, devise)}.`);
  }
  lines.push("", "Merci pour votre confiance,", params.entrepriseNom ?? "");
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

/** Message de relance pour une facture impayée ou partiellement payée. */
export function buildRelanceMessage(params: {
  type: "devis" | "facture";
  numero: string;
  montant: number;
  devise?: string | null;
  clientNom?: string | null;
  entrepriseNom?: string | null;
  reste?: number | null;
}): string {
  const devise = params.devise ?? "FCFA";
  const reste = params.reste != null && params.reste > 0 ? params.reste : params.montant;
  return [
    params.clientNom ? `Bonjour ${params.clientNom},` : "Bonjour,",
    "",
    `Sauf erreur de notre part, la facture N°${params.numero} reste à régler : ${formatMontant(reste, devise)}.`,
    "Merci de procéder au paiement dès que possible. Si c'est déjà fait, ne tenez pas compte de ce message.",
    "",
    "Cordialement,",
    params.entrepriseNom ?? "",
  ].join("\n").trim();
}

export function whatsappUrl(phone: string, message: string, country?: string | null): string {
  const p = normalizePhone(phone, country);
  return p
    ? `https://wa.me/${p}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
