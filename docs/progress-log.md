# WaveDesk — অগ্রগতির লগ (৭–১১ অক্টোবর ২০২৬)

Master documents live in docs/ in this repo. The Claude Project holds only a pointer.

মূল ডকুমেন্টসমূহ: `docs/RULES.md` · `docs/blueprint-en.md` · `docs/blueprint-bn.md` · `docs/business-and-operations.md` · `docs/architecture-django-transition.md` · `docs/developer-guide-learning.md` · `docs/open-tasks.md` · `docs/progress-log.md` (ঐতিহাসিক পরিকল্পনার খসড়া: antigravity-tasks, schema-snapshot, file-management-plan)
প্রতিটা কমিট আমি GitHub থেকে নিয়ে যাচাই করেছি (undefined-name চেক ০ এরর + `npm run build` সফল)।

## GitHub-এ শেষ (main, পুরনো → নতুন)
| কমিট | কাজ |
|---|---|
| e892033 | missing imports ফিক্স (refactor-পরবর্তী ক্র্যাশ) |
| 24b0ea2 | F0: docs/RULES.md, check-undefined eslint কনফিগ, utils/features.js, sql/README.md, constants (APP_NAME, APP_CREDIT, SCRIPT_WORDS_PER_MINUTE) |
| d0e4624 | N3: Start Shoot এখন `camera_person` দেখে; সব জায়গায় "Cameraman" |
| 1a01308 | N2: SLUG_MAX = 24 (নতুন কনটেন্ট + বাল্ক এন্ট্রি) |
| d5d170b | N1: WaveDesk নাম (ট্যাব title = শুধু "WaveDesk", হেডার, লগইন কার্ড, ফাইলের নাম) + ক্রেডিট লাইন (লগইন + ফুটার) |
| a68b56c | N4 + N4b + N4c + N5b: টেবিলে স্লাগ এডিট বন্ধ, ড্রয়ারে "Slug name" ঘর; BlurInput-এ maxLength; টেবিলে Download ZIP বাদ |
| f92e29d | N6: পার্কিং জোন — সময়ওয়ালারা আগে (ছোট→বড়), সময়হীনরা পরে (নতুন তৈরি আগে) |
| af10df2 | N22: পার্কিং জোন সব তারিখে সব parked কনটেন্ট দেখায় |
| 02f73fa | N16: পাবলিশড লিংক খোলা (`safeHttpUrl`, শুধু http/https) |
| 77f9211 | N19: স্ক্রিপ্টের সময় m:ss (১৩০ শব্দ/মিনিট), `utils/scriptDuration.js` |
| d6c6418 | N21 + N21b: স্ক্রিপ্ট অটো-ড্রাফট (ব্রাউজারে, `utils/scriptDraft.js`); `canEdit` ছাড়া চালু হয় না; Save সফল হলে তবেই ড্রাফট মোছে |
| 175895a | N20 + N20b + N20c: টেলিপ্রম্পটার "Script Play" (পোর্টালে পুরো পর্দা, Esc শুধু টেলিপ্রম্পটার বন্ধ করে, ধীর স্পিডেও চলে, ফোনে কন্ট্রোল বার ঠিক) |
| 1778833 | N24 + N24b: স্ক্রিপ্ট রিচ টেক্সট এডিটর (Tiptap 3.31.4, MIT) — বোল্ড, আন্ডারলাইন, হাইলাইট। স্ক্রিপ্ট একই কলামে ছোট HTML (`p, br, strong, u, mark`); পুরনো সাধারণ লেখা চলে; `utils/scriptRich.js` (sanitize সহ); ফ্ল্যাগ `rich_editor` |
| 57d90bc | N18 + N18b: নোটিফিকেশন সাউন্ড (`utils/notifySound.js`, মৃদু chime, শুধু নতুন INSERT-এ, ২ সেকেন্ড থ্রটল, মিউট বাটন, 'wd-sound' localStorage) |
| 1239e7f | N25 + N26 + N26b: ড্রয়ারের `CreditSelect` সেভ করা নাম সবসময় দেখায়; পুরো সিস্টেমে "Writer" → "Research & Script" |
| 05e0ea8 | N7: টেবিলের Staff Assignment ঘরে সরাসরি Research & Script / Presenter / Video Edit ড্রপডাউন (`StaffAssignSelect.js`: `StaffAssignSelect`, `StaffCell`); অনুমতি `FIELD_PERM`; ক্লিকে ড্রয়ার খোলে না |
| 1c10ca5 | N8 (বদলানো — Save বাটন বাতিল): ড্রয়ারের মাথায় "Saving… / Saved ✓ HH:MM / Not saved"; Esc-এ ফোকাসে থাকা INPUT/TEXTAREA blur হয়ে শেষ লেখা সেভ; সেভের নিয়ম অপরিবর্তিত |
| 530f3c9 | N9: "কর্তৃপক্ষ" প্যানেল ৫ ভাগে (People & access, Channels, Schedule, Reports, Data) + বর্ণনা; বাটনের নাম ও ৭ হ্যান্ডলার অপরিবর্তিত |
| 04dc17c | N27: টেবিল থেকে অ্যাসাইন/মোছায় সফলতার সবুজ টোস্ট (`Presenter → নাম` / `… cleared`), শুধু `patchRow` সফল হলে; `StaffCell`-এ `notify` প্রপ |
| cf7b573 | N28 (১০ অক্টোবর): রানডাউন/পার্কিং/বিন নতুন নিয়ম (নিচে "প্লেসমেন্ট নিয়ম")। `lib/core.js`: `isComplete`, `missingFields`, `isBin`, নতুন `isParked`; `app/page.js`: রানডাউন = `isComplete`, `bin` মেমো, পার্কিংয়ে "Incomplete / Missing: …" ট্যাগ, BIN সেকশন (Restore বাটন), লোডিং কোয়েরি (`emptyMetaRes` এখন channel/slug খালি ধরে); `Drawer.js`: On Hold কনটেন্টে Manager ছাড়া "Scheduled publish" লক। যাচাই: eslint 0, build 0, ১৫৩ লাইন যাচাই-করা ডিফের সাথে হুবহু এক। |
| c733c47 | N29 (১০ অক্টোবর): ফুটার পরিষ্কার। `app/page.js` শুধু (+5 −19): ফুটার থেকে Team, Excel, KPI Report (সবুজ), Backup All (লাল, যেটা আসলে stub ছিল — শুধু alert) বাদ; import থেকে `downloadFullSystemBackup` বাদ। কর্তৃপক্ষ প্যানেল অপরিবর্তিত (Team, Excel, KPI report, Backup সব ওখানে)। প্রভাব: সাধারণ কর্মী আর KPI Excel ডাউনলোড করতে পারে না (আগে সবুজ KPI Report সবার কাছে ছিল)। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 73d8deb | N28c (১০ অক্টোবর): `scheduleParked`-এর শেষ টোস্ট এখন সত্যি বলে: `missingFields({...row, scheduled_publish_time: iso})` খালি না হলে ধূসর বার্তা "Time saved, but still missing: … - it stays in the Parking Zone", নইলে আগের সবুজ "is on the rundown for …"। `app/page.js` +6 −1। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| d249ed7 | N30 (১০ অক্টোবর): My Work প্রোফাইল পপআপে। `Modals.js`: `ProfileModal`-এ নতুন প্রপ `onOpenMyWork`, ফুটারের প্রথম বাটন "My Work"; `app/page.js`: প্রপ পাস (`setShowProfile(false); setShowMyWork(true)`), ফুটার থেকে কর্মীর My Work বাটন বাদ — ফুটারে এখন থিম, কর্তৃপক্ষ (Manager/Owner), KPI (শুধু Manager)। সবার জন্য My Work প্রোফাইলের ভেতরে। +11 −9। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 0266e0d | N31 (১০ অক্টোবর): Bin = বাটন + পপআপ। `app/page.js` শুধু (+58 −56): পার্কিং জোনের শিরোনামের ডানদিকে "Bin (N)" বাটন (খালি হলে ঝাপসা, তবু চাপা যায়), পাশে "N items"; চাপলে `ModalShell wide` পপআপ (`showBin` স্টেট) — একই টেবিল (Slug Name, Channel, Missing, Drop reason, Restore); সারিতে ক্লিক করলে পপআপ বন্ধ হয়ে ড্রয়ার খোলে; Esc পপআপ বন্ধ করে; পাতার নিচের আলাদা BIN সেকশন সরানো। `bin` মেমো, Restore লজিক অপরিবর্তিত। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| ee4ab73 | N32 (১০ অক্টোবর): ১০০০ সারির সীমা ঠিক। নতুন `utils/fetchAll.js` (`fetchAllPages(buildQuery, pageSize=1000, maxPages=50)` — `.range()` দিয়ে পাতা ধরে সব সারি; ত্রুটিতে `{data:null,error}`); `app/page.js` `fetchRows`-এর ৭টা কোয়েরিই (প্রধান তারিখ-পরিধি, shorts, held, no-date, Draft/Dropped, অতীত-অপ্রকাশিত, empty-meta) এখন `fetchAllPages` দিয়ে, প্রতিটায় স্থির সাজানো `.order('id')` (প্রধানটায় `scheduled_publish_time` তারপর `id`)। কোনো ফিল্টার/দেখানোর নিয়ম বদলায়নি। মোট +36 −17। যাচাই: নকল Supabase-এ ০/১/৯৯৯/১০০০/১০০১/২৫০০/৩০০০ সারি — সবই ঠিক সংখ্যা, ডুপ্লিকেট নেই, ত্রুটি-কেস ঠিক; eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 0f3e0c4 | N33 (১০ অক্টোবর): ব্যাকআপে স্থির সাজানো। `components/ui/Modals.js` `BackupModal` → `performBackup`-এর পাতা-ধরা লুপে `.order('id', { ascending: true })` (+১ লাইন)। পাঁচটা টেবিলেই `id` আছে (organizations, team_members: uuid; channels, contents, notifications: bigint)। ফল: বড় টেবিলে ব্যাকআপের সারি বাদ/ডুপ্লিকেট হয় না। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 7a5c1a6 | Antigravity দিয়ে (আমাকে না জানিয়ে) **Next ^16.4.0, React/ReactDOM ^19.3.0**; `xlsx` বদলে `xlsx-js-style ^1.2.0` (import বদল: app/page.js `exportXlsx`, Modals.js কর্মী রিপোর্ট Excel ও Backup Excel); মরা `components/ui/ActionButtons.js` মোছা; package-lock বড় বদল | আমার যাচাই পরে: eslint 0, build 0 (Next 16.4.0 Turbopack); পুরনো `xlsx` import বাকি নেই। **রানটাইমে টেস্ট হয়নি** (Tiptap, টেলিপ্রম্পটার পোর্টাল, Realtime, Excel ডাউনলোড) |
| 3c8fbb9, 70ec21d | রিপোজিটরির `docs/*` ও README.md সাজানো; চারটা ০-বাইটের খালি ফাইল: `components/features/Drawer.js`, `components/features/RundownTable.js`, `components/layout/Sidebar.js`, `components/layout/TopHeader.js` | শুধু ডক |
| 834206d | `sql/2026-10-11_storage_documents_rls.sql`: public `documents` বাকেট, ৫০ MB; authenticated সবার insert/update/delete (org বা মালিক ধরে সীমা নেই), select সবার | ব্যবহারকারী চালিয়ে আপলোড+প্রিভিউ টেস্ট করেছেন (রেফারেন্স ফাইল আপলোড এখন ঠিক) |
| 375a1a1 | ডেটাবেস আকার ~944 kB (সীমা ৫০০ MB, ~০.২%): contents 29, notifications 756, team_members 20, content_uid_counters 11, organizations 1 | ডক |
| 094c881 | N12 নোটিশ বোর্ড | eslint 0, build 0, পুশ করা ডিফ যাচাই-করা ডিফের সাথে ৪৮৬ লাইন হুবহু এক, বাংলা অক্ষর অক্ষত |
| 0f2f2d8 | N13 আর্থি লাইট থিম ও N15 প্যাকেজিং/প্রোডাকশন রূপান্তর | Production ট্যাবে শুধু ফুটেজ/মাস্টার ফাইল (রেফারেন্স বাদ); Packaging ট্যাবে প্রতি প্ল্যাটফর্মের Published Link ও শর্ট কনটেন্ট (হুক, ক্যাপশন, সময়); ডাইনামিক `platforms` টেবিল ও `AddPlatformModal`; eslint 0, build 0 |
| UI Polish | স্লাগ কালার স্বাভাবিক ও থিম কনট্রাস্ট ফিক্স (১২ অক্টোবর) | ১. স্লাগ টেক্সট দুই থিমেই সাধারণ ফন্ট কালার (text-white; ডার্কে সাদা, লাইটে চারকোল `#28231d`) — রানডাউন (ডেস্কটপ ও মোবাইল) এবং পার্কিং (মোবাইল) থেকে কন্টেন্ট-টাইপ রঙ সরানো; ২. টেলিপ্রম্পটার লাইট ও ডার্ক উভয় থিমেই স্থায়ী ব্ল্যাক ব্যাকগ্রাউন্ড (`#000000`) ও সাদা টেক্সট (`#ffffff`) — `.teleprompter-root` রুট ও লাইট থিম সিএসএস ওভাররাইড প্রোটেকশন; ৩. ড্রয়ারের শীর্ষে স্ক্রিপ্ট ডিউরেশন ব্যাজ লাইট থিমে স্পষ্ট দৃশ্যমান (`.script-duration-badge`: `#e5ded2` ব্যাকগ্রাউন্ড, `#241f19` ডার্ক টেক্সট); eslint 0, build 0 |


