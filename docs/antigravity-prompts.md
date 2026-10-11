# WaveDesk — Antigravity প্রম্পট (Django-রেডি নিয়মে)
 
**কীভাবে ব্যবহার করবেন**
1. ধাপ ১ (F0) আগে দিন। এটা কয়েকটা নতুন ফাইল বানায়, অ্যাপের কিছু বদলায় না। এর মধ্যে `docs/RULES.md` ফাইলে সব নিয়ম থাকে, তাই পরের প্রতিটা প্রম্পটে নিয়ম আর বারবার লিখতে হয় না। এতে খরচও কমে।
2. প্রতিটা প্রম্পট শেষ হলে: localhost-এ "টেস্ট" অংশের কাজগুলো দেখুন → ঠিক থাকলে commit ও push → তারপর পরের ধাপ। কোনোটা ঠিক না হলে Antigravity-র উত্তরটা আমাকে পাঠান।
3. ডেটাবেসের কাজ (ধাপ ১৬ থেকে) আলাদা শাখায় (branch) হবে, আর আগে ডেটাবেসের বর্তমান অবস্থার একটা ছবি (schema snapshot) আমাকে দিতে হবে।
4. প্রম্পটগুলো ইংরেজিতে, কারণ কোডের নির্দেশ ইংরেজিতে বেশি নির্ভুল হয়।
---
 
## ক্রম (কোনটার পর কোনটা)
 
| ধাপ | কাজ | কেন এই জায়গায় | ডেটাবেস বদল |
|---|---|---|---|
| ১ | F0 — ভিত্তি ফাইল ও নিয়ম | আগে নিয়ম ও Django-রেডি কাঠামো, যাতে পরের সব কাজ একই নিয়মে হয় | না |
| ২ | N3 — ক্যামেরা বাগ ও "Cameraman" | Start Shoot আটকে আছে, টিমের কাজ থামছে | না |
| ৩ | N2 — স্লাগ ২৪ অক্ষর | ছোট; ধাপ ৫ এর আগে সীমা ঠিক হওয়া দরকার | না |
| ৪ | N1 — নাম WaveDesk ও ক্রেডিট | ছোট, নিরাপদ | না |
| ৫ | N4 — টেবিলে স্লাগ এডিট বন্ধ, ড্রয়ারে এডিট | ধাপ ৩ এর পর (২৪ সীমা ড্রয়ারেও লাগবে) | না |
| ৬ | N5 — টেবিলে Download Zip বাদ | ছোট, টেবিল পরিষ্কার | না |
| ৭ | N6 — সময়ের ক্রম যাচাই | কোডে আগেই আছে, শুধু যাচাই ও ছোট ঠিক | না |
| ৮ | N16 — পাবলিশড লিংক খোলা | ছোট, ড্রয়ারে | না |
| ৯ | N19 — স্ক্রিপ্টের সময় (১৩০ শব্দ/মিনিট) | স্ক্রিপ্ট ট্যাব নিয়ে কাজের শুরু | না |
| ১০ | N21 — স্ক্রিপ্ট অটো-ড্রাফট | তথ্য হারানো বন্ধ; সবচেয়ে জরুরি নিরাপত্তা | না |
| ১১ | N20 — টেলিপ্রম্পটার | স্ক্রিপ্ট ট্যাবের কাজ একসাথে শেষ | না |
| ১২ | N18 — নোটিফিকেশন সাউন্ড | স্বাধীন, ছোট | না |
| ১৩ | N7 — টেবিল থেকে Writer/Presenter/Editor বসানো | স্বাধীন, মাঝারি | না |
| ১৪ | N8 — Save বাটন (ড্রয়ারের সব এডিট) | ড্রয়ারের বড় বদল, তাই ড্রয়ারের অন্য কাজের (৫, ৮, ৯–১১) পর | না |
| ১৫ | N9 — কর্তৃপক্ষ প্যানেল গোছানো | শুধু সাজানো | না |
| ১৬ | **ডেটাবেসের ছবি (schema snapshot)** | এটা ছাড়া ডেটাবেসের প্রম্পট নির্ভুল হয় না | — |
| ১৭ | N12 — নোটিশ | নতুন টেবিল, সহজতম ডেটাবেস কাজ | **হ্যাঁ** |
| ১৮ | N14 — Show ও Channel-এর ইউনিক আইডি | Show-এর আগে লাগবে; ঝুঁকিপূর্ণ | **হ্যাঁ** |
| ১৯ | N10 — Show ও ডাইনামিক ফর্ম | ধাপ ১৮ এর ওপর নির্ভর করে | **হ্যাঁ** |
| ২০ | N15 — প্ল্যাটফর্ম ট্র্যাকিং | বড় কাঠামো-বদল | **হ্যাঁ** |
| ২১ | N17 — আয় | ধাপ ২০ এর প্ল্যাটফর্ম-সারির ওপর বসে | **হ্যাঁ** |
| ২২ | N11 — Graphic Designer ও নিষ্ক্রিয় টাইপ | ডেটাবেসের শেষ কাজ | **হ্যাঁ** |
| ২৩ | N13 — থিম | সবার শেষে, পুরো অ্যাপের রঙ ছোঁয় | না |
 
ধাপ ১৭–২২ এর প্রম্পট ধাপ ১৬ এর ছবি পাওয়ার পর লিখব, যাতে তাতে ঠিক টেবিল ও কলামের নাম থাকে। বাকি প্রম্পট নিচে লেখা আছে।
 
**অপেক্ষায় (সিদ্ধান্ত হয়নি):** বাই-প্রোডাক্টের সাধারণ নাম (D2) ও রোল টিক সিস্টেম (D3)। এগুলোর প্রম্পট এখন নেই।
 
---
 
## ধাপ ১ — F0: ভিত্তি ফাইল (অ্যাপের আচরণ বদলায় না)
 
