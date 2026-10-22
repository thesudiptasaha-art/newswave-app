// lib/core.js

const DEFAULT_CHANNELS = [
  'The Wave 24',
  'The Wave World',
  'The Wave Money',
  'The Wave Sports',
  'The Wave Faith',
  'The Wave Life',
  'The Wave Glam',
];

const CONTENT_TYPES = ['EXPLAINER', 'LIVE', 'RECORDED LIVE', 'SOT', 'PACKAGE', 'SHOW'];
const CONTENT_TYPE_HINT = {
  EXPLAINER: 'Full pipeline',
  LIVE: 'Script approved → done (published)',
  'RECORDED LIVE': 'Full pipeline',
  SOT: 'Full pipeline',
  PACKAGE: 'Script + raw footage → straight to the editor (no shoot)',
  SHOW: 'Full pipeline',
};


const CONTENT_TYPE_COLORS = {
  'LIVE': { bg: 'bg-red-500', text: 'text-red-500', tagText: 'text-white' },
  'EXPLAINER': { bg: 'bg-green-500', text: 'text-green-500', tagText: 'text-white' },
  'RECORDED LIVE': { bg: 'bg-orange-500', text: 'text-orange-500', tagText: 'text-white' },
  'SOT': { bg: 'bg-blue-500', text: 'text-blue-500', tagText: 'text-white' },
  'PACKAGE': { bg: 'bg-purple-500', text: 'text-purple-500', tagText: 'text-white' },
  'SHOW': { bg: 'bg-pink-500', text: 'text-pink-500', tagText: 'text-white' },
  'STORY': { bg: 'bg-teal-500', text: 'text-teal-500', tagText: 'text-white' }
};

