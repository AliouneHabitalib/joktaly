import { formatMontant } from "./format";

export interface WhatsappTarget {
  phone: string | null;
  message: string;
}

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // Numéro local sénégalais (7xxxxxxxx / 77xxxxxxx) → préfixe pays 221
  if (digits.length === 9 && digits.startsWith("7")) return `221${digits}`;
  return digits;
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

export function whatsappUrl(phone: string, message: string): string {
  const p = normalizePhone(phone);
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