```text
TASK F0 — Foundation files (NO change to app behavior)
Create these NEW files. Do not modify any existing file except item 5, which only appends.
 
1. docs/RULES.md with exactly this content:
 
# WaveDesk — rules for every AI task in this repo
## Scope (strict)
1. Do ONLY what the task says. Do not modify, refactor, rename, reformat or "improve" anything else: no unrelated UI, text, colors, spacing, workflow rules, permission logic, database logic, dependencies or config.
2. First read the current code of the parts you will touch; the code changes often.
3. Keep existing behavior, permissions and data formats unless the task explicitly changes them.
4. If you notice a bug or improvement outside the task, do NOT fix it. List it at the end under "Noticed but not changed".
5. Never add or upgrade a package (package.json stays unchanged) unless the owner approves after you name the package, its license (MIT or Apache only) and why. Write small features yourself.
6. Never commit or push. The owner does that.
## Database
7. Never run migrations or touch the live database. If the task needs database changes, write plain Postgres SQL in a new file sql/YYYY-MM-DD_<name>.sql (snake_case names, uuid primary key, created_at/updated_at, organization_id on every table, RLS policies included and commented) and tell the owner clearly that it must be run in the Supabase SQL editor.
## Django-ready (NEW code only; do not refactor existing code)
8. Pure business logic (slug generation, duration math, status and permission rules) goes in lib/ or utils/ as plain functions with no React and no DOM, each with 2-3 input->output examples in a comment.
9. New Supabase calls go in services/, not inside UI components.
10. Browser-only features (sound, teleprompter, themes, local drafts) go in their own plain JS module with a thin React wrapper.
11. Fixed numbers and labels go in utils/constants.js. Every new feature is registered in utils/features.js.
## Finish
12. At the end: list every changed or created file; run `npm run build`; run the undefined-name check below; report both results honestly. If something fails, fix only what you broke.
Undefined-name check: npm i --no-save eslint@8 eslint-plugin-react@7 eslint-plugin-react-hooks@4 && npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js   (must report 0 errors)
 
2. docs/check-undefined.eslintrc.json: an ESLint config with parserOptions {ecmaVersion 2022, sourceType module, ecmaFeatures {jsx true}}, env {browser, es2022, node}, plugins ["react","react-hooks"], root true, rules {"no-undef":"error","react/jsx-no-undef":"error","react-hooks/rules-of-hooks":"error"}. Do NOT add eslint or any plugin to package.json.
3. utils/features.js: export const FEATURES = { notices: true, revenue: true, platform_tracking: true, show_forms: true, teleprompter: true, notif_sound: true, script_drafts: true, themes: true, graphic_design: true, bulk_schedule: true, reports: true, backup: true }; and export function isFeatureEnabled(key) { return FEATURES[key] !== false; } with a comment: this is where per-customer plans will switch features on or off later.
4. sql/README.md: explain that every database change is saved here as sql/YYYY-MM-DD_name.sql, plain Postgres, never executed by the AI, run manually by the owner in the Supabase SQL editor, and later used to build Django models.
5. utils/constants.js: APPEND these exports (do not change existing ones): APP_NAME = 'WaveDesk'; APP_CREDIT = 'Programmer, Developer, Architect, Product Manager — Sudipta Shaha'; SCRIPT_WORDS_PER_MINUTE = 130.
Nothing imports the new constants or features yet. Then run the Finish step from docs/RULES.md.
```
 
**টেস্ট:** অ্যাপ আগের মতোই চলবে, কিছু বদলাবে না। Antigravity-র উত্তরে "build passes" ও "0 errors" দেখলেই হবে।
 
---
 
## ধাপ ২ — N3: ক্যামেরা বাগ ও "Cameraman"
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N3 — Camera bug and name "Cameraman"
Bug: in lib/core.js, getActions() case 'Ready for Shoot' builds the Start Shoot action with the check `row.camera_operator`, but the real field used everywhere else (drawer, database, Excel) is `camera_person`. Start Shoot is therefore always blocked even after a camera person is assigned.
1. Change that check to `row.camera_person`. Keep the blocked-reason logic and change its text to "Cameraman must be assigned first".
2. Make every VISIBLE label say "Cameraman": search the whole project (excluding node_modules and .next), case-insensitive, for "camera operator", "camera person", "cameraperson", "cameraman", "operate camera" in UI text, permission labels and hints (lib/core.js PERMISSIONS 'can_camera', utils/constants.js), export column headers (app/page.js Excel export and services/exportService.js), report and My Work screens. Use exactly "Cameraman" (e.g. "Can be Cameraman", "Available in Cameraman dropdown").
3. Do NOT rename any field, column, variable or permission key (`camera_person`, `can_camera` stay). Only visible text and the one wrong property name above.
4. In the final report, list every place you changed.
```
 
**টেস্ট:** একটা কনটেন্টে ক্যামেরাম্যান বসান, স্ট্যাটাস Ready for Shoot করে দেখুন Start Shoot বাটন চলে কিনা। ক্যামেরাম্যান না থাকলে "Cameraman must be assigned first" দেখাবে।
 
---
 
## ধাপ ৩ — N2: স্লাগ সর্বোচ্চ ২৪ অক্ষর
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N2 — Slug name maximum length 24 characters
Today SLUG_MAX is 100 (lib/core.js, near line 206) and normalizeSlugInput() slices to SLUG_MAX.
1. Change the limit to 24. Define the number once; keep using the SLUG_MAX export so existing imports keep working.
2. Make sure EVERY place where a user can type a slug enforces and shows it: the New Content form (components/ui/Modals.js NewContentModal, which already shows "n/SLUG_MAX characters"), the Bulk Schedule Entry rows (components/ui/Modals.js, the slug <input> inside the bulk table around line 540: add normalizeSlugInput and maxLength there), and any other slug input you find (search `slug_name`).
3. Existing contents that already have a slug longer than 24 must NOT be shortened or changed. Only text typed by a user from now on is limited. Displaying a long old slug must keep working.
4. Do not touch the database, the table slug editing (a later task removes it), or anything else.
```
 
**টেস্ট:** নতুন কনটেন্ট বানাতে স্লাগে ২৪-এর বেশি লিখতে পারবেন না। বাল্ক এন্ট্রিতেও একই। পুরনো লম্বা স্লাগ আগের মতো দেখাবে।
 
---
 
## ধাপ ৪ — N1: নাম WaveDesk ও ক্রেডিট
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N1 — App name "WaveDesk" and credit line (visible text only)
Use APP_NAME and APP_CREDIT from utils/constants.js (added in F0).
1. Replace the visible app name "NewsroomOps" with APP_NAME in: the browser tab title in app/layout.js (title becomes "WaveDesk"; keep the description sentence as it is), the header brand text in app/page.js (~line 1224), and components/ui/Shared.js (~line 147, the card eyebrow text).
2. Downloaded file names: change the prefix "newsroom-rundown-" and "newsroom-backup-" to "wavedesk-rundown-" and "wavedesk-backup-" (app/page.js Excel export, components/ui/Modals.js backup JSON and Excel). Search for any other generated file name or PDF/Excel title that contains "newsroom" or "NewsroomOps" in services/exportService.js and change only those that are visible branding.
3. Show the credit line APP_CREDIT in small muted text (a) at the bottom of the login screen (LoginScreen in app/page.js) and (b) in the page footer, below or beside the existing footer buttons, without changing those buttons.
4. Do NOT rename package.json "name", the repo, any variable, component name (e.g. NewsroomApp), storage key, database name, or generic words like "Set up your newsroom" and "Demo Newsroom".
```
 
**টেস্ট:** ব্রাউজার ট্যাব, হেডার, লগইন পাতা ও ফুটারে WaveDesk ও ক্রেডিট লাইন দেখুন। Excel ডাউনলোড করে ফাইলের নাম দেখুন।
 
---
 
## ধাপ ৫ — N4: টেবিলে স্লাগ এডিট বন্ধ, ড্রয়ারে এডিট
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N4 — Slug can be edited only in the drawer, not in the tables
1. In app/page.js the RUNDOWN table (desktop around line 1397 and the mobile list around line 1497) and the PARKING ZONE table (around line 1606) render the slug with an inline <BlurInput ... onCommit={... slug_name ...}>. Replace each with plain, non-editable text that looks exactly the same (uppercase, bold, same size and the same type color class `tc.text`, with the existing lock icon when the script is locked). Clicking the slug must open the drawer like clicking anywhere else on the row. Keep the content-type tag above it and the short-count lines below it unchanged.
2. The drawer currently has NO slug edit field. Add one in components/ui/Drawer.js, in the Metadata tab at the top (above Title, same field style and same permission lock pattern as the Title field): label "Slug name", permission `can_edit_metadata`, uses normalizeSlugInput and SLUG_MAX (24) with an "n/24" counter, saves with the same `patch({ slug_name: ... })` call the Title field uses. Empty slug is not allowed (ignore an empty commit).
3. Do not change anything else.
```
 
