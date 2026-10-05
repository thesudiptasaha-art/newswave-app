'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, LockIcon } from '../components/ui/Icons';
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from '../components/ui/Badges';
import { createClient } from '@supabase/supabase-js';
import { downloadContentArchive, downloadKPIReport, downloadFullSystemBackup } from '../services/exportService';
import { uploadFile, generateFileName } from '../services/storageService';
import { uploadReferenceFile } from '../services/fileUploadProvider';




/* ------------------------------------------------------------------ */
/* Supabase client (falls back to demo mode when env vars are absent)  */
/* ------------------------------------------------------------------ */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
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

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'web', label: 'Website' },
];

const PERMISSIONS = [
  { key: 'can_edit_script', label: 'Edit script', hint: 'Write, edit and save scripts' },
  { key: 'can_edit_metadata', label: 'Edit metadata', hint: 'Title, thumbnail text, writer, camera, platforms' },
  { key: 'can_assign_editor', label: 'Assign editor', hint: 'Change or assign the video editor' },
  { key: 'can_reschedule', label: 'Reschedule', hint: 'Change scheduled date & publish time' },
  { key: 'can_change_presenter', label: 'Change presenter', hint: 'Update the presenter assignment' },
  { key: 'can_change_channel', label: 'Change channel', hint: 'Switch channel / platform' },
  { key: 'can_approve_script', label: 'Approve script', hint: 'Approve or send back submitted scripts' },
  { key: 'can_review_video', label: 'Review video', hint: 'Approve edited videos or request revisions' },
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
const SLUG_MAX = 100;
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

export function generateUserUID(dateIso) {
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
/* "Parked" content is kept off the rundown: On Hold, or no publish date/time yet. */
const isParked = (r) => {
  if (r.status === 'On Hold' || r.status === 'Dropped' || r.status === 'Draft') return true;
  if (!r.scheduled_publish_time) return true;
  if (!r.title && !r.script) return true; // Metadata less
  if (new Date(r.scheduled_publish_time) < new Date() && !['Published', 'Ready to Publish'].includes(r.status)) return true;
  return false;
};
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
/* Demo data (used when Supabase env vars are missing)                 */
/* ------------------------------------------------------------------ */
function buildDemo() {
  const orgId = 'demo-org';
  const mk = (full_name, email, role, perms, gender = 'male') => {
    const nick = full_name.split(' ')[0];
    return normalizeMember({ id: uid(), user_id: uid(), custom_uid: generateUserUID(), organization_id: orgId, full_name, nickname: nick, gender, email, role, active: true, ...perms });
  };
  const team = [
    mk('Rahim Uddin', 'owner@demo.com', 'owner', { designation: 'Editor-in-Chief' }),
    mk('Nusrat Jahan', 'nusrat@demo.com', 'manager', { designation: 'Head of Production' }, 'female'),
    mk('Tanvir Ahmed', 'tanvir@demo.com', 'general', { can_edit_script: true, can_edit_metadata: true, designation: 'Senior Writer' }),
    mk('Sadia Islam', 'sadia@demo.com', 'general', { designation: 'Presenter' }, 'female'),
    mk('Imran Hossain', 'imran@demo.com', 'general', { can_assign_editor: true, can_reschedule: true, can_change_presenter: true, can_change_channel: true, designation: 'Video Editor' }),
  ];
  const today = startOfDay(new Date());
  const at = (h, m) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).toISOString();
    let demoSeq = 0;
    const base = (o) => normalizeRow({ id: uid(), organization_id: orgId, content_uid: makeContentUid(undefined, ++demoSeq), target_platforms: ['youtube', 'facebook'], ...o });
  const rows = [
    base({ content_type: 'EXPLAINER', channel: 'The Wave Money', slug_name: 'BUDGET BREAKDOWN FISCAL YEAR', title: 'Budget Breakdown: What Changes This Fiscal Year', thumbnail_text: 'WHAT CHANGES?', writer: 'Tanvir Ahmed', presenter_name: 'Nusrat Jahan', scheduled_publish_time: at(10, 0), status: 'Script Submitted', script: 'Opening line.\n\nThis year’s budget reshapes how households plan spending.\n\nThree things matter: taxes, subsidies, and interest rates.' }),
    base({ content_type: 'PACKAGE', channel: 'The Wave 24', slug_name: 'CITY FLOOD RELIEF', title: 'City Flood Relief Operations', thumbnail_text: 'RELIEF ON THE GROUND', writer: 'Tanvir Ahmed', presenter_name: 'Rahim Uddin', camera_person: 'Karim', scheduled_publish_time: at(13, 30), status: 'Ready for Shoot', script: 'Relief teams are moving through the worst-hit districts.' }),
    base({ content_type: 'SOT', channel: 'The Wave Sports', slug_name: 'CAPTAIN POST MATCH', title: 'Captain’s Post-Match Reaction', thumbnail_text: 'HE SAID WHAT?', writer: 'Sadia Islam', presenter_name: 'Imran Hossain', scheduled_publish_time: at(16, 0), status: 'Shooting', script: '' }),
    base({ content_type: 'PACKAGE', channel: 'The Wave Life', slug_name: 'STREET FOOD TOUR', title: 'Old Dhaka Street Food Tour', thumbnail_text: 'MUST TRY', writer: 'Sadia Islam', presenter_name: 'Sadia Islam', video_editor: 'Imran Hossain', scheduled_publish_time: at(18, 0), status: 'Editing', script: 'Welcome to the lanes of Old Dhaka.', master_export_url: '' }),
    base({ content_type: 'LIVE', channel: 'The Wave Faith', slug_name: 'FRIDAY SERMON LIVE', title: 'Friday Sermon — Live', thumbnail_text: 'LIVE NOW', writer: 'Tanvir Ahmed', presenter_name: 'Rahim Uddin', scheduled_publish_time: at(12, 30), status: 'Published', published_at: at(12, 40), script: '' }),
  ];
  return { org: { id: orgId, name: 'Demo Newsroom', owner_id: team[0].user_id }, team, rows, channels: DEFAULT_CHANNELS };
}

/* ------------------------------------------------------------------ */
/* Style tokens                                                        */
/* ------------------------------------------------------------------ */
const inputBase =
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-sky-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-sky-500/10';
const inputLocked =
  'w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-zinc-400 outline-none cursor-not-allowed select-text';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */



function Avatar({ member, name, size = 'h-6 w-6', text = 'text-[10px]' }) {
  const [failed, setFailed] = useState(false);
  const url = member && member.avatar_url;
  useEffect(() => {
    setFailed(false);
  }, [url]);
  const label = String((member && member.full_name) || name || '?').trim().slice(0, 1).toUpperCase() || '?';
  if (url && !failed) {
    return <img src={url} alt="" onError={() => setFailed(true)} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-white/10`} />;
  }
  return <span className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-semibold text-zinc-200 ring-1 ring-white/10`}>{label}</span>;
}


/* Avatar + name + designation pill, looked up from the team by full name. */
function PersonName({ name, team, hideDesignation }) {
  if (!name) return <span className="text-zinc-600">—</span>;
  const m = (team || []).find((x) => x.full_name === name);
  
  if (hideDesignation) {
    const nick = m?.nickname || name.split(' ')[0];
    const prefix = m?.gender === 'female' ? 'Ms.' : 'Mr.';
    const suffix = m?.gender === 'female' ? 'মহোদয়া' : 'মহোদয়';
    return (
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <Avatar member={m} name={name} size="h-7 w-7" />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-medium text-zinc-200">{prefix} {nick}</span>
          <span className="text-[9px] text-zinc-500 font-serif mt-0.5">{suffix}</span>
        </div>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Avatar member={m} name={name} />
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="truncate text-zinc-200">{name}</span>
        {m && m.designation && !hideDesignation ? <DesignationPill designation={m.designation} /> : null}
      </span>
    </span>
  );
}

/* Label + optional lock icon wrapper */
function Field({ label, locked = false, lockMessage, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1.5">
          {label}
          {locked ? <LockIcon message={lockMessage} /> : null}
        </span>
        {hint ? <span className="normal-case tracking-normal text-zinc-600">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

/* Native select with the current value always available. */
function SelectBox({ value, onChange, options, disabled = false, placeholder = 'Select…', className = '' }) {
  const list = useMemo(() => {
    const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
    if (value && !opts.some((o) => o.value === value)) opts.unshift({ value, label: value });
    return opts;
  }, [options, value]);
  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${disabled ? inputLocked : inputBase} appearance-none pr-9`}
      >
        <option value="" className="bg-[#121215]">
          {placeholder}
        </option>
        {list.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#121215]">
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

/* Text input that commits on blur / Enter so every keystroke is not a write. */
function BlurInput({ value, onCommit, disabled = false, placeholder, type = 'text', multiline = false, rows = 3 }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => {
    setDraft(value || '');
  }, [value]);
  const commit = () => {
    if ((draft || '') !== (value || '')) onCommit(draft);
  };
  const common = {
    value: draft,
    disabled,
    placeholder,
    onChange: (e) => setDraft(e.target.value),
    onBlur: commit,
    className: disabled ? inputLocked : inputBase,
  };
  if (multiline) return <textarea rows={rows} {...common} />;
  return (
    <input
      type={type}
      {...common}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

function ModalShell({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#121215]/90 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] text-zinc-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/30 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function FullScreenCard({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#121215] p-8 shadow-2xl shadow-black/60">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">NewsroomOps</div>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Date range picker                                                   */
/* ------------------------------------------------------------------ */
function DatePicker({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(range.start.getFullYear(), range.start.getMonth(), 1));
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setAnchor(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const today = startOfDay(new Date());
  const presets = [
    { label: 'Today', r: { start: today, end: today } },
    { label: 'Yesterday', r: { start: addDays(today, -1), end: addDays(today, -1) } },
    { label: 'Tomorrow', r: { start: addDays(today, 1), end: addDays(today, 1) } },
    { label: 'This week', r: { start: addDays(today, -today.getDay()), end: addDays(today, 6 - today.getDay()) } },
    { label: 'Last 7 days', r: { start: addDays(today, -6), end: today } },
    { label: 'This month', r: { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) } },
  ];

  const firstDow = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  const pick = (d) => {
    if (!anchor) {
      setAnchor(d);
      return;
    }
    const a = anchor < d ? anchor : d;
    const b = anchor < d ? d : anchor;
    onChange({ start: a, end: b });
    setAnchor(null);
    setHover(null);
    setOpen(false);
  };

  const lo = anchor ? (hover && hover < anchor ? hover : anchor) : range.start;
  const hi = anchor ? (hover && hover > anchor ? hover : anchor) : range.end;

  return (
    <div ref={wrapRef} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`${btnGhost} min-w-[150px] justify-between`}>
        <span className="flex items-center gap-2">
          <Icon name="calendar" />
          {formatRangeLabel(range)}
        </span>
        <Icon name="chevronDown" className="h-3.5 w-3.5 text-zinc-500" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 flex w-[min(92vw,520px)] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#121215]/95 shadow-2xl shadow-black/70 backdrop-blur-2xl">
          <div className="hidden w-36 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] p-2 sm:flex">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  onChange(p.r);
                  setOpen(false);
                  setAnchor(null);
                  setMonth(new Date(p.r.start.getFullYear(), p.r.start.getMonth(), 1));
                }}
                className="rounded-lg px-3 py-2 text-left text-[13px] text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
                <Icon name="chevronLeft" />
              </button>
              <div className="text-[14px] font-semibold text-white">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </div>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
                <Icon name="chevronRight" />
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHover(null)}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const inRange = d >= lo && d <= hi;
                const edge = sameDay(d, lo) || sameDay(d, hi);
                return (
                  <button
                    key={i}
                    onClick={() => pick(d)}
                    onMouseEnter={() => anchor && setHover(d)}
                    className={`h-9 text-[13px] transition ${
                      edge ? 'rounded-full bg-sky-500 font-semibold text-white' : inRange ? 'bg-sky-500/15 text-sky-200' : sameDay(d, today) ? 'rounded-full text-sky-400 hover:bg-white/10' : 'rounded-full text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px] text-zinc-600">{anchor ? 'Pick the end date' : 'Click one day, or two days for a range'}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* First-run setup                                                     */
/* ------------------------------------------------------------------ */
function SetupScreen({ onCreate, busy, error }) {
  const [orgName, setOrgName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const ok = orgName.trim() && ownerName.trim();
  return (
    <FullScreenCard title="Set up your newsroom">
      <p className="mb-5 text-[14px] leading-relaxed text-zinc-400">
        Create your organization. You become the <span className="text-amber-300">Owner</span> — the one and only Owner of this workspace. You can add Managers and team members afterwards.
      </p>
      <div className="space-y-4">
        <Field label="Organization name">
          <input className={inputBase} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="The Wave Media" />
        </Field>
        <Field label="Your full name">
          <input className={inputBase} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Your email" hint="optional">
          <input className={inputBase} type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
      </div>
      {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p> : null}
      <button disabled={!ok || busy} onClick={() => onCreate({ orgName: orgName.trim(), ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim() })} className={`${btnPrimary} mt-6 w-full py-3`}>
        {busy ? 'Creating…' : 'Create organization'}
      </button>
    </FullScreenCard>
  );
}

/* ------------------------------------------------------------------ */
/* + New Content                                                       */
/* ------------------------------------------------------------------ */
function NewContentModal({ channels, team, defaultDate, onClose, onCreate }) {
  const activeNames = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const initialTime = () => {
    const d = new Date(defaultDate);
    const now = new Date();
    d.setHours(sameDay(d, now) ? Math.min(now.getHours() + 1, 23) : 10, 0, 0, 0);
    return toLocalInput(d.toISOString());
  };
  const [f, setF] = useState({
    content_type: '',
    channel: '',
    when: initialTime(),
    slug_name: '',
    title: '',
    thumbnail_text: '',
    writer: '',
    presenter_name: '',
    script: '',
  });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const slugLen = f.slug_name.length;
  const errors = {
    content_type: f.content_type ? '' : 'Choose a content type',
    channel: f.channel ? '' : 'Choose a channel',
    when: '',
    slug_name: f.slug_name.trim() ? '' : 'Slug name is required',
    title: f.title.trim() ? '' : 'Title is required',
  };
  const valid = Object.values(errors).every((e) => !e);
  const showErr = (k) => (tried && errors[k] ? <p className="mt-1.5 text-[12px] text-red-400">{errors[k]}</p> : null);

  const submit = async () => {
    setTried(true);
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onCreate({
      content_type: f.content_type,
      channel: f.channel,
      scheduled_publish_time: fromLocalInput(f.when),
      slug_name: f.slug_name.trim(),
      title: f.title.trim(),
      thumbnail_text: f.thumbnail_text.trim(),
      writer: f.writer,
      presenter_name: f.presenter_name,
      script: f.script,
    });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <ModalShell
      title="New Content"
      subtitle="Fields follow the order of your production brief."
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create content'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="1 · Content / Pipeline type">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('content_type', t)}
                className={`rounded-xl border px-2 py-2.5 text-center text-[11px] font-semibold tracking-wide transition ${
                  f.content_type === t ? 'border-sky-400/60 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {f.content_type ? <p className="mt-1.5 text-[12px] text-zinc-500">Workflow: {CONTENT_TYPE_HINT[f.content_type]}</p> : null}
          {showErr('content_type')}
        </Field>

        <Field label="2 · Channel">
          <SelectBox value={f.channel} onChange={(v) => set('channel', v)} options={channels} placeholder="Select channel" />
          {showErr('channel')}
        </Field>

          <Field label="3 · Scheduled date & publish time" hint="optional — leave empty to keep it in the On hold & unscheduled list">
          <input type="datetime-local" value={f.when} onChange={(e) => set('when', e.target.value)} className={`${inputBase} [color-scheme:dark]`} />
          {showErr('when')}
        </Field>

        <Field label="4 · Slug name" hint={`${slugLen}/${SLUG_MAX} characters`}>
          <input
            value={f.slug_name}
            onChange={(e) => set('slug_name', normalizeSlugInput(e.target.value))}
            placeholder="BUDGET BREAKDOWN FISCAL YEAR"
            maxLength={SLUG_MAX}
            className={`${inputBase} font-mono uppercase tracking-wide`}
            autoCapitalize="characters"
            spellCheck={false}
          />
          {showErr('slug_name')}
        </Field>

        <Field label="5 · Title">
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Full story title" className={inputBase} />
          {showErr('title')}
        </Field>

        <Field label="6 · Thumbnail text">
          <input value={f.thumbnail_text} onChange={(e) => set('thumbnail_text', e.target.value)} placeholder="Short hook shown on the thumbnail" className={inputBase} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="7 · Writer">
            <SelectBox value={f.writer} onChange={(v) => set('writer', v)} options={activeNames} placeholder="Select writer" />
          </Field>
          <Field label="8 · Presenter">
            <SelectBox value={f.presenter_name} onChange={(v) => set('presenter_name', v)} options={activeNames} placeholder="Select presenter" />
          </Field>
        </div>

        <Field label="9 · Script">
          <textarea value={f.script} onChange={(e) => set('script', e.target.value)} rows={7} placeholder="Paste or write the script…" className={`${inputBase} resize-y leading-relaxed`} />
        </Field>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Small modals                                                        */
/* ------------------------------------------------------------------ */
function AddChannelModal({ onClose, onAdd, existing }) {
  const [name, setName] = useState('');
  const dup = existing.some((c) => c.toLowerCase() === name.trim().toLowerCase());
  return (
    <ModalShell
      title="Add channel"
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnPrimary}
            disabled={!name.trim() || dup}
            onClick={async () => {
              if (await onAdd(name.trim())) onClose();
            }}
          >
            Add channel
          </button>
        </>
      }
    >
      <Field label="Channel name">
        <input autoFocus className={inputBase} value={name} onChange={(e) => setName(e.target.value)} placeholder="The Wave Kids" />
      </Field>
      {dup ? <p className="mt-2 text-[12px] text-red-400">That channel already exists.</p> : null}
    </ModalShell>
  );
}

function ReasonModal({ title, label, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
            Confirm
          </button>
        </>
      }
    >
      <Field label={label}>
        <textarea autoFocus rows={4} className={inputBase} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a short note…" />
      </Field>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Team & permissions                                                  */
/* ------------------------------------------------------------------ */
function Toggle({ on, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-white/15'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function TeamModal({ team, actor, orgName, onClose, onAdd, onUpdate, onRemove }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('general');
  const [open, setOpen] = useState(null);
  const actorIsOwner = isOwner(actor);
  const canAdd = isManager(actor);
  const canManage = (t) => t.role !== 'owner' && (actorIsOwner || (actor && actor.role === 'manager' && t.role === 'general'));

  const sorted = [...team].sort((a, b) => {
    const order = { owner: 0, manager: 1, general: 2 };
    return order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name);
  });

  return (
    <ModalShell title="Team & permissions" subtitle={orgName} onClose={onClose} wide>
      {canAdd ? (
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">Add a team member</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1.2fr_0.8fr_auto]">
            <input className={inputBase} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputBase} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <SelectBox value={role} onChange={setRole} disabled={!actorIsOwner} options={actorIsOwner ? [{ value: 'general', label: 'General User' }, { value: 'manager', label: 'Manager' }] : [{ value: 'general', label: 'General User' }]} />
            <button
              className={btnPrimary}
              disabled={!name.trim()}
              onClick={async () => {
                if (await onAdd({ full_name: name.trim(), email: email.trim(), role: actorIsOwner ? role : 'general', designation: designation.trim(), avatar_url: avatarUrl.trim() })) {
                  setName('');
                  setEmail('');
                  setRole('general');
                  setDesignation('');
                  setAvatarUrl('');
                }
              }}
            >
              <Icon name="plus" /> Add
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputBase} placeholder="Designation / job title (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            <input className={inputBase} placeholder="Avatar image link (optional)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
          {!actorIsOwner ? <p className="mt-2 text-[12px] text-zinc-500">Only the Owner can assign the Manager role.</p> : null}
        </div>
      ) : (
        <p className="mb-5 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-zinc-400">
          <LockIcon /> Only the Owner and Managers can add or change team members.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((t) => {
          const manageable = canManage(t);
          const expanded = open === t.id;
          const full = t.role !== 'general';
          return (
            <div key={t.id} className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] ${t.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar member={t} size="h-9 w-9" text="text-[13px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-white">{t.full_name}</span>
                    <RoleBadge role={t.role} />
                    <DesignationPill designation={t.designation} />
                    {!t.active ? <span className="text-[11px] text-zinc-500">inactive</span> : null}
                  </div>
                  <div className="truncate text-[12px] text-zinc-500">{t.email || 'no email'}</div>
                </div>
                <button className={btnGhost + ' !px-3 !py-1.5'} onClick={() => setOpen(expanded ? null : t.id)}>
                  {expanded ? 'Close' : 'Access'}
                </button>
              </div>
              {expanded ? (
                <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
                  {manageable || (actor && actor.id === t.id) ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Designation">
                        <BlurInput value={t.designation} onCommit={(v) => onUpdate(t.id, { designation: v.trim() || null })} placeholder="e.g. Senior Producer" />
                      </Field>
                      <Field label="Avatar image link">
                        <BlurInput value={t.avatar_url} onCommit={(v) => onUpdate(t.id, { avatar_url: v.trim() || null })} placeholder="https://…" />
                      </Field>
                    </div>
                  ) : null}
                  {full ? (
                    <p className="flex items-center gap-2 text-[13px] text-zinc-400">
                      <Icon name="shield" className="h-4 w-4 text-sky-400" /> {t.role === 'owner' ? 'Owner' : 'Managers'} always have full access to every permission.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {PERMISSIONS.map((p) => (
                        <div key={p.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[13px] text-zinc-200">
                              {p.label}
                              {!manageable ? <LockIcon message="You cannot change this person’s permissions" /> : null}
                            </div>
                            <div className="text-[11px] text-zinc-500">{p.hint}</div>
                          </div>
                          <Toggle on={t[p.key]} disabled={!manageable} onChange={(v) => onUpdate(t.id, { [p.key]: v })} />
                        </div>
                      ))}
                    </div>
                  )}
                  {manageable ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {actorIsOwner ? (
                        <SelectBox className="w-44" value={t.role} onChange={(v) => onUpdate(t.id, { role: v })} options={[{ value: 'general', label: 'General User' }, { value: 'manager', label: 'Manager' }]} />
                      ) : null}
                      <button className={btnGhost} onClick={() => onUpdate(t.id, { active: !t.active })}>
                        {t.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button className={btnDanger} onClick={() => onRemove(t)}>
                        <Icon name="trash" /> Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* KPI report                                                          */
/* ------------------------------------------------------------------ */
function countBy(rows, fn) {
  const m = {};
  rows.forEach((r) => {
    const k = fn(r) || '—';
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function KpiModal({ rows, rangeLabel, onClose }) {
  const published = rows.filter((r) => r.status === 'Published').length;
  const inProgress = rows.filter((r) => !['Published', 'Dropped', 'On Hold', 'Draft'].includes(r.status)).length;
  const late = rows.filter((r) => r.status !== 'Published' && r.status !== 'Dropped' && r.scheduled_publish_time && new Date(r.scheduled_publish_time) < new Date()).length;
  const Block = ({ title, items }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">{title}</div>
      {items.length === 0 ? <p className="text-[13px] text-zinc-600">No data</p> : null}
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between py-1 text-[13px]">
          <span className="truncate text-zinc-300">{k}</span>
          <span className="tabular-nums text-white">{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <ModalShell title="KPI report" subtitle={rangeLabel} onClose={onClose} wide>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total', rows.length], ['Published', published], ['In progress', inProgress], ['Past due', late]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{k}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Block title="By status" items={countBy(rows, (r) => r.status)} />
        <Block title="By channel" items={countBy(rows, (r) => r.channel)} />
        <Block title="By content type" items={countBy(rows, (r) => r.content_type)} />
        <Block title="By presenter" items={countBy(rows, (r) => r.presenter_name)} />
        <Block title="By writer" items={countBy(rows, (r) => r.writer)} />
        <Block title="By video editor" items={countBy(rows.filter((r) => r.video_editor), (r) => r.video_editor)} />
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Clipboard                                                           */
/* ------------------------------------------------------------------ */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
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
    } catch (err) {
      return false;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Workflow buttons                                                    */
/* ------------------------------------------------------------------ */
function ActionButtons({ actions, onRun, compact = false }) {
  if (compact) actions = actions.filter(a => a.id !== 'hold' && a.id !== 'drop');
  if (!actions.length) return <p className={compact ? 'text-[12px] text-zinc-600' : 'text-[13px] text-zinc-600'}>{compact ? '—' : 'No actions available for you at this stage.'}</p>;
  const size = compact ? ' !px-2.5 !py-1 !text-[11px]' : '';
  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {actions.map((a) => {
        const cls = (a.tone === 'primary' ? btnPrimary : a.tone === 'danger' ? btnDanger : btnGhost) + size;
        const disabled = !a.allowed || !!a.blocked;
        return (
          <button
            key={a.id}
            className={cls}
            disabled={disabled}
            title={!a.allowed ? a.why : a.blocked}
            onClick={(e) => {
              e.stopPropagation();
              onRun(a);
            }}
          >
            {!a.allowed ? <Icon name="lock" className="h-3 w-3" /> : null}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer tabs                                                         */
/* ------------------------------------------------------------------ */
function OverviewTab({ row, actor, team, channels, patch, actions, onRun }) {
  const activeNames = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const lockMsg = (label) => `You need the “${label}” permission`;
  const okMeta = can(actor, 'can_edit_metadata');
  const okSched = can(actor, 'can_reschedule');
  const okPres = can(actor, 'can_change_presenter');
  const okChan = can(actor, 'can_change_channel');
  const okEditor = can(actor, 'can_assign_editor');

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4">
        <Field label="Title" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <BlurInput value={row.title} disabled={!okMeta} onCommit={(v) => patch({ title: v })} placeholder="Title" />
        </Field>
        <Field label="Thumbnail text" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <BlurInput value={row.thumbnail_text} disabled={!okMeta} onCommit={(v) => patch({ thumbnail_text: v })} placeholder="Hook on the thumbnail" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Channel" locked={!okChan} lockMessage={lockMsg('Change channel')}>
            <SelectBox value={row.channel} disabled={!okChan} options={channels} onChange={(v) => patch({ channel: v })} />
          </Field>
          <Field label="Scheduled publish" locked={!okSched} lockMessage={lockMsg('Reschedule')}>
            <input
              type="datetime-local"
              disabled={!okSched}
              value={toLocalInput(row.scheduled_publish_time)}
              onChange={(e) => e.target.value && patch({ scheduled_publish_time: fromLocalInput(e.target.value) })}
              className={`${okSched ? inputBase : inputLocked} [color-scheme:dark]`}
            />
          </Field>
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Staff assignment</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Writer" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
            <SelectBox value={row.writer} disabled={!okMeta} options={activeNames} onChange={(v) => patch({ writer: v })} placeholder="Unassigned" />
          </Field>
          <Field label="Presenter" locked={!okPres} lockMessage={lockMsg('Change presenter')}>
            <SelectBox value={row.presenter_name} disabled={!okPres} options={activeNames} onChange={(v) => patch({ presenter_name: v })} placeholder="Unassigned" />
          </Field>
          <Field label="Video editor" locked={!okEditor} lockMessage={lockMsg('Assign editor')}>
            <SelectBox value={row.video_editor} disabled={!okEditor} options={activeNames} onChange={(v) => patch({ video_editor: v })} placeholder="Unassigned" />
          </Field>
          <Field label="Camera person" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
            <SelectBox value={row.camera_person} disabled={!okMeta} options={activeNames} onChange={(v) => patch({ camera_person: v })} placeholder="Unassigned" />
          </Field>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <Field label="Archive shelf ID" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <BlurInput value={row.archive_shelf_id} disabled={!okMeta} onCommit={(v) => patch({ archive_shelf_id: v })} placeholder="e.g. SHELF-A12" />
        </Field>
        <Field label="Target platforms" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = row.target_platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  disabled={!okMeta}
                  onClick={() => patch({ target_platforms: on ? row.target_platforms.filter((x) => x !== p.id) : [...row.target_platforms, p.id] })}
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition disabled:cursor-not-allowed ${
                    on ? 'border-sky-400/50 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400'
                  } ${okMeta && !on ? 'hover:bg-white/[0.08]' : ''}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>
      </section>
    </div>
  );
}

function ScriptTab({ row, actor, patch }) {
  const locked = row.is_script_locked === true;
  const mgr = isManager(actor);
  const canEdit = can(actor, 'can_edit_script') && (!locked || mgr);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.script || '');
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(row.script || '');
  }, [row.script, editing]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  const text = row.script || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 150));

  const doCopy = async () => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-500">
          <span>
            {words} words · about {minutes} min on air
          </span>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/25 backdrop-blur-md">
              <Icon name="lock" className="h-3 w-3" /> Script locked
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {mgr ? (
            <button
              onClick={() => patch({ is_script_locked: !locked })}
              title={locked ? 'Let writers edit this script again' : 'Stop everyone except Managers and the Owner from editing'}
              className={locked ? `${btnGhost} !border-amber-400/40 !text-amber-300` : btnGhost}
            >
              <Icon name={locked ? 'unlock' : 'lock'} className="h-3.5 w-3.5" />
              {locked ? 'Unlock Script' : 'Lock Script'}
            </button>
          ) : null}
          <div className="relative">
            {copied ? (
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-500 px-2.5 py-1 text-[12px] font-semibold text-black shadow-lg">
                Copied!
              </span>
            ) : null}
            <button onClick={doCopy} disabled={!text} className={copied ? `${btnGhost} !border-emerald-400/40 !text-emerald-300` : btnGhost}>
              <Icon name={copied ? 'check' : 'copy'} />
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
          {editing ? null : (
            <button
              onClick={() => setEditing(true)}
              disabled={!canEdit}
              title={canEdit ? '' : locked ? 'This script is locked by a Manager' : 'You need the “Edit script” permission'}
              className={btnPrimary}
            >
              <Icon name={canEdit ? 'edit' : 'lock'} className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            className={`${inputBase} resize-y text-[16px] leading-8`}
            style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
            placeholder="Write the script…"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              className={btnGhost}
              onClick={() => {
                setDraft(row.script || '');
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                if (draft !== (row.script || '')) patch({ script: draft });
                setEditing(false);
              }}
            >
              Save script
            </button>
          </div>
        </div>
      ) : text ? (
        <article
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-6 text-[17px] leading-[1.9] text-zinc-200"
          style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
        >
          {text.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="mb-5 whitespace-pre-wrap last:mb-0">
              {para}
            </p>
          ))}
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center text-[14px] text-zinc-500">
          No script yet.{canEdit ? ' Click Edit to write one.' : ''}
        </div>
      )}
            {row.content_type === 'PACKAGE' ? (
        <div className="mt-6">
          <LinkRow label="Raw footage link (goes straight to the editor)" value={row.raw_footage_link} disabled={!actor || actor.active === false} onCommit={(v) => patch({ raw_footage_link: v })} />
        </div>
      ) : null}
{!canEdit && !editing ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-zinc-500">
          <LockIcon /> {locked && !mgr ? 'Read-only — this script is locked. Only Managers and the Owner can edit it.' : 'Read-only — you need the “Edit script” permission to make changes.'}
        </p>
      ) : null}
    </div>
  );
}

function normalizeHashtags(v) {
  return String(v || '')
    .split(/[\s,]+/)
    .map((w) => w.replace(/^#+/, '').trim())
    .filter(Boolean)
    .map((w) => `#${w}`)
    .join(' ');
}

function MetadataTab({ row, actor, patch }) {
  const ok = can(actor, 'can_edit_metadata');
  const msg = 'You need the “Edit metadata” permission';
  return (
    <div className="space-y-5">
      {!ok ? (
        <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <LockIcon message={msg} /> Read-only — {msg.toLowerCase()} to make changes.
        </p>
      ) : (
        <p className="text-[12px] text-zinc-500">Changes save automatically when you click away from a field.</p>
      )}
      <Field label="Post caption / social copy" locked={!ok} lockMessage={msg}>
        <BlurInput multiline rows={6} value={row.post_caption} disabled={!ok} onCommit={(v) => patch({ post_caption: v })} placeholder="Caption that goes out with the post…" />
      </Field>
      <Field label="SEO keywords / tags" locked={!ok} lockMessage={msg} hint="comma separated">
        <BlurInput multiline rows={3} value={row.seo_keywords} disabled={!ok} onCommit={(v) => patch({ seo_keywords: v })} placeholder="budget, fiscal year, economy" />
      </Field>
      <Field label="Hashtags (#)" locked={!ok} lockMessage={msg} hint="# is added for you">
        <BlurInput multiline rows={2} value={row.hashtags} disabled={!ok} onCommit={(v) => patch({ hashtags: normalizeHashtags(v) })} placeholder="#budget #economy" />
      </Field>
    </div>
  );
}

function LinkRow({ label, value, disabled, onCommit }) {
  return (
    <Field label={label} locked={disabled} lockMessage="Inactive members cannot edit">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <BlurInput value={value} disabled={disabled} onCommit={onCommit} placeholder="https://…" />
        </div>
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className={`${btnGhost} !px-3`} title="Open link">
            <Icon name="link" />
          </a>
        ) : null}
      </div>
    </Field>
  );
}

function AssetsTab({ row, actor, patch }) {
  const active = !!actor && actor.active !== false;
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [url, setUrl] = useState('');
  const [thumbText, setThumbText] = useState('');
  const updateShort = (id, p) => patch({ shorts: row.shorts.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const [shortWhen, setShortWhen] = useState('');
  const nextShortN = row.shorts.reduce((m, s, i) => Math.max(m, s.n || i + 1), 0) + 1;
  const shortUid = (s, i) => `${row.content_uid || 'CON'}-SHORT${pad(s.n || i + 1)}`;
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <LinkRow label="Raw footage" value={row.raw_footage_link} disabled={!active} onCommit={(v) => patch({ raw_footage_link: v })} />
        <LinkRow label="Project file" value={row.project_file_url} disabled={!active} onCommit={(v) => patch({ project_file_url: v })} />
        <LinkRow label="Master export" value={row.master_export_url} disabled={!active} onCommit={(v) => patch({ master_export_url: v })} />
        <LinkRow label="Live video URL" value={row.live_video_url} disabled={!active} onCommit={(v) => patch({ live_video_url: v })} />
      </section>
      <section className="border-t border-white/[0.08] pt-4 mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">References & Attachments</div>
        </div>
        <div className="space-y-3">
          {/* List of uploaded references (saved in a new array column 'reference_files', assuming it might be initialized) */}
          {(row.reference_files || []).map((ref, idx) => (
             <div key={idx} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] p-2.5">
               <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-sky-400 hover:underline">{ref.name}</a>
               <button onClick={() => {
                 const newRefs = row.reference_files.filter((_, i) => i !== idx);
                 patch({ reference_files: newRefs });
               }} className="text-zinc-500 hover:text-red-400"><Icon name="trash" className="h-4 w-4" /></button>
             </div>
          ))}

          {/* Upload Button */}
          {active && (
            <div className="relative">
              <input 
                type="file" 
                id={`upload-ref-${row.id}`}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const url = await uploadReferenceFile(file);
                    const newRef = { name: file.name, url };
                    patch({ reference_files: [...(row.reference_files || []), newRef] });
                    alert('File uploaded successfully!');
                  } catch(err) {
                    alert('Upload failed. ' + err.message);
                  }
                }}
              />
              <label 
                htmlFor={`upload-ref-${row.id}`} 
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.1] w-full border border-dashed border-white/[0.2]"
              >
                <Icon name="plus" className="h-4 w-4" /> Upload Document/Reference
              </label>
            </div>
          )}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Shorts & reels ({row.shorts.length})</div>
        </div>
        <div className="space-y-2">
          {row.shorts.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[11px] text-zinc-500">{shortUid(s, i)}</div>
                <div className="truncate text-[13px] text-zinc-100">{s.title}</div>
                {s.thumb_text ? <div className="truncate text-[12px] text-sky-300/80">Thumb: {s.thumb_text}</div> : null}
                <div className="truncate text-[12px] text-amber-300/80">{s.publish_at ? `Upload: ${formatStamp(s.publish_at)}` : 'No upload time set'}</div>
                <div className="truncate text-[11px] text-zinc-500">
                  {PLATFORMS.find((p) => p.id === s.platform)?.label || s.platform}
                  {s.url ? ` · ${s.url}` : ''}
                </div>
              </div>
              <button
                disabled={!active}
                onClick={() => updateShort(s.id, { published: !s.published })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset disabled:opacity-50 ${s.published ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' : 'bg-white/[0.04] text-zinc-400 ring-white/10'}`}
              >
                {s.published ? 'Published' : 'Pending'}
              </button>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">
                  <Icon name="link" />
                </a>
              ) : null}
              <button disabled={!active} onClick={() => patch({ shorts: row.shorts.filter((x) => x.id !== s.id) })} className="text-zinc-500 hover:text-red-400 disabled:opacity-40">
                <Icon name="trash" />
              </button>
            </div>
          ))}
          {row.shorts.length === 0 ? <p className="text-[13px] text-zinc-600">No shorts or reels yet.</p> : null}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:grid-cols-2">
          <input className={inputBase} placeholder="Short title" value={title} disabled={!active} onChange={(e) => setTitle(e.target.value)} />
          <SelectBox value={platform} onChange={setPlatform} options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))} disabled={!active} />
          <input className={inputBase} placeholder="Short thumb text (hook)" value={thumbText} disabled={!active} onChange={(e) => setThumbText(e.target.value)} />
          <input className={inputBase} placeholder="URL (optional)" value={url} disabled={!active} onChange={(e) => setUrl(e.target.value)} />
            <div className="sm:col-span-2">
            <div className="mb-1 text-[11px] text-zinc-500">Upload date & time (optional)</div>
            <input type="datetime-local" className={`${inputBase} [color-scheme:dark]`} value={shortWhen} disabled={!active} onChange={(e) => setShortWhen(e.target.value)} />
          </div>
          <button
            className={`${btnPrimary} sm:col-span-2`}
            disabled={!active || !title.trim()}
            onClick={() => {
              patch({ shorts: [...row.shorts, { id: uid(), n: nextShortN, title: title.trim(), thumb_text: thumbText.trim(), platform, url: url.trim(), publish_at: fromLocalInput(shortWhen), published: false }] });
              setShortWhen('');
              setTitle('');
              setThumbText('');
              setUrl('');
            }}
          >
            <Icon name="plus" /> Add short / reel
          </button>
        </div>
      </section>
    </div>
  );
}

