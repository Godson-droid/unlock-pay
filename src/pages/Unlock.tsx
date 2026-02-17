import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Image, Video, FileText, Music, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const iconMap: Record<string, any> = {
  image: Image,
  video: Video,
  text: FileText,
  audio: Music,
};

const Unlock = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access");

  const [content, setContent] = useState<Tables<"content"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);
  const [unlockedText, setUnlockedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch content metadata
  useEffect(() => {
    if (!token) return;
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("share_token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setError("Content not found or has been removed.");
      } else {
        setContent(data);
      }
      setLoading(false);
    };
    fetchContent();
  }, [token]);

  // Check access token if present
  useEffect(() => {
    if (!accessToken || !content) return;
    const checkAccess = async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("access_token", accessToken)
        .eq("content_id", content.id)
        .eq("status", "finished")
        .maybeSingle();

      if (data) {
        setPaymentStatus("finished");
        await loadUnlockedContent();
      }
    };
    checkAccess();
  }, [accessToken, content]);

  const loadUnlockedContent = async () => {
    if (!content) return;
    if (content.content_type === "text") {
      setUnlockedText(content.text_content);
    } else if (content.file_url) {
      const { data } = await supabase.storage
        .from("content")
        .createSignedUrl(content.file_url, 3600);
      if (data) setUnlockedUrl(data.signedUrl);
    }
  };

  const handlePay = async () => {
    if (!content) return;
    setPaying(true);
    setError(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: content.id,
            price_usd: content.price_usd,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment creation failed");

      // Redirect to NOWPayments invoice
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Content Not Found</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) return null;

  const Icon = iconMap[content.content_type] || FileText;

  // Content is unlocked
  if (paymentStatus === "finished") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>{content.title}</CardTitle>
            <CardDescription>Content unlocked — enjoy!</CardDescription>
          </CardHeader>
          <CardContent>
            {content.content_type === "text" && unlockedText && (
              <div className="rounded-lg bg-muted p-6 whitespace-pre-wrap">
                {unlockedText}
              </div>
            )}
            {content.content_type === "image" && unlockedUrl && (
              <img src={unlockedUrl} alt={content.title} className="w-full rounded-lg" />
            )}
            {content.content_type === "video" && unlockedUrl && (
              <video src={unlockedUrl} controls className="w-full rounded-lg" />
            )}
            {content.content_type === "audio" && unlockedUrl && (
              <audio src={unlockedUrl} controls className="w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Locked state — show payment prompt
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">{content.title}</CardTitle>
          {content.description && (
            <CardDescription className="mt-2">{content.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Icon className="h-3 w-3" /> {content.content_type}
            </Badge>
          </div>

          <div className="rounded-xl bg-muted p-6">
            <p className="text-sm text-muted-foreground">Unlock price</p>
            <p className="text-3xl font-bold text-foreground">
              ${Number(content.price_usd).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Paid in cryptocurrency</p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handlePay}
            disabled={paying}
            className="w-full"
            size="lg"
          >
            {paying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating payment...</>
            ) : (
              <><ExternalLink className="mr-2 h-4 w-4" /> Pay with Crypto</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Powered by NOWPayments · 150+ cryptocurrencies supported
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unlock;
