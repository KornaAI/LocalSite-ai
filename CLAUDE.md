# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

```bash
deno task dev      # Start development server (http://localhost:5173)
deno task build    # Build for production (adapter-node → build/)
deno task start    # Run the built production server (build/index.js)
deno task preview  # Preview the production build via Vite
deno task check    # svelte-kit sync + svelte-check typecheck
deno fmt           # Format
deno lint          # Lint
```

No test framework is configured. The runtime and toolchain are **Deno 2.x** —
there is no Node/npm. Dependencies are declared in `package.json` and installed
via `deno install` (Deno creates a real `node_modules` because `deno.json` sets
`nodeModulesDir: "auto"`, which Vite/SvelteKit require).

## Environment Setup

Copy `.env.example` to `.env.local` (loaded by Vite in dev) and populate the
relevant API keys. The production `adapter-node` server reads `.env`.
`DEFAULT_PROVIDER` defaults to `ollama`. Use `DISABLED_PROVIDERS`
(comma-separated) to hide providers from the UI. Secrets are read server-side
only via `$env/dynamic/private`.

## Architecture

**LocalSite-AI** is a SvelteKit (Svelte 5 runes) application that generates
self-contained HTML/CSS/JS pages from natural language prompts, streamed from
one of 9 supported AI providers.

### Data flow

1. User selects a provider/model and enters a prompt in
   `src/lib/components/WelcomeView.svelte`
2. `src/lib/state/code-generation.svelte.ts` (the `CodeGeneration` rune class)
   POSTs to `/api/generate-code`
3. The endpoint calls
   `src/lib/server/providers/provider.ts → generateCodeStream()`, which uses the
   Vercel AI SDK's `streamText` under the hood
4. The response is streamed back as **NDJSON** — each line is
   `{"type":"text"|"reasoning","content":"..."}` — and parsed by the state class
5. `src/lib/components/GenerationView.svelte` renders the live preview (iframe)
   and Monaco editor side-by-side via `CodePanel.svelte` / `PreviewPanel.svelte`
   (resizable layout uses `paneforge`)

### Provider system (`src/lib/server/providers/`)

Server-only (under `$lib/server`, so SvelteKit guarantees it never reaches the
client).

- **`config.ts`** — defines the `LLMProvider` enum, per-provider env-var
  mapping, `isProviderConfigured()`, `getAvailableProviders()`. Reads env via
  `$env/dynamic/private`. Providers can be disabled via `DISABLED_PROVIDERS`.
- **`provider.ts`** — one class per provider implementing `LLMProviderClient`
  (`getModels()`, `getModel()`). `generateCodeStream()` wraps Vercel AI SDK
  `streamText` and applies `extractReasoningMiddleware` for thinking/reasoning
  models.
- **`prompts.ts`** — two system prompts: `DEFAULT_SYSTEM_PROMPT` and
  `THINKING_SYSTEM_PROMPT` (adds `<think>` tags for reasoning models).

### API routes (`src/routes/api/`)

| Route                               | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `POST /api/generate-code`           | Streams NDJSON code + reasoning              |
| `GET /api/get-models?provider=<id>` | Returns models list for a provider           |
| `POST /api/get-models`              | Returns all available (configured) providers |
| `GET /api/get-default-provider`     | Returns `DEFAULT_PROVIDER` env value         |

### Key state

- **`src/lib/state/code-generation.svelte.ts`** — the `CodeGeneration` class
  holds all generation state as `$state` fields (`generatedCode`,
  `isGenerating`, `thinkingOutput`, etc.) and the streaming logic. Instantiated
  once in `src/routes/+page.svelte`.

### UI conventions

- Hand-rolled UI primitives live in `src/lib/components/ui/` (Button, Badge,
  Input, Textarea, Switch, Select, Combobox, Dialog, ScrollArea) — built on
  Tailwind, no component framework.
- The app renders client-side only (`export const ssr = false` in
  `src/routes/+layout.ts`) because of Monaco, `sessionStorage` model caching,
  and streaming fetch.
- Theme is forced dark (`<html class="dark">` in `src/app.html`); global styles
  and animations live in `src/app.css`.
- Path alias `$lib` maps to `src/lib` (SvelteKit default).
