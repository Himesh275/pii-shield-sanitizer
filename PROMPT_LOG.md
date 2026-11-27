# Prompt Engineering Log — PII Shield (Google Antigravity)

This log documents the structured, step-by-step prompts used to architect, implement, test, verify, and package **PII Shield** during the hackathon.

---

### Prompt 1 — Engineering Guardrails (`AGENTS.md`)
- **Goal:** Establish strict, non-negotiable client-side privacy, tech-stack, modularity, and cybersecurity theme rules at the repository root.
- **Scope:** `AGENTS.md`
- **Outcome:** Created [`AGENTS.md`](./AGENTS.md) enforcing 100% browser-only execution (zero backend, zero outbound network calls, zero remote fonts/CDNs, zero persistent PII storage), Vite + React + Tailwind CSS in standard JS, pure testable utilities in `src/utils/`, and dark-slate (`emerald`/`amber`/`rose`) visual standards.

---

### Prompt 2 — App Scaffolding, Layout & Sample Data
- **Goal:** Initialize the Vite + React + Tailwind CSS project (`PII Shield`) with header security branding, file upload, sample data loader, and mode selection controls.
- **Scope:** `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/App.jsx`, `src/components/Header.jsx`, `src/components/InputPanel.jsx`, `src/data/sampleData.js`
- **Outcome:** Scaffolded the static-ready app (`base: './'`), added the `"100% Client-Side • Zero Data Leaves Your Browser"` badge in `Header.jsx`, built `.txt`/`.csv` local `FileReader` upload + drag-and-drop + `"Load Sample Noisy Data"` in `InputPanel.jsx`, and verified `npm install` and `npm run build` passed cleanly.

---

### Prompt 3 — PII Detection Engine & Luhn Validation
- **Goal:** Build the pure client-side detection engine covering 6 PII entity types with exact character spans, deterministic overlap resolution, and Luhn credit card verification.
- **Scope:** `src/utils/luhn.js`, `src/utils/piiDetector.js`, `src/utils/piiDetector.test.js`
- **Outcome:** Implemented `isValidLuhn` and `detectPII` (`EMAIL`, `PHONE`, `IP_ADDRESS` IPv4/IPv6, `PAN`, `AADHAAR`, `CREDIT_CARD`). Caught and fixed a trailing-punctuation boundary bug on sentence-ending emails (`corp.co.in.`) via Vitest; verified all 11 initial unit tests pass, proving `4532-0151-1283-0366` is detected while non-Luhn `9048112233445561` is ignored.

---

### Prompt 4 — Three-Mode Redaction Engine
- **Goal:** Implement `Full Mask`, `Partial Mask`, and `Consistent Pseudonymization` in a dedicated pure module with exact original/sanitized span tracking.
- **Scope:** `src/utils/redactor.js`, `src/utils/redactor.test.js`
- **Outcome:** Implemented `redactPII` returning `sanitizedText`, `entityCounts`, `appliedRedactions` (with both original and sanitized start/end indices), and `pseudonymMap`. Verified all 17 Vitest unit tests passed across all 3 modes, including repeated-entity consistency (`ananya.sharma@finserve-demo.in` → `EMAIL_01` across 3 occurrences).

---

### Prompt 5 — Live Diff UI, Audit Cards, Pseudonym Table & Export
- **Goal:** Wire the detection and redaction engines into the React UI with live calculation, category audit stats, side-by-side diff highlighting, pseudonym audit table, and 1-click export.
- **Scope:** `src/App.jsx`, `src/components/AuditStats.jsx`, `src/components/DiffViewer.jsx`, `src/components/PseudonymTable.jsx`, plus `countIgnoredNonLuhn16DigitStrings` in `src/utils/piiDetector.js`
- **Outcome:** Connected live `useMemo` redaction in `App.jsx`, built `AuditStats.jsx` (total + 6 category badges + non-Luhn ignored counter), `DiffViewer.jsx` (color-coded left/right diff panes, hover tooltips, `"Copy Sanitized Text"`, and `"Download Sanitized File"`), and collapsible `PseudonymTable.jsx`. Verified 18/18 Vitest tests and `npm run build` passed.