**টেস্ট:** টেবিলে স্লাগে ক্লিক করলে ড্রয়ার খুলবে, লেখা বদলানো যাবে না। ড্রয়ারের Metadata ট্যাবে উপরে Slug name ঘরে বদলানো যাবে (যার অনুমতি আছে)।
 
---
 
## ধাপ ৬ — N5: টেবিলে Download Zip বাদ
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N5 — Remove Download Zip from the tables
NOTE (corrected 2026-10-07): the ActionButtons the app really uses is in components/ui/Shared.js (~line 171). components/ui/ActionButtons.js is an unused duplicate; do not edit it. DONE in commit a68b56c (N5b): compact filter in Shared.js now also hides 'download_script'.
1. In compact mode (all table rows: RUNDOWN desktop, RUNDOWN mobile list, PARKING ZONE desktop and mobile) do not render the 'download_script' action at all, on any screen size. If it was the only action, keep the existing empty state for compact mode.
2. Keep the download zip available in the drawer (components/ui/Drawer.js, the download button around line 715) and in My Work (components/ui/Modals.js). Do not change what the zip contains or the action logic in getActions().
```
 
**টেস্ট:** টেবিলের সারিতে (ফোন ও কম্পিউটার দুটোতেই) zip আইকন নেই। ড্রয়ারে zip বাটন আছে ও কাজ করে।
 
---
 
## ধাপ ৭ — N6: সময়ের ক্রম যাচাই
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N6 — Publish-time order (verify, fix only real problems)
Rundown rows are sorted in app/page.js `visible` (around lines 1053-1080): grouped by channel when channelFilter is 'all', then by rowTimeIn(...).
1. Verify the rows are in ascending order of the time shown in each row's Time cell, inside each channel group, and also when a single channel is selected. Include rows that appear because a SHORT is due in the range (they must be ordered by that short's time, not the main content's time) and multi-day ranges (date first, then time).
2. PARKING ZONE: show contents that have a scheduled time first, ascending by that time, then contents without a time, newest created first.
3. Fix only what is not already like this. If everything already behaves like this, change nothing and say so.
```
 
**টেস্ট:** কয়েকটা কনটেন্ট উল্টোপাল্টা সময়ে বানান। প্রতিটা চ্যানেলের ভেতরে সময় অনুযায়ী ওপর থেকে নিচে সাজানো থাকতে হবে।
 
---
 
## ধাপ ৮ — N16: পাবলিশড লিংক খোলা
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N16 — Open published links from the app
1. Add a pure helper `safeHttpUrl(value)` to utils/helpers.js: returns a clean absolute URL string only if the value is an http:// or https:// link (trim spaces; if it starts with "www." prepend "https://"); otherwise returns null. Comment with examples: "https://youtu.be/x" -> same; "www.fb.com/x" -> "https://www.fb.com/x"; "javascript:alert(1)" -> null; "" -> null.
2. In components/ui/Drawer.js, near the title area at the top of the drawer (and visible without scrolling), add a button "View Published Content". Show it only when safeHttpUrl(row.live_video_url) is not null. It opens that URL in a new tab with target="_blank" and rel="noopener noreferrer".
3. In the Assets & Shorts tab, next to the "Live video URL" row and next to each short's URL, show a small "open link" icon button (same safe rules) when the value is a valid link.
4. Never make an unsafe link clickable. No embedded players. No other changes.
```
 
**টেস্ট:** Live video URL ঘরে একটা YouTube লিংক বসান। ড্রয়ারের ওপরে "View Published Content" আসবে ও ক্লিকে নতুন ট্যাবে খুলবে। ভুল ধরনের লিংক বসালে বাটন আসবে না।
 
---
 
## ধাপ ৯ — N19: স্ক্রিপ্টের সময় (১৩০ শব্দ/মিনিট)
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N19 — Script duration as m:ss at 130 words per minute
Today components/ui/Drawer.js ScriptTab computes `words` and `minutes = max(1, round(words/150))` and shows "{words} words · about {minutes} min on air".
1. Create utils/scriptDuration.js with a pure function scriptStats(text) using SCRIPT_WORDS_PER_MINUTE (130, from utils/constants.js). Word count uses the same method as today (trim, split on whitespace, empty text = 0 words). Return { words, seconds, label } where seconds = Math.round(words / 130 * 60) and label is "m:ss" (minutes without leading zero, seconds two digits). Examples in a comment: 130 words -> "1:00"; 65 words -> "0:30"; 0 words -> "0:00"; 300 words -> "2:18".
2. In ScriptTab show "{words} words · {label} on air" instead of the old text. While the user is editing, compute it from the live draft text; otherwise from the saved script.
3. Also show a small "Script {label}" chip in the drawer header area (near the title, same area as the content type/status chips) when the saved script has at least 1 word.
4. The speed is fixed at 130 words per minute; there is no setting for it. Do not show the duration in the tables. No other changes.
```
 
**টেস্ট:** স্ক্রিপ্টে ১৩০ শব্দ লিখলে "1:00 on air" দেখাবে। লেখার সময় সংখ্যা সঙ্গে সঙ্গে বদলাবে। ড্রয়ারের ওপরে ছোট "Script 1:00" চিহ্ন থাকবে।
 
---
 
