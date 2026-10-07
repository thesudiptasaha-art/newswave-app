import { SCRIPT_WORDS_PER_MINUTE } from './constants';

/*
  Examples:
  130 words -> "1:00"
  65 words -> "0:30"
  0 words -> "0:00"
  300 words -> "2:18"
*/
export function scriptStats(text) {
  const str = text || '';
  const trimmed = str.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const seconds = Math.round((words / SCRIPT_WORDS_PER_MINUTE) * 60);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const label = `${m}:${s < 10 ? '0' : ''}${s}`;
  return { words, seconds, label };
}
