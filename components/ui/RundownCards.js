'use client';

import React from 'react';
import {
  STATUS_META,
  getActions,
  rowTimeIn,
  addDays,
  sameDay,
  formatTime,
  formatDay,
  shortClipNotes
} from '../../lib/core';
import { LockIcon } from './Icons';
import { StatusBadge, TypeBox } from './Badges';
import { StaffCell } from './StaffAssignSelect';
import { ActionButtons } from './Shared';

export function ShortNote({ r, range }) {
  if (!r || !range) return null;
  const notes = shortClipNotes(r, range.start, addDays(range.end, 1));
  if (!notes) return null;
  return (
    <div className="mt-1 flex flex-col gap-1 text-[11px] text-zinc-500">
      {notes.main ? <div>{notes.main}</div> : null}
      {(notes.shorts || []).map((s) => (
        <div key={s.id} className="flex items-start gap-1.5">
          <span className="short-tag">{s.tag}</span>
          <span>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

export function PhoneCard({ r, range, team, actor, patchRow, notify, onOpen, onRun, onCollapse, channelLabel }) {
  const endEx = addDays(range.end, 1);
  const tIso = rowTimeIn(r, range.start, endEx);
  const t = formatTime(tIso);
  const spaceIdx = t.indexOf(' ');
  const clock = spaceIdx === -1 ? t : t.slice(0, spaceIdx);
  const ampm = spaceIdx === -1 ? '' : t.slice(spaceIdx + 1);
  const isMultiDay = !sameDay(range.start, range.end);

  return (
    <div
      onClick={() => onOpen && onOpen(r.id)}
      className="rd-card relative cursor-pointer overflow-hidden rounded-[20px] border border-white/[0.14] bg-[#121215]"
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${STATUS_META[r.status]?.dot || 'bg-zinc-500'}`} />
      <div className="pl-[22px] pr-4 pt-3.5 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline">
              <span className="text-[22px] font-bold tracking-tight tabular-nums text-sky-400">{clock}</span>
              {ampm ? <span className="ml-1 text-[11px] font-semibold text-zinc-500">{ampm}</span> : null}
            </div>
            {isMultiDay ? <div className="text-[11px] text-zinc-500">{formatDay(tIso)}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            <TypeBox type={r.content_type} />
            {onCollapse ? (
              <button
                type="button"
                aria-label="Collapse"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapse();
                }}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {channelLabel ? (
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">{channelLabel}</div>
        ) : null}

        <div className="flex items-start gap-1.5">
          <div className="break-words uppercase text-[19px] font-extrabold leading-tight tracking-wide text-white">
            {r.slug_name || 'NO SLUG...'}
          </div>
          {r.is_script_locked ? (
            <LockIcon message="Script locked" className="h-4 w-4 shrink-0 text-white mt-0.5" />
          ) : null}
        </div>

        <ShortNote r={r} range={range} />

        <div className="mt-1 border-t border-dashed border-white/[0.14] pt-2.5" onClick={(e) => e.stopPropagation()}>
          <StaffCell layout="columns" r={r} team={team} actor={actor} patchRow={patchRow} notify={notify} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.03] py-2 pl-[22px] pr-3">
        <StatusBadge status={r.status} />
        <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <ActionButtons compact actions={getActions(r, actor).slice(0, 2)} onRun={(a) => onRun && onRun(r, a)} />
        </div>
      </div>
    </div>
  );
}

export function PhoneRow({ r, range, alt, onToggle }) {
  const endEx = addDays(range.end, 1);
  const tIso = rowTimeIn(r, range.start, endEx);
  const t = formatTime(tIso);
  const spaceIdx = t.indexOf(' ');
  const clock = spaceIdx === -1 ? t : t.slice(0, spaceIdx);
  const ampm = spaceIdx === -1 ? '' : t.slice(spaceIdx + 1);

  let n = 0;
  if (r.status !== 'Published' && r.status !== 'Dropped') {
    if (!r.writer) n++;
    if (!r.presenter_name) n++;
    if (r.content_type !== 'LIVE' && !r.video_editor) n++;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onToggle) onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={`relative flex min-h-[56px] items-stretch border-b border-white/[0.14] cursor-pointer ${alt ? 'rd-alt' : ''}`}
    >
      <div className={`w-1.5 shrink-0 ${STATUS_META[r.status]?.dot || 'bg-zinc-500'}`} />
      <div className="w-[58px] shrink-0 flex flex-col justify-center pl-2.5">
        <span className="text-[14px] font-bold tabular-nums text-sky-400 leading-none">{clock}</span>
        {ampm ? <span className="text-[9.5px] font-semibold text-zinc-500 leading-tight mt-0.5">{ampm}</span> : null}
      </div>
      <div className="flex-1 min-w-0 py-1.5 pr-1 flex flex-col justify-center">
        <div className="truncate uppercase text-[14px] font-extrabold tracking-wide text-white">
          {r.slug_name || 'NO SLUG...'}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <TypeBox type={r.content_type} small />
          <StatusBadge status={r.status} />
          {n > 0 ? <span className="text-[10.5px] font-bold text-amber-500">{n} to assign</span> : null}
        </div>
        <ShortNote r={r} range={range} />
      </div>
      <div className="w-[40px] shrink-0 flex items-center justify-center text-zinc-500">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
