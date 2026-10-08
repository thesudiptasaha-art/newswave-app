'use client';

import React from 'react';
import { can, FIELD_PERM } from '../../lib/core';
import { PersonName } from './Shared';

export function StaffAssignSelect({ value, names, placeholder, onChange }) {
  const needsExtra = value && !names.includes(value);

  const stop = (e) => e.stopPropagation();

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
      {needsExtra ? <option value={value} className="bg-[#121215]">{value}</option> : null}
      {names.map((n) => (
        <option key={n} value={n} className="bg-[#121215]">
          {n}
        </option>
      ))}
    </select>
  );
}

export function StaffCell({ r, team, actor, patchRow }) {
  const actorCan = actor && actor.active !== false;

  const writers = team.filter((t) => t.can_write || t.role === 'owner' || t.role === 'manager').map((m) => m.full_name);
  const presenters = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const editors = team.filter((t) => t.can_edit_video || t.role === 'owner' || t.role === 'manager').map((m) => m.full_name);

  const renderLine = (field, label, names) => {
    const isEditable = actorCan && can(actor, FIELD_PERM[field]);
    const val = r[field];

    if (isEditable) {
      return (
        <div key={field} className="flex items-center gap-1.5">
          <span className="text-zinc-500 w-[110px] shrink-0">{label}</span>
          <StaffAssignSelect
            value={val}
            names={names}
            placeholder="+ Assign"
            onChange={(v) => patchRow(r.id, { [field]: v })}
          />
        </div>
      );
    } else {
      if (!val) return null;
      return (
        <div key={field} className="flex items-center gap-1.5">
          <span className="text-zinc-500 w-[110px] shrink-0">{label}</span>
          <PersonName name={val} team={team} hideDesignation />
        </div>
      );
    }
  };

  const lineWriter = renderLine('writer', 'Research & Script:', writers);
  const linePresenter = renderLine('presenter_name', 'Presenter:', presenters);
  const lineEditor = renderLine('video_editor', 'Video Edit:', editors);

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