'use client';

import { ModalShell, btnPrimary } from './Shared';

export function HowItWorksModal({ onClose }) {
  return (
    <ModalShell
      title="How it works"
      subtitle="A 1-minute guide to WaveDesk"
      wide={false}
      onClose={onClose}
      footer={
        <button className={btnPrimary} onClick={onClose}>
          Got it
        </button>
      }
    >
      <div className="space-y-5 text-[13px] leading-relaxed text-zinc-300">
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Where things are
          </h3>
          <p>
            Rundown: all content for the selected dates. Click any row to open its details. Parking Zone: content that has no publish date, or is On Hold. Bin: dropped content. Bell: your own notifications. Menu (the three-line button): theme, Directory, Workspace Management and KPI.
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Content steps
          </h3>
          <p>
            Draft -&gt; Script Submitted -&gt; (script approved) -&gt; Ready for Shoot -&gt; Shooting -&gt; Assign Editor -&gt; Editing -&gt; Video Review -&gt; Ready to Publish -&gt; Published.
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Shortcuts for some types
          </h3>
          <p>
            LIVE: after the script is approved it goes straight to Published. PACKAGE: after the script is approved it goes straight to Assign Editor (no shoot).
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Who can do what
          </h3>
          <p>
            Buttons you cannot use are locked. Hover a locked button to see which Access you need. Ask a Manager or the Owner to change your Roles or Access.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
