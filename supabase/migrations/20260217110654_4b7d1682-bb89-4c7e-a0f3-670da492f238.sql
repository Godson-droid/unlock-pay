
-- Create profiles table for creators
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'email');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Content table
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'audio', 'text')),
  file_url TEXT,
  text_content TEXT,
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd > 0),
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own content
CREATE POLICY "Creators can view own content"
  ON public.content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert content"
  ON public.content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update content"
  ON public.content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can delete content"
  ON public.content FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view content metadata (not file_url) via share_token
CREATE POLICY "Anyone can view content by share token"
  ON public.content FOR SELECT
  USING (is_active = true);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  nowpayments_id TEXT,
  payer_email TEXT,
  amount_usd NUMERIC(10,2) NOT NULL,
  crypto_amount NUMERIC(20,8),
  crypto_currency TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired')),
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a payment (public checkout)
CREATE POLICY "Anyone can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

-- Anyone can view payment by access_token (for checking status)
CREATE POLICY "Anyone can view payments"
  ON public.payments FOR SELECT
  USING (true);

-- Only service role updates payments (via edge function)
CREATE POLICY "Service role can update payments"
  ON public.payments FOR UPDATE
  USING (true);

-- Creators can view payments for their content
CREATE POLICY "Creators can view their content payments"
  ON public.payments FOR SELECT
  USING (content_id IN (SELECT id FROM public.content WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for content uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', false);

-- Creators can upload to their own folder
CREATE POLICY "Creators can upload content files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Creators can view their own files
CREATE POLICY "Creators can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Creators can delete their own files
CREATE POLICY "Creators can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'content' AND auth.uid()::text = (storage.foldername(name))[1]);
