# WaveDesk — Developer & Architecture Learning Guide

> **Dedicated to:** Sudipta Shaha (Programmer, Developer, Architect, Product Manager)  
> **Philosophy:** Learn professional, enterprise-grade software engineering through building a real-world broadcast system.  

---

## 🌟 Introduction: Building Software Like a Professional Architect

Writing code that works is only the first 20% of programming. The remaining 80%—which separates hobbyist coders from senior software engineers and architects—is **structure, predictability, security, maintainability, and user experience**.

Every pattern in **WaveDesk** was chosen intentionally. By understanding *why* each part is built the way it is, you will master the foundational principles of modern software architecture that apply to JavaScript, Python, Django, Go, and beyond.

---

## 🏛️ Concept 1: Separation of Concerns (SoC)

### The Mistake Beginners Make:
Beginners often put everything into one giant file: HTML markup, styles, database queries, mathematical calculations, and permission checks all mixed together inside a button's `onClick` handler. This leads to **"spaghetti code"**—if you want to change the database, you break the UI; if you want to redesign the UI, you break the calculations.

### The Professional Architecture in WaveDesk:
WaveDesk divides the application into clean, independent layers:

```
┌────────────────────────────────────────────────────────┐
│  1. PRESENTATION LAYER (components/ui/ & app/page.js)  │
│  • Only renders HTML/Tailwind. Listens for user clicks.│
│  • Knows NOTHING about how data is saved to Postgres.  │
└───────────────────────────┬────────────────────────────┘
                            │ Calls pure functions
┌───────────────────────────▼────────────────────────────┐
│  2. DOMAIN & BUSINESS LOGIC LAYER (lib/core.js, utils/)│
│  • PURE FUNCTIONS ONLY. No React, no HTML, no database.│
│  • e.g., isComplete(), scriptStats(), SLUG_MAX         │
│  • Can be copied directly into Python with zero changes│
└───────────────────────────┬────────────────────────────┘
                            │ Calls data layer
┌───────────────────────────▼────────────────────────────┐
│  3. DATA ACCESS LAYER (services/, Supabase, SQL)       │
│  • Pure data fetchers & mutators.                      │
│  • Handles network errors, pagination, and queries.    │
└────────────────────────────────────────────────────────┘
```

> **Why this matters for your Python/Django future:**  
> When you migrate to Django, you will throw away zero business logic. You will take the pure functions from `lib/core.js` and paste them directly into Django services, because they were never polluted with React code!

---

## ⚙️ Concept 2: Pure Functions vs. Side Effects

### What is a "Pure Function"?
A pure function is a mathematical function:
1. Given the exact same input, it **always** returns the exact same output.
2. It produces **no side effects** (it doesn't modify external variables, doesn't touch the screen, doesn't write to disk, doesn't make network calls).

### Example from WaveDesk (`utils/scriptDuration.js`):
```javascript
export function scriptStats(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 130) * 60);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return { words, seconds, label: `${m}:${s}` };
}
```
**Why Pure Functions are Superpowers:**
- They never crash unexpectedly because they don't depend on global state.
- They are trivially easy to test.
- They can run on the browser, on a Node.js server, in Python, or inside a mobile app without changing a single line.

---

## 🛡️ Concept 3: True Database Security vs. Fake UI Security

### The Dangerous Beginner Trap:
A common misconception is thinking: *"I hid the 'Delete Story' button for general users in React, so my app is secure!"*

**Truth:** Any user can open their browser's Developer Tools (F12 ➔ Console) and run:
```javascript
supabase.from('contents').delete().eq('id', 'some-id')
```
If you only hid the button in the UI, the browser will execute that delete command and wipe out the story!

### How Professional Security Works in WaveDesk:
1. **The UI is only an advisory layer:** It hides buttons merely to provide a clean, polite user interface.
2. **Postgres Row-Level Security (RLS) is the actual gatekeeper:** Every query sent to Supabase is intercepted by the database engine. If a user is not an Admin/Manager, Postgres rejects the query with an `HTTP 403 Forbidden` error—even if they used the browser console!
3. **Database Triggers (`guard_contents_update`):** If a general user attempts to alter locked metadata or approve their own story, the database trigger function aborts the transaction before any data is written.

---

## ⚡ Concept 4: Optimistic UI & Reversible Mutations

In a professional newsroom, journalists cannot wait 500 milliseconds for a network roundtrip every time they assign a reporter or update a slug.

### What WaveDesk Does (Optimistic UI):
1. **Immediate Feedback:** When a producer selects a presenter from the dropdown, WaveDesk updates the local React state in **0 milliseconds**. The UI changes instantly.
2. **Background Sync:** In the background, `patchRow()` sends the update to Supabase.
3. **Graceful Rollback:** If the network drops or the database rejects the change, WaveDesk catches the error in `try...catch`, reverts the UI back to the old value, and displays a red error toast notification.

---

## 📡 Concept 5: Real-time Event-Driven Collaboration

Traditional websites require users to refresh the page (F5) to see changes made by teammates.

### How WaveDesk Works (WebSockets & Postgres CDC):
1. User A in Studio 1 edits a script or marks a story as `Shooting`.
2. Postgres writes the change to its Write-Ahead Log (WAL).
3. Supabase Realtime detects the change and pushes a lightweight WebSocket packet to all connected browsers in the newsroom.
4. User B's screen in the Control Room immediately updates without a page reload.
5. In addition, `utils/notifySound.js` synthesizes a soft three-note chime (`playChime`) using the browser's native **Web Audio API**, notifying the assigned reporter instantly!

---

## 📈 Concept 6: Pagination & The 1,000-Row Ceiling

### The Problem:
To protect server memory, PostgreSQL and Supabase enforce a hard safety cap: **any single query returns at most 1,000 rows**. If a newsroom has 3,500 stories over six months, a naive query will quietly drop 2,500 stories!

### The WaveDesk Solution (`utils/fetchAll.js`):
We wrote `fetchAllPages()`, which queries in deterministic chunks:
- Page 1: Rows 0 to 999 (sorted strictly by `id`)
- Page 2: Rows 1,000 to 1,999
- Page 3: Rows 2,000 to 2,999...
- Merges all chunks safely and passes them to the application.
Because we explicitly sort by `.order('id')`, no row is ever skipped or duplicated between pages.

---

## 📖 Glossary of Terms Every Architect Must Know

| Term | Simple Definition | How WaveDesk Uses It |
|---|---|---|
| **UUID** | Universally Unique Identifier (128-bit number like `c70da53...`) that is globally unique without a central authority. | Primary keys for organizations and team members. |
| **RLS** | Row-Level Security — database-level firewall restricting row visibility per user. | Isolates tenant data between different media channels. |
| **Debounce** | Delaying execution until a user stops typing for $N$ milliseconds. | Auto-drafting scripts 1.5 seconds after the user stops typing to avoid burning CPU cycles. |
| **Idempotence** | An operation that produces the same result no matter how many times you run it. | Database backup restore scripts and schema migrations. |
| **Race Condition** | A bug where the outcome depends on which of two asynchronous network events finishes first. | Prevented in the drawer with `pendingRef` tracking in-flight save requests. |
| **Turbopack** | Next.js's ultra-fast Rust-based bundler (replaces Webpack). | Powers WaveDesk's 150ms incremental production builds. |
