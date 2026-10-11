'use client';

import { useState } from 'react';
import { Icon } from './Icons';
import { inputBase, btnPrimary, btnGhost, btnDanger, ModalShell } from './Shared';
import { isManager, isOwner, formatStamp } from '../../lib/core';

/**
 * NoticeModal Component (N12)
 * Organization-wide bulletin board for editorial and station announcements.
 */
export function NoticeModal({ notices = [], actor, onClose, onPostNotice, onDeleteNotice }) {
  const canManage = actor && (isManager(actor) || isOwner(actor));
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('শিরোনাম এবং বিবরণ উভয়ই আবশ্যক');
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
        setError('নোটিশ পোস্ট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError(err?.message || 'নোটিশ পোস্ট করতে ব্যর্থ হয়েছে।');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?')) return;
    setDeletingId(id);
    try {
      await onDeleteNotice(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ModalShell
      title="নোটিশ বোর্ড (Notice Board)"
      subtitle="স্টেশনের সম্পাদকীয় ও অফিশিয়াল নির্দেশনাবলী"
      wide
      onClose={onClose}
    >
      <div className="flex flex-col gap-5 p-5 max-h-[75vh] overflow-y-auto">
        {/* Top Action Bar for Managers */}
        {canManage && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                কর্তৃপক্ষ প্যানেল
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
                {showForm ? 'বাতিল করুন' : '+ নতুন নোটিশ দিন'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    className={inputBase + ' flex-1 text-[13px]'}
                    placeholder="নোটিশের শিরোনাম..."
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
                    <option value="normal">সাধারণ (Normal)</option>
                    <option value="urgent">জরুরি (Urgent)</option>
                    <option value="info">তথ্য (Info)</option>
                  </select>
                </div>

                <textarea
                  className={inputBase + ' text-[13px] min-h-[90px] leading-relaxed'}
                  placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন..."
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
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className={btnPrimary + ' text-[12px]'}
                    disabled={posting}
                  >
                    {posting ? 'পোস্ট হচ্ছে...' : 'প্রচার করুন (Post)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Notices Feed */}
        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-zinc-500">
              বর্তমানে কোনো নোটিশ নেই।
            </div>
          ) : (
            notices.map((n) => {
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
  );
}
