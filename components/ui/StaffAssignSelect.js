'use client';

import React from 'react';
import { can, FIELD_PERM } from '../../lib/core';
import { PersonName } from './Shared';

export function StaffAssignSelect({ value, names, placeholder, onChange, team }) {
  const needsExtra = value && !names.includes(value);

  const stop = (e) => e.stopPropagation();

  const labelOf = (n) => { const m = (team || []).find((x) => x.full_name === n); return (m && m.nickname) || n; };

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={stop}
      onMouseDown={stop}
      onKeyDown={stop}
      className="text-[11px] rounded-md border border-white/10 bg-transparent px-1.5 py-0.5 text-zinc-300 outline-none w-full max-w-[150px] truncate transition focus:border-white/20 focus:bg-white/[0.03]"
    >
      <option value="" className="bg-[#121215]">{value ? '— Unassigned —' : placeholder}</option>
      {needsExtra ? <option value={value} className="bg-[#121215]">{labelOf(value)}</option> : null}
      {names.map((n) => (
        <option key={n} value={n} className="bg-[#121215]">
          {labelOf(n)}
        </option>
      ))}
    </select>
  );
}

export function StaffCell({ r, team, actor, patchRow, notify, layout = 'stack' }) {
  const actorCan = actor && actor.active !== false;

  const writers = team.filter((t) => t.role_research_script_writer || t.role === 'owner' || t.role === 'manager').map((m) => m.full_name);
  const presenters = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const editors = team.filter((t) => t.role_video_editor || t.role === 'owner' || t.role === 'manager').map((m) => m.full_name);

  const renderLine = (field, label, names, colLabel = null) => {
    const isEditable = actorCan && can(actor, FIELD_PERM[field]);
    const val = r[field];

    let control = null;
    if (isEditable) {
      control = (
        <StaffAssignSelect
          value={val}
          names={names}
          placeholder="+ Assign"
          onChange={async (v) => { const ok = await patchRow(r.id, { [field]: v }); if (ok && notify) notify(v ? `${label.replace(/:$/, '')} → ${v}` : `${label.replace(/:$/, '')} cleared`, 'success'); }}
          team={team}
        />
      );
    } else {
      if (val) {
        control = <PersonName name={val} team={team} hideDesignation />;
      } else if (colLabel) {
        control = <span className="text-[12px] italic text-zinc-600">Not assigned</span>;
      }
    }

    if (!control) return null;

    if (colLabel) {
      return (
        <div key={field} className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{colLabel}</div>
          {control}
        </div>
      );
    }

    return (
      <div key={field} className="flex items-center gap-1.5">
        <span className="text-zinc-500 w-[110px] shrink-0">{label}</span>
        {control}
      </div>
    );
  };

  if (layout === 'columns') {
    return (
      <div className="flex gap-2.5">
        {renderLine('writer', 'Script Writer:', writers, 'SCRIPT WRITER')}
        {renderLine('presenter_name', 'Presenter:', presenters, 'PRESENTER')}
        {r.content_type === 'LIVE' ? null : renderLine('video_editor', 'Video Editor:', editors, 'VIDEO EDITOR')}
      </div>
    );
  }

  const lineWriter = renderLine('writer', 'Script Writer:', writers);
  const linePresenter = renderLine('presenter_name', 'Presenter:', presenters);
  const lineEditor = renderLine('video_editor', 'Video Editor:', editors);

  if (!lineWriter && !linePresenter && !lineEditor) {
    return <span className="text-zinc-600 italic">Unassigned</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {lineWriter}
      {linePresenter}
      {lineEditor}
    </div>
  );
}