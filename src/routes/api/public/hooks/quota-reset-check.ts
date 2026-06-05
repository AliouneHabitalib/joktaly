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
      POST: async ({ request }) => {
        // Auth: require the project's anon/publishable key in the `apikey`
        // header (the same key pg_cron sends). Blocks anonymous internet
        // callers from triggering service-role writes and reading platform
        // aggregates.
        const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!expectedKey || !providedKey || providedKey !== expectedKey) {
          return new Response("Unauthorized", { status: 401 });
        }

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

        // Don't leak aggregate counts / internal errors to callers; details
        // are persisted in activity_logs for admin review.
        return new Response(JSON.stringify({ ok }), {
          status: ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});