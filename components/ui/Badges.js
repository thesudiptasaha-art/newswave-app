import React from 'react';
import { STATUS_META, ROLE_LABEL } from '../../utils/constants';

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset backdrop-blur-md ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.live ? 'live-dot' : ''}`} />
      {status}
    </span>
  );
}

export function TypeBadge({ type }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300">
      {type}
    </span>
  );
}

export function RoleBadge({ role }) {
  const tone =
    role === 'owner'
      ? 'text-amber-300 bg-amber-500/15 ring-amber-400/25'
      : role === 'manager'
      ? 'text-sky-300 bg-sky-500/15 ring-sky-400/25'
      : 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${tone}`}>{ROLE_LABEL[role] || role}</span>;
}

export function DesignationPill({ designation }) {
  if (!designation) return null;
  return (
    <span className="inline-flex max-w-[160px] items-center truncate whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400 backdrop-blur-md">
      {designation}
    </span>
  );
}
