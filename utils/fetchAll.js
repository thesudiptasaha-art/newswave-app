/* Supabase returns at most 1000 rows per request. This loads every page. */
export async function fetchAllPages(buildQuery, pageSize = 1000, maxPages = 50) {
  const all = [];
  for (let page = 0; page < maxPages; page += 1) {
    const { data, error } = await buildQuery().range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) return { data: null, error };
    const list = data || [];
    all.push(...list);
    if (list.length < pageSize) break;
  }
  return { data: all, error: null };
}
