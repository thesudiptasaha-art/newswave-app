import React, { useState, useEffect } from 'react';
import { Icon, LockIcon } from './Icons';
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from './Badges';

export const inputBase = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-sky-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-sky-500/10';
export const inputLocked = 'w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-zinc-400 outline-none cursor-not-allowed select-text';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
export const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
export const btnDanger = 'inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

export function Avatar({ member, name, size = 'h-6 w-6', text = 'text-[10px]' }) {
  const [failed, setFailed] = useState(false);
  const url = member && member.avatar_url;
  useEffect(() => {
    setFailed(false);
  }, [url]);
  const label = String((member && member.full_name) || name || '?').trim().slice(0, 1).toUpperCase() || '?';
  if (url && !failed) {
    return <img src={url} alt="" onError={() => setFailed(true)} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-white/10`} />;
  }
  return <span className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-semibold text-zinc-200 ring-1 ring-white/10`}>{label}</span>;
}

export function PersonName({ name, team, hideDesignation }) {
  if (!name) return <span className="text-zinc-600">—</span>;
  const m = (team || []).find((x) => x.full_name === name);
  
  if (hideDesignation) {
    const nick = m?.nickname || name.split(' ')[0];
    const prefix = m?.gender === 'female' ? 'Ms.' : 'Mr.';
    const suffix = m?.gender === 'female' ? 'মহোদয়া' : 'মহোদয়';
    return (
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <Avatar member={m} name={name} size="h-7 w-7" />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-medium text-zinc-200">{prefix} {nick}</span>
          <span className="text-[9px] text-zinc-500 font-serif mt-0.5">{suffix}</span>
        </div>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Avatar member={m} name={name} />
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="truncate text-zinc-200">{name}</span>
        {m && m.designation && !hideDesignation ? <DesignationPill designation={m.designation} /> : null}
      </span>
    </span>
  );
}

export function Field({ label, locked = false, lockMessage, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1.5">
          {label}
          {locked ? <LockIcon message={lockMessage} /> : null}
        </span>
        {hint ? <span className="normal-case tracking-normal text-zinc-600">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function SelectBox({ value, onChange, options, disabled = false, placeholder = 'Select…', className = '' }) {
  const list = useMemo(() => {
    const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
    if (value && !opts.some((o) => o.value === value)) opts.unshift({ value, label: value });
    return opts;
  }, [options, value]);
  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${disabled ? inputLocked : inputBase} appearance-none pr-9`}
      >
        <option value="" className="bg-[#121215]">
          {placeholder}
        </option>
        {list.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#121215]">
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

export function BlurInput({ value, onCommit, disabled = false, placeholder, type = 'text', multiline = false, rows = 3 }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => {
    setDraft(value || '');
  }, [value]);
  const commit = () => {
    if ((draft || '') !== (value || '')) onCommit(draft);
  };
  const common = {
    value: draft,
    disabled,
    placeholder,
    onChange: (e) => setDraft(e.target.value),
    onBlur: commit,
    className: disabled ? inputLocked : inputBase,
  };
  if (multiline) return <textarea rows={rows} {...common} />;
  return (
    <input
      type={type}
      {...common}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

export function ModalShell({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#121215]/90 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] text-zinc-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/30 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function FullScreenCard({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#121215] p-8 shadow-2xl shadow-black/60">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">NewsroomOps</div>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ on, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-white/15'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export function ActionButtons({ actions, onRun, compact = false }) {
  if (compact) actions = actions.filter(a => a.id !== 'hold' && a.id !== 'drop');
  if (!actions.length) return <p className={compact ? 'text-[12px] text-zinc-600' : 'text-[13px] text-zinc-600'}>{compact ? '—' : 'No actions available for you at this stage.'}</p>;
  const size = compact ? ' !px-2.5 !py-1 !text-[11px]' : '';
  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {actions.map((a) => {
        const cls = (a.tone === 'primary' ? btnPrimary : a.tone === 'danger' ? btnDanger : btnGhost) + size;
        const disabled = !a.allowed || !!a.blocked;
        return (
          <button
            key={a.id}
            className={cls}
            disabled={disabled}
            title={!a.allowed ? a.why : a.blocked}
            onClick={(e) => {
              e.stopPropagation();
              onRun(a);
            }}
          >
            {!a.allowed ? <Icon name="lock" className="h-3 w-3" /> : null}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