## ধাপ ১০ — N21: স্ক্রিপ্ট অটো-ড্রাফট (স্তর ১)
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N21 — Script auto-draft in the browser (level 1, no database change)
Today ScriptTab (components/ui/Drawer.js) keeps the text being edited in React state `draft`; nothing survives a closed tab, dead battery or lost connection until "Save script" is pressed.
1. Create utils/scriptDraft.js (plain JS, no React): functions saveDraft(storage, key, record), loadDraft(storage, key), clearDraft(storage, key), purgeOldDrafts(storage, maxAgeDays = 30, maxCount = 50). `storage` is passed in (window.localStorage) so the module is testable. Every storage call is wrapped in try/catch and failures are ignored silently (private mode must not break editing). Record = { text, savedAt (ISO), baseScript (the saved script text when editing started) }. Key = 'wd-script-draft:' + content id.
2. In ScriptTab, only for users who can edit: while editing, save the draft 1.5 seconds after the last keystroke (debounced) and also on blur, on document visibilitychange (hidden) and on pagehide.
3. When the Script tab opens (or Edit is pressed) and a stored draft exists whose text differs from the current saved script, show a clear banner above the editor: "Unsaved draft from <time> found." with buttons "Restore draft" and "Discard draft". Never overwrite the saved script automatically. If the saved script changed since the draft was started (baseScript differs from the current saved script), add the warning "The script was changed by someone else after this draft was started." and still let the user choose.
4. When "Save script" succeeds, or the user presses Cancel/Discard in the editor, clear that draft. Closing the drawer or leaving the page with unsaved typed text shows the browser's standard leave warning (beforeunload) while the editor is dirty.
5. Respect the existing rules: locked scripts, 'can_edit_script' permission and manager override stay exactly as they are. Do not change how the script is saved to the database. Call purgeOldDrafts once when the app loads. Wrap the whole feature in isFeatureEnabled('script_drafts') from utils/features.js (if it is false, behave exactly as today).
```
 
**টেস্ট:** স্ক্রিপ্টে কিছু লিখে Save না করে ট্যাব বন্ধ করুন। আবার খুলে ওই কনটেন্টের স্ক্রিপ্ট ট্যাবে "Unsaved draft found" আসবে ও Restore করলে লেখা ফিরে আসবে। Save করলে ড্রাফট মুছে যাবে।
 
---
 
## ধাপ ১১ — N20: টেলিপ্রম্পটার
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N20 — Teleprompter ("Script Play")
Build it yourself with CSS and browser APIs. No new package.
1. Create utils/teleprompter.js (plain JS, no React/DOM imports): pure helpers such as speedToPixelsPerSecond(level) (levels 1-10), clampFontSize(px) (24-140), and a function to compute the next scroll position from elapsed time. Add 2-3 input->output examples in comments.
2. Create components/ui/Teleprompter.js: a thin React full-screen overlay component with props { text, onClose }. Look: fixed full screen, background #000, text white, large readable font (default 56px, line-height 1.5), centered column with generous side padding, paragraphs preserved, a faint horizontal reading guide at about 35% of the screen height, extra empty space above and below the text so it starts and ends comfortably. It auto-scrolls smoothly (requestAnimationFrame) and stops at the end.
3. Controls (small, semi-transparent bar that hides itself 3 seconds after the last interaction while playing; tap or mouse move shows it again): Play/Pause, Restart, Speed - and + (1-10, default 4), Font size - and +, Mirror (horizontal flip of the text), Flip vertical (optional second toggle), Close. Keyboard: Space = play/pause, ArrowUp/ArrowDown = speed, + and - = font size, M = mirror, R = restart, Esc = close. Remember speed, font size and mirror choices in localStorage ('wd-prompter') with try/catch.
4. Keep the screen awake while open using navigator.wakeLock.request('screen') when available (wrap in try/catch, release on close, re-request when the tab becomes visible again).
5. In components/ui/Drawer.js ScriptTab, add a button "Script Play" below the script text (visible to everyone who can see the script, only when the script has text). It opens the Teleprompter with the saved script. It never edits the script. Skip the button if isFeatureEnabled('teleprompter') is false.
6. Must work on phone and tablet (touch: tap to show controls) and desktop. Bangla text must render properly (do not set a font that lacks Bangla glyphs; keep the app's font stack).
```
 
**টেস্ট:** স্ক্রিপ্ট ট্যাবের নিচে "Script Play" চাপুন। কালো পর্দায় সাদা লেখা নিজে নিজে উঠবে। স্পিড, ফন্ট সাইজ, মিরর বদলে দেখুন; Space চাপলে থামবে; Esc-এ বের হবে। ফোনেও চেষ্টা করুন।
 
---
 
## ধাপ ১১খ — N24: স্ক্রিপ্ট রিচ টেক্সট এডিটর (Tiptap, বোল্ড/আন্ডারলাইন/হাইলাইট)
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N24 — Rich text editor for scripts (bold, underline, highlight) using the open-source Tiptap editor (MIT licence).
Storage decision: the script stays in the existing `script` column (no database change). Old plain-text scripts must keep working. A script edited with the new editor is stored as a small HTML string made only of <p>, <br>, <strong>, <u>, <mark> (no attributes). An empty script must always be stored as '' (empty string), never '<p></p>'.
 
1. Install (this is the ONE task allowed to add packages): npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-highlight. Use the latest stable versions that work with React 18.3.1 and Next 14.2.15 (check peer dependencies). Use ONLY free MIT packages (no Pro/cloud extensions). If the installed StarterKit already includes Underline, do not add the separate underline extension (no duplicate extension warning). Show `npm ls @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-highlight` and the licence of each in the report.
 
2. Create utils/scriptRich.js (plain JS, no React, Django-ready, with input->output examples in comments):
   - isRichScript(s): true when the string starts (after optional whitespace) with `<p` followed by `>` or a space.
   - plainTextToHtml(text): escape & < > and convert plain text to HTML: paragraphs split on blank lines (2+ newlines) -> <p>…</p>, single newline inside a paragraph -> <br>. '' -> ''.
   - scriptToHtml(stored): if isRichScript -> stored, else plainTextToHtml(stored).
   - scriptToPlainText(stored): if not rich return stored as is (or ''); if rich: `</p>` followed by `<p` -> two newlines, <br> -> newline, strip all tags, decode only &amp; &lt; &gt; &quot; &#39; &nbsp; with a small regex map (no DOM needed), trim.
   - normalizeEditorHtml(html): if scriptToPlainText(html).trim() is empty return '' else return html.
   - sanitizeScriptHtml(html): whitelist sanitizer for DISPLAY. Allowed tags: p, br, strong, b (convert to strong), u, mark. Remove every attribute. Unknown tags are removed but their text is kept; <script>, <style>, <iframe> and similar are removed together with their content. Use DOMParser when typeof DOMParser !== 'undefined'; otherwise fall back to escaping the plain-text version. Never return anything that contains an on* attribute, javascript: or any tag outside the whitelist.
 
