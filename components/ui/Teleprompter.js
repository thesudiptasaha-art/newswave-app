import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clampFontSize, speedToPixelsPerSecond, computeScroll } from '../../utils/teleprompter';

function SvgIcon({ path, className = "h-5 w-5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  pause: "M10 9v6m4-6v6 M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  close: "M6 18L18 6M6 6l12 12",
  restart: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

export function Teleprompter({ text, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [fontSize, setFontSize] = useState(56);
  const [mirror, setMirror] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const reqRef = useRef(null);
  const lastTimeRef = useRef(null);
  const hideTimerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const posRef = useRef(0);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wd-prompter');
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.speed === 'number') setSpeed(Math.max(1, Math.min(10, p.speed)));
        if (typeof p.fontSize === 'number') setFontSize(clampFontSize(p.fontSize));
        if (typeof p.mirror === 'boolean') setMirror(p.mirror);
      }
    } catch (e) {}
  }, []);

  // Save settings on change
  useEffect(() => {
    try {
      window.localStorage.setItem('wd-prompter', JSON.stringify({ speed, fontSize, mirror }));
    } catch (e) {}
  }, [speed, fontSize, mirror]);

  // Wake lock
  useEffect(() => {
    let cancelled = false;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          if (cancelled) {
            lock.release().catch(() => {});
          } else {
            wakeLockRef.current = lock;
          }
        }
      } catch (err) {}
    };
    const handleVis = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', handleVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVis);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Auto-hide controls
  const pingControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    pingControls();
    return () => clearTimeout(hideTimerRef.current);
  }, [playing, pingControls]);

  // Scroll loop
  const loop = useCallback((time) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    let delta = time - lastTimeRef.current;
    if (delta > 100) delta = 100; // cap delta
    lastTimeRef.current = time;

    if (containerRef.current) {
      const c = containerRef.current;
      const pxPerSec = speedToPixelsPerSecond(speed);
      
      posRef.current = computeScroll(posRef.current, delta, pxPerSec);
      c.scrollTop = posRef.current;
      
      // Stop at end
      if (posRef.current >= c.scrollHeight - c.clientHeight - 1) {
        setPlaying(false);
        return; // stop loop
      }
    }
    reqRef.current = requestAnimationFrame(loop);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = null;
      reqRef.current = requestAnimationFrame(loop);
    } else {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [playing, loop]);

  
  const togglePlay = useCallback(() => {
    setPlaying(p => {
      if (!p && containerRef.current) {
        const c = containerRef.current;
        if (posRef.current >= c.scrollHeight - c.clientHeight - 1) {
          posRef.current = 0;
          c.scrollTop = 0;
        }
      }
      return !p;
    });
  }, []);

  const handleScroll = (e) => {
    const c = e.target;
    if (Math.abs(c.scrollTop - posRef.current) > 2) {
      posRef.current = c.scrollTop;
    }
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      const isTarget = ['Escape', ' ', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'm', 'M', 'r', 'R'].includes(e.key);
      if (isTarget) {
        e.stopPropagation();
      } else {
        return;
      }
      
      pingControls();
      
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSpeed(s => Math.min(10, s + 1)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSpeed(s => Math.max(1, s - 1)); }
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setFontSize(s => clampFontSize(s + 4)); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); setFontSize(s => clampFontSize(s - 4)); }
      if (e.key.toLowerCase() === 'm') { e.preventDefault(); setMirror(m => !m); }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        posRef.current = 0;
        if (containerRef.current) containerRef.current.scrollTop = 0;
        setPlaying(true);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onClose, pingControls]);

  const btnClass = "rounded text-white/70 hover:text-white hover:bg-white/10 transition flex items-center justify-center min-w-[36px] min-h-[36px]";

  const preventFocus = (e) => e.preventDefault();

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black text-white" 
      style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
      onMouseMove={pingControls}
      onTouchStart={pingControls}
    >
      {/* Reading guide */}
      <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500/30" style={{ top: '35%' }} />
      <div className="pointer-events-none absolute left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent h-32 top-0" />
      <div className="pointer-events-none absolute left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent h-32 bottom-0" />

      {/* Scroller */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-auto no-scrollbar"
        style={{ transform: mirror ? 'scaleX(-1)' : '' }}
        onScroll={handleScroll}
      >
        <div className="mx-auto max-w-4xl px-8" style={{ paddingTop: '80vh', paddingBottom: '80vh' }}>
          <div 
            ref={contentRef}
            className="whitespace-pre-wrap font-medium" 
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
          >
            {text}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center flex-wrap justify-center max-w-[96vw] gap-1 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3 rounded-full bg-zinc-900/90 shadow-2xl backdrop-blur transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <button onClick={togglePlay} onMouseDown={preventFocus} className={btnClass} title="Play/Pause (Space)">
          <SvgIcon path={playing ? ICONS.pause : ICONS.play} className="h-7 w-7" />
        </button>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <button onClick={() => { posRef.current = 0; if (containerRef.current) containerRef.current.scrollTop = 0; setPlaying(true); }} onMouseDown={preventFocus} className={btnClass} title="Restart (R)">
          <SvgIcon path={ICONS.restart} />
        </button>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <div className="flex items-center gap-1 text-[13px] font-mono font-semibold text-white/70">
          Speed
          <button onClick={() => setSpeed(s => Math.max(1, s - 1))} onMouseDown={preventFocus} className={btnClass} title="Slower (Down)">-</button>
          <span className="w-4 text-center">{speed}</span>
          <button onClick={() => setSpeed(s => Math.min(10, s + 1))} onMouseDown={preventFocus} className={btnClass} title="Faster (Up)">+</button>
        </div>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <div className="flex items-center gap-1 text-[13px] font-mono font-semibold text-white/70">
          Font
          <button onClick={() => setFontSize(s => clampFontSize(s - 4))} onMouseDown={preventFocus} className={btnClass} title="Smaller (-)">-</button>
          <button onClick={() => setFontSize(s => clampFontSize(s + 4))} onMouseDown={preventFocus} className={btnClass} title="Larger (+)">+</button>
        </div>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <button onClick={() => setMirror(m => !m)} onMouseDown={preventFocus} className={`${btnClass} ${mirror ? '!text-sky-400' : ''}`} title="Mirror (M)">M</button>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <button onClick={onClose} onMouseDown={preventFocus} className={btnClass} title="Close (Esc)">
          <SvgIcon path={ICONS.close} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  , document.body);
}
