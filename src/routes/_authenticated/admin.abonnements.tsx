import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { privateHead } from "@/lib/private-head";
import { supabase } from "@/integrations/supabase/client";
import { listAbonnementsAdmin, activateAbonnementAdmin } from "@/lib/abonnement.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/abonnements")({
  head: privateHead("Abonnements (admin)", "Validation manuelle des paiements Wave et historique des abonnements."),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/dashboard" });
  },
  component: AbonnementsAdminPage,
});

const STATUT: Record<string, string> = { en_attente: "En attente", paye: "Payé", annule: "Annulé", echoue: "Échoué" };

function AbonnementsAdminPage() {
  const list = useServerFn(listAbonnementsAdmin);
  const activate = useServerFn(activateAbonnementAdmin);
  const qc = useQueryClient();
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-abonnements"], queryFn: () => list() });

  const onActivate = async (id: string) => {
    setBusy(id);
    try {
      const r = await activate({ data: { id, reference: refs[id] ?? "" } });
      toast.success(`Formule activée jusqu'au ${new Date(r.expiresAt).toLocaleDateString("fr-FR")}`);
      qc.invalidateQueries({ queryKey: ["admin-abonnements"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez le paiement dans votre application Wave, puis saisissez sa référence pour activer la formule.
          Une référence ne peut servir qu'une fois.
        </p>
      </div>
      <div className="rounded-2xl border bg-card">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Chargement…</div>}
        {error && <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>}
        {data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">Aucun abonnement pour l'instant.</div>}
        <div className="divide-y">
          {data?.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{a.email || a.user_id.slice(0, 8)}</span>
                  <Badge variant={a.statut === "paye" ? "default" : "secondary"}>{STATUT[a.statut] ?? a.statut}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {a.plan} · {a.cycle === "yearly" ? "annuel" : "mensuel"} · {a.montant.toLocaleString("fr-FR")} FCFA ·{" "}
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  {a.provider_token ? ` · réf. ${a.provider_token}` : ""}
                  {a.statut === "paye" && a.expireLe ? ` · expire le ${new Date(a.expireLe).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
              {a.statut === "en_attente" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Référence Wave"
                    className="h-11 text-base md:text-sm"
                    value={refs[a.id] ?? ""}
                    onChange={(e) => setRefs((r) => ({ ...r, [a.id]: e.target.value }))}
                  />
                  <Button className="h-11" disabled={busy === a.id} onClick={() => onActivate(a.id)}>
                    {busy === a.id ? "Activation…" : "Activer"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
