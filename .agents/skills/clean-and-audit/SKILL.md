---
name: clean-and-audit
description: Quality assurance and dead-code runbook to audit the codebase with Knip, run ESLint, format with Prettier, and verify TypeScript compilation.
---

# Clean and Audit Procedure

Use this skill before opening a pull request, tagging a release, or deploying the portfolio to Vercel.

## Architecture Context

- **Knip Config:** `knip.json` (identifies unused files, dependencies, and exports)
- **Prettier Config:** `.prettierrc` / `.prettierrc.json` with Tailwind and import-sorting plugins
- **ESLint Config:** `eslint.config.mjs` (Next.js flat config)
- **TypeScript Config:** `tsconfig.json`

---

## Step-by-Step Procedure

### 1. Run Dead Code & Unused Export Detection

Run Knip to find unused components or orphan dependencies:

```bash
bun run knip || npx knip
```

Review any reported unused files in `src/components/ui/` or `src/components/technologies/`.

### 2. Run Code Formatting

Format all TypeScript, TSX, CSS, and Markdown files:

```bash
bun run format || npx prettier --write "**/*.{js,jsx,ts,tsx,json,md,css}"
```

### 3. Run Lint Check

Execute ESLint:

```bash
bun run lint || npx next lint
```

Address any warnings or errors regarding unescaped entities or React hook dependencies.

### 4. TypeScript Compilation Dry-Run

Ensure there are no type discrepancies:

```bash
bunx tsc --noEmit || npx tsc --noEmit
```

### 5. Production Build Verification

Verify that Turbopack and Next.js can generate the static site without runtime or MDX rendering failures:

```bash
bun run build || npm run build
```
