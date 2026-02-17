import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Zap, Globe, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              LP
            </div>
            LockPay
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-5 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Monetize anything, anywhere
              </p>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Sell digital content
                <br />
                with <span className="text-primary">crypto payments</span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Upload files, set a price, share a link. Buyers pay in crypto to unlock — 
                no bank accounts, no borders, no friction.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="gap-2 px-6" asChild>
                  <Link to="/auth">
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 px-6" asChild>
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm text-muted-foreground">
            {["150+ cryptocurrencies", "Instant payouts", "No KYC for buyers", "Global access"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Three steps to get paid</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload content",
                  desc: "Images, videos, audio, text files — anything digital you want to sell.",
                },
                {
                  step: "02",
                  title: "Set your price",
                  desc: "Choose the amount in USD. Buyers pay the equivalent in their preferred crypto.",
                },
                {
                  step: "03",
                  title: "Share & earn",
                  desc: "Send the link. Payment confirms instantly and buyers get immediate access.",
                },
              ].map((item) => (
                <div key={item.step} className="bg-card p-8 sm:p-10">
                  <span className="mb-4 inline-block font-mono text-xs font-semibold text-primary">{item.step}</span>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/40 bg-muted/20 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Features</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Built for creators</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "Pay-to-unlock",
                  desc: "Content remains encrypted until payment is confirmed on-chain.",
                },
                {
                  icon: Globe,
                  title: "No borders",
                  desc: "Accept payments from anyone, anywhere — no bank account required.",
                },
                {
                  icon: Shield,
                  title: "Secure by default",
                  desc: "Private storage, signed URLs, and access tokens protect your files.",
                },
                {
                  icon: Zap,
                  title: "Instant setup",
                  desc: "Create an account, upload a file, and start earning in under a minute.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-2xl border border-border bg-card p-10 text-center sm:p-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to monetize your content?</h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Join creators who use LockPay to sell digital content globally with crypto payments.
              </p>
              <Button size="lg" className="mt-8 gap-2 px-8" asChild>
                <Link to="/auth">
                  Create your first lock
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LockPay. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
