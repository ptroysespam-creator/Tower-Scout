# TOWER SCOUT: MASTER ARCHITECTURE & RULES

## 1. MISSION
Build the "First Signal" intelligence platform for luxury real estate (Tower Scout).
- **Goal:** Ingest 1,842 sources/hour, filter for top 1% luxury/high-rise, and present in a "Dark Airbnb" style dashboard.
- **Critical Constraints:** No manual data entry. 5-month historical backfill required.

## 2. THE 3-LOOP ARCHITECTURE
The system operates on three decoupled, forever-running loops.

### LOOP 1: THE HARVESTER (Discovery)
- **Role:** Dumb, fast, high-volume.
- **Tech:** Python + Firecrawl.
- **Input:** `sources` table (URL, last_crawled_date).
- **Action:** Scrape URL -> Save raw Markdown to `raw_signals` table -> Update `last_crawled_date`.
- **Logic:** If `backfill_status` is PENDING, paginate backwards 5 months.

### LOOP 2: THE BRAIN (Enrichment)
- **Role:** Intelligent, expensive, thorough.
- **Tech:** n8n OR Python Worker + Groq (Llama 3).
- **Input:** `raw_signals` table (New rows).
- **Action:** Read Raw Markdown -> Extract Structured Data (Budget, Developer, Floors) -> Upsert to `projects` table.
- **Rule:** Never stop. If queue is empty, sleep 10s.

### LOOP 3: THE SCOUT (Expansion)
- **Role:** Meta-crawler for new sources.
- **Tech:** Google Search API + Custom Validation.
- **Action:** Search "new condo tower miami" -> Extract domains -> Check if exists in `sources` -> If new, validate RSS/Structure -> Add to `sources`.

## 3. THE "RALPH" PROTOCOL (NON-NEGOTIABLE)
All Python scripts must be wrapped in the "Ralph Loop" pattern:
1. **Never Crash:** Wrap `main()` in a `try/except` block that logs error and sleeps.
2. **Never Exit:** `while True:` loop is mandatory.
3. **State Persistence:** Save `cursor` (page/date) to InstantDB after *every* item.
4. **Self-Anneal:** If an error occurs (e.g., 429 Rate Limit), sleep for `backoff_time` and retry.

## 4. TECH STACK & CONTRACTS
- **Frontend:** Next.js (App Router), Tailwind, ShadCN (Dark Mode + Violet).
- **Backend/DB:** InstantDB (Schema: `projects`, `signals`, `sources`).
- **AI Processing:** Groq (Llama 3 70B).
- **Scraping:** Firecrawl (API).

## 5. CURRENT PHASE: CHECKPOINT 1
**Objective:** Setup the "Skeleton" — The InstantDB schema and the `ralph.py` wrapper.
**Acceptance Criteria:** A script runs indefinitely, prints "Ralph is running", connects to InstantDB, and survives a forced crash.
