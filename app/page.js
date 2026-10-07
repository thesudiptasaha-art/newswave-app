'use client';
import { APP_NAME, APP_CREDIT } from '../utils/constants';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, LockIcon } from '../components/ui/Icons';
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from '../components/ui/Badges';
import { createClient } from '@supabase/supabase-js';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, PersonName, Field, SelectBox, BlurInput, ModalShell, FullScreenCard, Toggle, ActionButtons } from '../components/ui/Shared';
import { downloadContentArchive, downloadKPIReport, downloadFullSystemBackup, downloadUserReport } from '../services/exportService';
import { uploadFile, generateFileName } from '../services/storageService';
import { uploadReferenceFile } from '../services/fileUploadProvider';
import { Drawer, DeleteModal } from '../components/ui/Drawer';
import { NewContentModal, AddChannelModal, ReasonModal, TeamModal, KpiModal, BulkScheduleModal, ProfileModal, MyWorkModal, EmployeeReportModal, BackupModal } from '../components/ui/Modals';

import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, CONTENT_TYPE_COLORS, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  STATUS_META, ALL_STATUSES, isManager, isOwner, can, afterScript, afterShoot, getActions,
  startOfDay, addDays, sameDay, MONTHS, pad, formatRangeLabel, toLocalInput, fromLocalInput,
  formatTime, formatDay, formatStamp, SLUG_MAX, normalizeSlugInput, uid, generateUserUID,
  makeContentUid, asArray, shortsInRange, rowTimeIn, isParked, normalizeRow, normalizeMember,
  FIELD_PERM, TRACKED_FIELDS
} from '../lib/core';




