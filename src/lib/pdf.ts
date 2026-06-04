import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMontant, formatDate } from "./format";

export interface PdfLigne {
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  tva_taux: number;
  total_ht: number;
  total_ttc: number;
}

export interface PdfDoc {
  type: "devis" | "facture";
  numero: string;
  titre?: string | null;
  objet?: string | null;
  date_emission: string;
  date_echeance?: string | null;
  date_validite?: string | null;
  statut?: string;
  sous_total: number;
  montant_tva: number;
  total_ttc: number;
  remise_montant: number;
  tva_active: boolean;
  notes?: string | null;
  conditions_paiement?: string | null;
  lignes: PdfLigne[];
  client: {
    nom: string;
    prenom?: string | null;
    entreprise_nom?: string | null;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    ville?: string | null;
  };
  entreprise: {
    nom: string;
    slogan?: string | null;
    logo_url?: string | null;
    adresse?: string | null;
    ville?: string | null;
    pays?: string | null;
    telephone?: string | null;
    email?: string | null;
    site_web?: string | null;
    ninea?: string | null;
    rc?: string | null;
    devise: string;
    couleur_primaire: string;
    coordonnees_bancaires?: string | null;
    mentions_legales?: string | null;
  };
}

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export function generatePdf(doc: PdfDoc): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const [r, g, b] = hexToRgb(doc.entreprise.couleur_primaire || "#1D9E75");
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // ===== EN-TETE =====
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageW, 35, "F");

  // Logo (si data URI)
  let textX = margin;
  const logo = doc.entreprise.logo_url;
  if (logo && /^data:image\/(png|jpe?g|svg\+xml|webp)/i.test(logo)) {
    try {
      const fmt = logo.includes("image/png")
        ? "PNG"
        : logo.includes("image/webp")
        ? "WEBP"
        : "JPEG";
      pdf.addImage(logo, fmt, margin, 6, 22, 22, undefined, "FAST");
      textX = margin + 26;
    } catch {
      /* ignore logo errors */
    }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(doc.entreprise.nom, textX, 15);
  if (doc.entreprise.slogan) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(doc.entreprise.slogan, textX, 21);
  }

  // Type document (droite)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  const label = doc.type === "devis" ? "DEVIS" : "FACTURE";
  pdf.text(label, pageW - margin, 18, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`N° ${doc.numero}`, pageW - margin, 26, { align: "right" });

  // Coordonnées entreprise
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  let y = 42;
  const lines: string[] = [];
  if (doc.entreprise.adresse) lines.push(doc.entreprise.adresse);
  if (doc.entreprise.ville || doc.entreprise.pays)
    lines.push([doc.entreprise.ville, doc.entreprise.pays].filter(Boolean).join(", "));
  if (doc.entreprise.telephone) lines.push(`Tél : ${doc.entreprise.telephone}`);
  if (doc.entreprise.email) lines.push(`Email : ${doc.entreprise.email}`);
  if (doc.entreprise.site_web) lines.push(doc.entreprise.site_web);
  const meta: string[] = [];
  if (doc.entreprise.ninea) meta.push(`NINEA : ${doc.entreprise.ninea}`);
  if (doc.entreprise.rc) meta.push(`RC : ${doc.entreprise.rc}`);
  if (meta.length) lines.push(meta.join("  |  "));
  lines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 4.5;
  });

  // ===== BLOC DESTINATAIRE =====
  const blocY = Math.max(y + 6, 65);
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, blocY - 4, pageW - margin, blocY - 4);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(r, g, b);
  pdf.text(doc.type === "devis" ? "DEVIS ADRESSÉ À" : "FACTURÉ À", margin, blocY + 2);

  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  const clientName = [doc.client.prenom, doc.client.nom].filter(Boolean).join(" ");
  pdf.text(clientName, margin, blocY + 9);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  let cy = blocY + 14;
  if (doc.client.entreprise_nom) {
    pdf.text(doc.client.entreprise_nom, margin, cy);
    cy += 4.5;
  }
  if (doc.client.adresse) {
    pdf.text(doc.client.adresse, margin, cy);
    cy += 4.5;
  }
  if (doc.client.ville) {
    pdf.text(doc.client.ville, margin, cy);
    cy += 4.5;
  }
  if (doc.client.telephone) {
    pdf.text(`Tél : ${doc.client.telephone}`, margin, cy);
    cy += 4.5;
  }
  if (doc.client.email) {
    pdf.text(doc.client.email, margin, cy);
    cy += 4.5;
  }

  // Infos document (droite)
  const infoX = pageW - margin - 70;
  let iy = blocY + 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(r, g, b);
  pdf.text("DÉTAILS", infoX, iy);
  iy += 6;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Date d'émission :`, infoX, iy);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatDate(doc.date_emission), pageW - margin, iy, { align: "right" });
  iy += 5;
  pdf.setFont("helvetica", "normal");
  const echLabel = doc.type === "devis" ? "Valable jusqu'au :" : "Date d'échéance :";
  const echValue = doc.type === "devis" ? doc.date_validite : doc.date_echeance;
  pdf.text(echLabel, infoX, iy);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatDate(echValue ?? null), pageW - margin, iy, { align: "right" });

  // Objet
  let oy = Math.max(cy, iy) + 8;
  if (doc.objet) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(30, 30, 30);
    pdf.text("Objet : ", margin, oy);
    pdf.setFont("helvetica", "normal");
    pdf.text(doc.objet, margin + 16, oy);
    oy += 6;
  }

  // ===== TABLEAU =====
  autoTable(pdf, {
    startY: oy + 2,
    head: [["N°", "Description", "Qté", "Unité", "P.U. HT", "TVA", "Total TTC"]],
    body: doc.lignes.map((l, i) => [
      String(i + 1),
      l.description,
      String(l.quantite),
      l.unite,
      formatMontant(l.prix_unitaire, doc.entreprise.devise),
      doc.tva_active ? `${l.tva_taux}%` : "—",
      formatMontant(l.total_ttc, doc.entreprise.devise),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "right", cellWidth: 14 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });

  // ===== TOTAUX =====
  // @ts-expect-error lastAutoTable is added by autoTable plugin
  let ty = (pdf.lastAutoTable?.finalY ?? oy + 60) + 6;
  const totalsX = pageW - margin - 70;
  const labelX = totalsX;
  const valueX = pageW - margin;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  pdf.text("Sous-total HT :", labelX, ty);
  pdf.text(formatMontant(doc.sous_total, doc.entreprise.devise), valueX, ty, { align: "right" });
  ty += 6;
  if (doc.remise_montant > 0) {
    pdf.text("Remise :", labelX, ty);
    pdf.text(`- ${formatMontant(doc.remise_montant, doc.entreprise.devise)}`, valueX, ty, { align: "right" });
    ty += 6;
  }
  if (doc.tva_active && doc.montant_tva > 0) {
    pdf.text("TVA :", labelX, ty);
    pdf.text(formatMontant(doc.montant_tva, doc.entreprise.devise), valueX, ty, { align: "right" });
    ty += 6;
  } else if (!doc.tva_active) {
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("TVA non applicable", labelX, ty);
    ty += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
  }

  pdf.setFillColor(r, g, b);
  pdf.rect(labelX - 4, ty - 4, pageW - margin - labelX + 4, 10, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("TOTAL TTC :", labelX, ty + 2);
  pdf.text(formatMontant(doc.total_ttc, doc.entreprise.devise), valueX, ty + 2, { align: "right" });
  ty += 14;

  // ===== NOTES / CONDITIONS =====
  pdf.setTextColor(40, 40, 40);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (doc.conditions_paiement) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Conditions de paiement :", margin, ty);
    pdf.setFont("helvetica", "normal");
    const split = pdf.splitTextToSize(doc.conditions_paiement, pageW - 2 * margin);
    pdf.text(split, margin, ty + 5);
    ty += 5 + split.length * 4.5 + 3;
  }
  if (doc.notes) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Notes :", margin, ty);
    pdf.setFont("helvetica", "normal");
    const split = pdf.splitTextToSize(doc.notes, pageW - 2 * margin);
    pdf.text(split, margin, ty + 5);
    ty += 5 + split.length * 4.5 + 3;
  }
  if (doc.entreprise.coordonnees_bancaires) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Coordonnées bancaires :", margin, ty);
    pdf.setFont("helvetica", "normal");
    const split = pdf.splitTextToSize(doc.entreprise.coordonnees_bancaires, pageW - 2 * margin);
    pdf.text(split, margin, ty + 5);
    ty += 5 + split.length * 4.5 + 3;
  }
  if (doc.entreprise.mentions_legales) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Mentions légales :", margin, ty);
    pdf.setFont("helvetica", "normal");
    const split = pdf.splitTextToSize(doc.entreprise.mentions_legales, pageW - 2 * margin);
    pdf.text(split, margin, ty + 5);
  }

  // ===== PIED DE PAGE =====
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(margin, pageH - 15, pageW - margin, pageH - 15);
  pdf.setFontSize(8);
  pdf.setTextColor(140, 140, 140);
  pdf.text(`${doc.entreprise.nom} — Document généré avec DevisPro`, margin, pageH - 10);
  pdf.text(`Page 1`, pageW - margin, pageH - 10, { align: "right" });

  return pdf;
}

export function downloadPdf(doc: PdfDoc) {
  const pdf = generatePdf(doc);
  pdf.save(`${doc.numero}.pdf`);
}

export function getPdfBlob(doc: PdfDoc): Blob {
  return generatePdf(doc).output("blob");
}

export function getPdfDataUrl(doc: PdfDoc): string {
  return generatePdf(doc).output("datauristring");
}