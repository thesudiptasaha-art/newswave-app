# WaveDesk → Python/Django: এখন থেকে যে নিয়মে কাজ হবে
 
ব্যবহারকারীর সিদ্ধান্ত (৭ অক্টোবর): পুরো প্রজেক্ট পরে **Python + Django**-তে হবে। তাই এখনকার প্রতিটা কাজ এমনভাবে করতে হবে যাতে পরে সহজে সরানো যায়। এই নিয়মগুলো `antigravity-tasks.md`-র সব প্রম্পটে "নতুন কোডের জন্য" যোগ হবে। **বিদ্যমান কোড সরানো/গোছানো এখন নয়** (scope-guard বজায়), শুধু নতুন কোড এই নিয়মে।
 
## নিয়ম (নতুন কোডের জন্য)
1. **ডেটাবেস: Postgres-ই থাকবে।** Django Postgres-এ চলে, তাই Supabase-এর ডেটাবেসই পরে Django-র ডেটাবেস হতে পারে। নতুন টেবিল সাধারণ SQL-এ: `snake_case` নাম, `id uuid` প্রাইমারি কী, `created_at`/`updated_at`, **প্রতিটা টেবিলে `organization_id`** (multi-tenant)।
2. **প্রতিটা DB বদল রিপোতে `sql/` ফোল্ডারে ফাইল হয়ে থাকবে** (যেমন `sql/2026-10-07_notices.sql`), শুধু ব্যবহারকারীকে দেখালে চলবে না। এগুলো থেকে পরে Django মডেল/মাইগ্রেশন বানানো হবে। (রিপোতে এখন কোনো SQL ফাইল নেই; ব্যবহারকারীর পুরনো SQL আমার কাছে আছে।)
3. **ব্যবসার নিয়ম আলাদা ও React-মুক্ত:** স্লাগ তৈরি, সময়-হিসাব, স্ট্যাটাস/পারমিশন নিয়ম সাধারণ ফাংশন হিসেবে `lib/` বা `utils/`-এ (React/DOM ছাড়া)। Python-এ প্রায় লাইন-ধরে অনুবাদ করা যাবে। প্রতিটা নতুন নিয়ম-ফাংশনের ওপরে ইনপুট→আউটপুটের ২–৩টা উদাহরণ মন্তব্যে (যেমন `Dance Champ, 1, 3 → "Dance Champ S01E03"`), পরে Python-এ মিলিয়ে দেখার জন্য।
4. **Supabase-নির্ভরতা এক জায়গায়:** নতুন Supabase কল (select/insert/realtime) `services/` ফাইলে, UI কম্পোনেন্টের ভেতরে ছড়ানো নয়। Django-তে এই ফাইলগুলোই API কলে বদলাবে। RLS পলিসি ছোট ও ফাইলে নথিবদ্ধ (Django-তে এগুলো permission কোড হবে)।
5. **শুধু-ব্রাউজারের ফিচার** (টেলিপ্রম্পটার, সাউন্ড, থিম, লোকাল ড্রাফট) আলাদা প্লেইন JS মডিউলে, পাতলা React মোড়ক সহ। Django টেমপ্লেটে এই JS প্রায় হুবহু চলবে।
6. **ডেটা কাঠামো পরিষ্কার:** `shorts` ইত্যাদি JSON-এ গুঁজে রাখার বদলে নতুন জিনিস (প্ল্যাটফর্ম অবস্থা, আয়) আলাদা টেবিলে (`publications`, `revenues`); Django মডেলে সহজ। বিদ্যমান JSON কলাম (shorts, audit_log) Django-তে JSONField।
7. **আইডি:** সব জায়গায় UUID + পড়ার মতো কোড (CH-001, SHW-001); নাম ধরে সম্পর্ক নয়।
8. **ফিচার কী (feature key):** প্রতিটা বড় ফিচারের একটা নাম থাকবে যাতে পরে প্ল্যান/ক্রেতা অনুযায়ী চালু-বন্ধ করা যায় (SaaS): `notices`, `revenue`, `platform_tracking`, `show_forms`, `teleprompter`, `notif_sound`, `script_drafts`, `themes`, `graphic_design`, `bulk_schedule`, `reports`, `backup`। নতুন কাজে ফিচারটা এক জায়গায় (`utils/features.js`) এমনভাবে নথিবদ্ধ হবে যে এখন সবাই চালু, কিন্তু একটা ফ্ল্যাগ বন্ধ করলে ফিচার লুকায়।
9. **লেবেল/নাম এক জায়গায়:** WaveDesk নাম, ক্রেডিট, ফিক্সড সংখ্যা (স্লাগ ২৪, ১৩০ শব্দ/মিনিট, Show ১৭ অক্ষর) `utils/constants.js`-এ, ছড়ানো নয়।
10. **নতুন প্যাকেজ নয়** (আগের নিয়ম) — Django-তে সরানো সহজ রাখে।
## প্রম্পটে যে অতিরিক্ত অনুচ্ছেদ বসবে
```
DJANGO-READY RULES (apply to NEW code only; do not refactor existing code):
- Put pure business logic (slug generation, duration math, status/permission rules) in lib/ or utils/ as plain functions with no React/DOM, each with 2-3 input->output examples in a comment.
- Put any new Supabase calls in services/, not inside UI components.
- Browser-only features (sound, teleprompter, themes, local drafts) go in their own plain JS module with a thin React wrapper.
- If the task needs database changes: write them as plain Postgres SQL in a new file sql/YYYY-MM-DD_<name>.sql (snake_case, uuid primary key, created_at/updated_at, organization_id on every table, RLS policies included and commented). Do NOT run it; tell me it must be run in Supabase.
- Put fixed numbers and labels (app name, slug max 24, 130 words/min, show name max 17) in utils/constants.js.
- Register the feature in utils/features.js with its feature key (all enabled for now).
```
 
