import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Link } from "wouter"
import {
  Cloud, Key, CheckCircle2, XCircle, Loader2, ChevronRight,
  Zap, Globe, Cpu, AlertTriangle, ExternalLink, Eye, EyeOff,
  Settings, TestTube, ChevronDown, ChevronUp, Info, Copy, Check
} from "lucide-react"

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "")

interface ProviderSetupState {
  apiKey: string
  accountId: string
  baseUrl: string
  status: "idle" | "saving" | "testing" | "ok" | "error"
  error?: string
  configured: boolean
  maskedKey?: string
}

function RevealInput({
  value, onChange, placeholder, disabled
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all disabled:opacity-50"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function StatusBadge({ status, error }: { status: ProviderSetupState["status"]; error?: string }) {
  if (status === "ok") return (
    <span className="flex items-center gap-1.5 text-xs font-mono text-green-400">
      <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED
    </span>
  )
  if (status === "error") return (
    <span className="flex items-center gap-1.5 text-xs font-mono text-red-400" title={error}>
      <XCircle className="w-3.5 h-3.5" /> FAILED — {error?.slice(0, 50)}
    </span>
  )
  if (status === "saving" || status === "testing") return (
    <span className="flex items-center gap-1.5 text-xs font-mono text-yellow-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {status === "saving" ? "SAVING..." : "TESTING..."}
    </span>
  )
  return null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-muted-foreground hover:text-primary transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function StepGuide({ steps }: { steps: { step: number; text: string; url?: string; code?: string }[] }) {
  return (
    <div className="space-y-2 mt-3">
      {steps.map(s => (
        <div key={s.step} className="flex gap-2.5 text-xs">
          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary font-mono font-bold flex items-center justify-center text-[10px]">
            {s.step}
          </span>
          <div className="pt-0.5 text-muted-foreground leading-relaxed">
            {s.text}
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className="ml-1.5 text-primary/80 hover:text-primary underline underline-offset-2 inline-flex items-center gap-0.5">
                Open <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {s.code && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-green-300 inline-flex items-center gap-1">
                {s.code}
                <CopyButton text={s.code} />
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const QWEN_MODEL_CATEGORIES = [
  {
    label: "Chat & General", icon: "💬", tag: "general",
    models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-flash", "qwen3-235b-a22b", "qwen3-32b", "qwen3-14b", "qwen3-8b", "qwen3.5-plus", "qwen3.5-flash"],
    note: "Best for general tasks. Auto-selected by default."
  },
  {
    label: "Coding Agents", icon: "💻", tag: "code",
    models: ["qwen3-coder-480b-a35b-instruct", "qwen3-coder-next", "qwen3-coder-plus", "qwen3-coder-flash", "qwen3-coder-30b-a3b-instruct"],
    note: "Auto-selected when agents detect code/dev tasks."
  },
  {
    label: "Reasoning & Math", icon: "🧠", tag: "reason",
    models: ["qwq-plus", "qvq-max", "qvq-max-latest", "qwen3-235b-a22b-thinking-2507", "qwen3-30b-a3b-thinking-2507"],
    note: "Chain-of-thought reasoning. Auto-selected for math/logic."
  },
  {
    label: "Vision & Multimodal", icon: "👁", tag: "vision",
    models: ["qwen-vl-max", "qwen-vl-plus", "qwen-vl-ocr", "qwen2.5-vl-72b-instruct", "qwen3-vl-plus", "qwen3-vl-flash"],
    note: "Understands images. Auto-selected for vision tasks."
  },
  {
    label: "Translation", icon: "🌐", tag: "translate",
    models: ["qwen-mt-plus", "qwen-mt-turbo", "qwen-mt-flash", "qwen-mt-lite"],
    note: "Dedicated translation. 100+ languages."
  },
  {
    label: "Long Context (1M tokens)", icon: "📄", tag: "long",
    models: ["qwen2.5-7b-instruct-1m", "qwen2.5-14b-instruct-1m"],
    note: "1 million token context window — entire codebases."
  },
]

const OTHER_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "◆", desc: "GPT-4o, o3, o4-mini" },
  { id: "anthropic", name: "Anthropic", icon: "✺", desc: "Claude 3.7 Sonnet, Opus" },
  { id: "google", name: "Google Gemini", icon: "◈", desc: "Gemini 2.5 Pro, Flash" },
  { id: "xai", name: "xAI Grok", icon: "𝕏", desc: "Grok 3, Grok 3 Mini" },
  { id: "deepseek", name: "DeepSeek", icon: "◉", desc: "DeepSeek R2, V3" },
  { id: "groq", name: "Groq", icon: "⚡", desc: "Llama 3.3 70B — fastest" },
  { id: "openrouter", name: "OpenRouter", icon: "◎", desc: "200+ models via one key" },
  { id: "mistral", name: "Mistral", icon: "🌊", desc: "Mistral Large, Codestral" },
]

export default function Setup() {
  const { toast } = useToast()
  const [showCFGuide, setShowCFGuide] = useState(false)
  const [showQwenModels, setShowQwenModels] = useState(false)

  const [cf, setCf] = useState<ProviderSetupState>({
    apiKey: "", accountId: "", baseUrl: "", status: "idle", configured: false
  })
  const [qwen, setQwen] = useState<ProviderSetupState>({
    apiKey: "", accountId: "", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    status: "idle", configured: false
  })
  const [otherStatus, setOtherStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`${API_BASE}/api/providers`)
      .then(r => r.ok ? r.json() : [])
      .then((providers: any[]) => {
        const cfProv = providers.find(p => p.id === "cloudflare")
        const qwenProv = providers.find(p => p.id === "qwen")
        if (cfProv) {
          setCf(prev => ({
            ...prev,
            configured: cfProv.configured,
            maskedKey: cfProv.apiKey,
            baseUrl: cfProv.baseUrl || prev.baseUrl,
            status: cfProv.configured ? "ok" : "idle"
          }))
        }
        if (qwenProv) {
          setQwen(prev => ({
            ...prev,
            configured: qwenProv.configured,
            maskedKey: qwenProv.apiKey,
            status: qwenProv.configured ? "ok" : "idle"
          }))
        }
        const otherMap: Record<string, boolean> = {}
        providers.forEach(p => { otherMap[p.id] = p.configured })
        setOtherStatus(otherMap)
      })
      .catch(() => {})
  }, [])

  const saveCF = async () => {
    if (!cf.apiKey && !cf.accountId) {
      toast({ title: "Enter credentials", description: "Provide your CF API Token and Account ID.", variant: "destructive" })
      return
    }
    setCf(prev => ({ ...prev, status: "saving" }))
    const accountId = cf.accountId.trim()
    const baseUrl = accountId
      ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`
      : cf.baseUrl
    try {
      const r = await fetch(`${API_BASE}/api/providers/cloudflare`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cf.apiKey.trim(), baseUrl }),
      })
      if (!r.ok) throw new Error(await r.text())
      setCf(prev => ({ ...prev, status: "ok", configured: true, baseUrl }))
      toast({ title: "Cloudflare Workers AI saved!", description: "100+ edge models are now live." })
    } catch (err: any) {
      setCf(prev => ({ ...prev, status: "error", error: err.message }))
      toast({ title: "Save failed", description: err.message, variant: "destructive" })
    }
  }

  const testCF = async () => {
    setCf(prev => ({ ...prev, status: "testing" }))
    try {
      const r = await fetch(`${API_BASE}/api/providers/cloudflare/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "@cf/meta/llama-3.1-8b-instruct" }),
      })
      const data = await r.json()
      if (data.ok) {
        setCf(prev => ({ ...prev, status: "ok" }))
        toast({ title: "Cloudflare Works!", description: `Llama 3.1 8B responded in ${data.latencyMs}ms` })
      } else {
        setCf(prev => ({ ...prev, status: "error", error: data.error }))
        toast({ title: "Test failed", description: data.error, variant: "destructive" })
      }
    } catch (err: any) {
      setCf(prev => ({ ...prev, status: "error", error: err.message }))
    }
  }

  const saveQwen = async () => {
    if (!qwen.apiKey) {
      toast({ title: "Enter API key", description: "Provide your Alibaba Cloud Model Studio API key.", variant: "destructive" })
      return
    }
    setQwen(prev => ({ ...prev, status: "saving" }))
    try {
      const r = await fetch(`${API_BASE}/api/providers/qwen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: qwen.apiKey.trim(),
          baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        }),
      })
      if (!r.ok) throw new Error(await r.text())
      setQwen(prev => ({ ...prev, status: "ok", configured: true }))
      toast({ title: "Alibaba Cloud saved!", description: "90+ free-quota Qwen models are now live." })
    } catch (err: any) {
      setQwen(prev => ({ ...prev, status: "error", error: err.message }))
      toast({ title: "Save failed", description: err.message, variant: "destructive" })
    }
  }

  const testQwen = async () => {
    setQwen(prev => ({ ...prev, status: "testing" }))
    try {
      const r = await fetch(`${API_BASE}/api/providers/qwen/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-max" }),
      })
      const data = await r.json()
      if (data.ok) {
        setQwen(prev => ({ ...prev, status: "ok" }))
        toast({ title: "Qwen Works!", description: `qwen-max responded in ${data.latencyMs}ms` })
      } else {
        setQwen(prev => ({ ...prev, status: "error", error: data.error }))
        toast({ title: "Test failed", description: data.error, variant: "destructive" })
      }
    } catch (err: any) {
      setQwen(prev => ({ ...prev, status: "error", error: err.message }))
    }
  }

  const configuredCount = [cf.configured, qwen.configured, ...Object.values(otherStatus)].filter(Boolean).length

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20">
          <div className="max-w-4xl mx-auto px-8 py-10">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
                <Key className="w-3 h-3" />
                {configuredCount} PROVIDERS ACTIVE
              </div>
              <h1 className="text-4xl font-bold mb-3">Quick Setup</h1>
              <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
                Connect your AI providers. Keys stored securely in the database. Agents auto-select the best free model per task type — coding, reasoning, vision, translation.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">

          {/* ── Cloudflare Workers AI ───────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Cloud className="w-3 h-3" /> FREE TIER PROVIDERS
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-white/5 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">☁️</span>
                  <div>
                    <h3 className="font-bold text-base">Cloudflare Workers AI</h3>
                    <p className="text-xs text-muted-foreground">100+ models on Cloudflare's global edge. Llama 4, DeepSeek R1, Qwen 2.5, Gemma 3. <span className="text-green-400">10K neurons/day FREE.</span></p>
                  </div>
                </div>
                <a href="https://developers.cloudflare.com/workers-ai/" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  DOCS <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Step-by-step guide toggle */}
              <button
                onClick={() => setShowCFGuide(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono mb-4 hover:bg-blue-500/15 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  HOW TO CREATE YOUR CLOUDFLARE API TOKEN (step by step)
                </span>
                {showCFGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCFGuide && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 space-y-4">

                  {/* PART A: Account ID */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                    <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">PART A</span>
                      Get your Account ID
                    </p>
                    <StepGuide steps={[
                      { step: 1, text: "Log in to Cloudflare dashboard", url: "https://dash.cloudflare.com" },
                      { step: 2, text: "On the home page, look at the RIGHT SIDEBAR — you'll see 'Account ID' with a 32-character hex string" },
                      { step: 3, text: "Copy that hex string and paste it in the ACCOUNT ID field below" },
                    ]} />
                  </div>

                  {/* PART B: Token creation */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                    <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px]">PART B</span>
                      Create your API Token
                    </p>
                    <StepGuide steps={[
                      { step: 1, text: "Go to Profile → API Tokens", url: "https://dash.cloudflare.com/profile/api-tokens" },
                      { step: 2, text: "Click the blue 'Create Token' button at the top" },
                      { step: 3, text: "Scroll down and click 'Create Custom Token' (the 'Get started' link at the bottom)" },
                    ]} />

                    <div className="mt-4 mb-3 h-px bg-white/5" />
                    <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px]">IMPORTANT</span>
                      Fill in the form EXACTLY like this:
                    </p>

                    {/* Visual dropdown diagram */}
                    <div className="space-y-3 text-xs">

                      {/* Token name */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="font-semibold text-white mb-1">Token name</p>
                        <p className="text-muted-foreground">Type anything, for example:</p>
                        <div className="mt-1.5 px-3 py-1.5 rounded bg-black/50 border border-white/15 font-mono text-green-300 inline-block">
                          openclaw-workers
                        </div>
                      </div>

                      {/* Permissions — the critical part */}
                      <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <p className="font-semibold text-white mb-2">Permissions (3 dropdowns — fill ALL three)</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase">Dropdown 1</span>
                            <div className="px-3 py-2 rounded bg-black/50 border-2 border-green-500/40 font-mono text-green-300 text-center min-w-[100px]">
                              Account
                            </div>
                          </div>
                          <span className="text-muted-foreground mt-3">→</span>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase">Dropdown 2</span>
                            <div className="px-3 py-2 rounded bg-black/50 border-2 border-green-500/40 font-mono text-green-300 text-center min-w-[140px]">
                              Workers AI
                            </div>
                            <span className="text-[9px] text-yellow-300">scroll to find it</span>
                          </div>
                          <span className="text-muted-foreground mt-3">→</span>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase">Dropdown 3</span>
                            <div className="px-3 py-2 rounded bg-black/50 border-2 border-green-500/40 font-mono text-green-300 text-center min-w-[80px]">
                              Read
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-yellow-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>The middle dropdown has many options — scroll down or type "Workers" to search. Select <strong>"Workers AI"</strong> (not "Workers Scripts" or "Workers Routes").</span>
                        </div>
                      </div>

                      {/* Account Resources */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="font-semibold text-white mb-1">Account Resources</p>
                        <p className="text-muted-foreground">Leave as default:</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="px-3 py-1.5 rounded bg-black/50 border border-white/15 font-mono text-green-300">Include</div>
                          <span className="text-muted-foreground">→</span>
                          <div className="px-3 py-1.5 rounded bg-black/50 border border-white/15 font-mono text-green-300">All accounts</div>
                        </div>
                      </div>

                      {/* IP Filter */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="font-semibold text-white mb-1">Client IP Address Filtering</p>
                        <p className="text-muted-foreground">Leave empty — skip this section entirely.</p>
                      </div>

                      {/* TTL */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="font-semibold text-white mb-1">TTL</p>
                        <p className="text-muted-foreground">Leave as default — no expiration needed.</p>
                      </div>

                      {/* Final step */}
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="font-semibold text-green-300 mb-1">Last step</p>
                        <StepGuide steps={[
                          { step: 1, text: "Scroll down and click 'Continue to summary'" },
                          { step: 2, text: "Click 'Create Token'" },
                          { step: 3, text: "You'll see your token ONCE — copy it immediately and paste it below" },
                        ]} />
                        <p className="mt-2 text-[10px] text-muted-foreground">The token will look like: <span className="font-mono text-green-300">abc123...xyz</span> (about 40 characters, no cfk_ prefix)</p>
                      </div>
                    </div>
                  </div>

                  {/* Alternative: template method */}
                  <div className="p-3 rounded-lg bg-white/3 border border-white/5 text-[10px] text-muted-foreground">
                    <strong className="text-white">Alternative (easier):</strong> Instead of Custom Token, some accounts show a <strong>"Workers AI"</strong> template on the Create Token page. If you see it, just click "Use template" → "Continue to summary" → "Create Token". Same result, fewer steps.
                  </div>
                </motion.div>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block">
                    ACCOUNT ID
                    <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-primary/70 hover:text-primary">(dash.cloudflare.com → right sidebar)</a>
                  </label>
                  <input
                    type="text"
                    value={cf.accountId}
                    onChange={e => setCf(prev => ({ ...prev, accountId: e.target.value }))}
                    placeholder="85c2f8db5bf4ee74ce27103f4081d812  (32-char hex)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block">
                    API TOKEN
                    <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-primary/70 hover:text-primary">(Create → Workers AI:Read template)</a>
                  </label>
                  <RevealInput
                    value={cf.apiKey}
                    onChange={v => setCf(prev => ({ ...prev, apiKey: v }))}
                    placeholder={cf.maskedKey || "Paste your CF API Token here..."}
                  />
                </div>
                {cf.accountId && (
                  <div className="text-[10px] font-mono text-muted-foreground bg-white/5 rounded p-2 break-all flex items-center gap-2">
                    <span className="text-green-400/60">Endpoint:</span>
                    https://api.cloudflare.com/client/v4/accounts/{cf.accountId}/ai/v1
                    <CopyButton text={`https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/ai/v1`} />
                  </div>
                )}
                <StatusBadge status={cf.status} error={cf.error} />
                {cf.configured && cf.status === "ok" && (
                  <div>
                    <p className="text-xs font-mono text-green-400/80 mb-1">Available models (sample):</p>
                    <div className="flex flex-wrap gap-1">
                      {["@cf/meta/llama-4-scout-17b", "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", "@cf/qwen/qwen2.5-72b-instruct", "@cf/google/gemma-3-27b-it"].map(m => (
                        <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">{m}</span>
                      ))}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">+100 more</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={saveCF} size="sm" className="font-mono text-xs gap-1.5 flex-1">
                  <Key className="w-3 h-3" /> SAVE KEY
                </Button>
                <Button onClick={testCF} size="sm" variant="outline" className="font-mono text-xs gap-1.5">
                  <TestTube className="w-3 h-3" /> TEST
                </Button>
                <Link href="/settings">
                  <Button size="sm" variant="ghost" className="font-mono text-xs gap-1.5 px-3">
                    <Settings className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── Alibaba Cloud / Qwen ────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> ALIBABA CLOUD — 90+ FREE MODELS
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-white/5 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">千</span>
                  <div>
                    <h3 className="font-bold text-base">Alibaba Cloud Model Studio</h3>
                    <p className="text-xs text-muted-foreground">
                      Qwen3, Qwen3-Coder, QwQ reasoning, QvQ vision, Qwen-VL, translation, long-context.
                      <span className="text-green-400 ml-1">1M tokens free per model.</span>
                    </p>
                  </div>
                </div>
                <a href="https://modelstudio.console.alibabacloud.com" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  CONSOLE <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Get key steps */}
              <div className="mb-4 p-3.5 rounded-xl bg-black/30 border border-white/5">
                <p className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">How to get your API key:</p>
                <StepGuide steps={[
                  { step: 1, text: "Log in to Alibaba Cloud Model Studio (international)", url: "https://modelstudio.console.alibabacloud.com" },
                  { step: 2, text: "Click your profile icon (top-right) → 'API Keys'" },
                  { step: 3, text: "Click 'Create API Key', name it anything, then copy the key" },
                  { step: 4, text: "Paste it below — your 90+ free-quota models activate immediately" },
                ]} />
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block">
                    API KEY
                    <a href="https://modelstudio.console.alibabacloud.com" target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-primary/70 hover:text-primary">(modelstudio.console.alibabacloud.com → API Keys)</a>
                  </label>
                  <RevealInput
                    value={qwen.apiKey}
                    onChange={v => setQwen(prev => ({ ...prev, apiKey: v }))}
                    placeholder={qwen.maskedKey || "sk-...  (your Alibaba Cloud API key)"}
                  />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground bg-white/5 rounded p-2 flex items-center gap-2">
                  <span className="text-green-400/60">International endpoint:</span>
                  https://dashscope-intl.aliyuncs.com/compatible-mode/v1
                  <CopyButton text="https://dashscope-intl.aliyuncs.com/compatible-mode/v1" />
                </div>
                <StatusBadge status={qwen.status} error={qwen.error} />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Button onClick={saveQwen} size="sm" className="font-mono text-xs gap-1.5 flex-1">
                  <Key className="w-3 h-3" /> SAVE KEY
                </Button>
                <Button onClick={testQwen} size="sm" variant="outline" className="font-mono text-xs gap-1.5">
                  <TestTube className="w-3 h-3" /> TEST
                </Button>
                <Link href="/settings">
                  <Button size="sm" variant="ghost" className="font-mono text-xs gap-1.5 px-3">
                    <Settings className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {/* Model categories toggle */}
              <button
                onClick={() => setShowQwenModels(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono hover:bg-amber-500/15 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  VIEW ALL 90+ MODEL CATEGORIES (agents auto-select by task)
                </span>
                {showQwenModels ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showQwenModels && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 space-y-3">
                  {QWEN_MODEL_CATEGORIES.map(cat => (
                    <div key={cat.tag} className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          {cat.icon} {cat.label}
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-mono uppercase">
                            auto:{cat.tag}
                          </span>
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">{cat.note}</p>
                      <div className="flex flex-wrap gap-1">
                        {cat.models.map(m => (
                          <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-muted-foreground hover:text-foreground hover:border-white/20 cursor-default transition-colors">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="text-[10px] font-mono text-muted-foreground text-center py-1">
                    + 50 more (dated versions, Qwen-Omni audio, image generation models)
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Smart Auto-Selection Info ───────────────────────────────── */}
          <div className="p-4 rounded-xl border border-primary/15 bg-primary/5">
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white mb-1.5 uppercase tracking-wide">Smart Model Auto-Selection</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Agents automatically pick the best free model based on the task — you never need to manually select.
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  {[
                    { task: "coding / dev", model: "qwen3-coder-plus", color: "text-blue-400" },
                    { task: "math / reasoning", model: "qwq-plus", color: "text-purple-400" },
                    { task: "vision / images", model: "qwen-vl-max", color: "text-pink-400" },
                    { task: "translation", model: "qwen-mt-plus", color: "text-cyan-400" },
                    { task: "long documents", model: "qwen2.5-14b-instruct-1m", color: "text-orange-400" },
                    { task: "general / fast", model: "qwen-max / qwen-flash", color: "text-green-400" },
                  ].map(r => (
                    <div key={r.task} className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-white/5">
                      <span className="text-muted-foreground">{r.task} →</span>
                      <span className={r.color}>{r.model}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Other Providers ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> OTHER PROVIDERS (configure in AI Providers)
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {OTHER_PROVIDERS.map(p => (
                <Link key={p.id} href="/settings">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                    otherStatus[p.id]
                      ? "bg-green-500/5 border-green-500/20 hover:border-green-500/40"
                      : "bg-white/3 border-white/5 hover:border-white/15"
                  )}>
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        {otherStatus[p.id] && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/settings">
              <Button variant="outline" className="w-full font-mono text-xs gap-2">
                <Settings className="w-3.5 h-3.5" />
                CONFIGURE ALL 23 PROVIDERS IN AI PROVIDERS PAGE
              </Button>
            </Link>
          </div>

          {/* Ready banner */}
          {(cf.configured || qwen.configured) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
            >
              <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">You're ready to go!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {[cf.configured && "Cloudflare Workers AI (100+ models)", qwen.configured && "Alibaba Cloud (90+ free models)"].filter(Boolean).join(" + ")} active.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/">
                  <Button className="font-mono text-xs gap-1.5">
                    <Zap className="w-3 h-3" /> LAUNCH AGENT SESSION
                  </Button>
                </Link>
                <Link href="/swarm">
                  <Button variant="outline" className="font-mono text-xs gap-1.5">SPAWN SWARM</Button>
                </Link>
                <Link href="/workflows">
                  <Button variant="outline" className="font-mono text-xs gap-1.5">54 WORKFLOWS</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {!cf.configured && !qwen.configured && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong>No providers configured yet.</strong> Add Cloudflare (100+ models free) or Alibaba Cloud (90+ models free) above. OpenAI runs via Replit proxy and is always available as a fallback — no key needed.
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
