let audioCtx = null;
let unlocked = false;

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    } catch (e) {
      // ignore
    }
  }
  return audioCtx;
}

export function unlockAudio() {
  if (typeof window === 'undefined') return;
  if (unlocked) return;
  unlocked = true; // prevent attaching multiple listeners
  const unlock = () => {
    try {
      const ctx = getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      unlocked = true;
    } catch (e) {
      // ignore
    } finally {
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    }
  };
  document.addEventListener('click', unlock, true);
  document.addEventListener('touchstart', unlock, true);
}

let lastPlayedAt = 0;

export function playChime() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') return; // Do not play if not unlocked yet (browsers block it)
    
    if (Date.now() - lastPlayedAt < 2000) return;
    lastPlayedAt = Date.now();
    
    const now = ctx.currentTime;
    
    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, now);
    
    // Smooth attack to peak 0.12 and then exponential decay
    masterGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    // frequencies for a gentle Dmaj arpeggio (D5, A5, F#5)
    // 587.33, 880.00, 739.99
    const notes = [
      { f: 587.33, d: 0 },
      { f: 880.00, d: 0.15 },
      { f: 739.99, d: 0.3 }
    ];
    
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = note.f;
      
      oscGain.gain.setValueAtTime(0, now + note.d);
      oscGain.gain.linearRampToValueAtTime(1, now + note.d + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + note.d + 0.4);
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      
      osc.start(now + note.d);
      osc.stop(now + note.d + 0.5);
    });
    
  } catch (e) {
    // ignore
  }
}
