
CREATE POLICY "Deny writes to activity_logs from clients"
ON public.activity_logs
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

REVOKE UPDATE (plan, plan_expires_at) ON public.profiles FROM authenticated;
REVOKE UPDATE (plan, plan_expires_at) ON public.profiles FROM anon;
