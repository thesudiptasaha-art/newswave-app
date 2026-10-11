# WaveDesk — Python & Django Architecture Transition Blueprint

> **Author & Architect:** Sudipta Shaha  
> **Status:** Strategic Roadmap & Educational Guide  
> **Target:** Future Enterprise SaaS Migration to Python + Django  

---

## 1. Why Python + Django for WaveDesk's Long-Term Future?

WaveDesk is currently built on **Next.js 16 + Supabase (PostgreSQL)**, which provided rapid iteration and instant real-time synchronization. As the platform matures into an enterprise B2B SaaS serving large broadcast media corporations, migrating the backend to **Python + Django** provides massive strategic advantages:

| Feature / Aspect | Next.js + Serverless Supabase (Current) | Python + Django (Future Enterprise Target) |
|---|---|---|
| **Core Ecosystem** | Node.js / JavaScript | Python (World standard for data engineering, AI, broadcast automation) |
| **Database ORM & Migrations** | Raw SQL scripts in Supabase Editor | **Django ORM** — Automated, versioned, reversible database migrations (`python manage.py migrate`) |
| **Admin Back-Office** | Custom-built UI or raw Supabase dashboard | **Django Admin** — Built-in, battle-tested, secure administrative portal with search, filters, and audit trails |
| **Security & Hardening** | Client RLS & trigger functions | Built-in protection against CSRF, SQL Injection, XSS, Clickjacking, and Session Hijacking |
| **Background Processing** | Serverless functions (timeout limits) | **Celery + Redis** — Heavy background jobs (KPI exports, database dumps, email digests, transcoding) |
| **Real-time WebSockets** | Supabase managed realtime | **Django Channels + Redis** — Full control over WebSocket rooms, presence, and broadcasts |
| **Multi-Tenancy** | Row-level `organization_id` filter | Native support for multi-tenant architectures (`django-tenants` schema isolation or shared-db tenant managers) |
| **Self-Hosting Cost** | Tied to Supabase serverless stack | **100% Free & Open Source (FOSS)** — Runs on any standard Dockerized Linux VPS or office server with zero licensing costs |

---

## 2. Choosing the Best Architecture for the Django Phase

When transitioning to Django, there are two primary architectural paths. Here is the objective comparison:

### Architecture Option A: Decoupled Headless (Recommended)
* **Backend:** Python + Django (providing REST/JSON APIs via **Django Ninja** or **Django REST Framework**).
* **Frontend:** Next.js (the current WaveDesk React application).
* **Real-time:** WebSockets via Django Channels.
* **Why this is the Winner for WaveDesk:**
  - **Zero UI Waste:** 100% of the UI work already completed (Tiptap rich text editor, Teleprompter, dark theme, smooth drawer, staff assignment dropdowns) remains completely intact.
  - **Best of Both Worlds:** Python’s unmatched enterprise backend reliability + React’s silky-smooth client-side user experience.

### Architecture Option B: Pure Django Monolith (HTML + HTMX)
* **Backend & Frontend:** Django Templates + HTMX / Alpine.js (rendered on the server).
* **Pros:** Single codebase in Python; no Node.js runtime needed.
* **Cons:** Rich client-side features like the **Tiptap rich text editor**, **instant Teleprompter requestAnimationFrame rendering**, and **browser Web Audio API synthesis** become much harder to manage cleanly without a JavaScript component layer.

---

## 3. The 1:1 Mapping: Current Next.js/Supabase ➔ Future Django

