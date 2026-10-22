'use client';

import { useState, useMemo } from 'react';
import { Icon } from './Icons';
import { inputBase, btnPrimary, btnGhost, btnDanger, ModalShell, ConfirmDialog } from './Shared';
import { isManager, isOwner, formatStamp } from '../../lib/core';
import { copyText } from '../../utils/helpers';

/**
 * NoticeModal Component (N12)
 * Organization-wide bulletin board for editorial and station announcements.
 */
export function NoticeModal({ notices = [], actor, onClose, onPostNotice, onDeleteNotice }) {
  const canManage = actor && (isManager(actor) || isOwner(actor));
  
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUid, setCopiedUid] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and details are both required');
      return;
    }
    setError('');
    setPosting(true);
    try {
      const ok = await onPostNotice({
        title: title.trim(),
        body: body.trim(),
        priority,
      });
      if (ok) {
        setTitle('');
        setBody('');
        setPriority('normal');
        setShowForm(false);
      } else {
        setError('Could not post the notice.');
      }
    } catch (err) {
      setError(err?.message || 'Could not post the notice.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const runDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDeleteNotice(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUid = async (uidText) => {
    if (!uidText) return;
    const ok = await copyText(uidText);
    if (ok) {
      setCopiedUid(uidText);
      setTimeout(() => {
        setCopiedUid((cur) => (cur === uidText ? null : cur));
      }, 2000);
    }
  };

  // Ensure every notice has a human-readable notice_uid even if DB has null/empty
  const noticesWithUid = useMemo(() => {
    const byDay = {};
    const sorted = [...notices].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );

    const uidMap = new Map();

    sorted.forEach((n) => {
      if (n.notice_uid && String(n.notice_uid).trim()) {
        uidMap.set(n.id, String(n.notice_uid).trim());
      } else {
        const d = n.created_at ? new Date(n.created_at) : new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dayKey = `${yyyy}${mm}${dd}`;

        if (!byDay[dayKey]) byDay[dayKey] = 0;
        byDay[dayKey] += 1;

        uidMap.set(n.id, `NOTICE-${dayKey}_${String(byDay[dayKey]).padStart(3, '0')}`);
      }
    });

    return notices.map((n) => ({
      ...n,
      notice_uid: uidMap.get(n.id) || n.notice_uid || `NOTICE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_001`,
    }));
  }, [notices]);

  // Filter notices by notice_uid, title, body, and author_name
  const filteredNotices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return noticesWithUid;
    return noticesWithUid.filter((n) => {
      const uid = String(n.notice_uid || '').toLowerCase();
      const t = String(n.title || '').toLowerCase();
      const b = String(n.body || '').toLowerCase();
      const author = String(n.author_name || '').toLowerCase();
      return uid.includes(q) || t.includes(q) || b.includes(q) || author.includes(q);
    });
  }, [noticesWithUid, searchQuery]);

  return (
    <>
      <ModalShell
      title="Notice Board"
      subtitle="Editorial and official instructions for the station"
      wide
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 p-5 max-h-[75vh] overflow-y-auto">
        {/* Top Action Bar for Managers */}
        {canManage && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Manage notices
              </span>
              <button
                type="button"
                className={btnGhost + ' !py-1 text-[12px]'}
                onClick={() => {
                  setShowForm(!showForm);
                  setError('');
                }}
              >
                <Icon name={showForm ? 'x' : 'plus'} className="h-3.5 w-3.5" />
                {showForm ? 'Cancel' : '+ New notice'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    className={inputBase + ' flex-1 text-[13px]'}
                    placeholder="Notice title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                  <select
                    className={inputBase + ' text-[12px] sm:w-[130px]'}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <textarea
                  className={inputBase + ' text-[13px] min-h-[90px] leading-relaxed'}
                  placeholder="Write the notice details..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                />

                {error && <div className="text-[12px] text-red-400">{error}</div>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className={btnGhost + ' text-[12px]'}
                    onClick={() => setShowForm(false)}
                    disabled={posting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={btnPrimary + ' text-[12px]'}
                    disabled={posting}
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices (ID such as NOTICE-20261012_001, title or details)..."
              className={`${inputBase} !py-2 pl-9 pr-9 text-[13px]`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition p-1"
                title="Clear search"
                aria-label="Clear search"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>
                {filteredNotices.length} {filteredNotices.length === 1 ? 'notice' : 'notices'} found for &ldquo;<span className="text-zinc-200 font-medium">{searchQuery}</span>&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Show all notices
              </button>
            </div>
          )}
        </div>

        {/* Notices Feed */}
        <div className="space-y-3">
          {filteredNotices.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-zinc-500">
              {searchQuery ? (
                <div className="flex flex-col items-center gap-2">
                  <Icon name="search" className="h-6 w-6 text-zinc-600 mb-0.5" />
                  <span>No notice found for &ldquo;{searchQuery}&rdquo;.</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[12px] text-sky-400 hover:underline cursor-pointer mt-1"
                  >
                    Reset search
                  </button>
                </div>
              ) : (
                'There are no notices right now.'
              )}
            </div>
          ) : (
            filteredNotices.map((n) => {
              const isUrgent = n.priority === 'urgent';
              const isInfo = n.priority === 'info';
              return (
                <article
                  key={n.id}
                  className={`relative rounded-xl p-4 transition border ${
                    isUrgent
                      ? 'border-red-500/30 bg-red-500/[0.04]'
                      : isInfo
                      ? 'border-sky-500/20 bg-sky-500/[0.02]'
                      : 'border-white/[0.07] bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {n.notice_uid && (
                          <button
                            type="button"
                            onClick={() => handleCopyUid(n.notice_uid)}
                            className="group inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-emerald-400 border border-emerald-500/25 transition cursor-pointer"
                            title="Click to copy the ID"
                          >
                            <span>{n.notice_uid}</span>
                            <Icon
                              name={copiedUid === n.notice_uid ? 'check' : 'copy'}
                              className="h-3 w-3 opacity-60 group-hover:opacity-100 transition"
                            />
                            {copiedUid === n.notice_uid && (
                              <span className="text-[10px] text-emerald-300 font-sans font-normal">Copied!</span>
                            )}
                          </button>
                        )}
                        {isUrgent ? (
                          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                            Urgent
                          </span>
                        ) : isInfo ? (
                          <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            Notice
                          </span>
                        ) : null}
                        <h4 className="text-[14px] font-semibold text-zinc-100">{n.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-2">
                        <span>{n.author_name}</span>
                        <span>•</span>
                        <span>{formatStamp(n.created_at)}</span>
                      </div>

                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300">
                        {n.body}
                      </p>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        disabled={deletingId === n.id}
                        className="text-zinc-500 hover:text-red-400 transition p-1"
                        title="Delete notice"
                        aria-label="Delete notice"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </ModalShell>
    {confirmId ? (
      <ConfirmDialog
        title="Delete notice"
        message="Are you sure you want to delete this notice?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { const id = confirmId; setConfirmId(null); runDelete(id); }}
      />
    ) : null}
  </>
  );
}