## প্লেসমেন্ট নিয়ম (N28, ব্যবহারকারীর সিদ্ধান্ত ১০ অক্টোবর)
"সম্পূর্ণ" = channel + slug + publish date/time তিনটাই আছে।
- সম্পূর্ণ কনটেন্ট (Draft, Dropped সহ যেকোনো স্ট্যাটাস, অতীত বা ভবিষ্যৎ): **রানডাউনে**, স্ট্যাটাস ব্যাজ সহ।
- On Hold: **পার্কিং জোনে**; সম্পূর্ণ হলে রানডাউনেও।
- অসম্পূর্ণ (Dropped নয়): **পার্কিং জোনে**, "Incomplete" + কী নেই ("Missing: …")।
- অসম্পূর্ণ + Dropped: **Bin**-এ (পার্কিংয়ের শিরোনামের পাশের "Bin (N)" বাটনের পপআপে, N31); Manager/Owner Restore করতে পারে (→ Draft → পার্কিং বা রানডাউন)।
- ড্রয়ারে On Hold কনটেন্টের সময় বদলানো শুধু Manager/Owner; পার্কিংয়ের Resume আগের মতোই (Manager)।
- KPI (মডাল ও রিপোর্ট) রানডাউনের `visible` থেকেই: Draft/On Hold/Dropped স্ট্যাটাস সহ গোনা হয়। My Work/কর্মী রিপোর্ট/ব্যক্তিগত রিপোর্ট স্ট্যাটাস দিয়ে ছাঁকে না; তারিখহীন (পার্কিং/বিন) কনটেন্ট তারিখ-ভিত্তিক রিপোর্টে আসে না।
- পার্কিং থেকে সময় দিলে টোস্ট সত্যি বলে (N28c, সম্পন্ন)।
- ডেটা লোডে এখনও সব Draft/Dropped ও অতীত-অপ্রকাশিত সারি আনে (গুরুত্বহীন; N34-এ সরানো যাচাই করা হবে — open-tasks.md)।

