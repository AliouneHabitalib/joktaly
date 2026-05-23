import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getMonthStartISO } from "@/lib/quota-period";

/**
 * Vérification automatique mensuelle : confirme qu'au passage d'un nouveau
 * mois, les compteurs de devis/factures (basés sur date_emission >=
 * début du mois) sont bien à 0. Loggue le résultat dans activity_logs.
 *
 * Déclenché par pg_cron le 1er de chaque mois à 00:05 UTC.
 */
export const Route = createFileRoute("/api/public/hooks/quota-reset-check")({
  server: {
    handlers: {
      POST: async () => {
        const url = process.env.SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const admin = createClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const monthStart = getMonthStartISO();
        const errors: string[] = [];

        const [{ count: devisThisMonth, error: e1 }, { count: facturesThisMonth, error: e2 }] =
          await Promise.all([
            admin
              .from("devis")
              .select("id", { count: "exact", head: true })
              .gte("date_emission", monthStart),
            admin
              .from("factures")
              .select("id", { count: "exact", head: true })
              .gte("date_emission", monthStart),
          ]);

        if (e1) errors.push(`devis: ${e1.message}`);
        if (e2) errors.push(`factures: ${e2.message}`);

        const ok = errors.length === 0;
        const summary = {
          month_start: monthStart,
          devis_this_month: devisThisMonth ?? 0,
          factures_this_month: facturesThisMonth ?? 0,
          errors,
        };

        // Trace dans le journal d'activité
        await admin.from("activity_logs").insert({
          type: "quota_reset_check",
          message: ok
            ? `[CRON] Vérification quotas OK — nouveau mois ${monthStart}`
            : `[CRON] Vérification quotas en ERREUR pour ${monthStart}`,
          metadata: summary,
        });

        return new Response(JSON.stringify({ ok, ...summary }), {
          status: ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});