3. Create components/ui/ScriptEditor.js ('use client'): a Tiptap editor component with props { value, onChange, onBlur, autoFocus }.
   - The editor is uncontrolled after mount: it starts from scriptToHtml(value) once. Do not push later prop changes into the editor.
   - Schema: ONLY paragraph, text, hard break (Shift+Enter), bold, underline, highlight (single colour, NO multicolor option), and undo/redo history. Disable everything else in StarterKit (headings, lists, blockquote, code, code block, horizontal rule, italic, strike, etc.) so pasted content from Word or web pages keeps only paragraphs, bold, underline and highlight.
   - Call useEditor with immediatelyRender: false. onUpdate -> onChange(normalizeEditorHtml(editor.getHTML())). onBlur -> call the onBlur prop.
   - Toolbar above the editor with three buttons: Bold (B), Underline (U), Highlight (a marker icon or "H"), showing the active state; keyboard shortcuts Ctrl+B, Ctrl+U, Ctrl+Shift+H. Buttons use onMouseDown={(e) => e.preventDefault()} so the text selection is kept. Every button is at least 36x36 px for touch; the toolbar stays visible on phones.
   - Editing area look: same style as the current textarea (inputBase-like border/background, min-height about 18 rows ≈ 400px, font-size 16px, leading-8) and the SAME font stack as today: fontFamily 'Georgia, "Noto Serif Bengali", "Times New Roman", serif'. Highlight look: yellow background (#facc15) with dark text (#111827), small rounded corners. Underline normal. Paragraph spacing like the read view.
   - Placeholder "Write the script…" (CSS placeholder on the empty first paragraph, no extra package).
   - Bangla must type, select and delete properly (no custom font without Bangla glyphs).
 
4. In components/ui/Drawer.js ScriptTab (edit directly, only these parts):
   a. Load the editor with next/dynamic: const ScriptEditor = dynamic(() => import('./ScriptEditor'), { ssr: false }); (so the editor code loads only when someone edits).
   b. Edit mode: replace ONLY the <textarea …> element with <ScriptEditor value={draft} onChange={setDraft} onBlur={() => { if (draftsEnabled) saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current }); }} autoFocus />. Keep the existing Cancel / Save script buttons, the draft banner, the permission and lock logic and the Save handler exactly as they are.
   c. Read mode: where the script is shown (the <article> that maps text.split(/\n{2,}/)), show sanitizeScriptHtml(scriptToHtml(row.script)) with dangerouslySetInnerHTML inside the same <article> (same classes and font). Style inside it: p with bottom margin like today (mb-5, last none), mark = yellow background #facc15 with dark text #111827 and small rounded corners, u underlined, strong bold (use Tailwind arbitrary variants like [&_mark]:bg-yellow-300 or a small scoped <style> tag). The article must look the same as before for old plain-text scripts.
   d. The "Script Play" button visibility: use scriptToPlainText(row.script).trim() instead of row.script, and pass text={scriptToPlainText(row.script)} to <Teleprompter /> (the teleprompter stays plain text for now).
   e. The Copy button (doCopy): copy scriptToPlainText(row.script), not the HTML. The `text` variable used for "is there a script" must also use the plain-text version.
 
5. Other places that must treat the script as plain text (one-line changes only):
   - utils/scriptDuration.js scriptStats(): first convert with scriptToPlainText(text) (insert a space for tags happens inside scriptToPlainText via newlines) and then count words as today.
   - app/page.js line ~495 (activity text for field === 'script'): count words of scriptToPlainText(v).
   - app/page.js line ~876 (copy_script action): copy scriptToPlainText(row.script) || 'No script'.
   Do NOT change lib/core.js, services/exportService.js, components/ui/Modals.js (the new-content form keeps its plain textarea), the draft helper utils/scriptDraft.js, or anything about permissions/locking.
 
6. Add `rich_editor: true` to FEATURES in utils/features.js. If isFeatureEnabled('rich_editor') is false, ScriptTab uses the old <textarea> exactly as before, but its value is scriptToPlainText(draft) and read mode shows plain text (no formatting).
 
7. Edit the code directly. Do not use find-and-replace scripts that silently skip when nothing matches. Do not change anything else. Do not create temporary files.
 
When finished: run `npm run build` and the undefined-name check (docs/check-undefined.eslintrc.json) AFTER the last edit and tell me the exit code of each (both must be 0). Do NOT commit or push. Delete any temporary scripts. Show: `git status`, `git diff --stat`, the `npm ls` output from step 1, and `Select-String -Path components\ui\Drawer.js -Pattern "ScriptEditor|sanitizeScriptHtml|scriptToPlainText|scriptToHtml"`. Also confirm that the first line of every edited file that had 'use client' still is 'use client'.
```
 
**টেস্ট:** স্ক্রিপ্ট এডিটে বোল্ড, আন্ডারলাইন, হাইলাইট দিন; Save করে আবার খুলুন; পুরনো সাধারণ স্ক্রিপ্ট আগের মতো দেখায় কি না; বাংলা লিখুন; Word থেকে পেস্ট করুন; Copy ও Script Play-তে সাধারণ লেখা আসে কি না।
 
---
 
## ধাপ ১২ — N18: নোটিফিকেশন সাউন্ড
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N18 — Unique soft notification sound
Build it with the browser Web Audio API. No audio file, no package.
1. Create utils/notifySound.js (plain JS, no React): playChime() and unlockAudio(). The chime is original and gentle: three short sine/triangle notes (a small rising-then-settling motif, for example around D5, A5, F#5), soft attack and smooth decay, total length at most 0.8 seconds, peak gain at most 0.12, no harsh or percussive sound, and it must not imitate the Facebook, Messenger or WhatsApp tones. A shared AudioContext is created lazily. Every call is wrapped in try/catch.
2. unlockAudio(): resume the AudioContext on the first user click or touch anywhere in the app (add the listener once, remove it after the first use), because browsers block sound before a user gesture.
3. In NotificationBell (app/page.js, around line 1803) play the chime only when a NEW notification row arrives for this member through the realtime subscription (event type INSERT). Do not play on the first load, on mark-as-read or on updates. Play only if sound is enabled.
4. Add a small speaker/mute icon button next to the bell that toggles sound on and off, remembered in localStorage ('wd-sound', default on, use try/catch). Show a tooltip "Notification sound on/off".
5. Skip all of this if isFeatureEnabled('notif_sound') is false. Do not change the notifications table, the bell's unread count, or anything else.
```
 
**টেস্ট:** দুটো ব্রাউজার/ডিভাইসে দুজনে লগইন করুন। একজন অন্যজনকে কোনো কাজ assign করলে দ্বিতীয়জনের ডিভাইসে মোলায়েম সাউন্ড বাজবে (পাতায় আগে একবার ক্লিক করা থাকতে হবে)। স্পিকার বাটনে বন্ধ করলে সাউন্ড বাজবে না।
 
---
 
## ধাপ ১৩ক — N25: "Research & Script" এক নাম + ড্রয়ারে নির্ধারিত নাম সবসময় দেখানো
 
