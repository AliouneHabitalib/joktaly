import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActivityLogs } from "@/lib/activity-log.functions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/journal")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/dashboard" });
  },
  component: JournalPage,
});

const LABELS: Record<string, { label: string; tone: "default" | "secondary" | "destructive" }> = {
  devis_created: { label: "Devis créé", tone: "default" },
  facture_created: { label: "Facture créée", tone: "default" },
  quota_refused_devis: { label: "Quota devis refusé", tone: "destructive" },
  quota_refused_facture: { label: "Quota facture refusé", tone: "destructive" },
};

function JournalPage() {
  const fetchLogs = useServerFn(listActivityLogs);
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => fetchLogs(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Journal d'activités</h1>
        <p className="text-sm text-muted-foreground">
          Créations de devis/factures et refus liés aux quotas (admin).
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Chargement…</div>}
        {error && <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>}
        {data && data.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">Aucune activité enregistrée.</div>
        )}
        {data && data.length > 0 && (
          <div className="divide-y">
            {data.map((log) => {
              const meta = LABELS[log.type] ?? { label: log.type, tone: "secondary" as const };
              return (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                      <span className="truncate text-sm">{log.message ?? ""}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      User: <span className="font-mono">{log.user_id?.slice(0, 8) ?? "—"}</span>
                      {log.entreprise_id && (
                        <> · Entreprise: <span className="font-mono">{log.entreprise_id.slice(0, 8)}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}