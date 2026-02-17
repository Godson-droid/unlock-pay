
-- Create payout_info table for storing creator payout details
CREATE TABLE public.payout_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT,
  wallet_network TEXT,
  preferred_currency TEXT DEFAULT 'USDT',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payout_info ENABLE ROW LEVEL SECURITY;

-- Creators can view their own payout info
CREATE POLICY "Users can view own payout info"
  ON public.payout_info FOR SELECT
  USING (auth.uid() = user_id);

-- Creators can insert their own payout info
CREATE POLICY "Users can insert own payout info"
  ON public.payout_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Creators can update their own payout info
CREATE POLICY "Users can update own payout info"
  ON public.payout_info FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payout_info_updated_at
  BEFORE UPDATE ON public.payout_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
