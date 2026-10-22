# Recall — Build Worklog

Project: Recall — A Local-First Knowledge Assistant (DSA mini project)
Architecture: Next.js 16 frontend (this repo, single `/` route) + Java Spring Boot backend (mini-service on port 8080) + SQLite + optional Groq AI.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Inspect environment & install missing prerequisites

Work Log:
- Checked versions: Java 21 JRE present (no javac), Maven missing, Node v24.21.0, Bun 1.3.14.
- Confirmed Caddyfile gateway: any request with `?XTransformPort=<port>` is reverse-proxied to localhost:<port>; everything else goes to Next.js on 3000.
- No passwordless sudo; deb.debian.org and repo.maven.apache.org are reachable.
- Installed OpenJDK 21 JDK locally: `apt-get download openjdk-21-jre-headless openjdk-21-jdk-headless` + `dpkg -x` into `~/tools/jdk21/usr/lib/jvm/java-21-openjdk-amd64` (javac 21.0.12.1 verified).
- Installed Apache Maven 3.9.9 binary tarball into `~/tools/apache-maven-3.9.9` (verified with JAVA_HOME).
- Next.js dev server already running on port 3000 (HTTP 200).

Stage Summary:
- To use the toolchain: `export JAVA_HOME=$HOME/tools/jdk21/usr/lib/jvm/java-21-openjdk-amd64 && export PATH=$JAVA_HOME/bin:$HOME/tools/apache-maven-3.9.9/bin:$PATH`
- Existing scaffold: shadcn/ui full set, lucide-react, sonner, Tailwind 4. Existing page.tsx/layout.tsx will be adapted for Recall (single route, client-side view switching).
- API contract decided (backend serves on 8080, frontend calls via `/api/...?XTransformPort=8080`):
  - GET  /api/health
  - GET  /api/documents
  - POST /api/documents (multipart field `file`)
  - GET  /api/documents/{id}
  - DELETE /api/documents/{id}
  - GET  /api/search?q={query}
  - POST /api/ai/ask {question}
  - POST /api/ai/summarize/{id}
---
Task ID: 4
Agent: full-stack-developer (frontend)
Task: Recall dashboard UI (single-route, 5 views, typed API client)

Work Log:
- Read worklog.md API contract (Task 1) and implemented the client exactly against it.
- Audited existing scaffold: layout.tsx, page.tsx, globals.css (dark token set), use-toast/use-mobile, all shadcn/ui components present (select, alert-dialog, dialog, alert, skeleton, scroll-area, badge, card...), lucide-react 0.525, no new packages needed.
- Created src/lib/recall-api.ts: relative-path client; endpoint() appends XTransformPort=8080 unless NEXT_PUBLIC_RECALL_API_BASE is absolute; request<T>() with cache:"no-store", network-failure => RecallApiError("Cannot reach the Recall backend. Make sure the Java server is running on port 8080."), non-2xx => backend {message} fallback "Request failed (HTTP <status>)"; RecallApiError exported; all 8 contract types + methods health/listDocuments/uploadDocument(FormData "file", no Content-Type)/getDocument/deleteDocument/search/ask/summarize.
- Created src/lib/use-recall-health.ts: fetch on mount + 15s interval only while tab visible + visibilitychange refetch + manual refresh; exposes { health, loading, error, refresh }.
- Shell src/components/recall/recall-app.tsx ('use client'): dark charcoal sidebar (Brain brand emerald, 5 nav items, active bg-emerald-400/10 text-emerald-300, 44px targets, backend status dot at bottom), sticky mobile header with horizontal scrollable nav, desktop header with global search input (Enter => search handoff) + AI status badge, main column max-w-6xl, views kept mounted (hidden class) so chat/results/lists survive navigation, footer with mt-auto sticky-bottom pattern, DocumentPreviewDialog mounted once at shell level with previewId/previewOpen state.
- Views: overview-view (4 stat cards from health only + skeletons + offline alert with retry, recent-5 documents card opening the preview dialog, quick search form, How-Recall-works card, Import CTA), documents-view (dashed drop zone with dragover highlight, hidden multi-file input, client-side txt/md/markdown validation with destructive toasts, sequential uploads with "Importing <name>…" live label, list rows with fileType/wordCount/importedAt badges, Eye => preview, Trash2 => AlertDialog confirm => delete => toast => reload, 3-skeleton loading + empty + error states), search-view (submit + seed.nonce effect handoff, meta line with match/doc counts and elapsedMs, relevance|name sort Select with display-only tooltip, per-result score badge + relative emerald relevance bar + matchedTerms badges + regex-escaped word-boundary case-insensitive <mark> highlighting, scoring explainer card, no-results suggestions, backend-down banner with retry), assistant-view (amber/emerald grounding notice, chat with pending animated-dots bubble, user emerald / assistant slate bubbles, sources chips opening the preview dialog, usedAi===false local-answer note, errors rendered as red assistant bubbles so chat stays usable, Enter/Shift+Enter textarea, summarize panel with document Select + refresh + disabled-when-!aiConfigured tooltip + truncated note + model badge + amber inline error), settings-view (reuses useRecallHealth 15s poll, backend/AI/library/runtime cards incl. dbPath mono + engine description, privacy card; NO key editor by design).
- Shared: recall-types.ts (RecallView, SearchSeed), error-banner.tsx (red banner + retry), document-preview-dialog.tsx (fetch on open, meta badges, max-h-[60vh] scrollable mono content, skeleton + in-dialog error/retry).
- layout.tsx: html lang="en" className="dark", metadata "Recall — Local-First Knowledge Assistant" + grounding description, kept Geist fonts + Toaster. page.tsx: server component rendering <RecallApp /> only.
- Style adherence: emerald-400/300 accent only (red-400 destructive, amber-400 warnings), border-slate-800 + bg-slate-900/50 cards, rounded-lg/xl, max-h + overflow-y-auto + webkit scrollbar styling on long lists, aria-labels on icon-only buttons, htmlFor labels, semantic section/nav/main/footer, min-h-[44px] touch targets, escaped apostrophes in JSX.
- Verified: `bun run lint` => 0 errors 0 warnings; `bunx tsc --noEmit` => 0 errors under src/ (only pre-existing errors in untouched examples/ + skills/); GET / => 200 with class="dark" SSR output; backend was not running during dev (graceful error states confirmed by design, not blocked on it).

