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
 */
export async function createNotice({ organizationId, title, body, authorId, authorName, priority = 'normal' }) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  const { data, error } = await supabase
    .from('notices')
    .insert({
      organization_id: organizationId,
      title: title.trim(),
      body: body.trim(),
      author_id: authorId || null,
      author_name: authorName,
      priority,
    })
    .select()
    .single();

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
