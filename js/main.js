/* =========================================================
   MERIDIAN — Deep Work Navigator
   main.js — vanilla ES6+, no dependencies
   ========================================================= */
(() => {
  'use strict';

  /* -----------------------------------------------------
     Constants & DOM refs
     ----------------------------------------------------- */
  const RING_RADIUS = 168;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ORBIT_RADIUS = 128;
  const CENTER = 220;
  const STORAGE_KEY = 'meridian.log.v1';
  const PREFS_KEY = 'meridian.prefs.v1';

  const el = {
    astrolabe: document.getElementById('astrolabe'),
    arcProgress: document.getElementById('arc-progress'),
    tickGroup: document.getElementById('tick-group'),
    labelGroup: document.getElementById('label-group'),
    orbitDots: document.getElementById('orbit-dots'),
    timeRemaining: document.getElementById('time-remaining'),
    modeLabel: document.getElementById('mode-label'),
    modeSub: document.getElementById('mode-sub'),
    sessionCountEyebrow: document.getElementById('session-count-eyebrow'),
    todayDate: document.getElementById('today-date'),

    lenBtns: Array.from(document.querySelectorAll('.len-btn')),
    startBtn: document.getElementById('start-btn'),
    startBtnLabel: document.getElementById('start-btn-label'),
    resetBtn: document.getElementById('reset-btn'),
    soundBtn: document.getElementById('sound-btn'),

    statFocusTime: document.getElementById('stat-focus-time'),
    statSessions: document.getElementById('stat-sessions'),
    statStreak: document.getElementById('stat-streak'),
    statLongest: document.getElementById('stat-longest'),

    logEntries: document.getElementById('log-entries'),
    logEmpty: document.getElementById('log-empty'),
    logScroll: document.getElementById('log-scroll'),

    navSettingsBtn: document.getElementById('nav-settings-btn'),
    drawer: document.getElementById('settings-drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerClose: document.getElementById('drawer-close'),
    breakLength: document.getElementById('break-length'),
    autoStart: document.getElementById('auto-start'),
    clearLogBtn: document.getElementById('clear-log-btn'),
  };

  /* -----------------------------------------------------
     State
     ----------------------------------------------------- */
  const state = {
    sessionMins: 45,
    breakMins: 10,
    mode: 'focus',           // 'focus' | 'break'
    remainingSeconds: 45 * 60,
    isRunning: false,
    tickHandle: null,
    endAt: null,             // epoch ms target, used so timer stays accurate in background tabs
    soundOn: true,
    autoStart: false,
  };

  let log = loadLog();

  /* -----------------------------------------------------
     Persistence
     ----------------------------------------------------- */
  function loadLog() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Meridian: could not read voyage log', e);
      return [];
    }
  }

  function saveLog() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (e) {
      console.warn('Meridian: could not save voyage log', e);
    }
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.sessionMins) state.sessionMins = prefs.sessionMins;
      if (prefs.breakMins) state.breakMins = prefs.breakMins;
      if (typeof prefs.soundOn === 'boolean') state.soundOn = prefs.soundOn;
      if (typeof prefs.autoStart === 'boolean') state.autoStart = prefs.autoStart;
    } catch (e) { /* ignore malformed prefs */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        sessionMins: state.sessionMins,
        breakMins: state.breakMins,
        soundOn: state.soundOn,
        autoStart: state.autoStart,
      }));
    } catch (e) { /* ignore */ }
  }

  /* -----------------------------------------------------
     Astrolabe dial — build tick marks + degree labels once
     ----------------------------------------------------- */
  function buildDial() {
    const majorEvery = 5; // every 5th tick is a major brass tick with a label
    const totalTicks = 60;
    let ticksHtml = '';
    let labelsHtml = '';

    for (let i = 0; i < totalTicks; i++) {
      const angle = (i / totalTicks) * 360;
      const isMajor = i % majorEvery === 0;
      const rOuter = 208;
      const rInner = isMajor ? 194 : 200;
      const p1 = polar(CENTER, CENTER, rOuter, angle);
      const p2 = polar(CENTER, CENTER, rInner, angle);
      ticksHtml += `<line class="tick${isMajor ? ' major' : ''}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`;

      if (isMajor) {
        const labelPos = polar(CENTER, CENTER, 182, angle);
        const degree = Math.round((i / totalTicks) * 360);
        labelsHtml += `<text x="${labelPos.x}" y="${labelPos.y}">${degree}°</text>`;
      }
    }

    el.tickGroup.innerHTML = ticksHtml;
    el.labelGroup.innerHTML = labelsHtml;
    el.arcProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  }

  function polar(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /* -----------------------------------------------------
     Timer engine
     ----------------------------------------------------- */
  function totalSecondsForMode() {
    return state.mode === 'focus' ? state.sessionMins * 60 : state.breakMins * 60;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderTime() {
    el.timeRemaining.textContent = formatTime(state.remainingSeconds);
    const total = totalSecondsForMode();
    const elapsed = total - state.remainingSeconds;
    const progress = Math.min(1, Math.max(0, elapsed / total));
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    el.arcProgress.style.strokeDashoffset = offset;
    el.arcProgress.classList.toggle('is-break', state.mode === 'break');
  }

  function renderMode() {
    if (state.mode === 'focus') {
      el.modeLabel.textContent = 'Focus';
      el.modeSub.textContent = state.isRunning ? 'bearing steady' : 'ready to depart';
    } else {
      el.modeLabel.textContent = 'Break';
      el.modeSub.textContent = 'drifting with the current';
    }
  }

  function setRunningUI(running) {
    el.astrolabe.classList.toggle('is-running', running);
    el.startBtn.classList.toggle('is-running', running);
    el.startBtnLabel.textContent = running ? 'Hold Position' : (state.mode === 'focus' ? 'Chart Course' : 'Begin Break');
    el.lenBtns.forEach(b => b.disabled = running);
    el.resetBtn.style.visibility = running || state.remainingSeconds !== totalSecondsForMode() ? 'visible' : 'hidden';
  }

  function tick() {
    const now = Date.now();
    const secondsLeft = Math.round((state.endAt - now) / 1000);
    state.remainingSeconds = Math.max(0, secondsLeft);
    renderTime();

    if (state.remainingSeconds <= 0) {
      completeSegment();
    }
  }

  function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.endAt = Date.now() + state.remainingSeconds * 1000;
    state.tickHandle = setInterval(tick, 250);
    renderMode();
    setRunningUI(true);
  }

  function pauseTimer() {
    if (!state.isRunning) return;
    state.isRunning = false;
    clearInterval(state.tickHandle);
    state.remainingSeconds = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
    renderMode();
    setRunningUI(false);
  }

  function resetTimer() {
    state.isRunning = false;
    clearInterval(state.tickHandle);
    state.mode = 'focus';
    state.remainingSeconds = totalSecondsForMode();
    renderMode();
    renderTime();
    setRunningUI(false);
  }

  function completeSegment() {
    state.isRunning = false;
    clearInterval(state.tickHandle);
    playChime();

    if (state.mode === 'focus') {
      logSession(state.sessionMins);
      renderStats();
      renderLog();
      renderOrbitDots();
      state.mode = 'break';
    } else {
      state.mode = 'focus';
    }

    state.remainingSeconds = totalSecondsForMode();
    renderMode();
    renderTime();
    setRunningUI(false);

    if (state.autoStart) {
      startTimer();
    }
  }

  /* -----------------------------------------------------
     Voyage log (session history)
     ----------------------------------------------------- */
  function logSession(minutes) {
    const now = new Date();
    log.push({
      ts: now.getTime(),
      minutes,
    });
    saveLog();
  }

  function todayKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function renderStats() {
    const now = new Date();
    const todayK = todayKey(now);

    const todaysEntries = log.filter(e => todayKey(new Date(e.ts)) === todayK);
    const todaysMinutes = todaysEntries.reduce((sum, e) => sum + e.minutes, 0);
    el.statFocusTime.textContent = minutesToHM(todaysMinutes);
    el.statSessions.textContent = String(todaysEntries.length);
    el.sessionCountEyebrow.textContent = String(todaysEntries.length + 1).padStart(2, '0');

    const longest = todaysEntries.reduce((max, e) => Math.max(max, e.minutes), 0);
    el.statLongest.textContent = minutesToHM(longest);

    el.statStreak.textContent = `${computeStreak()} days`;
  }

  function minutesToHM(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  function computeStreak() {
    if (log.length === 0) return 0;
    const days = new Set(log.map(e => todayKey(new Date(e.ts))));
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = todayKey(cursor);
      if (days.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        // allow "today" to be empty without breaking a streak that continued through yesterday
        if (streak === 0 && todayKey(new Date()) === key) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }

  function renderLog() {
    const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

    const sorted = [...log].sort((a, b) => a.ts - b.ts);
    el.logEntries.innerHTML = sorted.map(entry => {
      const d = new Date(entry.ts);
      return `
        <li class="log-entry">
          <span class="entry-day">${dayFmt.format(d)}</span>
          <span class="entry-dot"></span>
          <span class="entry-time">${timeFmt.format(d)}</span>
          <span class="entry-len">${entry.minutes}m</span>
        </li>`;
    }).join('');

    el.logEmpty.style.display = sorted.length ? 'none' : 'block';

    requestAnimationFrame(() => {
      el.logScroll.scrollLeft = el.logScroll.scrollWidth;
    });
  }

  function renderOrbitDots() {
    const now = new Date();
    const todayK = todayKey(now);
    const todaysEntries = log.filter(e => todayKey(new Date(e.ts)) === todayK);

    el.orbitDots.innerHTML = todaysEntries.map((_, i) => {
      const angle = (i / Math.max(8, todaysEntries.length)) * 360 - 90;
      const pos = polar(CENTER, CENTER, ORBIT_RADIUS, angle + 90);
      return `<circle class="orbit-dot" cx="${pos.x}" cy="${pos.y}" r="3.4" style="animation-delay:${i * 0.05}s" />`;
    }).join('');
  }

  /* -----------------------------------------------------
     Audio chime — synthesized, no external asset
     ----------------------------------------------------- */
  let audioCtx = null;
  function playChime() {
    if (!state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5 E5 G5 — a small, clean arrival bell
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = audioCtx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.16, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1);
      });
    } catch (e) {
      console.warn('Meridian: audio chime unavailable', e);
    }
  }

  /* -----------------------------------------------------
     Settings drawer
     ----------------------------------------------------- */
  function openDrawer() {
    el.drawer.classList.add('is-open');
    el.drawer.setAttribute('aria-hidden', 'false');
    el.drawerOverlay.classList.add('is-open');
  }
  function closeDrawer() {
    el.drawer.classList.remove('is-open');
    el.drawer.setAttribute('aria-hidden', 'true');
    el.drawerOverlay.classList.remove('is-open');
  }

  /* -----------------------------------------------------
     Event bindings
     ----------------------------------------------------- */
  function bindEvents() {
    el.lenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isRunning) return;
        el.lenBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.sessionMins = Number(btn.dataset.mins);
        state.mode = 'focus';
        state.remainingSeconds = totalSecondsForMode();
        renderTime();
        renderMode();
        setRunningUI(false);
        savePrefs();
      });
    });

    el.startBtn.addEventListener('click', () => {
      state.isRunning ? pauseTimer() : startTimer();
    });

    el.resetBtn.addEventListener('click', resetTimer);

    el.soundBtn.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      el.soundBtn.classList.toggle('is-muted', !state.soundOn);
      savePrefs();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        e.preventDefault();
        state.isRunning ? pauseTimer() : startTimer();
      }
      if (e.key === 'Escape') closeDrawer();
    });

    el.navSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
    el.drawerClose.addEventListener('click', closeDrawer);
    el.drawerOverlay.addEventListener('click', closeDrawer);

    el.breakLength.addEventListener('change', () => {
      state.breakMins = Number(el.breakLength.value);
      savePrefs();
    });

    el.autoStart.addEventListener('click', () => {
      state.autoStart = !state.autoStart;
      el.autoStart.setAttribute('aria-checked', String(state.autoStart));
      savePrefs();
    });

    el.clearLogBtn.addEventListener('click', () => {
      if (!confirm('Clear the entire voyage log? This cannot be undone.')) return;
      log = [];
      saveLog();
      renderStats();
      renderLog();
      renderOrbitDots();
    });
  }

  function isTypingTarget(target) {
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  /* -----------------------------------------------------
     Init
     ----------------------------------------------------- */
  function init() {
    loadPrefs();

    // reflect loaded prefs into UI
    el.lenBtns.forEach(b => {
      b.classList.toggle('is-active', Number(b.dataset.mins) === state.sessionMins);
    });
    el.breakLength.value = String(state.breakMins);
    el.autoStart.setAttribute('aria-checked', String(state.autoStart));
    if (!state.soundOn) el.soundBtn.classList.add('is-muted');

    state.remainingSeconds = totalSecondsForMode();

    el.todayDate.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    }).format(new Date());

    buildDial();
    renderTime();
    renderMode();
    renderStats();
    renderLog();
    renderOrbitDots();
    setRunningUI(false);
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