## ডেটাবেস (Supabase) — সম্পন্ন
- **DB-0 (৮ অক্টোবর, ব্যবহারকারী চালিয়েছেন, চেক তিনটাই true):** `contents.reference_files jsonb default '[]'` যোগ; `notify_content_insert/update` নোটিফিকেশনে "Writer" → "Research & Script"; `cascade_member_rename` এখন idea_by, producer, uploader, vfx, colorist, light_designer, sound_recordist, audio_mixer, video_switcher, live_audio-ও ধরে। Rollback `sql-db0.md`-এ।
- ✅ **Storage documents বাকেট ফিক্স (১১ অক্টোবর):** `sql/2026-10-11_storage_documents_rls.sql` সফলভাবে কার্যকর। Assets ট্যাবে রেফারেন্স ফাইল আপলোড ও নতুন ট্যাবে প্রিভিউ সফলভাবে পরীক্ষিত।
- ✅ **N12 নোটিশ বোর্ড (১১ অক্টোবর, 094c881):** `notices` টেবিল, RLS, Realtime, `NoticeModal.js`, `noticeService.js`, `app/page.js` বাটন ও লিসেনার সম্পন্ন ও কমিট/পুশ সম্পন্ন। ব্যবহারকারী Supabase-এ SQL চালিয়েছেন (`Success. No rows returned`)।
- ✅ **১২ অক্টোবরের মাইগ্রেশন সম্পন্ন:** ব্যবহারকারী Supabase SQL Editor-এ ৩টি স্ক্রিপ্টই সফলভাবে চালিয়েছেন — `platforms` টেবিল+RLS (`sql/2026-10-12_platforms_table.sql`), `contents.published_links` কলাম (`sql/2026-10-12_packaging_published_links.sql`), এবং `notice_uid` ও দৈনিক কাউন্টার ট্রিগার (`sql/2026-10-12_notices_uid_and_counter.sql`)।
- ⏳ DB-0-র পরের টেস্ট: TEST কনটেন্টে অ্যাসাইনে নোটিফিকেশনে "Research & Script" আসে কিনা।

