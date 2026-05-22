export const formatMontant = (value: number | string | null | undefined, devise = "FCFA"): string => {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(n)) return `0 ${devise}`;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n))} ${devise}`;
};

export const formatNumber = (value: number | string | null | undefined): string => {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateLong = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export const addDays = (date: Date, days: number): Date => {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
};

export const toDateInput = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
};