Stage Summary:
- Files created: src/lib/recall-api.ts, src/lib/use-recall-health.ts, src/components/recall/{recall-types.ts, error-banner.tsx, document-preview-dialog.tsx, overview-view.tsx, documents-view.tsx, search-view.tsx, assistant-view.tsx, settings-view.tsx, recall-app.tsx}. Files modified: src/app/page.tsx, src/app/layout.tsx.
- Key decisions: (1) uploadDocument typed as Promise<DocumentSummary> but UI only relies on the local File name for toasts, so any 2xx JSON body shape from POST /api/documents degrades safely — this was the one endpoint whose response shape was not pinned in the contract; (2) all five views stay mounted (CSS hidden) to preserve chat history/search results across tab switches and keep in-flight uploads alive; (3) "match(es) across M documents" counts unique documentIds among results; (4) AI badge shows "Checking…" while health is unknown instead of falsely claiming "AI not configured"; (5) icon-only action buttons sized size-11 (44px) per touch-target rule.
- Integration notes for Task 3 (backend): field names must match exactly (importedAt ISO string, documentId/documentName in search results, usedAi boolean on /ai/ask); errors should return {message} JSON bodies to surface nicely; multipart field is "file".

---
Task ID: 2+3+5
Agent: general-purpose (backend)
Task: Spring Boot backend + SQLite + custom DSA search engine + Groq integration