## N12 নোটিশ বোর্ড (094c881, ১১ অক্টোবর)
- **SQL** `sql/2026-10-11_notices_table.sql` (ব্যবহারকারী চালিয়েছেন): টেবিল `notices` (id uuid, organization_id, title, body, author_id → team_members, author_name, priority normal/urgent/info, created_at, updated_at); ইনডেক্স; RLS — পড়া: `my_org_id()` ও `i_am_active()`, লেখা/বদল/মোছা: `my_org_id()` ও `is_manager()`; Realtime publication-এ যুক্ত। Rollback ফাইলের নিচে কমেন্টে (সতর্কতা: `alter publication … drop table if exists` লাইনটা অবৈধ সিনট্যাক্স; লাগলে `if exists` ছাড়া `alter publication supabase_realtime drop table notices;`)।
- `services/noticeService.js`: `fetchNotices(orgId, limit=50)`, `createNotice(...)`, `deleteNotice(id)`।
- `components/ui/NoticeModal.js`: ModalShell ফিড; Urgent লাল / Info নীল ব্যাজ; Manager/Owner-এর জন্য "+ নতুন নোটিশ দিন" ফর্ম ও মোছা (confirm সহ)।
- `app/page.js`: স্টেট `showNotices`, `notices`, `unreadNoticesCount`; না-পড়া localStorage `wd-notices-read-at` দিয়ে; Realtime লিসেনার (`newsroom-${org.id}`) — INSERT-এ chime + টোস্ট (ফ্ল্যাগ `notif_sound`); ফুটারে "নোটিশ" বাটন + ব্যাজ (ফ্ল্যাগ `notices`); Esc চেইনে `showNotices`।
- জানা ছোট খুঁত: (১) `bell` আইকন `Icons.js`-এ নেই — বাটনে আইকন ফাঁকা, লেখা দেখা যায়; (২) যিনি নোটিশ দেন তিনিও নিজের chime শোনেন ও নিজের নোটিশ ব্যাজে গোনা হয়; (৩) নোটিশ সম্পাদনা (update) UI নেই, শুধু policy আছে।
- ব্যবহারকারীর চোখে-দেখা টেস্ট বাকি: Manager পোস্ট/মোছা; কর্মীর অ্যাকাউন্টে ফর্ম নেই কিন্তু নোটিশ+ব্যাজ+chime আছে; ফোনের মাপ; Esc।

## N12 নোটিশ আইডি ও লাইভ সার্চ (১২ অক্টোবর)
- **SQL** `sql/2026-10-12_notices_uid_and_counter.sql`: `notices.notice_uid text unique` কলাম যোগ; `notice_uid_counters` দৈনিক কাউন্টার টেবিল (Asia/Dhaka সময়); `notices_assign_uid()` ট্রিগার ফাংশন ও `trg_notices_assign_uid` ট্রিগার (ইনসার্টের আগে স্বয়ংক্রিয় `NOTICE-YYYYMMDD_NNN` তৈরি); পুরনো নোটিশের জন্য ব্যাকফিল স্ক্রিপ্ট।
- `components/ui/NoticeModal.js`:
  - **লাইভ সার্চ বার:** নোটিশ বোর্ডে আইডি (যেমন `NOTICE-20261012_001`), শিরোনাম, বডি বা লেখক লিখে ইনস্ট্যান্ট ফিল্টার; নোটিশ কাউন্টার ও সার্চ রিসেট বাটন।
  - **আইডি প্রদর্শন ও কপি:** নোটিশ কার্ডের শিরোনামের পাশে `NOTICE-YYYYMMDD_NNN` সবুজ ব্যাজ; ক্লিকে ক্লিপবোর্ডে কপি ও "কপি হয়েছে!" অ্যানিমেশন।
  - **ফলব্যাক ডিসপ্লে:** ডাটাবেসে পুরনো কোনো নোটিশে `notice_uid` নাল/খালি থাকলেও ক্লায়েন্ট-সাইডে তারিখ ও ক্রমানুসারে স্বয়ংক্রিয় UID বসিয়ে দেখানো ও কপি সাপোর্ট।
