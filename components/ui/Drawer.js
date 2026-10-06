'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon, LockIcon } from './Icons';
import { copyText } from '../../utils/helpers';
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from './Badges';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, PersonName, Field, SelectBox, BlurInput, ModalShell, FullScreenCard, Toggle, ActionButtons } from './Shared';
import { downloadContentArchive } from '../../services/exportService';
import { uploadFile, generateFileName } from '../../services/storageService';
import { uploadReferenceFile } from '../../services/fileUploadProvider';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  STATUS_META, ALL_STATUSES, isManager, isOwner, can, afterScript, afterShoot, getActions,
  startOfDay, addDays, sameDay, MONTHS, pad, formatRangeLabel, toLocalInput, fromLocalInput,
  formatTime, formatDay, formatStamp, SLUG_MAX, normalizeSlugInput, uid, generateUserUID,
  makeContentUid, asArray, shortsInRange, rowTimeIn, isParked, normalizeRow, normalizeMember,
  FIELD_PERM, TRACKED_FIELDS
} from '../../lib/core';


function CreditSelect({ label, field, skillKey, row, patch, team, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</label>
      <select
        value={row[field] || ''}
        disabled={disabled}
        onChange={(e) => patch({ [field]: e.target.value })}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[13px] text-white transition focus:border-white/[0.15] focus:bg-white/[0.04] focus:outline-none focus:ring-4 focus:ring-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">— Unassigned —</option>
        {team.filter(t => !skillKey || t[skillKey] || t.role === 'owner' || t.role === 'manager').map(m => (
          <option key={m.id} value={m.full_name}>{m.full_name}</option>
        ))}
      </select>
    </div>
  );
}

function OverviewTab({ row, actor, team, channels, patch, actions, onRun }) {
  const activeNames = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const lockMsg = (label) => `You need the “${label}” permission`;
  const okMeta = can(actor, 'can_edit_metadata');
  const okSched = can(actor, 'can_reschedule');
  const okPres = can(actor, 'can_change_presenter');
  const okChan = can(actor, 'can_change_channel');
  const okEditor = can(actor, 'can_assign_editor');
  const [showExtended, setShowExtended] = useState(false);
  const active = !!actor && actor.active !== false;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4">
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
          <CreditSelect label="Idea" field="idea_by" skillKey="can_write" row={row} patch={patch} team={team} disabled={!active} />
          <CreditSelect label="Research & Script" field="writer" skillKey="can_write" row={row} patch={patch} team={team} disabled={!active} />
          <Field label="Presenter" locked={!okPres} lockMessage={lockMsg('Change presenter')}>
            <SelectBox value={row.presenter_name} disabled={!okPres} options={activeNames} onChange={(v) => patch({ presenter_name: v })} placeholder="Unassigned" />
          </Field>
          <CreditSelect label="Producer" field="producer" skillKey="can_produce" row={row} patch={patch} team={team} disabled={!active} />
          <CreditSelect label="Cameraman" field="camera_person" skillKey="can_camera" row={row} patch={patch} team={team} disabled={!active} />
          <CreditSelect label="Video Editor" field="video_editor" skillKey="can_edit_video" row={row} patch={patch} team={team} disabled={!active} />
          <CreditSelect label="Uploader" field="uploader" skillKey="" row={row} patch={patch} team={team} disabled={!active} />
        </div>
        
        <div className="mt-4">
          <button 
            onClick={() => setShowExtended(!showExtended)}
            className="text-[12px] font-medium text-sky-400 hover:text-sky-300 transition"
          >
            {showExtended ? 'Hide Credits' : 'See More Credits'}
          </button>
          
          {showExtended ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-white/[0.06] pt-4">
              <CreditSelect label="Visual Effects" field="vfx" skillKey="can_vfx" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Colorist" field="colorist" skillKey="can_color" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Light Design" field="light_designer" skillKey="can_light" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Sound Record" field="sound_recordist" skillKey="can_sound_record" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Audio Mixing" field="audio_mixer" skillKey="can_audio_mix" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Video Switch" field="video_switcher" skillKey="can_video_switch" row={row} patch={patch} team={team} disabled={!active} />
              <CreditSelect label="Live Audio Mixing" field="live_audio" skillKey="can_live_audio" row={row} patch={patch} team={team} disabled={!active} />
            </div>
          ) : null}
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

