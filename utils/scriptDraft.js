export function saveDraft(storage, key, record) {
  try {
    if (!storage) return;
    storage.setItem(key, JSON.stringify(record));
  } catch (e) {}
}

export function loadDraft(storage, key) {
  try {
    if (!storage) return null;
    const val = storage.getItem(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

export function clearDraft(storage, key) {
  try {
    if (!storage) return;
    storage.removeItem(key);
  } catch (e) {}
}

export function purgeOldDrafts(storage, maxAgeDays = 30, maxCount = 50) {
  try {
    if (!storage) return;
    const prefix = 'wd-script-draft:';
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    
    let drafts = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const val = storage.getItem(key);
          const parsed = JSON.parse(val);
          drafts.push({ key, savedAt: new Date(parsed.savedAt).getTime() });
        } catch (e) {
          storage.removeItem(key); // clear corrupted
        }
      }
    }
    
    // sort by savedAt descending (newest first)
    drafts.sort((a, b) => b.savedAt - a.savedAt);
    
    drafts.forEach((d, index) => {
      const ageMs = now - d.savedAt;
      if (ageMs > maxAgeMs || index >= maxCount) {
        storage.removeItem(d.key);
      }
    });
  } catch (e) {}
}