const QC_KINDS = [
  { id: 'revision', label: 'Revision note' },
  { id: 'qa', label: 'QA remark' },
  { id: 'audit', label: 'Audit comment' },
];
const QC_KIND_LABEL = { revision: 'Revision note', qa: 'QA remark', audit: 'Audit comment', change: 'Change' };

function QcTab({ row, actor, patch }) {
  const active = !!actor && actor.active !== false;
  const [kind, setKind] = useState('revision');
  const [note, setNote] = useState('');
  const reasons = [
    ['On hold', row.hold_reason],
    ['Dropped', row.drop_reason],
    ['Re-shoot', row.reshoot_reason],
  ].filter((r) => r[1]);

  const addNote = () => {
    const text = note.trim();
    if (!text || !active) return;
    const now = new Date().toISOString();
    const entry = { actor: actor.full_name, role: actor.role, time: now };
    const audit = [...row.audit_log, { ...entry, kind, from: '', to: QC_KIND_LABEL[kind], note: text }];
    if (kind === 'revision') patch({ revisions: [...row.revisions, { ...entry, note: text }], audit_log: audit });
    else patch({ audit_log: audit });
    setNote('');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Add a note {!active ? <LockIcon message="Inactive members cannot add notes" /> : null}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {QC_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              disabled={!active}
              onClick={() => setKind(k.id)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition disabled:cursor-not-allowed ${
                kind === k.id ? 'border-sky-400/50 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08]'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          disabled={!active}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={kind === 'revision' ? 'What needs to be changed?' : kind === 'qa' ? 'Quality check remark…' : 'Audit comment…'}
          className={active ? inputBase : inputLocked}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-600">Recorded with your name, role and the exact time.</span>
          <button className={btnPrimary} disabled={!active || !note.trim()} onClick={addNote}>
            <Icon name="plus" /> Add {QC_KIND_LABEL[kind].toLowerCase()}
          </button>
        </div>
      </section>

      {reasons.length ? (
        <section className="space-y-2">
          {reasons.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-400">{k}</div>
              <div className="mt-1 text-[13px] text-zinc-200">{v}</div>
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Revision requests ({row.revisions.length})</div>
        {row.revisions.length === 0 ? <p className="text-[13px] text-zinc-600">No revisions requested.</p> : null}
        <div className="space-y-2">
          {[...row.revisions].reverse().map((r, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <div className="text-[13px] text-zinc-200">{r.note}</div>
              <div className="mt-1 text-[11px] text-zinc-500">
                {r.actor}
                {r.role ? ` (${ROLE_LABEL[r.role] || r.role})` : ''} · {formatStamp(r.time)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Audit trail ({row.audit_log.length})</div>
        {row.audit_log.length === 0 ? <p className="text-[13px] text-zinc-600">Nothing recorded yet.</p> : null}
        <ol className="relative space-y-4 border-l border-white/[0.08] pl-5">
          {[...row.audit_log].reverse().map((a, i) => {
            const isNote = a.kind === 'revision' || a.kind === 'qa' || a.kind === 'audit';
            const dot = isNote ? 'bg-violet-400' : a.kind === 'change' ? 'bg-amber-400' : 'bg-sky-400';
            return (
              <li key={i} className="relative">
                <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${dot}`} />
                <div className="text-[13px] text-zinc-200">
                  {isNote ? (
                    <span className="font-medium text-white">{QC_KIND_LABEL[a.kind]}</span>
                  ) : a.kind === 'change' ? (
                    <>
                      <span className="font-medium text-white">{a.field}</span>: <span className="text-zinc-400">{a.from || 'empty'}</span> → <span className="font-medium text-white">{a.to || 'empty'}</span>
                    </>
                  ) : (
                    <>
                      {a.from ? `${a.from} → ` : ''}
                      <span className="font-medium text-white">{a.to}</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {a.actor}
                  {a.role ? ` (${ROLE_LABEL[a.role] || a.role})` : ''} · {formatStamp(a.time)}
                </div>
                {a.note ? <div className="mt-1 text-[12px] text-zinc-400">“{a.note}”</div> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function DeleteModal({ row, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const key = (row.slug_name || row.title || row.content_uid || 'DELETE').trim();
  const ok = text.trim().toLowerCase() === key.toLowerCase();
  return (
    <ModalShell
      title="Delete permanently?"
      subtitle="This cannot be undone."
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnDanger}
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true);
              const done = await onConfirm(row);
              setBusy(false);
              if (done) onClose();
            }}
          >
            <Icon name="trash" /> {busy ? 'Deleting…' : 'Delete forever'}
          </button>
        </>
      }
    >
      <p className="mb-4 text-[14px] leading-relaxed text-zinc-300">
        The script, links, shorts, notes and history of this content will be removed for everyone. To confirm, type <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px] text-white">{key}</span> below.
      </p>
      <input autoFocus className={inputBase} value={text} onChange={(e) => setText(e.target.value)} placeholder={key} />
    </ModalShell>
  );
}
function Drawer({ row, actor, team, channels, onClose, onPatch, onRun, onDelete }) {
  const [tab, setTab] = useState('overview');
  useEffect(() => {
    setTab('overview');
  }, [row.id]);
  const patch = (p) => onPatch(row.id, p);
  const actions = getActions(row, actor);
  const tabs = [
    ['overview', 'Overview'],
    ['script', 'Script Desk'],
    ['assets', 'Assets & Shorts'],
    ['qc', 'QC & Audit'],
    ['metadata', 'Metadata'],
  ];
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[580px] flex-col border-l border-white/[0.08] bg-black/60 shadow-2xl shadow-black backdrop-blur-xl">
        <header className="border-b border-white/[0.06] px-6 pb-0 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <TypeBadge type={row.content_type} />
                <StatusBadge status={row.status} />
                <span className="font-mono text-[11px] text-zinc-600">{row.content_uid}</span>
              </div>
              <h2 className="truncate text-[20px] font-semibold tracking-tight text-white">{row.slug_name || row.title || 'Untitled'}</h2>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                {row.channel || 'No channel'} · {formatDay(row.scheduled_publish_time)} {formatTime(row.scheduled_publish_time)}
              </p>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Close drawer">
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
          <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${tab === id ? 'border-sky-400 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'overview' ? <OverviewTab row={row} actor={actor} team={team} channels={channels} patch={patch} actions={actions} onRun={(a) => onRun(row, a)} /> : null}
          {tab === 'script' ? <ScriptTab row={row} actor={actor} patch={patch} /> : null}
          {tab === 'assets' ? <AssetsTab row={row} actor={actor} patch={patch} /> : null}
          {tab === 'qc' ? <QcTab row={row} actor={actor} patch={patch} /> : null}
          {tab === 'metadata' ? <MetadataTab row={row} actor={actor} patch={patch} /> : null}
        </div>
        <footer className="border-t border-white/[0.08] bg-black/70 px-6 py-4 backdrop-blur-xl">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Next step</div>
          <ActionButtons actions={actions} onRun={(a) => onRun(row, a)} />
          <div className="mt-3 border-t border-white/[0.06] pt-3 flex items-center gap-3">
            <button
              onClick={() => downloadContentArchive(row)}
              title="Download Full Archive (PDF + Script + Logs)"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-[12px] font-medium text-indigo-300 transition hover:bg-indigo-500/20"
            >
              <Icon name="download" className="h-3.5 w-3.5" />
              Archive ZIP
            </button>
          </div>
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <button
              className={btnDanger}
              disabled={!isManager(actor)}
              title={isManager(actor) ? 'Delete this content forever' : 'Only Managers and the Owner can delete content'}
              onClick={() => onDelete(row)}
            >
              <Icon name={isManager(actor) ? 'trash' : 'lock'} className="h-3.5 w-3.5" /> Delete permanently
            </button>
          </div>
          {actions.some((a) => a.allowed && a.blocked) ? (
            <p className="mt-2 text-[12px] text-amber-400/80">{actions.find((a) => a.allowed && a.blocked).blocked}</p>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Which permission guards which field                                 */
/* ------------------------------------------------------------------ */
const FIELD_PERM = {
  script: 'can_edit_script',
  title: 'can_edit_metadata',
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
  writer: 'Writer',
  presenter_name: 'Presenter',
  video_editor: 'Video editor',
  camera_person: 'Camera person',
  channel: 'Channel',
  scheduled_publish_time: 'Scheduled time',
  archive_shelf_id: 'Shelf ID',
  target_platforms: 'Platforms',
  post_caption: 'Post caption',
  seo_keywords: 'SEO keywords',
  hashtags: 'Hashtags',
};

const clip = (v, n = 80) => {
  const t = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

function describeValue(field, v) {
  if (field === 'scheduled_publish_time') return v ? formatStamp(v) : '';
  if (field === 'is_script_locked') return v ? 'Locked' : 'Unlocked';
  if (field === 'target_platforms') return asArray(v).join(', ');
  if (field === 'script') return v ? `${String(v).trim().split(/\s+/).filter(Boolean).length} words` : 'empty';
  return clip(v);
}

const errText = (e) => (e && e.message ? e.message : 'Something went wrong');

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
/* Date picker + button in the parked table: puts a content back on the rundown. */
function ScheduleCell({ row, actor, onSchedule }) {
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const held = row.status === 'On Hold';
  const allowed = held ? isManager(actor) : can(actor, 'can_reschedule');
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <input
        type="datetime-local"
        value={when}
        disabled={!allowed || busy}
        onChange={(e) => setWhen(e.target.value)}
        title={allowed ? 'Pick a new publish date & time' : held ? 'Only Managers and the Owner can resume held content' : 'You need the “Reschedule” permission'}
        className={`${inputBase} !w-[205px] !py-1.5 !text-[12px] [color-scheme:dark]`}
      />
      <button
        className={`${btnPrimary} !px-3 !py-1.5 !text-[12px]`}
        disabled={!allowed || !when || busy}
        onClick={async () => {
          setBusy(true);
          await onSchedule(row, fromLocalInput(when));
          setBusy(false);
        }}
      >
        {held ? 'Resume' : 'Schedule'}
      </button>
    </div>
  );
}
function NewsroomApp({ authUser, onSignOut }) {
  const today = startOfDay(new Date());
  const [boot, setBoot] = useState({ phase: 'loading', message: '' });
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [org, setOrg] = useState(null);
  const [team, setTeam] = useState([]);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [rows, setRows] = useState([]);
  const [actorId, setActorId] = useState(null);
  const [range, setRange] = useState({ start: today, end: today });
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
    const [theme, setTheme] = useState('dark');
  useEffect(() => {
    try {
      setTheme(window.localStorage.getItem('nw-theme') === 'light' ? 'light' : 'dark');
    } catch (e) {}
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    try {
      window.localStorage.setItem('nw-theme', next);
    } catch (e) {}
  };
  const [showKpi, setShowKpi] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [reasonFor, setReasonFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [toast, setToast] = useState(null);

  const rowsRef = useRef([]);
  const teamRef = useRef([]);
  const reqRef = useRef(0);
  const toastTimer = useRef(null);
  rowsRef.current = rows;
  teamRef.current = team;

  const authId = authUser ? authUser.id : null;
  const authRef = useRef({ id: null, email: '' });
  authRef.current = { id: authId, email: authUser ? authUser.email || '' : '' };
  const [showProfile, setShowProfile] = useState(false);

  /* Signed-in person's own team record, and who the app treats as the actor. */
  const me = useMemo(() => (authId ? team.find((m) => m.auth_user_id === authId) || null : null), [team, authId]);
  const switcherOn = !authId || isOwner(me);
  const actor = useMemo(() => (authId && !isOwner(me) ? me : team.find((m) => m.id === actorId) || null), [team, actorId, authId, me]);

  const notify = useCallback((msg, tone = 'info') => {
    setToast({ msg, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------------- data loading ---------------- */
  const mergeChannels = (names) => {
    const seen = new Set();
    const out = [];
    [...DEFAULT_CHANNELS, ...names].forEach((n) => {
      const k = String(n).toLowerCase();
      if (n && !seen.has(k)) {
        seen.add(k);
        out.push(n);
      }
    });
    return out;
  };

  const loadWorkspace = useCallback(async () => {
    if (!supabase) {
      const d = buildDemo();
      setOrg(d.org);
      setTeam(d.team);
      setChannels(d.channels);
      setRows(d.rows);
      setActorId(d.team[0].id);
      setBoot({ phase: 'ready', message: '' });
      return;
    }
    const { data: orgs, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: true }).limit(1);
    if (error) {
      setBoot({ phase: 'error', message: `${errText(error)} — did you run the SQL migration in Supabase?` });
      return;
    }
    if (!orgs || orgs.length === 0) {
    if (authRef.current && authRef.current.id) {
        setBoot({ phase: 'noaccess', message: `${authRef.current.email} is not on any team yet. Ask your Owner or a Manager to add this email in Team, then sign in again.` });
        return;
      }
      setBoot({ phase: 'setup', message: '' });
      return;
    }
    const o = orgs[0];
    const [t, c] = await Promise.all([
      supabase.from('team_members').select('*').eq('organization_id', o.id).order('created_at', { ascending: true }),
      supabase.from('channels').select('name').or(`organization_id.eq.${o.id},organization_id.is.null`),
    ]);
    if (t.error) {
      setBoot({ phase: 'error', message: `${errText(t.error)} — did you run the SQL migration in Supabase?` });
      return;
    }
    const members = (t.data || []).map(normalizeMember);
    setOrg(o);
    setTeam(members);
    setChannels(mergeChannels(c.error ? [] : (c.data || []).map((x) => x.name)));
        const owner = members.find((m) => m.role === 'owner') || members[0];
    const auth = authRef.current;
    if (auth.id) {
      const mail = String(auth.email || '').toLowerCase();
      let mine = members.find((m) => m.auth_user_id === auth.id) || null;
      if (!mine) {
        mine = members.find((m) => !m.auth_user_id && m.email && String(m.email).toLowerCase() === mail) || null;
        if (mine) {
          const link = await supabase.from('team_members').update({ auth_user_id: auth.id }).eq('id', mine.id);
          if (link.error) {
            setBoot({ phase: 'error', message: `${errText(link.error)} — did you run the login SQL in Supabase?` });
            return;
          }
          mine = { ...mine, auth_user_id: auth.id };
          setTeam(members.map((m) => (m.id === mine.id ? mine : m)));
        }
      }
      if (!mine) {
        setBoot({ phase: 'noaccess', message: `${auth.email} is not on the team yet. Ask your Owner or a Manager to add this email in Team, then sign in again.` });
        return;
      }
      if (mine.active === false) {
        setBoot({ phase: 'noaccess', message: 'Your access has been switched off. Please contact your Owner or a Manager.' });
        return;
      }
      setActorId(mine.id);
      setBoot({ phase: 'ready', message: '' });
      return;
    }
    setActorId((prev) => (prev && members.some((m) => m.id === prev) ? prev : owner ? owner.id : null));
    setBoot({ phase: 'ready', message: '' });
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const fetchRows = useCallback(async () => {
    if (!supabase || !org) return;
    const req = ++reqRef.current;
    const from = range.start.toISOString();
    const to = addDays(range.end, 1).toISOString();
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .or(`organization_id.eq.${org.id},organization_id.is.null`)
      .gte('scheduled_publish_time', from)
      .lt('scheduled_publish_time', to)
      .order('scheduled_publish_time', { ascending: true });
    if (req !== reqRef.current) return;
    if (error) {
      notify(`Could not load rundown: ${errText(error)}`, 'error');
      return;
    }
        /* Also load contents whose SHORTS are due in this range (needs the short_days column). */
    const days = [];
    for (let d = new Date(range.start); d < addDays(range.end, 1) && days.length < 62; d = addDays(d, 1)) days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    const { data: extra } = await supabase
      .from('contents')
      .select('*')
      .or(`organization_id.eq.${org.id},organization_id.is.null`)
      .overlaps('short_days', days);
    if (req !== reqRef.current) return;
        /* Parked content (On Hold, or no date yet) is not tied to the date range, so load it separately. */
    const [heldRes, nodateRes] = await Promise.all([
      supabase.from('contents').select('*').eq('organization_id', org.id).eq('status', 'On Hold'),
      supabase.from('contents').select('*').eq('organization_id', org.id).is('scheduled_publish_time', null),
    ]);
    if (req !== reqRef.current) return;
    const seen = new Set();
    const merged = [];
    [data || [], extra || [], heldRes.data || [], nodateRes.data || []].forEach((list) =>
      list.forEach((r) => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          merged.push(r);
        }
      })
    );
    setRows(merged.map(normalizeRow));
  }, [org, range, notify]);

  const reloadTeam = useCallback(async () => {
    if (!supabase || !org) return;
    const { data, error } = await supabase.from('team_members').select('*').eq('organization_id', org.id).order('created_at', { ascending: true });
    if (!error && data) setTeam(data.map(normalizeMember));
  }, [org]);

  useEffect(() => {
    if (boot.phase === 'ready') fetchRows();
  }, [boot.phase, fetchRows]);

  useEffect(() => {
    if (!supabase || boot.phase !== 'ready' || !org) return undefined;
    const ch = supabase
      .channel(`newsroom-${org.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => fetchRows())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => reloadTeam())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [boot.phase, org, fetchRows, reloadTeam]);

  /* ---------------- setup ---------------- */
  const setupOrg = async ({ orgName, ownerName, ownerEmail }) => {
    setSetupBusy(true);
    setSetupError('');
    const orgId = uid();
    const ownerUserId = uid();
    const o = await supabase.from('organizations').insert({ id: orgId, name: orgName, owner_id: ownerUserId });
    if (o.error) {
      setSetupBusy(false);
      setSetupError(errText(o.error));
      return;
    }
    const perms = {};
    PERMISSIONS.forEach((p) => {
      perms[p.key] = true;
    });
        const m = await supabase.from('team_members').insert({ user_id: ownerUserId, organization_id: orgId, full_name: ownerName, email: authRef.current.email || ownerEmail || null, auth_user_id: authRef.current.id, role: 'owner', active: true, ...perms });
    if (m.error) {
      await supabase.from('organizations').delete().eq('id', orgId);
      setSetupBusy(false);
      setSetupError(errText(m.error));
      return;
    }
    await supabase.from('contents').update({ organization_id: orgId }).is('organization_id', null);
    await supabase.from('channels').update({ organization_id: orgId }).is('organization_id', null);
    setSetupBusy(false);
    setBoot({ phase: 'loading', message: '' });
    await loadWorkspace();
  };

  /* ---------------- content writes ---------------- */
  const patchRow = useCallback(
    async (id, patch, internal = false) => {
      const prev = rowsRef.current.find((r) => r.id === id);
      if (!prev) return false;
      if (!internal) {
        if (!actor || actor.active === false) {
          notify('Inactive members cannot make changes', 'error');
          return false;
        }
        const denied = Object.keys(patch).find((k) => FIELD_PERM[k] && !can(actor, FIELD_PERM[k]));
        if (denied) {
          const p = PERMISSIONS.find((x) => x.key === FIELD_PERM[denied]);
          notify(`You need the “${p ? p.label : 'required'}” permission`, 'error');
          return false;
        }
        if ('is_script_locked' in patch && !isManager(actor)) {
          notify('Only Managers and the Owner can lock or unlock a script', 'error');
          return false;
        }
        if ('script' in patch && prev.is_script_locked && !isManager(actor)) {
          notify('This script is locked. Only Managers and the Owner can edit it', 'error');
          return false;
        }
        if (!('audit_log' in patch)) {
          const now = new Date().toISOString();
          const entries = Object.keys(patch)
            .filter((k) => TRACKED_FIELDS[k] && JSON.stringify(patch[k]) !== JSON.stringify(prev[k]))
            .map((k) => ({
              kind: 'change',
              field: TRACKED_FIELDS[k],
              from: describeValue(k, prev[k]),
              to: describeValue(k, patch[k]),
              actor: actor.full_name,
              role: actor.role,
              time: now,
              note: '',
            }));
          if (entries.length) patch = { ...patch, audit_log: [...prev.audit_log, ...entries] };
        }
      }
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      if (!supabase) return true;
      const { error } = await supabase.from('contents').update(patch).eq('id', id);
      if (error) {
        setRows((rs) => rs.map((r) => (r.id === id ? prev : r)));
        notify(`Save failed: ${errText(error)}`, 'error');
        return false;
      }
      return true;
    },
    [actor, notify]
  );

  const transition = useCallback(
    async (row, action, reason = '') => {
      const fresh = rowsRef.current.find((r) => r.id === row.id) || row;
      const current = getActions(fresh, actor).find((a) => a.id === action.id);
      if (!current || !current.allowed || current.blocked) {
        notify(current && current.blocked ? current.blocked : 'You cannot perform this action', 'error');
        return;
      }
      const now = new Date().toISOString();
      const patch = {
        status: current.to,
        audit_log: [...fresh.audit_log, { kind: 'status', actor: actor.full_name, role: actor.role, from: fresh.status, to: current.to, time: now, note: reason }],
      };
      if (current.id === 'hold') {
        patch.previous_status = fresh.status;
        patch.hold_reason = reason;
      }
      if (current.id === 'resume') patch.hold_reason = null;
      if (current.id === 'drop') patch.drop_reason = reason;
      if (current.id === 'restore') patch.drop_reason = null;
      if (current.id === 'reshoot') patch.reshoot_reason = reason;
      if (current.id === 'revise') patch.revisions = [...fresh.revisions, { note: reason, actor: actor.full_name, role: actor.role, time: now }];
      if (current.to === 'Published') {
        patch.published_at = now;
        patch.publisher = actor.full_name;
      }
      const ok = await patchRow(fresh.id, patch, true);
      if (ok) notify(`${fresh.slug_name || fresh.title || 'Content'} → ${current.to}`, 'success');
    },
    [actor, patchRow, notify]
  );

  const runAction = (row, action) => {
    if (action.id === 'download_script') { downloadContentArchive(row); return; }
    if (action.id === 'copy_script') { navigator.clipboard.writeText(row.script || 'No script'); alert('Script copied!'); return; }
    if (action.needsReason) setReasonFor({ rowId: row.id, action });
    else transition(row, action);
  };
  /* Put a parked content (On Hold / no date) onto the rundown with a new publish time. */
  const scheduleParked = async (row, iso) => {
    if (!iso) return;
    let ok = false;
    if (row.status === 'On Hold') {
      if (!isManager(actor)) {
        notify('Only Managers and the Owner can resume held content', 'error');
        return;
      }
      const now = new Date().toISOString();
      const to = row.previous_status || 'Draft';
      ok = await patchRow(
        row.id,
        {
          status: to,
          hold_reason: null,
          scheduled_publish_time: iso,
          audit_log: [
            ...row.audit_log,
            { kind: 'status', actor: actor.full_name, role: actor.role, from: 'On Hold', to, time: now, note: 'Resumed with a new publish time' },
            { kind: 'change', field: 'Scheduled time', from: describeValue('scheduled_publish_time', row.scheduled_publish_time), to: describeValue('scheduled_publish_time', iso), actor: actor.full_name, role: actor.role, time: now, note: '' },
          ],
        },
        true
      );
    } else {
      ok = await patchRow(row.id, { scheduled_publish_time: iso });
    }
    if (!ok) return;
    const when = new Date(iso);
    if (!(when >= range.start && when < addDays(range.end, 1))) setRange({ start: startOfDay(when), end: startOfDay(when) });
    notify(`${row.slug_name || row.title || 'Content'} is on the rundown for ${formatStamp(iso)}`, 'success');
  };
  const createContent = async (data) => {
    if (!actor || actor.active === false) {
      notify('Inactive members cannot create content', 'error');
      return false;
    }
    const now = new Date().toISOString();
    const payload = {
      organization_id: org ? org.id : null,
      status: 'Draft',
      target_platforms: ['youtube', 'facebook'],
      shorts: [],
      revisions: [],
      audit_log: [{ kind: 'status', actor: actor.full_name, role: actor.role, from: '', to: 'Draft', time: now, note: 'Created' }],
      ...data,
    };
    let saved;
    if (supabase) {
      /* No id is sent: Supabase generates the primary key and returns the saved row. */
      const { data: inserted, error } = await supabase.from('contents').insert(payload).select().single();
      if (error) {
        notify(`Could not create: ${errText(error)}`, 'error');
        return false;
      }
      saved = normalizeRow(inserted);
    } else {
    saved = normalizeRow({ id: uid(), content_uid: makeContentUid(payload.scheduled_publish_time, rowsRef.current.length + 1), ...payload });
    }
    const when = saved.scheduled_publish_time ? new Date(saved.scheduled_publish_time) : null;
    const inRange = !when || (when >= range.start && when < addDays(range.end, 1));
    if (!inRange) setRange({ start: startOfDay(when), end: startOfDay(when) });
    setRows((rs) => [...rs.filter((r) => r.id !== saved.id), saved]);
    notify('Content created', 'success');
    return true;
  };
  const deleteContent = async (row) => {
    if (!isManager(actor)) {
      notify('Only Managers and the Owner can delete content', 'error');
      return false;
    }
    if (supabase) {
      const { error } = await supabase.from('contents').delete().eq('id', row.id);
      if (error) {
        notify(`Could not delete: ${errText(error)}`, 'error');
        return false;
      }
      await supabase.from('notifications').delete().eq('content_id', String(row.id));
    }
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    setSelectedId(null);
    notify(`${row.slug_name || row.title || 'Content'} deleted`, 'success');
    return true;
  };
  const addChannel = async (name) => {
    if (!isManager(actor)) {
      notify('Only the Owner and Managers can add channels', 'error');
      return false;
    }
    if (supabase) {
      const { error } = await supabase.from('channels').insert({ organization_id: org.id, name });
      if (error) {
        notify(`Could not add channel: ${errText(error)}`, 'error');
        return false;
      }
    }
    setChannels((c) => [...c, name]);
    notify(`Channel “${name}” added`, 'success');
    return true;
  };

  /* ---------------- team writes ---------------- */
  const canManageMember = (t) => !!actor && t.role !== 'owner' && (isOwner(actor) || (actor.role === 'manager' && actor.active !== false && t.role === 'general'));

  const addMember = async ({ full_name, email, role, designation, avatar_url }) => {
    if (!isManager(actor)) {
      notify('Only the Owner and Managers can add members', 'error');
      return false;
    }
    const finalRole = role === 'manager' && isOwner(actor) ? 'manager' : 'general';
    const perms = {};
    PERMISSIONS.forEach((p) => {
      perms[p.key] = false;
    });
    const payload = { organization_id: org.id, full_name, email: email || null, role: finalRole, active: true, designation: designation || null, avatar_url: avatar_url || null, ...perms };
    let created = { id: uid(), user_id: uid(), ...payload };
    if (supabase) {
      const { data, error } = await supabase.from('team_members').insert(payload).select().single();
      if (error) {
        notify(`Could not add member: ${errText(error)}`, 'error');
        return false;
      }
      created = data;
    }
    setTeam((t) => [...t, normalizeMember(created)]);
        const inviteNote = email ? ' — now create their login in Supabase' : ' (no email, so they cannot sign in yet)';
    notify(`${full_name} added as ${ROLE_LABEL[finalRole]}${inviteNote}`, 'success');
    return true;
  };

  const updateMember = async (id, patch) => {
    const target = teamRef.current.find((m) => m.id === id);
    const profileOnly = Object.keys(patch).every((k) => k === 'designation' || k === 'avatar_url');
    const ownProfile = profileOnly && !!actor && actor.active !== false && actor.id === id;
    if (!target || !(canManageMember(target) || ownProfile)) {
      notify('You cannot change this member', 'error');
      return;
    }
    if (patch.role && (!isOwner(actor) || !['general', 'manager'].includes(patch.role))) {
      notify('Only the Owner can change roles', 'error');
      return;
    }
    const prev = target;
    setTeam((t) => t.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    if (!supabase) return;
    const { error } = await supabase.from('team_members').update(patch).eq('id', id);
    if (error) {
      setTeam((t) => t.map((m) => (m.id === id ? prev : m)));
      notify(`Save failed: ${errText(error)}`, 'error');
    }
  };

  const removeMember = async (t) => {
    if (!canManageMember(t)) {
      notify('You cannot remove this member', 'error');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Remove ${t.full_name} from the team?`)) return;
    if (supabase) {
      const { error } = await supabase.from('team_members').delete().eq('id', t.id);
      if (error) {
        notify(`Could not remove: ${errText(error)}`, 'error');
        return;
      }
    }
    setTeam((list) => list.filter((m) => m.id !== t.id));
    if (actorId === t.id) setActorId(null);
    notify(`${t.full_name} removed`, 'success');
  };

  useEffect(() => {
    if (team.length && !team.some((m) => m.id === actorId)) {
      const owner = team.find((m) => m.role === 'owner') || team[0];
      setActorId(owner.id);
    }
  }, [team, actorId]);

  /* ---------------- derived rows ---------------- */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const endExclusive = addDays(range.end, 1);
    return rows
      .filter((r) => {
        if (isParked(r)) return false;
        const d = new Date(r.scheduled_publish_time);
        if (d >= range.start && d < endExclusive) return true;
        return shortsInRange(r, range.start, endExclusive).length > 0;
      })
      .filter((r) => channelFilter === 'all' || r.channel === channelFilter)
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => {
        if (!q) return true;
        return [r.slug_name, r.title, r.presenter_name, r.writer, r.video_editor, r.content_uid, r.channel, r.thumbnail_text].some((v) => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (channelFilter === 'all') {
          const ia = channels.indexOf(a.channel);
          const ib = channels.indexOf(b.channel);
          const ga = ia === -1 ? channels.length : ia;
          const gb = ib === -1 ? channels.length : ib;
          if (ga !== gb) return ga - gb;
          if (ga === channels.length && (a.channel || '') !== (b.channel || '')) return String(a.channel || '').localeCompare(String(b.channel || ''));
        }
      return new Date(rowTimeIn(a, range.start, endExclusive) || 0) - new Date(rowTimeIn(b, range.start, endExclusive) || 0);
      });
  }, [rows, range, channelFilter, statusFilter, search, channels]);
  /* On Hold + no-date content: shown in the table under the rundown. */
  const parked = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(isParked)
      .filter((r) => channelFilter === 'all' || r.channel === channelFilter)
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => !q || [r.slug_name, r.title, r.presenter_name, r.writer, r.video_editor, r.content_uid, r.channel, r.thumbnail_text].some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [rows, channelFilter, statusFilter, search]);
  /* Rundown rows, with a channel header inserted before each channel group in "All Channels" view. */
  const tableItems = useMemo(() => {
    const items = [];
    let last = null;
    visible.forEach((r) => {
      if (channelFilter === 'all') {
        const name = r.channel || 'No channel';
        if (name !== last) {
          items.push({ type: 'header', key: `h-${name}`, name, count: visible.filter((x) => (x.channel || 'No channel') === name).length });
          last = name;
        }
      }
      items.push({ type: 'row', key: r.id, row: r });
    });
    return items;
  }, [visible, channelFilter]);

  const selected = rows.find((r) => r.id === selectedId) || null;
  const reasonRow = reasonFor ? rows.find((r) => r.id === reasonFor.rowId) : null;

  /* ---------------- export ---------------- */
  const exportXlsx = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = visible.map((r) => ({
        Date: r.scheduled_publish_time ? new Date(r.scheduled_publish_time).toLocaleDateString() : '',
        Time: formatTime(r.scheduled_publish_time),
        'Content ID': r.content_uid || '',
        Type: r.content_type,
        Channel: r.channel || '',
        Slug: r.slug_name || '',
        Title: r.title || '',
        'Thumbnail Text': r.thumbnail_text || '',
        Writer: r.writer || '',
        Presenter: r.presenter_name || '',
        'Video Editor': r.video_editor || '',
        'Camera Person': r.camera_person || '',
        Status: r.status,
        Publisher: r.publisher || '',
        'Published At': r.published_at ? new Date(r.published_at).toLocaleString() : '',
        'Shelf ID': r.archive_shelf_id || '',
        Shorts: r.shorts.length,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rundown');
      const stamp = `${range.start.getFullYear()}-${pad(range.start.getMonth() + 1)}-${pad(range.start.getDate())}`;
      XLSX.writeFile(wb, `newsroom-rundown-${stamp}.xlsx`);
      notify('Excel exported', 'success');
    } catch (e) {
      notify(`Export failed: ${errText(e)}`, 'error');
    }
  };

  /* ---------------- Escape key ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (reasonFor) setReasonFor(null);
      else if (showNew) setShowNew(false);
      else if (showAddChannel) setShowAddChannel(false);
      else if (showTeam) setShowTeam(false);
      else if (showKpi) setShowKpi(false);
      else if (selectedId) setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reasonFor, showNew, showAddChannel, showTeam, showKpi, selectedId]);
  /* ---------------- my profile ---------------- */
  const saveProfile = async ({ full_name, designation, avatar_url }) => {
    if (!me) return false;
    const oldName = me.full_name;
    const patch = { full_name, designation: designation || null, avatar_url: avatar_url || null };
    if (supabase) {
      const { error } = await supabase.from('team_members').update(patch).eq('id', me.id);
      if (error) {
        notify(`Could not save profile: ${errText(error)}`, 'error');
        return false;
      }
      if (full_name !== oldName) {
        /* Assignments are stored by name, so keep them pointing at this person. */
        for (const col of ['writer', 'presenter_name', 'video_editor', 'camera_person']) {
          await supabase.from('contents').update({ [col]: full_name }).eq(col, oldName);
        }
      }
    }
    setTeam((t) => t.map((m) => (m.id === me.id ? { ...m, ...patch } : m)));
    if (full_name !== oldName) fetchRows();
    notify('Profile updated', 'success');
    return true;
  };
  /* ---------------- boot screens ---------------- */
  if (boot.phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-[14px] text-zinc-500">
        <span className="live-dot mr-2 h-2 w-2 rounded-full bg-sky-400" /> Loading workspace…
      </div>
    );
  }
  if (boot.phase === 'error') {
    return (
      <FullScreenCard title="Can’t reach your database">
        <p className="mb-5 flex gap-2 text-[14px] leading-relaxed text-red-300">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {boot.message}
        </p>
        <button className={`${btnPrimary} w-full`} onClick={() => { setBoot({ phase: 'loading', message: '' }); loadWorkspace(); }}>
          Try again
        </button>
      </FullScreenCard>
    );
  }
  if (boot.phase === 'noaccess') {
    return (
      <FullScreenCard title="No access yet">
        <p className="mb-5 text-[14px] leading-relaxed text-zinc-400">{boot.message}</p>
        <button className={`${btnPrimary} w-full`} onClick={onSignOut}>
          Sign out
        </button>
      </FullScreenCard>
    );
  }
  if (boot.phase === 'setup') return <SetupScreen onCreate={setupOrg} busy={setupBusy} error={setupError} />;

  const lockedCount = actor && !isManager(actor) ? PERMISSIONS.filter((p) => !actor[p.key]).length : 0;

  /* ---------------- main UI ---------------- */
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[13px] font-bold text-black">N</div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-white">NewsroomOps</div>
              <div className="text-[11px] text-zinc-500">
                {org ? org.name : ''} {supabase ? '' : '· demo mode'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-3 pr-1 ${switcherOn ? 'flex' : 'hidden'}`} title="Role simulation — switch who you are acting as to test permissions">
              {actor ? <Avatar member={actor} size="h-6 w-6" /> : null}
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Acting as</span>
              <select
                value={actorId || ''}
                onChange={(e) => setActorId(e.target.value)}
                className="max-w-[180px] rounded-full bg-transparent py-1.5 pr-1 text-[13px] text-white outline-none"
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#121215]">
                    {m.full_name} · {ROLE_LABEL[m.role]}
                    {m.active ? '' : ' (inactive)'}
                  </option>
                ))}
              </select>
              {actor ? <RoleBadge role={actor.role} /> : null}
              {actor && actor.designation ? <DesignationPill designation={actor.designation} /> : null}
              {lockedCount > 0 ? (
                <span className="flex items-center gap-1 pr-2 text-[11px] text-zinc-500" title={`${lockedCount} of ${PERMISSIONS.length} permissions off`}>
                  <Icon name="lock" className="h-3 w-3" /> {lockedCount}
                </span>
              ) : null}
            </div>
            
            <button className={btnPrimary} onClick={() => setShowNew(true)}>
              <Icon name="plus" /> New Content
            </button>
                      {supabase && me ? (
              <NotificationBell
                memberId={me.id}
                onOpenContent={(cid) => {
                  const r = rowsRef.current.find((x) => String(x.id) === String(cid));
                  if (r) setSelectedId(r.id);
                  else notify('Change the date range to find this item', 'info');
                }}
              />
            ) : null}
            {authUser && me ? (
              <button className={`${btnGhost} !py-1.5 !pl-2`} onClick={() => setShowProfile(true)} title="My profile">
                <Avatar member={me} size="h-6 w-6" />
                <span className="hidden max-w-[120px] truncate sm:inline">{me.full_name}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-5 pb-3">
          <DatePicker range={range} onChange={setRange} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                aria-label="Channel"
                className="min-w-[170px] appearance-none rounded-full border border-white/[0.1] bg-white/[0.04] py-2 pl-4 pr-9 text-[13px] font-medium text-zinc-100 outline-none transition hover:bg-white/[0.08] focus:border-sky-400/60"
              >
                <option value="all" className="bg-[#121215]">
                  All Channels
                </option>
                {channels.map((c) => (
                  <option key={c} value={c} className="bg-[#121215]">
                    {c}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            </div>
            <button
              onClick={() => (isManager(actor) ? setShowAddChannel(true) : notify('Only the Owner and Managers can add channels', 'error'))}
              className="flex items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-white/[0.15] px-3 py-1.5 text-[12px] text-zinc-400 transition hover:text-white"
            >
              <Icon name={isManager(actor) ? 'plus' : 'lock'} className="h-3 w-3" /> Channel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-zinc-300 outline-none"
            >
              <option value="all" className="bg-[#121215]">All statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#121215]">
                  {s}
                </option>
              ))}
            </select>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-44 rounded-full border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-400/50"
              />
            </div>
            <button
              onClick={() => downloadKPIReport(visible)}
              title="Download KPI Excel for filtered data"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Icon name="chart" className="h-3.5 w-3.5" /> KPI Report
            </button>
            <button
              onClick={() => downloadFullSystemBackup(rows)}
              title="Backup Entire System (JSON + CSV)"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <Icon name="shield" className="h-3.5 w-3.5" /> Backup All
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight text-white">Daily Rundown</h1>
          <span className="text-[13px] text-zinc-500">
            {visible.length} item{visible.length === 1 ? '' : 's'} · {formatRangeLabel(range)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#121215]">
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                  {['Time', 'Content Type', 'Slug Name', 'Writer', 'Presenter', 'Video Editor', 'Short', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableItems.map((item, i) => {
                if (item.type === 'header') {
                  return (
                    <tr key={item.key} className="border-b border-white/[0.06] bg-white/[0.025]">
                      <td colSpan={9} className="px-4 py-5">
                        <div className="flex items-center gap-4">
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.16]" />
                          <span className="text-[18px] font-semibold tracking-tight text-white">{item.name}</span>
                          <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-400">{item.count}</span>
                          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.16]" />
                        </div>
                      </td>
                    </tr>
                  );
                }
                const r = item.row;
                return (
                  <tr
                    key={item.key}
                    onClick={() => setSelectedId(r.id)}
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                    className="row-in cursor-pointer border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.04]"
                  >
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5 tabular-nums text-zinc-300">
                      <div className="font-medium text-white">{formatTime(rowTimeIn(r, range.start, addDays(range.end, 1)))}</div>
                      {!sameDay(range.start, range.end) ? <div className="text-[11px] text-zinc-500">{formatDay(rowTimeIn(r, range.start, addDays(range.end, 1)))}</div> : null}
                    </td>
                    <td className="px-3 py-3 border-r border-white/5 relative">
                      <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                      <TypeBadge type={r.content_type} />
                    </td>
                    <td className="max-w-[280px] px-3 py-3 border-r border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-mono text-[12px] font-semibold tracking-wide text-white">{r.slug_name || '—'}</span>
                        {r.is_script_locked ? <LockIcon message="Script locked" className="h-3 w-3 shrink-0" /> : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      <PersonName name={r.writer} team={team} hideDesignation />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      <PersonName name={r.presenter_name} team={team} hideDesignation />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      <PersonName name={r.video_editor} team={team} hideDesignation />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      {shortsInRange(r, range.start, addDays(range.end, 1)).length ? (
                        <div className="flex flex-col gap-1">
                          {shortsInRange(r, range.start, addDays(range.end, 1)).map((s) => (
                            <span key={s.id} className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.published ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' : 'bg-amber-500/15 text-amber-300 ring-amber-400/25'}`}>
                              Short · {formatTime(s.publish_at)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="min-w-[260px] px-3 py-3">
                      <ActionButtons compact actions={getActions(r, actor)} onRun={(a) => runAction(r, a)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-[15px] font-medium text-zinc-300">Nothing scheduled</div>
              <p className="mt-1 text-[13px] text-zinc-600">Pick another date or add new content.</p>
            </div>
          ) : null}
        </div>
          
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[18px] font-semibold tracking-tight text-white">On hold &amp; unscheduled</h2>
            <span className="text-[13px] text-zinc-500">
              {parked.length} item{parked.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#121215]">
            <table className="w-full min-w-[1080px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                  {['Why', 'Content Type', 'Slug Name', 'Channel', 'Writer', 'Presenter', 'Status', 'New publish time'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parked.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.04]">
                    <td className="max-w-[220px] px-4 py-3.5">
                      {r.status === 'On Hold' ? (
                        <>
                          <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-medium text-yellow-300 ring-1 ring-inset ring-yellow-400/25">On hold</span>
                          {r.hold_reason ? <div className="mt-1 truncate text-[12px] text-zinc-500">{r.hold_reason}</div> : null}
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/15 px-2 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-zinc-400/25">No date &amp; time</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-r border-white/5 relative">
                      <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                      <TypeBadge type={r.content_type} />
                    </td>
                    <td className="max-w-[300px] px-4 py-3.5">
                      <span className="block truncate font-mono text-[12px] font-semibold tracking-wide text-white">{r.slug_name || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-zinc-300">{r.channel || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      <PersonName name={r.writer} team={team} hideDesignation />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 border-r border-white/5">
                      <PersonName name={r.presenter_name} team={team} hideDesignation />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ScheduleCell row={r} actor={actor} onSchedule={scheduleParked} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parked.length === 0 ? (
              <div className="px-6 py-10 text-center text-[13px] text-zinc-600">Nothing on hold, and nothing waiting for a date.</div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1500px] px-5 pb-10 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.06] pt-6">
          <button className={btnGhost} onClick={toggleTheme} title="Switch light / dark theme" aria-label="Switch light / dark theme">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            )}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button className={btnGhost} onClick={() => setShowTeam(true)}>
            <Icon name="users" /> Team
          </button>
          <button className={btnGhost} onClick={() => setShowKpi(true)}>
            <Icon name="chart" /> KPI
          </button>
          <button className={btnGhost} onClick={exportXlsx}>
            <Icon name="download" /> Excel
          </button>
        </div>
      </footer>
      {selected ? <Drawer row={selected} actor={actor} team={team} channels={channels} onClose={() => setSelectedId(null)} onPatch={patchRow} onRun={runAction} onDelete={(r) => setDeleteFor(r.id)} /> : null}
      {showNew ? <NewContentModal channels={channels} team={team} defaultDate={range.start} onClose={() => setShowNew(false)} onCreate={createContent} /> : null}
      {showAddChannel ? <AddChannelModal existing={channels} onClose={() => setShowAddChannel(false)} onAdd={addChannel} /> : null}
      {showTeam ? <TeamModal team={team} actor={actor} orgName={org ? org.name : ''} onClose={() => setShowTeam(false)} onAdd={addMember} onUpdate={updateMember} onRemove={removeMember} /> : null}
            {showProfile && me ? (
        <ProfileModal
          member={me}
          authEmail={authUser ? authUser.email : ''}
          onClose={() => setShowProfile(false)}
          onSave={saveProfile}
          onSignOut={onSignOut}
        />
      ) : null}
      {showKpi ? <KpiModal rows={visible} rangeLabel={formatRangeLabel(range)} onClose={() => setShowKpi(false)} /> : null}
            {deleteFor && rows.find((r) => r.id === deleteFor) ? (
        <DeleteModal row={rows.find((r) => r.id === deleteFor)} onClose={() => setDeleteFor(null)} onConfirm={deleteContent} />
      ) : null}
        {reasonFor && reasonRow ? (
        <ReasonModal
          title={reasonFor.action.label}
          label="Reason / note"
          onClose={() => setReasonFor(null)}
          onConfirm={(reason) => {
            const { action } = reasonFor;
            setReasonFor(null);
            transition(reasonRow, action, reason);
          }}
        />
      ) : null}

      {toast ? (
        <div className="toast-in fixed bottom-6 left-1/2 z-[80]">
          <div
            className={`rounded-full border px-4 py-2.5 text-[13px] font-medium shadow-2xl backdrop-blur-xl ${
              toast.tone === 'error' ? 'border-red-500/30 bg-red-950/70 text-red-200' : toast.tone === 'success' ? 'border-emerald-500/30 bg-emerald-950/70 text-emerald-200' : 'border-white/10 bg-black/70 text-zinc-200'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      ) : null}
    </div>
  );
}
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Wrong email or password. Ask your Owner or a Manager if you have not received your login yet.' : err.message);
  };

  return (
    <FullScreenCard title="Sign in">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input type="email" autoComplete="email" autoFocus className={inputBase} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" className={inputBase} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p> : null}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-5 text-[12px] leading-relaxed text-zinc-600">Your login is created by your Owner or a Manager. Forgot your password? Ask them to reset it.</p>
    </FullScreenCard>
  );
}

/* Shrinks a photo to a 384px square JPEG (small and fast to load). */
const resizeToJpeg = (file, size = 384) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(src);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read this image'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('Could not read this image'));
    };
    img.src = src;
  });
function ProfileModal({ member, authEmail, onClose, onSave, onSignOut }) {
  const [name, setName] = useState(member.full_name || '');
  const [designation, setDesignation] = useState(member.designation || '');
  const [avatar, setAvatar] = useState(member.avatar_url || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const full = member.role !== 'general';
    const [uploading, setUploading] = useState(false);
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeToJpeg(file);
      if (supabase && member.organization_id && member.id) {
        const path = `${member.organization_id}/${member.id}.jpg`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        setAvatar(`${data.publicUrl}?v=${Date.now()}`);
      } else {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            setAvatar(String(reader.result));
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      setError(`Could not upload the photo: ${err && err.message ? err.message : 'unknown error'}`);
    }
    setUploading(false);
  };

  const save = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (password && password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setBusy(true);
    const ok = await onSave({ full_name: name.trim(), designation: designation.trim(), avatar_url: avatar.trim() });
    if (ok && password && supabase) {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setBusy(false);
        setError(`Profile saved, but the password was not changed: ${err.message}`);
        return;
      }
    }
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <ModalShell
      title="My profile"
      subtitle={authEmail}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onSignOut}>
            Sign out
          </button>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar member={{ full_name: name, avatar_url: avatar }} size="h-16 w-16" text="text-[22px]" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-white">{name || 'Your name'}</span>
              <RoleBadge role={member.role} />
              <DesignationPill designation={designation} />
            </div>
            <p className="mt-1 text-[12px] text-zinc-500">This is how your team sees you.</p>
                  <label className={`${btnGhost} mt-2 cursor-pointer !py-1.5 !text-[12px] ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            </label>
          </div>
        </div>
        <Field label="Full name">
          <input className={inputBase} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Job designation" hint="optional">
          <input className={inputBase} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Producer" />
        </Field>
        <Field label="Profile Picture (Upload)" hint="optional">
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*"
              className="text-[12px] text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[12px] file:text-white hover:file:bg-white/20"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const fileName = generateFileName(file.name);
                  // Make sure you have created an 'avatars' bucket in Supabase!
                  const url = await uploadFile('avatars', fileName, file);
                  setAvatar(url);
                  alert('Avatar uploaded successfully!');
                } catch (err) {
                  alert('Upload failed: ' + err.message);
                }
              }}
            />
            {avatar && <img src={avatar} alt="Avatar Preview" className="h-8 w-8 rounded-full object-cover border border-white/20" />}
          </div>
        </Field>
        <Field label="New password" hint="leave empty to keep the current one">
          <input type="password" autoComplete="new-password" className={inputBase} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your access (set by your Manager)</div>
          {full ? (
            <p className="flex items-center gap-2 text-[13px] text-zinc-400">
              <Icon name="shield" className="h-4 w-4 text-sky-400" /> {ROLE_LABEL[member.role]}s have full access.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <div key={p.key} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[13px]">
                  {member[p.key] ? <Icon name="check" className="h-4 w-4 text-emerald-400" /> : <LockIcon message="Ask your Manager for this permission" className="h-4 w-4" />}
                  <span className={member[p.key] ? 'text-zinc-200' : 'text-zinc-500'}>{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p> : null}
      </div>
    </ModalShell>
  );
}

function NotificationBell({ memberId, onOpenContent }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    if (!supabase || !memberId) return;
    const { data, error } = await supabase.from('notifications').select('*').eq('member_id', memberId).order('created_at', { ascending: false }).limit(30);
    if (!error && data) setItems(data);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !memberId) return undefined;
    const ch = supabase
      .channel(`notifications-${memberId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `member_id=eq.${memberId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [memberId, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };
  const markAll = async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('member_id', memberId).eq('read', false);
  };

  if (!memberId) return null;
  return (
    <div ref={wrapRef} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`${btnGhost} relative !px-3`} aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#121215]/95 shadow-2xl shadow-black/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span className="text-[14px] font-semibold text-white">Notifications</span>
            <button disabled={unread === 0} onClick={markAll} className="text-[12px] text-sky-400 hover:text-sky-300 disabled:text-zinc-600">
              Mark all read
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-zinc-600">You are all caught up.</p> : null}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                  if (n.content_id) onOpenContent(n.content_id);
                }}
                className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.05] ${n.read ? '' : 'bg-sky-500/[0.06]'}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-sky-400'}`} />
                <span className="min-w-0">
                  <span className={`block text-[13px] leading-snug ${n.read ? 'text-zinc-400' : 'text-zinc-100'}`}>{n.message}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-600">{formatStamp(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* Auth gate: shows the login screen until someone is signed in. */
export default function Page() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) return <NewsroomApp authUser={null} onSignOut={() => {}} />;
  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-[14px] text-zinc-500">
        <span className="live-dot mr-2 h-2 w-2 rounded-full bg-sky-400" /> Loading…
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return <NewsroomApp key={session.user.id} authUser={session.user} onSignOut={() => supabase.auth.signOut()} />;
}