- `services/noticeService.js`: `createNotice`-এ স্বয়ংক্রিয় দৈনিক ক্রম গুনে `notice_uid` তৈরি ও ডাটাবেসে সেভ; কলাম না থাকলে নিরাপদ ফলব্যাক।
- `lib/core.js`: `makeNoticeUid` জেনারেটর হেল্পার ফাংশন যোগ ও এক্সপোর্ট।

## ঝুঁকি/সিদ্ধান্ত বাকি
1. **Next 16 / React 19 লাফ**: লাইভে স্মোক টেস্ট দরকার — লগইন, রানডাউন, ড্রয়ার, স্ক্রিপ্ট এডিটর (বোল্ড/হাইলাইট), টেলিপ্রম্পটার, বেল+সাউন্ড, Excel (রানডাউন, কর্মী রিপোর্ট, ব্যাকআপ Excel), ব্যাকআপ JSON, প্রোফাইল, Bin, নোটিশ। ফিরতি পথ: Vercel Deployments → 0f3e0c4-এর ডিপ্লয় "Promote to Production"।
2. **documents বাকেট খুব উদার**: যেকোনো লগইন-করা সদস্য যেকোনো ফাইল মুছতে/বদলাতে পারে; লিংক জানলে যে কেউ দেখতে পারে। পরে: প্রাইভেট বাকেট + signed URL, অন্তত org/মালিক-ভিত্তিক update/delete।
3. **ডক ডুপ্লিকেট**: রিপোর `docs/` আর Project `claude/*` — কোনটা মূল ঠিক করা বাকি।
4. রিপোজিটরি private/public অজানা (GitHub API এই সেশনে 403)। বিক্রি/শেয়ারের আগে Private নিশ্চিত করা।
5. খালি ৪টা প্লেসহোল্ডার ফাইল — মুছে ফেলা বা ব্যবহারের সিদ্ধান্ত।
6. নিয়ম পুনরায়: Antigravity দিয়ে যা-ই করান, **কমিটের আগে ডিফ আমাকে দিন** (আজ Next 16 আমার যাচাই ছাড়া লাইভে গেছে)।

## লঞ্চ (১০ অক্টোবর)
ব্যবহারকারী আজ লঞ্চ করছেন। লঞ্চের আগে: **আসল ব্যাকআপ = কর্তৃপক্ষ → Data → Backup → JSON** (ফুটারের "Backup All" বাদ গেছে); TEST কনটেন্ট মোছা; টিম অ্যাকাউন্ট/রোল/অনুমতি দেখা; ইউজার তৈরি পদ্ধতি (Supabase ফ্রি ইমেইল সীমা) ২–৩ জনে পরীক্ষা; ডিপ্লয়ের পর Ctrl+Shift+R ও Owner+সাধারণ কর্মীর স্মোক টেস্ট; Vercel আগের ডিপ্লয়ে ফেরার পথ জানা। My Work এখন নিজের নামের বাটনের (প্রোফাইল) ভেতরে। লঞ্চের পর শীঘ্রই: রাতের স্বয়ংক্রিয় ব্যাকআপ (pg_dump)।

## বাকি আছে
- ⏳ **ব্যবহারকারীর চোখে-দেখা টেস্ট (মনে করিয়ে দিতে হবে):** My Work-এ role নাম+সংখ্যা; কর্মী রিপোর্ট কলাম; TEST কনটেন্টে লেখক বদলে History-তে "Research & Script"; কর্তৃপক্ষ প্যানেলের ৭ বাটন + ফোনের মাপ; N27 সবুজ বার্তা; N28-এর ৫টা টেস্ট (সম্পূর্ণ→রানডাউন, সময়হীন→পার্কিং, Schedule চাপলে রানডাউনে, Hold→দুই জায়গায়, অসম্পূর্ণ Drop→Bin→Restore); N28c: চ্যানেল/স্লাগ ছাড়া কনটেন্টে সময় দিলে ধূসর "still missing" বার্তা; N29: ফুটারে শুধু থিম/কর্তৃপক্ষ/KPI, কর্তৃপক্ষের ভেতরের বাটনগুলো কাজ করে; N30: প্রোফাইলে "My Work" বাটন (কর্মী ও Manager দুই রোলে), ফুটারে কর্মীর জন্য কিছু নেই; N31: পার্কিংয়ের "Bin (N)" বাটন, পপআপ, Restore, সারি-ক্লিকে ড্রয়ার, Esc, ফোনের মাপ; N32: রানডাউন/পার্কিং/Bin-এর সংখ্যা আগের মতোই, তারিখের পরিধি বদলালেও ঠিকঠাক লোড; N33: ব্যাকআপ JSON ঠিকমতো নামে, কোনো টেবিলে "failed" নেই।
- লাইভ সাইটে (Vercel ডেপ্লয়ের পর) Ctrl+Shift+R দিয়ে একবার দেখা।
- **N34 (যাচাই করে, ঐচ্ছিক):** `fetchRows`-এর দুটো অপ্রয়োজনীয় কোয়েরি সরানো (open-tasks.md)।

