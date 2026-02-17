import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, LogOut, Image, Video, FileText, Music, ExternalLink, DollarSign, TrendingUp, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const iconMap: Record<string, any> = {
  image: Image,
  video: Video,
  text: FileText,
  audio: Music,
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<Tables<"content">[]>([]);
  const [payments, setPayments] = useState<Tables<"payments">[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [contentRes, paymentsRes] = await Promise.all([
        supabase
          .from("content")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*, content!inner(user_id)")
          .eq("content.user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setContent(contentRes.data || []);
      setPayments(paymentsRes.data || []);
      setFetching(false);
    };
    fetchData();
  }, [user]);

  const copyLink = (shareToken: string) => {
    const url = `${window.location.origin}/unlock/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share it with anyone to get paid." });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">🔐 LockPay</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/payout-settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to="/create">
                <Plus className="mr-2 h-4 w-4" /> New Content
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Earnings Stats */}
        {(() => {
          const finishedPayments = payments.filter((p: any) => p.status === "finished");
          const totalEarnings = finishedPayments.reduce((sum: number, p: any) => sum + Number(p.amount_usd), 0);
          const pendingPayments = payments.filter((p: any) => p.status === "pending" || p.status === "waiting");
          const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount_usd), 0);
          return (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-lg bg-accent/10 p-3">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-lg bg-secondary/80 p-3">
                    <Eye className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="text-2xl font-bold">{finishedPayments.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Content Section */}
        {content.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">No content yet</h2>
              <p className="mb-6 text-muted-foreground">
                Upload your first locked content and start earning with crypto payments.
              </p>
              <Button asChild>
                <Link to="/create">Create Your First Lock</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => {
              const Icon = iconMap[item.content_type] || FileText;
              return (
                <Card key={item.id} className="group transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {item.content_type}
                        </Badge>
                      </div>
                      <span className="font-mono text-sm font-semibold text-accent">
                        ${Number(item.price_usd).toFixed(2)}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {item.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyLink(item.share_token)}
                      >
                        <Copy className="mr-1 h-3 w-3" /> Copy Link
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/unlock/${item.share_token}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
