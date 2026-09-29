'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------- */
/*  Supabase                                                                  */
/* -------------------------------------------------------------------------- */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_CHANNELS = [
  'The Wave 24',
  'The Wave World',
  'The Wave Money',
  'The Wave Sports',
  'The Wave Faith',
  'The Wave Life',
  'The Wave Glam',
];

const CHANNELS_STORAGE_KEY = 'newsroomops.customChannels';
const TEAM_STORAGE_KEY = 'newsroomops.team';
const ACTOR_STORAGE_KEY = 'newsroomops.actorId';

// Used when the team list is empty so someone can always bootstrap the team.
const OWNER = { id: '_owner', name: 'Producer (Lead)', role: 'admin', active: true };

const ROLE_ORDER = ['admin', 'writer', 'camera', 'editor', 'publisher', 'presenter'];

const ROLES = {
  admin: {
    label: 'Producer / Lead',
    hint: 'Full access, approvals and team management',
    caps: {
      writeScript: true,
      approveScript: true,
      shoot: true,
      assignEditor: true,
      editVideo: true,
      approveVideo: true,
      publish: true,
      holdDrop: true,
      manageTeam: true,
    },
  },
  writer: {
    label: 'Script Writer',
    hint: 'Writes and submits scripts',
    caps: { writeScript: true },
  },
  camera: {
    label: 'Cameraperson',
    hint: 'Starts and wraps shoots',
    caps: { shoot: true },
  },
  editor: {
    label: 'Video Editor',
    hint: 'Edits assigned videos and sends them to review',
    caps: { editVideo: true },
  },
  publisher: {
    label: 'Publisher',
    hint: 'Publishes approved videos',
    caps: { publish: true },
  },
  presenter: {
    label: 'Presenter',
    hint: 'On-air talent, no workflow actions',
    caps: {},
  },
};

const PERM_HINT = {
  writeScript: 'a Script Writer or Producer',
  approveScript: 'the Producer / Lead',
  shoot: 'a Cameraperson',
  assignEditor: 'the Producer / Lead',
  editVideo: 'the assigned Video Editor',
  approveVideo: 'the Producer / Lead',
  publish: 'a Publisher',
  holdDrop: 'the Producer / Lead',
};

const PIPELINE_TYPES = {
  standard: 'Standard (Shoot + Edit)',
  sourced_curated: 'Sourced / Curated (No Shoot)',
  shoot_and_upload: 'Shoot & Upload (Direct)',
};

const PIPELINE_SHORT = {
  standard: 'Standard',
  sourced_curated: 'Curated',
  shoot_and_upload: 'Shoot & Upload',
};

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', code: 'YT', tone: 'text-red-400' },
  { id: 'facebook', label: 'Facebook', code: 'FB', tone: 'text-sky-400' },
  { id: 'tiktok', label: 'TikTok', code: 'TT', tone: 'text-zinc-100' },
  { id: 'instagram', label: 'Instagram', code: 'IG', tone: 'text-pink-400' },
];

const FLOW = [
  'Draft',
  'Script Submitted',
  'Ready for Shoot',
  'Shooting',
  'Assign Editor',
  'Editing',
  'Video Review',
  'Ready to Publish',
  'Published',
];