## পোর্টেবিলিটি তালিকা (কাজ-ভিত্তিক)
| কাজ | Django-তে যাওয়া | মন্তব্য |
|---|---|---|
| N1–N6, N16 | সহজ (শুধু UI) | টেমপ্লেটে নতুন করে |
| N18 সাউন্ড, N20 টেলিপ্রম্পটার, N13 থিম | প্রায় হুবহু JS/CSS | আলাদা মডিউল |
| N19 কাউন্টার, N10 স্লাগ নিয়ম | Python-এ অনুবাদ সহজ | pure ফাংশন + উদাহরণ |
| N21 ড্রাফট স্তর ১ | JS হুবহু; স্তর ২ Django মডেল | `script_drafts` |
| N12 নোটিশ, N14 আইডি, N10 shows, N15, N17, N11 | টেবিল → Django মডেল | `sql/` ফাইল দেখে |
| N7, N8, N9 | UI + বিদ্যমান API কল | `services/`-এ রাখা |
 
## মাথায় রাখার বিষয় (পরে)
- **বর্তমান বড় দুর্বলতা:** স্ট্যাটাস নিয়ম দুই জায়গায় (`getActions` JS + ডেটাবেস trigger `guard_contents_update`)। Django-তে এক জায়গায় (সার্ভিস লেয়ার) আনতে হবে; সেটা পুনর্লিখনের সময়।
- **Supabase Auth → Django Auth:** ইউজার/পাসওয়ার্ড স্থানান্তর আলাদা পরিকল্পনা লাগবে (পাসওয়ার্ড হ্যাশ সরানো যায় কিনা যাচাই)।
- **Realtime নোটিফিকেশন:** Django-তে Channels/WebSocket বা polling; এখনকার `NotificationBell` Realtime ব্যবহার করে।
- **Storage (avatars/ফাইল):** Supabase Storage → Django-তে S3/ডিস্ক।
- **blueprint-নোটস** (`blueprint-notes.md`, `blueprint-notes-auth.md`) এ Django মডেল পরিকল্পনা আছে (Organization, Membership, Invitation, Publications, FeatureFlag/Plan)। এই নিয়মগুলো সেটার সাথে মেলে।
