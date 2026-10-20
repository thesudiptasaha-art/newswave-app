'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon, LockIcon } from './Icons';
import { copyText, safeHttpUrl } from '../../utils/helpers';
import { scriptStats } from '../../utils/scriptDuration';
import { saveDraft, loadDraft, clearDraft } from '../../utils/scriptDraft';
import { isFeatureEnabled } from '../../utils/features';
import { Teleprompter } from './Teleprompter';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import dynamic from 'next/dynamic';
const ScriptEditor = dynamic(() => import('./ScriptEditor'), { ssr: false });
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from './Badges';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, PersonName, Field, SelectBox, BlurInput, ModalShell, FullScreenCard, Toggle, ActionButtons } from './Shared';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  STATUS_META, ALL_STATUSES, isManager, isOwner, can, afterScript, afterShoot, getActions,
  startOfDay, addDays, sameDay, MONTHS, pad, formatRangeLabel, toLocalInput, fromLocalInput,
  formatTime, formatDay, formatStamp, SLUG_MAX, normalizeSlugInput, uid, generateUserUID,
  makeContentUid, asArray, shortsInRange, rowTimeIn, isParked, normalizeRow, normalizeMember,
  FIELD_PERM, TRACKED_FIELDS
} from '../../lib/core';


function CreditSelect({ label, field, skillKey, row, patch, team, disabled }) {
  const options = team.filter(t => !skillKey || t[skillKey] || t.role === 'owner' || t.role === 'manager');
  const needsExtra = row[field] && !options.some(m => m.full_name === row[field]);
  
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
        {needsExtra ? <option value={row[field]}>{row[field]}</option> : null}
        {options.map(m => (
          <option key={m.id} value={m.full_name}>{m.full_name}</option>
        ))}
      </select>
    </div>
  );
}

