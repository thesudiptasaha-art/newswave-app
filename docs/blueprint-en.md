# NewsroomOps (NewsWave) — Product & Technical Blueprint

Oct 1, 2026 · @EEA

## 1. What this product is

NewsroomOps (brand name NewsWave) is a web app that runs the daily content rundown of a video news team: every video, from script to publish, is one row that moves through a fixed pipeline, and everyone sees the same live table.

**Who it is for.** Video and digital news teams that publish many items a day across several channels. The first customer is the owner's own team, which runs seven channels (The Wave 24, World, Money, Sports, Faith, Life, Glam). The product is designed as B2B SaaS, so every table carries an organization id, but only one organization is in use today.

**The core idea.** Replace spreadsheets and chat threads with one rundown table where each content item has an owner, a status, a scheduled publish time and a full history. The status can only move along allowed steps, and only the people with the right permission can move it.

**Target load.** About 50–60 contents a day, each with a script of up to 2 pages. Content types are EXPLAINER, LIVE, RECORDED LIVE, SOT, PACKAGE and SHOW. Items publish to YouTube, Facebook, Instagram, TikTok and the website.

**What the app does today**

- Daily rundown table with date range, channel, status and text search
- A 12-status pipeline with role and permission checks, enforced in the database
- Content IDs such as `CON-20260930_001`, and per-short IDs such as `CON-20260930_001-SHORT01`
- A separate "On hold & unscheduled" table for parked items, with resume and schedule actions
- Team management with roles, 8 permissions, photos, and login by email and password
- Drawer per content with script, metadata, assets, revisions and history
- KPI view, Excel export, dark and light theme, Bengali-friendly fonts, live updates

**Language note.** The product UI is in English. The owner works in Bengali, and script text is mostly Bengali.

## 2. Architecture and tech stack

A single Next.js page runs in the browser and talks directly to Supabase. There is no server code of our own: Vercel only builds and serves the page, and GitHub holds the code.

&#91;embedded content: architecture · 4 parts, Postgres holds the rules\]

A commit on GitHub triggers a Vercel build. The browser loads the built page and then reads and writes data in Supabase directly. The accent box marks where the rules are enforced.

| Job | Technology |
| --- | --- |
| App framework | Next.js 16 (Turbopack, App Router) with React, JavaScript |
| Styling | Tailwind CSS from its CDN, plus custom CSS in `app/layout.js` (including the light theme) |
| Fonts | Inter and Noto Serif Bengali (Google Fonts) |
| Database | Supabase, PostgreSQL |
| Login | Supabase Auth, email and password |
| Live updates | Supabase Realtime |
| Export & Reports | xlsx-js-style (Excel export), jspdf & jspdf-autotable (PDF export) |
| Rich Text Editor | TipTap (Starter Kit, Highlight, Underline) for rich script editing |
| Files | Supabase Storage, bucket `avatars` |
| Rules and security | Postgres row-level security, triggers and functions |
| Code hosting | GitHub |
| Hosting and builds | Vercel, deploys automatically on every commit to GitHub |

**Where the code lives.** `app/page.js` is the main rundown dashboard interface (~2,080 lines, client component `NewsroomApp`), orchestrating sub-components in `components/ui/` (`Drawer.js`, `Modals.js`, `Teleprompter.js`, `ScriptEditor.js`, `StaffAssignSelect.js`, `Badges.js`, `Shared.js`). Business logic lives in `lib/core.js` and `utils/`, and Supabase/storage/export integrations reside in `services/`. `app/layout.js` holds the page shell, fonts, Tailwind script and global CSS. The browser talks to Supabase with the public (anon) key through `@supabase/supabase-js`; row-level security and the triggers decide what each signed-in person may do.

## 3. Users, roles and permissions

There are three roles, and eight switchable permissions that matter only for the General role. Owners and Managers always have every permission.

| Role | How many | What they can do |
| --- | --- | --- |
| Owner | Exactly one per organization (unique index) | Everything, including managing Managers and resetting access. Can use "Acting as" to preview the app as another member. |
| Manager | Any number | All eight permissions. Can add and edit General members only. Cannot change roles. Can hold, drop, resume, lock scripts and publish. |
| General | Any number | Only what the Owner or a Manager switched on for them. Can always edit their own name, designation and photo. |
|  |  |  |

