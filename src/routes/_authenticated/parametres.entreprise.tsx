import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/private-head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Image as ImageIcon,
  Palette,
  FileText,
  Save,
  RotateCcw,
  Upload,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/parametres/entreprise")({
  head: privateHead("Paramètres de l'entreprise", "Modifiez les informations, le logo et l'identité visuelle de votre entreprise."),
  component: ParametresEntreprisePage,
});

type FormState = {
  nom: string;
  slogan: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  site_web: string;
  ninea: string;
  rc: string;
  devise: string;
  tva_taux: string;
  couleur_primaire: string;
  logo_url: string;
  coordonnees_bancaires: string;
  // extras (localStorage)
  couleur_secondaire: string;
  prefixe_devis: string;
  prefixe_facture: string;
  numerotation_auto: boolean;
  conditions_paiement: string;
  mentions_legales: string;
};

const DEFAULTS: FormState = {
  nom: "",
  slogan: "",
  adresse: "",
  ville: "",
  pays: "Sénégal",
  telephone: "",
  email: "",
  site_web: "",
  ninea: "",
  rc: "",
  devise: "FCFA",
  tva_taux: "18",
  couleur_primaire: "#0A63F0",
  logo_url: "",
  coordonnees_bancaires: "",
  couleur_secondaire: "#C9A84C",
  prefixe_devis: "DEV-",
  prefixe_facture: "FAC-",
  numerotation_auto: true,
  conditions_paiement: "Paiement à 30 jours à compter de la date d'émission.",
  mentions_legales: "",
};

const extrasKey = (id: string) => `devispro:entreprise-extras:${id}`;

