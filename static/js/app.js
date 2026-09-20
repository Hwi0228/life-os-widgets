/**
 * Life OS Core Engine (Modern edition)
 * Manages desktop windows, drag-and-drop with optional grid snap,
 * soft audio cues, layout saving, and widget registration.
 */

window.LifeOS = (function() {
  const registeredWidgets = {};
  const activeWindows = {};
  let topZIndex = 10;
  let soundEnabled = true;
  let snapToGrid = true;
  const GRID_SIZE = 20;

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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success' || type === 'levelup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio may be blocked until user gesture
    }
  }

  function snap(value) {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  function registerWidget(config) {
    registeredWidgets[config.id] = config;
  }

  function createWindow(widgetId, pos = null) {
    const config = registeredWidgets[widgetId];
    if (!config) return;

    if (activeWindows[widgetId]) {
      focusWindow(widgetId);
      return;
    }

    const defaultP = pos || config.defaultPos || { x: 100, y: 80, w: 320, h: 240 };
    topZIndex += 1;

    const win = document.createElement('div');
    win.className = 'pixel-window active-window';
    win.id = `win-${widgetId}`;
    win.style.left = `${snap(defaultP.x)}px`;
    win.style.top = `${snap(defaultP.y)}px`;
    win.style.width = `${defaultP.w}px`;
    win.style.height = `${defaultP.h}px`;
    win.style.zIndex = topZIndex;

    win.innerHTML = `
      <div class="window-header" id="win-header-${widgetId}">
        <span class="window-title">${config.title}</span>
        <div class="window-actions">
          <button class="win-btn close-btn" onclick="LifeOS.closeWidget('${widgetId}')" title="Close">✕</button>
        </div>
      </div>
      <div class="window-content" id="win-content-${widgetId}"></div>
    `;

    document.getElementById('desktop-canvas').appendChild(win);
    activeWindows[widgetId] = win;

    win.addEventListener('mousedown', () => focusWindow(widgetId));
    makeDraggable(win, document.getElementById(`win-header-${widgetId}`));

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

      if (newTop < 0) newTop = 0;
      if (newLeft < 0) newLeft = 0;

      // Live snap while dragging when enabled
      if (snapToGrid) {
        newTop = snap(newTop);
        newLeft = snap(newLeft);
      }

      winElem.style.top = newTop + 'px';
      winElem.style.left = newLeft + 'px';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      // Final snap on release
      if (snapToGrid) {
        winElem.style.top = snap(winElem.offsetTop) + 'px';
        winElem.style.left = snap(winElem.offsetLeft) + 'px';
      }
    }
  }

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
        alert('Layout saved');
      }
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  }

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
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h
              });
              const win = activeWindows[item.widget_id];
              if (win && item.z_index) {
                win.style.zIndex = item.z_index;
                if (item.z_index > topZIndex) topZIndex = item.z_index;
              }
            }
          });

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
      console.warn('Could not load layout, initializing defaults:', e);
    }

    // Default startup windows (snapped)
    createWindow('clock', { x: 40, y: 40, w: 300, h: 250 });
    createWindow('stats', { x: 360, y: 40, w: 320, h: 260 });
    createWindow('quests', { x: 40, y: 320, w: 420, h: 320 });
    createWindow('memos', { x: 480, y: 320, w: 340, h: 320 });
    createWindow('habits', { x: 840, y: 40, w: 360, h: 520 });
  }

  function initControls() {
    const crtBtn = document.getElementById('btn-crt-toggle');
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtBtn && crtOverlay) {
      crtBtn.addEventListener('click', () => {
        playRetroSound('click');
        crtOverlay.classList.toggle('enabled');
        const isOn = crtOverlay.classList.contains('enabled');
        crtBtn.textContent = isOn ? 'Scanlines: On' : 'Scanlines: Off';
      });
    }

    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound';
        if (soundEnabled) playRetroSound('click');
      });
    }

    // Grid snap toggle
    const snapBtn = document.getElementById('btn-snap-toggle');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        playRetroSound('click');
        snapToGrid = !snapToGrid;
        snapBtn.textContent = snapToGrid ? 'Grid Snap: On' : 'Grid Snap: Off';
        snapBtn.classList.toggle('active-snap', snapToGrid);
        // Snap all open windows immediately when enabling
        if (snapToGrid) {
          Object.values(activeWindows).forEach(win => {
            win.style.top = snap(win.offsetTop) + 'px';
            win.style.left = snap(win.offsetLeft) + 'px';
          });
        }
      });
    }

    const themes = ['bg-soft-grid', 'bg-modern-dark', 'bg-space'];
    let currentThemeIdx = 0;
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        playRetroSound('click');
        document.body.classList.remove(themes[currentThemeIdx]);
        currentThemeIdx = (currentThemeIdx + 1) % themes.length;
        document.body.classList.add(themes[currentThemeIdx]);
      });
    }

    const saveBtn = document.getElementById('btn-save-layout');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveLayout);
    }

    setInterval(() => {
      const clockElem = document.getElementById('top-bar-clock');
      if (clockElem) {
        const now = new Date();
        clockElem.textContent = now.toTimeString().split(' ')[0];
      }
    }, 1000);
  }

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