function PublisherTab({ row, actor, patch }) {
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
      <Field label="Title" locked={!ok} lockMessage={msg}>
        <BlurInput value={row.title} disabled={!ok} onCommit={(v) => patch({ title: v })} placeholder="Title" />
      </Field>
      <Field label="Thumbnail text" locked={!ok} lockMessage={msg}>
        <BlurInput value={row.thumbnail_text} disabled={!ok} onCommit={(v) => patch({ thumbnail_text: v })} placeholder="Hook on the thumbnail" />
      </Field>
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
  const [format, setFormat] = useState('Short Video');
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
                <div className="flex items-center gap-2">
                  <div className="truncate font-mono text-[11px] text-zinc-500">{shortUid(s, i)}</div>
                  <select
                    value={s.format || 'Short Video'}
                    onChange={(e) => updateShort(s.id, { format: e.target.value })}
                    disabled={!active}
                    className="appearance-none bg-zinc-800 text-[9px] font-bold text-zinc-300 uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer border border-transparent hover:border-zinc-600 focus:outline-none disabled:opacity-50"
                  >
                    {SHORT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
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
          <SelectBox value={format} onChange={setFormat} options={SHORT_FORMATS.map((f) => ({ value: f, label: f }))} disabled={!active} />
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
              patch({ shorts: [...row.shorts, { id: uid(), n: nextShortN, title: title.trim(), thumb_text: thumbText.trim(), platform, format, url: url.trim(), publish_at: fromLocalInput(shortWhen), published: false }] });
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

export function DeleteModal({ row, onClose, onConfirm }) {
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


const SHORT_FORMATS = ["Short Video", "Reel", "Photo Card", "Photo Story", "Post"];
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
    ['metadata', 'Publisher'],
    
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
              <h2 className="truncate text-[24px] font-black tracking-tight text-white">{row.slug_name || row.title || 'Untitled'}</h2>
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
          {tab === 'metadata' ? <PublisherTab row={row} actor={actor} patch={patch} /> : null}
          
        </div>
        <footer className="border-t border-white/[0.08] bg-black/70 px-6 py-4 backdrop-blur-xl">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Next step</div>
          <ActionButtons actions={actions} onRun={(a) => onRun(row, a)} />
          <div className="mt-3 border-t border-white/[0.06] pt-3 flex items-center gap-3">
            
            {(() => {
              const isManagerOrOwner = isManager(actor);
              const isInvolved = actor && [
                row.idea_by, row.writer, row.producer, row.camera_person, row.video_editor, row.uploader,
                row.presenter_name, row.vfx, row.colorist, row.light_designer, row.sound_recordist, row.audio_mixer,
                row.video_switcher, row.live_audio
              ].includes(actor.full_name);
              const canDownload = isManagerOrOwner || isInvolved;
              return canDownload ? (
                <button
                  onClick={() => downloadContentArchive(row)}
                  title="Download Full Archive (PDF + Script + Logs)"
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-[12px] font-medium text-indigo-300 transition hover:bg-indigo-500/20"
                >
                  <Icon name="download" className="h-3.5 w-3.5" /> Archive ZIP
                </button>
              ) : (
                <button
                  disabled
                  title="You must be assigned to this content to download its archive."
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-zinc-500 cursor-not-allowed"
                >
                  <Icon name="download" className="h-3.5 w-3.5" /> Archive ZIP
                </button>
              );
            })()}

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

export { Drawer };