function ParametresEntreprisePage() {
  const { user } = useAuth();
  const { data: entreprise, isLoading } = useEntreprise(user?.id);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entreprise) return;
    let extras: Partial<FormState> = {};
    try {
      const raw = localStorage.getItem(extrasKey(entreprise.id));
      if (raw) extras = JSON.parse(raw);
    } catch {}
    setForm({
      ...DEFAULTS,
      nom: entreprise.nom ?? "",
      slogan: entreprise.slogan ?? "",
      adresse: entreprise.adresse ?? "",
      ville: entreprise.ville ?? "",
      pays: entreprise.pays ?? "Sénégal",
      telephone: entreprise.telephone ?? "",
      email: entreprise.email ?? "",
      site_web: entreprise.site_web ?? "",
      ninea: entreprise.ninea ?? "",
      rc: entreprise.rc ?? "",
      devise: entreprise.devise ?? "FCFA",
      tva_taux: String(entreprise.tva_taux ?? 18),
      couleur_primaire: entreprise.couleur_primaire ?? "#0A63F0",
      logo_url: entreprise.logo_url ?? "",
      coordonnees_bancaires: entreprise.coordonnees_bancaires ?? "",
      ...extras,
    });
  }, [entreprise]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onLogoFile = async (file: File) => {
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Logo trop volumineux (max 1.5 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logo_url", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.nom.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        nom: form.nom.trim(),
        slogan: form.slogan || null,
        adresse: form.adresse || null,
        ville: form.ville || null,
        pays: form.pays || "Sénégal",
        telephone: form.telephone || null,
        email: form.email || null,
        site_web: form.site_web || null,
        ninea: form.ninea || null,
        rc: form.rc || null,
        devise: form.devise || "FCFA",
        tva_taux: Number(form.tva_taux) || 0,
        couleur_primaire: form.couleur_primaire || "#0A63F0",
        logo_url: form.logo_url || null,
        coordonnees_bancaires: form.coordonnees_bancaires || null,
      };
      let res;
      if (entreprise) {
        res = await supabase
          .from("entreprises")
          .update(payload)
          .eq("id", entreprise.id)
          .select()
          .single();
      } else {
        res = await supabase.from("entreprises").insert(payload).select().single();
      }
      if (res.error) throw res.error;
      const id = res.data.id;
      const extras = {
        couleur_secondaire: form.couleur_secondaire,
        prefixe_devis: form.prefixe_devis,
        prefixe_facture: form.prefixe_facture,
        numerotation_auto: form.numerotation_auto,
        conditions_paiement: form.conditions_paiement,
        mentions_legales: form.mentions_legales,
      };
      localStorage.setItem(extrasKey(id), JSON.stringify(extras));
      await queryClient.invalidateQueries({ queryKey: ["entreprise", user.id] });
      toast.success("Paramètres enregistrés avec succès.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS, nom: form.nom });
    toast.message("Champs réinitialisés (non sauvegardés).");
  };

  const preview = useMemo(
    () => ({
      primary: form.couleur_primaire || "#0A63F0",
      secondary: form.couleur_secondaire || "#C9A84C",
    }),
    [form.couleur_primaire, form.couleur_secondaire],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Paramètres entreprise
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez les informations qui apparaîtront sur vos devis et factures.
        </p>
      </header>

      {/* Informations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Informations de l'entreprise</CardTitle>
          </div>
          <CardDescription>Identité légale et coordonnées.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de l'entreprise *">
            <Input value={form.nom} onChange={(e) => update("nom", e.target.value)} />
          </Field>
          <Field label="Nom commercial / slogan">
            <Input value={form.slogan} onChange={(e) => update("slogan", e.target.value)} />
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            <Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
          </Field>
          <Field label="Ville">
            <Input value={form.ville} onChange={(e) => update("ville", e.target.value)} />
          </Field>
          <Field label="Pays">
            <Input value={form.pays} onChange={(e) => update("pays", e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Site web">
            <Input value={form.site_web} onChange={(e) => update("site_web", e.target.value)} />
          </Field>
          <Field label="NINEA">
            <Input value={form.ninea} onChange={(e) => update("ninea", e.target.value)} />
          </Field>
          <Field label="RCCM / RC">
            <Input value={form.rc} onChange={(e) => update("rc", e.target.value)} />
          </Field>
          <Field label="Devise par défaut">
            <Select value={form.devise} onValueChange={(v) => update("devise", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFA">FCFA</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Taux de TVA par défaut (%)">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.tva_taux}
              onChange={(e) => update("tva_taux", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Identité visuelle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Logo et identité visuelle</CardTitle>
          </div>
          <CardDescription>Personnalisez l'apparence de vos documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Logo de l'entreprise</Label>
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. 1.5 Mo maximum.</p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoFile(f);
                  }}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Importer un logo
                </Button>
                {form.logo_url && (
                  <Button type="button" variant="ghost" onClick={() => update("logo_url", "")}>
                    <Trash2 className="h-4 w-4" /> Retirer
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Couleur principale"
              value={form.couleur_primaire}
              onChange={(v) => update("couleur_primaire", v)}
            />
            <ColorField
              label="Couleur secondaire"
              value={form.couleur_secondaire}
              onChange={(v) => update("couleur_secondaire", v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Aperçu sur un devis</Label>
            <div className="overflow-hidden rounded-lg border bg-card">
              <div
                className="flex items-center justify-between px-4 py-3 text-white"
                style={{ backgroundColor: preview.primary }}
              >
                <div className="flex items-center gap-3">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-white/20" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">{form.nom || "Votre entreprise"}</div>
                    <div className="text-xs opacity-80">{form.slogan || "Slogan / nom commercial"}</div>
                  </div>
                </div>
                <span
                  className="rounded px-2 py-1 text-xs font-semibold"
                  style={{ backgroundColor: preview.secondary, color: "#111" }}
                >
                  {form.prefixe_devis}2026-001
                </span>
              </div>
              <div className="space-y-1 px-4 py-3 text-sm">
                <div className="flex justify-between"><span>Sous-total</span><span>150 000 {form.devise}</span></div>
                <div className="flex justify-between"><span>TVA ({form.tva_taux || 0}%)</span><span>27 000 {form.devise}</span></div>
                <div className="flex justify-between font-semibold" style={{ color: preview.primary }}>
                  <span>Total TTC</span><span>177 000 {form.devise}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devis & factures */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Devis et factures</CardTitle>
          </div>
          <CardDescription>Numérotation et mentions par défaut.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Préfixe des devis">
              <Input value={form.prefixe_devis} onChange={(e) => update("prefixe_devis", e.target.value)} />
            </Field>
            <Field label="Préfixe des factures">
              <Input value={form.prefixe_facture} onChange={(e) => update("prefixe_facture", e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Numérotation automatique</Label>
              <p className="text-xs text-muted-foreground">
                Génère un numéro unique pour chaque document.
              </p>
            </div>
            <Switch
              checked={form.numerotation_auto}
              onCheckedChange={(v) => update("numerotation_auto", v)}
            />
          </div>
          <Field label="Conditions de paiement par défaut">
            <Textarea
              rows={2}
              value={form.conditions_paiement}
              onChange={(e) => update("conditions_paiement", e.target.value)}
            />
          </Field>
          <Field label="Notes / mentions légales (bas de page)">
            <Textarea
              rows={3}
              value={form.mentions_legales}
              onChange={(e) => update("mentions_legales", e.target.value)}
              placeholder="Ex. NINEA, RC, conditions générales de vente…"
            />
          </Field>
          <Field label="Coordonnées bancaires">
            <Textarea
              rows={2}
              value={form.coordonnees_bancaires}
              onChange={(e) => update("coordonnees_bancaires", e.target.value)}
              placeholder="Banque, IBAN, RIB…"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-lg sm:border sm:px-4">
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          <RotateCcw className="h-4 w-4" /> Réinitialiser
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" />
      </div>
    </div>
  );
}