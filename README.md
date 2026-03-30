# Dynamic Agent Sandbox - Complete Source Code

A production-grade AI agent execution platform with real WebSocket-connected agents, multi-provider AI routing, persistent memory, and Cloudflare Workers deployment.

## 🚀 Overview

This repository contains the COMPLETE source code for the Dynamic Agent Sandbox - a multi-agent AI platform that enables real, zero-simulation AI interactions through three different agent classes:
- **OpenClaw** (Green) - Full-featured tasks, workflows, research
- **NanoClaw** (Cyan) - Ultra-fast Q&A, quick tasks, low cost  
- **NemoClaw** (Purple) - Deep reasoning, complex analysis, research

## 🎯 Key Features

- **Real AI Integration** - No simulation, all agents use actual AI models
- **Multi-Provider Support** - 11 AI providers (OpenAI, Anthropic, Groq, Together, etc.)
- **Real-Time WebSocket Communication**
- **Persistent Memory & Sessions**
- **12 Built-in Workflows**
- **AutoResearch Loop**
- **Cloudflare Workers Deployment**
- **xterm.js Terminal Interface**

## 📁 Repository Contents

```
/
├── artifacts/                    # Source applications
│   ├── agent-sandbox/            # React + Vite frontend with xterm.js
│   ├── api-server/               # Node.js WebSocket API backend
│   └── mockup-sandbox/           # Component preview sandbox
├── lib/                          # Shared libraries
│   ├── api-client-react/         # Generated API client
│   ├── api-spec/                 # OpenAPI specifications
│   ├── api-zod/                  # Zod type definitions
│   └── db/                       # Database schemas (PostgreSQL + Drizzle)
├── cloudflare-worker/            # Production deployment code
├── extracted-platform/           # Extracted platform components
├── extracted-sandbox/            # Extracted sandbox components
└── attached_assets/              # Additional project assets
```

## 🏗️ Architecture

```
Browser (xterm.js) Frontend
    │ WebSocket JSON messages
    ▼
Node.js API Server (local development)
    ▼
Cloudflare Workers (production)
    ▼
Multiple AI Providers
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start local development
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/agent-sandbox run dev
```

## 📦 Package Structure

### Frontend Application (`artifacts/agent-sandbox/`)
- React 18 with TypeScript
- Vite for fast development
- xterm.js terminal interface
- Tailwind CSS + shadcn/ui components
- Real-time WebSocket connection to API

### Backend Server (`artifacts/api-server/`)
- Node.js + Express + TypeScript
- WebSocket server for real-time communication
- Multi-provider AI routing (11 providers)
- Built-in workflows and research loop
- Usage tracking and session management

### Shared Libraries (`lib/`)
- Auto-generated API clients from OpenAPI specs
- Database schemas using Drizzle ORM
- Type-safe Zod validators
- PostgreSQL database definitions

### Production Deployment (`cloudflare-worker/`)
- Cloudflare Workers
- Durable Objects for state persistence
- Workers AI integration
- Docker deployment ready

## 🌟 Agent Types

### OpenClaw Agent
- 4096 token context
- 20 parallel tasks
- Full-featured agent for complex workflows

### NanoClaw Agent
- 1024 token context  
- 10 parallel tasks
- Ultra-fast, low-cost agent for quick tasks

### NemoClaw Agent
- 16384 token context
- 5 parallel tasks
- Deep reasoning agent for complex analysis

## 🔧 Built-in Workflows

1. Code Reviewer
2. Research Agent
3. Bug Hunter
4. Data Pipeline
5. Parallel Comparator
6. API Doc Generator
7. Security Auditor
8. Deploy Validator
9. Content Factory
10. Log Analyzer
11. Test Generator
12. Competitive Intel

## 🌐 AI Provider Support

- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Groq** - Ultra-fast inference
- **Together AI** - Community models
- **OpenRouter** - Multi-provider routing
- **Mistral** - Mistral models
- **Google Gemini** - Gemini models
- **Cohere** - Cohere models
- **Perplexity** - Perplexity models
- **Ollama** - Local models
- **LM Studio** - Local models

## 🔑 Environment Variables

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
⋯
DATABASE_URL=
JWT_SECRET=
```

## 📚 Documentation

See the comprehensive documentation in each section:
- [Backend README](./artifacts/api-server/README.md) for API documentation
- [Frontend Guide](./artifacts/agent-sandbox/README.md) for UI components
- [Deployment Guide](./cloudflare-worker/DEPLOY.md) for production setup

---

This repository contains the complete source code for the Dynamic Agent Sandbox platform, ready for development and deployment.