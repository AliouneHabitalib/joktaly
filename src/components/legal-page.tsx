import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const LEGAL = {
  nom: "JOKTALY",
  responsable: "Alioune Habitalib COULIBALY",
  ninea: "002431708",
  rccm: "SN-DKR-2004-A-15961",
  siege: "Dakar, Sénégal",
  contact: "contact@joktaly.com",
  support: "support@joktaly.com",
};

export const LEGAL_LINKS = [
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite", label: "Confidentialité" },
  { to: "/cgu", label: "CGU" },
  { to: "/cgv", label: "CGV et résiliation" },
] as const;

export function publicHead(path: string, title: string, description: string) {
  const url = `https://www.joktaly.com${path}`;
  return () => ({
    meta: [
      { title: `${title} — JOKTALY` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — JOKTALY` },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `${title} — JOKTALY` },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  });
}

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/joktaly-insigne.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold">JOKTALY</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        {updated && <p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>}
        <div className="mt-8 space-y-6 text-base leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <footer className="border-t bg-card py-6">
        <nav className="container mx-auto flex flex-wrap gap-x-5 gap-y-2 px-4 text-sm text-muted-foreground">
          {LEGAL_LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:text-primary">{l.label}</Link>)}
        </nav>
      </footer>
    </div>
  );
}
