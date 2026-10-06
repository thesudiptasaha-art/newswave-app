import React from 'react';
import { Icon } from './Icons';
import { isManager, can } from '../../utils/helpers';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

export function ActionButtons({ actions, onRun, compact = false }) {
  if (!actions.length) return <p className={compact ? 'text-[12px] text-zinc-600' : 'text-[13px] text-zinc-600'}>{compact ? '-' : 'No actions available for you at this stage.'}</p>;
  const size = compact ? ' !px-2.5 !py-1 !text-[11px]' : '';
  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {actions.map((a) => {
        let cls = (a.tone === 'primary' ? btnPrimary : a.tone === 'danger' ? btnDanger : btnGhost) + size;
        const disabled = !a.allowed || !!a.blocked;
        let content = a.label;
        let titleText = a.blocked ? a.blocked : !a.allowed ? a.why : '';

        if (compact && a.id === 'download_script') {
          cls = cls.replace('inline-flex', 'hidden md:inline-flex').replace('!px-2.5', '!px-2');
          content = <Icon name="download" />;
          titleText = titleText || "Download Zip";
        }

        return (
          <button
            key={a.id}
            disabled={disabled}
            onClick={() => onRun(a)}
            title={titleText}
            className={cls}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