> ৮ অক্টোবর যোগ (ব্যবহারকারীর অভিযোগ থেকে): টেবিলে "Script" নামে ও ড্রয়ারে "Research & Script" নামে একই ফিল্ড (`writer`); ড্রয়ারের ড্রপডাউনে নাম দেখা যেত না কারণ তালিকা দক্ষতা-ফিল্টার করা।
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N25 — One name for the writer field ("Research & Script") and make the drawer always show the assigned name
Facts (already checked in the code): the table cell and the drawer use the SAME data field, `writer`. The two desktop tables (RUNDOWN and PARKING ZONE in app/page.js, the Staff Assignment cells, around lines 1444 and 1562) label it "Script:", the drawer (components/ui/Drawer.js, OverviewTab) labels it "Research & Script". Problem: the drawer's CreditSelect is a native <select> whose options are filtered by skill (can_write, or owner/manager). If the saved name is not in that filtered list (for example the person has no "Can Write & Submit" tick, is inactive, or was typed before), the select cannot show it and displays "— Unassigned —" although row.writer has a name and the table shows it.
1. components/ui/Drawer.js, function CreditSelect only: keep the filtering rules exactly as they are, but if row[field] is not empty and no option has that value, render one extra <option value={row[field]}>{row[field]}</option> right after the "— Unassigned —" option, so the current name is always shown and selected (same idea as SelectBox in components/ui/Shared.js). Do not change disabled logic, permissions, the filter, or any other component. (This helps every CreditSelect field: Idea, Research & Script, Producer, Cameraman, Video Editor, Uploader, and the extended ones.)
2. app/page.js, the two desktop tables only: in each Staff Assignment cell change the label text "Script:" to "Research & Script:" and change the class w-[60px] to w-[110px] on ALL THREE label spans of that cell (Research & Script, Presenter, Video Edit) so the names stay aligned. Do not change the Presenter / Video Edit label text. Do not touch mobile lists or anything else.
3. Edit the code directly (no find-and-replace scripts that silently skip). Create no temporary files.
 
When finished: run `npm run build` and the undefined-name check (docs/check-undefined.eslintrc.json) AFTER the last edit and tell me the exit code of each (both must be 0; if eslint is missing install with `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`, never modify package.json). Do NOT commit or push. Delete any temporary scripts. Show: `git status`, `git diff --stat`, the complete `git diff components/ui/Drawer.js` and `git diff app/page.js`, and `Select-String -Path app\page.js -Pattern "Script:|w-\[110px\]|w-\[60px\]"`. Confirm the first line of app/page.js and components/ui/Drawer.js is still 'use client';.
```
 
**টেস্ট:** টেবিলের Staff Assignment ঘরে "Research & Script:" লেখা দেখা যাবে। যার নাম আগে ড্রয়ারে দেখাত না, ড্রয়ার খুললে এখন তার নাম দেখা যাবে। ড্রয়ারে নাম বদলালে টেবিলেও বদলাবে।
 
---
 
## ধাপ ১৩ — N7: টেবিল থেকেই Writer/Presenter/Video Editor বসানো
 
> ৮ অক্টোবর সংশোধিত: আসল কোড দেখে লেখা। আগের সংস্করণে "typing-with-suggestions picker" ছিল, কিন্তু অ্যাপে আসলে সাধারণ ড্রপডাউন (`<select>`) আছে; তাই ছোট নতুন কম্পোনেন্ট `StaffAssignSelect`/`StaffCell` ব্যবহার করা হয়েছে। অনুমতি `FIELD_PERM` থেকে।
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N7 — Assign Writer, Presenter and Video Editor directly from the two desktop tables
Facts (already checked in the code): the "Staff Assignment" cell exists in the RUNDOWN desktop table (app/page.js, the <td> that renders r.writer / r.presenter_name / r.video_editor, around lines 1443-1448) and in the PARKING ZONE desktop table (around lines 1561-1566). Today they only show names or "Unassigned". In the drawer (components/ui/Drawer.js) the same fields are plain <select> dropdowns: CreditSelect (private, not exported) for writer and video_editor, and SelectBox (components/ui/Shared.js) for presenter. patchRow in app/page.js already enforces FIELD_PERM, the audit log, notifications and error toasts.
 
1. Create components/ui/StaffAssignSelect.js ('use client') exporting two things:
   a. StaffAssignSelect({ value, names, placeholder, onChange }): a compact native <select> (text-[11px], rounded-md, thin border, transparent background, max width about 150px, truncate, options with the dark background bg-[#121215] like SelectBox). The empty option's label is the placeholder (for example "+ Assign") when value is empty, otherwise "— Unassigned —". If value is not in names (for example an inactive person) add it as an option so the current name stays visible. The select and its wrapper must stop click, mousedown and keydown propagation so the table row does NOT open the drawer.
   b. StaffCell({ r, team, actor, patchRow }): renders the three lines exactly like today's markup (label column w-[110px], text-[11px], flex-col gap-1): "Research & Script:" (field writer), "Presenter:" (field presenter_name), "Video Edit:" (field video_editor).
      - A line is editable only when actor exists, actor.active !== false and can(actor, FIELD_PERM[field]) is true (import can and FIELD_PERM from '../../lib/core'). Editable line = label + StaffAssignSelect (shown even when empty, placeholder "+ Assign" on all three). Non-editable line = EXACTLY today's read-only display (label + <PersonName name=… team={team} hideDesignation /> only when a value exists).
      - If no line was rendered at all, show today's italic "Unassigned" text.
      - Name lists must be exactly the drawer's: writer -> team.filter((t) => t.can_write || t.role === 'owner' || t.role === 'manager').map((m) => m.full_name); video_editor -> same with t.can_edit_video; presenter -> team.filter((m) => m.active !== false).map((m) => m.full_name) (the drawer has no skill filter for presenter).
      - onChange(v) -> patchRow(r.id, { [field]: v }) (v may be '' to clear, as the drawer allows). Do not await, do not add your own error handling: patchRow already shows the error toast and rolls back.
2. In app/page.js import { StaffCell } from '../components/ui/StaffAssignSelect' and replace ONLY the inner <div className="flex flex-col gap-1 text-[11px]">…</div> of the Staff Assignment <td> in the two desktop tables with <StaffCell r={r} team={team} actor={actor} patchRow={patchRow} />. Keep the <td> and its classes. Do not touch mobile lists, the drawer, lib/core.js or anything else.
3. Edit the code directly; do not use find-and-replace scripts that silently skip when nothing matches. Create no temporary files.
 
When finished: run `npm run build` and the undefined-name check (docs/check-undefined.eslintrc.json) AFTER the last edit and tell me the exit code of each (both must be 0; if eslint is missing install with `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`, never modify package.json). Do NOT commit or push. Delete any temporary scripts. Show: `git status`, `git diff --stat`, the complete components/ui/StaffAssignSelect.js, the complete `git diff app/page.js`, and `Select-String -Path app\page.js -Pattern "StaffCell|Video Edit:"` (StaffCell must appear in the import and exactly 2 usages; "Video Edit:" must no longer appear in app/page.js). Confirm the first line of app/page.js is still 'use client';.
```
 