WaveDesk was intentionally developed following the **"Django-Ready" rule set** in [`docs/RULES.md`](file:///c:/Users/PlayOut/Desktop/Urmi/newswave-app/docs/RULES.md). Because business logic was decoupled from React, the translation into Python is straightforward:

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│ CURRENT NEXT.JS / SUPABASE      │  ───►  │ FUTURE PYTHON / DJANGO           │
├─────────────────────────────────┤        ├──────────────────────────────────┤
│ Supabase Postgres Tables        │        │ Django Models (models.Model)     │
│ lib/core.js (pure functions)    │        │ apps/rundown/services.py         │
│ services/supabaseService.js     │        │ apps/rundown/selectors.py        │
│ guard_contents_update (trigger) │        │ Model.clean() / Django Signals   │
│ Supabase Realtime Channels      │        │ Django Channels (consumers.py)   │
│ utils/scriptDuration.js         │        │ apps/scripts/utils.py            │
│ utils/constants.js              │        │ settings/constants.py            │
│ utils/features.js               │        │ TenantPlan / FeatureFlag models  │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

### Concrete Code Translation Examples

#### 1. Models & Database Fields:
In Supabase/SQL:
```sql
create table contents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  slug_name varchar(24) not null,
  status varchar(30) default 'Draft',
  script text default '',
  created_at timestamptz default now()
);
```
In Django (`models.py`):
```python
import uuid
from django.db import models

class Content(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, related_name='contents')
    slug_name = models.CharField(max_length=24)
    status = models.CharField(max_length=30, default='Draft')
    script = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contents'
        ordering = ['-created_at']
```

#### 2. Business Logic (`lib/core.js` ➔ `services.py`):
In `lib/core.js`:
```javascript
export function scriptStats(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 130) * 60);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return { words, seconds, label: `${m}:${s}` };
}
```
In Python (`utils/script_math.py`):
```python
import math

def calculate_script_stats(text: str) -> dict:
    words = len(text.strip().split()) if text else 0
    seconds = round((words / 130) * 60)
    m = seconds // 60
    s = f"{seconds % 60:02d}"
    return {"words": words, "seconds": seconds, "label": f"{m}:{s}"}
```

---

## 4. Modern High-Speed Django APIs: Django Ninja

For the API layer, rather than the older Django REST Framework (DRF), we recommend **Django Ninja**:
- Inspired by FastAPI (type hints, automatic Swagger / OpenAPI documentation, Pydantic schemas).
- Integrates seamlessly with Django ORM, authentication, and permissions.
- Up to 2x–3x faster execution than DRF with drastically cleaner code.

Example endpoint in Django Ninja:
```python
from ninja import NinjaAPI, Schema
from typing import List
import uuid

api = NinjaAPI(title="WaveDesk Core API", version="1.0.0")

class ContentOut(Schema):
    id: uuid.UUID
    slug_name: str
    status: str
    scheduled_publish_time: str | None

@api.get("/contents", response=List[ContentOut])
def list_contents(request):
    # Tenant-scoped query
    org_id = request.user.active_organization_id
    return Content.objects.filter(organization_id=org_id)
```

---

## 5. Background Tasks & Real-Time Sync

### Background Processing: Celery + Redis
- **Nightly Backups:** Every night at 02:00 AM, Celery runs a task calling `pg_dump` and stores compressed archives locally and off-site.
- **KPI Generation:** Pre-aggregates daily rundown statistics, employee metrics, and channel totals so analytics load in 5 milliseconds.

### Real-Time Live Rundown: Django Channels
- When a producer changes a story's status or assigns talent, a Django signal triggers a WebSocket broadcast via Redis.
- All connected newsroom screens immediately update their rundown rows without page refresh.

---

## 6. Phased Migration Roadmap (Zero Downtime)

1. **Phase 1 (Current):** Continue building features on Next.js + Supabase. Keep strictly adhering to `docs/RULES.md` (isolated pure functions).
2. **Phase 2 (Django Core API):** Create the Django backend container. Run `inspectdb` against the Supabase PostgreSQL database to auto-generate exact Django models.
3. **Phase 3 (Parallel Verification):** Mirror writes and run automated test suites comparing Next.js API outputs with Django Ninja API outputs.
4. **Phase 4 (Full Switchover):** Point the Next.js frontend to the Django API. Deploy as a unified Docker Compose stack on the office enterprise server.