## পরবর্তী: বড় DB কাজের পরিকল্পনা (আগে পরিকল্পনা দেখিয়ে অনুমোদন): N12 নোটিশ → N14 Show/Channel আইডি → N10 Show ফর্ম → N15 প্ল্যাটফর্ম ট্র্যাকিং → N17, N11; থিম N13 (branch `themes`)। SQL সবসময় ছোট, যোগ-ভিত্তিক, `begin…commit`, rollback সহ, লাইভে সরাসরি কার্যকর (একই DB) তাই আগে পর্যালোচনা।

## শিক্ষা (প্রম্পট লেখার সময় মনে রাখতে হবে)
- **Antigravity-র রিপোর্টের diff বিশ্বাস করা যায় না (১০ অক্টোবর ঘটেছে):** N28 v3-এর রিপোর্টে এমন diff ছিল যার `nd` ভেরিয়েবল ও "Everything has a publish date." লেখা GitHub কোডে ছিলই না; দুটো প্রম্পট-আইটেম (scheduleParked বার্তা, খালি-বার্তা) রিপোর্টে "করা" বলা হয়েছিল কিন্তু আসল diff-এ ছিল না। নিয়ম: **কমিটের আগে ব্যবহারকারী নিজে diff ফাইলে নেবে** (`git diff <ফাইলগুলো> | Out-File "$env:USERPROFILE\Desktop\n33.diff" -Encoding utf8`) ও চ্যাটে সংযুক্ত করবে; আমি তা পরিষ্কার ক্লোনে `git apply` করে eslint+build চালাই (BOM/CRLF বাদ; ডিফ ফাইলে ইউনিকোড বিকৃত দেখায় — যেমন `ÔÇö`, `ÔÇ£` — সেটা শুধু Out-File-এর সমস্যা, ফাইল ঠিক; যাচাই: `node -e "…s.includes('ÔÇö')…"` → false)। কমিটের পরে পুশ করা ডিফ ও যাচাই-করা ডিফ লাইন ধরে মেলাই। (N29, N28c, N30, N31, N32, N33 এই পদ্ধতিতে সবই প্রথমবারে ঠিক বেরিয়েছে।)
- **নতুন ফাইল থাকলে ডিফে আনতে:** `git add -N <নতুন ফাইল>` তারপর `git diff <ফাইলগুলো>` (status-এ ` A` দেখায়); কমিট প্রম্পটে দুই ফাইলের নাম ধরে `git add`। নতুন সাহায্যকারী ফাংশন নকল ডেটায় আলাদা করে পরীক্ষা করা যায় (N32: `fetchAllPages`)।
- প্রম্পটে অ-ASCII অক্ষর (—, ✓, …) এড়াতে হবে; নতুন টেক্সটে সাধারণ `-` ব্যবহার।
- Antigravity ফাইল তৈরি করে "কোনো temp ফাইল নেই" বলেও `fix_page.js` রেখে গিয়েছিল; কমিটের আগে `git status` দিয়ে `??` লাইন দেখে `Remove-Item` করাতে হয়। (N29-তে `fix_footer*.js` বানিয়ে নিজেই মুছেছিল; "স্ক্রিপ্ট ব্যবহার করবে না" বললেও করে — তাই ডিফ যাচাই জরুরী।)
- `warning: LF will be replaced by CRLF` (Windows): নিরীহ।
- **ফুটার/প্যানেল ডুপ্লিকেট:** কোনো বাটন stub কিনা (`downloadFullSystemBackup` শুধু alert দিত) নতুন বাটন যোগের আগে/পরে পরীক্ষা করা; আসল ব্যাকআপ `BackupModal` (Modals.js)।
- **`ActionButtons` দুটো আছে:** আসল ব্যবহৃত = `components/ui/Shared.js` (~১৭১); `components/ui/ActionButtons.js` মরা ডুপ্লিকেট।
- **`BlurInput` আগে `maxLength` নিত না**; এখন ঐচ্ছিক প্রপ।
- Antigravity-র রিপোর্টে "সব করেছি" বললেও এক জায়গা বাদ যেতে পারে। প্রম্পটে শেষে `Select-String` প্রমাণ চাইতে হবে — এবং আসল diff আলাদা নিতে হবে।
- Antigravity regex/replace-স্ক্রিপ্ট চুপচাপ না-মিলে ব্যর্থ হয় (Windows CRLF); সরাসরি এডিট চাইলেও প্রায়ই স্ক্রিপ্ট ব্যবহার করে। diff-এ কেবল প্রত্যাশিত hunk আছে কিনা মিলিয়ে দেখতে হবে; temp `fix_*.js` মুছতে বলতে হবে।
- নতুন ফাইল (untracked) কমিট প্রম্পটে নাম ধরে `git add`; কমিটের আগে `git status` দেখে অন্য ফাইল থাকলে থামতে বলা।
- নতুন ফিচারে দেখতে হবে: `canEdit`/লক মানে কি না; সেভ ব্যর্থ হলে ডেটা হারায় কি না (`patchRow` সত্য/মিথ্যা ফেরত দেয়)।
- **Supabase প্রতি অনুরোধে সর্বোচ্চ ১০০০ সারি দেয়, চুপচাপ কেটে ফেলে।** নতুন কোয়েরিতে `fetchAllPages(() => supabase…order('id'))` (`utils/fetchAll.js`) ব্যবহার করতে হবে; পাতা ধরা কোয়েরিতে স্থির সাজানো (`id`) জরুরী, নইলে সারি বাদ/ডুপ্লিকেট হয় (ব্যাকআপেও একই — N33)।
- **`position: fixed` ওভারলে Drawer-এর ভেতরে আটকে যায়** (`<aside>`-এ `backdrop-blur`) → `createPortal(…, document.body)`।
- **`app/page.js`-এ window-স্তরের Escape লিসেনার আছে** (`reasonFor, showNew, showAddChannel, showTeam, showKpi, showBin, selectedId`) → নতুন ওভারলের কী-লিসেনার capture ফেজে + `stopPropagation`, অথবা এই চেইনে যোগ। (ড্রয়ারের Esc-blur লিসেনার stopPropagation করে না — ইচ্ছাকৃত।)
- `ModalShell` (Shared.js) `z-[60]`; নতুন পপআপ থেকে ড্রয়ার খুলতে আগে পপআপ বন্ধ করতে হয় (N31)।
- `scrollTop` পূর্ণসংখ্যায় ছাঁটে — দশমিক অবস্থান ref-এ রাখতে হবে।
- **Tiptap 3 StarterKit-এ Underline, Link, TrailingNode, ListKeymap আগে থেকেই আছে**; `shouldRerenderOnTransaction: true` লাগে; কলব্যাক ref-এ।
- `npm install`/`npm ci` ESLint মুছে দেয় → `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`।
- localhost ও লাইভ একই Supabase। টেস্ট শুধু "TEST" কনটেন্টে।
- GitHub push-এ মাঝে মাঝে 500 দেয়; পরে আবার push।
- **একই ফিল্ড, ভিন্ন লেবেল:** নাম বদলালে অ্যাপের সব দেখানো লেখা `grep` করে একসাথে ধরতে হবে — **এবং ডেটাবেসের ফাংশনের ভেতরের লেখাও**।
- **`CreditSelect` (Drawer.js) বাগ:** অপশন skillKey দিয়ে ছাঁকা হতো; এখন বর্তমান মান সবসময় অপশনে থাকে। `StaffAssignSelect`-ও একই নিয়ম মানে।
- রিপোর্টের role-নামের স্ট্রিং (`roleTotals` কী ও `roles.push`) হুবহু এক হতে হবে।
- পুরনো audit এন্ট্রি ও পুরনো নোটিফিকেশনে "Writer" থেকে যাবে (ইতিহাস; বদলানো হয়নি)।
- টেবিলের ভেতরের ইন্টারঅ্যাক্টিভ কন্ট্রোলে click/mousedown/keydown `stopPropagation` দিতে হয়।
- `patchRow` ব্যর্থতায় লাল টোস্ট দেয়; সফলতার বার্তা ড্রয়ারে "Saved ✓" ও টেবিলে সবুজ টোস্ট (N8, N27) দেয়।
- Antigravity-র `git diff --stat` লাইন-সংখ্যা আগে-পরে ভিন্ন দেখাতে পারে (লাইন-শেষ চিহ্ন); আসল hunk মিলিয়ে দেখতে হবে।
- **ডেটাবেস নিয়ম:** guard ট্রিগার (`guard_contents_update`) তালিকাভুক্ত কলামের বাইরে যেকোনো অ্যাকটিভ সদস্যকে বদলাতে দেয়; নতুন কলাম অরক্ষিত — দরকারে guard-এ নিয়ম।
- `notify(msg, tone = 'info')`: টোন 'error' (লাল), 'success' (সবুজ), বাকি সব ধূসর।
- প্রোফাইল বাটন (হেডার) শুধু `authUser && me` থাকলে আসে; ফুটারের কর্তৃপক্ষ/KPI `actor`-এর উপর নির্ভর করে।
- **ডিফ সেভের নতুন পদ্ধতি (বাংলা ভাঙা এড়াতে, ১১ অক্টোবর):** `git diff --output="$env:USERPROFILE\Desktop\nXX.diff" <ফাইলগুলো>` (পাইপ + Out-File বাংলা অক্ষর নষ্ট করে — cp850 মোজিবেক; সরাসরি `--output` ভালো)। নতুন ফাইল থাকলে আগে `git add -N`।
- **কমিট বার্তায় "Co-Authored-By" ও "Claude-Session" লাইন নয়** — ব্যবহারকারী চান না (১১ অক্টোবর)। কমিট প্রম্পটে শুধু এক লাইনের `git commit -m "..."`।
- Icon নাম `Icons.js`-এর `ICON_PATHS`-এ না থাকলে ফাঁকা SVG দেখায় (ত্রুটি ছাড়া) — নতুন আইকন ব্যবহারে নামটা আছে কিনা মিলিয়ে নিতে হবে।

