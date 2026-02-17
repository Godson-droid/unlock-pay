
-- Drop the overly permissive policies
DROP POLICY "Anyone can create payments" ON public.payments;
DROP POLICY "Service role can update payments" ON public.payments;

-- Recreate insert policy - restrict to only allow inserting with valid content_id
CREATE POLICY "Anyone can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    content_id IN (SELECT id FROM public.content WHERE is_active = true)
  );

-- Update policy - no direct updates from client, only via service role (edge functions)
-- RLS is bypassed by service_role key, so we can deny all client updates
CREATE POLICY "No direct client updates on payments"
  ON public.payments FOR UPDATE
  USING (false);
