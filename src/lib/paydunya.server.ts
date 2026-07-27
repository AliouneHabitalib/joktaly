/** Client PayDunya (Checkout Invoice API) — serveur uniquement. */

export interface PaydunyaConfig {
  masterKey: string;
  privateKey: string;
  token: string;
  mode: "test" | "live";
}

export function getPaydunyaConfig(): PaydunyaConfig | null {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) return null;
  const mode = process.env.PAYDUNYA_MODE === "live" ? "live" : "test";
  return { masterKey, privateKey, token, mode };
}

function baseUrl(cfg: PaydunyaConfig) {
  return cfg.mode === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";
}

function headers(cfg: PaydunyaConfig) {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": cfg.masterKey,
    "PAYDUNYA-PRIVATE-KEY": cfg.privateKey,
    "PAYDUNYA-TOKEN": cfg.token,
  };
}

export interface CreateInvoiceInput {
  cfg: PaydunyaConfig;
  amount: number;
  description: string;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  customData: Record<string, string>;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{
  token: string;
  url: string;
  raw: unknown;
}> {
  const { cfg } = input;
  const res = await fetch(`${baseUrl(cfg)}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(cfg),
    body: JSON.stringify({
      invoice: {
        total_amount: input.amount,
        description: input.description,
        items: {
          item_0: {
            name: input.itemName,
            quantity: 1,
            unit_price: String(input.amount),
            total_price: String(input.amount),
            description: input.description,
          },
        },
      },
      store: { name: "TERA-DEVIS", website_url: "https://tera-devis.lovable.app" },
      actions: {
        cancel_url: input.cancelUrl,
        return_url: input.returnUrl,
        callback_url: input.callbackUrl,
      },
      custom_data: input.customData,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || body.response_code !== "00") {
    const msg = Array.isArray(body.response_text)
      ? body.response_text.join(", ")
      : body.response_text || `Erreur PayDunya (${res.status})`;
    throw new Error(String(msg));
  }
  return { token: body.token as string, url: body.response_text as string, raw: body };
}

export async function confirmInvoice(cfg: PaydunyaConfig, token: string): Promise<{
  status: string;
  raw: Record<string, any>;
}> {
  const res = await fetch(`${baseUrl(cfg)}/checkout-invoice/confirm/${token}`, {
    method: "GET",
    headers: headers(cfg),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) throw new Error(`Erreur PayDunya (${res.status})`);
  return { status: String(body.status ?? "unknown"), raw: body };
}
