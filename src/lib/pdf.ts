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
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const devise = doc.entreprise.devise;
  const ink: [number, number, number] = [33, 37, 41];
  const muted: [number, number, number] = [108, 117, 125];
  const hair: [number, number, number] = [226, 230, 232];

  // ============ EN-TÊTE ============
  // Filet de marque fin en haut de page (élégant, économe en encre)
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageW, 4, "F");

  let headerTextX = margin;
  const logo = doc.entreprise.logo_url;
  if (logo && /^data:image\/(png|jpe?g|svg\+xml|webp)/i.test(logo)) {
    try {
      const fmt = logo.includes("image/png")
        ? "PNG"
        : logo.includes("image/webp")
        ? "WEBP"
        : "JPEG";
      pdf.addImage(logo, fmt, margin, 14, 20, 20, undefined, "FAST");
      headerTextX = margin + 25;
    } catch {
      /* logo ignoré si illisible */
    }
  }

  pdf.setTextColor(...ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(doc.entreprise.nom, headerTextX, 21);
  let hy = 26;
  if (doc.entreprise.slogan) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(doc.entreprise.slogan, headerTextX, hy);
    hy += 5;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...muted);
  const coord: string[] = [];
  if (doc.entreprise.adresse) coord.push(doc.entreprise.adresse);
  const cityLine = [doc.entreprise.ville, doc.entreprise.pays].filter(Boolean).join(", ");
  if (cityLine) coord.push(cityLine);
  const contact = [doc.entreprise.telephone, doc.entreprise.email, doc.entreprise.site_web]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) coord.push(contact);
  const legal = [
    doc.entreprise.ninea ? `NINEA ${doc.entreprise.ninea}` : null,
    doc.entreprise.rc ? `RC ${doc.entreprise.rc}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (legal) coord.push(legal);
  coord.forEach((line) => {
    pdf.text(line, headerTextX, hy);
    hy += 4.4;
  });

  // Bloc titre document (droite)
  const label = doc.type === "devis" ? "DEVIS" : "FACTURE";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(r, g, b);
  pdf.text(label, pageW - margin, 24, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(...muted);
  pdf.text(`N° ${doc.numero}`, pageW - margin, 30.5, { align: "right" });

  // Séparateur
  const sepY = Math.max(hy + 4, 42);
  pdf.setDrawColor(...hair);
  pdf.setLineWidth(0.3);
  pdf.line(margin, sepY, pageW - margin, sepY);

  // ============ CLIENT / DÉTAILS ============
  const blockY = sepY + 10;
  const rightX = margin + contentW * 0.58;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(r, g, b);
  pdf.text(doc.type === "devis" ? "DEVIS ADRESSÉ À" : "FACTURÉ À", margin, blockY);

  pdf.setTextColor(...ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  const clientName = [doc.client.prenom, doc.client.nom].filter(Boolean).join(" ").trim();
  let cy = blockY + 7;
  if (clientName) {
    pdf.text(clientName, margin, cy);
    cy += 5;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  [
    doc.client.entreprise_nom,
    doc.client.adresse,
    doc.client.ville,
    doc.client.telephone ? `Tél : ${doc.client.telephone}` : null,
    doc.client.email,
  ]
    .filter(Boolean)
    .forEach((line) => {
      pdf.text(String(line), margin, cy);
      cy += 4.6;
    });

  // Encadré détails (droite)
  const echLabel = doc.type === "devis" ? "Valable jusqu'au" : "Échéance";
  const echValue = doc.type === "devis" ? doc.date_validite : doc.date_echeance;
  const detailRows: [string, string][] = [
    ["Date d'émission", formatDate(doc.date_emission)],
    [echLabel, formatDate(echValue ?? null)],
  ];
  const boxH = 12 + detailRows.length * 6;
  pdf.setFillColor(250, 251, 251);
  pdf.setDrawColor(...hair);
  pdf.roundedRect(rightX, blockY - 5, pageW - margin - rightX, boxH, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(r, g, b);
  pdf.text("DÉTAILS", rightX + 5, blockY);
  let iy = blockY + 7;
  detailRows.forEach(([k, v]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(k, rightX + 5, iy);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...ink);
    pdf.text(v, pageW - margin - 5, iy, { align: "right" });
    iy += 6;
  });

  // ============ OBJET ============
  let oy = Math.max(cy, blockY - 5 + boxH + 6) + 6;
  if (doc.objet) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...ink);
    pdf.text("Objet", margin, oy);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...muted);
    const objetLines = pdf.splitTextToSize(doc.objet, contentW);
    pdf.text(objetLines, margin, oy + 5);
    oy += 5 + objetLines.length * 4.8 + 3;
  }

  // ============ TABLEAU DES LIGNES ============
  autoTable(pdf, {
    startY: oy + 2,
    head: [["N°", "Description", "Qté", "Unité", "P.U. HT", "TVA", "Total TTC"]],
    body: doc.lignes.map((l, i) => [
      String(i + 1),
      l.description,
      formatNumberQte(l.quantite),
      l.unite,
      formatMontant(l.prix_unitaire, devise),
      doc.tva_active ? `${l.tva_taux}%` : "—",
      formatMontant(l.total_ttc, devise),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 3.4, bottom: 3.4, left: 3, right: 3 },
      textColor: ink,
      lineColor: hair,
      lineWidth: 0.1,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [r, g, b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [250, 251, 251] },
    columnStyles: {
      0: { halign: "center", cellWidth: 9, textColor: muted },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 14 },
      3: { halign: "center", cellWidth: 18, textColor: muted },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "center", cellWidth: 14, textColor: muted },
      6: { halign: "right", cellWidth: 32, fontStyle: "bold" },
    },
    margin: { left: margin, right: margin, bottom: 24 },
  });

  // ============ TOTAUX ============
  // @ts-expect-error lastAutoTable est ajouté par le plugin autoTable
  let ty = (pdf.lastAutoTable?.finalY ?? oy + 60) + 10;
  const totalsW = 78;
  const labelX = pageW - margin - totalsW;
  const valueX = pageW - margin;

  const rows: [string, string][] = [["Sous-total HT", formatMontant(doc.sous_total, devise)]];
  if (doc.remise_montant > 0)
    rows.push(["Remise", `- ${formatMontant(doc.remise_montant, devise)}`]);
  if (doc.tva_active && doc.montant_tva > 0)
    rows.push(["TVA", formatMontant(doc.montant_tva, devise)]);

  const totalsH = rows.length * 6.5 + (doc.tva_active ? 0 : 5) + 20;
  if (ty + totalsH > pageH - 26) {
    pdf.addPage();
    ty = 28;
  }

  pdf.setFontSize(9.5);
  rows.forEach(([k, v]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...muted);
    pdf.text(k, labelX, ty);
    pdf.setTextColor(...ink);
    pdf.text(v, valueX, ty, { align: "right" });
    ty += 6.5;
  });
  if (!doc.tva_active) {
    pdf.setFontSize(8);
    pdf.setTextColor(...muted);
    pdf.text("TVA non applicable", labelX, ty);
    ty += 5;
  }

  ty += 2;
  pdf.setFillColor(r, g, b);
  pdf.roundedRect(labelX - 4, ty, totalsW + 4, 13, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("TOTAL TTC", labelX, ty + 8.4);
  pdf.setFontSize(12);
  pdf.text(formatMontant(doc.total_ttc, devise), valueX, ty + 8.6, { align: "right" });
  ty += 22;

  // ============ NOTES / CONDITIONS ============
  const blocks: [string, string][] = [];
  if (doc.conditions_paiement) blocks.push(["Conditions de paiement", doc.conditions_paiement]);
  if (doc.notes) blocks.push(["Notes", doc.notes]);
  if (doc.entreprise.coordonnees_bancaires)
    blocks.push(["Coordonnées bancaires", doc.entreprise.coordonnees_bancaires]);
  if (doc.entreprise.mentions_legales)
    blocks.push(["Mentions légales", doc.entreprise.mentions_legales]);

  if (blocks.length) {
    pdf.setDrawColor(...hair);
    pdf.setLineWidth(0.3);
    pdf.line(margin, ty - 4, pageW - margin, ty - 4);
  }

  blocks.forEach(([title, body]) => {
    const lines = pdf.splitTextToSize(body, contentW);
    const needed = 6 + lines.length * 4.6 + 5;
    if (ty + needed > pageH - 24) {
      pdf.addPage();
      ty = 28;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(r, g, b);
    pdf.text(title.toUpperCase(), margin, ty);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(lines, margin, ty + 5);
    ty += needed;
  });

  // ============ PIED DE PAGE (toutes les pages) ============
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...hair);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageH - 16, pageW - margin, pageH - 16);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(150, 155, 158);
    pdf.text(`${doc.entreprise.nom} — Document généré avec TERA-DEVIS`, margin, pageH - 11);
    pdf.text(`Page ${p} / ${total}`, pageW - margin, pageH - 11, { align: "right" });
  }

  return pdf;
}

function formatNumberQte(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
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