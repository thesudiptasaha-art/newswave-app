# Supabase schema snapshot (৮ অক্টোবর ২০২৬, ধাপ ১৬ — public স্কিমা, দুই ধাপে নেওয়া)
 
> ⚠️ localhost ও লাইভ সাইট একই ডেটাবেস। SQL চালালে সঙ্গে সঙ্গে লাইভে কার্যকর। তাই SQL সবসময়: ছোট, যোগ-ভিত্তিক (additive), ফিরিয়ে নেওয়া যায় এমন, এবং আগে আমি পর্যালোচনা করে দেব।
 
## টেবিল
- **organizations**: id uuid(pk), name, owner_id, created_at.
- **team_members**: id uuid(pk), user_id, organization_id(fk, cascade), full_name, email, role (CHECK owner|manager|general), active, designation, avatar_url, auth_user_id, created_at; অনুমতি bool: can_edit_script, can_edit_metadata, can_assign_editor, can_reschedule, can_change_presenter, can_change_channel, can_approve_script, can_review_video, can_write, can_edit_video, can_produce, can_camera, can_present, can_light, can_vfx, can_color, can_sound_record, can_audio_mix, can_video_switch, can_live_audio. ইনডেক্স: org প্রতি একজন owner; (org, lower(email)) ইউনিক; auth_user_id ইউনিক।
- **team_members_legacy**: পুরনো, অব্যবহৃত বলে মনে হয়।
- **channels**: id **bigint**, name (**global UNIQUE(name)** + আলাদা UNIQUE(organization_id, lower(name))), created_at, organization_id(fk). কোনো code কলাম নেই।
- **contents**: id **bigint**, content_uid (ইউনিক, ট্রিগার `CON-YYYYMMDD_NNN`, Asia/Dhaka দিন), slug_name NN, title NN, status, previous_status, **channel text (নাম দিয়ে)**, content_type (CHECK EXPLAINER|LIVE|RECORDED LIVE|SOT|PACKAGE|SHOW), pipeline_type, scheduled_publish_time, published_at, target_platforms jsonb (default ["youtube","facebook"]), shorts/revisions/audit_log jsonb, short_days text[] (ট্রিগার), script, is_script_locked NN, thumbnail_text, post_caption, seo_keywords, hashtags, archive_shelf_id, raw_footage_link, project_file_url, live_video_url, master_export_url, hold/drop/reshoot_reason; ক্রেডিট text: writer, presenter_name, video_editor, camera_person, idea_by, producer, uploader, vfx, colorist, light_designer, sound_recordist, audio_mixer, video_switcher, live_audio. ইনডেক্স: (organization_id, scheduled_publish_time)।
  - **পুরনো ডুপ্লিকেট কলাম (অ্যাপ ব্যবহার করে না):** writer_name, editor_name, script_body, raw_footage_url, presenter, publisher, script_locked।
- **notifications**: id bigint, organization_id, member_id(fk→team_members, cascade), content_id **text**, message, read, created_at; ইনডেক্স (member_id, created_at desc).
- **content_counters / content_uid_counters**: UID কাউন্টার।
- **নেই:** shows, notices, প্ল্যাটফর্মভিত্তিক অবস্থা, **reference_files কলাম**।
- সব টেবিলে RLS চালু। Realtime প্রকাশনা: **contents, team_members, notifications** (channels নেই)।
## RLS (সংক্ষেপে)
সব org-ভিত্তিক (`organization_id = my_org_id()`)। contents: select/insert/update `i_am_active()`, delete `is_manager()`। channels: insert/delete `is_manager()`। notifications: নিজের; delete নিজের বা manager। team_members: insert/delete manager (owner ছাড়া; manager তৈরি owner), update সব org-সদস্য (আসল সুরক্ষা ট্রিগারে)। organizations: শুধু select।
`is_manager()` = role owner|manager এবং active।
 
