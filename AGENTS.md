# AGENTS.md — PII Shield Hackathon Engineering Rules

This document defines mandatory architecture, security, and code-organization rules for all work in this repository.

## 1. Zero-Leakage & 100% Client-Side Privacy (Non-Negotiable)
- **Client-Side Execution Only:** All PII detection, validation, masking, and redaction must run 100% locally in the user's browser.
- **No Backend:** Never add a backend server, proxy, serverless function, or database.
- **No Outbound Network Requests:** Never introduce `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, external API calls, telemetry, or analytics scripts.
- **No Remote Assets or CDNs:** Never load remote fonts (e.g., Google Fonts), external stylesheets, remote scripts, or CDN assets that could leak user context or break offline/air-gapped privacy guarantees. Bundle all fonts, icons, and styles locally.
- **No Persistent Sensitive Storage:** Never write raw user input or unredacted PII to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or console logs.

## 2. Tech Stack & Deployment Target
- **Framework & Tooling:** Use **Vite + React + Tailwind CSS** in **standard JavaScript** (`.js` / `.jsx`; do not introduce TypeScript).
- **Static Build Compatibility:** Ensure `vite build` produces a self-contained static site compatible with **GitHub Pages** (relative/configured base path, no server-side routing assumptions).

## 3. Modular Architecture & Testing
- **Pure Utility Modules:** Keep all PII detection, validation (e.g., Luhn, Verhoeff, format checks), scoring, and redaction logic pure and modular inside `src/utils/`.
- **No UI Coupling in Utils:** Modules in `src/utils/` must have zero React/DOM dependencies so they can be directly unit-tested with **Vitest**.
- **Test Coverage:** Any new detector, validator, or redaction rule added under `src/utils/` must include corresponding unit tests covering true positives, false positives, and edge cases.

## 4. UI & Cybersecurity Visual Standards
- **Theme:** Maintain a clean, high-contrast cybersecurity aesthetic across every UI component:
  - **Base Surface:** Dark slate backgrounds (e.g., `bg-slate-950`, `bg-slate-900`, crisp subtle slate borders).
  - **Status Accents:**
    - **Emerald** (`emerald-*`) for safe / clean / verified / zero-PII states.
    - **Amber** (`amber-*`) for warnings / medium-risk / partial or masked findings.
    - **Rose** (`rose-*`) for critical PII exposures / high-risk findings / invalid or dangerous states.
- **Accessibility & Clarity:** Ensure readable contrast, monospace styling for detected tokens/payloads/redacted output, and clear visual feedback without clutter.

## 5. Verification Checklist Before Completing Any Change
1. Confirm zero network calls, analytics, or external CDN/font URLs were introduced.
2. Confirm detection/redaction changes live in `src/utils/` and pass `vitest`.
3. Confirm the static production build (`vite build`) succeeds cleanly.
