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
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'web', label: 'Website' },
];

export const PERMISSIONS = [
  { key: 'can_edit_script', label: 'Edit script', hint: 'Write, edit and save scripts' },
  { key: 'can_edit_metadata', label: 'Edit metadata', hint: 'Title, thumbnail text, writer, camera, platforms' },
  { key: 'can_assign_editor', label: 'Assign editor', hint: 'Change or assign the video editor' },
  { key: 'can_reschedule', label: 'Reschedule', hint: 'Change scheduled date & publish time' },
  { key: 'can_change_presenter', label: 'Change presenter', hint: 'Update the presenter assignment' },
  { key: 'can_change_channel', label: 'Change channel', hint: 'Switch channel / platform' },
  { key: 'can_approve_script', label: 'Approve script', hint: 'Approve or send back submitted scripts' },
  { key: 'can_review_video', label: 'Review video', hint: 'Approve edited videos or request revisions' },
];

export const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', general: 'General' };

export const STATUS_META = {
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
export const ALL_STATUSES = Object.keys(STATUS_META);

export const APP_NAME = 'WaveDesk';
export const APP_CREDIT = 'Programmer, Developer, Architect, Product Manager — Sudipta Shaha';
export const SCRIPT_WORDS_PER_MINUTE = 130;
