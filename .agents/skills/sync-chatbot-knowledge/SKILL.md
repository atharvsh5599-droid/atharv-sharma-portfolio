---
name: sync-chatbot-knowledge
description: Procedure to keep the built-in Gemini AI chatbot assistant synchronized with the latest resume, skills, achievements, education, and project data.
---

# Sync Chatbot Knowledge Base Procedure

Use this skill whenever updates are made to portfolio data (skills, experience, projects, education, awards) to prevent AI chatbot hallucinations and keep responses accurate.

## Architecture Context

- **Chat Endpoint:** `src/app/api/chat/route.ts` (calls Google Gemini API)
- **System Prompt & Suggestions:** `src/config/ChatPrompt.ts`
- **Knowledge Retrieval Engine:** `src/lib/chat-knowledge.ts`
- **Source of Truth Configs:**
  - `src/config/About.tsx` (Bio, Education, Core skills)
  - `src/config/Projects.tsx` (Active projects)
  - `src/config/Experience.tsx` (Internships / Work history)
  - `src/config/Achievements.tsx` (Certificates & Hackathons)
  - `src/config/Contact.tsx` (Email, GitHub, LinkedIn, GFG)

---

## Step-by-Step Procedure

### 1. Identify Changed Context

Check what has been updated:

- New skills added to `About.tsx`
- New projects added to `Projects.tsx`
- New experience added to `Experience.tsx`
- New achievements added to `Achievements.tsx`

### 2. Update `src/lib/chat-knowledge.ts`

- Update `getPortfolioKnowledgeContext()` to include the new factual statements.
- If a new project was added:
  - Check `getRelevantProjects(message)` keywords to ensure queries matching the project domain trigger relevant retrieval.
  - Ensure `formatProject()` provides clean Markdown links.
- If a new role or internship was added:
  - Ensure the company name, role, tech stack, and duration are cleanly structured.

### 3. Check System Prompt Guardrails in `src/config/ChatPrompt.ts`

Verify that prompt rules enforce:

- Never claim to be Atharv or human (must remain AI Portfolio Assistant).
- Strict truthfulness (no fabricated positions, companies, or certificates).
- Concise replies (< 120 words unless user explicitly asks for details).
- Directing inquiries to official email and profile links:
  - GitHub: `atharvsh5599-droid`
  - GeeksforGeeks: `as9817467007`
  - LinkedIn & Email

### 4. Verify Route Logic

- Verify fallback response in `getPortfolioFallback()` in `src/lib/chat-knowledge.ts`.
- Ensure responses stay grounded when Gemini API is called or fallback is triggered.