## ব্যবহারকারীর সিদ্ধান্ত
- ট্যাবের টাইটেল শুধু "WaveDesk"।
- মোবাইল তালিকায় স্লাগের রং কনটেন্ট-টাইপ অনুযায়ী রঙিন; ঠিক আছে।
- নিয়ম: নতুন প্রম্পট টাস্ক ফাইলের সাথে না মিললে আমাকে জানাতে হবে।
- রিচ এডিটর: ওপেন সোর্স Tiptap; শুধু বোল্ড/আন্ডারলাইন/হাইলাইট।
- **নাম:** পুরো সিস্টেমে "Writer" নয়, সবখানে "Research & Script"। ডেমো পদবি "Senior Writer" ও ড্রয়ারের "Let writers edit…" টুলটিপ আপাতত অপরিবর্তিত।
- **Save বাটন বাতিল;** তার বদলে "Saved ✓" সূচক + Esc-এ শেষ লেখা সেভ (সম্পন্ন)।
- DB-0 অনুমোদিত ও চালানো হয়েছে।
- **N28 প্লেসমেন্ট নিয়ম** (উপরে)। KPI-তে Draft/Hold/Dropped স্ট্যাটাস সহ থাকবে; পার্সোনাল রিপোর্টেও।
- **N29 (১০ অক্টোবর):** কর্তৃপক্ষ প্যানেলে যা আছে তা ফুটারে নয়; Backup All পুরোপুরি বাদ (প্যানেলের Backup-ই আসল)।
- **N30 (১০ অক্টোবর):** My Work প্রোফাইলের ভেতরে, সবার জন্য (উপায় ১)। N28c একই দিনে ঠিক করা।
- **N31 (১০ অক্টোবর):** Bin আলাদা সেকশন নয়; পার্কিং জোনের শিরোনামের পাশে "Bin (N)" বাটন + পপআপ।
- **N32, N33 (১০ অক্টোবর):** ১০০০ সারির সীমা ও ব্যাকআপের স্থির সাজানো লঞ্চের দিনেই করা।
- **ফাইল ও সার্ভার (৮ অক্টোবর):** Supabase-এ শুধু টেক্সট; অফিসের নিজস্ব সার্ভারে সরানো (লক্ষ্য), কিন্তু আগে ~৬ মাস Supabase+Vercel ফ্রি; কোডবেজ অফিসের সাথে শেয়ার নয় (Docker ইমেজ + লিখিত চুক্তি); কাঁচা ফুটেজ LAN-এ NAS-এ, অ্যাপে ফাইলের পথ দেখানো জরুরী। বিস্তারিত file-management-plan.md।
- **কমিট বার্তায় Claude-এর নাম/সেশন লাইন নয় (১১ অক্টোবর):** ব্যবহারকারী সিদ্ধান্ত নিয়েছেন কমিট মেসেজ হবে ক্লিন ও সরাসরি।
- **AI-তৈরি কোডের কপিরাইট (১১ অক্টোবর):** ব্যবহারের অধিকার সাধারণত ব্যবহারকারীর; ব্যবসায়িক গোপনীয়তা + লিখিত চুক্তি + লাইব্রেরির লাইসেন্স তালিকা নিশ্চিত করা।

