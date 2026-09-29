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

const EDITORS = ['Maya Chen', 'Daniel Okoye', 'Priya Nair', 'Lucas Meyer'];

const PIPELINE = [
  'Ready for Shoot',
  'Shooting',
  'Assign Editor',
  'Editing',
  'Video Review',
  'Published',
];

const STATUS_STYLES = {
  'Ready for Shoot':
    'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  Shooting: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Assign Editor':
    'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Editing: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  'Video Review':
    'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
  Published:
    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

const STATUS_DOTS = {
  'Ready for Shoot': 'bg-sky-400',
  Shooting: 'bg-amber-400',
  'Assign Editor': 'bg-violet-400',
  Editing: 'bg-indigo-300',
  'Video Review': 'bg-fuchsia-400',
  Published: 'bg-emerald-400',
};

const ACTIONS = {
  'Ready for Shoot': { label: 'Start Shoot', next: 'Shooting' },
  Shooting: { label: 'Wrap Shoot', next: 'Assign Editor' },
  'Assign Editor': { label: 'Assign & Edit', next: 'Editing' },
  Editing: { label: 'Send to Review', next: 'Video Review' },
  'Video Review': { label: 'Publish', next: 'Published' },
  Published: { label: 'Published', next: null },
};

const TABS = ['Overview', 'Script', 'Assets & Shorts'];

/* -------------------------------------------------------------------------- */
/*  Demo data (used only when Supabase env vars are not configured)           */
/* -------------------------------------------------------------------------- */

function buildDemoRows() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const stamp = `${y}${m}${day}`;
  const at = (h, min) => new Date(y, d.getMonth(), d.getDate(), h, min).toISOString();

  const base = [
    {
      hour: 8,
      min: 30,
      slug: 'Metro Line Extension Opens',
      writer: 'Amelia Brooks',
      editor: 'Maya Chen',
      status: 'Published',
      channel: 'Main Channel',
      script:
        'Good morning. The long-awaited Metro Line extension opened to commuters today, cutting cross-town travel time by nearly a third. City officials cut the ribbon at dawn, and the first trains were full within minutes.\n\nRiders told us the new stations feel calmer, cleaner, and far more accessible than the old network. Transit planners say the next phase, expected within two years, will connect the airport corridor.\n\nWe will keep tracking ridership numbers through the week. For NewsroomOps, I am reporting live from the central platform.',
    },
    {
      hour: 9,
      min: 15,
      slug: 'Heatwave Advisory Issued',
      writer: 'Jonas Rivera',
      editor: 'Daniel Okoye',
      status: 'Video Review',
      channel: 'Main Channel',
      script:
        'A heatwave advisory is now in effect for the entire region. Forecasters expect temperatures to climb well above seasonal averages through Thursday.\n\nHealth officials urge residents to stay hydrated, avoid strenuous outdoor activity during peak afternoon hours, and check on elderly neighbors. Cooling centers will open at noon in every district.',
    },
    {
      hour: 10,
      min: 0,
      slug: 'Startup Funding Surge',
      writer: 'Amelia Brooks',
      editor: 'Priya Nair',
      status: 'Editing',
      channel: 'Business Desk',
      script:
        'Venture funding for local startups jumped this quarter, driven by a wave of climate and health technology deals. Investors point to lower interest rate expectations and a maturing founder community.\n\nAnalysts caution that valuations remain uneven, but the mood across the ecosystem is the most optimistic in three years.',
    },
    {
      hour: 11,
      min: 30,
      slug: 'School Budget Vote Tonight',
      writer: 'Noor Hassan',
      editor: null,
      status: 'Assign Editor',
      channel: 'Main Channel',
      script:
        'The school board votes tonight on a budget that would fund smaller class sizes and expanded after-school programs. Parents are expected to fill the auditorium.\n\nOpponents argue the plan relies on optimistic revenue projections. The vote begins at seven.',
    },
    {
      hour: 13,
      min: 0,
      slug: 'Harbor Cleanup Volunteers',
      writer: 'Jonas Rivera',
      editor: null,
      status: 'Shooting',
      channel: 'Community',
      script:
        'Hundreds of volunteers gathered along the harbor this weekend to remove tonnes of debris from the shoreline. Organizers say it is the largest turnout in the event’s history.',
    },
    {
      hour: 15,
      min: 45,
      slug: 'Championship Parade Route',
      writer: 'Noor Hassan',
      editor: null,
      status: 'Ready for Shoot',
      channel: 'Sports Desk',
      script: '',
    },
    {
      hour: 17,
      min: 30,
      slug: 'Night Market Returns',
      writer: 'Amelia Brooks',
      editor: null,
      status: 'Ready for Shoot',
      channel: 'Community',
      script:
        'The beloved night market returns this Friday with over one hundred food stalls, live music, and a new artisan quarter. Organizers expect record crowds.',
    },
  ];

  return base.map((b, i) => ({
    id: `demo-${i + 1}`,
    content_uid: `CON-${stamp}-${String(i + 1).padStart(2, '0')}`,
    slug_name: b.slug,
    writer: b.writer,
    video_editor: b.editor,
    status: b.status,
    channel: b.channel,
    script: b.script,
    scheduled_publish_time: at(b.hour, b.min),
    raw_footage_link: '',
    thumbnail_hook: '',
    youtube_shorts_url: '',
    instagram_reel_url: '',
    created_at: at(6, i),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

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

function formatLiveDate(d) {
  if (!d) return '';
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} · ${time}`;
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

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.scheduled_publish_time || a.created_at || 0).getTime();
    const tb = new Date(b.scheduled_publish_time || b.created_at || 0).getTime();
    return ta - tb;
  });
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
/*  Small presentational components                                           */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] ||
    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  const dot = STATUS_DOTS[status] || 'bg-zinc-400';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight backdrop-blur-md ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] tracking-tight text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 ease-out hover:border-white/[0.14] focus:border-sky-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-sky-400/10';

function RefreshIcon({ spinning }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform duration-200 ease-out ${
        open ? 'rotate-180' : ''
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

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
        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium tracking-tight text-zinc-200 transition-all duration-200 ease-out hover:bg-white/[0.08] active:scale-[0.97]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        {value}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] tracking-tight transition-colors duration-200 ease-out ${
                opt === value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
              }`}
            >
              {opt}
              {opt === value && (
                <svg
                  className="h-3 w-3 text-sky-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
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
  const [now, setNow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Assets & Shorts drafts
  const [footageDraft, setFootageDraft] = useState('');
  const [hookDraft, setHookDraft] = useState('');
  const [ytDraft, setYtDraft] = useState('');
  const [igDraft, setIgDraft] = useState('');
  const [savingAssets, setSavingAssets] = useState(false);
  const [savingShorts, setSavingShorts] = useState(false);

  const toastTimer = useRef(null);
  const isDemo = !supabase;

  /* ---- toast ------------------------------------------------------------ */
  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  /* ---- live clock ------------------------------------------------------- */
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ---- data ------------------------------------------------------------- */
  const fetchRows = useCallback(
    async (silent) => {
      if (!supabase) {
        setRows((prev) => (prev.length ? prev : sortRows(buildDemoRows())));
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!silent) setRefreshing(true);
      const { data, error: err } = await supabase
        .from('contents')
        .select('*')
        .order('scheduled_publish_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (err) {
        setError(err.message || 'Failed to load rundown.');
      } else {
        setError('');
        setRows(sortRows(data || []));
      }
      setLoading(false);
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    fetchRows(true);
  }, [fetchRows]);

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
  const channels = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.channel) set.add(r.channel);
    });
    return Array.from(set).sort();
  }, [rows]);

  const visibleRows = useMemo(
    () =>
      channel === 'All Channels'
        ? rows
        : rows.filter((r) => r.channel === channel),
    [rows, channel]
  );

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

  /* ---- sync drafts when drawer target changes --------------------------- */
  useEffect(() => {
    if (selected) {
      setFootageDraft(selected.raw_footage_link || '');
      setHookDraft(selected.thumbnail_hook || '');
      setYtDraft(selected.youtube_shorts_url || '');
      setIgDraft(selected.instagram_reel_url || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ---- escape closes drawer -------------------------------------------- */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const openDrawer = useCallback((row, initialTab) => {
    setSelectedId(row.id);
    setTab(initialTab || 'Overview');
    setDrawerOpen(true);
  }, []);

  const advanceStatus = useCallback(
    async (row) => {
      const action = ACTIONS[row.status];
      if (!action || !action.next) return;

      if (row.status === 'Assign Editor' && !row.video_editor) {
        openDrawer(row, 'Overview');
        showToast('Choose a video editor to continue.');
        return;
      }

      setBusyId(row.id);
      await patchRow(
        row.id,
        { status: action.next },
        `${row.content_uid} → ${action.next}`
      );
      setBusyId(null);
    },
    [openDrawer, patchRow, showToast]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRows(false);
    showToast(isDemo ? 'Demo data refreshed.' : 'Rundown refreshed.');
  }, [fetchRows, isDemo, showToast]);

  const assignEditor = useCallback(
    async (editor) => {
      if (!selected) return;
      const value = editor || null;
      await patchRow(
        selected.id,
        { video_editor: value },
        value ? `Editor set to ${value}` : 'Editor cleared'
      );
    },
    [patchRow, selected]
  );

  const saveAssets = useCallback(async () => {
    if (!selected) return;
    setSavingAssets(true);
    await patchRow(
      selected.id,
      { raw_footage_link: footageDraft.trim() },
      'Footage link saved'
    );
    setSavingAssets(false);
  }, [footageDraft, patchRow, selected]);

  const saveShorts = useCallback(async () => {
    if (!selected) return;
    setSavingShorts(true);
    await patchRow(
      selected.id,
      {
        thumbnail_hook: hookDraft.trim(),
        youtube_shorts_url: ytDraft.trim(),
        instagram_reel_url: igDraft.trim(),
      },
      'Shorts tracker saved'
    );
    setSavingShorts(false);
  }, [hookDraft, igDraft, patchRow, selected, ytDraft]);

  const handleCopy = useCallback(
    async (text, label) => {
      const ok = await copyText(text);
      showToast(ok ? `${label} copied` : 'Copy failed — select and copy manually.');
    },
    [showToast]
  );

  /* ---- drawer-derived values ------------------------------------------- */
  const assetName = selected
    ? `${selected.content_uid}_${slugify(selected.slug_name)}`
    : '';
  const scriptText = selected ? selected.script || '' : '';
  const words = countWords(scriptText);
  const readMinutes = words === 0 ? 0 : Math.max(1, Math.round(words / 150));
  const readSeconds = Math.round((words / 150) * 60);
  const pipelineIndex = selected ? PIPELINE.indexOf(selected.status) : -1;

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

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
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
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

          <div className="flex items-center gap-2">
            <ChannelSelector
              channels={channels}
              value={channel}
              onChange={setChannel}
            />
            <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium tracking-tight text-zinc-300 md:inline-flex">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{now ? formatLiveDate(now) : '—'}</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh data"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium tracking-tight text-zinc-200 transition-all duration-200 ease-out hover:bg-white/[0.09] active:scale-[0.96] disabled:opacity-60"
            >
              <RefreshIcon spinning={refreshing} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------ MAIN ----------------------------- */}
      <main className="relative mx-auto max-w-[1280px] px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {isDemo ? 'Demo mode · Supabase not configured' : 'Live · Supabase realtime'}
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter text-white sm:text-5xl">
              Daily Rundown
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed tracking-tight text-zinc-400">
              Every story on today’s slate, from first shoot to publish, in one
              place.
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

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] tracking-tight text-red-300">
            <span className="mt-0.5 font-semibold">Couldn’t load the rundown.</span>
            <span className="text-red-300/80">{error}</span>
          </div>
        )}

        {/* ---------------------------- TABLE ---------------------------- */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121215]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {[
                    'Scheduled',
                    'Content UID',
                    'Slug',
                    'Writer',
                    'Video Editor',
                    'Status',
                    'Action',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${
                        i === 6 ? 'text-right' : ''
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
                      {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                        <td key={c} className="px-5 py-4">
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
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <div className="text-[15px] font-medium tracking-tight text-zinc-300">
                        Nothing on the rundown
                      </div>
                      <div className="mt-1 text-[13px] tracking-tight text-zinc-500">
                        {channel === 'All Channels'
                          ? 'Add rows to the contents table and they will appear here in real time.'
                          : `No stories are scheduled for ${channel}.`}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  visibleRows.map((row, index) => {
                    const action = ACTIONS[row.status] || {
                      label: 'Update',
                      next: null,
                    };
                    const done = !action.next;
                    const isBusy = String(busyId) === String(row.id);
                    const isActive =
                      drawerOpen && String(selectedId) === String(row.id);

                    return (
                      <tr
                        key={row.id}
                        style={{ animationDelay: `${index * 40}ms` }}
                        className={`row-in group border-b border-white/[0.05] transition-colors duration-200 ease-out last:border-b-0 hover:bg-white/[0.025] ${
                          isActive ? 'bg-white/[0.035]' : ''
                        }`}
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-[13px] font-medium tabular-nums tracking-tight text-zinc-300">
                          {formatTime(row.scheduled_publish_time)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[11.5px] tracking-normal text-zinc-400">
                            {row.content_uid}
                          </span>
                        </td>
                        <td className="max-w-[300px] px-5 py-4">
                          <button
                            type="button"
                            onClick={() => openDrawer(row)}
                            className="block max-w-full truncate text-left text-[14px] font-medium tracking-tight text-white transition-colors duration-200 ease-out hover:text-sky-400"
                            title={row.slug_name}
                          >
                            {row.slug_name}
                          </button>
                          {row.channel && (
                            <div className="mt-0.5 text-[11px] tracking-tight text-zinc-600">
                              {row.channel}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[13px] tracking-tight text-zinc-300">
                          {row.writer || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[13px] tracking-tight">
                          {row.video_editor ? (
                            <span className="text-zinc-300">{row.video_editor}</span>
                          ) : (
                            <span className="text-zinc-600">Unassigned</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={done || isBusy}
                            onClick={() => advanceStatus(row)}
                            className={`inline-flex min-w-[128px] items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-tight transition-all duration-200 ease-out ${
                              done
                                ? 'cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'bg-white text-black shadow-lg shadow-white/5 hover:scale-[1.03] hover:bg-zinc-200 active:scale-[0.96] disabled:opacity-60'
                            }`}
                          >
                            {done && (
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                            {isBusy ? 'Updating…' : action.label}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] tracking-tight text-zinc-600">
          Pipeline · Ready for Shoot → Shooting → Assign Editor → Editing →
          Video Review → Published
        </p>
      </main>

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
          className={`absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#0c0c0e]/95 shadow-2xl shadow-black backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[460px] ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selected && (
            <>
              {/* sticky header */}
              <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-black/60 px-6 pb-0 pt-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-block rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[11px] tracking-normal text-zinc-400">
                      {selected.content_uid}
                    </span>
                    <h2 className="mt-2.5 text-xl font-semibold leading-tight tracking-tight text-white">
                      {selected.slug_name}
                    </h2>
                    <div className="mt-2.5">
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close workspace"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[13px] text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.12] hover:text-white active:scale-90"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5 flex gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`relative rounded-t-lg px-3.5 pb-3 pt-1 text-[13px] font-medium tracking-tight transition-colors duration-200 ease-out ${
                        tab === t
                          ? 'text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t}
                      <span
                        className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-white transition-opacity duration-200 ease-out ${
                          tab === t ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* -------- Overview -------- */}
                {tab === 'Overview' && (
                  <div className="space-y-6">
                    <Field label="Title">
                      <div className="text-[15px] font-medium tracking-tight text-white">
                        {selected.slug_name}
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Writer">
                        <div className="text-[14px] tracking-tight text-zinc-200">
                          {selected.writer || '—'}
                        </div>
                      </Field>
                      <Field label="Scheduled">
                        <div className="text-[14px] tabular-nums tracking-tight text-zinc-200">
                          {formatTime(selected.scheduled_publish_time)}
                        </div>
                      </Field>
                    </div>

                    <Field label="Video Editor">
                      <div className="relative">
                        <select
                          value={selected.video_editor || ''}
                          onChange={(e) => assignEditor(e.target.value)}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="" className="bg-[#0c0c0e]">
                            Unassigned
                          </option>
                          {selected.video_editor &&
                            !EDITORS.includes(selected.video_editor) && (
                              <option
                                value={selected.video_editor}
                                className="bg-[#0c0c0e]"
                              >
                                {selected.video_editor}
                              </option>
                            )}
                          {EDITORS.map((ed) => (
                            <option key={ed} value={ed} className="bg-[#0c0c0e]">
                              {ed}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                          <ChevronIcon open={false} />
                        </div>
                      </div>
                    </Field>

                    <Field label="Current Status">
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <StatusBadge status={selected.status} />
                          <span className="text-[11px] tabular-nums tracking-tight text-zinc-500">
                            Step {pipelineIndex + 1} of {PIPELINE.length}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {PIPELINE.map((step, i) => (
                            <div
                              key={step}
                              title={step}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ease-out ${
                                i <= pipelineIndex
                                  ? 'bg-white'
                                  : 'bg-white/[0.1]'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] tracking-tight text-zinc-500">
                          <span>{PIPELINE[0]}</span>
                          <span>{PIPELINE[PIPELINE.length - 1]}</span>
                        </div>
                      </div>
                    </Field>

                    {ACTIONS[selected.status] && ACTIONS[selected.status].next && (
                      <button
                        type="button"
                        onClick={() => advanceStatus(selected)}
                        disabled={String(busyId) === String(selected.id)}
                        className="w-full rounded-full bg-white px-5 py-3 text-[13px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60"
                      >
                        {ACTIONS[selected.status].label} →{' '}
                        {ACTIONS[selected.status].next}
                      </button>
                    )}
                  </div>
                )}

                {/* -------- Script -------- */}
                {tab === 'Script' && (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tabular-nums tracking-tight text-zinc-300">
                        {words} {words === 1 ? 'word' : 'words'}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tabular-nums tracking-tight text-zinc-300">
                        {words === 0
                          ? 'No runtime'
                          : readSeconds < 60
                          ? `~${readSeconds}s on air`
                          : `~${readMinutes} min on air`}
                      </span>
                      {scriptText && (
                        <button
                          type="button"
                          onClick={() => handleCopy(scriptText, 'Script')}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.1] active:scale-95"
                        >
                          <CopyIcon />
                          Copy
                        </button>
                      )}
                    </div>

                    {scriptText ? (
                      <article className="space-y-5 text-[16px] leading-[1.75] tracking-tight text-zinc-200">
                        {scriptText
                          .split(/\n{2,}/)
                          .filter((p) => p.trim().length > 0)
                          .map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                      </article>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-14 text-center">
                        <div className="text-[14px] font-medium tracking-tight text-zinc-300">
                          No script yet
                        </div>
                        <div className="mt-1 text-[12px] tracking-tight text-zinc-500">
                          {selected.writer
                            ? `${selected.writer} hasn’t filed copy for this slug.`
                            : 'No writer has filed copy for this slug.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* -------- Assets & Shorts -------- */}
                {tab === 'Assets & Shorts' && (
                  <div className="space-y-8">
                    <section className="space-y-5">
                      <div className="text-[13px] font-semibold tracking-tight text-white">
                        Asset Naming
                      </div>

                      <Field label="Copy-ready asset name">
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 pl-3.5">
                          <code className="min-w-0 flex-1 truncate font-mono text-[12px] tracking-normal text-zinc-200">
                            {assetName}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(assetName, 'Asset name')}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-95"
                          >
                            <CopyIcon />
                            Copy
                          </button>
                        </div>
                      </Field>

                      <Field label="Raw footage drive link">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={footageDraft}
                            onChange={(e) => setFootageDraft(e.target.value)}
                            placeholder="https://drive.google.com/…"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={saveAssets}
                            disabled={
                              savingAssets ||
                              footageDraft.trim() ===
                                (selected.raw_footage_link || '')
                            }
                            className="shrink-0 rounded-xl bg-white px-4 text-[12px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingAssets ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                        {selected.raw_footage_link && (
                          <a
                            href={selected.raw_footage_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-[12px] tracking-tight text-sky-400 transition-colors duration-200 ease-out hover:text-sky-300"
                          >
                            Open footage ↗
                          </a>
                        )}
                      </Field>
                    </section>

                    <div className="h-px bg-white/[0.08]" />

                    <section className="space-y-5">
                      <div>
                        <div className="text-[13px] font-semibold tracking-tight text-white">
                          Derivative Shorts &amp; Reels
                        </div>
                        <div className="mt-1 text-[12px] tracking-tight text-zinc-500">
                          Track the vertical cut-downs made from this story.
                        </div>
                      </div>

                      <Field label="Thumbnail hook">
                        <input
                          type="text"
                          value={hookDraft}
                          onChange={(e) => setHookDraft(e.target.value)}
                          placeholder="e.g. The city that never sleeps just got a new line"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="YouTube Shorts URL">
                        <input
                          type="url"
                          value={ytDraft}
                          onChange={(e) => setYtDraft(e.target.value)}
                          placeholder="https://youtube.com/shorts/…"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Instagram Reel URL">
                        <input
                          type="url"
                          value={igDraft}
                          onChange={(e) => setIgDraft(e.target.value)}
                          placeholder="https://instagram.com/reel/…"
                          className={inputClass}
                        />
                      </Field>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={saveShorts}
                          disabled={savingShorts}
                          className="rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-[0.97] disabled:opacity-50"
                        >
                          {savingShorts ? 'Saving…' : 'Save shorts tracker'}
                        </button>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${
                              selected.youtube_shorts_url
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'border border-white/[0.08] bg-white/[0.03] text-zinc-500'
                            }`}
                          >
                            YT
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${
                              selected.instagram_reel_url
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'border border-white/[0.08] bg-white/[0.03] text-zinc-500'
                            }`}
                          >
                            IG
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
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
