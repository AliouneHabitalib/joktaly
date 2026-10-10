import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), navigate: vi.fn(), saveIntent: vi.fn(), error: vi.fn(),
  click: undefined as undefined | (() => Promise<void>),
}));
vi.mock("@/integrations/lovable", () => ({ lovable: { auth: { signInWithOAuth: mocks.signIn } } }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/lib/plan-intent", () => ({ savePlanIntent: mocks.saveIntent }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
vi.mock("@/components/ui/button", () => ({ Button: (props: { onClick: () => Promise<void> }) => {
  mocks.click = props.onClick;
  return null;
} }));
import { GoogleAuthButton } from "./google-auth-button";

describe("Google authentication completion", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.click = undefined; });

  async function clickGoogle(pending = vi.fn()) {
    renderToStaticMarkup(<GoogleAuthButton plan="starter" cycle="monthly" onPendingChange={pending} />);
    if (!mocks.click) throw new Error("Missing Google action");
    await mocks.click();
    return pending;
  }

  it("finishes popup sign-in through the public callback while preserving the plan", async () => {
    vi.stubGlobal("window", { location: { origin: "https://africa-devis.lovable.app" } });
    mocks.signIn.mockResolvedValue({ redirected: false, tokens: {} });
    await clickGoogle();
    expect(mocks.saveIntent).toHaveBeenCalledWith({ plan: "starter", cycle: "monthly" });
    expect(mocks.signIn).toHaveBeenCalledWith("google", {
      redirect_uri: "https://africa-devis.lovable.app/auth/callback",
      extraParams: { prompt: "select_account" },
    });
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/auth/callback" });
  });

  it("does not navigate prematurely during a full-page OAuth redirect", async () => {
    mocks.signIn.mockResolvedValue({ redirected: true });
    await clickGoogle();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("allows retry after Google returns an error", async () => {
    mocks.signIn.mockResolvedValue({ error: new Error("Cancelled") });
    const pending = await clickGoogle();
    expect(pending).toHaveBeenLastCalledWith(false);
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});