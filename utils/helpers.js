import { ROLE_LABEL, PERMISSIONS, CONTENT_TYPES } from './constants';

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/* ------------------------------------------------------------------ */
export const isManager = (m) => !!m && m.active !== false && (m.role === 'owner' || m.role === 'manager');
export const isOwner = (m) => !!m && m.active !== false && m.role === 'owner';
export const can = (m, key) => !!m && m.active !== false && (isManager(m) || m[key] === true);

/* ------------------------------------------------------------------ */
/* Workflow (state machine)                                            */
/* ------------------------------------------------------------------ */
export const afterScript = (type) => (type === 'LIVE' ? 'Published' : type === 'PACKAGE' ? 'Assign Editor' : 'Ready for Shoot');
export const afterShoot = () => 'Assign Editor';

export function getActions(row, m) {
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
      add('start_shoot', 'Start Shoot', 'Shooting', 'primary', true);
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
      add('publish', 'Publish', 'Published', 'primary', mgr, 'Managers only');
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
  return list;
}

/* ------------------------------------------------------------------ */
/* Date / text helpers                                                 */
/* ------------------------------------------------------------------ */
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const pad = (n) => String(n).padStart(2, '0');

export function formatRangeLabel(range) {
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

export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
export const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
export const formatDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};
export const formatStamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const SLUG_MAX = 100;
export function normalizeSlugInput(v) {
  return String(v || '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, SLUG_MAX);
}

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export const makeContentUid = (iso, n) => {
  const d = iso ? new Date(iso) : new Date();
  return `CON-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${String(n || 1).padStart(3, '0')}`;
};

export const asArray = (v) => {
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
export const shortsInRange = (r, start, endEx) =>
  (r.shorts || []).filter((s) => s.publish_at && new Date(s.publish_at) >= start && new Date(s.publish_at) < endEx);
export const rowTimeIn = (r, start, endEx) => {
  const t = r.scheduled_publish_time ? new Date(r.scheduled_publish_time) : null;
  if (t && t >= start && t < endEx) return r.scheduled_publish_time;
  const ss = shortsInRange(r, start, endEx).map((s) => s.publish_at).sort();
  return ss[0] || r.scheduled_publish_time;
};
export const isParked = (r) => r.status === 'On Hold' || !r.scheduled_publish_time;
export function normalizeRow(r) {
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

export function normalizeMember(m) {
  const out = { ...m, active: m.active !== false };
  PERMISSIONS.forEach((p) => {
    out[p.key] = m[p.key] === true;
  });
  return out;
}