function EditorialTab({ row, actor, team, channels, platforms = PLATFORMS, patch, actions, onRun, onAddPlatform }) {
  const activeNames = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const lockMsg = (label) => `You need the “${label}” permission`;
  const okMeta = can(actor, 'can_edit_metadata');
  const okSched = can(actor, 'can_reschedule');
  const heldLock = row.status === 'On Hold' && !isManager(actor);
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
          <Field label="Scheduled publish" locked={!okSched || heldLock} lockMessage={heldLock ? 'Only Managers and the Owner can reschedule held content' : lockMsg('Reschedule')}>
              <input
                type="datetime-local"
                disabled={!okSched || heldLock}
                value={toLocalInput(row.scheduled_publish_time)}
                onChange={(e) => e.target.value && patch({ scheduled_publish_time: fromLocalInput(e.target.value) })}
                className={`${(okSched && !heldLock) ? inputBase : inputLocked} [color-scheme:dark]`}
              />
            </Field>
        </div>
        <Field label="Slug name" locked={!okMeta} lockMessage={lockMsg('Edit metadata')} hint={`${(row.slug_name || '').length}/${SLUG_MAX}`}>
          <BlurInput value={row.slug_name} disabled={!okMeta} maxLength={SLUG_MAX} onCommit={(v) => { const s = normalizeSlugInput(v); if (s) patch({ slug_name: s }); }} placeholder="Slug name" />
        </Field>
        <Field label="Title" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <BlurInput value={row.title} disabled={!okMeta} onCommit={(v) => patch({ title: v })} placeholder="Title" />
        </Field>
        <Field label="Thumbnail text (Hook)" locked={!okMeta} lockMessage={lockMsg('Edit metadata')}>
          <BlurInput value={row.thumbnail_text} disabled={!okMeta} onCommit={(v) => patch({ thumbnail_text: v })} placeholder="Hook on the thumbnail" />
        </Field>
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
          <div className="flex flex-wrap items-center gap-2">
            {(platforms || PLATFORMS).map((p) => {
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
                  {p.label || p.name}
                </button>
              );
            })}
            {onAddPlatform && isManager(actor) ? (
              <button
                type="button"
                onClick={onAddPlatform}
                className="rounded-full border border-dashed border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-[12px] font-medium text-sky-300 transition hover:bg-sky-500/20"
                title="Add a new publish platform"
              >
                + Add platform
              </button>
            ) : null}
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
  const [showPrompter, setShowPrompter] = useState(false);
  const [copied, setCopied] = useState(false);
  const draftKey = `wd-script-draft:${row.id}`;
  const draftsEnabled = isFeatureEnabled('script_drafts');
  const [storedDraft, setStoredDraft] = useState(null);
  const baseScriptRef = useRef(row.script || '');

  useEffect(() => {
    if (!draftsEnabled || !canEdit) return;
    const sd = loadDraft(window.localStorage, draftKey);
    if (sd && sd.text !== (row.script || '')) {
      setStoredDraft(sd);
    } else if (sd && sd.text === (row.script || '')) {
      clearDraft(window.localStorage, draftKey);
    }
  }, [row.script, draftKey, draftsEnabled, canEdit]);

  useEffect(() => {
    if (!editing) baseScriptRef.current = row.script || '';
  }, [row.script, editing]);

  useEffect(() => {
    if (!draftsEnabled || !canEdit || !editing) return;
    const t = setTimeout(() => {
      saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
    }, 1500);
    return () => clearTimeout(t);
  }, [draft, editing, draftKey, draftsEnabled, canEdit]);

  useEffect(() => {
    if (!draftsEnabled || !canEdit || !editing) return;
    const handleBeforeUnload = (e) => {
      if (draft !== (row.script || '')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const handleSaveNow = () => {
      saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
    };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') handleSaveNow(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleSaveNow);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleSaveNow);
    };
  }, [draft, editing, draftKey, draftsEnabled, canEdit, row.script]);

  const timer = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(row.script || '');
  }, [row.script, editing]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  const richEnabled = isFeatureEnabled('rich_editor');
  const text = scriptToPlainText(row.script || '');
    const stats = scriptStats(editing ? draft : row.script);

  const doCopy = async () => {
    if (!text) return;
    const ok = await copyText(scriptToPlainText(row.script || ''));
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
            {stats.words} words · {stats.label} on air
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

      {storedDraft && !editing && canEdit ? (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[13px] text-amber-200">
          <div className="flex items-start gap-2">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Unsaved draft from {new Date(storedDraft.savedAt).toLocaleString()} found.</p>
              {storedDraft.baseScript !== (row.script || '') ? (
                <p className="mt-1 opacity-80">The script was changed by someone else after this draft was started.</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button onClick={() => { setDraft(storedDraft.text); baseScriptRef.current = storedDraft.baseScript; setEditing(true); setStoredDraft(null); }} className={`${btnGhost} !bg-amber-500 !text-amber-950 font-bold !border-transparent hover:!bg-amber-400`}>Restore draft</button>
                <button onClick={() => { clearDraft(window.localStorage, draftKey); setStoredDraft(null); }} className={`${btnGhost} !border-amber-500/20 !text-amber-200 hover:!bg-amber-500/10`}>Discard draft</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {editing ? (
        <div>
          {richEnabled ? (
              <ScriptEditor 
                value={draft}
                onChange={setDraft}
                onBlur={() => {
                  if (draftsEnabled) saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
                }}
                autoFocus 
              />
            ) : (
              <textarea
                onBlur={() => {
                  if (draftsEnabled) saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
                }}
                autoFocus
                value={scriptToPlainText(draft)}
                onChange={(e) => setDraft(e.target.value)}
                rows={18}
                className={`${inputBase} resize-y text-[16px] leading-8`}
                style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
                placeholder="Write the script…"
              />
            )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              className={btnGhost}
              onClick={() => {
                  setDraft(row.script || '');
                  setEditing(false);
                  if (draftsEnabled) { clearDraft(window.localStorage, draftKey); setStoredDraft(null); }
                }}
            >
              Cancel
            </button>
            <button
              className={btnPrimary}
              onClick={async () => {
                if (draft === (row.script || '')) {
                  setEditing(false);
                  if (draftsEnabled) { clearDraft(window.localStorage, draftKey); setStoredDraft(null); }
                  return;
                }
                const ok = await patch({ script: draft });
                setEditing(false);
                if (draftsEnabled) {
                  if (ok) {
                    clearDraft(window.localStorage, draftKey);
                    setStoredDraft(null);
                  } else {
                    const record = { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current };
                    saveDraft(window.localStorage, draftKey, record);
                    setStoredDraft(record);
                  }
                }
              }}
            >
              Save script
            </button>
          </div>
        </div>
      ) : text ? (
        <>
{richEnabled ? (
          <article
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-6 text-[17px] leading-[1.9] text-zinc-200 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_mark]:bg-yellow-400 [&_mark]:text-gray-900 [&_mark]:rounded-sm [&_mark]:px-1 [&_mark]:py-0.5 [&_u]:underline-offset-2"
            style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
            dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(scriptToHtml(row.script)) }}
          />
        ) : (
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
        )}
          {isFeatureEnabled('teleprompter') && text.trim() ? (
            <div className="mt-4">
              <button 
                onClick={() => setShowPrompter(true)}
                className="w-full rounded-xl bg-indigo-500/10 px-4 py-3 text-[14px] font-semibold text-indigo-300 transition hover:bg-indigo-500/20 border border-indigo-500/20 shadow-sm flex justify-center items-center gap-2"
              >
                Script Play
              </button>
            </div>
          ) : null}
          </>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center text-[14px] text-zinc-500">
          No script yet.{canEdit ? ' Click Edit to write one.' : ''}
        </div>
      )}
{!canEdit && !editing ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-zinc-500">
          <LockIcon /> {locked && !mgr ? 'Read-only — this script is locked. Only Managers and the Owner can edit it.' : 'Read-only — you need the “Edit script” permission to make changes.'}
        </p>
      ) : null}
      {showPrompter && text.trim() ? (
          <Teleprompter text={text} onClose={() => setShowPrompter(false)} />
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

function LinkRow({ label, value, disabled, onCommit }) {
  return (
    <Field label={label} locked={disabled} lockMessage="Inactive members cannot edit">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <BlurInput value={value} disabled={disabled} onCommit={onCommit} placeholder="https://…" />
        </div>
        {safeHttpUrl(value) ? (
            <a href={safeHttpUrl(value)} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3`} title="Open link">
              <Icon name="link" />
            </a>
          ) : null}
      </div>
    </Field>
  );
}

function getPublishedLinks(row) {
  if (row.published_links && typeof row.published_links === 'object') {
    return row.published_links;
  }
  if (row.live_video_url && typeof row.live_video_url === 'string') {
    const trimmed = row.live_video_url.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (_) {}
    }
    if (safeHttpUrl(trimmed)) {
      const first = (row.target_platforms && row.target_platforms[0]) || 'youtube';
      return { [first]: trimmed };
    }
  }
  return {};
}

function ProductionTab({ row, actor, patch }) {
  const active = !!actor && actor.active !== false;
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <LinkRow label="Raw footage" value={row.raw_footage_link} disabled={!active} onCommit={(v) => patch({ raw_footage_link: v })} />
        <LinkRow label="Project file" value={row.project_file_url} disabled={!active} onCommit={(v) => patch({ project_file_url: v })} />
        <LinkRow label="Master export" value={row.master_export_url} disabled={!active} onCommit={(v) => patch({ master_export_url: v })} />
      </section>
    </div>
  );
}

function PackagingTab({ row, actor, patch, platforms = PLATFORMS, onAddPlatform }) {
  const active = !!actor && actor.active !== false;
  const ok = can(actor, 'can_edit_metadata');
  const msg = 'You need the “Edit metadata” permission';

  // Short Content Creation Form State
  const [shortPlatforms, setShortPlatforms] = useState(
    row.target_platforms && row.target_platforms.length > 0 ? row.target_platforms : ['youtube', 'facebook']
  );
  const [captionText, setCaptionText] = useState('');
  const [onVideoText, setOnVideoText] = useState('');
  const [shortWhen, setShortWhen] = useState('');
  const [shortUrl, setShortUrl] = useState('');

  const nextShortN = row.shorts.reduce((m, s, i) => Math.max(m, s.n || i + 1), 0) + 1;
  const shortUid = (s, i) => `${row.content_uid || 'CON'}-SHORT${pad(s.n || i + 1)}`;
  const updateShort = (id, p) => patch({ shorts: row.shorts.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  // Published links per platform
  const pubLinks = getPublishedLinks(row);
  const allPlatforms = platforms || PLATFORMS;
  const targetPlatforms = Array.from(new Set([
    ...(row.target_platforms && row.target_platforms.length > 0 ? row.target_platforms : allPlatforms.map((p) => p.id)),
    ...Object.keys(pubLinks),
  ]));

  const onCommitPublishedLink = (platformId, val) => {
    const updated = { ...pubLinks, [platformId]: (val || '').trim() };
    if (!updated[platformId]) delete updated[platformId];
    
    const hasKeys = Object.keys(updated).length > 0;
    const payload = {
      live_video_url: hasKeys ? JSON.stringify(updated) : '',
    };
    if ('published_links' in row) {
      payload.published_links = updated;
    }
    patch(payload);
  };

  const handleAddShort = () => {
    if (!captionText.trim() && !onVideoText.trim()) return;
    const newShort = {
      id: uid(),
      n: nextShortN,
      title: captionText.trim() || onVideoText.trim(),
      caption: captionText.trim(),
      on_video_text: onVideoText.trim(),
      thumb_text: onVideoText.trim(),
      platforms: shortPlatforms.length > 0 ? shortPlatforms : ['youtube'],
      platform: shortPlatforms[0] || 'youtube',
      url: shortUrl.trim(),
      publish_at: fromLocalInput(shortWhen),
      published: false,
    };
    patch({ shorts: [...row.shorts, newShort] });
    setCaptionText('');
    setOnVideoText('');
    setShortWhen('');
    setShortUrl('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Post Caption, SEO & Hashtags */}
      <section className="space-y-4">
        {!ok ? (
          <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <LockIcon message={msg} /> Read-only — {msg.toLowerCase()} to make changes.
          </p>
        ) : (
          <p className="text-[12px] text-zinc-500">Changes save automatically when you click away from a field.</p>
        )}
        <Field label="Post caption / social copy" locked={!ok} lockMessage={msg}>
          <BlurInput multiline rows={4} value={row.post_caption} disabled={!ok} onCommit={(v) => patch({ post_caption: v })} placeholder="Caption that goes out with the post…" />
        </Field>
        <Field label="SEO keywords / tags" locked={!ok} lockMessage={msg} hint="comma separated">
          <BlurInput multiline rows={2} value={row.seo_keywords} disabled={!ok} onCommit={(v) => patch({ seo_keywords: v })} placeholder="budget, fiscal year, economy" />
        </Field>
        <Field label="Hashtags (#)" locked={!ok} lockMessage={msg} hint="# is added for you">
          <BlurInput multiline rows={2} value={row.hashtags} disabled={!ok} onCommit={(v) => patch({ hashtags: normalizeHashtags(v) })} placeholder="#budget #economy" />
        </Field>
      </section>

      {/* 2. Published Link (One for each platform) */}
      <section className="border-t border-white/[0.08] pt-4">
        <div className="mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Published Links</div>
          <p className="text-[12px] text-zinc-500">Published live URLs for each platform where this content is live.</p>
        </div>
        <div className="space-y-3 mt-3">
          {targetPlatforms.map((pId) => {
            const pMeta = allPlatforms.find((p) => p.id === pId) || { id: pId, label: pId };
            const currentUrl = pubLinks[pId] || '';
            return (
              <Field key={pId} label={`${pMeta.label} Published Link`} locked={!active} lockMessage="Inactive members cannot edit">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <BlurInput
                      value={currentUrl}
                      disabled={!active}
                      onCommit={(v) => onCommitPublishedLink(pId, v)}
                      placeholder={`https://${pId}.com/…`}
                    />
                  </div>
                  {safeHttpUrl(currentUrl) ? (
                    <a
                      href={safeHttpUrl(currentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnGhost} !px-3`}
                      title={`Open ${pMeta.label} link`}
                    >
                      <Icon name="link" />
                    </a>
                  ) : null}
                </div>
              </Field>
            );
          })}
        </div>
      </section>

      {/* 3. Short Content (Stripped down: platform toggles, Caption, On Video Text, Date & Time) */}
      <section className="border-t border-white/[0.08] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Short Content ({row.shorts.length})</div>
        </div>

        {/* Existing Short Content Items */}
        <div className="space-y-2">
          {row.shorts.map((s, i) => {
            const itemPlatforms = s.platforms && Array.isArray(s.platforms) && s.platforms.length > 0
              ? s.platforms
              : (s.platform ? [s.platform] : []);

            return (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-zinc-500">{shortUid(s, i)}</span>
                    <div className="flex flex-wrap gap-1">
                      {itemPlatforms.map((pid) => {
                        const pm = allPlatforms.find((p) => p.id === pid);
                        return (
                          <span key={pid} className="rounded-full bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                            {pm?.label || pid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!active}
                      onClick={() => updateShort(s.id, { published: !s.published })}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset disabled:opacity-50 transition ${
                        s.published ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' : 'bg-white/[0.04] text-zinc-400 ring-white/10'
                      }`}
                    >
                      {s.published ? 'Published' : 'Pending'}
                    </button>
                    {safeHttpUrl(s.url) ? (
                      <a href={safeHttpUrl(s.url)} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white" title="Open short URL">
                        <Icon name="link" />
                      </a>
                    ) : null}
                    <button disabled={!active} onClick={() => patch({ shorts: row.shorts.filter((x) => x.id !== s.id) })} className="text-zinc-500 hover:text-red-400 disabled:opacity-40" title="Delete short">
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>

                {s.on_video_text || s.thumb_text ? (
                  <div className="text-[12px] text-amber-300/90 font-medium">
                    <span className="text-zinc-500 text-[11px] font-normal uppercase mr-1">On Video:</span>
                    {s.on_video_text || s.thumb_text}
                  </div>
                ) : null}

                {s.caption || s.title ? (
                  <div className="text-[13px] text-zinc-200 whitespace-pre-wrap">
                    {s.caption || s.title}
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                  <span>{s.publish_at ? `Publish: ${formatStamp(s.publish_at)}` : 'No publish time set'}</span>
                  {s.url ? <span className="truncate max-w-[200px] text-zinc-400">{s.url}</span> : null}
                </div>
              </div>
            );
          })}
          {row.shorts.length === 0 ? <p className="text-[13px] text-zinc-600">No short content yet.</p> : null}
        </div>

        {/* Add Short Content Form */}
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div className="text-[12px] font-semibold text-zinc-300">Add Short Content</div>

          {/* Platform selection toggle similar to main content */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1.5">Target Platforms</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {allPlatforms.map((p) => {
                const on = shortPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!active}
                    onClick={() => {
                      setShortPlatforms((prev) =>
                        prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                      );
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition disabled:cursor-not-allowed ${
                      on
                        ? 'border-sky-400/50 bg-sky-500/15 text-sky-200 font-medium'
                        : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08]'
                    }`}
                  >
                    {p.label || p.name}
                  </button>
                );
              })}
              {onAddPlatform && isManager(actor) ? (
                <button
                  type="button"
                  onClick={onAddPlatform}
                  className="rounded-full border border-dashed border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300 transition hover:bg-sky-500/20"
                  title="Add a new publish platform"
                >
                  + Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">On Video Text</label>
              <input
                className={inputBase}
                placeholder="Text overlay appearing on the video…"
                value={onVideoText}
                disabled={!active}
                onChange={(e) => setOnVideoText(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Caption Text</label>
              <textarea
                rows={2}
                className={`${inputBase} resize-y`}
                placeholder="Short caption / social copy…"
                value={captionText}
                disabled={!active}
                onChange={(e) => setCaptionText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Publish Date & Time</label>
              <input
                type="datetime-local"
                className={`${inputBase} [color-scheme:dark]`}
                value={shortWhen}
                disabled={!active}
                onChange={(e) => setShortWhen(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Published Link (optional)</label>
              <input
                className={inputBase}
                placeholder="https://…"
                value={shortUrl}
                disabled={!active}
                onChange={(e) => setShortUrl(e.target.value)}
              />
            </div>

            <button
              className={`${btnPrimary} sm:col-span-2 mt-1`}
              disabled={!active || (!captionText.trim() && !onVideoText.trim())}
              onClick={handleAddShort}
            >
              <Icon name="plus" /> Add Short Content
            </button>
          </div>
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


function Drawer({ row, actor, team, channels, platforms = PLATFORMS, onClose, onPatch, onRun, onDelete, onAddPlatform }) {
    const savedScriptStats = scriptStats(row.script);
    const [tab, setTab] = useState('editorial');
  const [saveState, setSaveState] = useState({ status: 'idle', at: null });
  const pendingRef = useRef(0);

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.closest('aside')) el.blur();
    };
    window.addEventListener('keydown', fn, true);
    return () => window.removeEventListener('keydown', fn, true);
  }, []);

  useEffect(() => {
    setTab('editorial');
    pendingRef.current = 0;
    setSaveState({ status: 'idle', at: null });
  }, [row.id]);

  const patch = async (p) => {
    pendingRef.current += 1;
    setSaveState({ status: 'saving', at: null });
    let ok = false;
    try {
      ok = await onPatch(row.id, p);
    } catch (e) {
      ok = false;
    }
    pendingRef.current -= 1;
    if (pendingRef.current === 0) {
      setSaveState(ok ? { status: 'saved', at: new Date().toISOString() } : { status: 'error', at: null });
    }
    return ok;
  };
  const actions = getActions(row, actor);
  const tabs = [
    ['editorial', 'Editorial'],
    ['script', 'Script'],
    ['production', 'Production'],
    ['packaging', 'Packaging'],
    ['qc', 'QC & Audit'],
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
                  {savedScriptStats.words > 0 && (
                    <span className="script-duration-badge inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-white/10 bg-zinc-800 text-zinc-200">
                      Script {savedScriptStats.label}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-zinc-600">{row.content_uid}</span>
              </div>
              <h2 className="truncate text-[24px] font-black tracking-tight text-white">{row.slug_name || row.title || 'Untitled'}</h2>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                {row.channel || 'No channel'} · {formatDay(row.scheduled_publish_time)} {formatTime(row.scheduled_publish_time)}
              </p>
              {(() => {
                const links = getPublishedLinks(row);
                const validEntries = Object.entries(links).filter(([_, u]) => safeHttpUrl(u));
                if (validEntries.length === 0) {
                  if (safeHttpUrl(row.live_video_url)) {
                    return (
                      <div className="mt-3">
                        <a
                          href={safeHttpUrl(row.live_video_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white transition hover:bg-white/20"
                        >
                          <Icon name="link" className="h-3 w-3" />
                          View Published Content
                        </a>
                      </div>
                    );
                  }
                  return null;
                }
                return (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {validEntries.map(([pId, u]) => {
                      const pMeta = PLATFORMS.find((p) => p.id === pId);
                      return (
                        <a
                          key={pId}
                          href={safeHttpUrl(u)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white transition hover:bg-white/20"
                        >
                          <Icon name="link" className="h-3 w-3" />
                          {pMeta?.label || pId}
                        </a>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saveState.status === 'saving' && <span aria-live="polite" className="text-[11px] text-zinc-500">Saving…</span>}
              {saveState.status === 'saved' && <span aria-live="polite" className="text-[11px] text-emerald-400">Saved ✓ {formatTime(saveState.at)}</span>}
              {saveState.status === 'error' && <span aria-live="polite" className="text-[11px] text-red-400">Not saved</span>}
              <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Close drawer">
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
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
          {tab === 'editorial' ? <EditorialTab row={row} actor={actor} team={team} channels={channels} platforms={platforms} patch={patch} actions={actions} onRun={(a) => onRun(row, a)} onAddPlatform={onAddPlatform} /> : null}
          {tab === 'script' ? <ScriptTab row={row} actor={actor} patch={patch} /> : null}
          {tab === 'production' ? <ProductionTab row={row} actor={actor} patch={patch} /> : null}
          {tab === 'packaging' ? <PackagingTab row={row} actor={actor} patch={patch} platforms={platforms} onAddPlatform={onAddPlatform} /> : null}
          {tab === 'qc' ? <QcTab row={row} actor={actor} patch={patch} /> : null}
        </div>
        <footer className="border-t border-white/[0.08] bg-black/70 px-6 py-4 backdrop-blur-xl">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Next step</div>
          <ActionButtons actions={actions} onRun={(a) => onRun(row, a)} />
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