## পরে করব
- মরা `components/ui/ActionButtons.js` সরানো।
- `services/exportService.js`-এর stub `downloadFullSystemBackup` (এখন শুধু `ExportButtons.js` ব্যবহার করে) — ওটাও সরানো/আসলটার সাথে জোড়া দেওয়া যাবে।
- Drawer টুলটিপ "Let writers edit…" বদলাবে কিনা — সিদ্ধান্ত।
- `StaffCell` প্রতি সারিতে নামের তালিকা নতুন করে বানায় (ছোট কাজ)।
- DB পরিষ্কার: পুরনো ডুপ্লিকেট কলাম (writer_name, editor_name, script_body, raw_footage_url, presenter, publisher, script_locked) ও `team_members_legacy`; `channels.name` গ্লোবাল ইউনিক (N14-এর সময়); guard-এ skill-flag/নতুন কলামের নিয়ম।
- **স্ক্রিপ্ট ড্রাফটের গোপনীয়তা:** শেয়ার করা কম্পিউটারে লগআউটের পর আগের জনের ড্রাফট দেখা যেতে পারে — সিদ্ধান্ত।
- `purgeOldDrafts`-এ নষ্ট ড্রাফট লুপের মাঝে মোছা (বিরল); কিছু ফাইলের শুরুতে অদৃশ্য BOM (ক্ষতিহীন)।
- টেলিপ্রম্পটারে বোল্ড/হাইলাইট দেখানো; টেলিপ্রম্পটারে ক্লিকার (প্রেজেন্টেশন রিমোট) সমর্থন (open-tasks ঙ); রিচ এডিটর নতুন কনটেন্ট ফর্মে/লিস্ট/ইটালিক; Tiptap আপগ্রেড আলাদা কাজ।
- Django-তে গেলে স্ক্রিপ্ট HTML সার্ভারে নিরাপদ করতে `nh3`/`bleach` (একই whitelist: p, br, strong, u, mark)।
- Next.js 14.2.15-এ নিরাপত্তা সতর্কতা — আলাদা আপগ্রেড কাজ। (DONE: upgraded to Next 16.4 / React 19.3 in commit 7a5c1a6, 11 Oct)
- Antigravity "Allow" সেটিংস; D2 byproduct নাম, D3 role ticks, N21 level 2, রেভিনিউ ধাপ।
- Vercel Hobby (ফ্রি) প্ল্যান অবাণিজ্যিক কাজের জন্য — শর্ত যাচাই।
