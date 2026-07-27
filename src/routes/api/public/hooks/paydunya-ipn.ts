import { createFileRoute } from "@tanstack/react-router";

/**
 * IPN PayDunya. La notification n'est pas signée : on ne fait jamais confiance
 * au payload — le token reçu est revérifié auprès de l'API PayDunya avant
 * d'activer quoi que ce soit.
 */
export const Route = createFileRoute("/api/public/hooks/paydunya-ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let token: string | undefined;
        try {
          const ct = request.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = (await request.json()) as any;
            token = body?.data?.invoice?.token ?? body?.token ?? body?.data?.token;
          } else {
            const form = await request.formData();
            token =
              (form.get("data[invoice][token]") as string | null) ??
              (form.get("token") as string | null) ??
              undefined;
          }
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        if (!token) return new Response("Missing token", { status: 400 });

        const { getPaydunyaConfig, confirmInvoice } = await import("@/lib/paydunya.server");
        const cfg = getPaydunyaConfig();
        if (!cfg) return new Response("Not configured", { status: 503 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        const { data: row } = await admin
          .from("abonnements")
          .select("id, user_id, plan, cycle, statut")
          .eq("provider_token", token)
          .maybeSingle();
        if (!row) return new Response("Unknown invoice", { status: 404 });
        if (row.statut === "paye") return new Response("ok");

        const { status, raw } = await confirmInvoice(cfg, token);
        if (status === "completed") {
          const { activateAbonnement } = await import("@/lib/abonnement.server");
          await activateAbonnement(row, raw);
          return new Response("ok");
        }
        if (status === "cancelled" || status === "failed") {
          await admin
            .from("abonnements")
            .update({ statut: "echoue", provider_response: raw })
            .eq("id", row.id);
        }
        return new Response("ok");
      },
    },
  },
});
