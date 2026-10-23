'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Icon, LockIcon } from './Icons';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, Field, SelectBox, ModalShell, Toggle, FullScreenCard, BlurInput } from './Shared';
import { RoleBadge, DesignationPill } from './Badges';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, PLATFORMS, PERMISSIONS, ROLE_LIST, ACCESS_LIST, ROLE_LABEL,
  isManager, isOwner, can, toLocalInput, fromLocalInput, formatDay, formatTime, 
  SLUG_MAX, normalizeSlugInput, pad, formatStamp, startOfDay, addDays, sameDay, shortsInRange,
  normalizeRow
} from '../../lib/core';

import { downloadUserReport } from '../../services/exportService';
import { supabase } from '../../services/supabase';
import { resizeToJpeg } from '../../utils/helpers';
import { fetchAllPages } from '../../utils/fetchAll';

function NewContentModal({ channels, team, defaultDate, onClose, onCreate }) {
  const conceptOptions = team.filter((m) => m.active !== false && (m.role_concept_creator || m.role === 'owner' || m.role === 'manager')).map((m) => ({ value: m.full_name, label: m.nickname || m.full_name }));
  const writerOptions = team.filter((m) => m.active !== false && (m.role_research_script_writer || m.role === 'owner' || m.role === 'manager')).map((m) => ({ value: m.full_name, label: m.nickname || m.full_name }));
  const presenterOptions = team.filter((m) => m.active !== false).map((m) => ({ value: m.full_name, label: m.nickname || m.full_name }));
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
    concept_creator: '',
    writer: '',
    presenter_name: '',
    script: '',
  });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const onTitle = (v) => setF((p) => ({ ...p, title: v, slug_name: slugTouched ? p.slug_name : normalizeSlugInput(v).slice(0, SLUG_MAX) }));

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
      concept_creator: f.concept_creator,
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
      subtitle="Fill in the basics. You can add the rest later."
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
      <div className="space-y-6">
        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Basics</div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[12px] font-medium text-zinc-400">Content type *</div>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('content_type', t)}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold tracking-wide transition ${
                      f.content_type === t ? 'border-sky-400/60 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {f.content_type ? <p className="mt-1.5 text-[12px] text-zinc-500">Workflow: {CONTENT_TYPE_HINT[f.content_type]}</p> : null}
              {showErr('content_type')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Channel *">
                <SelectBox value={f.channel} onChange={(v) => set('channel', v)} options={channels} placeholder="Select channel" />
                {showErr('channel')}
              </Field>
              <Field label="Publish date & time" hint="optional - leave empty to keep it in the On hold & unscheduled list">
                <input type="datetime-local" value={f.when} onChange={(e) => set('when', e.target.value)} className={`${inputBase} [color-scheme:dark]`} />
                {showErr('when')}
              </Field>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Story</div>
          <div className="space-y-4">
            <Field label="Slug name *" hint={`${slugLen}/${SLUG_MAX} characters - filled from the title, you can edit it`}>
              <input
                value={f.slug_name}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug_name', normalizeSlugInput(e.target.value));
                }}
                placeholder="BUDGET BREAKDOWN FISCAL YEAR"
                maxLength={SLUG_MAX}
                className={`${inputBase} font-mono uppercase tracking-wide`}
                autoCapitalize="characters"
                spellCheck={false}
              />
              {showErr('slug_name')}
            </Field>

            <Field label="Title *">
              <input value={f.title} onChange={(e) => onTitle(e.target.value)} placeholder="Full story title" className={`${inputBase} !text-[15px]`} />
              {showErr('title')}
            </Field>

            <Field label="Thumbnail text">
              <input value={f.thumbnail_text} onChange={(e) => set('thumbnail_text', e.target.value)} placeholder="Short hook shown on the thumbnail" className={inputBase} />
            </Field>

            {showScript || f.script ? (
              <Field label="Script">
                <textarea value={f.script} onChange={(e) => set('script', e.target.value)} rows={6} placeholder="Paste or write the script…" className={`${inputBase} resize-y leading-relaxed`} />
              </Field>
            ) : (
              <button type="button" onClick={() => setShowScript(true)} className="text-[13px] font-medium text-sky-400 transition hover:text-sky-300">
                + Add script (optional)
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">People</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Concept Creator">
                <SelectBox value={f.concept_creator} onChange={(v) => set('concept_creator', v)} options={conceptOptions} placeholder="Select concept creator" />
              </Field>
              <Field label="Research & Script Writer">
                <SelectBox value={f.writer} onChange={(v) => set('writer', v)} options={writerOptions} placeholder="Select research & script" />
              </Field>
            </div>
            <Field label="Presenter" hint="optional">
              <SelectBox value={f.presenter_name} onChange={(v) => set('presenter_name', v)} options={presenterOptions} placeholder="Select presenter" />
            </Field>
          </div>
        </div>
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

function AddPlatformModal({ onClose, onAdd, existing = [] }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const autoCode = name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  const finalCode = (code.trim() || autoCode);
  const dup = existing.some((p) => (p.id || '').toLowerCase() === finalCode.toLowerCase() || (p.label || '').toLowerCase() === name.trim().toLowerCase());

  return (
    <ModalShell
      title="Add publish platform"
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnPrimary}
            disabled={!name.trim() || !finalCode || dup}
            onClick={async () => {
              if (await onAdd({ name: name.trim(), code: finalCode })) onClose();
            }}
          >
            Add platform
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Platform display name">
          <input
            autoFocus
            className={inputBase}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!code) setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
            }}
            placeholder="e.g. WhatsApp Channel, Threads, Substack"
          />
        </Field>
        <Field label="Platform identifier code" hint="Used internally for links and keys">
          <input
            className={inputBase}
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder={autoCode || "e.g. whatsapp"}
          />
        </Field>
        {dup ? <p className="text-[12px] text-red-400">That platform name or code already exists.</p> : null}

        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Existing platforms ({existing.length})</div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {existing.map((p) => (
              <span key={p.id} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                {p.label || p.name} <span className="opacity-50 font-mono text-[9px]">({p.id})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
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
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nickname, setNickname] = useState('');
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
                if (await onAdd({ full_name: name.trim(), email: email.trim(), role: actorIsOwner ? role : 'general', designation: designation.trim(), avatar_url: avatarUrl.trim(), employee_id: employeeId.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(), nickname: nickname.trim() })) {
                  setName('');
                  setEmail('');
                  setRole('general');
                  setDesignation('');
                  setAvatarUrl('');
                  setEmployeeId('');
                  setPhone('');
                  setWhatsapp('');
                  setNickname('');
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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input className={inputBase} placeholder="Nickname (one word, optional)" value={nickname} onChange={(e) => setNickname(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 20))} />
            <input className={inputBase} placeholder="Employee ID (optional)" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            <input className={inputBase} placeholder="Official phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={inputBase} placeholder="WhatsApp number (optional)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
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
                  {manageable ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <Field label="Nickname">
                        <BlurInput value={t.nickname} onCommit={(v) => onUpdate(t.id, { nickname: v.replace(/[^A-Za-z]/g, '').slice(0, 20) || null })} placeholder="e.g. Rafi" />
                      </Field>
                      <Field label="Employee ID">
                        <BlurInput value={t.employee_id} onCommit={(v) => onUpdate(t.id, { employee_id: v.trim() || null })} placeholder="e.g. EMP-0123" />
                      </Field>
                      <Field label="Official phone">
                        <BlurInput value={t.phone} onCommit={(v) => onUpdate(t.id, { phone: v.trim() || null })} placeholder="e.g. 01XXXXXXXXX" />
                      </Field>
                      <Field label="WhatsApp">
                        <BlurInput value={t.whatsapp} onCommit={(v) => onUpdate(t.id, { whatsapp: v.trim() || null })} placeholder="e.g. 01XXXXXXXXX" />
                      </Field>
                    </div>
                  ) : null}
                  {full ? (
                    <p className="flex items-center gap-2 text-[13px] text-zinc-400">
                      <Icon name="shield" className="h-4 w-4 text-sky-400" /> {t.role === 'owner' ? 'Owner' : 'Managers'} always have full access to every permission.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {!manageable ? (
                        <p className="flex items-center gap-2 text-[12px] text-zinc-500"><LockIcon message="You cannot change this person's roles or access" /> You cannot change this person's roles or access.</p>
                      ) : null}
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Roles</div>
                        <p className="mb-3 mt-1 text-[12px] text-zinc-500">The work this person does. They appear in the matching list on a content.</p>
                        {[...new Set(ROLE_LIST.map((r) => r.group))].map((g) => (
                          <div key={g} className="mb-3">
                            <div className="mb-1.5 text-[11px] text-zinc-500">{g}</div>
                            <div className="flex flex-wrap gap-2">
                              {ROLE_LIST.filter((r) => r.group === g).map((r) => (
                                <button
                                  type="button"
                                  key={r.key}
                                  disabled={!manageable}
                                  title={r.hint}
                                  onClick={() => onUpdate(t.id, { [r.key]: !t[r.key] })}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${t[r.key] ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-white/[0.1] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'} ${!manageable ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                  {t[r.key] ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Access</div>
                        <p className="mb-3 mt-1 text-[12px] text-zinc-500">What this person is allowed to do.</p>
                        {[...new Set(ACCESS_LIST.map((a) => a.group))].map((g) => (
                          <div key={g} className="mb-3">
                            <div className="mb-1.5 text-[11px] text-zinc-500">{g}</div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {ACCESS_LIST.filter((a) => a.group === g).map((p) => (
                                <div key={p.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                                  <div className="min-w-0">
                                    <div className="text-[13px] text-zinc-200">{p.label}</div>
                                    <div className="text-[11px] text-zinc-500">{p.hint}</div>
                                  </div>
                                  <Toggle on={t[p.key]} disabled={!manageable} onChange={(v) => onUpdate(t.id, { [p.key]: v })} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
  const scheduled = rows.filter((r) => r.status === 'Scheduled').length;
  const inProgress = rows.filter((r) => !['Published', 'Dropped', 'On Hold', 'Draft'].includes(r.status)).length;
  const late = rows.filter((r) => r.status !== 'Published' && r.status !== 'Dropped' && r.status !== 'Scheduled' && r.scheduled_publish_time && new Date(r.scheduled_publish_time) < new Date()).length;
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
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[['Total', rows.length], ['Published', published], ['Scheduled', scheduled], ['In progress', inProgress], ['Past due', late]].map(([k, v]) => (
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
        <Block title="By research & script" items={countBy(rows, (r) => r.writer)} />
        <Block title="By video editor" items={countBy(rows.filter((r) => r.video_editor), (r) => r.video_editor)} />
      </div>
    </ModalShell>
  );
}

function BulkScheduleModal({ onClose, team, channels, onAdd }) {
  const [items, setItems] = useState([createEmptyRow()]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  function createEmptyRow() {
    return {
      _id: Math.random().toString(36).substring(2),
      scheduled_publish_time: '',
      channel: channels[0]?.name || 'TV',
      content_type: 'PACKAGE',
      slug_name: '',
      writer: '',
      presenter_name: '',
      video_editor: '',
      error: null
    };
  }

  const addRow = () => setItems(prev => [...prev, createEmptyRow()]);
  const addTenRows = () => {
    const newRows = Array.from({ length: 10 }, createEmptyRow);
    setItems(prev => [...prev, ...newRows]);
  };
  const duplicateRow = (row) => setItems(prev => {
    const idx = prev.findIndex(r => r._id === row._id);
    const newRow = { ...row, _id: Math.random().toString(36).substring(2), error: null };
    const copy = [...prev];
    copy.splice(idx + 1, 0, newRow);
    return copy;
  });
  const removeRow = (id) => setItems(prev => prev.filter(r => r._id !== id));

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(r => r._id === id ? { ...r, [field]: value, error: null } : r));
  };

  const handleSaveAll = async () => {
    // Validate
    let hasError = false;
    const validated = items.map(r => {
      if (!r.scheduled_publish_time || !r.channel || !r.content_type || !r.slug_name.trim()) {
        hasError = true;
        return { ...r, error: 'Missing required fields (Date, Channel, Type, Slug)' };
      }
      return r;
    });

    if (hasError) {
      setItems(validated);
      return;
    }

    setSaving(true);
    let successCount = 0;
    const newIds = [];
    const failedRows = [];

    for (const r of validated) {
      const data = {
        scheduled_publish_time: new Date(r.scheduled_publish_time).toISOString(),
        channel: r.channel,
        content_type: r.content_type,
        slug_name: r.slug_name.trim(),
        title: r.slug_name.trim(),
        writer: r.writer || '',
        presenter_name: r.presenter_name || '',
        video_editor: r.video_editor || '',
      };
      const saved = await onAdd(data);
      if (saved && saved.content_uid) {
        successCount++;
        newIds.push(saved.content_uid);
      } else {
        failedRows.push({ ...r, error: 'Failed to create' });
      }
    }

    setSaving(false);
    if (failedRows.length > 0) {
      setItems(failedRows);
      setResult({ msg: `Created ${successCount} contents. Some rows failed.`, ids: newIds });
    } else {
      setItems([createEmptyRow()]);
      setResult({ msg: `Successfully created ${successCount} contents!`, ids: newIds });
    }
  };

  const activeWriters = team.filter(t => t.active !== false && (t.role_research_script_writer || t.role === 'owner')).map(t => t.full_name);
  const activePresenters = team.filter(t => t.active !== false && (t.role_presenter || t.role === 'owner' || t.role_camera_operator)).map(t => t.full_name); // App uses activeNames typically
  const activeEditors = team.filter(t => t.active !== false && (t.role_video_editor || t.role === 'owner')).map(t => t.full_name);
  
  // Actually, standard activeNames for everyone
  const activeNames = team.filter(t => t.active !== false).map(t => t.full_name);

  return (
    <FullScreenCard onClose={onClose} title="Bulk Schedule Entry">
      <div className="flex h-full flex-col p-6">
        {result && (
          <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
            <strong>{result.msg}</strong>
            {result.ids.length > 0 && <div className="mt-1 text-sm">IDs: {result.ids.join(', ')}</div>}
          </div>
        )}
        <div className="flex gap-2 mb-4">
          <button className={btnGhost} onClick={addRow}><Icon name="plus" /> Add row</button>
          <button className={btnGhost} onClick={addTenRows}><Icon name="plus" /> Add 10 rows</button>
          <div className="flex-1" />
          <button className={btnPrimary} onClick={handleSaveAll} disabled={saving || items.length === 0}>
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
        
        <div className="flex-1 overflow-auto rounded-xl border border-white/[0.08] bg-[#1a1a1f]">
          <table className="w-full min-w-[1200px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500 bg-[#121215]">
                <th className="px-3 py-2 w-[180px]">Date & Time *</th>
                <th className="px-3 py-2 w-[120px]">Channel *</th>
                <th className="px-3 py-2 w-[130px]">Type *</th>
                <th className="px-3 py-2">Slug Name *</th>
                <th className="px-3 py-2 w-[140px]">Research & Script Writer</th>
                <th className="px-3 py-2 w-[140px]">Presenter</th>
                <th className="px-3 py-2 w-[140px]">Video Editor</th>
                <th className="px-3 py-2 w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r._id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${r.error ? 'bg-red-500/5' : ''}`}>
                  <td className="px-3 py-2">
                    <input type="datetime-local" className={inputBase + " [color-scheme:dark]"} value={r.scheduled_publish_time} onChange={e => updateItem(r._id, 'scheduled_publish_time', e.target.value)} />
                    {r.error && !r.scheduled_publish_time && <div className="text-[10px] text-red-400 mt-1">Required</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputBase} value={r.channel} onChange={e => updateItem(r._id, 'channel', e.target.value)}>
                      {channels.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputBase} value={r.content_type} onChange={e => updateItem(r._id, 'content_type', e.target.value)}>
                      {['PACKAGE', 'SOT', 'LIVE', 'EXPLAINER', 'SHOW', 'STORY'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" className={inputBase} value={r.slug_name} onChange={e => updateItem(r._id, 'slug_name', normalizeSlugInput(e.target.value))} placeholder="Slug..." maxLength={SLUG_MAX} />
                    <div className="text-[9px] text-zinc-500 mt-0.5 text-right">{r.slug_name.length}/{SLUG_MAX}</div>
                    {r.error && !r.slug_name.trim() && <div className="text-[10px] text-red-400 mt-1">Required</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputBase} value={r.writer} onChange={e => updateItem(r._id, 'writer', e.target.value)}>
                      <option value="">- Unassigned -</option>
                      {activeNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputBase} value={r.presenter_name} onChange={e => updateItem(r._id, 'presenter_name', e.target.value)}>
                      <option value="">- Unassigned -</option>
                      {activeNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputBase} value={r.video_editor} onChange={e => updateItem(r._id, 'video_editor', e.target.value)}>
                      <option value="">- Unassigned -</option>
                      {activeNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="text-sky-400 hover:text-sky-300" title="Duplicate row" onClick={() => duplicateRow(r)}><Icon name="copy" /></button>
                      <button className="text-red-400 hover:text-red-300" title="Delete row" onClick={() => removeRow(r._id)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-zinc-500">No rows. Click "Add row" to start.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </FullScreenCard>
  );
}

function ProfileModal({ member, authEmail, onClose, onSave, onSignOut, onOpenMyWork }) {
  const [name, setName] = useState(member.full_name || '');
  const [designation, setDesignation] = useState(member.designation || '');
  const [avatar, setAvatar] = useState(member.avatar_url || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [whatsapp, setWhatsapp] = useState(member.whatsapp || '');
  const [nickname, setNickname] = useState(member.nickname || '');
  const [employeeId, setEmployeeId] = useState(member.employee_id || '');
  const isOwnerSelf = member.role === 'owner';
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
    const ok = await onSave({ full_name: name.trim(), designation: designation.trim(), avatar_url: avatar.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(), nickname: nickname.trim(), ...(isOwnerSelf ? { employee_id: employeeId.trim() } : {}) });
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
          {onOpenMyWork ? (
            <button className={btnGhost} onClick={onOpenMyWork}>
              My Work
            </button>
          ) : null}
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
        <Field label="Nickname" hint="one English word, shown across the app">
          <input className={inputBase} value={nickname} onChange={(e) => setNickname(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 20))} placeholder="e.g. Rafi" />
        </Field>
        <Field label="Job designation" hint="optional">
          <input className={inputBase} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Producer" />
        </Field>
        <Field label="Employee ID" locked={!isOwnerSelf} lockMessage="Only the Owner and Managers can change this" hint={isOwnerSelf ? 'optional' : undefined}>
          <input className={inputBase} value={isOwnerSelf ? employeeId : (member.employee_id || '')} onChange={(e) => setEmployeeId(e.target.value)} readOnly={!isOwnerSelf} disabled={!isOwnerSelf} placeholder={isOwnerSelf ? 'e.g. EMP-0123' : 'Not set'} />
        </Field>
        <Field label="Official phone" hint="optional">
          <input className={inputBase} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 01XXXXXXXXX" />
        </Field>
        <Field label="WhatsApp" hint="optional">
          <input className={inputBase} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 01XXXXXXXXX" />
        </Field>
        <Field label="New password" hint="leave empty to keep the current one">
          <input type="password" autoComplete="new-password" className={inputBase} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="space-y-4">
          {full ? (
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your roles and access</div>
              <p className="flex items-center gap-2 text-[13px] text-zinc-400">
                <Icon name="shield" className="h-4 w-4 text-sky-400" /> {ROLE_LABEL[member.role]}s have full access and appear in every role list.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your roles</div>
                {ROLE_LIST.some((r) => member[r.key]) ? (
                  <div className="flex flex-wrap gap-2">
                    {ROLE_LIST.filter((r) => member[r.key]).map((r) => (
                      <span key={r.key} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-emerald-200">
                        <Icon name="check" className="h-3.5 w-3.5" /> {r.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-zinc-500">No roles assigned yet.</p>
                )}
              </div>
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your access</div>
                {[...new Set(ACCESS_LIST.map((a) => a.group))].map((g) => (
                  <div key={g} className="mb-3">
                    <div className="mb-1.5 text-[11px] text-zinc-500">{g}</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ACCESS_LIST.filter((a) => a.group === g).map((p) => (
                        <div key={p.key} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[13px]">
                          {member[p.key] ? <Icon name="check" className="h-4 w-4 text-emerald-400" /> : <LockIcon message="Only the Owner and Managers can change this" className="h-4 w-4" />}
                          <span className={member[p.key] ? 'text-zinc-200' : 'text-zinc-500'}>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-zinc-500">Only the Owner and Managers can change these.</p>
            </>
          )}
        </div>
        {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p> : null}
      </div>
    </ModalShell>
  );
}

const MY_WORK_ROLES = ROLE_LIST.map((r) => [r.field, r.label]);

function MyWorkModal({ rows, rangeLabel, range, actor, onClose }) {
  const endExclusive = addDays(range.end, 1);
  const myItems = rows.filter(r => {
    let inRange = false;
    if (r.scheduled_publish_time) {
      const d = new Date(r.scheduled_publish_time);
      if (d >= range.start && d < endExclusive) inRange = true;
    }
    if (!inRange && typeof shortsInRange === 'function' && shortsInRange(r, range.start, endExclusive).length > 0) {
      inRange = true;
    }
    if (!inRange) return false;

    if (!actor) return false;
    const name = actor.full_name;
    return MY_WORK_ROLES.some(([field]) => r[field] === name);
  });

  const roleTotals = { 'Research & Script Writer': 0, Presenter: 0, 'Video Editor': 0, 'Camera Operator': 0, Publisher: 0 };
  const statusTotals = {};
  
  const getMyRoles = (r) => {
    const roles = [];
    if (!actor) return roles;
    const name = actor.full_name;
    MY_WORK_ROLES.forEach(([field, label]) => { if (r[field] === name) roles.push(label); });
    return roles;
  };

  myItems.forEach(r => {
    const roles = getMyRoles(r);
    roles.forEach(role => {
      roleTotals[role] = (roleTotals[role] || 0) + 1;
    });
    statusTotals[r.status] = (statusTotals[r.status] || 0) + 1;
  });

  return (
    <FullScreenCard onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#121215] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white">My Work: {actor?.full_name}</h2>
            <div className="text-[13px] text-zinc-400">{rangeLabel}</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-black/90">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1f] p-4">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">Totals by Role</h3>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                {Object.entries(roleTotals).map(([r, c]) => (
                  <div key={r} className="flex justify-between border-b border-white/[0.04] py-1">
                    <span className="text-zinc-400">{r}</span>
                    <span className="text-white font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1f] p-4">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">Totals by Status</h3>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                {Object.entries(statusTotals).map(([s, c]) => (
                  <div key={s} className="flex justify-between border-b border-white/[0.04] py-1">
                    <span className="text-zinc-400">{s}</span>
                    <span className="text-white font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#1a1a1f]">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500 bg-[#121215]">
                  <th className="px-4 py-3">Content ID</th>
                  <th className="px-4 py-3">Slug Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">My role(s)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Publish time</th>
                  <th className="px-4 py-3">Short count</th>
                </tr>
              </thead>
              <tbody>
                {myItems.map(r => (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">{r.content_uid}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.slug_name}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.content_type}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.channel}</td>
                    <td className="px-4 py-3 text-sky-300">{getMyRoles(r).join(', ')}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.scheduled_publish_time ? formatStamp(r.scheduled_publish_time) : '-'}</td>
                    <td className="px-4 py-3 text-zinc-400">{(r.shorts || []).length}</td>
                  </tr>
                ))}
                {myItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-zinc-500">No content found for your roles in this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FullScreenCard>
  );
}


function EmployeeReportModal({ rows, range, team, orgId, onClose, onOpenContent }) {
  const [localRange, setLocalRange] = useState({ start: range.start, end: range.end });
  const [data, setData] = useState([]);
  const [activeRoles, setActiveRoles] = useState([]);
  const [reportRows, setReportRows] = useState(rows);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!supabase || !orgId) {
      setReportRows(rows);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    const endExclusive = addDays(localRange.end, 1);
    const from = localRange.start.toISOString();
    const to = endExclusive.toISOString();
    const days = [];
    for (let d = new Date(localRange.start); d < endExclusive && days.length < 400; d = addDays(d, 1)) {
      days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    (async () => {
      const main = await fetchAllPages(() =>
        supabase
          .from('contents')
          .select('*')
          .or(`organization_id.eq.${orgId},organization_id.is.null`)
          .gte('scheduled_publish_time', from)
          .lt('scheduled_publish_time', to)
          .order('id', { ascending: true })
      );
      const extra = await fetchAllPages(() =>
        supabase
          .from('contents')
          .select('*')
          .or(`organization_id.eq.${orgId},organization_id.is.null`)
          .overlaps('short_days', days)
          .order('id', { ascending: true })
      );
      if (cancelled) return;
      if (main.error || extra.error) {
        setLoadError('Could not load report data: ' + ((main.error || extra.error).message || 'unknown error'));
        setLoading(false);
        return;
      }
      const seen = new Set();
      const merged = [];
      [main.data || [], extra.data || []].forEach((list) =>
        list.forEach((r) => {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            merged.push(normalizeRow(r));
          }
        })
      );
      setReportRows(merged);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [localRange, orgId]);

  useEffect(() => {
    const endExclusive = addDays(localRange.end, 1);
    
    const validRows = reportRows.filter(r => {
      let inRange = false;
      if (r.scheduled_publish_time) {
         const d = new Date(r.scheduled_publish_time);
         if (d >= localRange.start && d < endExclusive) inRange = true;
      }
      if (!inRange && typeof shortsInRange === 'function' && shortsInRange(r, localRange.start, endExclusive).length > 0) {
         inRange = true;
      }
      return inRange;
    });

    const stats = {};
    team.forEach(m => {
      stats[m.full_name] = { 
        name: m.full_name, 
        total: 0, 
        published: 0, 
        roles: {}, 
        contents: new Map(),
        details: [] 
      };
    });

    const ALL_ROLES = ROLE_LIST.map((r) => ({ key: r.field, label: r.label }));

    validRows.forEach(r => {
      ALL_ROLES.forEach(roleDef => {
        const personName = r[roleDef.key];
        if (personName && stats[personName]) {
          const s = stats[personName];
          s.roles[roleDef.label] = (s.roles[roleDef.label] || 0) + 1;
          s.contents.set(r.id, r);
          s.details.push({
            name: personName,
            role: roleDef.label,
            contentId: r.content_uid || r.id,
            slug: r.slug_name,
            type: r.content_type,
            channel: r.channel,
            status: r.status,
            publishTime: r.scheduled_publish_time,
            row: r
          });
        }
      });
    });

    const finalData = [];
    const roleSet = new Set();
    Object.values(stats).forEach(s => {
      if (s.contents.size > 0) {
        s.total = s.contents.size;
        s.published = Array.from(s.contents.values()).filter(c => c.status === 'Published').length;
        Object.keys(s.roles).forEach(k => roleSet.add(k));
        finalData.push(s);
      }
    });

    const sortedRoles = ALL_ROLES.filter(r => roleSet.has(r.label)).map(r => r.label);
    finalData.sort((a, b) => b.total - a.total);
    setActiveRoles(sortedRoles);
    setData(finalData);
  }, [reportRows, localRange, team]);

  const handleExport = () => {
    import('xlsx-js-style').then(XLSX => {
      const summarySheet = data.map(d => {
        const row = { Name: d.name, 'Total contents': d.total, 'Published': d.published };
        activeRoles.forEach(r => row[r] = d.roles[r] || 0);
        return row;
      });

      const detailsSheet = [];
      data.forEach(d => {
        d.details.forEach(det => {
          detailsSheet.push({
            Name: det.name,
            Role: det.role,
            'Content ID': det.contentId,
            'Slug Name': det.slug,
            Type: det.type,
            Channel: det.channel,
            Status: det.status,
            'Publish time': det.publishTime ? new Date(det.publishTime).toLocaleString() : ''
          });
        });
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailsSheet), 'Details');
      XLSX.writeFile(wb, `Employee_Report_${Date.now()}.xlsx`);
    });
  };

  const toDateInput = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  };

  const handleDateChange = (field, val) => {
    if (!val) return;
    const d = new Date(val);
    d.setHours(0,0,0,0);
    if (!isNaN(d.getTime())) {
      setLocalRange(prev => ({ ...prev, [field]: d }));
    }
  };

  return (
    <FullScreenCard onClose={onClose} title="Employee Report">
      <div className="flex flex-col h-full bg-[#121215]">
        <div className="flex flex-wrap items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-zinc-500">From</label>
              <input type="date" className={inputBase + " [color-scheme:dark] w-36 !py-1"} value={toDateInput(localRange.start)} onChange={e => handleDateChange('start', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-zinc-500">To</label>
              <input type="date" className={inputBase + " [color-scheme:dark] w-36 !py-1"} value={toDateInput(localRange.end)} onChange={e => handleDateChange('end', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading ? <span className="text-[12px] text-zinc-500">Loading...</span> : null}
            {loadError ? <span className="text-[12px] text-red-300">{loadError}</span> : null}
            <button className={btnGhost} onClick={handleExport} disabled={loading}>
              <Icon name="download" /> Download Excel
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-auto bg-[#1a1a1f]">
          <table className="w-full text-left text-[13px] border border-white/[0.08] rounded-xl overflow-hidden">
            <thead className="bg-[#121215]">
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Total contents</th>
                <th className="px-4 py-3">Published</th>
                {activeRoles.map(r => <th key={r} className="px-4 py-3">{r}</th>)}
                <th className="px-4 py-3">Content IDs</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">{d.total}</td>
                  <td className="px-4 py-3 text-sky-400">{d.published}</td>
                  {activeRoles.map(r => (
                    <td key={r} className="px-4 py-3 text-zinc-300">{d.roles[r] || 0}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(d.contents.values()).map(c => (
                        <button key={c.id} className="text-[11px] font-mono text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] px-1.5 py-0.5 rounded transition" onClick={() => onOpenContent(c)}>
                          {c.content_uid || c.id}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={activeRoles.length + 4} className="px-4 py-8 text-center text-zinc-500">No data found for this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FullScreenCard>
  );
}

function DirectoryModal({ team, onClose }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const list = (team || [])
    .filter((m) => m && m.active !== false)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    .filter((m) => {
      if (!q) return true;
      const haystack = [
        m.full_name,
        m.designation,
        m.employee_id,
        m.phone,
        m.whatsapp,
        m.email,
      ];
      return haystack.some((val) => val && String(val).toLowerCase().includes(q));
    });

  return (
    <ModalShell title="Team directory" subtitle={`${list.length} members`} onClose={onClose} wide>
      <input
        className={inputBase}
        placeholder="Search name, designation, ID or number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {list.length === 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500">No member found</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Avatar member={m} size="h-10 w-10" text="text-[14px]" />
                <span className="text-[14px] font-medium text-white">{m.full_name}</span>
                {m.nickname ? <span className="text-[12px] text-zinc-500">({m.nickname})</span> : null}
                <RoleBadge role={m.role} />
                <DesignationPill designation={m.designation} />
              </div>
              <div className="mt-3 space-y-1">
                {m.employee_id ? <div className="text-[12px] text-zinc-400">ID: {m.employee_id}</div> : null}
                {m.email ? (
                  <div className="text-[12px] text-zinc-400">
                    <a href={`mailto:${m.email}`} className="text-sky-400 hover:underline">
                      {m.email}
                    </a>
                  </div>
                ) : null}
                {m.phone ? (
                  <div className="text-[12px] text-zinc-400">
                    <a href={`tel:${m.phone}`} className="text-sky-400 hover:underline">
                      {m.phone}
                    </a>
                  </div>
                ) : null}
                {m.whatsapp ? (
                  <div className="text-[12px] text-zinc-400">
                    <a
                      href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      {"WhatsApp: " + m.whatsapp}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function PublishTimeModal({ row, defaultIso, onClose, onConfirm }) {
  const [when, setWhen] = useState(toLocalInput(defaultIso));
  const maxNow = toLocalInput(new Date().toISOString());
  const iso = when ? fromLocalInput(when) : '';
  const future = !!iso && new Date(iso).getTime() > Date.now() + 60000;
  return (
    <ModalShell
      title="Confirm publish time"
      subtitle={row.slug_name || row.title || ''}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={!iso || future} onClick={() => onConfirm(iso)}>Confirm published</button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-zinc-400">
          Scheduled for: {row.scheduled_publish_time ? formatStamp(row.scheduled_publish_time) : 'not set'}
        </p>
        <Field label="When did it go live?" hint="Reports use this time. Change it only if it went live at a different time.">
          <input type="datetime-local" value={when} max={maxNow} onChange={(e) => setWhen(e.target.value)} className={`${inputBase} [color-scheme:dark]`} />
        </Field>
        {future ? <p className="text-[12px] text-red-400">The publish time cannot be in the future.</p> : null}
      </div>
    </ModalShell>
  );
}

export { NewContentModal, AddChannelModal, AddPlatformModal, ReasonModal, TeamModal, KpiModal, BulkScheduleModal, ProfileModal, MyWorkModal, EmployeeReportModal, DirectoryModal, PublishTimeModal };


export function BackupModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const performBackup = async (format) => {
    setLoading(true);
    setError('');
    setProgress('Starting backup...');
    try {
      const tables = ['contents', 'team_members', 'channels', 'notifications', 'organizations'];
      const dbData = {};
      const readmeNotes = [];

      for (const table of tables) {
        setProgress(`Fetching ${table}...`);
        let allRows = [];
        let page = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error: err } = await supabase
            .from(table)
            .select('*')
            .order('id', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          if (err) throw new Error(`Table ${table} failed: ${err.message}`);
          if (!data || data.length === 0) break;
          allRows = allRows.concat(data);
          setProgress(`Fetching ${table}... ${allRows.length} rows`);
          if (data.length < pageSize) break;
          page++;
        }
        dbData[table] = allRows;
      }

      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

      if (format === 'json') {
        setProgress('Generating JSON file...');
        const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wavedesk-backup-${stamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        setProgress('Generating Excel file...');
        const XLSX = await import('xlsx-js-style');
        const wb = XLSX.utils.book_new();

        for (const table of tables) {
          const rows = dbData[table];
          const sheetData = rows.map((row, rowIndex) => {
            const outRow = {};
            for (const [key, val] of Object.entries(row)) {
              if (val === null || val === undefined) {
                outRow[key] = '';
              } else if (typeof val === 'object') {
                const str = JSON.stringify(val);
                if (str.length > 32767) {
                  outRow[key] = str.substring(0, 32764) + '...';
                  readmeNotes.push(`Table: ${table}, Row: ${row.id || rowIndex}, Field: ${key} was truncated (>32767 chars).`);
                } else {
                  outRow[key] = str;
                }
              } else {
                const str = String(val);
                if (str.length > 32767) {
                  outRow[key] = str.substring(0, 32764) + '...';
                  readmeNotes.push(`Table: ${table}, Row: ${row.id || rowIndex}, Field: ${key} was truncated (>32767 chars).`);
                } else {
                   outRow[key] = val;
                }
              }
            }
            return outRow;
          });
          if (sheetData.length === 0) {
             XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ _empty: true }]), table.substring(0, 31));
          } else {
             XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), table.substring(0, 31));
          }
        }

        if (readmeNotes.length > 0) {
          const readmeData = readmeNotes.map(note => ({ Note: note }));
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(readmeData), 'README');
        } else {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Note: 'No data was truncated.' }]), 'README');
        }

        XLSX.writeFile(wb, `wavedesk-backup-${stamp}.xlsx`);
      }
      
      setProgress('Backup complete!');
      setTimeout(() => setProgress(''), 3000);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Backup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Database Backup" subtitle="Export your workspace data" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-zinc-400 text-sm">
          <Icon name="info" className="inline-block mr-1.5 h-4 w-4 text-sky-400" />
          This is a data export, not a full database backup.
        </div>
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {progress && (
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm animate-pulse">
            {progress}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button className={btnPrimary + " flex-1"} onClick={() => performBackup('json')} disabled={loading}>
            <Icon name="download" /> Download Backup (JSON)
          </button>
          <button className={btnPrimary + " flex-1"} onClick={() => performBackup('excel')} disabled={loading}>
            <Icon name="download" /> Download Backup (Excel)
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