**টেস্ট:** দুই টেবিলেই (রানডাউন ও পার্কিং জোন) সারির "Staff Assignment" ঘরে ড্রপডাউন দেখা যাবে (অনুমতি থাকলে)। একটা নাম বাছলে সঙ্গে সঙ্গে সেভ হবে, ড্রয়ার খুলবে না। "— Unassigned —" বাছলে নাম মুছবে। অনুমতি না থাকলে আগের মতো শুধু নাম দেখা যাবে।
 
---
 
## ধাপ 13খ — N26: সব "Writer" লেবেল → "Research & Script" (শুধু দেখানো লেখা বদল)
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N26 — Rename all "Writer" labels to "Research & Script" (visible text only)
Modals.js: line ~143 label "7 · Writer" → "7 · Research & Script"; ~144 placeholder "Select writer" → "Select research & script"; ~516 <th>Writer</th> → Research & Script; ~759 roleTotals key Writer → 'Research & Script'; ~766 roles.push('Writer') → 'Research & Script' (must match the roleTotals key!); ~895 ALL_ROLES label 'Writer' → 'Research & Script' (key 'writer' unchanged).
lib/core.js: ~324 TRACKED_FIELDS writer: 'Writer' → 'Research & Script'; ~51 hint 'Available in Writer dropdown' → 'Available in Research & Script dropdown'.
Do NOT touch: field key 'writer', r.writer, variable names, demo designation 'Senior Writer', comments, Drawer tooltip.
Direct edits only, Select-String proof, build + eslint exit 0, no commit.
```
 
---
 
## ধাপ 13গ — N26b: বাকি দুটো "writer" লেখা
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N26b — Remaining two visible "writer" strings
Modals.js ~388 `title="By writer"` → `"By research & script"`; utils/constants.js ~31 hint "writer" → "research & script". Display text only, direct edits, proof, build+eslint, no commit.
```
 
---
 
## ধাপ ১৪ — N8 (বদলানো): ড্রয়ারে "Saving… / Saved ✓ / Not saved" সূচক + Esc-এ শেষ লেখা সেভ
 
> ৮ অক্টোবর: পুরনো "Save বাটন" বাতিল (ব্যবহারকারী চান না)। সেভের নিয়ম বদলায় না।
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N8 (replaces the old "Save button" idea) — "Saving… / Saved ✓ HH:MM / Not saved" indicator in the drawer header, plus save the last typed text when Esc closes the drawer. NO change to how or when anything is saved.
 
Facts (checked in the code): components/ui/Drawer.js, function Drawer (~line 777). It defines `const patch = (p) => onPatch(row.id, p);` and passes `patch` to every tab. onPatch is patchRow from app/page.js: it is async and returns true on success / false on failure (it already shows an error toast and rolls back on failure). ScriptTab does `const ok = await patch({ script: draft })`, so the wrapped patch MUST still return that same boolean. Text fields (BlurInput in components/ui/Shared.js) save on blur or Enter. app/page.js has a window Escape listener that closes the drawer (it unmounts the inputs without a blur, so the last typed text can be lost).
 
Edit ONLY components/ui/Drawer.js, inside function Drawer:
1. State: `const [saveState, setSaveState] = useState({ status: 'idle', at: null });` and a ref `pendingRef = useRef(0)`.
2. Replace `const patch = (p) => onPatch(row.id, p);` with an async wrapper:
   - pendingRef.current += 1; setSaveState({ status: 'saving', at: null });
   - let ok = false; try { ok = await onPatch(row.id, p); } catch (e) { ok = false; }
   - pendingRef.current -= 1;
   - if (pendingRef.current === 0) setSaveState(ok ? { status: 'saved', at: new Date().toISOString() } : { status: 'error', at: null });
   - return ok;
   Do not change what is sent to onPatch. Do not add error toasts (patchRow does that).
3. Reset on row change: in the existing `useEffect(() => { setTab('overview'); }, [row.id]);` ALSO reset `pendingRef.current = 0; setSaveState({ status: 'idle', at: null });` (add inside that same effect, keep setTab).
4. Indicator: in the header, next to the Close (x) button, wrap the close button and the indicator in `<div className="flex items-center gap-2 shrink-0">`. Indicator is a `<span aria-live="polite" className="text-[11px] ...">`:
   - idle: render nothing;
   - saving: "Saving…" in text-zinc-500;
   - saved: "Saved ✓ " + formatTime(saveState.at) (formatTime is already imported in this file; use it exactly as the header already does with formatTime(row.scheduled_publish_time)) in text-emerald-400;
   - error: "Not saved" in text-red-400.
   Keep the close button's existing classes and aria-label unchanged.
5. Esc safety: add one `useEffect` in Drawer that registers `window.addEventListener('keydown', fn, true)` (CAPTURE phase) and removes it on cleanup. fn: if (e.key !== 'Escape') return; const el = document.activeElement; if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.closest('aside')) el.blur(); — this makes the existing blur-commit save the typed text before the drawer closes. Do NOT call preventDefault or stopPropagation (Esc must still close the drawer as today). Only INPUT/TEXTAREA (not the rich script editor, which has its own draft).
6. Do not touch app/page.js, Shared.js, any tab component, lib/, or anything else. Edit directly (no find-and-replace scripts that silently skip; Windows CRLF). Create no temporary files.
 
Finish: run `npm run build` and `npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js` AFTER the last edit; report both exit codes (both must be 0; if eslint is missing: `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`, never modify package.json). Do NOT commit or push. Delete any temp scripts. Show: `git status`, `git diff --stat`, the complete `git diff components/ui/Drawer.js`, and `Select-String -Path components\ui\Drawer.js -Pattern "saveState|pendingRef|Saved|Not saved|Saving"`. Confirm first line of Drawer.js is still 'use client';.
```
 
---
 
## ধাপ ১৫ — N9: কর্তৃপক্ষ প্যানেল গোছানো
 
> ৮ অক্টোবর সংশোধিত: আসল কোড দেখে (লাইন ~১৬৭৭–১৭০৪; বাটনের নাম "Team & permissions" অপরিবর্তিত; বর্ণনা যোগ; সব হ্যান্ডলার হুবহু)।
 
```text
Read docs/RULES.md first and follow it strictly.
 
TASK N9 — Organize the "কর্তৃপক্ষ" panel (layout only; no behavior change)
Facts (checked in the code): in app/page.js the header button "কর্তৃপক্ষ" (visible only when isManager(actor) || isOwner(actor), around line 1629) sets showAuthority. The panel is `{showAuthority ? (<ModalShell onClose={() => setShowAuthority(false)} title="কর্তৃপক্ষ"> <div className="flex flex-col gap-3 p-4"> …7 buttons… </div></ModalShell>) : null}` (around lines 1677-1703). Its 7 buttons, in order, each `className={btnGhost + " justify-start"}`, each starting with setShowAuthority(false):
  1. Bulk Schedule Entry (Icon calendar) -> setBulkOpen(true)
  2. Report (Icon chart) -> setShowEmpReport(true)
  3. Backup (Icon download) -> setShowBackup(true)
  4. Team & permissions (Icon users) -> setShowTeam(true)
  5. Add channel (Icon plus) -> setShowAddChannel(true)
  6. KPI report (Icon chart) -> downloadKPIReport(visible)
  7. Excel export (Icon download) -> exportXlsx()
 
