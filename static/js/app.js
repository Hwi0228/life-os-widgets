/**
 * 🕹️ Life OS Core Engine
 * Manages desktop windows, drag-and-drop, retro web audio, layout saving, and widget registration.
 */

window.LifeOS = (function() {
  const registeredWidgets = {};
  const activeWindows = {};
  let topZIndex = 10;
  let soundEnabled = true;

  // Web Audio Context for 8-Bit Retro Sound FX
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playRetroSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success' || type === 'levelup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'delete') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // Register Widget Definition
  function registerWidget(config) {
    // config: { id, title, defaultPos: {x, y, w, h}, renderContent: function(containerElement) }
    registeredWidgets[config.id] = config;
  }

  // Create Window Element in DOM
  function createWindow(widgetId, pos = null) {
    const config = registeredWidgets[widgetId];
    if (!config) return;

    if (activeWindows[widgetId]) {
      // Bring to front
      focusWindow(widgetId);
      return;
    }

    const defaultP = pos || config.defaultPos || { x: 100, y: 80, w: 320, h: 240 };
    topZIndex += 1;

    const win = document.createElement('div');
    win.className = 'pixel-window active-window';
    win.id = `win-${widgetId}`;
    win.style.left = `${defaultP.x}px`;
    win.style.top = `${defaultP.y}px`;
    win.style.width = `${defaultP.w}px`;
    win.style.height = `${defaultP.h}px`;
    win.style.zIndex = topZIndex;

    win.innerHTML = `
      <div class="window-header" id="win-header-${widgetId}">
        <span class="window-title">${config.title}</span>
        <div class="window-actions">
          <button class="win-btn close-btn" onclick="LifeOS.closeWidget('${widgetId}')">✕</button>
        </div>
      </div>
      <div class="window-content" id="win-content-${widgetId}"></div>
    `;

    document.getElementById('desktop-canvas').appendChild(win);
    activeWindows[widgetId] = win;

    // Focus on click
    win.addEventListener('mousedown', () => focusWindow(widgetId));

    // Make Draggable
    makeDraggable(win, document.getElementById(`win-header-${widgetId}`));

    // Render Widget Inside
    const contentElem = document.getElementById(`win-content-${widgetId}`);
    if (typeof config.renderContent === 'function') {
      config.renderContent(contentElem);
    }
  }

  function focusWindow(widgetId) {
    const win = activeWindows[widgetId];
    if (win) {
      topZIndex += 1;
      win.style.zIndex = topZIndex;
      document.querySelectorAll('.pixel-window').forEach(w => w.classList.remove('active-window'));
      win.classList.add('active-window');
    }
  }

  function closeWidget(widgetId) {
    playRetroSound('click');
    const win = activeWindows[widgetId];
    if (win) {
      win.remove();
      delete activeWindows[widgetId];
    }
  }

  function toggleWidget(widgetId) {
    playRetroSound('click');
    if (activeWindows[widgetId]) {
      closeWidget(widgetId);
    } else {
      createWindow(widgetId);
    }
  }

  // Drag and Drop Logic
  function makeDraggable(winElem, headerElem) {
    let posX = 0, posY = 0, initialX = 0, initialY = 0;

    headerElem.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      initialX = e.clientX;
      initialY = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      posX = initialX - e.clientX;
      posY = initialY - e.clientY;
      initialX = e.clientX;
      initialY = e.clientY;

      let newTop = winElem.offsetTop - posY;
      let newLeft = winElem.offsetLeft - posX;

      // Keep within bounds
      if (newTop < 0) newTop = 0;
      if (newLeft < 0) newLeft = 0;

      winElem.style.top = newTop + "px";
      winElem.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Save Layout to Backend
  async function saveLayout() {
    playRetroSound('click');
    const layouts = [];
    Object.keys(registeredWidgets).forEach(widgetId => {
      const win = activeWindows[widgetId];
      if (win) {
        layouts.push({
          widget_id: widgetId,
          x: parseInt(win.style.left, 10) || 100,
          y: parseInt(win.style.top, 10) || 100,
          w: parseInt(win.style.width, 10) || 320,
          h: parseInt(win.style.height, 10) || 240,
          visible: true,
          z_index: parseInt(win.style.zIndex, 10) || 10
        });
      } else {
        layouts.push({
          widget_id: widgetId,
          x: 100, y: 100, w: 320, h: 240,
          visible: false,
          z_index: 0
        });
      }
    });

    try {
      const res = await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layouts)
      });
      if (res.ok) {
        playRetroSound('success');
        alert("💾 Widget Layout Saved!");
      }
    } catch (e) {
      console.error("Failed to save layout:", e);
    }
  }

  // Load Layout from Backend
  async function loadLayout() {
    try {
      const res = await fetch('/api/layout');
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.length > 0) {
          const savedIds = new Set();

          saved.forEach(item => {
            if (!registeredWidgets[item.widget_id]) return;
            savedIds.add(item.widget_id);

            if (item.visible) {
              createWindow(item.widget_id, {
                x: item.x, y: item.y, w: item.w, h: item.h
              });
            }
          });

          // Open newly registered widgets even when an older layout is already saved.
          Object.keys(registeredWidgets).forEach(widgetId => {
            const config = registeredWidgets[widgetId];
            if (!savedIds.has(widgetId) && config.defaultVisible !== false) {
              createWindow(widgetId, config.defaultPos);
            }
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load layout, initializing defaults:", e);
    }

    // Default startup windows
    createWindow('clock', { x: 40, y: 40, w: 300, h: 250 });
    createWindow('stats', { x: 360, y: 40, w: 320, h: 260 });
    createWindow('quests', { x: 40, y: 310, w: 420, h: 320 });
    createWindow('memos', { x: 480, y: 310, w: 340, h: 320 });
    createWindow('habits', { x: 840, y: 40, w: 360, h: 520 });
  }

  // Setup Event Listeners & Timers
  function initControls() {
    // CRT toggle
    const crtBtn = document.getElementById('btn-crt-toggle');
    const crtOverlay = document.getElementById('crt-overlay');
    crtBtn.addEventListener('click', () => {
      playRetroSound('click');
      crtOverlay.classList.toggle('disabled');
      const isOff = crtOverlay.classList.contains('disabled');
      crtBtn.textContent = isOff ? '📺 CRT: OFF' : '📺 CRT: ON';
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.textContent = soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
      if (soundEnabled) playRetroSound('click');
    });

    // Theme Switcher
    const themes = ['bg-retro-grid', 'bg-space', 'bg-cyberpunk'];
    let currentThemeIdx = 0;
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn.addEventListener('click', () => {
      playRetroSound('click');
      document.body.classList.remove(themes[currentThemeIdx]);
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      document.body.classList.add(themes[currentThemeIdx]);
    });

    // Save Layout Button
    document.getElementById('btn-save-layout').addEventListener('click', saveLayout);

    // Live Top Bar Clock
    setInterval(() => {
      const clockElem = document.getElementById('top-bar-clock');
      if (clockElem) {
        const now = new Date();
        clockElem.textContent = now.toTimeString().split(' ')[0];
      }
    }, 1000);
  }

  // Document Ready Setup
  document.addEventListener('DOMContentLoaded', () => {
    initControls();
    setTimeout(loadLayout, 300);
  });

  return {
    registerWidget,
    createWindow,
    closeWidget,
    toggleWidget,
    playRetroSound,
    saveLayout
  };

})();
