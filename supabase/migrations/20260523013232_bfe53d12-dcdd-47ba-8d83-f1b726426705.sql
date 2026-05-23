
REVOKE ALL ON FUNCTION public.log_document_creation() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_quota_refusal(uuid, uuid, text) FROM public, anon, authenticated;