---

### Prompt 6 — End-to-End Browser Verification
- **Goal:** Launch the app locally and verify all functional, UX, and zero-network privacy requirements in a real browser.
- **Scope:** Browser E2E test at `http://127.0.0.1:5173/` + copy polish fixes in `src/data/sampleData.js`, `src/components/InputPanel.jsx`, `src/components/DiffViewer.jsx`
- **Outcome:** Verified sample loading (`20` entities detected across all 6 categories, `2` non-Luhn 16-digit IDs ignored with `9048112233445561` intact), live switching across all 3 modes (`EMAIL_01` mapped consistently across 3 occurrences), clipboard copy (`"Copied!"`), `sanitized-output.txt` download, `0` console errors, and `0` external network requests. Fixed minor copy/preview-label mismatches and re-verified 18/18 Vitest tests and `npm run build`.

---

### Prompt 7 — Hackathon & GitHub Pages Packaging
- **Goal:** Finalize GitHub Pages relative build configuration and create judge-ready documentation (`README.md` and `PROMPT_LOG.md`).
- **Scope:** `vite.config.js`, `package.json`, `README.md`, `PROMPT_LOG.md`
- **Outcome:** Confirmed `base: './'` static build configuration, enriched `package.json` metadata, authored `README.md` and `PROMPT_LOG.md`, and verified `dist/index.html` builds cleanly with relative `./assets/...` paths.

---

### Prompt 8 — Local Git Identity & Safe `.gitignore`
- **Goal:** Initialize the local Git repository safely, exclude dependencies/build artifacts/secrets, and inspect GitHub CLI availability.
- **Scope:** `.gitignore`, local `.git/config`
- **Outcome:** Initialized `main`, configured local Git identity (`Himesh275`), updated `.gitignore` (excluding `node_modules/`, `dist/`, `.env`, `.env.*`, `.DS_Store`, and editor caches), verified exclusions via `git check-ignore`, and confirmed `gh` CLI was not installed so the repository URL could be connected directly.

---

### Prompt 9 — Initial Commit & Push to GitHub (`PromptWars x NIAT Pune`)
- **Goal:** Stage all project files cleanly (verifying zero ignored/secret files), commit with the hackathon title, and push to `origin/main`.
- **Scope:** Entire repository (`25` tracked files, excluding `node_modules/`, `dist/`, `.env*`)
- **Outcome:** Committed on `main` (`bcebd95` — `"Initial commit: Client-side PII Sanitizer for PromptWars x NIAT Pune"`) and pushed cleanly to `https://github.com/Himesh275/pii-shield-sanitizer.git`.

---

### Prompt 10 — GitHub Pages Production Deployment (`gh-pages`)
- **Goal:** Configure `gh-pages` deployment scripts and publish the static `dist/` bundle to the `gh-pages` branch without committing `dist/` to `main`.
- **Scope:** `vite.config.js`, `package.json`, `package-lock.json`, remote `gh-pages` branch
- **Outcome:** Installed `gh-pages` as a `devDependency`, added `"predeploy": "npm run build"` and `"deploy": "gh-pages -d dist"` scripts, ran `npm run deploy`, and verified `refs/heads/gh-pages` published to `origin` with live URL `https://himesh275.github.io/pii-shield-sanitizer/`.

---

### Prompt 11 — Final Documentation Sync & Live Site Verification
- **Goal:** Finalize `README.md` live demo link and `PROMPT_LOG.md`, push documentation updates to `main`, and verify the live GitHub Pages deployment end-to-end in the browser.
- **Scope:** `README.md`, `PROMPT_LOG.md`, `package.json`, `package-lock.json`, live verification at `https://himesh275.github.io/pii-shield-sanitizer/`
- **Outcome:** Synced final docs and `gh-pages` tooling to `origin/main` with a clean working tree, and verified the live GitHub Pages site loads with zero 404/console errors, working 1-click sample sanitization, and zero external network calls during redaction.