**The 8 permissions** (stored as boolean columns on `team_members`):

| Permission | Label in the UI | What it unlocks | Fields it guards |
| --- | --- | --- | --- |
| `can_write_edit_scripts` | Write & Edit Scripts | Write and save the script; submit it | `script` |
| `can_edit_content_details` | Edit Content Details | Title, thumbnail text, writer, camera operator, shelf ID, platforms, caption, SEO keywords, hashtags | those fields |
| `can_assign_video_editor` | Assign Video Editor | Choose the video editor; move Assign Editor to Editing | `video_editor` |
| `can_reschedule_content` | Reschedule Content | Change scheduled date and publish time; schedule an unscheduled item | `scheduled_publish_time` |
| `can_assign_presenter` | Assign Presenter | Update the presenter | `presenter_name` |
| `can_change_channel` | Change Channel | Switch channel | `channel` |
| `can_approve_scripts` | Approve Scripts | Approve a submitted script or send it back | status step |
| `can_review_videos` | Review Videos | Approve an edited video or request a revision | status step |

**The 16 roles** (also boolean columns on `team_members`, named `role_...`): roles are not permissions. A role only decides in which credit list a person appears (for example Presenter, Video Editor, Camera Operator). Owners and Managers appear in every list. The roles are: Research & Script Writer, Concept Creator, Producer, Presenter, Camera Operator, Light Designer, Sound Recordist, Voice Over Artist, Video Editor, Motion Graphics Designer, Graphic Designer, Colorist, Audio Mixer, Live Video Switcher, Live Audio Mixer, Publisher. Only the Owner and Managers can change a member's roles and permissions. The full column list is in `docs/schema-reference.md`.

Other rules that apply to people:

- A script can be locked. Only a Manager or the Owner can lock or unlock it, and only they can edit a locked script.
- Inactive members (the `active` flag off) cannot sign in to the app and every database check refuses them.
- Every member has a name, designation (job title), photo and email. Changing a member's name updates their name inside existing contents (all credit columns, such as writer, presenter, video editor and camera operator) automatically.
- Members get in-app notifications when they are assigned a role on a content, when a content they work on changes status, and (Owner and Managers) when a script is submitted, a video needs review, or a content is ready to publish.

**Acting as.** The Owner can pick another member in a selector and the interface behaves exactly as that member would see it (buttons and locked fields). This is a preview only: the database still sees the real signed-in Owner, so it never gives the Owner fewer rights and it is not a way to impersonate someone for real. Audit entries made while acting as another member currently carry that member's name, not the Owner's. A "(via Owner)" tag was proposed and is not built.

## 4. Login and access

Access is invite-only. A person can use the app only if the Owner or a Manager added their email to the Team and an auth account with the same email exists in Supabase.

**How a new person gets in (current manual process)**

1. The Owner or a Manager opens Team and adds the member: name, email, designation, role and permissions.
2. The Owner creates the login in Supabase: Authentication, Users, Add user, with the same email, a temporary password and "Auto Confirm User" on.
3. The Owner sends the person the app address, the email and the temporary password.
4. At the first sign-in the app finds the Team row with the same email (case-insensitive) and no linked account, and writes the new `auth_user_id` onto it. From then on the account is bound by id, not by email.

**Sign-in screen.** Email and password only (`supabase.auth.signInWithPassword`). A wrong pair shows "Wrong email or password. Ask your Owner or a Manager if you have not received your login yet." There is no self-service sign-up and, today, no self-service password reset.

**Boot sequence after sign-in** (`loadWorkspace` in `app/page.js`)

- Load the one organization the person can see. If none is visible and nothing exists, show the Setup screen (first-time creation of the organization and its Owner).
- Load team members and channels for that organization.
- Match the signed-in account to a Team row, by `auth_user_id` first, then by unlinked email.
- No match: the "No access yet" card, with the text "\<email> is not on the team yet. Ask your Owner or a Manager to add this email in Team, then sign in again."
- Matched but `active = false`: "No access yet" with "Your access has been switched off. Please contact your Owner or a Manager."
- Otherwise the main app opens as that member.

