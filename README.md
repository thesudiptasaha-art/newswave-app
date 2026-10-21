# WaveDesk

> **Next-Generation Broadcast Newsroom Rundown & Content Operations System**  
> *Architect, Developer, Product Manager: Sudipta Shaha*

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 📌 Overview

**WaveDesk** (formerly *NewsroomOps* / *NewsWave*) is a production-grade, enterprise daily rundown and workflow automation system built specifically for modern television and digital video newsrooms (including **The Wave24** and multi-channel media organizations). 

It manages the entire lifecycle of broadcast and digital video content across a **12-status editorial pipeline**—from story pitching, research & scripting, camera shooting, and video editing to executive approval, live broadcast, and social distribution.

---

## 🚀 Core Capabilities

- **12-Stage Editorial Pipeline:** `Idea Pitch` ➔ `Assigned` ➔ `Research & Scripting` ➔ `Script Review` ➔ `Script Approved` ➔ `Ready for Shoot` ➔ `Shooting` ➔ `Shoot Done` ➔ `Video Editing` ➔ `Ready for Review` ➔ `Approved & Ready` ➔ `Broadcast / Published`.
- **Dynamic Content Types:** Explainer, Live, Recorded Live, SOT (Sound on Tape), Package, and Show.
- **Granular Role-Based Access Control (RBAC):** Owner, Manager, and General roles with fine-grained capability ticks (8 access permissions such as `can_write_edit_scripts`, `can_approve_scripts` and `can_review_videos`, plus 16 `role_...` ticks that decide who appears in each credit list).
- **Live Rundown & Parking Zone:**
  - **Rundown:** Shows all complete stories (Channel + Slug + Scheduled Time) sorted by broadcast schedule.
  - **Parking Zone:** Organizes unscheduled, incomplete, or on-hold content with smart missing-field indicators.
  - **Bin:** Archived and dropped incomplete items with instant restore capability.
- **Built-in Newsroom Productivity Suite:**
  - **Teleprompter ("Script Play"):** High-contrast, distraction-free prompter with variable speed, font-scaling, mirror mode, screen wake-lock, and keyboard navigation.
  - **Tiptap Rich Script Editor:** Clean, sanitized formatting (Bold, Underline, Highlight) with automatic plain-text fallbacks for broadcast automation and duration calculation.
  - **Automatic Browser Drafts:** Resilient multi-tier local storage drafts that protect scripts against sudden disconnections or accidental tab closes.
  - **Script Airtime Calculator:** Real-time duration forecasting based on standard broadcast pacing (130 words per minute).
  - **Soft Notification Chimes:** Web Audio API sound synthesis without external audio files.
  - **Direct Staff Assignment:** Quick talent, writer, and editor assignment directly from rundown table rows.

---

## 🏗️ Architecture & Philosophy

WaveDesk is engineered around four core tenets:

1. **100% Free & Open Source (FOSS) Foundations:** Zero reliance on proprietary or expensive paid third-party SaaS services. Standard, battle-tested open-source libraries only.
2. **True Backend Security:** Security is never purely client-side. The UI merely reflects permissions; actual authorization is strictly enforced at the database level via Postgres **Row-Level Security (RLS)** and stored procedure triggers (`guard_contents_update`).
3. **Django-Ready Decoupling:** Business rules, slug validation, permission checks, and duration calculations are strictly isolated as plain, React-free JavaScript functions in `lib/` and `utils/`. This allows a seamless, direct 1:1 migration to **Python + Django** in the next phase.
4. **Pragmatic Media Economics:** Heavy raw camera footage (often 500GB–1TB+ daily) stays on fast local office NAS storage, tracked by path in WaveDesk. The cloud database handles only text, metadata, and status events, ensuring zero cloud bandwidth or storage egress costs.

---

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js 16.4.0 (Turbopack) & React 19
- **Styling:** Tailwind CSS (Dark theme with custom color tokens)
- **Database & Auth:** Supabase (PostgreSQL 15+, Row-Level Security, Database Triggers, Realtime Replication)
- **Script Engine:** Tiptap 3.x (MIT license, sanitized HTML subset)
- **Export & Reporting:** `xlsx-js-style` (Zero vulnerability audit, formatted Excel workbooks)
- **Future Backend (Roadmap):** Python + Django (Django REST Framework / Ninja + Celery + Django Channels + Docker)

---

## 💻 Quick Start (Any Operating System)

### Prerequisites
- Node.js `20.x` or `22.x` (LTS recommended)
- Git

### 1. Clone & Install
```bash
git clone https://github.com/thesudiptasaha/WaveDesk.git
cd WaveDesk
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Production Verification
```bash
npm run build
```

---

## 📚 Master Documentation Index

All in-depth architectural blueprints, business strategies, database schemas, and developer learning guides are maintained in the [`docs/`](docs) folder:

| Document | Purpose |
|---|---|
| 📜 [**RULES.md**](docs/RULES.md) | **Strict Development Rules** for any developer or AI agent (Scope bounds, safety checks). |
| 📘 [**blueprint-en.md**](docs/blueprint-en.md) | **Master Technical & Product Blueprint (English)** — Component architecture, state flow, security models. |
| 📕 [**blueprint-bn.md**](docs/blueprint-bn.md) | **Master Product Blueprint (Bangla)** — Complete feature roadmap, Django vision, editorial pipeline. |
| 💼 [**business-and-operations.md**](docs/business-and-operations.md) | **Business & Operations Guide** — Multi-tenancy, IP protection, Docker distribution, NAS storage economics. |
| 🐍 [**architecture-django-transition.md**](docs/architecture-django-transition.md) | **Python + Django Migration Blueprint** — 1:1 mapping from Next.js/Supabase to Django models, Ninja/DRF & Celery. |
| 🎓 [**developer-guide-learning.md**](docs/developer-guide-learning.md) | **Developer & Architecture Learning Guide** — Learn professional software architecture using WaveDesk. |
| 📋 [**open-tasks.md**](docs/open-tasks.md) | **Active Task Tracker** — Upcoming database tasks (N12, N14, N10), theme switcher, storage fixes. |
| 📈 [**progress-log.md**](docs/progress-log.md) | **Complete Progress Log** — Chronological audit of all commits, lessons learned, and verified fixes. |
| 🗄️ [**schema-reference.md**](docs/schema-reference.md) | **Database Schema Reference** — Tables, columns, triggers, indexes, and RLS policies. |
| 💾 [**file-management-plan.md**](docs/file-management-plan.md) | **File & Storage Strategy** — 3-tier storage architecture, local NAS, and self-hosted server migration. |

---

## 🔒 Security & Privacy Notice

- **Database Policies:** All Supabase tables have Row-Level Security (RLS) enabled. Only authenticated members of an organization can read and write within their tenant.
- **Workflow Integrity:** Content status transitions are safeguarded by database-level constraints preventing unauthorized state bypassing.
- **IP Protection:** WaveDesk source code is proprietary. On-premise enterprise deployments are distributed as signed Docker container images without raw source code access.

---

## 👤 Author & Credits

**Sudipta Shaha**  
*Programmer, Developer, Architect, Product Manager*  
WaveDesk Project — Built for high-velocity, reliable broadcast journalism.
