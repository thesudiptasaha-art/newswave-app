# Supabase schema snapshot (৮ অক্টোবর ২০২৬, ধাপ ১৬ — public স্কিমা, দুই ধাপে নেওয়া)
> ২২ অক্টোবর ২০২৬ হালনাগাদ: পদ ও অ্যাক্সেসের কলামের নাম বদলানো হয়েছে (রেকর্ড: `sql/2026-10-22_roles_access_rename.sql`)। team_members, contents ও চারটা ফাংশন নিচে নতুন নামে লেখা। বাকি অংশ ৮ অক্টোবরের অবস্থা।
 
> ⚠️ localhost ও লাইভ সাইট একই ডেটাবেস। SQL চালালে সঙ্গে সঙ্গে লাইভে কার্যকর। তাই SQL সবসময়: ছোট, যোগ-ভিত্তিক (additive), ফিরিয়ে নেওয়া যায় এমন, এবং আগে আমি পর্যালোচনা করে দেব।
 
## টেবিল
- **organizations**: id uuid(pk), name, owner_id, created_at.
- **team_members**: id uuid(pk), user_id, organization_id(fk, cascade), full_name, email, role (CHECK owner|manager|general), active, designation, avatar_url, auth_user_id, created_at, employee_id, phone, whatsapp, nickname; Access (৮টা bool, not null, ডিফল্ট false): can_write_edit_scripts, can_approve_scripts, can_edit_content_details, can_change_channel, can_reschedule_content, can_assign_video_editor, can_assign_presenter, can_review_videos; Roles (১৬টা bool, ডিফল্ট false): role_research_script_writer, role_concept_creator, role_producer, role_presenter, role_camera_operator, role_light_designer, role_sound_recordist, role_voice_over_artist, role_video_editor, role_motion_graphics_designer, role_graphic_designer, role_colorist, role_audio_mixer, role_live_video_switcher, role_live_audio_mixer, role_publisher. ইনডেক্স: org প্রতি একজন owner; (org, lower(email)) ইউনিক; auth_user_id ইউনিক; (org, lower(nickname)) ইউনিক।
- **team_members_legacy**: পুরনো, অব্যবহৃত বলে মনে হয়।
- **channels**: id **bigint**, name (**global UNIQUE(name)** + আলাদা UNIQUE(organization_id, lower(name))), created_at, organization_id(fk). কোনো code কলাম নেই।
- **contents**: id **bigint**, content_uid (ইউনিক, ট্রিগার `CON-YYYYMMDD_NNN`, Asia/Dhaka দিন), slug_name NN, title NN, status, previous_status, **channel text (নাম দিয়ে)**, content_type (CHECK EXPLAINER|LIVE|RECORDED LIVE|SOT|PACKAGE|SHOW), pipeline_type, scheduled_publish_time, published_at, target_platforms jsonb (default ["youtube","facebook"]), shorts/revisions/audit_log jsonb, short_days text[] (ট্রিগার), script, is_script_locked NN, thumbnail_text, post_caption, seo_keywords, hashtags, archive_shelf_id, raw_footage_link, project_file_url, live_video_url, master_export_url, hold/drop/reshoot_reason; ক্রেডিট text: writer, presenter_name, video_editor, camera_operator, concept_creator, producer, publisher, motion_graphics_designer, graphic_designer, voice_over_artist, colorist, light_designer, sound_recordist, audio_mixer, live_video_switcher, live_audio_mixer; প্রকাশের ছাপ text: published_by (Publish ধাপে বসে). ইনডেক্স: (organization_id, scheduled_publish_time)।
  - **পুরনো ডুপ্লিকেট কলাম (অ্যাপ ব্যবহার করে না):** writer_name, editor_name, script_body, raw_footage_url, presenter, script_locked।
- **notifications**: id bigint, organization_id, member_id(fk→team_members, cascade), content_id **text**, message, read, created_at; ইনডেক্স (member_id, created_at desc).
- **content_counters / content_uid_counters**: UID কাউন্টার।
- **নেই:** shows, notices, প্ল্যাটফর্মভিত্তিক অবস্থা, **reference_files কলাম**।
- সব টেবিলে RLS চালু। Realtime প্রকাশনা: **contents, team_members, notifications** (channels নেই)।
- 11 Oct update: table notices ADDED (sql/2026-10-11_notices_table.sql; realtime enabled; read = active members, write = manager/owner). Storage bucket documents ADDED (sql/2026-10-11_storage_documents_rls.sql).
- 12 Oct update: notices টেবিলে `notice_uid text unique` যুক্ত; `notice_uid_counters` টেবিল ও `notices_assign_uid` ট্রিগার যোগ (NOTICE-YYYYMMDD_NNN দৈনিক কাউন্টার, Asia/Dhaka সময়); মাইগ্রেশন ও ব্যাকফিল: `sql/2026-10-12_notices_uid_and_counter.sql`।
## RLS (সংক্ষেপে)
সব org-ভিত্তিক (`organization_id = my_org_id()`)। contents: select/insert/update `i_am_active()`, delete `is_manager()`। channels: insert/delete `is_manager()`। notifications: নিজের; delete নিজের বা manager। team_members: insert/delete manager (owner ছাড়া; manager তৈরি owner), update সব org-সদস্য (আসল সুরক্ষা ট্রিগারে)। organizations: শুধু select।
`is_manager()` = role owner|manager এবং active।
 