## ট্রিগার ও ফাংশন (বডি দেখা হয়েছে) — মূল তথ্য
- **guard_contents_insert** (auth.uid() থাকলে): নতুন কনটেন্ট অবশ্যই status='Draft', published_at খালি।
- **guard_contents_update** (SQL Editor / auth.uid() null / `nw.bypass_guard`='1' হলে বাদ): অ্যাকটিভ সদস্য, একই org; script বদলাতে can_edit_script (লক থাকলে manager); `is_script_locked` শুধু manager; title/thumbnail_text/**writer**/camera_person/archive_shelf_id/target_platforms/post_caption/seo_keywords/hashtags → can_edit_metadata; channel → can_change_channel; scheduled_publish_time → can_reschedule; presenter_name → can_change_presenter; video_editor → can_assign_editor; audit_log/revisions শুধু বাড়ে; স্ট্যাটাস বদলের পুরো নিয়ম (কোন ধাপ কে করবে) এখানে। **অন্য কলাম (uploader, producer, idea_by, shorts, links ইত্যাদি) যেকোনো অ্যাকটিভ সদস্য বদলাতে পারে।** নতুন কলাম যোগ করলে ডিফল্টে অরক্ষিত — দরকারে guard-এ নিয়ম যোগ করতে হবে।
- **guard_team_members**: owner সব; manager শুধু 'general' সদস্য (রোল বদল নয়); নিজের ক্ষেত্রে শুধু নাম/designation/ছবি + (নতুন skill-flag গুলো guard-এর তালিকায় নেই — can_write, can_edit_video, can_produce, can_camera, can_present, can_light, can_vfx, can_color, can_sound_record, can_audio_mix, can_video_switch, can_live_audio নিজে বদলানো সম্ভব; এগুলো শুধু ড্রপডাউন ছাঁকনিতে ব্যবহার হয়, DB-র অনুমতিতে নয়, তাই ঝুঁকি কম)।
- **cascade_member_rename** (সদস্যের নাম বদলালে contents-এ নাম আপডেট): শুধু writer, presenter_name, video_editor, camera_person, **publisher (পুরনো কলাম)** আপডেট করে। **idea_by, producer, uploader, vfx, colorist, light_designer, sound_recordist, audio_mixer, video_switcher, live_audio বাদ পড়ে** — নাম বদলালে এগুলোতে পুরনো নাম থেকে যায় (বাগ)।
- **notify_content_insert / notify_content_update**: অ্যাসাইনমেন্ট নোটিফিকেশনের লেখা **"You were assigned as Writer on …"** — এখানে এখনও "Writer" (ডেটাবেসে হার্ডকোড)। স্ট্যাটাস-বদলের নোটিফিকেশনও এখানে।
- assign_content_uid, set_short_days, perm_of, my_* ফাংশন স্বাভাবিক।
## ধরা পড়া সমস্যা ও করণীয় (অগ্রাধিকার)
1. **`reference_files` কলাম নেই** → Assets ট্যাবের রেফারেন্স ফাইল লাইভে সেভ হয় না (Save failed)। সমাধান: `alter table contents add column reference_files jsonb not null default '[]'` (যোগ-ভিত্তিক, নিরাপদ; guard আটকায় না)।
2. **নোটিফিকেশনে "Writer"** → "Research & Script" (দুই ফাংশন `create or replace`)।
3. **cascade_member_rename অসম্পূর্ণ** → সব ক্রেডিট কলাম ধরানো।
4. channels.name গ্লোবাল ইউনিক (পরে, N14-এর সময়)।
5. পুরনো ডুপ্লিকেট কলাম/টেবিল পরিষ্কার (পরে, ঝুঁকিপূর্ণ নয় কিন্তু জরুরি নয়)।
6. N14 (Channel/Show আইডি): contents.channel নাম দিয়ে; আইডি যোগ + নাম-থেকে-আইডি ব্যাকফিল লাগবে।
7. N12 (নোটিশ): নতুন `notices` টেবিল + RLS (`is_manager()` ব্যবহার) + realtime প্রকাশনায় যোগ।
8. N10 (Show): `shows` টেবিল + contents-এ show_id/season/episode; guard-এ can_edit_metadata নিয়ম।
9. N15 (প্ল্যাটফর্ম): target_platforms (তালিকা) থেকে প্ল্যাটফর্মভিত্তিক অবস্থার কাঠামো।
