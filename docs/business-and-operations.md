# WaveDesk — Business, Operations & Architecture Strategy

> **Author & Architect:** Sudipta Shaha (Programmer, Developer, Architect, Product Manager)  
> **Status:** Active Reference & Strategic Blueprint  
> **Target Market:** Broadcast Television, Digital Video Newsrooms, High-Velocity Content Studios  

---

## 1. Executive Summary & Market Problem

Broadcast newsrooms and modern digital media organizations (like *The Wave24*) produce dozens of stories daily across multiple channels, shows, and social platforms. Traditional newsrooms rely on either:
1. **Unwieldy Shared Spreadsheets (Excel/Google Sheets):** Prone to accidental overwrites, no real-time status transitions, lack of audit logs, zero permission control, and disconnected from the scriptwriting and editing workflows.
2. **Monolithic Legacy Systems (ENPS, iNews):** Extremely expensive ($50,000+ setup costs), clunky 1990s interfaces, difficult to configure, and poorly suited for digital-first video teams that publish across YouTube, Facebook, and broadcast simultaneously.

**WaveDesk solves this problem** by providing a lightning-fast, modern, Apple-style dark UI rundown system with granular role-based permissions, built-in scriptwriting & teleprompting, and automated workflow tracking—at a fraction of the operational cost.

---

## 2. Customer Tiers & Deployment Models

To serve both growing digital newsrooms and established enterprise TV networks, WaveDesk supports two complementary operational models:

### Model A: Cloud Multi-Tenant SaaS (Initial Launch & SME Newsrooms)
* **Hosting:** Vercel (Frontend Next.js) + Managed Supabase (PostgreSQL, Auth, Realtime Replication).
* **Target:** Digital newsrooms, YouTube studios, independent investigative networks (5 to 50 journalists).
* **Advantages:** Instant onboarding, zero customer IT overhead, automated backups, 99.9% availability.
* **Tenant Isolation:** Enforced via `organization_id` on all tables, backed by PostgreSQL Row-Level Security (RLS). A user from Organization A cannot view or manipulate data from Organization B, even if querying the exact same database.

### Model B: On-Premises Self-Hosted Enterprise (Large TV Stations)
* **Hosting:** Dedicated Linux Server (Ubuntu/Debian) on the client's local office network (LAN) with a static IP and optional reverse proxy (Cloudflare/Nginx) for external reporting.
* **Target:** Television networks, broadcast operations, and confidential newsrooms with high data compliance requirements.
* **Components:** Dockerized WaveDesk Web App + Dockerized self-hosted Supabase / PostgreSQL.
* **Key Benefit:** Complete data sovereignty, ultra-fast LAN latency (<5ms), and zero cloud subscription dependency.

---

## 3. Intellectual Property (IP) Protection & Commercial Security

A paramount concern in enterprise software is safeguarding the source code and preventing unauthorized replication by client IT teams or third parties.

### Golden Rules of Distribution:
1. **Never Distribute Raw Source Code:**
   - Under no circumstances will raw JavaScript/Python source code be handed over to a client’s IT staff or placed on an unmonitored office computer.
   - For on-premise deployments, delivery will be executed solely via **pre-compiled, minified, production-grade Docker container images** pulled from a private registry (e.g., GitHub Packages / Docker Hub private repo).
2. **Backend-Enforced Security:**
   - Client-side code (HTML/CSS/JS) is inherently public to any browser. Therefore, proprietary business logic, workflow gatekeeping, and authorization rules are enforced strictly inside the database (`guard_contents_update` triggers and RLS policies) and API layer. A scraped frontend is merely an empty shell with zero access to data or workflows.
3. **Legal & Licensing Agreements:**
   - Enterprise deployments must be accompanied by an **End-User License Agreement (EULA) / Software-as-a-Service Agreement** specifying:
     - All intellectual property, trademarks, and copyright remain exclusively with **Sudipta Shaha**.
     - The client receives a non-exclusive, non-transferable license to *run* the software, with strict clauses prohibiting reverse engineering, decompilation, or sublicensing.
4. **Environment Security:**
   - Database credentials, encryption salts, and service role keys are managed exclusively through server-side environment variables (`.env`), never embedded in code.