/* ------------------------------------------------------------------ */
/* Supabase client (falls back to demo mode when env vars are absent)  */
/* ------------------------------------------------------------------ */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Demo data (used when Supabase env vars are missing)                 */
/* ------------------------------------------------------------------ */
function buildDemo() {
  const orgId = 'demo-org';
  const mk = (full_name, email, role, perms, gender = 'male') => {
    const nick = full_name.split(' ')[0];
    return normalizeMember({ id: uid(), user_id: uid(), custom_uid: generateUserUID(), organization_id: orgId, full_name, nickname: nick, gender, email, role, active: true, can_write: true, can_edit_video: true, can_produce: true, can_camera: true, can_present: true, ...perms });
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

  'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-sky-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-sky-500/10';

  'w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-zinc-400 outline-none cursor-not-allowed select-text';







/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

















/* Avatar + name + designation pill, looked up from the team by full name. */






























/* Label + optional lock icon wrapper */















/* Native select with the current value always available. */




























/* Text input that commits on blur / Enter so every keystroke is not a write. */































































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


/* ------------------------------------------------------------------ */
/* Small modals                                                        */
/* ------------------------------------------------------------------ */




/* ------------------------------------------------------------------ */
/* Team & permissions                                                  */
/* ------------------------------------------------------------------ */

















/* ------------------------------------------------------------------ */
/* KPI report                                                          */
/* ------------------------------------------------------------------ */






/* ------------------------------------------------------------------ */
/* Workflow buttons                                                    */
/* ------------------------------------------------------------------ */





























/* ------------------------------------------------------------------ */
/* Drawer tabs                                                         */
/* ------------------------------------------------------------------ */


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
  const [bulkOpen, setBulkOpen] = useState(false);
    const [showEmpReport, setShowEmpReport] = useState(false);
    const [showBackup, setShowBackup] = useState(false);
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
    const [showAuthority, setShowAuthority] = useState(false);
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
    const [showMyWork, setShowMyWork] = useState(false);

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
    const [heldRes, nodateRes, draftDroppedRes, pastNotPubRes, emptyMetaRes] = await Promise.all([
      supabase.from('contents').select('*').eq('organization_id', org.id).eq('status', 'On Hold'),
      supabase.from('contents').select('*').eq('organization_id', org.id).is('scheduled_publish_time', null),
      supabase.from('contents').select('*').eq('organization_id', org.id).in('status', ['Draft', 'Dropped']),
      supabase.from('contents').select('*').eq('organization_id', org.id).lt('scheduled_publish_time', new Date().toISOString()).neq('status', 'Published').neq('status', 'Ready to Publish'),
      supabase.from('contents').select('*').eq('organization_id', org.id).or('title.is.null,title.eq.').or('script.is.null,script.eq.'),
    ]);
    if (req !== reqRef.current) return;
    const seen = new Set();
    const merged = [];
    [data || [], extra || [], heldRes.data || [], nodateRes.data || [], draftDroppedRes.data || [], pastNotPubRes.data || [], emptyMetaRes.data || []].forEach((list) =>
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
      .sort((a, b) => {
        if (a.scheduled_publish_time && b.scheduled_publish_time) return new Date(a.scheduled_publish_time) - new Date(b.scheduled_publish_time);
        if (a.scheduled_publish_time) return -1;
        if (b.scheduled_publish_time) return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
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
        'Cameraman': r.camera_person || '',
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
      XLSX.writeFile(wb, `wavedesk-rundown-${stamp}.xlsx`);
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
              <div className="text-[15px] font-semibold tracking-tight text-white">{APP_NAME}</div>
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6">
        <div className="mb-4 relative flex flex-col items-center">
          <h1 className="text-[22px] font-semibold tracking-tight text-white text-center">RUNDOWN</h1>
          <div className="w-full flex justify-end mt-2 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
          <span className="text-[13px] text-zinc-500">
            {visible.length} item{visible.length === 1 ? '' : 's'} · {formatRangeLabel(range)}
          </span>
        </div>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#121215]">
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                  {['Time', 'Slug Name', 'Staff Assignment', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">
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
                      <td colSpan={4} className="px-4 py-5">
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
                    <td className="whitespace-nowrap px-3 py-2 border-r border-white/5 tabular-nums text-zinc-300 align-top">
                      <div className="font-medium text-white">{formatTime(rowTimeIn(r, range.start, addDays(range.end, 1)))}</div>
                      {!sameDay(range.start, range.end) ? <div className="text-[11px] text-zinc-500">{formatDay(rowTimeIn(r, range.start, addDays(range.end, 1)))}</div> : null}
                      <div className="mt-1.5"><StatusBadge status={r.status} /></div>
                    </td>
                    <td className="max-w-[280px] px-3 py-2 border-r border-white/5 relative align-top">
                      <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                      {(() => {
                        const tc = CONTENT_TYPE_COLORS[r.content_type?.toUpperCase()] || { bg: 'bg-zinc-500', text: 'text-zinc-500', tagText: 'text-white' };
                        return (
                          <div className="pl-3 flex flex-col gap-0.5">
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${tc.bg} ${tc.tagText}`}>
                                {r.content_type || 'UNKNOWN'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`uppercase text-[18px] font-bold tracking-wide ${tc.text} px-1 -ml-1 truncate w-full min-w-[150px]`}>
                                {r.slug_name || 'NO SLUG...'}
                              </div>
                              {r.is_script_locked ? <LockIcon message="Script locked" className="h-4 w-4 shrink-0 text-white" /> : null}
                            </div>
                            {(() => {
                              const d = r.scheduled_publish_time ? new Date(r.scheduled_publish_time) : null;
                              const isMainInRange = d && d >= range.start && d < addDays(range.end, 1);
                              const totalShorts = (r.shorts || []).length;
                              const dueShorts = shortsInRange(r, range.start, addDays(range.end, 1));
                              if (!isMainInRange && dueShorts.length === 0) return null;
                              
                              const getOrdinal = (num) => {
                                const sfx = ["th", "st", "nd", "rd"];
                                const v = num % 100;
                                return num + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
                              };
                              return (
                                <div className="flex flex-col mt-1 text-[11px] text-zinc-500">
                                  {isMainInRange && totalShorts >= 1 && (
                                    <div>Total {totalShorts} Short Content</div>
                                  )}
                                  {dueShorts.map(s => {
                                    const n = (r.shorts || []).findIndex(x => x.id === s.id) + 1;
                                    return <div key={s.id}>{getOrdinal(n)} out of {totalShorts}</div>;
                                  })}
                                </div>
                              );
                            })()}

                          </div>
                        );
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 border-r border-white/5">
                      <div className="flex flex-col gap-1 text-[11px]">
                        {r.writer ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Script:</span><PersonName name={r.writer} team={team} hideDesignation /></div> : null}
                        {r.presenter_name ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Presenter:</span><PersonName name={r.presenter_name} team={team} hideDesignation /></div> : null}
                        {r.video_editor ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Video Edit:</span><PersonName name={r.video_editor} team={team} hideDesignation /></div> : null}
                        {!r.writer && !r.presenter_name && !r.video_editor && <span className="text-zinc-600 italic">Unassigned</span>}
                      </div>
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

        {/* Mobile View for Rundown (2-Column) */}
        <div className="md:hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] mb-8">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500 bg-white/[0.02]">
                <th className="px-3 py-2 font-medium w-[40%]">Time / Type / Status</th>
                <th className="px-3 py-2 font-medium w-[60%] text-right">Slug / Action</th>
              </tr>
            </thead>
            <tbody>
               {tableItems.map((item, i) => {
                  if (item.type === 'header') {
                     return (
                        <tr key={item.key} className="border-b border-white/[0.06] bg-white/[0.025]">
                           <td colSpan={2} className="px-3 py-3 text-center">
                              <span className="text-[14px] font-semibold text-white">{item.name}</span>
                              <span className="ml-2 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-zinc-400">{item.count}</span>
                           </td>
                        </tr>
                     )
                  }
                  const r = item.row;
                  return (
                     <tr key={item.key} onClick={() => setSelectedId(r.id)} className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]">
                        <td className="px-3 py-3 align-top border-r border-white/5 relative w-[40%]">
                           <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                           <div className="flex flex-col gap-2 pl-1">
                              <span className="text-sky-400 font-mono text-[11px] font-medium tracking-tighter">{formatTime(rowTimeIn(r, range.start, addDays(range.end, 1)))}</span>
                              <div className="scale-90 origin-left"><TypeBadge type={r.content_type} /></div>
                              <div className="scale-90 origin-left"><StatusBadge status={r.status} /></div>
                           </div>
                        </td>
                        <td className="px-3 py-3 align-top w-[60%] relative">
                           <div className="flex flex-col justify-between h-full min-h-[90px]">
                              <div className="flex items-start justify-end gap-1.5 text-right w-full">
                                     {r.is_script_locked && <LockIcon message="Script locked" className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-1" />}
                                     <div className={`uppercase text-right text-[16px] font-black ${CONTENT_TYPE_COLORS[r.content_type]?.text || 'text-zinc-300'} p-1 -mr-1 w-full leading-tight truncate`}>
                                       {r.slug_name || 'ENTER SLUG...'}
                                     </div>
                                  </div>
                              <div className="flex flex-col items-end gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                                 <ActionButtons actions={getActions(r, actor).slice(0, 2)} onRun={(a) => runAction(r, a)} compact />
                              </div>
                           </div>
                        </td>
                     </tr>
                  )
               })}
            </tbody>
          </table>
        </div>
        <section className="mt-10">
          <div className="mb-4 relative flex flex-col items-center">
            <h2 className="text-[22px] font-semibold tracking-tight text-white text-center">PARKING ZONE</h2>
            <div className="w-full flex justify-end mt-2 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
            <span className="text-[13px] text-zinc-500">
              {parked.length} item{parked.length === 1 ? '' : 's'}
            </span>
          </div>
          </div>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#121215]">
            <table className="w-full min-w-[1080px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                  {['Why', 'Content Type', 'Slug Name', 'Channel', 'Staff Assignment', 'Status', 'New publish time'].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parked.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.04]">
                    <td className="max-w-[220px] px-4 py-2">
                      {r.status === 'On Hold' ? (
                        <>
                          <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-medium text-yellow-300 ring-1 ring-inset ring-yellow-400/25">On hold</span>
                          {r.hold_reason ? <div className="mt-1 truncate text-[12px] text-zinc-500">{r.hold_reason}</div> : null}
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/15 px-2 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-zinc-400/25">No date &amp; time</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-white/5 relative">
                      <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                      <TypeBadge type={r.content_type} />
                    </td>
                    <td className="max-w-[300px] px-4 py-2">
                      <span className="block truncate font-mono text-[12px] font-semibold tracking-wide text-white">{r.slug_name || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-300">{r.channel || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex flex-col gap-1 text-[11px]">
                        {r.writer ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Script:</span><PersonName name={r.writer} team={team} hideDesignation /></div> : null}
                        {r.presenter_name ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Presenter:</span><PersonName name={r.presenter_name} team={team} hideDesignation /></div> : null}
                        {r.video_editor ? <div className="flex items-center gap-1.5"><span className="text-zinc-500 w-[60px] shrink-0">Video Edit:</span><PersonName name={r.video_editor} team={team} hideDesignation /></div> : null}
                        {!r.writer && !r.presenter_name && !r.video_editor && <span className="text-zinc-600 italic">Unassigned</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2">
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
        
          {/* Mobile View for Parked (2-Column) */}
          <div className="md:hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] mt-4">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500 bg-white/[0.02]">
                  <th className="px-3 py-2 font-medium w-[40%]">Type &amp; Status</th>
                  <th className="px-3 py-2 font-medium w-[60%] text-right">Slug &amp; Schedule</th>
                </tr>
              </thead>
              <tbody>
                 {parked.map((r) => (
                       <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]">
                          <td className="px-3 py-3 align-top border-r border-white/5 relative w-[40%]">
                             <div className={`absolute inset-y-0 left-0 w-1 ${STATUS_META[r.status]?.dot || "bg-zinc-500"}`} />
                             <div className="flex flex-col gap-2 pl-1">
                                {r.status === 'On Hold' ? (
                                  <span className="inline-flex items-center rounded-sm bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-300 w-fit">On hold</span>
                                ) : (
                                  <span className="inline-flex items-center rounded-sm bg-zinc-500/15 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 w-fit">No date</span>
                                )}
                                <div className="scale-90 origin-left"><TypeBadge type={r.content_type} /></div>
                             </div>
                          </td>
                          <td className="px-3 py-3 align-top w-[60%] relative">
                             <div className="flex flex-col justify-between h-full min-h-[90px]">
                                <div className="flex items-start justify-end gap-1.5 text-right w-full">
                                     {r.is_script_locked && <LockIcon message="Script locked" className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-1" />}
                                     <div className={`uppercase text-right text-[16px] font-black ${CONTENT_TYPE_COLORS[r.content_type]?.text || 'text-zinc-300'} p-1 -mr-1 w-full leading-tight truncate`}>
                                       {r.slug_name || 'ENTER SLUG...'}
                                     </div>
                                  </div>
                                <div className="flex flex-col items-end gap-2 mt-auto pt-2 scale-90 origin-bottom-right" onClick={(e) => e.stopPropagation()}>
                                   <ScheduleCell row={r} actor={actor} onSchedule={scheduleParked} />
                                </div>
                             </div>
                          </td>
                       </tr>
                 ))}
              </tbody>
            </table>
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
          
          {(isManager(actor) || isOwner(actor)) ? (
            <button className={btnGhost} onClick={() => setShowAuthority(true)}>
              কর্তৃপক্ষ
            </button>
          ) : null}
          {isManager(actor) ? (
            <>
              <button className={btnGhost} onClick={() => setShowTeam(true)}>
                <Icon name="users" /> Team
              </button>
              <button className={btnGhost} onClick={() => setShowKpi(true)}>
                <Icon name="chart" /> KPI
              </button>
              <button className={btnGhost} onClick={exportXlsx}>
                <Icon name="download" /> Excel
              </button>
            </>
          ) : (
            <button className={btnGhost} onClick={() => setShowMyWork(true)}>
              <Icon name="user" /> My Work
            </button>
          )}
          <button className={`${btnGhost} text-emerald-400 hover:text-emerald-300`} onClick={() => downloadKPIReport(visible)} title="Download KPI Excel for filtered data">
            <Icon name="chart" /> KPI Report
          </button>
          <button className={`${btnGhost} text-red-400 hover:text-red-300`} onClick={() => downloadFullSystemBackup(rows)} title="Backup Entire System (JSON + CSV)">
            <Icon name="shield" /> Backup All
          </button>
          </div>
          <div className="mt-5 text-center text-[10px] text-zinc-500/40">{APP_CREDIT}</div>
        </footer>
      {selected ? <Drawer row={selected} actor={actor} team={team} channels={channels} onClose={() => setSelectedId(null)} onPatch={patchRow} onRun={runAction} onDelete={(r) => setDeleteFor(r.id)} /> : null}
      
        {showEmpReport ? (
          <EmployeeReportModal 
            rows={rows} 
            range={range} 
            team={team} 
            onClose={() => setShowEmpReport(false)} 
            onOpenContent={(r) => { setShowEmpReport(false); setSelectedId(r.id); }}
          />
        ) : null}

        
        {showBackup ? <BackupModal onClose={() => setShowBackup(false)} /> : null}

        {bulkOpen ? <BulkScheduleModal onClose={() => setBulkOpen(false)} team={team} channels={channels} onAdd={createContent} /> : null}
      {showNew ? <NewContentModal channels={channels} team={team} defaultDate={range.start} onClose={() => setShowNew(false)} onCreate={createContent} /> : null}
            {showAuthority ? (
        <ModalShell onClose={() => setShowAuthority(false)} title="কর্তৃপক্ষ">
          <div className="flex flex-col gap-3 p-4">
            <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); setBulkOpen(true); }}>
                <Icon name="calendar" /> Bulk Schedule Entry
              </button>
              <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); setShowEmpReport(true); }}>
                <Icon name="chart" /> Report
              </button>
              <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); setShowBackup(true); }}>
                <Icon name="download" /> Backup
              </button>
              <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); setShowTeam(true); }}>
              <Icon name="users" /> Team & permissions
            </button>
            <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); setShowAddChannel(true); }}>
              <Icon name="plus" /> Add channel
            </button>
            <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); downloadKPIReport(visible); }}>
              <Icon name="chart" /> KPI report
            </button>
            <button className={btnGhost + " justify-start"} onClick={() => { setShowAuthority(false); exportXlsx(); }}>
              <Icon name="download" /> Excel export
            </button>
          </div>
        </ModalShell>
      ) : null}
      {showAddChannel ? <AddChannelModal existing={channels} onClose={() => setShowAddChannel(false)} onAdd={addChannel} /> : null}
      {showTeam ? <TeamModal team={team} actor={actor} orgName={org ? org.name : ''} onClose={() => setShowTeam(false)} onAdd={addMember} onUpdate={updateMember} onRemove={removeMember} /> : null}
            
        {showMyWork && actor ? (
          <MyWorkModal 
            rows={rows} 
            range={range} 
            rangeLabel={formatRangeLabel(range)} 
            actor={actor} 
            onClose={() => setShowMyWork(false)} 
          />
        ) : null}

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
        <p className="mt-6 text-center text-[10px] text-zinc-600/50">{APP_CREDIT}</p>
      </FullScreenCard>
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
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
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
                className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-2 text-left transition last:border-0 hover:bg-white/[0.05] ${n.read ? '' : 'bg-sky-500/[0.06]'}`}
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
