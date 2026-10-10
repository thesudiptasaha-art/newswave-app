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
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'web', label: 'Website' },
];

const PERMISSIONS = [
  { key: 'can_edit_script', label: 'Edit script', hint: 'Write, edit and save scripts' },
  { key: 'can_edit_metadata', label: 'Edit metadata', hint: 'Title, thumbnail text, platforms' },
  { key: 'can_assign_editor', label: 'Assign editor', hint: 'Change or assign the video editor' },
  { key: 'can_reschedule', label: 'Reschedule', hint: 'Change scheduled date & publish time' },
  { key: 'can_approve_script', label: 'Approve script', hint: 'Approve or send back submitted scripts' },
  { key: 'can_review_video', label: 'Review video', hint: 'Approve edited videos or request revisions' },
  
  // New Roles / Skills
  { key: 'can_write', label: 'Can Write & Submit', hint: 'Available in Research & Script dropdown' },
  { key: 'can_edit_video', label: 'Can Edit Video', hint: 'Available in Video Editor dropdown' },
  { key: 'can_produce', label: 'Can Produce', hint: 'Available in Producer dropdown' },
  { key: 'can_camera', label: 'Can be Cameraman', hint: 'Available in Cameraman dropdown' },
  { key: 'can_present', label: 'Can Present', hint: 'Available in Presenter dropdown' },
  { key: 'can_light', label: 'Light Design', hint: 'Available in Light Designer dropdown' },
  { key: 'can_vfx', label: 'Visual Effects', hint: 'Available in VFX dropdown' },
  { key: 'can_color', label: 'Colorist', hint: 'Available in Color dropdown' },
  { key: 'can_sound_record', label: 'Sound Record', hint: 'Available in Sound Record dropdown' },
  { key: 'can_audio_mix', label: 'Audio Mixing', hint: 'Available in Audio Mixing dropdown' },
  { key: 'can_video_switch', label: 'Video Switch', hint: 'Available in Video Switch dropdown' },
  { key: 'can_live_audio', label: 'Live Audio Mix', hint: 'Available in Live Audio Mixing dropdown' }
];

const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', general: 'General' };

const STATUS_META = {
  Draft: { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Script Submitted': { tone: 'text-sky-300 bg-sky-500/15 ring-sky-400/25', dot: 'bg-sky-400' },
  'Ready for Shoot': { tone: 'text-indigo-300 bg-indigo-500/15 ring-indigo-400/25', dot: 'bg-indigo-400' },
  Shooting: { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400', live: true },
  'Assign Editor': { tone: 'text-amber-300 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-400' },
  Editing: { tone: 'text-orange-300 bg-orange-500/15 ring-orange-400/25', dot: 'bg-orange-400', live: true },
  'Video Review': { tone: 'text-violet-300 bg-violet-500/15 ring-violet-400/25', dot: 'bg-violet-400' },
  'Ready to Publish': { tone: 'text-teal-300 bg-teal-500/15 ring-teal-400/25', dot: 'bg-teal-400' },
  Published: { tone: 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25', dot: 'bg-emerald-400' },
  'On Hold': { tone: 'text-yellow-300 bg-yellow-500/15 ring-yellow-400/25', dot: 'bg-yellow-400' },
  Dropped: { tone: 'text-zinc-500 bg-zinc-600/10 ring-zinc-500/20', dot: 'bg-zinc-600' },
  'Re-Shoot': { tone: 'text-pink-300 bg-pink-500/15 ring-pink-400/25', dot: 'bg-pink-400' },
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
      add('submit', 'Submit Script', 'Script Submitted', 'primary', can(m, 'can_edit_script'), 'Needs the “Edit script” permission', row.script && row.script.trim() ? '' : 'Write a script first');
      break;
    case 'Script Submitted':
      add('approve_script', 'Approve Script', afterScript(t), 'primary', can(m, 'can_approve_script'), 'Needs the “Approve script” permission');
      add('return_script', 'Send Back', 'Draft', 'ghost', can(m, 'can_approve_script'), 'Needs the “Approve script” permission', '', true);
      break;
    case 'Ready for Shoot':
      add('start_shoot', 'Start Shoot', 'Shooting', 'primary', true, '', row.camera_person ? '' : 'Cameraman must be assigned first');
      break;
    case 'Shooting':
      add('finish_shoot', 'Finish Shoot', afterShoot(t), 'primary', true);
      break;
    case 'Assign Editor':
      add('start_edit', 'Send to Editing', 'Editing', 'primary', can(m, 'can_assign_editor'), 'Needs the “Assign editor” permission', row.video_editor ? '' : 'Pick a video editor first');
      break;
    case 'Editing':
      add('submit_video', 'Submit Video', 'Video Review', 'primary', mgr || (!!row.video_editor && row.video_editor === m.full_name), 'Assigned editor or managers only', '');
      break;
    case 'Video Review':
      add('approve_video', 'Approve Video', 'Ready to Publish', 'primary', can(m, 'can_review_video'), 'Needs the “Review video” permission');
      add('revise', 'Request Revision', 'Editing', 'ghost', can(m, 'can_review_video'), 'Needs the “Review video” permission', '', true);
      break;
    case 'Ready to Publish':
      add('publish', 'Publish', 'Published', 'primary', mgr, 'Managers only', row.uploader ? '' : 'Uploader must be assigned first');
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
  add('download_script', 'Download ZIP', '', 'ghost', true);
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

/* Slug rule: UPPERCASE in real time, letters/numbers/hyphen only, any number of words, max 100 characters. */
const SLUG_MAX = 24;
function normalizeSlugInput(v) {
  return String(v || '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
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
  script: 'can_edit_script',
  title: 'can_edit_metadata',
  slug_name: 'can_edit_metadata',
  thumbnail_text: 'can_edit_metadata',
  writer: 'can_edit_metadata',
  camera_person: 'can_edit_metadata',
  archive_shelf_id: 'can_edit_metadata',
  target_platforms: 'can_edit_metadata',
  channel: 'can_change_channel',
  scheduled_publish_time: 'can_reschedule',
  presenter_name: 'can_change_presenter',
  video_editor: 'can_assign_editor',
  post_caption: 'can_edit_metadata',
  seo_keywords: 'can_edit_metadata',
  hashtags: 'can_edit_metadata',
};

/* Fields whose every change is written to the audit trail (previous value → new value). */
const TRACKED_FIELDS = {
  script: 'Script',
  is_script_locked: 'Script lock',
  title: 'Title',
  thumbnail_text: 'Thumbnail text',
  writer: 'Research & Script',
  presenter_name: 'Presenter',
  video_editor: 'Video editor',
  camera_person: 'Cameraman',
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
