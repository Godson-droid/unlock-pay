import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Zap, Globe, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">🔐 LockPay</h1>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Crypto-powered content monetization
          </div>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Lock content.
            <br />
            <span className="text-primary">Get paid in crypto.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Upload images, videos, text, or audio. Set your price. Share the link.
            Recipients pay in crypto to unlock — works anywhere in the world.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">Start Locking Content</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Lock Anything",
                desc: "Images, videos, audio, or text — upload and set your unlock price.",
              },
              {
                icon: Globe,
                title: "Global Payments",
                desc: "150+ cryptocurrencies accepted. No bank account or card needed.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Content stays locked until payment confirms. Only payers get access.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
