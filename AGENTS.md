# Architecture rules

- Sign-in is email/password only (Google removed); the public `/auth/callback` route stays as a safe landing that initializes the company and routes the selected plan.
- Define plan prices, quotas and entitlements in PLANS only; derive PRICING and public plan lists from it to prevent conflicting offers. The legacy essentiel key aliases Pro and is never a separate displayed offer.
- Paid plans are effective only until plan_expires_at; use public.effective_plan() in DB rules and treat expired plans as gratuit in app code (keeps quotas consistent).
