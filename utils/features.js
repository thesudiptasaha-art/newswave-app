/* this is where per-customer plans will switch features on or off later */
export const FEATURES = { notices: true, revenue: true, platform_tracking: true, show_forms: true, teleprompter: true, notif_sound: true, script_drafts: true, themes: true, graphic_design: true, bulk_schedule: true, reports: true, backup: true, rich_editor: true,
};

export function isFeatureEnabled(key) {
  return FEATURES[key] !== false;
}
