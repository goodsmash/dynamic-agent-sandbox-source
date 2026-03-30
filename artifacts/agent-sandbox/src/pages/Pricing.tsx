import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Check, Zap, Shield, Cloud, Server, Cpu, HardDrive, Database,
  Globe, Rocket, Crown, Star, ArrowRight, ChevronRight, Users,
  Activity, Lock, RefreshCw, Headphones, Gauge, Box,
} from "lucide-react";

const PLANS = [
  {
    id: "lite",
    name: "LITE",
    subtitle: "For personal projects and getting started",
    monthlyPrice: 16,
    yearlyPrice: 199,
    yearlySavings: 29,
    color: "border-green-500/30 bg-green-500/5",
    accent: "text-green-400",
    badge: null,
    features: [
      { text: "Zero setup, instant access", icon: Zap },
      { text: "Personal AI assistant, 24/7", icon: Users },
      { text: "Auto-updates, zero maintenance", icon: RefreshCw },
      { text: "2 vCPU cores", icon: Cpu },
      { text: "4 GB RAM", icon: Gauge },
      { text: "40 GB SSD storage", icon: HardDrive },
      { text: "Fully private & encrypted", icon: Lock },
      { text: "Daily backups", icon: Database },
    ],
    cta: "Subscribe to Lite",
  },
  {
    id: "pro",
    name: "PRO",
    subtitle: "For power users who rely on AI daily",
    monthlyPrice: 33,
    yearlyPrice: 399,
    yearlySavings: 69,
    color: "border-primary/40 bg-primary/5",
    accent: "text-primary",
    badge: "MOST POPULAR",
    features: [
      { text: "Zero setup, instant access", icon: Zap },
      { text: "Personal AI assistant, 24/7", icon: Users },
      { text: "Auto-updates, zero maintenance", icon: RefreshCw },
      { text: "4 vCPU cores", icon: Cpu },
      { text: "8 GB RAM", icon: Gauge },
      { text: "80 GB SSD storage", icon: HardDrive },
      { text: "Fully private & encrypted", icon: Lock },
      { text: "Daily backups", icon: Database },
      { text: "Priority support", icon: Headphones },
    ],
    cta: "Subscribe to Pro",
  },
  {
    id: "max",
    name: "MAX",
    subtitle: "For heavy workloads and maximum performance",
    monthlyPrice: 66,
    yearlyPrice: 799,
    yearlySavings: 149,
    color: "border-purple-500/30 bg-purple-500/5",
    accent: "text-purple-400",
    badge: null,
    features: [
      { text: "Zero setup, instant access", icon: Zap },
      { text: "Personal AI assistant, 24/7", icon: Users },
      { text: "Auto-updates, zero maintenance", icon: RefreshCw },
      { text: "8 vCPU cores", icon: Cpu },
      { text: "16 GB RAM", icon: Gauge },
      { text: "160 GB SSD storage", icon: HardDrive },
      { text: "Fully private & encrypted", icon: Lock },
      { text: "Daily backups", icon: Database },
      { text: "Priority support", icon: Headphones },
      { text: "Dedicated instance", icon: Server },
    ],
    cta: "Subscribe to Max",
  },
];

const ENVIRONMENTS = [
  {
    name: "Cloudflare Workers",
    desc: "Edge-first. Deploy agents to 300+ cities worldwide with sub-50ms latency. Free tier available.",
    icon: Globe,
    color: "text-orange-400",
    pricing: "From $5/mo (Workers Paid)",
    features: ["Durable Objects for state", "Workers AI (100+ models free)", "KV + R2 storage", "Global edge network"],
  },
  {
    name: "Dedicated Cloud VPS",
    desc: "Full control. Rent a dedicated VPS with your OpenClaw instance pre-configured and optimized.",
    icon: Server,
    color: "text-blue-400",
    pricing: "From $16/mo (Lite plan)",
    features: ["Root SSH access", "Custom domains", "Docker support", "Private networking"],
  },
  {
    name: "Self-Hosted",
    desc: "Run OpenClaw on your own hardware. Full source code, your infrastructure, your rules.",
    icon: Box,
    color: "text-green-400",
    pricing: "Free (open source)",
    features: ["Docker Compose", "Kubernetes helm chart", "Air-gapped deployments", "Custom LLM endpoints"],
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Choose a plan", desc: "Pick the plan that fits your needs. All plans include a dedicated OpenClaw instance.", icon: Star },
  { step: "2", title: "We set up your OpenClaw", desc: "We spin up a dedicated instance configured and optimized just for you.", icon: Rocket },
  { step: "3", title: "Start using it", desc: "No setup steps. No configuration checklist. Just log in and go.", icon: Zap },
];

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary">OPENCLAW PLANS</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get your own dedicated OpenClaw instance. No shared resources, no noisy neighbors.
              Your agents, your data, your infrastructure.
            </p>
          </motion.div>

          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setBilling("monthly")}
              className={cn("px-4 py-2 rounded-lg text-sm font-mono transition-all", billing === "monthly" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn("px-4 py-2 rounded-lg text-sm font-mono transition-all flex items-center gap-2", billing === "yearly" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground")}
            >
              Yearly
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">SAVE</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col",
                  plan.color,
                  plan.badge && "ring-1 ring-primary/30"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-background text-[10px] font-mono font-bold rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={cn("text-lg font-bold font-mono", plan.accent)}>{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${billing === "yearly" ? plan.monthlyPrice : plan.monthlyPrice + Math.ceil(plan.yearlySavings / 12)}
                    </span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                  {billing === "yearly" && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Billed ${plan.yearlyPrice}/year
                      <span className={cn("ml-2", plan.accent)}>Save ${plan.yearlySavings}/year vs monthly</span>
                    </div>
                  )}
                </div>

                <button className={cn(
                  "w-full py-2.5 rounded-lg font-mono text-sm font-semibold transition-all mb-6",
                  plan.badge
                    ? "bg-primary text-background hover:bg-primary/90"
                    : "border border-border/50 hover:border-border hover:bg-white/5"
                )}>
                  {plan.cta}
                </button>

                <div className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f.text} className="flex items-center gap-2.5">
                      <f.icon className={cn("w-3.5 h-3.5 shrink-0", plan.accent)} />
                      <span className="text-xs text-muted-foreground">{f.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">How it works</h2>
              <p className="text-sm text-muted-foreground">Three steps. That's it.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="flex items-start gap-4 p-5 rounded-xl border border-border/30 bg-card/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">STEP {step.step}</span>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3 hidden md:block" />}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Environment</h2>
              <p className="text-sm text-muted-foreground">Run OpenClaw agents where it makes sense for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ENVIRONMENTS.map((env, i) => (
                <motion.div
                  key={env.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-5 rounded-xl border border-border/30 bg-card/30 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center")}>
                      <env.icon className={cn("w-5 h-5", env.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{env.name}</h3>
                      <p className={cn("text-[10px] font-mono", env.color)}>{env.pricing}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{env.desc}</p>
                  <div className="space-y-1.5 mt-auto">
                    {env.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center mb-10">
            <h2 className="text-xl font-bold mb-2">Need a custom setup?</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
              Enterprise deployments, custom AI model hosting, dedicated GPU clusters, or on-premise installations.
              We'll build exactly what you need.
            </p>
            <button className="px-6 py-2.5 bg-primary text-background rounded-lg font-mono text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "AI Providers", value: "24+", icon: Cloud },
              { label: "Models Available", value: "300+", icon: Activity },
              { label: "Agent Types", value: "4", icon: Users },
              { label: "Uptime SLA", value: "99.9%", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl border border-border/30 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold font-mono">{stat.value}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
