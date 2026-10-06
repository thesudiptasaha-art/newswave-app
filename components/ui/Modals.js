'use client';

import { useState, useMemo, useRef } from 'react';
import { Icon } from './Icons';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, Field, SelectBox, ModalShell, Toggle, FullScreenCard } from './Shared';
import { RoleBadge, DesignationPill } from './Badges';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  isManager, isOwner, can, toLocalInput, fromLocalInput, formatDay, formatTime, 
  SLUG_MAX, normalizeSlugInput, pad, formatStamp, startOfDay, addDays
} from '../../lib/core';

import { downloadUserReport } from '../../services/exportService';
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function NewContentModal({ channels, team, defaultDate, onClose, onCreate }) {
  const activeNames = team.filter((m) => m.active !== false).map((m) => m.full_name);
  const initialTime = () => {
    const d = new Date(defaultDate);
    const now = new Date();
    d.setHours(sameDay(d, now) ? Math.min(now.getHours() + 1, 23) : 10, 0, 0, 0);
    return toLocalInput(d.toISOString());
  };
  const [f, setF] = useState({
    content_type: '',
    channel: '',
    when: initialTime(),
    slug_name: '',
    title: '',
    thumbnail_text: '',
    writer: '',
    presenter_name: '',
    script: '',
  });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const slugLen = f.slug_name.length;
  const errors = {
    content_type: f.content_type ? '' : 'Choose a content type',
    channel: f.channel ? '' : 'Choose a channel',
    when: '',
    slug_name: f.slug_name.trim() ? '' : 'Slug name is required',
    title: f.title.trim() ? '' : 'Title is required',
  };
  const valid = Object.values(errors).every((e) => !e);
  const showErr = (k) => (tried && errors[k] ? <p className="mt-1.5 text-[12px] text-red-400">{errors[k]}</p> : null);

  const submit = async () => {
    setTried(true);
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onCreate({
      content_type: f.content_type,
      channel: f.channel,
      scheduled_publish_time: fromLocalInput(f.when),
      slug_name: f.slug_name.trim(),
      title: f.title.trim(),
      thumbnail_text: f.thumbnail_text.trim(),
      writer: f.writer,
      presenter_name: f.presenter_name,
      script: f.script,
    });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <ModalShell
      title="New Content"
      subtitle="Fields follow the order of your production brief."
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create content'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="1 · Content / Pipeline type">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('content_type', t)}
                className={`rounded-xl border px-2 py-2.5 text-center text-[11px] font-semibold tracking-wide transition ${
                  f.content_type === t ? 'border-sky-400/60 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {f.content_type ? <p className="mt-1.5 text-[12px] text-zinc-500">Workflow: {CONTENT_TYPE_HINT[f.content_type]}</p> : null}
          {showErr('content_type')}
        </Field>

        <Field label="2 · Channel">
          <SelectBox value={f.channel} onChange={(v) => set('channel', v)} options={channels} placeholder="Select channel" />
          {showErr('channel')}
        </Field>

          <Field label="3 · Scheduled date & publish time" hint="optional — leave empty to keep it in the On hold & unscheduled list">
          <input type="datetime-local" value={f.when} onChange={(e) => set('when', e.target.value)} className={`${inputBase} [color-scheme:dark]`} />
          {showErr('when')}
        </Field>

        <Field label="4 · Slug name" hint={`${slugLen}/${SLUG_MAX} characters`}>
          <input
            value={f.slug_name}
            onChange={(e) => set('slug_name', normalizeSlugInput(e.target.value))}
            placeholder="BUDGET BREAKDOWN FISCAL YEAR"
            maxLength={SLUG_MAX}
            className={`${inputBase} font-mono uppercase tracking-wide`}
            autoCapitalize="characters"
            spellCheck={false}
          />
          {showErr('slug_name')}
        </Field>

        <Field label="5 · Title">
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Full story title" className={inputBase} />
          {showErr('title')}
        </Field>

        <Field label="6 · Thumbnail text">
          <input value={f.thumbnail_text} onChange={(e) => set('thumbnail_text', e.target.value)} placeholder="Short hook shown on the thumbnail" className={inputBase} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="7 · Writer">
            <SelectBox value={f.writer} onChange={(v) => set('writer', v)} options={activeNames} placeholder="Select writer" />
          </Field>
          <Field label="8 · Presenter">
            <SelectBox value={f.presenter_name} onChange={(v) => set('presenter_name', v)} options={activeNames} placeholder="Select presenter" />
          </Field>
        </div>

        <Field label="9 · Script">
          <textarea value={f.script} onChange={(e) => set('script', e.target.value)} rows={7} placeholder="Paste or write the script…" className={`${inputBase} resize-y leading-relaxed`} />
        </Field>
      </div>
    </ModalShell>
  );
}

function AddChannelModal({ onClose, onAdd, existing }) {
  const [name, setName] = useState('');
  const dup = existing.some((c) => c.toLowerCase() === name.trim().toLowerCase());
  return (
    <ModalShell
      title="Add channel"
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnPrimary}
            disabled={!name.trim() || dup}
            onClick={async () => {
              if (await onAdd(name.trim())) onClose();
            }}
          >
            Add channel
          </button>
        </>
      }
    >
      <Field label="Channel name">
        <input autoFocus className={inputBase} value={name} onChange={(e) => setName(e.target.value)} placeholder="The Wave Kids" />
      </Field>
      {dup ? <p className="mt-2 text-[12px] text-red-400">That channel already exists.</p> : null}
    </ModalShell>
  );
}

function ReasonModal({ title, label, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
            Confirm
          </button>
        </>
      }
    >
      <Field label={label}>
        <textarea autoFocus rows={4} className={inputBase} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a short note…" />
      </Field>
    </ModalShell>
  );
}

function TeamModal({ team, actor, orgName, onClose, onAdd, onUpdate, onRemove, rows, range }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('general');
  const [open, setOpen] = useState(null);
  const actorIsOwner = isOwner(actor);
  const canAdd = isManager(actor);
  const canManage = (t) => t.role !== 'owner' && (actorIsOwner || (actor && actor.role === 'manager' && t.role === 'general'));

  const sorted = [...team].sort((a, b) => {
    const order = { owner: 0, manager: 1, general: 2 };
    return order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name);
  });

  return (
    <ModalShell title="Team & permissions" subtitle={orgName} onClose={onClose} wide>
      {canAdd ? (
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">Add a team member</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1.2fr_0.8fr_auto]">
            <input className={inputBase} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputBase} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <SelectBox value={role} onChange={setRole} disabled={!actorIsOwner} options={actorIsOwner ? [{ value: 'general', label: 'General User' }, { value: 'manager', label: 'Manager' }] : [{ value: 'general', label: 'General User' }]} />
            <button
              className={btnPrimary}
              disabled={!name.trim()}
              onClick={async () => {
                if (await onAdd({ full_name: name.trim(), email: email.trim(), role: actorIsOwner ? role : 'general', designation: designation.trim(), avatar_url: avatarUrl.trim() })) {
                  setName('');
                  setEmail('');
                  setRole('general');
                  setDesignation('');
                  setAvatarUrl('');
                }
              }}
            >
              <Icon name="plus" /> Add
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputBase} placeholder="Designation / job title (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            <input className={inputBase} placeholder="Avatar image link (optional)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
          {!actorIsOwner ? <p className="mt-2 text-[12px] text-zinc-500">Only the Owner can assign the Manager role.</p> : null}
        </div>
      ) : (
        <p className="mb-5 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-zinc-400">
          <LockIcon /> Only the Owner and Managers can add or change team members.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((t) => {
          const manageable = canManage(t);
          const expanded = open === t.id;
          const full = t.role !== 'general';
          return (
            <div key={t.id} className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] ${t.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar member={t} size="h-9 w-9" text="text-[13px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-white">{t.full_name}</span>
                    <RoleBadge role={t.role} />
                    <DesignationPill designation={t.designation} />
                    {!t.active ? <span className="text-[11px] text-zinc-500">inactive</span> : null}
                  </div>
                  <div className="truncate text-[12px] text-zinc-500">{t.email || 'no email'}</div>
                </div>
                <button className={btnGhost + ' !px-3 !py-1.5'} onClick={() => setOpen(expanded ? null : t.id)}>
                  {expanded ? 'Close' : 'Access'}
                </button>
              </div>
              {expanded ? (
                <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
                  {manageable || (actor && actor.id === t.id) ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Designation">
                        <BlurInput value={t.designation} onCommit={(v) => onUpdate(t.id, { designation: v.trim() || null })} placeholder="e.g. Senior Producer" />
                      </Field>
                      <Field label="Avatar image link">
                        <BlurInput value={t.avatar_url} onCommit={(v) => onUpdate(t.id, { avatar_url: v.trim() || null })} placeholder="https://…" />
                      </Field>
                    </div>
                  ) : null}
                  {full ? (
                    <p className="flex items-center gap-2 text-[13px] text-zinc-400">
                      <Icon name="shield" className="h-4 w-4 text-sky-400" /> {t.role === 'owner' ? 'Owner' : 'Managers'} always have full access to every permission.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {PERMISSIONS.map((p) => (
                        <div key={p.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[13px] text-zinc-200">
                              {p.label}
                              {!manageable ? <LockIcon message="You cannot change this person’s permissions" /> : null}
                            </div>
                            <div className="text-[11px] text-zinc-500">{p.hint}</div>
                          </div>
                          <Toggle on={t[p.key]} disabled={!manageable} onChange={(v) => onUpdate(t.id, { [p.key]: v })} />
                        </div>
                      ))}
                    </div>
                  )}
                  {manageable ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {actorIsOwner ? (
                        <SelectBox className="w-44" value={t.role} onChange={(v) => onUpdate(t.id, { role: v })} options={[{ value: 'general', label: 'General User' }, { value: 'manager', label: 'Manager' }]} />
                      ) : null}
                      <button className={btnGhost} onClick={() => onUpdate(t.id, { active: !t.active })}>
                        {t.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button className={btnDanger} onClick={() => onRemove(t)}>
                        <Icon name="trash" /> Remove
                      </button>
                      <button className={btnGhost} onClick={() => downloadUserReport(t, rows || [], range?.start, range?.end)}>
                        <Icon name="chart" className="h-4 w-4" /> Download Report
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

function countBy(rows, fn) {
  const m = {};
  rows.forEach((r) => {
    const k = fn(r) || '—';
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function KpiModal({ rows, rangeLabel, onClose }) {
  const published = rows.filter((r) => r.status === 'Published').length;
  const inProgress = rows.filter((r) => !['Published', 'Dropped', 'On Hold', 'Draft'].includes(r.status)).length;
  const late = rows.filter((r) => r.status !== 'Published' && r.status !== 'Dropped' && r.scheduled_publish_time && new Date(r.scheduled_publish_time) < new Date()).length;
  const Block = ({ title, items }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">{title}</div>
      {items.length === 0 ? <p className="text-[13px] text-zinc-600">No data</p> : null}
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between py-1 text-[13px]">
          <span className="truncate text-zinc-300">{k}</span>
          <span className="tabular-nums text-white">{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <ModalShell title="KPI report" subtitle={rangeLabel} onClose={onClose} wide>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total', rows.length], ['Published', published], ['In progress', inProgress], ['Past due', late]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{k}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Block title="By status" items={countBy(rows, (r) => r.status)} />
        <Block title="By channel" items={countBy(rows, (r) => r.channel)} />
        <Block title="By content type" items={countBy(rows, (r) => r.content_type)} />
        <Block title="By presenter" items={countBy(rows, (r) => r.presenter_name)} />
        <Block title="By writer" items={countBy(rows, (r) => r.writer)} />
        <Block title="By video editor" items={countBy(rows.filter((r) => r.video_editor), (r) => r.video_editor)} />
      </div>
    </ModalShell>
  );
}

function BulkScheduleModal({ onClose, team, channels, onAdd }) {
  const [contentType, setContentType] = useState('PACKAGE');
  const [channel, setChannel] = useState(channels[0]?.name || 'TV');
  const [writer, setWriter] = useState('');
  const [time, setTime] = useState('14:00');
  const [days, setDays] = useState(7); // How many days to generate

  return (
    <ModalShell title="Bulk Schedule Slots" subtitle="Pre-assign daily content" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Content Type">
          <SelectBox value={contentType} onChange={setContentType} options={['PACKAGE', 'SOT', 'LIVE', 'EXPLAINER'].map(c => ({value: c, label: c}))} />
        </Field>
        <Field label="Channel">
          <SelectBox value={channel} onChange={setChannel} options={channels.map(c => ({value: c.name, label: c.name}))} />
        </Field>
        <Field label="Writer / Assignee">
          <SelectBox value={writer} onChange={setWriter} options={[{value: '', label: 'Unassigned'}, ...team.filter(t => t.can_write || t.role === 'owner').map(t => ({value: t.full_name, label: t.full_name}))]} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Time of Day">
            <input type="time" className={inputBase} value={time} onChange={e => setTime(e.target.value)} />
          </Field>
          <Field label="Days to schedule">
            <input type="number" min="1" max="30" className={inputBase} value={days} onChange={e => setDays(e.target.value)} />
          </Field>
        </div>
        <button className={`${btnPrimary} w-full mt-4`} onClick={async () => {
          for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const [hh, mm] = time.split(':');
            d.setHours(parseInt(hh), parseInt(mm), 0, 0);
            
            await onAdd({
              slug_name: `TBD ${contentType}`,
              content_type: contentType,
              target_platform: channel,
              writer: writer,
              scheduled_publish_time: d.toISOString(),
              status: 'Draft'
            });
          }
          onClose();
        }}>Generate {days} Slots</button>
      </div>
    </ModalShell>
  );
}

function ProfileModal({ member, authEmail, onClose, onSave, onSignOut }) {
  const [name, setName] = useState(member.full_name || '');
  const [designation, setDesignation] = useState(member.designation || '');
  const [avatar, setAvatar] = useState(member.avatar_url || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const full = member.role !== 'general';
    const [uploading, setUploading] = useState(false);
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeToJpeg(file);
      if (supabase && member.organization_id && member.id) {
        const path = `${member.organization_id}/${member.id}.jpg`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        setAvatar(`${data.publicUrl}?v=${Date.now()}`);
      } else {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            setAvatar(String(reader.result));
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      setError(`Could not upload the photo: ${err && err.message ? err.message : 'unknown error'}`);
    }
    setUploading(false);
  };

  const save = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (password && password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setBusy(true);
    const ok = await onSave({ full_name: name.trim(), designation: designation.trim(), avatar_url: avatar.trim() });
    if (ok && password && supabase) {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setBusy(false);
        setError(`Profile saved, but the password was not changed: ${err.message}`);
        return;
      }
    }
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <ModalShell
      title="My profile"
      subtitle={authEmail}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onSignOut}>
            Sign out
          </button>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar member={{ full_name: name, avatar_url: avatar }} size="h-16 w-16" text="text-[22px]" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-white">{name || 'Your name'}</span>
              <RoleBadge role={member.role} />
              <DesignationPill designation={designation} />
            </div>
            <p className="mt-1 text-[12px] text-zinc-500">This is how your team sees you.</p>
                  <label className={`${btnGhost} mt-2 cursor-pointer !py-1.5 !text-[12px] ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            </label>
          </div>
        </div>
        <Field label="Full name">
          <input className={inputBase} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Job designation" hint="optional">
          <input className={inputBase} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Producer" />
        </Field>
        <Field label="Profile Picture (Upload)" hint="optional">
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*"
              className="text-[12px] text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[12px] file:text-white hover:file:bg-white/20"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const fileName = generateFileName(file.name);
                  // Make sure you have created an 'avatars' bucket in Supabase!
                  const url = await uploadFile('avatars', fileName, file);
                  setAvatar(url);
                  alert('Avatar uploaded successfully!');
                } catch (err) {
                  alert('Upload failed: ' + err.message);
                }
              }}
            />
            {avatar && <img src={avatar} alt="Avatar Preview" className="h-8 w-8 rounded-full object-cover border border-white/20" />}
          </div>
        </Field>
        <Field label="New password" hint="leave empty to keep the current one">
          <input type="password" autoComplete="new-password" className={inputBase} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your access (set by your Manager)</div>
          {full ? (
            <p className="flex items-center gap-2 text-[13px] text-zinc-400">
              <Icon name="shield" className="h-4 w-4 text-sky-400" /> {ROLE_LABEL[member.role]}s have full access.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <div key={p.key} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[13px]">
                  {member[p.key] ? <Icon name="check" className="h-4 w-4 text-emerald-400" /> : <LockIcon message="Ask your Manager for this permission" className="h-4 w-4" />}
                  <span className={member[p.key] ? 'text-zinc-200' : 'text-zinc-500'}>{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p> : null}
      </div>
    </ModalShell>
  );
}

export { NewContentModal, AddChannelModal, ReasonModal, TeamModal, KpiModal, BulkScheduleModal, ProfileModal };
