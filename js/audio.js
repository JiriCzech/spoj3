const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, duration, type = 'sine', gain = 0.15) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      o.start(c.currentTime);
      o.stop(c.currentTime + duration);
    } catch(e) {}
  }

  function sweep(freqStart, freqEnd, duration, type = 'sine', gain = 0.12) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freqStart, c.currentTime);
      o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + duration);
      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      o.start(c.currentTime);
      o.stop(c.currentTime + duration);
    } catch(e) {}
  }

  return {
    toggle() { enabled = !enabled; return enabled; },
    isEnabled() { return enabled; },

    match()    { sweep(300, 600, 0.15, 'square', 0.08); },
    bigMatch() { sweep(300, 800, 0.2, 'square', 0.1); setTimeout(() => sweep(500, 1000, 0.15, 'sine', 0.07), 80); },
    combo()    { sweep(400, 900, 0.18, 'sine', 0.1); setTimeout(() => sweep(600, 1200, 0.15, 'sine', 0.08), 100); },
    invalid()  { sweep(300, 150, 0.2, 'sawtooth', 0.08); },
    hackComplete() {
      [0, 100, 200].forEach((delay, i) => {
        setTimeout(() => sweep(440 * Math.pow(1.26, i), 880 * Math.pow(1.26, i), 0.3, 'sine', 0.1), delay);
      });
    },
    gameOver() {
      sweep(400, 80, 0.6, 'sawtooth', 0.15);
      setTimeout(() => sweep(200, 50, 0.8, 'sawtooth', 0.1), 300);
    },
    buy()      { sweep(500, 700, 0.1, 'sine', 0.1); setTimeout(() => sweep(700, 900, 0.1, 'sine', 0.08), 80); },
    select()   { beep(440, 0.08, 'sine', 0.06); },
    cascade()  { sweep(200, 500, 0.25, 'triangle', 0.07); },
  };
})();

window.Audio = Audio;