**Common reasons for "No access yet"**

| Cause | Fix |
| --- | --- |
| Email in Team differs from the auth email (typo, extra space) | Edit the member's email in Team to match exactly |
| Member is inactive | Switch Active on in Team |
| Team row is already linked to a different auth account (for example the auth user was deleted and recreated) | In SQL, set that row's `auth_user_id` to null and sign in again |
| Auth user email not confirmed | Confirm the user in Supabase or recreate with Auto Confirm on |

**Organizations.** One email maps to one organization. The database helper `my_org_id()` returns a single organization for the signed-in user, so multi-organization membership and an organization chooser are not built (see section 12).

**Profile.** Each person opens their profile from the avatar button in the header. They can change their name, designation and photo and sign out. The photo is resized in the browser to a 384 px JPEG and stored in the `avatars` bucket at `{organization_id}/{member_id}.jpg`.

## 5. Screen map: where things are and what a click does

The app is one page (`app/page.js`) with a sticky header, the rundown, a second table, a footer, one side drawer and several modals.

**Header, row 1**

| Element | What it does |
| --- | --- |
| Logo, "NewsroomOps", organization name | Identification only |
| Acting as (Owner only) | Pick another member to preview their buttons and locked fields. Preview only. |
| New Content | Opens the New Content modal |
| Bell | Lists notifications with an unread badge. Clicking one opens that content, or tells you to change the date range if it is not loaded. |
| Avatar and name | Opens My profile: name, designation, photo, new password, your access list, sign out |

**Header, row 2 (filters)**

| Element | What it does |
| --- | --- |
| Date picker | Choose one day or a range. Controls which contents are loaded (by publish time, plus any content whose shorts are due in range). |
| Channel dropdown | All Channels or one channel. Filters both tables. |
| + Channel | Owner and Managers: opens Add channel. Everyone else sees a lock and a message. |

**Main area, Daily Rundown**

- Title "Daily Rundown", a status dropdown (All statuses or one of the 12), a search box (slug, title, people, content ID, channel, thumbnail text) and a counter "N items · date range".
- Table columns: Time, Content Type, Slug Name (a lock icon if the script is locked), Writer, Presenter, Video Editor, Short, Status, Action.
- Rows are grouped under a channel header with a count.
- The Short column shows one chip per short that is due inside the selected range, amber while pending and green once published, with its upload time.
- The Action column shows the next allowed workflow buttons for that row. Clicking a row anywhere else opens the drawer.

**Second table, On hold & unscheduled** (below the rundown)

- Holds every content that is On Hold or has no publish date and time. Columns: Why, Content Type, Slug Name, Channel, Writer, Presenter, Status, New publish time.
- Each row has a date-time input and a button: Resume (for On Hold, Managers and Owner only) or Schedule (for no date, needs Reschedule). The item then returns to the rundown, and the view jumps to its day if it is outside the current range.

**Footer buttons**

| Button | What it does |
| --- | --- |
| Light / Dark | Switches theme (saved in the browser) |
| Team | Opens Team & permissions |
| KPI | Opens the KPI report for the current rundown range |
| Excel | Downloads the rundown rows in range as an Excel file |

**Content drawer** (opens from the right, five tabs and a fixed footer)

