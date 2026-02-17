import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NETWORKS = ["ERC-20", "TRC-20", "BEP-20", "SOL", "TON", "MATIC", "Other"];
const CURRENCIES = ["USDT", "USDC", "BTC", "ETH", "LTC", "SOL", "BNB"];

const PayoutSettings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("USDT");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("payout_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setWalletAddress(data.wallet_address || "");
        setWalletNetwork(data.wallet_network || "");
        setPreferredCurrency(data.preferred_currency || "USDT");
        setNotes(data.notes || "");
        setExistingId(data.id);
      }
      setFetching(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!walletAddress.trim()) {
      toast({ title: "Wallet address is required", variant: "destructive" });
      return;
    }
    if (!walletNetwork) {
      toast({ title: "Please select a network", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      wallet_address: walletAddress.trim(),
      wallet_network: walletNetwork,
      preferred_currency: preferredCurrency,
      notes: notes.trim() || null,
    };

    let error;
    if (existingId) {
      ({ error } = await supabase.from("payout_info").update(payload).eq("id", existingId));
    } else {
      ({ error } = await supabase.from("payout_info").insert(payload));
    }

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout info saved!" });
      if (!existingId) {
        const { data } = await supabase.from("payout_info").select("id").eq("user_id", user.id).maybeSingle();
        if (data) setExistingId(data.id);
      }
    }
    setSaving(false);
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
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-xl font-bold">Payout Settings</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Crypto Wallet Details</CardTitle>
                <CardDescription>Enter your wallet info so we can process your payouts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address *</Label>
              <Input
                id="wallet"
                placeholder="0x... or T... or bc1..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                maxLength={128}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Network *</Label>
                <Select value={walletNetwork} onValueChange={setWalletNetwork}>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Currency</Label>
                <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional instructions for payouts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Payout Info</>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PayoutSettings;