1. Replace ONLY the inner `<div className="flex flex-col gap-3 p-4">…</div>` of this ModalShell with the same buttons regrouped under small section headings, in this order:
   - "People & access": Team & permissions — description "Add users, roles and permissions"
   - "Channels": Add channel — "Create a new channel"
   - "Schedule": Bulk Schedule Entry — "Add many rundown items at once"
   - "Reports": Report — "Employee work report"; KPI report — "Download the KPI report"; Excel export — "Export the rundown to Excel"
   - "Data": Backup — "Back up all system data"
   Heading style: `text-[11px] font-semibold uppercase tracking-wider text-zinc-500` with small top spacing between sections. Each button keeps its Icon, its EXACT label text (do NOT rename any button), its btnGhost style and its EXACT onClick handler (copy each handler unchanged, including setShowAuthority(false) first). Inside each button put the label and below it the description as a second line in `text-[11px] text-zinc-500` (button content may be wrapped in a small flex-col; the onClick stays on the <button>).
2. Keep it compact for a phone screen: short descriptions on one line, and put `max-h-[75vh] overflow-y-auto` on the inner container as a safety net.
3. Do NOT change who can see the panel, the header "কর্তৃপক্ষ" button, the modal title, any handler, any other modal, or any other file. Do not add "Add show" or notices (later tasks). No new imports are needed.
4. Edit the code directly (no find-and-replace scripts that silently skip; Windows CRLF). Create no temporary files. Keep any non-ASCII text exactly (the title is Bengali: কর্তৃপক্ষ — do not retype it; leave the title line untouched).
 
Finish: run `npm run build` and `npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js` AFTER the last edit; report both exit codes (both must be 0; if eslint is missing: `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`, never modify package.json). Do NOT commit or push. Delete any temp scripts. Show: `git status`, `git diff --stat`, the complete `git diff app/page.js`, and `Select-String -Path app\page.js -Pattern "setBulkOpen\(true\)|setShowEmpReport\(true\)|setShowBackup\(true\)|setShowTeam\(true\)|setShowAddChannel\(true\)|downloadKPIReport\(visible\)|exportXlsx\(\)"` (each of these must still exist in the panel exactly once). Confirm the first line of app/page.js is still 'use client';.
```
 
**টেস্ট:** Owner বা Manager দিয়ে কর্তৃপক্ষ বাটন খুলুন। বাটনগুলো ভাগে সাজানো দেখাবে, প্রতিটার নিচে ছোট বর্ণনা, আর প্রতিটা আগের মতো কাজ করবে। সাধারণ ইউজারের কাছে বাটন থাকবে না।
 
---
 
## ধাপ ১৬ — ডেটাবেসের ছবি (schema snapshot) — আপনার কাজ
 
ধাপ ১৫ শেষ হলে Supabase → SQL Editor খুলে নিচের কোডটা Run করুন। ফল একটাই ঘরে লেখা আসবে। সেই ঘরের পুরো লেখা কপি করে আমাকে পাঠান। এতে পাসওয়ার্ড বা গোপন তথ্য নেই, শুধু টেবিল, কলাম ও নিয়মের নাম আছে।
 
```sql
select jsonb_pretty(jsonb_build_object(
  'columns', (select jsonb_agg(jsonb_build_object('t',table_name,'c',column_name,'type',data_type,'null',is_nullable,'def',column_default) order by table_name, ordinal_position) from information_schema.columns where table_schema='public'),
  'constraints', (select jsonb_agg(jsonb_build_object('t',conrelid::regclass::text,'n',conname,'def',pg_get_constraintdef(oid))) from pg_constraint where connamespace='public'::regnamespace),
  'policies', (select jsonb_agg(jsonb_build_object('t',tablename,'n',policyname,'cmd',cmd,'using',qual,'check',with_check)) from pg_policies where schemaname='public'),
  'triggers', (select jsonb_agg(jsonb_build_object('t',event_object_table,'n',trigger_name)) from information_schema.triggers where trigger_schema='public'),
  'functions', (select jsonb_agg(proname) from pg_proc where pronamespace='public'::regnamespace)
)) as schema_snapshot;
```
 
এই ছবি পাওয়ার পর আমি ধাপ ১৭–২২ এর প্রম্পট ও SQL লিখব।
 
---
 
## ধাপ ২৩ — N13: থিম (সবার শেষে, আলাদা branch-এ)
 
```text
Read docs/RULES.md first and follow it strictly. Work on a separate git branch named themes (do not touch main).
 
TASK N13 — User-selectable themes: Dark, Light, Ocean, Forest, Sunset
Today the theme is 'dark' or 'light': app/page.js (around lines 554-562) stores it in localStorage key 'nw-theme', app/layout.js sets class 'light' on <html> with an inline script before paint, and app/layout.js contains the CSS that restyles the app for the light class.
1. First read how the light theme is implemented in app/layout.js and report in 5 lines. Do NOT rewrite Tailwind classes across components.
2. Add three themes the same way light mode works today: html classes `theme-ocean` (deep blue/teal dark background, cyan/sky accent), `theme-forest` (deep green dark background, emerald accent), `theme-sunset` (warm dark plum/brown background, orange/amber accent). Implement them as CSS overrides (CSS variables where practical) placed next to the light theme CSS. Keep the same dark base layout, good text contrast (readable white-ish text), and make sure badges, status colors, modals, the drawer, tables and the teleprompter overlay remain readable. 'light' and 'dark' must look exactly as they do today.
3. Replace the Light/Dark toggle button in the footer with a small theme picker (a button that opens a short list of 5 themes with a color dot each, current one marked). Keep the same footer position and size. Store the choice in the same localStorage key 'nw-theme' (values: dark, light, ocean, forest, sunset; the old values keep working). Choice applies instantly and stays for that user's browser.
4. Update the inline script in app/layout.js so every theme class is applied before first paint (no flash). Fall back to dark for unknown values. Wrap storage access in try/catch. Put the theme list (id, label, dot color) in utils/constants.js. Skip the picker (fall back to the old dark/light toggle) if isFeatureEnabled('themes') is false.
5. No database changes. No other changes.
```
 
**টেস্ট:** ফুটারের থিম বাটন থেকে পাঁচটা থিম বদলে দেখুন। প্রতিটায় টেবিল, ড্রয়ার, মডাল, স্ট্যাটাস ব্যাজ পড়া যায় কিনা দেখুন। পাতা রিফ্রেশ করলে বাছা থিম থাকবে ও ঝলক (flash) দেবে না।
 
