import React from 'react';
import { downloadContentArchive, downloadKPIReport, downloadFullSystemBackup } from '../../services/exportService';
import { Icon } from './Icons';

export function ArchiveButton({ row }) {
  return (
    <button
      onClick={() => downloadContentArchive(row)}
      title="Download Full Archive (PDF + Script + Logs)"
      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-[12px] font-medium text-indigo-300 transition hover:bg-indigo-500/20"
    >
      <Icon name="download" className="h-3.5 w-3.5" />
      Archive ZIP
    </button>
  );
}

export function KPIReportButton({ rows }) {
  return (
    <button
      onClick={() => downloadKPIReport(rows)}
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-2 text-[13px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
    >
      <Icon name="chart" className="h-4 w-4" />
      Download KPI Excel
    </button>
  );
}

export function SystemBackupButton({ allData }) {
  return (
    <button
      onClick={() => downloadFullSystemBackup(allData)}
      className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-300 transition hover:bg-red-500/20"
    >
      <Icon name="shield" className="h-4 w-4" />
      Backup Entire System
    </button>
  );
}
