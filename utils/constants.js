export const DEFAULT_CHANNELS = [
  'The Wave 24',
  'The Wave World',
  'The Wave Money',
  'The Wave Sports',
  'The Wave Faith',
  'The Wave Life',
  'The Wave Glam',
];

export const CONTENT_TYPES = ['EXPLAINER', 'LIVE', 'RECORDED LIVE', 'SOT', 'PACKAGE', 'SHOW'];
export const CONTENT_TYPE_HINT = {
  EXPLAINER: 'Full pipeline',
  LIVE: 'Script approved → done (published)',
  'RECORDED LIVE': 'Full pipeline',
  SOT: 'Full pipeline',
  PACKAGE: 'Script + raw footage → straight to the editor (no shoot)',
  SHOW: 'Full pipeline',
};

export const PLATFORMS = [
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

export const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', general: 'General' };

/* Chip colours follow the phase: grey = script, red = production, golden yellow = video edit, green = ready to publish, blue = published, pale yellow = on hold, black = dropped, teal = scheduled on the platform. */
export const STATUS_META = {
  Draft: { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Script Submitted': { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Ready for Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
  Shooting: { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400', live: true },
  'Assign Editor': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  Editing: { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500', live: true },
  'Video Review': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  'Ready to Publish': { tone: 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25', dot: 'bg-emerald-400' },
  Scheduled: { tone: 'text-teal-300 bg-teal-500/15 ring-teal-400/25', dot: 'bg-teal-400' },
  Published: { tone: 'text-sky-300 bg-sky-500/15 ring-sky-400/25', dot: 'bg-sky-400' },
  'On Hold': { tone: 'text-yellow-200 bg-yellow-400/10 ring-yellow-300/25', dot: 'bg-yellow-300' },
  Dropped: { tone: 'text-zinc-300 bg-zinc-950 ring-zinc-500/50', dot: 'bg-zinc-500' },
  'Re-Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
};
export const ALL_STATUSES = Object.keys(STATUS_META);

export const APP_NAME = 'WaveDesk';
export const APP_CREDIT = 'Programmer, Developer, Architect, Product Manager — Sudipta Shaha';
export const APP_COPYRIGHT = '\u00A9 2026 Sudipta Shaha';
export const APP_CONTACT_EMAIL = 'sudipto.pro.i@gmail.com';
export const SCRIPT_WORDS_PER_MINUTE = 130;