const STATUS_META = {
  Draft: {
    pill: 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
  'Script Submitted': {
    pill: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    dot: 'bg-sky-400',
  },
  'Ready for Shoot': {
    pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
  },
  Shooting: {
    pill: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    dot: 'bg-violet-400',
  },
  'Assign Editor': {
    pill: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    dot: 'bg-orange-400',
  },
  Editing: {
    pill: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
    dot: 'bg-indigo-300',
  },
  'Video Review': {
    pill: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
    dot: 'bg-fuchsia-400',
  },
  'Ready to Publish': {
    pill: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    dot: 'bg-teal-400',
  },
  Published: {
    pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  'On Hold': {
    pill: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  Dropped: {
    pill: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
};

const TABS = ['Overview', 'Script Desk', 'Assets', 'Shorts & Reels', 'QC & Audit'];

const TABLE_HEADERS = [
  'Schedule',
  'Content UID',
  'Title & Slug',
  'Type',
  'Writer',
  'Presenter',
  'Editor',
  'Status',
  'Targets',
  'Action',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/* -------------------------------------------------------------------------- */
/*  Permissions                                                               */
/* -------------------------------------------------------------------------- */

function can(actor, capKey) {
  const role = actor ? ROLES[actor.role] : null;
  return !!(role && role.caps[capKey]);
}

function getActions(row) {
  switch (row.status) {
    case 'Draft':
      return [{ id: 'submit_script', label: 'Submit Script', perm: 'writeScript' }];
    case 'Script Submitted':
      return row.pipeline_type === 'sourced_curated'
        ? [{ id: 'send_to_edit', label: 'Send to Edit', perm: 'approveScript' }]
        : [{ id: 'approve_shoot', label: 'Approve Shoot', perm: 'approveScript' }];
    case 'Ready for Shoot':
      return [{ id: 'start_shoot', label: 'Start Shoot', perm: 'shoot' }];
    case 'Shooting':
      return [{ id: 'finish_shoot', label: 'Wrap Shoot', perm: 'shoot' }];
    case 'Assign Editor':
      return [{ id: 'assign_editor', label: 'Assign Editor', perm: 'assignEditor' }];
    case 'Editing':
      return [
        {
          id: 'submit_video',
          label: 'Submit Video',
          perm: 'editVideo',
          needsAssignedEditor: true,
        },
      ];
    case 'Video Review':
      return [
        { id: 'reshoot', label: 'Re-Shoot', perm: 'approveVideo', tone: 'danger' },
        { id: 'approve_video', label: 'Approve', perm: 'approveVideo' },
      ];
    case 'Ready to Publish':
      return [{ id: 'publish_now', label: 'Publish Now', perm: 'publish' }];
    case 'On Hold':
      return [{ id: 'resume_task', label: 'Resume', perm: 'holdDrop' }];
    default:
      return [];
  }
}

function isAllowed(actor, action, row) {
  if (!actor) return false;
  if (actor.role === 'admin') return true;
  if (!can(actor, action.perm)) return false;
  if (action.needsAssignedEditor && row.video_editor !== actor.name) return false;
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Date helpers                                                              */
/* -------------------------------------------------------------------------- */

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function shortDate(d, withYear) {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

function formatRangeLabel(range, today) {
  if (!range) return 'Today';
  const { start, end } = range;
  const ref = today || new Date();

  if (sameDay(start, end)) {
    let rel = '';
    if (sameDay(start, ref)) rel = 'Today';
    else if (sameDay(start, addDays(ref, 1))) rel = 'Tomorrow';
    else if (sameDay(start, addDays(ref, -1))) rel = 'Yesterday';
    const full = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...(start.getFullYear() !== ref.getFullYear() ? { year: 'numeric' } : {}),
    });
    return rel ? `${rel} · ${full}` : full;
  }

  const crossYear =
    start.getFullYear() !== end.getFullYear() ||
    start.getFullYear() !== ref.getFullYear();
  return `${shortDate(start, crossYear)} – ${shortDate(end, crossYear)}`;
}

function formatTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRowDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatClock(d) {
  if (!d) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function toLocalInput(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

function fileDateLabel(range) {
  if (!range) return 'rundown';
  const f = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return sameDay(range.start, range.end)
    ? f(range.start)
    : `${f(range.start)}_to_${f(range.end)}`;
}

/* -------------------------------------------------------------------------- */
/*  Data helpers                                                              */
/* -------------------------------------------------------------------------- */

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function normalizeRow(r) {
  return {
    ...r,
    title: r.title || r.slug_name || '',
    slug_name: r.slug_name || '',
    pipeline_type: r.pipeline_type || 'standard',
    status: r.status || 'Draft',
    script: r.script || '',
    script_locked: !!r.script_locked,
    target_platforms: asArray(r.target_platforms),
    shorts: asArray(r.shorts),
    revisions: asArray(r.revisions),
    audit_log: asArray(r.audit_log),
  };
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.scheduled_publish_time || a.created_at || 0).getTime();
    const tb = new Date(b.scheduled_publish_time || b.created_at || 0).getTime();
    return ta - tb;
  });
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countWords(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function speakTime(words) {
  const total = Math.round((words / 130) * 60);
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

function newShort() {
  return {
    thumbnail_text: '',
    title_text: '',
    youtube_shorts_url: '',
    facebook_reel_url: '',
    instagram_reel_url: '',
    tiktok_url: '',
    is_published: false,
  };
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Demo data (used only when Supabase env vars are not configured)           */
/* -------------------------------------------------------------------------- */

const DEMO_TEAM = [
  { id: 'team-1', name: 'Producer (Lead)', role: 'admin', active: true },
  { id: 'team-2', name: 'Rahim Khan', role: 'writer', active: true },
  { id: 'team-3', name: 'Anika Rahman', role: 'writer', active: true },
  { id: 'team-4', name: 'Kabir Hossain', role: 'camera', active: true },
  { id: 'team-5', name: 'Rakib Hassan', role: 'editor', active: true },
  { id: 'team-6', name: 'Tanvir Ahmed', role: 'editor', active: true },
  { id: 'team-7', name: 'Farzana Akhter', role: 'editor', active: true },
  { id: 'team-8', name: 'Sara Mahmud', role: 'publisher', active: true },
  { id: 'team-9', name: 'Farhana Islam', role: 'presenter', active: true },
  { id: 'team-10', name: 'Sabbir Mir', role: 'presenter', active: true },
];

function buildDemoRows() {
  const today = startOfDay(new Date());

  function make(offset, seq, h, m, f) {
    const day = addDays(today, offset);
    const stamp = `${day.getFullYear()}${pad2(day.getMonth() + 1)}${pad2(day.getDate())}`;
    const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    const status = f.status;
    return normalizeRow({
      id: `demo-${stamp}-${seq}`,
      content_uid: `CON-${stamp}-${pad2(seq)}`,
      title: f.title,
      slug_name: f.slug,
      channel: f.channel,
      pipeline_type: f.pipeline || 'standard',
      status,
      previous_status: f.previous || null,
      hold_reason: f.hold || null,
      scheduled_publish_time: when.toISOString(),
      published_at:
        status === 'Published'
          ? new Date(when.getTime() + 5 * 60000).toISOString()
          : null,
      target_platforms: f.platforms || ['youtube', 'facebook'],
      writer: f.writer || '',
      presenter: f.presenter || '',
      camera_person: f.camera || '',
      video_editor: f.editor || '',
      publisher: f.publisher || '',
      archive_shelf_id: f.shelf || '',
      script: f.script || '',
      script_locked: f.locked !== undefined ? f.locked : status !== 'Draft',
      raw_footage_link: f.raw || '',
      project_file_url: f.project || '',
      master_export_url: f.master || '',
      live_video_url: f.live || '',
      shorts: f.shorts || [],
      revisions: f.revisions || [],
      audit_log: f.audit || [
        {
          actor: 'Producer (Lead)',
          from: 'None',
          to: status,
          time: new Date(when.getTime() - 3 * 3600000).toISOString(),
        },
      ],
      created_at: new Date(when.getTime() - 6 * 3600000).toISOString(),
    });
  }

  const rows = [
    // Yesterday
    make(-1, 1, 9, 0, {
      title: 'Budget Session Wraps After Marathon Debate',
      slug: 'budget-session-wrap',
      channel: 'The Wave 24',
      status: 'Published',
      writer: 'Rahim Khan',
      presenter: 'Farhana Islam',
      camera: 'Kabir Hossain',
      editor: 'Rakib Hassan',
      publisher: 'Sara Mahmud',
      script:
        'Parliament wrapped up its budget session late last night. Lawmakers approved the spending plan with amendments on education and transport.',
      live: 'https://youtube.com/watch?v=demo-budget',
    }),
    make(-1, 2, 12, 30, {
      title: 'Stock Market Closing Bell',
      slug: 'market-closing-bell',
      channel: 'The Wave Money',
      status: 'Published',
      writer: 'Anika Rahman',
      presenter: 'Sabbir Mir',
      camera: 'Kabir Hossain',
      editor: 'Tanvir Ahmed',
      publisher: 'Sara Mahmud',
      script:
        'Markets closed higher on strong banking results, with the main index gaining over one percent.',
    }),
    make(-1, 3, 16, 15, {
      title: 'Derby Preview Show',
      slug: 'derby-preview',
      channel: 'The Wave Sports',
      pipeline: 'shoot_and_upload',
      status: 'Published',
      writer: 'Rahim Khan',
      presenter: 'Sabbir Mir',
      camera: 'Kabir Hossain',
      editor: 'Farzana Akhter',
      publisher: 'Sara Mahmud',
      script:
        'Ahead of the weekend derby, both camps are confident. We break down the lineups and the tactical battles.',
    }),

    // Today
    make(0, 1, 8, 30, {
      title: 'Dhaka Metro Rail Line 6 Phase-2 Begins Full Trial Run',
      slug: 'metro-rail-extension',
      channel: 'The Wave 24',
      status: 'Published',
      writer: 'Rahim Khan',
      presenter: 'Farhana Islam',
      camera: 'Kabir Hossain',
      editor: 'Rakib Hassan',
      publisher: 'Sara Mahmud',
      shelf: 'HDD-09 / Shelf-A',
      script:
        'The Dhaka Metro Rail has achieved another milestone as train trials entered Phase 2.\n\nCommuters expressed enthusiasm over reduced travel congestion across the Motijheel corridors.',
      raw: 'https://drive.google.com/drive/folders/demo_raw_metro',
      master: 'https://drive.google.com/file/d/demo_master_metro.mp4',
      live: 'https://youtube.com/watch?v=demo-metro',
      platforms: ['youtube', 'facebook', 'instagram'],
      shorts: [
        {
          thumbnail_text: 'Metro Trials Begin!',
          title_text: 'Metro Rail Phase 2 is live',
          youtube_shorts_url: 'https://youtube.com/shorts/demo-metro-1',
          facebook_reel_url: 'https://facebook.com/reel/demo-metro-1',
          instagram_reel_url: '',
          tiktok_url: '',
          is_published: true,
        },
        {
          thumbnail_text: 'Ride the new line',
          title_text: 'First look inside the new stations',
          youtube_shorts_url: '',
          facebook_reel_url: '',
          instagram_reel_url: '',
          tiktok_url: '',
          is_published: false,
        },
      ],
    }),
    make(0, 2, 9, 15, {
      title: 'Night Raid: Illegal Sand Dredging Along the Meghna',
      slug: 'river-sand-mining-exposed',
      channel: 'The Wave World',
      status: 'Video Review',
      writer: 'Anika Rahman',
      presenter: 'Sabbir Mir',
      camera: 'Kabir Hossain',
      editor: 'Tanvir Ahmed',
      shelf: 'HDD-04 / Shelf-B',
      script:
        'Our investigative drones uncovered nocturnal dredging despite environmental bans. Over twelve vessels were spotted active at 2:00 AM.',
      raw: 'https://drive.google.com/drive/folders/demo_raw_meghna',
      project: 'https://drive.google.com/file/d/demo_meghna.prproj',
      master: 'https://drive.google.com/file/d/demo_meghna_master_v1.mp4',
      revisions: [
        {
          reviewer: 'Producer (Lead)',
          timecode: '02:14',
          feedback_text: 'Blur vessel registration numbers for legal protection.',
          is_resolved: false,
        },
      ],
    }),
    make(0, 3, 10, 0, {
      title: 'How Cloud Rundowns Are Changing High-Velocity Newsrooms',
      slug: 'ai-newsroom-automation',
      channel: 'The Wave World',
      pipeline: 'sourced_curated',
      status: 'Editing',
      writer: 'Anika Rahman',
      presenter: 'Farhana Islam',
      editor: 'Rakib Hassan',
      script:
        'Global broadcasters are rapidly adopting cloud-assisted editorial rundowns. Here is how modern newsrooms deliver dozens of video stories per shift.',
      raw: 'https://drive.google.com/drive/folders/demo_raw_cloud',
      project: 'https://drive.google.com/file/d/demo_cloud.prproj',
      platforms: ['youtube', 'facebook', 'tiktok'],
    }),
    make(0, 4, 11, 30, {
      title: 'Apparel Shipments Break Annual Records in Q3',
      slug: 'export-garment-growth',
      channel: 'The Wave Money',
      status: 'Ready to Publish',
      writer: 'Rahim Khan',
      presenter: 'Farhana Islam',
      camera: 'Kabir Hossain',
      editor: 'Tanvir Ahmed',
      shelf: 'HDD-02 / Shelf-C',
      script:
        'Export promotion bureau figures confirm garment shipments posted an 8.2% year-on-year surge.',
      raw: 'https://drive.google.com/demo_rmg_footage',
      project: 'https://drive.google.com/demo_rmg_final.prproj',
      master: 'https://drive.google.com/demo_rmg_master.mp4',
      platforms: ['youtube', 'facebook', 'tiktok'],
    }),
    make(0, 5, 12, 30, {
      title: 'National Cricket Board Names Final 15-Man Squad',
      slug: 'cricket-world-cup-squad',
      channel: 'The Wave Sports',
      pipeline: 'shoot_and_upload',
      status: 'Shooting',
      writer: 'Rahim Khan',
      presenter: 'Sabbir Mir',
      camera: 'Kabir Hossain',
      script:
        'The selection panel surprised pundits with two young uncapped pace bowling prospects.',
    }),
    make(0, 6, 14, 0, {
      title: 'School Budget Vote Tonight',
      slug: 'school-budget-vote',
      channel: 'The Wave 24',
      status: 'Assign Editor',
      writer: 'Anika Rahman',
      presenter: 'Farhana Islam',
      camera: 'Kabir Hossain',
      script:
        'The school board votes tonight on a budget that would fund smaller class sizes and expanded after-school programs.',
      raw: 'https://drive.google.com/drive/folders/demo_raw_school',
    }),
    make(0, 7, 15, 45, {
      title: 'First Silicon Nanofabrication Lab Breaks Ground in Savar',
      slug: 'semiconductor-lab-savar',
      channel: 'The Wave World',
      status: 'Draft',
      writer: 'Rahim Khan',
      presenter: 'Farhana Islam',
      script:
        'Research labs in Savar take the nation a step closer to high-tech silicon wafer design and testing.',
      locked: false,
      platforms: ['youtube'],
    }),
    make(0, 8, 17, 30, {
      title: 'Night Market Returns This Friday',
      slug: 'night-market-returns',
      channel: 'The Wave Life',
      status: 'Ready for Shoot',
      writer: 'Anika Rahman',
      presenter: 'Farhana Islam',
      script:
        'The beloved night market returns with over one hundred food stalls, live music and a new artisan quarter.',
    }),
    make(0, 9, 19, 0, {
      title: 'Fashion Week Red Carpet Highlights',
      slug: 'fashion-week-red-carpet',
      channel: 'The Wave Glam',
      status: 'Script Submitted',
      writer: 'Anika Rahman',
      presenter: 'Farhana Islam',
      script: 'From bold silhouettes to heritage weaves, the red carpet set the tone for the season.',
      locked: false,
      platforms: ['youtube', 'instagram'],
    }),
    make(0, 10, 20, 0, {
      title: 'Evening Reflections Special',
      slug: 'evening-reflections',
      channel: 'The Wave Faith',
      status: 'On Hold',
      previous: 'Ready for Shoot',
      hold: 'Guest speaker unavailable until next week.',
      writer: 'Rahim Khan',
      presenter: 'Sabbir Mir',
      script: '',
    }),

    // Tomorrow
    make(1, 1, 9, 0, {
      title: 'Morning Headlines Package',
      slug: 'morning-headlines',
      channel: 'The Wave 24',
      status: 'Ready for Shoot',
      writer: 'Rahim Khan',
      presenter: 'Farhana Islam',
      script: 'Top stories to start the day, from the capital to the coast.',
    }),
    make(1, 2, 14, 30, {
      title: 'Weekend Wellness Guide',
      slug: 'weekend-wellness-guide',
      channel: 'The Wave Life',
      status: 'Draft',
      writer: 'Anika Rahman',
      presenter: 'Farhana Islam',
      script: '',
      locked: false,
    }),
    make(1, 3, 18, 0, {
      title: 'Cricket Series Final Preview',
      slug: 'cricket-series-final-preview',
      channel: 'The Wave Sports',
      status: 'Script Submitted',
      writer: 'Rahim Khan',
      presenter: 'Sabbir Mir',
      script: 'Both sides arrive at the decider with momentum and a few selection headaches.',
      locked: false,
    }),
  ];

  return sortRows(rows);
}

/* -------------------------------------------------------------------------- */
/*  Small presentational components                                           */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }) {
  const meta =
    STATUS_META[status] || {
      pill: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
      dot: 'bg-zinc-400',
    };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight backdrop-blur-md ${meta.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] tracking-tight text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 ease-out hover:border-white/[0.14] focus:border-sky-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-sky-400/10 disabled:cursor-not-allowed disabled:opacity-60';

const readOnlyClass =
  'w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-[13px] tracking-tight text-zinc-400';

const pillButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium tracking-tight text-zinc-200 transition-all duration-200 ease-out hover:bg-white/[0.09] active:scale-[0.96]';

const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold tracking-tight text-black shadow-lg shadow-white/5 transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-zinc-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white';

const ghostButtonClass =
  'rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[12px] font-medium tracking-tight text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.09] active:scale-95';

function Icon({ children, className }) {
  return (
    <svg
      className={className || 'h-3.5 w-3.5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <Icon className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </Icon>
  );
}

function ChevronIcon({ open }) {
  return (
    <Icon
      className={`h-3 w-3 transition-transform duration-200 ease-out ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

function ArrowIcon({ dir }) {
  return (
    <Icon>
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </Icon>
  );
}

function CalendarIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

function CopyIcon() {
  return (
    <Icon>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

function ChartIcon() {
  return (
    <Icon>
      <path d="M3 3v18h18" />
      <path d="M8 17V9M13 17V5M18 17v-6" />
    </Icon>
  );
}

function DownloadIcon() {
  return (
    <Icon>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </Icon>
  );
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

function DotsIcon() {
  return (
    <Icon className="h-4 w-4">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Icon>
  );
}

function TrashIcon() {
  return (
    <Icon>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </Icon>
  );
}

function ExternalIcon() {
  return (
    <Icon>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </Icon>
  );
}

function CheckIcon({ className }) {
  return (
    <Icon className={className || 'h-3 w-3'}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

/* A text input that keeps a local draft and commits on blur / Enter. */
function BlurInput({
  value,
  onCommit,
  type = 'text',
  placeholder,
  list,
  disabled,
  className,
}) {
  const [draft, setDraft] = useState(value || '');

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  function commit() {
    const next = draft.trim();
    if (next !== (value || '')) onCommit(next);
  }

  return (
    <input
      type={type}
      value={draft}
      list={list}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={`${className || inputClass} ${
        type === 'datetime-local' ? '[color-scheme:dark]' : ''
      }`}
    />
  );
}

function ModalShell({ title, subtitle, onClose, maxWidth, children }) {
  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative my-6 w-full ${
            maxWidth || 'max-w-[440px]'
          } rounded-3xl border border-white/10 bg-[#0c0c0e]/95 p-6 shadow-2xl shadow-black backdrop-blur-2xl`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-[13px] leading-relaxed tracking-tight text-zinc-500">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[13px] text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.12] hover:text-white active:scale-90"
            >
              ✕
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Workflow action buttons                                                   */
/* -------------------------------------------------------------------------- */

function ActionButtons({ row, actor, busy, onAction, large }) {
  if (row.status === 'Published') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[12px] font-semibold tracking-tight text-emerald-400">
        <CheckIcon />
        Live
      </span>
    );
  }
  if (row.status === 'Dropped') {
    return (
      <span className="text-[12px] font-medium tracking-tight text-red-400/80">
        Cancelled
      </span>
    );
  }

  const actions = getActions(row);

  return (
    <span className="inline-flex items-center gap-1.5">
      {actions.map((a) => {
        const allowed = isAllowed(actor, a, row);
        const danger = a.tone === 'danger';
        return (
          <button
            key={a.id}
            type="button"
            disabled={!allowed || busy}
            title={allowed ? '' : `Requires ${PERM_HINT[a.perm]}`}
            onClick={(e) => {
              e.stopPropagation();
              onAction(a, row);
            }}
            className={
              danger
                ? `inline-flex items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-1.5 text-[12px] font-semibold tracking-tight text-red-400 transition-all duration-200 ease-out hover:bg-red-500/20 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 ${
                    large ? 'px-5 py-2.5' : ''
                  }`
                : `${primaryButtonClass} ${
                    large ? 'px-5 py-2.5 text-[13px]' : 'min-w-[112px]'
                  }`
            }
          >
            {busy && !danger ? 'Working…' : a.label}
          </button>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Channel selector                                                          */
/* -------------------------------------------------------------------------- */

function ChannelSelector({ channels, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const options = ['All Channels', ...channels];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={pillButtonClass}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        <span className="max-w-[150px] truncate">{value}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-[340px] min-w-[210px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[12px] tracking-tight transition-colors duration-200 ease-out ${
                opt === value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
              }`}
            >
              {opt}
              {opt === value && <CheckIcon className="h-3 w-3 shrink-0 text-sky-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Date range picker                                                         */
/* -------------------------------------------------------------------------- */

function DatePicker({ range, today, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  const ref = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setAnchor(null);
    setHover(null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) close();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!range || !today) {
    return (
      <div className="h-[30px] w-[190px] animate-pulse rounded-full border border-white/[0.08] bg-white/[0.04]" />
    );
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    setView(startOfMonth(range.start));
    setAnchor(null);
    setHover(null);
    setOpen(true);
  }

  function applyRange(next) {
    onChange({ start: startOfDay(next.start), end: startOfDay(next.end) });
    setView(startOfMonth(next.start));
    setAnchor(null);
    setHover(null);
  }

  function pick(d) {
    if (!anchor) {
      onChange({ start: d, end: d });
      setAnchor(d);
      return;
    }
    const lo = anchor.getTime() <= d.getTime() ? anchor : d;
    const hi = anchor.getTime() <= d.getTime() ? d : anchor;
    onChange({ start: lo, end: hi });
    setAnchor(null);
    setHover(null);
    setOpen(false);
  }

  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const weekStart = addDays(today, -dayOfWeek);
  const presets = [
    { label: 'Today', get: () => ({ start: today, end: today }) },
    {
      label: 'Yesterday',
      get: () => ({ start: addDays(today, -1), end: addDays(today, -1) }),
    },
    {
      label: 'Tomorrow',
      get: () => ({ start: addDays(today, 1), end: addDays(today, 1) }),
    },
    {
      label: 'This week',
      get: () => ({ start: weekStart, end: addDays(weekStart, 6) }),
    },
    {
      label: 'Last 7 days',
      get: () => ({ start: addDays(today, -6), end: today }),
    },
    {
      label: 'This month',
      get: () => ({
        start: startOfMonth(today),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      }),
    },
  ];

  const activeView = view || startOfMonth(range.start);
  const first = startOfMonth(activeView);
  const gridStart = addDays(first, -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  let lo = range.start;
  let hi = range.end;
  if (anchor && hover) {
    lo = anchor.getTime() <= hover.getTime() ? anchor : hover;
    hi = anchor.getTime() <= hover.getTime() ? hover : anchor;
  } else if (anchor) {
    lo = anchor;
    hi = anchor;
  }
  const loMs = lo.getTime();
  const hiMs = hi.getTime();
  const spanDays = Math.round((hiMs - loMs) / 86400000) + 1;
  const isRange = spanDays > 1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${pillButtonClass} ${open ? 'bg-white/[0.1]' : ''}`}
      >
        <CalendarIcon />
        <span className="whitespace-nowrap">{formatRangeLabel(range, today)}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute left-0 top-full z-30 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-[#0c0c0e]/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-2xl"
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const r = p.get();
              const active =
                sameDay(r.start, range.start) && sameDay(r.end, range.end);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyRange(r)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight transition-all duration-200 ease-out active:scale-95 ${
                    active
                      ? 'border-white/20 bg-white text-black'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setView(new Date(first.getFullYear(), first.getMonth() - 1, 1))
              }
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.08] active:scale-90"
            >
              <ArrowIcon dir="left" />
            </button>
            <div className="text-[14px] font-semibold tracking-tight text-white">
              {MONTH_NAMES[first.getMonth()]} {first.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() =>
                setView(new Date(first.getFullYear(), first.getMonth() + 1, 1))
              }
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.08] active:scale-90"
            >
              <ArrowIcon dir="right" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600"
              >
                {w}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-y-0.5"
            onMouseLeave={() => setHover(null)}
          >
            {cells.map((d) => {
              const ms = d.getTime();
              const inMonth = d.getMonth() === first.getMonth();
              const isStart = ms === loMs;
              const isEnd = ms === hiMs;
              const inside = ms > loMs && ms < hiMs;
              const isToday = sameDay(d, today);
              const selectedEdge = isStart || isEnd;

              let strip = '';
              if (isRange && (inside || selectedEdge)) {
                strip = 'bg-white/[0.08]';
                if (isStart) strip += ' rounded-l-full';
                if (isEnd) strip += ' rounded-r-full';
              }

              return (
                <div key={ms} className={`flex justify-center ${strip}`}>
                  <button
                    type="button"
                    onClick={() => pick(d)}
                    onMouseEnter={() => {
                      if (anchor) setHover(d);
                    }}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[12.5px] font-medium tabular-nums tracking-tight transition-all duration-150 ease-out ${
                      selectedEdge
                        ? 'bg-white text-black'
                        : inMonth
                        ? 'text-zinc-200 hover:bg-white/[0.12]'
                        : 'text-zinc-700 hover:bg-white/[0.06]'
                    }`}
                  >
                    {d.getDate()}
                    {isToday && (
                      <span
                        className={`absolute bottom-1 h-[3px] w-[3px] rounded-full ${
                          selectedEdge ? 'bg-black' : 'bg-sky-400'
                        }`}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
            <div className="text-[11px] tracking-tight text-zinc-500">
              {anchor
                ? 'Click another date for a range'
                : `${spanDays} ${spanDays === 1 ? 'day' : 'days'} selected`}
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modals                                                                    */
/* -------------------------------------------------------------------------- */

function AddChannelModal({ existing, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const value = name.trim().replace(/\s+/g, ' ');
    if (!value) {
      setErr('Enter a channel name.');
      return;
    }
    if (value.length > 40) {
      setErr('Keep the name under 40 characters.');
      return;
    }
    if (existing.some((c) => c.toLowerCase() === value.toLowerCase())) {
      setErr('That channel already exists.');
      return;
    }
    setSaving(true);
    await onAdd(value);
    setSaving(false);
  }

  return (
    <ModalShell
      title="Add channel"
      subtitle="New channels appear in the channel selector straight away."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Field label="Channel name">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (err) setErr('');
            }}
            placeholder="e.g. The Wave Kids"
            className={inputClass}
          />
        </Field>
        {err && <div className="mt-2 text-[12px] tracking-tight text-red-400">{err}</div>}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`${primaryButtonClass} px-5 py-2`}
          >
            {saving ? 'Adding…' : 'Add channel'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function NewContentModal({
  channels,
  writers,
  presenters,
  defaultChannel,
  defaultWhen,
  defaultWriter,
  onCreate,
  onClose,
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [pipeline, setPipeline] = useState('standard');
  const [channel, setChannel] = useState(defaultChannel);
  const [when, setWhen] = useState(defaultWhen);
  const [writer, setWriter] = useState(defaultWriter || '');
  const [presenter, setPresenter] = useState('');
  const [script, setScript] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const words = countWords(script);

  async function submit(e) {
    e.preventDefault();
    const cleanTitle = title.trim().replace(/\s+/g, ' ');
    if (!cleanTitle) {
      setErr('Enter a headline / story title.');
      return;
    }
    if (cleanTitle.length > 160) {
      setErr('Keep the title under 160 characters.');
      return;
    }
    if (!when) {
      setErr('Pick a scheduled date and time.');
      return;
    }
    setSaving(true);
    setErr('');
    const result = await onCreate({
      title: cleanTitle,
      slug: slugify(slug) || slugify(cleanTitle),
      pipeline,
      channel,
      when,
      writer: writer.trim(),
      presenter: presenter.trim(),
      script: script.trim(),
    });
    setSaving(false);
    if (result && !result.ok) setErr(result.error || 'Could not create the content.');
  }

  return (
    <ModalShell
      title="New content"
      subtitle="Creates a draft on the rundown. The Content UID is generated automatically."
      onClose={onClose}
      maxWidth="max-w-[600px]"
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Headline / story title">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (err) setErr('');
            }}
            placeholder="e.g. Metro Line Extension Opens to Commuters"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug name">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(title) || 'auto-from-title'}
              className={inputClass}
            />
          </Field>
          <Field label="Pipeline type">
            <div className="relative">
              <select
                value={pipeline}
                onChange={(e) => setPipeline(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                {Object.keys(PIPELINE_TYPES).map((k) => (
                  <option key={k} value={k} className="bg-[#0c0c0e]">
                    {PIPELINE_TYPES[k]}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronIcon open={false} />
              </div>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Channel">
            <div className="relative">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                {channels.map((c) => (
                  <option key={c} value={c} className="bg-[#0c0c0e]">
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronIcon open={false} />
              </div>
            </div>
          </Field>
          <Field label="Scheduled publish time">
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Writer">
            <input
              type="text"
              list="new-writers"
              value={writer}
              onChange={(e) => setWriter(e.target.value)}
              placeholder="Writer name"
              className={inputClass}
            />
            <datalist id="new-writers">
              {writers.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label="Presenter">
            <input
              type="text"
              list="new-presenters"
              value={presenter}
              onChange={(e) => setPresenter(e.target.value)}
              placeholder="Presenter name"
              className={inputClass}
            />
            <datalist id="new-presenters">
              {presenters.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="Script (optional)">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            placeholder="Write or paste the script here…"
            className={`${inputClass} min-h-[160px] resize-y leading-[1.7]`}
          />
          <div className="mt-1.5 text-[11px] tabular-nums tracking-tight text-zinc-500">
            {words} {words === 1 ? 'word' : 'words'}
            {words > 0 ? ` · ~${speakTime(words)} on air` : ''}
          </div>
        </Field>

        {err && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[12px] tracking-tight text-red-300">
            {err}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`${primaryButtonClass} px-5 py-2`}
          >
            {saving ? 'Creating…' : 'Save as draft'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ReasonModal({ ctx, onClose }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    const value = reason.trim();
    if (!value) {
      setErr('A reason is required.');
      return;
    }
    setBusy(true);
    await ctx.onConfirm(value);
    setBusy(false);
    onClose();
  }

  return (
    <ModalShell title={ctx.title} subtitle={ctx.desc} onClose={onClose}>
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          if (err) setErr('');
        }}
        rows={4}
        placeholder="Provide a short justification…"
        className={`${inputClass} resize-y leading-relaxed`}
      />
      {err && <div className="mt-2 text-[12px] tracking-tight text-red-400">{err}</div>}
      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className={
            ctx.danger
              ? 'rounded-full bg-red-500 px-5 py-2 text-[12px] font-semibold tracking-tight text-white transition-all duration-200 ease-out hover:bg-red-400 active:scale-95 disabled:opacity-50'
              : `${primaryButtonClass} px-5 py-2`
          }
        >
          {busy ? 'Saving…' : ctx.confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function AssignEditorModal({ row, editors, workload, onSelect, onClose }) {
  return (
    <ModalShell
      title="Assign video editor"
      subtitle={`${row.content_uid} · live editing workload`}
      onClose={onClose}
      maxWidth="max-w-[420px]"
    >
      {editors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-10 text-center text-[13px] tracking-tight text-zinc-500">
          No active video editors yet. Add one from the Team panel.
        </div>
      ) : (
        <div className="space-y-2">
          {editors.map((name) => {
            const count = workload ? workload[name] || 0 : null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onSelect(name)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left transition-all duration-200 ease-out hover:border-white/[0.2] hover:bg-white/[0.07] active:scale-[0.99]"
              >
                <div>
                  <div className="text-[13px] font-medium tracking-tight text-white">
                    {name}
                  </div>
                  <div className="text-[11px] tracking-tight text-zinc-500">
                    Video Editor
                  </div>
                </div>
                {count === null ? (
                  <span className="text-[11px] text-zinc-600">…</span>
                ) : count === 0 ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                    Available
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
                    {count} in progress
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

function TeamModal({ team, canManage, shared, isDemo, onAdd, onUpdate, onRemove, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('writer');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...team].sort((a, b) => {
        const ra = ROLE_ORDER.indexOf(a.role);
        const rb = ROLE_ORDER.indexOf(b.role);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      }),
    [team]
  );

  async function submit(e) {
    e.preventDefault();
    const value = name.trim().replace(/\s+/g, ' ');
    if (!value) {
      setErr('Enter the person’s name.');
      return;
    }
    setSaving(true);
    const result = await onAdd(value, role);
    setSaving(false);
    if (result && !result.ok) {
      setErr(result.error || 'Could not add the member.');
      return;
    }
    setName('');
    setErr('');
  }

  return (
    <ModalShell
      title="Team & roles"
      subtitle="Each role controls which workflow steps a person can perform."
      onClose={onClose}
      maxWidth="max-w-[680px]"
    >
      {!isDemo && !shared && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-[12px] leading-relaxed tracking-tight text-amber-300">
          The <span className="font-mono">team_members</span> table was not found, so
          the team is saved on this device only. Create the table to share it with
          everyone.
        </div>
      )}

      {canManage ? (
        <form onSubmit={submit} className="mb-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (err) setErr('');
                  }}
                  placeholder="Full name"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="w-[190px]">
              <Field label="Role">
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`${inputClass} appearance-none pr-9`}
                  >
                    {ROLE_ORDER.map((r) => (
                      <option key={r} value={r} className="bg-[#0c0c0e]">
                        {ROLES[r].label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    <ChevronIcon open={false} />
                  </div>
                </div>
              </Field>
            </div>
            <button
              type="submit"
              disabled={saving}
              className={`${primaryButtonClass} h-[42px] px-5`}
            >
              <PlusIcon />
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
          {err && <div className="mt-2 text-[12px] tracking-tight text-red-400">{err}</div>}
          <div className="mt-2 text-[11px] tracking-tight text-zinc-600">
            {ROLES[role].hint}
          </div>
        </form>
      ) : (
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[12px] tracking-tight text-zinc-400">
          Only a Producer / Lead can add people or change roles.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
        {sorted.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] tracking-tight text-zinc-500">
            No team members yet. Add your first one above.
          </div>
        )}
        {sorted.map((m, i) => (
          <div
            key={m.id}
            className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
              i > 0 ? 'border-t border-white/[0.06]' : ''
            } ${m.active ? '' : 'opacity-50'}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold uppercase tracking-tight text-zinc-200">
              {m.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="min-w-[120px] flex-1">
              <div className="text-[13px] font-medium tracking-tight text-white">
                {m.name}
              </div>
              <div className="text-[11px] tracking-tight text-zinc-500">
                {ROLES[m.role] ? ROLES[m.role].hint : ''}
              </div>
            </div>
            <div className="relative w-[170px]">
              <select
                value={m.role}
                disabled={!canManage}
                onChange={(e) => onUpdate(m.id, { role: e.target.value })}
                className={`${inputClass} appearance-none py-1.5 pr-8 text-[12px]`}
              >
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r} className="bg-[#0c0c0e]">
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronIcon open={false} />
              </div>
            </div>
            <button
              type="button"
              disabled={!canManage}
              onClick={() => onUpdate(m.id, { active: !m.active })}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight transition-all duration-200 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                m.active
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[0.08] bg-white/[0.04] text-zinc-400'
              }`}
            >
              {m.active ? 'Active' : 'Inactive'}
            </button>
            {canManage && (
              <button
                type="button"
                aria-label={`Remove ${m.name}`}
                onClick={() => {
                  if (window.confirm(`Remove ${m.name} from the team?`)) onRemove(m.id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 ease-out hover:bg-red-500/10 hover:text-red-400 active:scale-90"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed tracking-tight text-zinc-600">
        Access rules are applied in the interface. Add sign-in (Supabase Auth) before
        exposing this app outside your newsroom.
      </p>
    </ModalShell>
  );
}

function KpiModal({ rows, team, rangeLabel, onClose }) {
  const table = useMemo(() => {
    const stats = new Map();
    const ensure = (name) => {
      if (!name) return null;
      if (!stats.has(name)) {
        stats.set(name, { scripts: 0, shoots: 0, edits: 0, published: 0, revisions: 0 });
      }
      return stats.get(name);
    };
    team.filter((m) => m.active).forEach((m) => ensure(m.name));

    rows.forEach((r) => {
      const w = ensure(r.writer);
      if (w) w.scripts += 1;

      const c = ensure(r.camera_person);
      if (c) {
        c.shoots += 1;
        if (r.reshoot_reason) c.revisions += 1;
      }

      const e = ensure(r.video_editor);
      if (e) {
        if (['Editing', 'Video Review', 'Ready to Publish', 'Published'].includes(r.status)) {
          e.edits += 1;
        }
        e.revisions += r.revisions.length;
      }

      const p = ensure(r.publisher);
      if (p && r.status === 'Published') p.published += 1;
    });

    return Array.from(stats.entries())
      .map(([name, s]) => {
        const member = team.find((m) => m.name === name);
        return {
          name,
          role: member && ROLES[member.role] ? ROLES[member.role].label : '',
          ...s,
          total: s.scripts + s.shoots + s.edits + s.published,
        };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [rows, team]);

  const cell = (v, tone) => (
    <td
      className={`px-3 py-3 text-center text-[13px] tabular-nums tracking-tight ${
        v ? tone || 'font-semibold text-white' : 'text-zinc-700'
      }`}
    >
      {v}
    </td>
  );

  return (
    <ModalShell
      title="Team productivity"
      subtitle={`Throughput by person · ${rangeLabel}`}
      onClose={onClose}
      maxWidth="max-w-[760px]"
    >
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Team member</th>
              <th className="px-3 py-3 text-center">Scripts</th>
              <th className="px-3 py-3 text-center">Shoots</th>
              <th className="px-3 py-3 text-center">Edited</th>
              <th className="px-3 py-3 text-center">Published</th>
              <th className="px-3 py-3 text-center text-red-400/80">Revisions</th>
            </tr>
          </thead>
          <tbody>
            {table.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-zinc-500">
                  No activity in this date range.
                </td>
              </tr>
            )}
            {table.map((r) => (
              <tr key={r.name} className="border-b border-white/[0.05] last:border-b-0">
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium tracking-tight text-white">
                    {r.name}
                  </div>
                  {r.role && (
                    <div className="text-[11px] tracking-tight text-zinc-500">{r.role}</div>
                  )}
                </td>
                {cell(r.scripts)}
                {cell(r.shoots)}
                {cell(r.edits)}
                {cell(r.published, 'font-semibold text-emerald-400')}
                {cell(r.revisions, 'font-semibold text-red-400')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] tracking-tight text-zinc-600">
        Revisions count QC comments on an editor’s videos and re-shoots on a
        cameraperson’s stories.
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drawer tabs                                                               */
/* -------------------------------------------------------------------------- */

function DrawerMenu({ onHold, onDrop, canHold }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.12] hover:text-white active:scale-90"
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          {canHold && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onHold();
              }}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[12px] tracking-tight text-yellow-400 transition-colors duration-200 ease-out hover:bg-yellow-500/10"
            >
              Put on hold
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDrop();
            }}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[12px] tracking-tight text-red-400 transition-colors duration-200 ease-out hover:bg-red-500/10"
          >
            Drop content
          </button>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ row, team, update }) {
  const names = (role) =>
    team.filter((m) => m.role === role && m.active).map((m) => m.name);

  const flowStatus = row.status === 'On Hold' ? row.previous_status : row.status;
  const flowIndex = FLOW.indexOf(flowStatus);

  function togglePlatform(id) {
    const has = row.target_platforms.includes(id);
    const next = has
      ? row.target_platforms.filter((p) => p !== id)
      : [...row.target_platforms, id];
    update({ target_platforms: next });
  }

  return (
    <div className="space-y-6">
      {row.status === 'On Hold' && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-[13px] leading-relaxed tracking-tight text-yellow-300">
          <span className="font-semibold">On hold.</span>{' '}
          {row.hold_reason || 'No reason recorded.'}
        </div>
      )}
      {row.status === 'Dropped' && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed tracking-tight text-red-300">
          <span className="font-semibold">Dropped.</span>{' '}
          {row.drop_reason || 'No reason recorded.'}
        </div>
      )}
      {row.reshoot_reason && row.status !== 'Dropped' && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] leading-relaxed tracking-tight text-zinc-400">
          <span className="font-semibold text-zinc-300">Last re-shoot reason:</span>{' '}
          {row.reshoot_reason}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Channel">
          <div className={readOnlyClass}>{row.channel || '—'}</div>
        </Field>
        <Field label="Pipeline type">
          <div className={readOnlyClass}>
            {PIPELINE_TYPES[row.pipeline_type] || row.pipeline_type}
          </div>
        </Field>
      </div>

      <Field label="Scheduled release time">
        <BlurInput
          type="datetime-local"
          value={toLocalInput(row.scheduled_publish_time)}
          onCommit={(v) => {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) {
              update({ scheduled_publish_time: d.toISOString() }, 'Schedule updated');
            }
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Script writer">
          <BlurInput
            value={row.writer}
            list="dl-writers"
            placeholder="Assign a writer"
            onCommit={(v) => update({ writer: v || null }, 'Writer updated')}
          />
        </Field>
        <Field label="Presenter">
          <BlurInput
            value={row.presenter}
            list="dl-presenters"
            placeholder="Assign a presenter"
            onCommit={(v) => update({ presenter: v || null }, 'Presenter updated')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cameraperson">
          <BlurInput
            value={row.camera_person}
            list="dl-cameras"
            placeholder="Assign a cameraperson"
            onCommit={(v) => update({ camera_person: v || null }, 'Cameraperson updated')}
          />
        </Field>
        <Field label="Assigned video editor">
          <div className={readOnlyClass}>{row.video_editor || 'Unassigned'}</div>
        </Field>
      </div>

      <datalist id="dl-writers">
        {names('writer').map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="dl-presenters">
        {names('presenter').map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="dl-cameras">
        {names('camera').map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <Field label="Archive shelf ID (physical HDD / vault)">
        <BlurInput
          value={row.archive_shelf_id}
          placeholder="e.g. HDD-08 / Rack 3"
          onCommit={(v) => update({ archive_shelf_id: v || null }, 'Shelf ID updated')}
        />
      </Field>

      <Field label="Target platforms">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = row.target_platforms.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium tracking-tight transition-all duration-200 ease-out active:scale-95 ${
                  on
                    ? 'border-white/20 bg-white/[0.1] text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {on && <CheckIcon className="h-3 w-3 text-emerald-400" />}
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Progress">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center justify-between">
            <StatusBadge status={row.status} />
            <span className="text-[11px] tabular-nums tracking-tight text-zinc-500">
              {flowIndex >= 0 ? `Step ${flowIndex + 1} of ${FLOW.length}` : '—'}
            </span>
          </div>
          <div className="flex gap-1">
            {FLOW.map((step, i) => (
              <div
                key={step}
                title={step}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ease-out ${
                  i <= flowIndex && row.status !== 'Dropped'
                    ? 'bg-white'
                    : 'bg-white/[0.1]'
                }`}
              />
            ))}
          </div>
        </div>
      </Field>
    </div>
  );
}

function ScriptTab({ row, actor, update, onCopy }) {
  const [draft, setDraft] = useState(row.script);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(row.script || '');
  }, [row.id, row.script]);

  const closed = row.status === 'Published' || row.status === 'Dropped';
  const editable = !row.script_locked && !closed && can(actor, 'writeScript');
  const words = countWords(editable ? draft : row.script);
  const isAdmin = actor.role === 'admin';

  async function save() {
    setSaving(true);
    await update({ script: draft.trim() }, 'Script saved');
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tabular-nums tracking-tight text-zinc-300">
          {words} {words === 1 ? 'word' : 'words'}
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tabular-nums tracking-tight text-zinc-300">
          {words === 0 ? 'No runtime' : `~${speakTime(words)} on air`}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight ${
            row.script_locked
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {row.script_locked ? 'Script locked' : 'Editable'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && !closed && (
            <button
              type="button"
              onClick={() =>
                update(
                  { script_locked: !row.script_locked },
                  row.script_locked ? 'Script unlocked' : 'Script locked'
                )
              }
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.1] active:scale-95"
            >
              {row.script_locked ? 'Unlock' : 'Lock'}
            </button>
          )}
          {row.script && (
            <button
              type="button"
              onClick={() => onCopy(row.script, 'Script')}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.1] active:scale-95"
            >
              <CopyIcon />
              Copy
            </button>
          )}
        </div>
      </div>

      {editable ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            placeholder="Write the teleprompter or voice-over script here…"
            className={`${inputClass} min-h-[340px] resize-y text-[15px] leading-[1.75]`}
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || draft.trim() === (row.script || '')}
              className={`${primaryButtonClass} px-5 py-2.5`}
            >
              {saving ? 'Saving…' : 'Save script'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(row.script || '')}
              disabled={draft === (row.script || '')}
              className={`${ghostButtonClass} disabled:opacity-40`}
            >
              Revert
            </button>
          </div>
        </>
      ) : row.script ? (
        <>
          <article className="space-y-5 text-[16px] leading-[1.75] tracking-tight text-zinc-200">
            {row.script
              .split(/\n{2,}/)
              .filter((p) => p.trim().length > 0)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </article>
          <p className="mt-5 text-[12px] tracking-tight text-zinc-600">
            {closed
              ? 'This story is closed, so the script is read-only.'
              : row.script_locked
              ? 'The script is locked after approval. A Producer can unlock it.'
              : 'Only a Script Writer or Producer can edit the script.'}
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-14 text-center">
          <div className="text-[14px] font-medium tracking-tight text-zinc-300">
            No script yet
          </div>
          <div className="mt-1 text-[12px] tracking-tight text-zinc-500">
            {row.writer
              ? `${row.writer} hasn’t filed copy for this story.`
              : 'No writer has filed copy for this story.'}
          </div>
        </div>
      )}
    </div>
  );
}

function LinkRow({ label, value, placeholder, openLabel, onCommit }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <BlurInput
          type="url"
          value={value}
          placeholder={placeholder}
          onCommit={onCommit}
        />
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-[12px] font-medium tracking-tight text-zinc-200 transition-all duration-200 ease-out hover:bg-white/[0.1] active:scale-95"
          >
            <ExternalIcon />
            {openLabel}
          </a>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.05] px-3.5 text-[12px] font-medium tracking-tight text-zinc-700">
            <ExternalIcon />
            {openLabel}
          </span>
        )}
      </div>
    </Field>
  );
}

function AssetsTab({ row, update, onCopy }) {
  const assetName = `${row.content_uid}_${slugify(row.slug_name || row.title)}`;
  return (
    <div className="space-y-6">
      <Field label="Copy-ready asset name">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 pl-3.5">
          <code className="min-w-0 flex-1 truncate font-mono text-[12px] tracking-normal text-zinc-200">
            {assetName}
          </code>
          <button
            type="button"
            onClick={() => onCopy(assetName, 'Asset name')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-95"
          >
            <CopyIcon />
            Copy
          </button>
        </div>
      </Field>

      <LinkRow
        label="Raw footage (Drive / NAS)"
        value={row.raw_footage_link}
        placeholder="https://drive.google.com/…"
        openLabel="Open"
        onCommit={(v) => update({ raw_footage_link: v }, 'Footage link saved')}
      />
      <LinkRow
        label="Project file (.prproj / .drp)"
        value={row.project_file_url}
        placeholder="https://drive.google.com/…"
        openLabel="Open"
        onCommit={(v) => update({ project_file_url: v }, 'Project link saved')}
      />
      <LinkRow
        label="Master video export (ProRes / MP4)"
        value={row.master_export_url}
        placeholder="https://drive.google.com/…"
        openLabel="Open"
        onCommit={(v) => update({ master_export_url: v }, 'Master link saved')}
      />
      <LinkRow
        label="Main live published video link"
        value={row.live_video_url}
        placeholder="https://youtube.com/watch?v=…"
        openLabel="Live"
        onCommit={(v) => update({ live_video_url: v }, 'Live link saved')}
      />
    </div>
  );
}

function ShortCard({ index, item, onChange, onRemove }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold tracking-tight text-white">
          Short / Reel #{index + 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ is_published: !item.is_published })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight transition-all duration-200 ease-out active:scale-95 ${
              item.is_published
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {item.is_published && <CheckIcon />}
            {item.is_published ? 'Published' : 'Mark published'}
          </button>
          <button
            type="button"
            aria-label={`Remove short ${index + 1}`}
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 ease-out hover:bg-red-500/10 hover:text-red-400 active:scale-90"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <Field label="Thumbnail hook text">
        <BlurInput
          value={item.thumbnail_text}
          placeholder="e.g. 5 things you missed!"
          onCommit={(v) => onChange({ thumbnail_text: v })}
        />
      </Field>
      <Field label="Title / caption">
        <BlurInput
          value={item.title_text}
          placeholder="Title text…"
          onCommit={(v) => onChange({ title_text: v })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <BlurInput
          type="url"
          value={item.youtube_shorts_url}
          placeholder="YouTube Shorts URL"
          onCommit={(v) => onChange({ youtube_shorts_url: v })}
        />
        <BlurInput
          type="url"
          value={item.facebook_reel_url}
          placeholder="Facebook Reel URL"
          onCommit={(v) => onChange({ facebook_reel_url: v })}
        />
        <BlurInput
          type="url"
          value={item.instagram_reel_url}
          placeholder="Instagram Reel URL"
          onCommit={(v) => onChange({ instagram_reel_url: v })}
        />
        <BlurInput
          type="url"
          value={item.tiktok_url}
          placeholder="TikTok URL"
          onCommit={(v) => onChange({ tiktok_url: v })}
        />
      </div>
    </div>
  );
}

function ShortsTab({ row, update }) {
  const shorts = row.shorts;
  const publishedCount = shorts.filter((s) => s.is_published).length;

  function addShort() {
    update({ shorts: [...shorts, newShort()] }, 'Short added');
  }

  function changeShort(idx, patch) {
    update({ shorts: shorts.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  }

  function removeShort(idx) {
    if (!window.confirm(`Remove Short / Reel #${idx + 1}?`)) return;
    update({ shorts: shorts.filter((_, i) => i !== idx) }, 'Short removed');
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-white">
            Derivative shorts &amp; reels
          </div>
          <div className="mt-0.5 text-[12px] tracking-tight text-zinc-500">
            {shorts.length === 0
              ? 'Track every cut-down made from this story.'
              : `${shorts.length} ${shorts.length === 1 ? 'cut' : 'cuts'} · ${publishedCount} published`}
          </div>
        </div>
        <button type="button" onClick={addShort} className={pillButtonClass}>
          <PlusIcon />
          Add short
        </button>
      </div>

      {shorts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-14 text-center">
          <div className="text-[14px] font-medium tracking-tight text-zinc-300">
            No shorts or reels yet
          </div>
          <div className="mt-1 text-[12px] tracking-tight text-zinc-500">
            Add as many as you cut from this content, each with its own links.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {shorts.map((s, i) => (
            <ShortCard
              key={`${row.id}-${i}`}
              index={i}
              item={s}
              onChange={(patch) => changeShort(i, patch)}
              onRemove={() => removeShort(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QcTab({ row, actor, update }) {
  const [timecode, setTimecode] = useState('');
  const [comment, setComment] = useState('');

  function addFeedback(e) {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    update(
      {
        revisions: [
          ...row.revisions,
          {
            reviewer: actor.name,
            timecode: timecode.trim() || 'General',
            feedback_text: text,
            is_resolved: false,
            created_at: new Date().toISOString(),
          },
        ],
      },
      'QC comment added'
    );
    setTimecode('');
    setComment('');
  }

  function toggleResolved(idx) {
    update({
      revisions: row.revisions.map((r, i) =>
        i === idx ? { ...r, is_resolved: !r.is_resolved } : r
      ),
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 text-[13px] font-semibold tracking-tight text-white">
          QC feedback &amp; revisions
        </div>
        <div className="mb-4 space-y-2">
          {row.revisions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-8 text-center text-[12px] tracking-tight text-zinc-500">
              No QC comments logged.
            </div>
          )}
          {row.revisions.map((rev, i) => (
            <div
              key={i}
              className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 ${
                rev.is_resolved
                  ? 'border-white/[0.06] bg-white/[0.02] opacity-60'
                  : 'border-red-500/20 bg-red-500/[0.06]'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 font-mono text-[11px] text-red-300">
                    {rev.timecode || 'General'}
                  </span>
                  <span className="text-[11px] font-medium tracking-tight text-zinc-400">
                    {rev.reviewer}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed tracking-tight text-zinc-200">
                  {rev.feedback_text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleResolved(i)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight transition-all duration-200 ease-out active:scale-95 ${
                  rev.is_resolved
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1]'
                }`}
              >
                {rev.is_resolved && <CheckIcon />}
                {rev.is_resolved ? 'Fixed' : 'Mark fixed'}
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addFeedback} className="flex gap-2">
          <input
            type="text"
            value={timecode}
            onChange={(e) => setTimecode(e.target.value)}
            placeholder="01:24"
            className={`${inputClass} w-20 shrink-0 font-mono`}
          />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the issue (e.g. lower third typo)…"
            className={inputClass}
          />
          <button type="submit" className={`${primaryButtonClass} shrink-0 px-4`}>
            Add
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 text-[13px] font-semibold tracking-tight text-white">
          Status audit trail
        </div>
        {row.audit_log.length === 0 ? (
          <div className="text-[12px] tracking-tight text-zinc-500">
            No state changes recorded.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
            {row.audit_log.map((log, i) => (
              <div
                key={i}
                className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px] tracking-tight ${
                  i > 0 ? 'border-t border-white/[0.06]' : ''
                }`}
              >
                <div className="min-w-0">
                  <span className="font-medium text-zinc-200">{log.actor}</span>
                  <span className="mx-1.5 text-zinc-600">moved</span>
                  <span className="text-zinc-400">
                    {log.from} → <span className="font-medium text-white">{log.to}</span>
                  </span>
                  {log.note && (
                    <div className="mt-0.5 text-[11px] text-zinc-500">“{log.note}”</div>
                  )}
                </div>
                <span className="font-mono text-[10.5px] text-zinc-600">
                  {formatDateTime(log.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState('All Channels');
  const [customChannels, setCustomChannels] = useState([]);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(null);
  const [range, setRange] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newDefaults, setNewDefaults] = useState(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [kpiOpen, setKpiOpen] = useState(false);
  const [reasonCtx, setReasonCtx] = useState(null);
  const [assignRow, setAssignRow] = useState(null);
  const [workload, setWorkload] = useState(null);

  const [team, setTeam] = useState([]);
  const [teamShared, setTeamShared] = useState(false);
  const [teamReady, setTeamReady] = useState(false);
  const [actorId, setActorId] = useState(null);

  const toastTimer = useRef(null);
  const rangeRef = useRef(null);
  const isDemo = !supabase;

  /* ---- toast ------------------------------------------------------------ */
  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  /* ---- live clock + default range (Today) ------------------------------- */
  useEffect(() => {
    const d = new Date();
    setNow(d);
    const t0 = startOfDay(d);
    setRange({ start: t0, end: t0 });
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => (now ? startOfDay(now) : null), [now]);

  /* ---- team & acting user ---------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    try {
      const saved = window.localStorage.getItem(ACTOR_STORAGE_KEY);
      if (saved) setActorId(saved);
    } catch (e) {
      /* ignore */
    }

    async function loadTeam() {
      if (supabase) {
        const { data, error: err } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: true });
        if (!cancelled && !err && data) {
          setTeam(data.map((m) => ({ ...m, active: m.active !== false })));
          setTeamShared(true);
          setTeamReady(true);
          return;
        }
      }
      let local = null;
      try {
        const raw = window.localStorage.getItem(TEAM_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) local = parsed;
        }
      } catch (e) {
        /* ignore */
      }
      if (!cancelled) {
        setTeam(local || (supabase ? [] : DEMO_TEAM));
        setTeamShared(false);
        setTeamReady(true);
      }
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!teamReady || teamShared) return;
    try {
      window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    } catch (e) {
      /* ignore */
    }
  }, [team, teamReady, teamShared]);

  const actor = useMemo(() => {
    const found = team.find((m) => String(m.id) === String(actorId) && m.active);
    if (found) return found;
    const admin = team.find((m) => m.role === 'admin' && m.active);
    return admin || OWNER;
  }, [team, actorId]);

  const actorOptions = useMemo(() => {
    const list = team.filter((m) => m.active);
    if (actor.id === OWNER.id) list.unshift(OWNER);
    return list;
  }, [team, actor]);

  const chooseActor = useCallback((id) => {
    setActorId(id);
    try {
      window.localStorage.setItem(ACTOR_STORAGE_KEY, id);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const namesByRole = useCallback(
    (role) => team.filter((m) => m.role === role && m.active).map((m) => m.name),
    [team]
  );

  const addMember = useCallback(
    async (name, role) => {
      if (team.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
        return { ok: false, error: 'Someone with that name is already on the team.' };
      }
      if (teamShared && supabase) {
        const { data, error: err } = await supabase
          .from('team_members')
          .insert({ name, role, active: true })
          .select()
          .single();
        if (err) return { ok: false, error: err.message };
        setTeam((prev) => [...prev, { ...data, active: data.active !== false }]);
      } else {
        setTeam((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, name, role, active: true },
        ]);
      }
      showToast(`${name} added as ${ROLES[role].label}`);
      return { ok: true };
    },
    [showToast, team, teamShared]
  );

  const updateMember = useCallback(
    async (id, patch) => {
      const previous = team.find((m) => String(m.id) === String(id));
      if (!previous) return;
      setTeam((prev) =>
        prev.map((m) => (String(m.id) === String(id) ? { ...m, ...patch } : m))
      );
      if (teamShared && supabase) {
        const { error: err } = await supabase
          .from('team_members')
          .update(patch)
          .eq('id', id);
        if (err) {
          setTeam((prev) =>
            prev.map((m) => (String(m.id) === String(id) ? previous : m))
          );
          showToast(`Update failed: ${err.message}`);
        }
      }
    },
    [showToast, team, teamShared]
  );

  const removeMember = useCallback(
    async (id) => {
      const previous = team;
      setTeam((prev) => prev.filter((m) => String(m.id) !== String(id)));
      if (teamShared && supabase) {
        const { error: err } = await supabase
          .from('team_members')
          .delete()
          .eq('id', id);
        if (err) {
          setTeam(previous);
          showToast(`Remove failed: ${err.message}`);
        }
      }
    },
    [showToast, team, teamShared]
  );

  /* ---- custom channels -------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomChannels(parsed.filter((c) => typeof c === 'string' && c.trim()));
        }
      }
    } catch (e) {
      /* ignore */
    }

    if (supabase) {
      supabase
        .from('channels')
        .select('name')
        .then(({ data, error: err }) => {
          if (cancelled || err || !data) return;
          const names = data
            .map((r) => r.name)
            .filter((n) => typeof n === 'string' && n.trim());
          setCustomChannels((prev) => {
            const seen = new Set(prev.map((c) => c.toLowerCase()));
            const merged = [...prev];
            names.forEach((n) => {
              if (!seen.has(n.toLowerCase())) {
                seen.add(n.toLowerCase());
                merged.push(n);
              }
            });
            return merged;
          });
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const allChannels = useMemo(() => {
    const map = new Map();
    DEFAULT_CHANNELS.forEach((c) => map.set(c.toLowerCase(), c));
    customChannels.forEach((c) => {
      if (!map.has(c.toLowerCase())) map.set(c.toLowerCase(), c);
    });
    rows.forEach((r) => {
      if (r.channel && !map.has(String(r.channel).toLowerCase())) {
        map.set(String(r.channel).toLowerCase(), r.channel);
      }
    });
    return Array.from(map.values());
  }, [customChannels, rows]);

  const addChannel = useCallback(
    async (name) => {
      const next = [...customChannels, name];
      setCustomChannels(next);
      try {
        window.localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        /* ignore */
      }

      let shared = false;
      if (supabase) {
        const { error: err } = await supabase.from('channels').insert({ name });
        shared = !err;
      }

      setChannel(name);
      setAddChannelOpen(false);
      showToast(
        supabase && !shared ? `${name} added on this device` : `${name} added`
      );
    },
    [customChannels, showToast]
  );

  /* ---- data ------------------------------------------------------------- */
  const fetchRows = useCallback(async (silent) => {
    if (!supabase) {
      setRows((prev) => (prev.length ? prev : buildDemoRows()));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const r = rangeRef.current;
    if (!r) return;

    if (!silent) setRefreshing(true);

    const startISO = startOfDay(r.start).toISOString();
    const endISO = addDays(startOfDay(r.end), 1).toISOString();

    const { data, error: err } = await supabase
      .from('contents')
      .select('*')
      .gte('scheduled_publish_time', startISO)
      .lt('scheduled_publish_time', endISO)
      .order('scheduled_publish_time', { ascending: true })
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message || 'Failed to load rundown.');
    } else {
      setError('');
      setRows(sortRows((data || []).map(normalizeRow)));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!range) return;
    rangeRef.current = range;
    setLoading(true);
    fetchRows(true);
  }, [range, fetchRows]);

  useEffect(() => {
    if (!supabase) return undefined;
    const sub = supabase
      .channel('contents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contents' },
        () => {
          fetchRows(true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [fetchRows]);

  /* ---- derived ---------------------------------------------------------- */
  const rangeRows = useMemo(() => {
    if (!range) return rows;
    const startMs = startOfDay(range.start).getTime();
    const endMs = addDays(startOfDay(range.end), 1).getTime();
    return rows.filter((r) => {
      const t = new Date(r.scheduled_publish_time).getTime();
      return t >= startMs && t < endMs;
    });
  }, [rows, range]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rangeRows.filter((r) => {
      if (channel !== 'All Channels' && r.channel !== channel) return false;
      if (q) {
        const hay = `${r.content_uid} ${r.title} ${r.slug_name} ${r.writer || ''} ${
          r.presenter || ''
        } ${r.camera_person || ''} ${r.video_editor || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rangeRows, channel, search]);

  const multiDay = !!range && !sameDay(range.start, range.end);
  const rangeLabel = formatRangeLabel(range, today);

  const selected = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId]
  );

  const stats = useMemo(() => {
    const total = visibleRows.length;
    const published = visibleRows.filter((r) => r.status === 'Published').length;
    const inEdit = visibleRows.filter(
      (r) => r.status === 'Editing' || r.status === 'Video Review'
    ).length;
    const shooting = visibleRows.filter(
      (r) => r.status === 'Shooting' || r.status === 'Ready for Shoot'
    ).length;
    return { total, published, inEdit, shooting };
  }, [visibleRows]);

  /* ---- escape closes the topmost layer --------------------------------- */
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (reasonCtx) return setReasonCtx(null);
      if (assignRow) return setAssignRow(null);
      if (teamOpen) return setTeamOpen(false);
      if (kpiOpen) return setKpiOpen(false);
      if (newOpen) return setNewOpen(false);
      if (addChannelOpen) return setAddChannelOpen(false);
      return setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reasonCtx, assignRow, teamOpen, kpiOpen, newOpen, addChannelOpen]);

  /* ---- mutations -------------------------------------------------------- */
  const patchRow = useCallback(
    async (id, patch, successMessage) => {
      const previous = rows.find((r) => String(r.id) === String(id));
      if (!previous) return false;

      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(id) ? { ...r, ...patch } : r))
      );

      if (!supabase) {
        if (successMessage) showToast(successMessage);
        return true;
      }

      const { error: err } = await supabase
        .from('contents')
        .update(patch)
        .eq('id', id);

      if (err) {
        setRows((prev) =>
          prev.map((r) => (String(r.id) === String(id) ? previous : r))
        );
        showToast(`Update failed: ${err.message}`);
        return false;
      }
      if (successMessage) showToast(successMessage);
      return true;
    },
    [rows, showToast]
  );

  const updateSelected = useCallback(
    (patch, message) => {
      if (!selected) return Promise.resolve(false);
      return patchRow(selected.id, patch, message);
    },
    [patchRow, selected]
  );

  const openDrawer = useCallback((row, initialTab) => {
    setSelectedId(row.id);
    setTab(initialTab || 'Overview');
    setDrawerOpen(true);
  }, []);

  const transition = useCallback(
    async (row, key, payload) => {
      const data = payload || {};
      const prev = row.status;
      let next = prev;
      const patch = {};

      switch (key) {
        case 'submit_script':
          next = 'Script Submitted';
          break;
        case 'approve_shoot':
          next = 'Ready for Shoot';
          patch.script_locked = true;
          break;
        case 'send_to_edit':
          next = 'Assign Editor';
          patch.script_locked = true;
          break;
        case 'start_shoot':
          next = 'Shooting';
          if (!row.camera_person && actor.role === 'camera') {
            patch.camera_person = actor.name;
          }
          break;
        case 'finish_shoot':
          next =
            row.pipeline_type === 'shoot_and_upload' ? 'Ready to Publish' : 'Assign Editor';
          break;
        case 'assign_editor_done':
          patch.video_editor = data.editorName;
          next = 'Editing';
          break;
        case 'submit_video':
          next = 'Video Review';
          break;
        case 'approve_video':
          next = 'Ready to Publish';
          break;
        case 'publish_now':
          next = 'Published';
          patch.published_at = new Date().toISOString();
          if (!row.publisher && actor.id !== OWNER.id) patch.publisher = actor.name;
          break;
        case 'hold_task':
          patch.previous_status = prev;
          patch.hold_reason = data.reason;
          next = 'On Hold';
          break;
        case 'resume_task':
          next = row.previous_status || 'Draft';
          patch.previous_status = null;
          break;
        case 'drop_task':
          patch.drop_reason = data.reason;
          next = 'Dropped';
          break;
        case 'reshoot_task':
          patch.reshoot_reason = data.reason;
          next = 'Ready for Shoot';
          break;
        default:
          return;
      }

      patch.status = next;
      patch.audit_log = [
        {
          actor: actor.name,
          from: prev,
          to: next,
          time: new Date().toISOString(),
          note: data.reason || '',
        },
        ...row.audit_log,
      ];

      setBusyId(row.id);
      await patchRow(row.id, patch, `${row.content_uid} → ${next}`);
      setBusyId(null);
    },
    [actor, patchRow]
  );

  const openAssign = useCallback(
    async (row) => {
      setAssignRow(row);
      setWorkload(null);

      let names;
      if (supabase) {
        const { data } = await supabase
          .from('contents')
          .select('video_editor')
          .eq('status', 'Editing');
        names = data
          ? data.map((d) => d.video_editor)
          : rows.filter((r) => r.status === 'Editing').map((r) => r.video_editor);
      } else {
        names = rows.filter((r) => r.status === 'Editing').map((r) => r.video_editor);
      }

      const counts = {};
      names.forEach((n) => {
        if (n) counts[n] = (counts[n] || 0) + 1;
      });
      setWorkload(counts);
    },
    [rows]
  );

  const openHold = useCallback(
    (row) => {
      setReasonCtx({
        title: 'Put content on hold',
        desc: 'Why is production being paused?',
        confirmLabel: 'Hold content',
        onConfirm: (reason) => transition(row, 'hold_task', { reason }),
      });
    },
    [transition]
  );

  const openDrop = useCallback(
    (row) => {
      setReasonCtx({
        title: 'Drop content',
        desc: 'This cancels the story. Explain why it is being dropped.',
        confirmLabel: 'Drop content',
        danger: true,
        onConfirm: (reason) => transition(row, 'drop_task', { reason }),
      });
    },
    [transition]
  );

  const handleAction = useCallback(
    (action, row) => {
      if (action.id === 'assign_editor') {
        openAssign(row);
        return;
      }
      if (action.id === 'reshoot') {
        setReasonCtx({
          title: 'Request re-shoot',
          desc: 'Explain the technical or editorial reason the footage must be re-shot.',
          confirmLabel: 'Request re-shoot',
          onConfirm: (reason) => transition(row, 'reshoot_task', { reason }),
        });
        return;
      }
      transition(row, action.id);
    },
    [openAssign, transition]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRows(false);
    showToast(isDemo ? 'Demo data refreshed.' : 'Rundown refreshed.');
  }, [fetchRows, isDemo, showToast]);

  const handleCopy = useCallback(
    async (text, label) => {
      const ok = await copyText(text);
      showToast(ok ? `${label} copied` : 'Copy failed — select and copy manually.');
    },
    [showToast]
  );

  const openNew = useCallback(() => {
    const base = range ? range.start : new Date();
    let when;
    if (today && sameDay(base, today)) {
      const t = new Date();
      t.setMinutes(0, 0, 0);
      t.setHours(t.getHours() + 2);
      when = t;
    } else {
      when = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0);
    }
    setNewDefaults({
      when: toLocalInput(when),
      channel: channel !== 'All Channels' ? channel : allChannels[0],
      writer: actor.role === 'writer' ? actor.name : '',
    });
    setNewOpen(true);
  }, [actor, allChannels, channel, range, today]);

  const createContent = useCallback(
    async (f) => {
      const when = new Date(f.when);
      if (Number.isNaN(when.getTime())) {
        return { ok: false, error: 'Pick a valid date and time.' };
      }

      const stamp = `${when.getFullYear()}${pad2(when.getMonth() + 1)}${pad2(
        when.getDate()
      )}`;
      const prefix = `CON-${stamp}-`;

      let maxSeq = 0;
      const readSeq = (uid) => {
        if (uid && String(uid).startsWith(prefix)) {
          const n = parseInt(String(uid).slice(prefix.length), 10);
          if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
        }
      };
      rows.forEach((r) => readSeq(r.content_uid));
      if (supabase) {
        const { data } = await supabase
          .from('contents')
          .select('content_uid')
          .like('content_uid', `${prefix}%`);
        (data || []).forEach((r) => readSeq(r.content_uid));
      }
      const uid = `${prefix}${pad2(maxSeq + 1)}`;

      const record = {
        content_uid: uid,
        title: f.title,
        slug_name: f.slug,
        channel: f.channel || null,
        pipeline_type: f.pipeline,
        status: 'Draft',
        scheduled_publish_time: when.toISOString(),
        writer: f.writer || null,
        presenter: f.presenter || null,
        camera_person: null,
        video_editor: null,
        publisher: null,
        archive_shelf_id: null,
        script: f.script || '',
        script_locked: false,
        target_platforms: ['youtube', 'facebook'],
        raw_footage_link: '',
        project_file_url: '',
        master_export_url: '',
        live_video_url: '',
        shorts: [],
        revisions: [],
        audit_log: [
          {
            actor: actor.name,
            from: 'None',
            to: 'Draft',
            time: new Date().toISOString(),
            note: '',
          },
        ],
      };

      let saved;
      if (!supabase) {
        saved = normalizeRow({
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...record,
        });
      } else {
        const res = await supabase.from('contents').insert(record).select().single();
        if (res.error) return { ok: false, error: res.error.message };
        saved = normalizeRow(res.data);
      }

      setRows((prev) =>
        sortRows([...prev.filter((r) => String(r.id) !== String(saved.id)), saved])
      );

      const dayStart = startOfDay(when);
      const insideRange =
        range &&
        when.getTime() >= startOfDay(range.start).getTime() &&
        when.getTime() < addDays(startOfDay(range.end), 1).getTime();
      if (!insideRange) setRange({ start: dayStart, end: dayStart });
      if (channel !== 'All Channels' && saved.channel !== channel) {
        setChannel('All Channels');
      }
      setSearch('');

      setNewOpen(false);
      setSelectedId(saved.id);
      setTab('Overview');
      setDrawerOpen(true);
      showToast(`${uid} created as draft`);
      return { ok: true };
    },
    [actor, channel, range, rows, showToast]
  );

  const exportXlsx = useCallback(async () => {
    if (visibleRows.length === 0) {
      showToast('No rows to export for the current filters.');
      return;
    }
    try {
      const mod = await import('xlsx');
      const XLSX = mod.default && mod.default.utils ? mod.default : mod;

      const data = visibleRows.map((r) => ({
        'Scheduled': formatDateTime(r.scheduled_publish_time),
        'Content UID': r.content_uid,
        'Asset Tag': `${r.content_uid}_${slugify(r.slug_name || r.title)}`,
        Title: r.title,
        Channel: r.channel || '',
        Pipeline: PIPELINE_TYPES[r.pipeline_type] || r.pipeline_type,
        Status: r.status,
        Writer: r.writer || '',
        Presenter: r.presenter || '',
        Cameraperson: r.camera_person || '',
        'Video Editor': r.video_editor || 'Unassigned',
        Publisher: r.publisher || '',
        'Archive Shelf ID': r.archive_shelf_id || '',
        'Raw Footage Link': r.raw_footage_link || '',
        'Master Video Link': r.master_export_url || '',
        'Live Video Link': r.live_video_url || '',
        'Shorts / Reels': r.shorts.length,
      }));

      const sheet = XLSX.utils.json_to_sheet(data);
      sheet['!cols'] = Object.keys(data[0]).map((key) => ({
        wch: Math.min(
          60,
          Math.max(key.length, ...data.map((d) => String(d[key] || '').length)) + 2
        ),
      }));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Rundown');
      XLSX.writeFile(book, `NewsroomOps_${fileDateLabel(range)}.xlsx`);
      showToast('Rundown exported to Excel');
    } catch (e) {
      showToast('Export failed. Please try again.');
    }
  }, [range, showToast, visibleRows]);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const drawerCanHold =
    selected &&
    can(actor, 'holdDrop') &&
    !['Published', 'Dropped'].includes(selected.status);
  const drawerCanHoldOnly = drawerCanHold && selected.status !== 'On Hold';

  return (
    <div className="relative min-h-screen bg-black text-zinc-100">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-220px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-sky-500/[0.08] blur-3xl" />
        <div className="absolute left-[15%] top-[-160px] h-[320px] w-[420px] rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      {/* ------------------------------ NAV ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] backdrop-blur-xl bg-black/60">
        <div className="relative mx-auto flex min-h-14 max-w-[1320px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-b from-zinc-100 to-zinc-400 text-[13px] font-bold text-black shadow-lg shadow-white/10">
              N
            </div>
            <div className="flex min-w-0 items-center gap-2 text-[14px] font-semibold tracking-tight text-white">
              <span className="truncate">NewsroomOps</span>
              <span className="text-zinc-600">•</span>
              <span className="hidden truncate font-medium text-zinc-400 sm:inline">
                Daily Rundown
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-3 pr-1.5">
              <span className="hidden text-[11px] font-medium tracking-tight text-zinc-500 md:inline">
                Acting as
              </span>
              <span className="relative">
                <select
                  value={String(actor.id)}
                  onChange={(e) => chooseActor(e.target.value)}
                  className="max-w-[210px] cursor-pointer appearance-none truncate rounded-full bg-white/[0.07] py-1 pl-3 pr-7 text-[12px] font-medium tracking-tight text-zinc-100 outline-none transition-colors duration-200 ease-out hover:bg-white/[0.12]"
                >
                  {actorOptions.map((m) => (
                    <option key={m.id} value={String(m.id)} className="bg-[#0c0c0e]">
                      {m.name} · {ROLES[m.role] ? ROLES[m.role].label : m.role}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <ChevronIcon open={false} />
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={() => setTeamOpen(true)}
              className={pillButtonClass}
            >
              <UsersIcon />
              <span className="hidden sm:inline">Team</span>
            </button>

            <button
              type="button"
              onClick={openNew}
              aria-label="New content"
              className={primaryButtonClass}
            >
              <PlusIcon />
              New Content
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------ MAIN ----------------------------- */}
      <main className="relative mx-auto max-w-[1320px] px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {isDemo ? 'Demo mode · Supabase not configured' : 'Live · Supabase realtime'}
              {now ? ` · ${formatClock(now)}` : ''}
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter text-white sm:text-5xl">
              Daily Rundown
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed tracking-tight text-zinc-400">
              {rangeLabel}
              {channel !== 'All Channels' ? ` · ${channel}` : ' · All channels'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Stories', value: stats.total },
              { label: 'Shoot', value: stats.shooting },
              { label: 'In Edit', value: stats.inEdit },
              { label: 'Published', value: stats.published },
            ].map((s) => (
              <div
                key={s.label}
                className="min-w-[72px] rounded-2xl border border-white/[0.08] bg-[#121215] px-4 py-3"
              >
                <div className="text-2xl font-semibold tracking-tighter text-white">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[11px] font-medium tracking-tight text-zinc-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DatePicker range={range} today={today} onChange={setRange} />
          <ChannelSelector
            channels={allChannels}
            value={channel}
            onChange={setChannel}
          />
          <button
            type="button"
            onClick={() => setAddChannelOpen(true)}
            aria-label="Add channel"
            className={pillButtonClass}
          >
            <PlusIcon />
            <span className="hidden sm:inline">Add Channel</span>
          </button>

          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search UID, title, staff…"
              className="w-[190px] rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-9 pr-3.5 text-[12px] tracking-tight text-zinc-100 outline-none transition-all duration-200 ease-out placeholder:text-zinc-600 hover:bg-white/[0.07] focus:w-[250px] focus:border-sky-400/50 focus:bg-white/[0.06] sm:w-[220px] sm:focus:w-[280px]"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setKpiOpen(true)} className={pillButtonClass}>
              <ChartIcon />
              <span className="hidden sm:inline">Team KPI</span>
            </button>
            <button type="button" onClick={exportXlsx} className={pillButtonClass}>
              <DownloadIcon />
              <span className="hidden sm:inline">Export .xlsx</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh data"
              className={`${pillButtonClass} disabled:opacity-60`}
            >
              <RefreshIcon spinning={refreshing} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] tracking-tight text-red-300">
            <span className="mt-0.5 font-semibold">Couldn’t load the rundown.</span>
            <span className="text-red-300/80">{error}</span>
          </div>
        )}

        {/* ---------------------------- TABLE ---------------------------- */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121215]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {TABLE_HEADERS.map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${
                        i === TABLE_HEADERS.length - 1 ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading &&
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={`sk-${i}`} className="border-b border-white/[0.05]">
                      {TABLE_HEADERS.map((h, c) => (
                        <td key={h} className="px-4 py-4">
                          <div
                            className="h-4 animate-pulse rounded-full bg-white/[0.05]"
                            style={{ width: `${45 + ((i * 7 + c * 13) % 45)}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!loading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} className="px-5 py-20 text-center">
                      <div className="text-[15px] font-medium tracking-tight text-zinc-300">
                        Nothing on the rundown
                      </div>
                      <div className="mt-1 text-[13px] tracking-tight text-zinc-500">
                        {search.trim()
                          ? 'No stories match your search.'
                          : channel === 'All Channels'
                          ? `No stories are scheduled for ${rangeLabel}.`
                          : `No stories for ${channel} on ${rangeLabel}.`}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  visibleRows.map((row, index) => {
                    const isBusy = String(busyId) === String(row.id);
                    const isActive = drawerOpen && String(selectedId) === String(row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={(e) => {
                          if (e.target.closest('button, a, input')) return;
                          openDrawer(row);
                        }}
                        style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                        className={`row-in group cursor-pointer border-b border-white/[0.05] transition-colors duration-200 ease-out last:border-b-0 hover:bg-white/[0.025] ${
                          isActive ? 'bg-white/[0.035]' : ''
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="text-[13px] font-medium tabular-nums tracking-tight text-zinc-300">
                            {formatTime(row.scheduled_publish_time)}
                          </div>
                          {multiDay && (
                            <div className="mt-0.5 text-[11px] tracking-tight text-zinc-600">
                              {formatRowDate(row.scheduled_publish_time)}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            type="button"
                            title="Copy Content UID"
                            onClick={() => handleCopy(row.content_uid, 'Content UID')}
                            className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[11.5px] tracking-normal text-zinc-400 transition-colors duration-200 ease-out hover:border-white/[0.15] hover:text-zinc-100"
                          >
                            {row.content_uid}
                          </button>
                        </td>
                        <td className="max-w-[320px] px-4 py-4">
                          <button
                            type="button"
                            onClick={() => openDrawer(row)}
                            className="block max-w-full truncate text-left text-[14px] font-medium tracking-tight text-white transition-colors duration-200 ease-out hover:text-sky-400"
                            title={row.title}
                          >
                            {row.title}
                          </button>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] tracking-tight text-zinc-600">
                            <span className="truncate font-mono">{row.slug_name}</span>
                            <button
                              type="button"
                              title="Copy asset tag"
                              onClick={() =>
                                handleCopy(
                                  `${row.content_uid}_${slugify(row.slug_name || row.title)}`,
                                  'Asset tag'
                                )
                              }
                              className="shrink-0 text-zinc-600 transition-colors duration-200 ease-out hover:text-zinc-200"
                            >
                              <CopyIcon />
                            </button>
                            {row.channel && (
                              <>
                                <span className="text-zinc-700">·</span>
                                <span className="truncate">{row.channel}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10.5px] font-medium uppercase tracking-wide text-zinc-400">
                            {PIPELINE_SHORT[row.pipeline_type] || row.pipeline_type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] tracking-tight text-zinc-300">
                          {row.writer || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] tracking-tight">
                          {row.presenter ? (
                            <span className="text-zinc-300">{row.presenter}</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] tracking-tight">
                          {row.video_editor ? (
                            <span className="text-zinc-300">{row.video_editor}</span>
                          ) : row.status === 'Assign Editor' ? (
                            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400">
                              Unassigned
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-tight">
                            {row.target_platforms.length === 0 && (
                              <span className="text-zinc-700">—</span>
                            )}
                            {PLATFORMS.filter((p) =>
                              row.target_platforms.includes(p.id)
                            ).map((p) => (
                              <span key={p.id} title={p.label} className={p.tone}>
                                {p.code}
                              </span>
                            ))}
                            {row.shorts.length > 0 && (
                              <span
                                title={`${row.shorts.length} shorts / reels`}
                                className="ml-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
                              >
                                {row.shorts.length}▸
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <ActionButtons
                            row={row}
                            actor={actor}
                            busy={isBusy}
                            onAction={handleAction}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] tracking-tight text-zinc-600">
          Draft → Script Submitted → Ready for Shoot → Shooting → Assign Editor →
          Editing → Video Review → Ready to Publish → Published
        </p>
      </main>

      {/* ------------------------------ MODALS --------------------------- */}
      {addChannelOpen && (
        <AddChannelModal
          existing={allChannels}
          onAdd={addChannel}
          onClose={() => setAddChannelOpen(false)}
        />
      )}

      {newOpen && newDefaults && (
        <NewContentModal
          channels={allChannels}
          writers={namesByRole('writer')}
          presenters={namesByRole('presenter')}
          defaultChannel={newDefaults.channel}
          defaultWhen={newDefaults.when}
          defaultWriter={newDefaults.writer}
          onCreate={createContent}
          onClose={() => setNewOpen(false)}
        />
      )}

      {teamOpen && (
        <TeamModal
          team={team}
          canManage={can(actor, 'manageTeam')}
          shared={teamShared}
          isDemo={isDemo}
          onAdd={addMember}
          onUpdate={updateMember}
          onRemove={removeMember}
          onClose={() => setTeamOpen(false)}
        />
      )}

      {kpiOpen && (
        <KpiModal
          rows={rangeRows}
          team={team}
          rangeLabel={rangeLabel}
          onClose={() => setKpiOpen(false)}
        />
      )}

      {assignRow && (
        <AssignEditorModal
          row={assignRow}
          editors={namesByRole('editor')}
          workload={workload}
          onSelect={(name) => {
            const target = assignRow;
            setAssignRow(null);
            transition(target, 'assign_editor_done', { editorName: name });
          }}
          onClose={() => setAssignRow(null)}
        />
      )}

      {reasonCtx && <ReasonModal ctx={reasonCtx} onClose={() => setReasonCtx(null)} />}

      {/* ---------------------------- DRAWER ----------------------------- */}
      <div
        className={`fixed inset-0 z-50 ${
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Content workspace"
          className={`absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-[#0c0c0e]/95 shadow-2xl shadow-black backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[560px] ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selected && (
            <>
              {/* sticky header */}
              <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-black/60 px-6 pb-0 pt-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[11px] tracking-normal text-zinc-400">
                        {selected.content_uid}
                      </span>
                      <StatusBadge status={selected.status} />
                    </div>
                    <h2 className="mt-2.5 text-xl font-semibold leading-tight tracking-tight text-white">
                      {selected.title}
                    </h2>
                    <div className="mt-1 font-mono text-[11px] tracking-normal text-zinc-500">
                      #{selected.slug_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {drawerCanHold && (
                      <DrawerMenu
                        canHold={drawerCanHoldOnly}
                        onHold={() => openHold(selected)}
                        onDrop={() => openDrop(selected)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Close workspace"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[13px] text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.12] hover:text-white active:scale-90"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="-mx-2 mt-5 flex gap-1 overflow-x-auto px-2">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`relative shrink-0 whitespace-nowrap rounded-t-lg px-3 pb-3 pt-1 text-[13px] font-medium tracking-tight transition-colors duration-200 ease-out ${
                        tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t}
                      <span
                        className={`absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-white transition-opacity duration-200 ease-out ${
                          tab === t ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {tab === 'Overview' && (
                  <OverviewTab row={selected} team={team} update={updateSelected} />
                )}
                {tab === 'Script Desk' && (
                  <ScriptTab
                    row={selected}
                    actor={actor}
                    update={updateSelected}
                    onCopy={handleCopy}
                  />
                )}
                {tab === 'Assets' && (
                  <AssetsTab row={selected} update={updateSelected} onCopy={handleCopy} />
                )}
                {tab === 'Shorts & Reels' && (
                  <ShortsTab row={selected} update={updateSelected} />
                )}
                {tab === 'QC & Audit' && (
                  <QcTab row={selected} actor={actor} update={updateSelected} />
                )}
              </div>

              {/* footer */}
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] bg-black/60 px-6 py-4 backdrop-blur-xl">
                <span className="truncate text-[11px] tracking-tight text-zinc-500">
                  Acting as {actor.name}
                </span>
                <ActionButtons
                  row={selected}
                  actor={actor}
                  busy={String(busyId) === String(selected.id)}
                  onAction={handleAction}
                  large
                />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ----------------------------- TOAST ----------------------------- */}
      {toast && (
        <div
          key={toast}
          className="toast-in fixed bottom-6 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-full border border-white/10 bg-[#18181b]/90 px-5 py-2.5 text-[13px] font-medium tracking-tight text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
