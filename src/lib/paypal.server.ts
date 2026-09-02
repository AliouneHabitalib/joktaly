/** Client PayPal (Orders v2) — serveur uniquement. */

export interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
}

/** Taux fixe FCFA (XOF) → EUR. PayPal ne supporte pas le XOF. */
export const XOF_PER_EUR = 655.957;

export function xofToEur(amountXof: number): string {
  return (Math.round((amountXof / XOF_PER_EUR) * 100) / 100).toFixed(2);
}

export function getPaypalConfig(): PaypalConfig | null {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const clientSecret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return null;
  const mode = process.env["PAYPAL_MODE"] === "live" ? "live" : "sandbox";
  return { clientId, clientSecret, mode };
}

function baseUrl(cfg: PaypalConfig) {
  return cfg.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function accessToken(cfg: PaypalConfig): Promise<string> {
  const creds = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  const res = await fetch(`${baseUrl(cfg)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || !body.access_token) {
    throw new Error(body.error_description || `Authentification PayPal impossible (${res.status})`);
  }
  return body.access_token as string;
}

export interface CreateOrderInput {
  cfg: PaypalConfig;
  amountXof: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  referenceId: string;
}

export async function createOrder(input: CreateOrderInput): Promise<{
  id: string;
  url: string;
  raw: unknown;
}> {
  const { cfg } = input;
  const token = await accessToken(cfg);
  const res = await fetch(`${baseUrl(cfg)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.referenceId,
          description: input.description.slice(0, 127),
          amount: { currency_code: "EUR", value: xofToEur(input.amountXof) },
        },
      ],
      application_context: {
        brand_name: "TERA-DEVIS",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || !body.id) {
    throw new Error(body.message || `Erreur PayPal (${res.status})`);
  }
  const approve = (body.links as Array<{ rel: string; href: string }> | undefined)?.find(
    (l) => l.rel === "approve" || l.rel === "payer-action",
  );
  if (!approve) throw new Error("Lien de paiement PayPal introuvable.");
  return { id: body.id as string, url: approve.href, raw: body };
}

/** Capture une commande approuvée. Renvoie le statut final. */
export async function captureOrder(
  cfg: PaypalConfig,
  orderId: string,
): Promise<{ status: string; raw: Record<string, any> }> {
  const token = await accessToken(cfg);
  const res = await fetch(`${baseUrl(cfg)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (res.status === 422) {
    // déjà capturée ou non approuvée → on relit l'état réel
    return getOrder(cfg, orderId);
  }
  if (!res.ok) throw new Error(body.message || `Erreur PayPal (${res.status})`);
  return { status: String(body.status ?? "unknown"), raw: body };
}

export async function getOrder(
  cfg: PaypalConfig,
  orderId: string,
): Promise<{ status: string; raw: Record<string, any> }> {
  const token = await accessToken(cfg);
  const res = await fetch(`${baseUrl(cfg)}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) throw new Error(body.message || `Erreur PayPal (${res.status})`);
  return { status: String(body.status ?? "unknown"), raw: body };
}
