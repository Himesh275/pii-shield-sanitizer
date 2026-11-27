# PII Shield — Client-Side Data Sanitization Tool

> **Live Demo URL:** [https://himesh275.github.io/pii-shield-sanitizer/](https://himesh275.github.io/pii-shield-sanitizer/) *(Enable GitHub Pages -> Source: **GitHub Actions** in repo settings)*

---

## Project Overview

**PII Shield** is a privacy-first, zero-leakage web application that detects, validates, masks, and pseudonymizes Personally Identifiable Information (PII) inside raw text, support tickets, application logs, and `.txt` / `.csv` files—**100% locally inside the user's browser**.

Before pasting sensitive logs into an AI assistant, sharing incident reports, or archiving support transcripts, PII Shield sanitizes sensitive identifiers in real time with a live side-by-side diff view, entity audit breakdown, and 1-click export.

---

## Cybersecurity & Privacy Architecture (100% Client-Side)

PII Shield is engineered under strict zero-leakage rules (enforced in [AGENTS.md](./AGENTS.md)):

- **Zero Backend:** Pure static React + Vite application with no API server, proxy, or database.
- **Zero Outbound Network Calls:** Never invokes `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, telemetry, or analytics.
- **Zero Remote Assets or CDNs:** All UI components, Tailwind styles, and `lucide-react` icons are bundled locally; system font stacks avoid Google Fonts or external CDN requests.
- **In-Memory Processing Only:** File uploads use the browser `FileReader` API (`readAsText`), exports use local `Blob` + `URL.createObjectURL`, and raw user input is never written to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or console logs.
- **Pure Testable Core:** All detection, validation, and redaction logic lives inside `src/utils/` with zero DOM/React coupling.

---

## Supported PII Types & Luhn Validation

Detection runs via `detectPII` in [`src/utils/piiDetector.js`](./src/utils/piiDetector.js) with deterministic longest-span / highest-priority overlap resolution so longer matches (such as a 16-digit credit card) are never split into shorter Aadhaar or phone matches.

| Entity Type | Coverage & Format Rules | Validation / False-Positive Guard |
| --- | --- | --- |
| `EMAIL` | Standard local/domain email formats (including `+` tags and subdomains) | Rejects malformed consecutive dots (`..`) and trailing sentence punctuation |
| `PHONE` | Indian `+91` / 10-digit mobile numbers (`[6-9]...`) and international formats | Enforces 10–15 total digits and boundary guards against dates/IDs |
| `IP_ADDRESS` | IPv4 (`0–255` per octet) and full/compressed (`::`) IPv6 | Strict octet bounds (`0–255`) and 8-group / `::` IPv6 structure checks |
| `PAN` | Indian Permanent Account Number (`[A-Z]{5}[0-9]{4}[A-Z]`) | Enforces exact uppercase format and alphanumeric boundaries |
| `AADHAAR` | Indian 12-digit Aadhaar (`XXXX XXXX XXXX`, `XXXX-XXXX-XXXX`, or continuous) | Requires leading digit `2–9` and guards against slicing 16-digit IDs |
| `CREDIT_CARD` | 13–19 digit card numbers (continuous, spaces, or hyphens) | **Mandatory ISO/IEC 7812 Luhn checksum** via `isValidLuhn` |

### Why Luhn Validation Matters
Naive regex scanners falsely flag 16-digit order IDs, tracking numbers, or transaction references as credit cards. Every `CREDIT_CARD` candidate in PII Shield must pass `isValidLuhn` in [`src/utils/luhn.js`](./src/utils/luhn.js):
- Valid Luhn test card `4532-0151-1283-0366` → **Detected as `CREDIT_CARD` & redacted**.
- Non-Luhn 16-digit merchant order ID `9048112233445561` → **Ignored & preserved intact** (and surfaced in the `AuditStats` false-positive prevention counter).

---

## Three Redaction Modes Comparison

Implemented in [`src/utils/redactor.js`](./src/utils/redactor.js) (`redactPII`):

| Mode | Behavior | Example (`Email` / `PAN` / `Card`) | Best For |
| --- | --- | --- | --- |
| **Full Mask** | Replaces every entity with `[REDACTED]` (supports optional typed labels) | `[REDACTED]` / `[REDACTED]` / `[REDACTED]` | Maximum privacy & external compliance sharing |
| **Partial Mask** | Keeps safe verification edges while masking sensitive cores | `a***@finserve-demo.in` / `BX*******K` / `XXXX-XXXX-XXXX-0366` | Customer support triage & audit verification |
| **Consistent Pseudonymization** | Maps unique entities to deterministic session IDs (`EMAIL_01`, `CARD_01`, ...) | `EMAIL_01` (same ID across all 3 occurrences) / `PAN_01` / `CARD_01` | Sharing logs with LLMs or debugging multi-step threads |

When **Consistent Pseudonymization** is active, the collapsible `PseudonymTable` displays each generated `Placeholder`, its `Entity Type`, and total `Occurrences Mapped`.

---

## Local Setup & Verification

### Prerequisites
- **Node.js** (v18+ / LTS) and **npm**

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run the local development server
npm run dev

# 3. Run unit tests (Vitest)
npx vitest run

# 4. Build the static GitHub Pages bundle (outputs to dist/)
npm run build

# 5. Preview the production dist/ bundle locally
npm run preview
```

### GitHub Pages Deployment
[`vite.config.js`](./vite.config.js) sets `base: './'`, so every asset path inside `dist/index.html` is relative. You can publish the `dist/` directory directly to GitHub Pages (via `gh-pages` or GitHub Actions) under any repository name without subpath configuration changes.