---

## 4. The "1 TB / Day" Storage Economics: 3-Tier Media Architecture

Many media SaaS startups fail because they attempt to store raw 4K camera footage in cloud storage (AWS S3, Google Cloud Storage, Supabase Storage), resulting in astronomical monthly bandwidth and egress bills.

A single video newsroom produces **500 GB to 1.5 TB of raw video files every single day**. Storing this in the cloud is economically unfeasible.

### The WaveDesk 3-Tier Storage Solution:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: DATABASE (POSTGRESQL)                   │
│  • Content metadata, slugs, 12 pipeline states, timestamps             │
│  • Full script texts, edit histories, activity audit logs              │
│  • Footprint: A few megabytes per month (Virtually ZERO cost)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    TIER 2: CLOUD ASSET STORAGE (SUPABASE)              │
│  • User profile avatars (< 1 MB)                                       │
│  • Reference PDFs, briefs, fact-check attachments (< 10 MB)            │
│  • Footprint: Under 1-2 GB total. Easily fits in free/low-tier plans.  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              TIER 3: LOCAL HIGH-CAPACITY NETWORK STORAGE (NAS)         │
│  • All raw Sony/Canon/RED camera card dumps (100–500 GB/project)       │
│  • Premiere Pro / DaVinci Resolve project files & cache                │
│  • Final 4K/1080p broadcast master export files                        │
│  • Location: Office Local Area Network (10GbE / 1GbE NAS or SAN)       │
│  • WaveDesk Role: Stores local UNC path / file pointer in Drawer:      │
│    e.g., `smb://wave-nas/footage/2026-10-11/budget-rundown/`           │
│    Tracks status flags: [Footage Ingested ✓] [Ready for Edit ✓]        │
│  • Cloud Cost: $0.00. High-speed multi-editor LAN access preserved.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Management & Plan Tiering

WaveDesk uses a modular feature-flagging pattern in [`utils/features.js`](utils/features.js). This allows instant activation or gating of features per customer plan without code changes:

| Feature Key | Feature Name | Basic Plan | Pro Plan | Enterprise Plan |
|---|---|:---:|:---:|:---:|
| `script_drafts` | Browser Local Auto-Drafts | ✅ | ✅ | ✅ |
| `teleprompter` | Teleprompter ("Script Play") | ✅ | ✅ | ✅ |
| `notif_sound` | Real-time Soft Notification Chimes | ✅ | ✅ | ✅ |
| `rich_editor` | Tiptap Rich Script Editor | ✅ | ✅ | ✅ |
| `bulk_schedule` | Bulk Rundown Scheduling | ❌ | ✅ | ✅ |
| `reports` | KPI & Staff Work Reports | ❌ | ✅ | ✅ |
| `backup` | Full JSON Database Backup | ❌ | ✅ | ✅ |
| `notices` | Global Station Notice Board | ❌ | ❌ | ✅ |
| `show_forms` | Multi-Season Show & Episode Forms | ❌ | ❌ | ✅ |
| `platform_tracking` | Social Video Platform Distribution | ❌ | ❌ | ✅ |
| `revenue` | Channel & Content Monetization Analytics | ❌ | ❌ | ✅ |
| `themes` | Custom Workplace Color Themes | ❌ | ❌ | ✅ |

---

## 6. Maintenance & Disaster Recovery Runbook

1. **Daily Database Dumps (`pg_dump`):**
   - Automatically scheduled cron job running `pg_dump` from the office PC/NAS to pull full schema and data snapshots.
   - Rotated with 30-day retention.
2. **On-Demand JSON Backup:**
   - Available directly inside the app for Station Managers via `Menu ➔ Database Backup`.
   - Generates deterministic, ID-ordered JSON export across all 5 tables (`organizations`, `team_members`, `channels`, `contents`, `notifications`).
3. **Rollback Strategy:**
   - Any database schema migration is written in `sql/YYYY-MM-DD_<name>.sql` accompanied by a verified rollback block.
   - Vercel/Docker deployments maintain immutable tagged versions, enabling instant 1-click rollback to any previous release.
