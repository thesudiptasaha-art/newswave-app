import { supabase } from './supabase';

/**
 * Notice Service for WaveDesk (N12)
 * All Supabase database calls related to station/editorial notices.
 */

/**
 * Fetches the latest notices for an organization (newest first).
 * @param {string} organizationId
 * @param {number} limit
 */
export async function fetchNotices(organizationId, limit = 50) {
  if (!supabase || !organizationId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Creates a new notice (Managers/Owners only, enforced by RLS).
 * @param {Object} noticeData
 * @param {string} noticeData.organizationId
 * @param {string} noticeData.title
 * @param {string} noticeData.body
 * @param {string} [noticeData.authorId]
 * @param {string} noticeData.authorName
 * @param {'normal'|'urgent'|'info'} [noticeData.priority]
 * @param {string} [noticeData.noticeUid]
 */
export async function createNotice({ organizationId, title, body, authorId, authorName, priority = 'normal', noticeUid }) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  let uidToInsert = noticeUid;
  if (!uidToInsert) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayPrefix = `NOTICE-${yyyy}${mm}${dd}_`;

    try {
      const { data: existing } = await supabase
        .from('notices')
        .select('notice_uid')
        .eq('organization_id', organizationId)
        .ilike('notice_uid', `${todayPrefix}%`);

      const nextNum = (existing || []).length + 1;
      uidToInsert = `${todayPrefix}${String(nextNum).padStart(3, '0')}`;
    } catch (e) {
      uidToInsert = `${todayPrefix}001`;
    }
  }

  const payload = {
    organization_id: organizationId,
    title: title.trim(),
    body: body.trim(),
    author_id: authorId || null,
    author_name: authorName,
    priority,
  };

  if (uidToInsert) {
    payload.notice_uid = uidToInsert;
  }

  let { data, error } = await supabase
    .from('notices')
    .insert(payload)
    .select()
    .single();

  if (error && error.message && error.message.includes('notice_uid')) {
    delete payload.notice_uid;
    const retry = await supabase.from('notices').insert(payload).select().single();
    data = retry.data;
    error = retry.error;
  }

  return { data, error };
}

/**
 * Deletes a notice by ID (Managers/Owners only, enforced by RLS).
 * @param {string} noticeId
 */
export async function deleteNotice(noticeId) {
  if (!supabase) return { error: new Error('Supabase client not initialized') };

  const { error } = await supabase
    .from('notices')
    .delete()
    .eq('id', noticeId);

  return { error };
}
