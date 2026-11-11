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
  const [r, g, b] = hexToRgb(doc.entreprise.couleur_primaire || "#0A63F0");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const devise = doc.entreprise.devise;
  const ink: [number, number, number] = [20, 24, 28];
  const muted: [number, number, number] = [62, 68, 74];
  const hair: [number, number, number] = [214, 219, 223];
  const isDevis = doc.type === "devis";

  // Bandeau de marque
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageW, 6, "F");

  let headerTextX = margin;
  const logo = doc.entreprise.logo_url;
  if (logo && /^data:image\/(png|jpe?g|svg\+xml|webp)/i.test(logo)) {
    try {
      const fmt = logo.includes("image/png") ? "PNG" : logo.includes("image/webp") ? "WEBP" : "JPEG";
      pdf.addImage(logo, fmt, margin, 13, 22, 22, undefined, "FAST");
      headerTextX = margin + 26;
    } catch {
      /* logo ignoré si illisible */
    }
  }
  const leftW = pageW - margin - 62 - headerTextX;

  pdf.setTextColor(...ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  const nomLines = pdf.splitTextToSize(doc.entreprise.nom, leftW);
  pdf.text(nomLines, headerTextX, 20);
  let hy = 20 + (nomLines.length - 1) * 7 + 6;
  if (doc.entreprise.slogan) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(...muted);
    pdf.text(doc.entreprise.slogan, headerTextX, hy);
    hy += 5.5;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...muted);
  const coord: string[] = [];
  if (doc.entreprise.adresse) coord.push(doc.entreprise.adresse);
  const cityLine = [doc.entreprise.ville, doc.entreprise.pays].filter(Boolean).join(", ");
  if (cityLine) coord.push(cityLine);
  if (doc.entreprise.telephone) coord.push(`Tél : ${doc.entreprise.telephone}`);
  const web = [doc.entreprise.email, doc.entreprise.site_web].filter(Boolean).join("  ·  ");
  if (web) coord.push(web);
  const legal = [
    doc.entreprise.ninea ? `NINEA ${doc.entreprise.ninea}` : null,
    doc.entreprise.rc ? `RC ${doc.entreprise.rc}` : null,
  ].filter(Boolean).join("  ·  ");
  if (legal) coord.push(legal);
  coord.forEach((line) => {
    const ls = pdf.splitTextToSize(line, leftW);
    pdf.text(ls, headerTextX, hy);
    hy += ls.length * 5;
  });

  // Titre du document (droite)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(r, g, b);
  pdf.text(isDevis ? "DEVIS" : "FACTURE", pageW - margin, 22, { align: "right" });
  pdf.setFontSize(12);
  pdf.setTextColor(...ink);
  pdf.text(`N° ${doc.numero}`, pageW - margin, 29.5, { align: "right" });

  const sepY = Math.max(hy + 2, 40);
  pdf.setDrawColor(...hair);
  pdf.setLineWidth(0.4);
  pdf.line(margin, sepY, pageW - margin, sepY);

  // Client / détails
  const blockY = sepY + 8;
  const rightX = margin + contentW * 0.56;
  const clientW = rightX - margin - 6;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(r, g, b);
  pdf.text(isDevis ? "DEVIS ADRESSÉ À" : "FACTURÉ À", margin, blockY);
  pdf.setTextColor(...ink);
  pdf.setFontSize(12);
  const clientName = [doc.client.prenom, doc.client.nom].filter(Boolean).join(" ").trim();
  let cy = blockY + 7;
  if (clientName) {
    const ls = pdf.splitTextToSize(clientName, clientW);
    pdf.text(ls, margin, cy);
    cy += ls.length * 5.6;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(...muted);
  [doc.client.entreprise_nom, doc.client.adresse, doc.client.ville,
    doc.client.telephone ? `Tél : ${doc.client.telephone}` : null, doc.client.email]
    .filter(Boolean)
    .forEach((line) => {
      const ls = pdf.splitTextToSize(String(line), clientW);
      pdf.text(ls, margin, cy);
      cy += ls.length * 5.2;
    });

  const detailRows: [string, string][] = [
    ["Date d'émission", formatDate(doc.date_emission)],
    [isDevis ? "Valable jusqu'au" : "Échéance", formatDate((isDevis ? doc.date_validite : doc.date_echeance) ?? null)],
  ];
  const boxH = 13 + detailRows.length * 7;
  pdf.setFillColor(246, 248, 249);
  pdf.setDrawColor(...hair);
  pdf.roundedRect(rightX, blockY - 6, pageW - margin - rightX, boxH, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(r, g, b);
  pdf.text("DÉTAILS", rightX + 5, blockY);
  let iy = blockY + 7.5;
  detailRows.forEach(([k, v]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...muted);
    pdf.text(k, rightX + 5, iy);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...ink);
    pdf.text(v, pageW - margin - 5, iy, { align: "right" });
    iy += 7;
  });

  // Objet
  let oy = Math.max(cy, blockY - 6 + boxH) + 5;
  if (doc.objet) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...ink);
    pdf.text("Objet :", margin, oy);
    pdf.setFont("helvetica", "normal");
    const objetLines = pdf.splitTextToSize(doc.objet, contentW - 15);
    pdf.text(objetLines, margin + 14, oy);
    oy += objetLines.length * 5.2 + 3;
  }

  // Tableau
  autoTable(pdf, {
    startY: oy,
    head: [["#", "Description", "Qté", "Unité", "P.U. HT", "TVA", "Total TTC"]],
    body: doc.lignes.map((l, i) => [
      String(i + 1),
      l.description,
      formatNumberQte(l.quantite),
      l.unite,
      money(l.prix_unitaire, devise),
      doc.tva_active ? `${l.tva_taux}%` : "—",
      money(l.total_ttc, devise),
    ]),
    theme: "plain",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    styles: {
      font: "helvetica",
      fontSize: 10.5,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2.2, right: 2.2 },
      textColor: ink,
      lineColor: hair,
      lineWidth: { bottom: 0.2 },
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [r, g, b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [246, 248, 249] },
    columnStyles: {
      0: { halign: "center", cellWidth: 9, textColor: muted },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 13 },
      3: { halign: "center", cellWidth: 17, textColor: muted },
      4: { halign: "right", cellWidth: 37 },
      5: { halign: "center", cellWidth: 14, textColor: muted },
      6: { halign: "right", cellWidth: 36, fontStyle: "bold" },
    },
    margin: { left: margin, right: margin, top: 18, bottom: 24 },
  });

  // Totaux
  // @ts-expect-error lastAutoTable est ajouté par le plugin autoTable
  let ty = (pdf.lastAutoTable?.finalY ?? oy + 60) + 8;
  const totalsW = 88;
  const labelX = pageW - margin - totalsW;
  const valueX = pageW - margin;
  const rows: [string, string][] = [["Sous-total HT", money(doc.sous_total, devise)]];
  if (doc.remise_montant > 0) rows.push(["Remise", `- ${money(doc.remise_montant, devise)}`]);
  if (doc.tva_active && doc.montant_tva > 0) rows.push(["TVA", money(doc.montant_tva, devise)]);
  const totalsH = rows.length * 7 + (doc.tva_active ? 0 : 6) + 16;
  const sigH = 26;
  const blockH = Math.max(totalsH, isDevis ? sigH : 0);
  // Totaux et zone « Bon pour accord » restent toujours ensemble
  if (ty + blockH > pageH - 20) {
    pdf.addPage();
    ty = 24;
  }
  const totalsTop = ty - 5;
  if (isDevis) {
    const sigW = contentW - totalsW - 10;
    pdf.setDrawColor(...hair);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin, totalsTop, sigW, sigH, 2, 2, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...ink);
    pdf.text("Bon pour accord", margin + 4, totalsTop + 6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...muted);
    pdf.text("Date et signature du client", margin + 4, totalsTop + 11.5);
  }
  rows.forEach(([k, v]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...muted);
    pdf.text(k, labelX, ty);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...ink);
    pdf.text(v, valueX, ty, { align: "right" });
    ty += 7;
  });
  if (!doc.tva_active) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...muted);
    pdf.text("TVA non applicable", labelX, ty);
    ty += 6;
  }
  ty += 1;
  pdf.setFillColor(r, g, b);
  pdf.roundedRect(labelX - 4, ty, totalsW + 4, 14, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("TOTAL TTC", labelX, ty + 9);
  pdf.setFontSize(14);
  pdf.text(money(doc.total_ttc, devise), valueX - 3, ty + 9.3, { align: "right" });
  ty = Math.max(ty + 14, isDevis ? totalsTop + sigH : 0) + 9;

  // Notes / conditions / mentions
  const blocks: [string, string][] = [];
  if (doc.conditions_paiement) blocks.push(["Conditions de paiement", doc.conditions_paiement]);
  if (doc.notes) blocks.push(["Notes", doc.notes]);
  if (doc.entreprise.coordonnees_bancaires) blocks.push(["Coordonnées bancaires", doc.entreprise.coordonnees_bancaires]);
  if (doc.entreprise.mentions_legales) blocks.push(["Mentions légales", doc.entreprise.mentions_legales]);
  blocks.forEach(([title, body]) => {
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(body, contentW);
    const needed = 5.5 + lines.length * 4.95 + 4;
    if (ty + needed > pageH - 18) {
      pdf.addPage();
      ty = 24;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(r, g, b);
    pdf.text(title.toUpperCase(), margin, ty);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...muted);
    pdf.text(lines, margin, ty + 5.5, { lineHeightFactor: 1.4 });
    ty += needed;
  });

  // Pied de page
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...hair);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageH - 15, pageW - margin, pageH - 15);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(`${doc.entreprise.nom} — Document généré avec JOKTALY`, margin, pageH - 9.5);
    pdf.text(`Page ${p} / ${total}`, pageW - margin, pageH - 9.5, { align: "right" });
  }
  return pdf;
}

function money(v: number, devise: string): string {
  // Remplace les espaces insécables/fines par des espaces normaux (police PDF)
  return formatMontant(v, devise).replace(/[\u202F\u00A0]/g, " ");
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