## ট্রিগার ও ফাংশন (বডি দেখা হয়েছে) — মূল তথ্য
- **guard_contents_insert** (auth.uid() থাকলে): নতুন কনটেন্ট অবশ্যই status='Draft', published_at খালি।
- **guard_contents_update** (SQL Editor / auth.uid() null / `nw.bypass_guard`='1' হলে বাদ): অ্যাকটিভ সদস্য, একই org; script বদলাতে can_write_edit_scripts (লক থাকলে manager); `is_script_locked` শুধু manager; title/thumbnail_text/writer/camera_operator/archive_shelf_id/target_platforms/post_caption/seo_keywords/hashtags → can_edit_content_details; channel → can_change_channel; scheduled_publish_time → can_reschedule_content; presenter_name → can_assign_presenter; video_editor → can_assign_video_editor; audit_log/revisions শুধু বাড়ে; published_at ও published_by শুধু Publish ধাপের সঙ্গে (বা manager) বদলায়; স্ট্যাটাস বদলের পুরো নিয়ম (কোন ধাপ কে করবে) এখানে: স্ক্রিপ্ট Submit → can_write_edit_scripts, অনুমোদন → can_approve_scripts, Editing-এ নেওয়া → can_assign_video_editor, Video Review-এর ফল → can_review_videos। **অন্য ক্রেডিট কলাম (publisher, producer, concept_creator, shorts, links ইত্যাদি) যেকোনো অ্যাকটিভ সদস্য বদলাতে পারে।** নতুন কলাম যোগ করলে ডিফল্টে অরক্ষিত — দরকারে guard-এ নিয়ম যোগ করতে হবে।
- **guard_team_members**: owner সব; manager শুধু 'general' সদস্য (রোল বদল নয়); নিজের ক্ষেত্রে শুধু নাম, nickname, designation, ছবি, ফোন ও WhatsApp বদলানো যায় — role, active, email, user_id, employee_id, ৮টা Access ও ১৬টা Role টিক নিজে বদলানো যায় না (N54; ২২ অক্টোবরে নতুন নামে)।
- **cascade_member_rename** (সদস্যের নাম বদলালে contents-এ নাম আপডেট): এক আপডেটে সব ১৭টা কলাম — writer, presenter_name, video_editor, camera_operator, published_by, concept_creator, producer, publisher, motion_graphics_designer, graphic_designer, voice_over_artist, colorist, light_designer, sound_recordist, audio_mixer, live_video_switcher, live_audio_mixer। (আগের অসম্পূর্ণতার বাগ ঠিক হয়েছে।)
- **notify_content_insert / notify_content_update**: অ্যাসাইনমেন্ট নোটিফিকেশনের লেখা "You were assigned as Research & Script Writer / Presenter / Video Editor on …"। স্ট্যাটাস বদলের নোটিফিকেশনের লেখা (২২ অক্টোবর থেকে): "<নাম> moved <কনটেন্ট> from <পুরনো ধাপ> to <নতুন ধাপ>" (রেকর্ড: `sql/2026-10-22_notify_status_message.sql`)। অনুমোদন ও রিভিউয়ের নোটিফিকেশন can_approve_scripts ও can_review_videos দেখে।
- assign_content_uid, set_short_days, perm_of, my_* ফাংশন স্বাভাবিক।
## ধরা পড়া সমস্যা ও করণীয় (অগ্রাধিকার)
- DB-0 is DONE: see sql/2026-10-08_db0_reference_files_notifications_rename.sql
1. **`reference_files` কলাম নেই** → Assets ট্যাবের রেফারেন্স ফাইল লাইভে সেভ হয় না (Save failed)। সমাধান: `alter table contents add column reference_files jsonb not null default '[]'` (যোগ-ভিত্তিক, নিরাপদ; guard আটকায় না)।
2. ✅ **সম্পন্ন:** নোটিফিকেশনের "Writer" বদলে "Research & Script" (DB-0), পরে "Research & Script Writer" (২২ অক্টোবর)।
3. ✅ **সম্পন্ন (২২ অক্টোবর):** cascade_member_rename এখন সব ক্রেডিট কলাম ধরে।
4. channels.name গ্লোবাল ইউনিক (পরে, N14-এর সময়)।
5. পুরনো ডুপ্লিকেট কলাম/টেবিল পরিষ্কার (পরে, ঝুঁকিপূর্ণ নয় কিন্তু জরুরি নয়)।
6. N14 (Channel/Show আইডি): contents.channel নাম দিয়ে; আইডি যোগ + নাম-থেকে-আইডি ব্যাকফিল লাগবে।
7. N12 (নোটিশ): নতুন `notices` টেবিল + RLS (`is_manager()` ব্যবহার) + realtime প্রকাশনায় যোগ।
8. N10 (Show): `shows` টেবিল + contents-এ show_id/season/episode; guard-এ can_edit_metadata নিয়ম।
9. N15 (প্ল্যাটফর্ম): target_platforms (তালিকা) থেকে প্ল্যাটফর্মভিত্তিক অবস্থার কাঠামো।

## লাইভ ডেটাবেস সাইজ ও রো কাউন্ট (১১ অক্টোবর ২০২৬)

| টেবিল | রো সংখ্যা | মোট আকার |
|---|---|---|
| `contents` | ২৯ | ৩৭৬ kB |
| `notifications` | ৭৫৬ | ২৮৮ kB |
| `team_members` | ২০ | ১১২ kB |
| `content_uid_counters` | ১১ | ৬৪ kB |
| `organizations` | ১ | ৩২ kB |
| `channels` | ০ | ৩২ kB |
| `team_members_legacy` | ১ | ৩২ kB |
| `content_counters` | ০ | ৮ kB |
| **মোট** | — | **~৯৪৪ kB** (৫০০ MB ফ্রি সীমার ০.২% মাত্র) |
