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

const TABLE_HEADERS = [
  'Scheduled',
  'Content UID',
  'Slug',
  'Writer',
  'Presenter',
  'Video Editor',
  'Status',
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

function formatClock(d) {
  if (!d) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/* -------------------------------------------------------------------------- */
/*  Demo data (used only when Supabase env vars are not configured)           */
/* -------------------------------------------------------------------------- */

function buildDemoRows() {
  const today = startOfDay(new Date());
  const pad = (n) => String(n).padStart(2, '0');

  const plan = [
    {
      offset: -1,
      stories: [
        {
          h: 9,
          m: 0,
          slug: 'Budget Session Wrap-Up',
          writer: 'Amelia Brooks',
          presenter: 'Sadia Rahman',
          editor: 'Maya Chen',
          status: 'Published',
          channel: 'The Wave 24',
          script:
            'Parliament wrapped up its budget session late last night after a marathon debate. Lawmakers approved the spending plan with amendments on education and transport.',
        },
        {
          h: 12,
          m: 30,
          slug: 'Stock Market Closing Bell',
          writer: 'Jonas Rivera',
          presenter: 'Tanvir Ahmed',
          editor: 'Daniel Okoye',
          status: 'Published',
          channel: 'The Wave Money',
          script:
            'Markets closed higher on strong banking results, with the main index gaining over one percent. Analysts expect the momentum to hold through the week.',
        },
        {
          h: 16,
          m: 15,
          slug: 'Derby Preview Show',
          writer: 'Noor Hassan',
          presenter: 'Imran Hossain',
          editor: 'Priya Nair',
          status: 'Published',
          channel: 'The Wave Sports',
          script:
            'Ahead of the weekend derby, both camps are confident. We break down the lineups, the injuries, and the tactical battles that will decide the match.',
        },
        {
          h: 19,
          m: 0,
          slug: 'Evening Prayer Reflections',
          writer: 'Amelia Brooks',
          presenter: 'Nusrat Jahan',
          editor: 'Lucas Meyer',
          status: 'Published',
          channel: 'The Wave Faith',
          script: '',
        },
      ],
    },
    {
      offset: 0,
      stories: [
        {
          h: 8,
          m: 30,
          slug: 'Metro Line Extension Opens',
          writer: 'Amelia Brooks',
          presenter: 'Sadia Rahman',
          editor: 'Maya Chen',
          status: 'Published',
          channel: 'The Wave 24',
          script:
            'Good morning. The long-awaited Metro Line extension opened to commuters today, cutting cross-town travel time by nearly a third. City officials cut the ribbon at dawn, and the first trains were full within minutes.\n\nRiders told us the new stations feel calmer, cleaner, and far more accessible than the old network. Transit planners say the next phase, expected within two years, will connect the airport corridor.\n\nWe will keep tracking ridership numbers through the week. Reporting live from the central platform.',
        },
        {
          h: 9,
          m: 15,
          slug: 'Global Climate Summit Opens',
          writer: 'Jonas Rivera',
          presenter: 'Tanvir Ahmed',
          editor: 'Daniel Okoye',
          status: 'Video Review',
          channel: 'The Wave World',
          script:
            'World leaders arrived in the summit city today for two weeks of talks on emissions targets and climate finance. Small island nations are pressing for a binding loss-and-damage fund.\n\nNegotiators say the mood is cautious, with disagreements still open on timelines for phasing out coal.',
        },
        {
          h: 10,
          m: 0,
          slug: 'Startup Funding Surge',
          writer: 'Amelia Brooks',
          presenter: 'Imran Hossain',
          editor: 'Priya Nair',
          status: 'Editing',
          channel: 'The Wave Money',
          script:
            'Venture funding for local startups jumped this quarter, driven by a wave of climate and health technology deals. Investors point to lower interest rate expectations and a maturing founder community.\n\nAnalysts caution that valuations remain uneven, but the mood across the ecosystem is the most optimistic in three years.',
        },
        {
          h: 11,
          m: 30,
          slug: 'School Budget Vote Tonight',
          writer: 'Noor Hassan',
          presenter: 'Sadia Rahman',
          editor: null,
          status: 'Assign Editor',
          channel: 'The Wave 24',
          script:
            'The school board votes tonight on a budget that would fund smaller class sizes and expanded after-school programs. Parents are expected to fill the auditorium.\n\nOpponents argue the plan relies on optimistic revenue projections. The vote begins at seven.',
        },
        {
          h: 13,
          m: 0,
          slug: 'Friday Sermon Highlights',
          writer: 'Jonas Rivera',
          presenter: 'Nusrat Jahan',
          editor: null,
          status: 'Shooting',
          channel: 'The Wave Faith',
          script:
            'Thousands gathered at the central mosque for this week’s sermon, which focused on kindness to neighbours and the responsibilities of community.',
        },
        {
          h: 15,
          m: 45,
          slug: 'Championship Parade Route',
          writer: 'Noor Hassan',
          presenter: 'Imran Hossain',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Sports',
          script: '',
        },
        {
          h: 17,
          m: 30,
          slug: 'Night Market Returns',
          writer: 'Amelia Brooks',
          presenter: 'Nusrat Jahan',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Life',
          script:
            'The beloved night market returns this Friday with over one hundred food stalls, live music, and a new artisan quarter. Organizers expect record crowds.',
        },
        {
          h: 19,
          m: 0,
          slug: 'Fashion Week Red Carpet',
          writer: 'Noor Hassan',
          presenter: 'Tanvir Ahmed',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Glam',
          script: '',
        },
      ],
    },
    {
      offset: 1,
      stories: [
        {
          h: 9,
          m: 0,
          slug: 'Morning Headlines Package',
          writer: 'Jonas Rivera',
          presenter: 'Sadia Rahman',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave 24',
          script: '',
        },
        {
          h: 11,
          m: 0,
          slug: 'Currency Outlook Explainer',
          writer: 'Amelia Brooks',
          presenter: 'Imran Hossain',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Money',
          script:
            'We look at what the latest central bank signals mean for exchange rates, import costs, and household budgets over the coming quarter.',
        },
        {
          h: 14,
          m: 30,
          slug: 'Weekend Wellness Guide',
          writer: 'Noor Hassan',
          presenter: 'Nusrat Jahan',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Life',
          script: '',
        },
        {
          h: 18,
          m: 0,
          slug: 'Cricket Series Final Preview',
          writer: 'Jonas Rivera',
          presenter: 'Tanvir Ahmed',
          editor: null,
          status: 'Ready for Shoot',
          channel: 'The Wave Sports',
          script: '',
        },
      ],
    },
  ];

  const rows = [];
  plan.forEach(({ offset, stories }) => {
    const day = addDays(today, offset);
    const stamp = `${day.getFullYear()}${pad(day.getMonth() + 1)}${pad(
      day.getDate()
    )}`;
    stories.forEach((s, i) => {
      rows.push({
        id: `demo-${offset}-${i + 1}`,
        content_uid: `CON-${stamp}-${pad(i + 1)}`,
        slug_name: s.slug,
        writer: s.writer,
        presenter: s.presenter,
        video_editor: s.editor,
        status: s.status,
        channel: s.channel,
        script: s.script || '',
        scheduled_publish_time: new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          s.h,
          s.m
        ).toISOString(),
        raw_footage_link: '',
        thumbnail_hook: '',
        youtube_shorts_url: '',
        instagram_reel_url: '',
        created_at: new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          6,
          i
        ).toISOString(),
      });
    });
  });
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

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

const pillButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium tracking-tight text-zinc-200 transition-all duration-200 ease-out hover:bg-white/[0.09] active:scale-[0.96]';

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

function ArrowIcon({ dir }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
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
        <span className="max-w-[140px] truncate">{value}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[340px] min-w-[200px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
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
              {opt === value && (
                <svg
                  className="h-3 w-3 shrink-0 text-sky-400"
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
    <div ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${pillButtonClass} ${open ? 'bg-white/[0.1]' : ''}`}
      >
        <CalendarIcon />
        <span className="whitespace-nowrap">
          {formatRangeLabel(range, today)}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute right-4 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-[#0c0c0e]/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-2xl sm:right-6"
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
/*  Add channel modal                                                         */
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
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Add channel"
        className="relative w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#0c0c0e]/95 p-6 shadow-2xl shadow-black backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Add channel
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed tracking-tight text-zinc-500">
              New channels appear in the channel selector straight away.
            </p>
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

        <div className="mt-5">
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
          {err && (
            <div className="mt-2 text-[12px] tracking-tight text-red-400">
              {err}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[12px] font-medium tracking-tight text-zinc-300 transition-all duration-200 ease-out hover:bg-white/[0.09] active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-5 py-2 text-[12px] font-semibold tracking-tight text-black transition-all duration-200 ease-out hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add channel'}
          </button>
        </div>
      </form>
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
  const [addOpen, setAddOpen] = useState(false);
  const [now, setNow] = useState(null);
  const [range, setRange] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Overview / Assets & Shorts drafts
  const [presenterDraft, setPresenterDraft] = useState('');
  const [footageDraft, setFootageDraft] = useState('');
  const [hookDraft, setHookDraft] = useState('');
  const [ytDraft, setYtDraft] = useState('');
  const [igDraft, setIgDraft] = useState('');
  const [savingAssets, setSavingAssets] = useState(false);
  const [savingShorts, setSavingShorts] = useState(false);

  const toastTimer = useRef(null);
  const rangeRef = useRef(null);
  const isDemo = !supabase;

  /* ---- toast ------------------------------------------------------------ */
  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
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
    const today = startOfDay(d);
    setRange({ start: today, end: today });
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => (now ? startOfDay(now) : null), [now]);

  /* ---- custom channels: load ------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomChannels(
            parsed.filter((c) => typeof c === 'string' && c.trim())
          );
        }
      }
    } catch (e) {
      /* storage unavailable — ignore */
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
    const extras = [];
    rows.forEach((r) => {
      if (r.channel && !map.has(String(r.channel).toLowerCase())) {
        map.set(String(r.channel).toLowerCase(), r.channel);
        extras.push(r.channel);
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
      setAddOpen(false);
      showToast(
        supabase && !shared
          ? `${name} added on this device`
          : `${name} added`
      );
    },
    [customChannels, showToast]
  );

  /* ---- data ------------------------------------------------------------- */
  const fetchRows = useCallback(async (silent) => {
    if (!supabase) {
      setRows((prev) => (prev.length ? prev : sortRows(buildDemoRows())));
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
      setRows(sortRows(data || []));
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
  const visibleRows = useMemo(() => {
    const startMs = range ? startOfDay(range.start).getTime() : null;
    const endMs = range ? addDays(startOfDay(range.end), 1).getTime() : null;

    return rows.filter((r) => {
      if (channel !== 'All Channels' && r.channel !== channel) return false;
      if (startMs !== null) {
        const t = new Date(r.scheduled_publish_time).getTime();
        if (!(t >= startMs && t < endMs)) return false;
      }
      return true;
    });
  }, [rows, channel, range]);

  const multiDay = !!range && !sameDay(range.start, range.end);

  const selected = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId]
  );

  const presenterSuggestions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.presenter) set.add(r.presenter);
    });
    return Array.from(set).sort();
  }, [rows]);

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

  const rangeLabel = formatRangeLabel(range, today);

  /* ---- sync drafts when drawer target changes --------------------------- */
  useEffect(() => {
    if (selected) {
      setPresenterDraft(selected.presenter || '');
      setFootageDraft(selected.raw_footage_link || '');
      setHookDraft(selected.thumbnail_hook || '');
      setYtDraft(selected.youtube_shorts_url || '');
      setIgDraft(selected.instagram_reel_url || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ---- escape closes drawer / modal ------------------------------------ */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setAddOpen(false);
      }
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

  const savePresenter = useCallback(async () => {
    if (!selected) return;
    const value = presenterDraft.trim();
    if (value === (selected.presenter || '')) return;
    await patchRow(
      selected.id,
      { presenter: value || null },
      value ? `Presenter set to ${value}` : 'Presenter cleared'
    );
  }, [patchRow, presenterDraft, selected]);

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
        <div className="relative mx-auto flex min-h-14 max-w-[1280px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
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
            <DatePicker range={range} today={today} onChange={setRange} />
            <ChannelSelector
              channels={allChannels}
              value={channel}
              onChange={setChannel}
            />
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add channel"
              className={pillButtonClass}
            >
              <PlusIcon />
              <span className="hidden sm:inline">Add Channel</span>
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
      </header>

      {/* ------------------------------ MAIN ----------------------------- */}
      <main className="relative mx-auto max-w-[1280px] px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-tight text-zinc-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {isDemo
                ? 'Demo mode · Supabase not configured'
                : 'Live · Supabase realtime'}
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

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] tracking-tight text-red-300">
            <span className="mt-0.5 font-semibold">Couldn’t load the rundown.</span>
            <span className="text-red-300/80">{error}</span>
          </div>
        )}

        {/* ---------------------------- TABLE ---------------------------- */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121215]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {TABLE_HEADERS.map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${
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
                        <td key={h} className="px-5 py-4">
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
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="px-5 py-20 text-center"
                    >
                      <div className="text-[15px] font-medium tracking-tight text-zinc-300">
                        Nothing on the rundown
                      </div>
                      <div className="mt-1 text-[13px] tracking-tight text-zinc-500">
                        {channel === 'All Channels'
                          ? `No stories are scheduled for ${rangeLabel}.`
                          : `No stories for ${channel} on ${rangeLabel}.`}
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
                        style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                        className={`row-in group border-b border-white/[0.05] transition-colors duration-200 ease-out last:border-b-0 hover:bg-white/[0.025] ${
                          isActive ? 'bg-white/[0.035]' : ''
                        }`}
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="text-[13px] font-medium tabular-nums tracking-tight text-zinc-300">
                            {formatTime(row.scheduled_publish_time)}
                          </div>
                          {multiDay && (
                            <div className="mt-0.5 text-[11px] tracking-tight text-zinc-600">
                              {formatRowDate(row.scheduled_publish_time)}
                            </div>
                          )}
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
                          {row.presenter ? (
                            <span className="text-zinc-300">{row.presenter}</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
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

      {/* ------------------------- ADD CHANNEL MODAL --------------------- */}
      {addOpen && (
        <AddChannelModal
          existing={allChannels}
          onAdd={addChannel}
          onClose={() => setAddOpen(false)}
        />
      )}

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
                      <Field label="Channel">
                        <div className="text-[14px] tracking-tight text-zinc-200">
                          {selected.channel || '—'}
                        </div>
                      </Field>
                      <Field label="Scheduled">
                        <div className="text-[14px] tabular-nums tracking-tight text-zinc-200">
                          {formatRowDate(selected.scheduled_publish_time)}{' '}
                          · {formatTime(selected.scheduled_publish_time)}
                        </div>
                      </Field>
                    </div>

                    <Field label="Writer">
                      <div className="text-[14px] tracking-tight text-zinc-200">
                        {selected.writer || '—'}
                      </div>
                    </Field>

                    <Field label="Presenter">
                      <input
                        type="text"
                        list="presenter-suggestions"
                        value={presenterDraft}
                        onChange={(e) => setPresenterDraft(e.target.value)}
                        onBlur={savePresenter}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        placeholder="Assign a presenter"
                        className={inputClass}
                      />
                      <datalist id="presenter-suggestions">
                        {presenterSuggestions.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                    </Field>

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