const PLATFORMS = [
  { id: 'web', label: 'Web Portal' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'threads', label: 'Threads' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

const ACCESS_LIST = [
  { key: 'can_write_edit_scripts', label: 'Write & Edit Scripts', hint: 'Write, edit and save scripts', group: 'Scripts' },
  { key: 'can_approve_scripts', label: 'Approve Scripts', hint: 'Approve or send back submitted scripts', group: 'Scripts' },
  { key: 'can_edit_content_details', label: 'Edit Content Details', hint: 'Title, thumbnail text, platforms', group: 'Content' },
  { key: 'can_change_channel', label: 'Change Channel', hint: 'Switch the channel of a content', group: 'Content' },
  { key: 'can_reschedule_content', label: 'Reschedule Content', hint: 'Change scheduled date and publish time', group: 'Content' },
  { key: 'can_assign_video_editor', label: 'Assign Video Editor', hint: 'Change or assign the video editor', group: 'Assignments' },
  { key: 'can_assign_presenter', label: 'Assign Presenter', hint: 'Update the presenter assignment', group: 'Assignments' },
  { key: 'can_review_videos', label: 'Review Videos', hint: 'Approve edited videos or request revisions', group: 'Review' },
];

const ROLE_LIST = [
  { key: 'role_research_script_writer', label: 'Research & Script Writer', field: 'writer', hint: 'Appears in the Research & Script Writer list', group: 'Editorial' },
  { key: 'role_concept_creator', label: 'Concept Creator', field: 'concept_creator', hint: 'Appears in the Concept Creator list', group: 'Editorial' },
  { key: 'role_producer', label: 'Producer', field: 'producer', hint: 'Appears in the Producer list', group: 'Production' },
  { key: 'role_presenter', label: 'Presenter', field: 'presenter_name', hint: 'Appears in the Presenter list', group: 'Production' },
  { key: 'role_camera_operator', label: 'Camera Operator', field: 'camera_operator', hint: 'Appears in the Camera Operator list', group: 'Production' },
  { key: 'role_light_designer', label: 'Light Designer', field: 'light_designer', hint: 'Appears in the Light Designer list', group: 'Production' },
  { key: 'role_sound_recordist', label: 'Sound Recordist', field: 'sound_recordist', hint: 'Appears in the Sound Recordist list', group: 'Production' },
  { key: 'role_voice_over_artist', label: 'Voice Over Artist', field: 'voice_over_artist', hint: 'Appears in the Voice Over Artist list', group: 'Production' },
  { key: 'role_video_editor', label: 'Video Editor', field: 'video_editor', hint: 'Appears in the Video Editor list', group: 'Post-Production' },
  { key: 'role_motion_graphics_designer', label: 'Motion Graphics Designer', field: 'motion_graphics_designer', hint: 'Appears in the Motion Graphics Designer list', group: 'Post-Production' },
  { key: 'role_graphic_designer', label: 'Graphic Designer', field: 'graphic_designer', hint: 'Appears in the Graphic Designer list', group: 'Post-Production' },
  { key: 'role_colorist', label: 'Colorist', field: 'colorist', hint: 'Appears in the Colorist list', group: 'Post-Production' },
  { key: 'role_audio_mixer', label: 'Audio Mixer', field: 'audio_mixer', hint: 'Appears in the Audio Mixer list', group: 'Post-Production' },
  { key: 'role_live_video_switcher', label: 'Live Video Switcher', field: 'live_video_switcher', hint: 'Appears in the Live Video Switcher list', group: 'Live' },
  { key: 'role_live_audio_mixer', label: 'Live Audio Mixer', field: 'live_audio_mixer', hint: 'Appears in the Live Audio Mixer list', group: 'Live' },
  { key: 'role_publisher', label: 'Publisher', field: 'publisher', hint: 'Appears in the Publisher list', group: 'Publishing' },
];

/* One flat list of every toggle (Access first, then Roles). Other code reads this. */
const PERMISSIONS = [...ACCESS_LIST, ...ROLE_LIST].map(({ key, label, hint }) => ({ key, label, hint }));

const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', general: 'General' };

/* Chip colours follow the phase: grey = script, red = production, golden yellow = video edit, green = ready to publish, blue = published, pale yellow = on hold, black = dropped. */
const STATUS_META = {
  Draft: { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Script Submitted': { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Ready for Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
  Shooting: { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400', live: true },
  'Assign Editor': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  Editing: { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500', live: true },
  'Video Review': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  'Ready to Publish': { tone: 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25', dot: 'bg-emerald-400' },
  Published: { tone: 'text-sky-300 bg-sky-500/15 ring-sky-400/25', dot: 'bg-sky-400' },
  'On Hold': { tone: 'text-yellow-200 bg-yellow-400/10 ring-yellow-300/25', dot: 'bg-yellow-300' },
  Dropped: { tone: 'text-zinc-300 bg-zinc-950 ring-zinc-500/50', dot: 'bg-zinc-500' },
  'Re-Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
};
const ALL_STATUSES = Object.keys(STATUS_META);

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/* ------------------------------------------------------------------ */
const isManager = (m) => !!m && m.active !== false && (m.role === 'owner' || m.role === 'manager');
const isOwner = (m) => !!m && m.active !== false && m.role === 'owner';
const can = (m, key) => !!m && m.active !== false && (isManager(m) || m[key] === true);

/* ------------------------------------------------------------------ */
/* Workflow (state machine)                                            */
/* ------------------------------------------------------------------ */
const afterScript = (type) => (type === 'LIVE' ? 'Published' : type === 'PACKAGE' ? 'Assign Editor' : 'Ready for Shoot');
const afterShoot = () => 'Assign Editor';

function getActions(row, m) {
  const list = [];
  if (!m || m.active === false) return list;
  const mgr = isManager(m);
  const s = row.status;
  const t = row.content_type;
  const add = (id, label, to, tone, allowed, why, blocked, needsReason) =>
    list.push({ id, label, to, tone, allowed, why: why || '', blocked: blocked || '', needsReason: !!needsReason });

  switch (s) {
    case 'Draft':
      add('submit', 'Submit Script', 'Script Submitted', 'primary', can(m, 'can_write_edit_scripts'), 'Needs the “Write & Edit Scripts” permission', row.script && row.script.trim() ? '' : 'Write a script first');
      break;
    case 'Script Submitted':
      add('approve_script', 'Approve Script', afterScript(t), 'primary', can(m, 'can_approve_scripts'), 'Needs the “Approve Scripts” permission');
      add('return_script', 'Send Back', 'Draft', 'ghost', can(m, 'can_approve_scripts'), 'Needs the “Approve Scripts” permission', '', true);
      break;
    case 'Ready for Shoot':
      add('start_shoot', 'Start Shoot', 'Shooting', 'primary', true, '', row.camera_operator ? '' : 'Camera Operator must be assigned first');
      break;
    case 'Shooting':
      add('finish_shoot', 'Finish Shoot', afterShoot(t), 'primary', true);
      break;
    case 'Assign Editor':
      add('start_edit', 'Send to Editing', 'Editing', 'primary', can(m, 'can_assign_video_editor'), 'Needs the “Assign Video Editor” permission', row.video_editor ? '' : 'Pick a video editor first');
      break;
    case 'Editing':
      add('submit_video', 'Submit Video', 'Video Review', 'primary', mgr || (!!row.video_editor && row.video_editor === m.full_name), 'Assigned editor or managers only', '');
      break;
    case 'Video Review':
      add('approve_video', 'Approve Video', 'Ready to Publish', 'primary', can(m, 'can_review_videos'), 'Needs the “Review Videos” permission');
      add('revise', 'Request Revision', 'Editing', 'ghost', can(m, 'can_review_videos'), 'Needs the “Review Videos” permission', '', true);
      break;
    case 'Ready to Publish':
      add('publish', 'Publish', 'Published', 'primary', mgr, 'Managers only', row.publisher ? '' : 'Publisher must be assigned first');
      break;
    case 'On Hold':
      add('resume', 'Resume', row.previous_status || 'Draft', 'primary', mgr, 'Managers only');
      break;
    case 'Dropped':
      add('restore', 'Restore', 'Draft', 'primary', mgr, 'Managers only');
      break;
    case 'Re-Shoot':
      add('back_to_shoot', 'Back to Shoot Queue', 'Ready for Shoot', 'primary', true);
      break;
    default:
      break;
  }
  if (['Editing', 'Video Review'].includes(s)) add('reshoot', 'Re-Shoot', 'Re-Shoot', 'ghost', mgr, 'Managers only', '', true);
  if (!['Published', 'Dropped', 'On Hold'].includes(s)) {
    add('hold', 'Hold', 'On Hold', 'ghost', mgr, 'Managers only', '', true);
    add('drop', 'Drop', 'Dropped', 'danger', mgr, 'Managers only', '', true);
  }
  if (s === 'Ready for Shoot') {
    add('copy_script', 'Copy Script', '', 'ghost', true);
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* Date / text helpers                                                 */
/* ------------------------------------------------------------------ */
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n) => String(n).padStart(2, '0');

function formatRangeLabel(range) {
  const today = startOfDay(new Date());
  const { start, end } = range;
  const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  if (sameDay(start, end)) {
    if (sameDay(start, today)) return 'Today';
    if (sameDay(start, addDays(today, 1))) return 'Tomorrow';
    if (sameDay(start, addDays(today, -1))) return 'Yesterday';
    return fmt(start);
  }
  return `${fmt(start)} – ${fmt(end)}`;
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};
const formatStamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

/* Slug rule: English only. UPPERCASE in real time, A-Z, 0-9, spaces and hyphen only, max 24 characters. Examples: 'budget 2026: what?' -> 'BUDGET 2026 WHAT'; 'metro rail' -> 'METRO RAIL'; Bengali letters are removed. */
const SLUG_MAX = 24;
function normalizeSlugInput(v) {
  return String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, SLUG_MAX);
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

function generateUserUID(dateIso) {
  const date = dateIso ? new Date(dateIso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mins = pad(date.getMinutes());
  
  // 6-character random alphanumeric
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${yyyy}${mm}${dd}-${hh}${mins}BST-${randomStr}`;
}

/* Demo mode only. With Supabase, the database assigns CON-YYYYMMDD_001 itself. */
const makeContentUid = (iso, n) => {
  const d = iso ? new Date(iso) : new Date();
  return `CON-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${String(n || 1).padStart(3, '0')}`;
};

const makeNoticeUid = (iso, n) => {
  const d = iso ? new Date(iso) : new Date();
  return `NOTICE-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${String(n || 1).padStart(3, '0')}`;
};

const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};
/* Shorts whose upload time falls inside the rundown range. */
const shortsInRange = (r, start, endEx) =>
  (r.shorts || []).filter((s) => s.publish_at && new Date(s.publish_at) >= start && new Date(s.publish_at) < endEx);
const rowTimeIn = (r, start, endEx) => {
  const t = r.scheduled_publish_time ? new Date(r.scheduled_publish_time) : null;
  if (t && t >= start && t < endEx) return r.scheduled_publish_time;
  const ss = shortsInRange(r, start, endEx).map((s) => s.publish_at).sort();
  return ss[0] || r.scheduled_publish_time;
};
/* A content is "complete" when it has a channel, a slug name and a publish date & time. */
const isComplete = (r) => !!(String(r.channel || '').trim() && String(r.slug_name || '').trim() && r.scheduled_publish_time);
/* What is missing, in plain words. */
const missingFields = (r) => {
  const m = [];
  if (!String(r.channel || '').trim()) m.push('channel');
  if (!String(r.slug_name || '').trim()) m.push('slug');
  if (!r.scheduled_publish_time) m.push('date & time');
  return m;
};
/* Bin: Dropped content that is incomplete. */
const isBin = (r) => r.status === 'Dropped' && !isComplete(r);
/* Parking Zone: On Hold content (complete or not) + incomplete content that is not Dropped.
   Complete content of any status is shown on the rundown (a complete On Hold one shows in both places). */
const isParked = (r) => r.status === 'On Hold' || (r.status !== 'Dropped' && !isComplete(r));
function normalizeRow(r) {
  return {
    ...r,
    content_type: CONTENT_TYPES.includes(r.content_type) ? r.content_type : 'PACKAGE',
    status: r.status || 'Draft',
    script: r.script || '',
    is_script_locked: r.is_script_locked === true,
    target_platforms: asArray(r.target_platforms),
    shorts: asArray(r.shorts),
    revisions: asArray(r.revisions),
    audit_log: asArray(r.audit_log),
  };
}

function normalizeMember(m) {
  const out = { ...m, active: m.active !== false };
  PERMISSIONS.forEach((p) => {
    out[p.key] = m[p.key] === true;
  });
  return out;
}


/* ------------------------------------------------------------------ */
/* Which permission guards which field                                 */
/* ------------------------------------------------------------------ */
const FIELD_PERM = {
  script: 'can_write_edit_scripts',
  title: 'can_edit_content_details',
  slug_name: 'can_edit_content_details',
  thumbnail_text: 'can_edit_content_details',
  writer: 'can_edit_content_details',
  camera_operator: 'can_edit_content_details',
  archive_shelf_id: 'can_edit_content_details',
  target_platforms: 'can_edit_content_details',
  channel: 'can_change_channel',
  scheduled_publish_time: 'can_reschedule_content',
  presenter_name: 'can_assign_presenter',
  video_editor: 'can_assign_video_editor',
  post_caption: 'can_edit_content_details',
  seo_keywords: 'can_edit_content_details',
  hashtags: 'can_edit_content_details',
};

/* Fields whose every change is written to the audit trail (previous value → new value). */
const TRACKED_FIELDS = {
  script: 'Script',
  is_script_locked: 'Script lock',
  title: 'Title',
  thumbnail_text: 'Thumbnail text',
  writer: 'Research & Script Writer',
  presenter_name: 'Presenter',
  video_editor: 'Video Editor',
  camera_operator: 'Camera Operator',
  channel: 'Channel',
  scheduled_publish_time: 'Scheduled time',
  archive_shelf_id: 'Shelf ID',
  target_platforms: 'Platforms',
  post_caption: 'Post caption',
  seo_keywords: 'SEO keywords',
  hashtags: 'Hashtags',
};

export {
  DEFAULT_CHANNELS,
  CONTENT_TYPES, CONTENT_TYPE_COLORS,
  CONTENT_TYPE_HINT,
  PLATFORMS,
  PERMISSIONS,
  ACCESS_LIST, ROLE_LIST,
  ROLE_LABEL,
  STATUS_META,
  ALL_STATUSES,
  isManager,
  isOwner,
  can,
  afterScript,
  afterShoot,
  getActions,
  startOfDay,
  addDays,
  sameDay,
  MONTHS,
  pad,
  formatRangeLabel,
  toLocalInput,
  fromLocalInput,
  formatTime,
  formatDay,
  formatStamp,
  SLUG_MAX,
  normalizeSlugInput,
  uid,
  generateUserUID,
  makeContentUid,
  makeNoticeUid,
  asArray,
  shortsInRange,
  rowTimeIn,
  isParked,
  isComplete,
  isBin,
  missingFields,
  normalizeRow,
  normalizeMember,
  FIELD_PERM,
  TRACKED_FIELDS
};