| Tab | Contents |
| --- | --- |
| Overview | Title, thumbnail text, channel, scheduled publish time, staff assignment (writer, presenter, video editor, camera operator), archive shelf ID, target platforms. Each field locks when you lack the permission. |
| Script Desk | Reading view and editor in a serif font that supports Bengali, word count and minutes on air (150 words a minute), Copy Script, Lock or Unlock Script (Managers and Owner), raw footage link for PACKAGE |
| Assets & Shorts | Links: raw footage, project file, master export, live video URL. List of shorts and reels with their own ID, thumb text, platform, URL, upload time and a Pending or Published toggle. Form to add a short. |
| QC & Audit | Add a Revision note, QA remark or Audit comment. Shows hold, drop and re-shoot reasons, the list of revision requests and the full audit trail with who, role and time. |
| Metadata | Post caption, SEO keywords, hashtags (the # is added automatically) |

The drawer footer shows the **Next step** workflow buttons and a **Delete permanently** button (Managers and Owner only, with a confirmation dialog).

**Modals**

- **New Content**: six content type buttons, channel, optional publish date and time, slug name (uppercase, length limited), title, thumbnail text, writer, presenter, script. A content type shows its workflow hint, for example "Script approved → done (published)" for LIVE.
- **Reason / note**: asks for a reason before Hold, Drop or Re-Shoot.
- **Team & permissions**: add a member, expand a member to set designation, photo link, the 8 permission toggles, role (Owner only), Deactivate or Reactivate, and Remove.
- **KPI report**: tiles Total, Published, In progress, Past due, then counts by status, channel, content type, presenter, writer and video editor.
- **Toast**: green, red or neutral messages at the bottom for every save or refusal.

**Other screens:** Sign in, Set up your newsroom (first run), No access yet, and Can't reach your database.

## 6. Content pipeline and workflow

Every content is a state machine with 12 statuses. A content can only move by pressing a button that is allowed for its current status, content type and the person's permissions. The same rules are checked again by a database trigger, so a hand-edited request cannot skip a step.

&#91;embedded content: status flow · 9 steps on the main path, 3 groups of exceptions\]

The top two rows are the full pipeline. The cards underneath list the moves that leave the main path. The tables below give each step with its button and who may press it.

**Content types and the path each one takes**

| Content type | Path | Why |
| --- | --- | --- |
| EXPLAINER, RECORDED LIVE, SOT, SHOW | Full pipeline: Draft, Script Submitted, Ready for Shoot, Shooting, Assign Editor, Editing, Video Review, Ready to Publish, Published | Needs a shoot and an edit |
| LIVE | Draft, Script Submitted, then straight to Published when the script is approved | Goes out live, no shoot and no edit |
| PACKAGE | Draft, Script Submitted, then straight to Assign Editor | No shoot. Script plus raw footage link go to the editor. |

**The 12 statuses and every allowed move**

| Status | Meaning | Button (goes to) | Who can press it |
| --- | --- | --- | --- |
| Draft | Being written | Submit Script (Script Submitted). Needs a non-empty script. | Edit script permission |
| Script Submitted | Waiting for script approval | Approve Script (next step by content type, see above); Send Back (Draft, reason required) | Approve script permission |
| Ready for Shoot | Approved, waiting to be shot | Start Shoot (Shooting) | Any active member |
| Shooting | On shoot | Finish Shoot (Assign Editor) | Any active member |
| Assign Editor | Waiting for an editor | Send to Editing (Editing). Needs a video editor selected. | Assign editor permission |
| Editing | Editor is working | Submit Video (Video Review) | The assigned editor, Managers, Owner |
| Video Review | Waiting for review | Approve Video (Ready to Publish); Request Revision (Editing, reason required) | Review video permission |
| Ready to Publish | Final approved | Publish (Published) | Managers and Owner |
| Published | Done | none | none |
| On Hold | Parked with a reason | Resume (back to the status it was on hold from, or Draft) | Managers and Owner |
| Dropped | Cancelled with a reason | Restore (Draft) | Managers and Owner |
| Re-Shoot | Needs another shoot | Back to Shoot Queue (Ready for Shoot) | Any active member |

**Side moves available from several statuses (Managers and Owner only)**

- **Hold** and **Drop**, from any status except Published, Dropped and On Hold. Both ask for a reason. Hold stores the previous status so Resume can return to it.
- **Re-Shoot**, from Editing and Video Review, with a reason.

**Rules that apply on every step**

- Every status change is written to the audit trail with the person, role, time, from and to, and the reason when one is asked.
- Field edits (script, title, people, channel, time, links, caption) are also audit entries with the old and new value.
- Revision notes and QA or audit comments are append-only.
- A button that is not allowed is shown locked with a tooltip naming the missing permission. A blocked button explains why, for example "Write a script first" or "Pick a video editor first".
- Resuming from the On hold & unscheduled table needs a new publish time and returns the content to its previous status in one step.
- Notifications go to the writer, presenter and editor on every status change, and to Owner and Managers when a script is submitted, a video is submitted for review, or a content is ready to publish.

## 7. Content IDs, shorts, scheduling and parked items

**Content ID.** Every content gets a readable ID of the form `CON-YYYYMMDD_NNN`, for example `CON-20260930_001`. A database trigger (`contents_assign_uid`) assigns it on insert, using the Asia/Dhaka calendar date and a per-day counter table (`content_uid_counters`), so two people creating at the same moment never get the same number. Once an ID starts with `CON-` the update guard refuses to change it. The ID is shown at the top of the drawer. Open item: confirm in the trigger source which date feeds the ID (publish date or creation date).

**Shorts and reels.** One content can have many shorts. They live in the `contents.shorts` JSON array, one object each: `id`, `n` (sequence), `title`, `thumb_text`, `platform` (youtube, facebook, instagram, tiktok, web), `url`, `publish_at` and `published`.

- Each short gets its own ID: the content ID plus `-SHORTnn`, for example `CON-20260930_001-SHORT01`, shown in the Assets & Shorts tab.
- Each short has its own optional upload date and time, separate from the main video.
- The trigger `contents_set_short_days` copies the Dhaka dates of all shorts into a `short_days` text array on the row. This lets the rundown find contents whose short is due on a day even when the main video is on another day.
- In the rundown, the Short column shows a chip "Short · time" for each short due in the selected range, amber while pending and green when marked Published.

**Scheduling.** `scheduled_publish_time` (timestamp with time zone) decides which day a content appears on. It is optional. Creating a content without a time, or putting it On Hold, moves it out of the rundown into the second table.

**What the app loads for a given date range** (`fetchRows`)

1. Contents whose publish time falls inside the range.
2. Contents with a short due inside the range (`short_days` overlaps the range days).
3. All On Hold contents of the organization, whatever their date.
4. All contents with no publish time.

The four lists are merged by id. "Parked" means status On Hold or no publish time; parked items are shown only in the second table and are not counted in the rundown, the KPI report or the Excel export.

**Resume and schedule (second table)**

- On Hold item: pick a new date and time and press Resume. The status returns to the one it had before the hold, the hold reason is cleared, the new time is saved, and two audit entries are added (the status change and the time change). Only Managers and the Owner can do this.
- No-date item: pick a date and time and press Schedule. Needs the Reschedule permission. The status does not change.
- After either action, if the new day is outside the visible range the view jumps to that day.

**Live updates.** The app subscribes to Supabase Realtime changes on `contents`. Any insert, update or delete by anyone triggers a reload of the visible data, so teammates see each other's changes without refreshing. Notifications use their own realtime subscription for the bell.

## 8. Database

The database is Supabase Postgres, schema `public`. People are stored on content by name (text), not by id, and a trigger keeps those names in step when a member is renamed.

**Tables**

| Table | Purpose | Key columns |
| --- | --- | --- |
| `organizations` | One row per customer (tenant) | `id`, `name`, `owner_id`, `created_at` |
| `team_members` | People, roles and permissions | `id`, `organization_id`, `full_name`, `email`, `role` (owner, manager, general), `active`, `designation`, `avatar_url`, `auth_user_id` (link to the Supabase login), the 8 `can_*` booleans |
| `contents` | One row per video, the heart of the app | see below |
| `channels` | Channels added from the app (the 7 defaults live in code) | `id`, `organization_id`, `name` (unique per organization, case-insensitive) |
| `notifications` | In-app bell | `id`, `organization_id`, `member_id`, `content_id`, `message`, `read`, `created_at` |
| `content_uid_counters` | Per-day counter behind `CON-YYYYMMDD_NNN` | last number used per day |
| `content_counters` | Counter from an earlier ID scheme, kept |  |
| `team_members_legacy` | The first version's team table, renamed and kept, not used |  |
|  |  |  |

A schema `backup_20260930` holds a full copy of the data taken before the security work.

**`contents` columns, grouped**

| Group | Columns |
| --- | --- |
| Identity | `id` (uuid), `content_uid`, `organization_id`, `content_type`, `status`, `previous_status` |
| Planning | `slug_name`, `title`, `thumbnail_text`, `channel`, `scheduled_publish_time` (nullable), `published_at`, `published_by`, `target_platforms` (JSON array, default youtube and facebook) |
| People (names as text) | `writer`, `presenter_name`, `video_editor`, `camera_operator` |
| Script | `script`, `is_script_locked` |
| Assets | `raw_footage_link`, `project_file_url`, `master_export_url`, `live_video_url`, `archive_shelf_id` |
| Social copy | `post_caption`, `seo_keywords`, `hashtags` |
| Shorts | `shorts` (JSON array), `short_days` (text array, filled by trigger) |
| History | `audit_log` (JSON array, append-only), `revisions` (JSON array, append-only) |
| Reasons | `hold_reason`, `drop_reason`, `reshoot_reason` |
| Housekeeping | `created_at` |

Indexes: `(organization_id, scheduled_publish_time)` and `content_uid` on contents; unique `(organization_id, lower(email))` and unique one-owner-per-organization on team members; unique `auth_user_id`.

**Triggers**

| Trigger | On | What it does |
| --- | --- | --- |
| `contents_assign_uid` | contents, before insert or update | Assigns `CON-YYYYMMDD_NNN` |
| `contents_set_short_days` | contents, before insert or update | Fills `short_days` from the shorts' upload times |
| `contents_guard_insert` | contents, before insert | New content must start as Draft with no `published_at` |
| `contents_guard_update` | contents, before update | Field permissions, script lock, append-only history, workflow whitelist, immutable content ID (details in section 9) |
| `contents_notify_insert` | contents, after insert | Notifies assigned writer, presenter and editor |
| `contents_notify_update` | contents, after update | Notifies on status change and on new assignment |
| `team_members_guard` | team\_members | Blocks privilege escalation (section 9) |
| `team_members_rename` | team\_members, after update of `full_name` | Copies the new name into writer, presenter, video editor, camera operator, published_by, publisher and the other credit columns on that organization's contents |

**Helper functions** (security definer, used by policies and triggers): `my_member_row()`, `my_org_id()`, `my_member_id()`, `my_role()`, `i_am_active()`, `is_manager()`, `perm_of(member, permission)`.

**Realtime and storage**

- Realtime publication includes `contents`, `team_members` and `notifications`.
- Storage bucket `avatars`: public, 1 MB limit, JPEG, PNG and WebP, path `{organization_id}/{member_id}.jpg`.

**Things for the next developer to verify**

- Several SQL steps (login linking, row security, the uid and shorts triggers, the guard on team members, avatars) were run directly in the Supabase SQL editor and are not saved as files in the repository. Export the live schema once and commit it: `pg_dump --schema-only` or the Supabase CLI `supabase db dump`.
- The first migration's check constraint on `content_type` lists five types. The app also offers SHOW. Confirm the live constraint allows SHOW.
- Run `select * from pg_policies where schemaname = 'public'` to read the actual row-level policies (all start with `nw_`).

## 9. Security model

The browser holds the public Supabase key, so nothing in the browser can be trusted. Every rule that matters is enforced inside the database, and the interface only mirrors those rules so buttons look right.

| Layer | Where | What it enforces |
| --- | --- | --- |
| Interface | `app/page.js` (`getActions`, `FIELD_PERM`, `can`, `isManager`) | Shows or locks buttons and fields by role and permission. Convenience only. |
| Row-level security | Policies named `nw_*` on all 8 tables | A signed-in person sees and changes rows of their own organization only. Another organization's rows are invisible. |
| Update guard | Trigger `contents_guard_update` | Field permissions, script lock, append-only history, workflow whitelist, publish stamp, immutable content ID |
| Insert guard | Trigger `contents_guard_insert` | New content starts as Draft |
| Team guard | Trigger `team_members_guard` | Blocks privilege escalation |
| Storage | Bucket `avatars` | Public read, 1 MB, image types only |

**What the update guard checks, in order**

1. The caller must be an active member of the same organization as the row.
2. A content cannot move to another organization, and a `CON-` content ID cannot change.
3. Script edits need Edit script, and a locked script can be edited only by Managers and the Owner. Lock and unlock are manager-only.
4. Metadata, channel, publish time, presenter and video editor each need their own permission.
5. `audit_log` and `revisions` may only grow: the old array must be contained in the new one.
6. `published_at` and `published_by` change only together with the Publish step, or by a manager.
7. A status change must be one of the allowed transitions in section 6, by someone with the right permission, with the extra conditions (a script must be non-empty to submit, an editor must be chosen to start editing).

**What the team guard checks**

- Nobody can raise their own role or permissions.
- A Manager can edit General members only and cannot change anyone's role. Only the Owner assigns Managers.
- A member can change only their own name, designation and photo, and link their own login once (`auth_user_id` from empty to themselves).

**Multi-tenant isolation.** Every row carries `organization_id`. The helper `my_member_row()` finds the caller's Team row by `auth_user_id`, or, while unlinked, by the email in the login token. `my_org_id()` and the policies build on it. This was tested with a second organization and a second login.

**When the guards are skipped.** The guards do nothing when there is no signed-in user (`auth.uid()` is null, for example in the Supabase SQL editor or with the service key) or while the internal setting `nw.bypass_guard` is `1`, which only the rename trigger sets. This is how an administrator repairs data.

**Known security gaps**

- The `actor` name in audit entries is written by the browser and is not checked against the signed-in user.
- "Acting as" changes only the interface. A real person always acts with their real rights.
- No self-service password reset or change enforcement. The Owner resets passwords in Supabase.
- The Free Supabase plan has no automatic backups. Take regular exports (section 12).

## 10. Other features

| Feature | How it works |
| --- | --- |
| Channels | Seven defaults are in code (The Wave 24, World, Money, Sports, Faith, Life, Glam). Owner and Managers can add more with + Channel; they are saved in the `channels` table per organization. |
| Slug name | Required, forced to uppercase, up to 100 characters. It is the row's headline in the rundown. |
| Notifications | Created by database triggers (section 6). The bell shows an unread count and updates live through Realtime. Clicking a notification opens that content. |
| Live updates | Realtime on `contents`, `team_members` and `notifications`. |
| KPI report | Modal for the current range: Total, Published, In progress (not Published, Dropped, On Hold or Draft), Past due (not Published or Dropped, publish time already passed), then counts by status, channel, type, presenter, writer and video editor. Parked items are not included. |
| Excel export | The `xlsx-js-style` library, loaded on demand. Exports the rundown rows of the current range to `newsroom-rundown-<timestamp>.xlsx`, sheet "Rundown". Parked items are not included. |
| Dark and light theme | Footer button. Choice kept in the browser (`nw-theme` in local storage) and applied before first paint to avoid a flash. Light mode is a CSS override layer in `app/layout.js`. |
| Fonts | Inter for Latin text, Noto Serif Bengali for Bengali glyphs everywhere, and a serif reading font for scripts. Loaded from Google Fonts. |
| Profile photos | Picked in My profile, resized in the browser to a 384 px JPEG, uploaded to the `avatars` bucket. A pasted image link also works. |
| Delete | Managers and Owner only, from the drawer, behind a confirmation dialog. Permanent. |
| Demo mode | If the two Supabase environment variables are missing, the app runs on built-in sample data with no login. |

**Environment variables** (set in Vercel and in a local `.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Dependencies** (`package.json`): `next` ^16.4.0, `react` and `react-dom` ^19.3.0, `@supabase/supabase-js` 2.x, `xlsx-js-style` ^1.2.0. Tailwind is loaded from its CDN in `app/layout.js`, not through a build step.

## 11. How it was built and how changes ship

The product was built step by step with Claude as the coder and the owner as the product lead and tester. The owner is not a programmer, so each change was handed over as a small code snippet with a one-line search anchor, applied by hand in the GitHub web editor, and tested before the next step.

**Working agreements**

- One step at a time; the next step starts only after the owner reports the test result.
- Never replace a whole file. Give only the changed part and say which file and where.
- Do not change anything that was not asked for.
- Database changes are SQL scripts run in the Supabase SQL editor, written to be safe to re-run.

**How a change ships**

1. Edit `app/page.js` (or `app/layout.js`) in the GitHub web editor and commit to the main branch.
2. Vercel builds automatically. A syntax error shows as a failed build and the previous version stays live.
3. When the build is Ready, test on the live site.
4. Database changes are run once in Supabase, before the code that needs them.

**Build history**

| Stage | What was built |
| --- | --- |
| Foundation | Next.js page with the rundown table, drawer, workflow states and Supabase tables for contents, team and channels. An earlier simpler team table was kept as `team_members_legacy`. |
| Migration 1 | Organizations, roles, permission columns, content columns, channels, realtime |
| Migration 2 | Designation, avatar, script lock, caption, SEO keywords, hashtags |
| Migration 3 | Login linking (`auth_user_id`), notifications table and triggers |
| Part 4 | Content ID `CON-YYYYMMDD_NNN` assigned by a database trigger |
| Part 5 | Shorts with their own IDs and upload times, `short_days`, the Short column in the rundown |
| Part 6 | Light theme with a toggle, then fixes for modals, drawer and KPI colors |
| Security steps A, B, C | Full backup first; guards and row-level security; then permissions and workflow enforced in the database (23 test scenarios on a local Postgres, then tested live) |
| Profile photo upload | Supabase Storage bucket, in-browser resize |
| Fonts | Noto Serif Bengali for Bengali text |
| Footer and parked table (part 8) | Theme, Team, KPI and Excel buttons moved to the page footer; new On hold & unscheduled table with Resume and Schedule; publish date made optional |

**Files in the repository:** `app/page.js` (the whole interface, about 3,000 lines), `app/layout.js` (Tailwind CDN script, fonts, global and light-theme CSS, theme init script), `package.json`. SQL files kept by the owner: `supabase_migration.sql`, `_2`, `_3` and `supabase_step_c.sql`.

## 12. Known limitations and roadmap

The app is in use by the owner's own team. The items below are the open work, with the reason each matters.

| Priority | Item | Why it matters | Suggested direction |
| --- | --- | --- | --- |
| High | Backups | The Free Supabase plan has no automatic backups. A full copy exists only from 30 Sep 2026 (`backup_20260930`). | Move to Supabase Pro for daily backups, and keep a regular `pg_dump` copy outside Supabase. |
| High | Database size | Planned load is 50–60 contents a day with scripts up to 2 pages. At an estimated 30–80 KB per content, the 500 MB Free limit is reached in roughly 3 to 8 months. This is an estimate, measure it with `pg_total_relation_size('public.contents')`. | Pro plan (8 GB), archive old contents, cap the number of stored revisions. |
| High | Schema not in the repository | Several SQL steps were run only in the SQL editor. A new developer cannot rebuild the database from the repo. | Export the live schema and commit it as migrations. |
| High | Manual member onboarding | Adding a person needs two steps: Team in the app, then a user in Supabase with the same email. | Invite flow through a server function with the service key, creating the login and sending an email. |
| Medium | Password reset | No self-service reset or forced change of the temporary password. | Use Supabase's reset-password email flow and a "set new password" screen. |
| Medium | One email, one organization | `my_org_id()` returns one organization per login. There is also no way to create a second organization from the app because row security blocks the setup step. | Membership table, organization chooser, a database function to create an organization with its Owner. |
| Medium | Audit actor is client-written | Entries record whatever name the browser sends. | Write the actor in a trigger from the signed-in member, and add a "via Owner" tag for Acting as. |
| Medium | Parked items outside KPI and Excel | Held and unscheduled contents are not counted or exported. | Add a second sheet and a KPI line for parked items if the team wants it. |
| Medium | Load size | `fetchRows` selects every column, including full scripts and logs, for every row in range. | Select only list columns for the table and load script and history when the drawer opens. |
| Low | One 3,000-line file | `app/page.js` holds all screens, which makes review and testing hard. | Split into components and a data layer. Add automated tests for `getActions`. |
| Low | Tailwind from CDN | Extra request on every load and no purge. | Install Tailwind in the build. |
| Low | `content_type` constraint | The first migration lists five types, the app has six (SHOW). | Confirm the live constraint and add SHOW if missing. |

**How to start as a new developer**

1. Read sections 6 and 9 first: the workflow and the guard trigger are the product's rules.
2. Export the live schema (`supabase db dump`) and read the `nw_*` policies.
3. Create a test organization with an Owner, a Manager and two General members, then walk one content from Draft to Published for each content type.
4. Try forbidden moves with a General member, in the app and directly against the API, and confirm the database refuses them.