Work Log:
- Verified toolchain (javac 21.0.12.1, Maven 3.9.9 from ~/tools).
- Created `mini-services/recall-backend/` with the full tree: pom.xml (Boot 3.3.5, Java 21, web+jdbc+sqlite-jdbc 3.46.1.3), package.json ({"dev":"bash run.sh"}), executable run.sh, .env.example, application.properties exactly per contract.
- Implemented all 11 DTOs as Java records with exact JSON field names (HealthResponse, DocumentSummary/Detail, DocumentsResponse, DeleteResponse, SearchResult, SearchResponse, SourceRef, AskResponse, SummarizeResponse, ApiError).
- Implemented the DSA search engine in `search/` using ONLY syllabus constructs (arrays/ArrayList/loops/String methods/counters): QueryProcessor (whitespace split + lowercase + [^a-z0-9] strip + first-occurrence dedupe via ArrayList.contains, O(Q²)), SearchScorer (hand-rolled nested-loop term counting, score = occurrences/wordCount, O(Q×W)/doc, returns null when no match), SnippetGenerator (window [hit-12, hit+20) clamped, "… "/" …" markers, 32-word fallback), SearchSorter (hand-written insertion sort: descending Double.compare score, tie-break compareToIgnoreCase name; stable, in-place, O(n²)/O(1) space), SearchEngine (linear scan over the whole library → score → sort; stateless; nested record EngineResult). Grep-verified: zero HashMap/Set/streams/sort-library usage in search/ (only a JavaDoc mention explaining they are forbidden).
- DocumentRepository on JdbcTemplate: @PostConstruct CREATE TABLE IF NOT EXISTS documents(...), parameterized insert with GeneratedKeyHolder, findAllSummaries (ORDER BY imported_at DESC, id DESC), findById (Optional<DocumentDetail>), findAllForSearch → List<DocumentRecord>, deleteById, countAll, COALESCE sumWords. Also ensures the DB parent dir exists before first use.
- DocumentService: multipart import validation (missing/empty → 400, extension after last dot case-insensitive against recall.allowed-extensions → 400 with allowed list, size guard → 413, UTF-8 decode, NUL strip, CRLF→LF normalize, word count via trim+split, blank → 400 "Document contains no readable text"), list/get (404 "Document not found: <id>")/delete (404 on 0 rows).
- AiService: ask() order = validate (blank → 400, >2000 chars → 400) → local SearchEngine over repo → 0 hits ⇒ local "couldn't find" answer with usedAi=false (NO Groq call) → else top-4 passages (content capped at 4000 chars each) to Groq with the exact contract system prompt; sources are the engine's actual top-4 (id/name/score), usedAi=true. summarize() truncates at 12000 chars (truncated:true + in-prompt notice), 404 unknown id, 400 blank content.
- GroqClient (java.net.http.HttpClient, 10s connect / 45s request timeout): 503 on missing key, unreachable/timeout, 401/403, 429, other non-200 (with safe error.message echo), empty choices; temperature 0.2, max_tokens 1024; key never logged. GroqApiException extends ApiException(503).
- Controllers (thin, constructor-injected): Health (aiConfigured = key non-blank, dbPath = configured RECALL_DB_PATH), Document (201 on upload, multipart field `file`), Search (blank/missing q → 400 "Query parameter 'q' is required"; elapsedMs via System.nanoTime around engine call), Ai (ask/summarize). ApiExceptionHandler: ApiException→own status, MaxUploadSizeExceededException→413, HttpMessageNotReadableException→400 "Invalid request body", NoResourceFoundException→404, Exception→500 (logged); CorsConfig: /api/** origins from property, any method/header, no credentials.
- Tests: SearchEngineTest (11 tests, no Spring) covering all required names incl. tie-break, normalization-by-length ranking, repeated-terms-once, snippet ellipses; RecallApiFlowTest (14 ordered tests, @SpringBootTest+MockMvc, sqlite target/test-recall-<uuid>.db via @DynamicPropertySource): upload 201 → detail → search hit → health count 1 → delete → search empty → 404, ask no-match usedAi=false, blank ask/q 400, png 400, empty file 400, summarize 404, delete 404.
- `mvn test` → BUILD SUCCESS, Tests run: 25, Failures: 0, Errors: 0. `mvn -DskipTests package` → target/recall-backend-1.0.0.jar.
- Started jar on :8080 (orphaned double-fork, see Stage Summary) and verified by curl: health direct + gateway (:81?XTransformPort=8080) both UP; upload sample-java-notes.txt (341 words) → 201; search "insertion sort" → scored/snippeted hit (score 0.01760, matchedTerms [insertion, sort]); search "recursion" hit; ask "quantum chromodynamics zzz" → 200 usedAi=false local answer; ask matching notes → 503 Groq-not-configured (expected, no key); summarize → 503 / 404 paths; blank q/invalid JSON/bad extension/empty file → 400 with {"message"}; CORS preflight returns Access-Control-Allow-Origin for :3000; upload temp-avl.txt → search hit → DELETE → search empty → second DELETE 404. backend.log has 0 ERROR/WARN lines.

Stage Summary:
- Backend complete and running: `SERVER_PORT=8080 java -jar target/recall-backend-1.0.0.jar` from mini-services/recall-backend (or `bash run.sh` / `bun run dev` equivalent). Note: this sandbox reaps child processes between tool calls; the backend was left running via double-fork `( setsid java -jar ... & )` (pid survived across calls, verified). If it ever stops, restart with run.sh.
- Tests: 25/25 green (11 DSA unit + 14 API flow). Package: target/recall-backend-1.0.0.jar.
- Deviations (minor, documented): (1) service also normalizes lone \r → \n besides \r\n (harmless superset); (2) both Spring's multipart limit and an explicit service-side size guard return 413 "File exceeds the upload size limit"; (3) DocumentRecord lives in search/ as specified, so model/SearchResult is referenced by the scorer (search→model one-way dependency, no forbidden constructs); (4) summarize sends the contract's summarization text as the user prompt plus a short untrusted-data system prompt.

---
Task ID: 6
Agent: main (Z.ai Code)
Task: Finish deliverables — README, env/gitignore verification, browser E2E verification, final report

Work Log:
- Re-ran `mvn test` fresh: 25/25 green (11 SearchEngineTest + 14 RecallApiFlowTest), BUILD SUCCESS.
- Wrote root README.md (35 KB) with all 30 required sections incl. Mermaid architecture diagram, DSA/complexity tables, viva Q&A (11 questions), troubleshooting, honest build-limitation note (npm run build not runnable in this sandbox).
- Verified .gitignore (target/, data/*.db, .env*, logs) and .env.example (frontend+backend vars, blank secrets) already complete from earlier tasks.
- Browser E2E via agent-browser through the Caddy gateway (:81 — direct :3000 bypasses XTransformPort proxying, an expected artifact, not a bug):
  Overview live stats (2 docs / 588 words / Connected / AI Not configured) → Search "insertion sort" (2 matches, 7 ms, scores 0.0243/0.0176, term chips, snippet) → preview dialog (full content + meta) → AI ask with material (clear not-configured bubble), ask with no material (local fallback + "nothing sent to Groq" note) → Settings accurate → upload /tmp file via real input (27 words, searchable "kadane" hit) → delete via confirm dialog (gone from list+search, toast shown).
- Found & fixed real mobile bug: main column lacked min-w-0 → 566px horizontal overflow on 390px viewport (flexbox min-width:auto vs non-shrinking nav buttons). Added min-w-0 to recall-app.tsx line 155; re-verified hOverflow:false, nav scrolls internally, desktop sidebar/footer unaffected.
- Footer sticky verified (rect.bottom ≤ viewport, pushed naturally when scrollable). Zero console/page errors; dev.log clean. bun run lint passes.
- Fresh overview screenshot saved to docs/screenshots/overview.png.

Stage Summary:
- All acceptance criteria demonstrated except live Groq (no API key in sandbox — 503/local-fallback paths verified instead; production frontend build blocked by sandbox rules; lint+tsc+browser-E2E used as substitute).
- Deliverables: README.md, .env.example, .gitignore, docs/screenshots/ — repo is viva-ready.

---
Task ID: 7
Agent: Antigravity
Task: Modular restructuring & Frontend/Backend code separation

Work Log:
- Separated root monolith into top-level `frontend/` (Next.js 16) and `backend/` (Spring Boot Java).
- Modularized `frontend/src`:
  - `features/` directory by business capability: `overview/`, `documents/`, `search/`, `assistant/`, `settings/` with explicit public barrel exports (`index.ts`).
  - `components/layout/` housing `recall-app.tsx` app shell.
  - `components/common/` housing `error-banner.tsx`.
  - `lib/api/` housing typed client `recall-api.ts`.
  - `lib/hooks/` housing health hook `use-recall-health.ts`.
  - `types/` housing `recall.ts` shared types.
  - Backwards-compatible re-exports retained in `components/recall/` and `lib/` to prevent regressions.
- Relocated Java Spring Boot service from `mini-services/recall-backend` to top-level `backend/`.
  - Updated `backend/run.sh` to seamlessly detect system Java/Maven or fall back to `$HOME/tools`.
  - Added `dev`, `build`, and `test` scripts to `backend/package.json`.
- Created root monorepo orchestration:
  - Root `package.json` with npm workspaces and scripts: `dev`, `dev:frontend`, `dev:backend`, `build:frontend`, `build:backend`, `lint`, and `typecheck`.
  - Added standalone `scripts/dev.js` runner to run both frontend and backend concurrently with color-coded prefix logging without extra dependencies.
- Updated `README.md` project tree, configuration instructions, and troubleshooting references.
- Verified: `npm run lint` (0 errors), `npm run typecheck` (0 errors), and `npm run build:frontend` (successful production build).

