/**
 * 📊 Player Life Status & Gauges Widget
 */
(function() {

  async function renderStatsWidget(container) {
    container.innerHTML = `
      <div style="font-family: var(--font-silkscreen);">
        <div id="stats-level-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          background: #1e0d38;
          padding: 6px 8px;
          border: 2px solid var(--accent-cyan);
        ">
          <span id="player-level-text" style="font-family: var(--font-pixel); font-size: 11px; color: var(--accent-yellow);">LV.1 PLAYER</span>
          <span id="player-exp-text" style="font-size: 10px; color: var(--accent-cyan);">EXP: 0/100</span>
        </div>

        <div class="pixel-bar-container" style="margin-bottom: 12px;">
          <div class="pixel-bar-fill" id="bar-exp-fill" style="width: 0%;"></div>
          <div class="pixel-bar-text" id="text-exp-label">0%</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;" id="gauges-container">
          <div style="text-align: center; color: var(--accent-cyan); font-size: 11px;">Loading Life Gauges...</div>
        </div>
      </div>
    `;

    async function loadStats() {
      try {
        const res = await fetch('/api/system/stats');
        const stats = await res.json();

        // Level & EXP
        const lvlText = container.querySelector('#player-level-text');
        const expText = container.querySelector('#player-exp-text');
        const expFill = container.querySelector('#bar-exp-fill');
        const expLabel = container.querySelector('#text-exp-label');

        if (lvlText) lvlText.textContent = `LV.${stats.level} PLAYER`;
        if (expText) expText.textContent = `EXP: ${stats.exp}/100`;
        if (expFill) expFill.style.width = `${stats.exp}%`;
        if (expLabel) expLabel.textContent = `${stats.exp}% EXP`;

        // Gauges
        const gaugesContainer = container.querySelector('#gauges-container');
        if (!gaugesContainer) return;

        const metrics = [
          { key: 'energy', label: '⚡ ENERGY', val: stats.energy, fillClass: 'energy' },
          { key: 'focus', label: '🎯 FOCUS', val: stats.focus, fillClass: '' },
          { key: 'hydration', label: '💧 HYDRATION', val: stats.hydration, fillClass: '' },
          { key: 'mood', label: '💖 MOOD', val: stats.mood, fillClass: 'mood' }
        ];

        gaugesContainer.innerHTML = metrics.map(m => `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
              <span>${m.label}</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <button class="win-btn" onclick="window.LifeOSStats.adjust('${m.key}', -10)" style="width:14px; height:14px; line-height:12px; font-size:10px;">-</button>
                <span style="font-family: var(--font-pixel); color: var(--accent-yellow);">${m.val}%</span>
                <button class="win-btn" onclick="window.LifeOSStats.adjust('${m.key}', 10)" style="width:14px; height:14px; line-height:12px; font-size:10px;">+</button>
              </div>
            </div>
            <div class="pixel-bar-container" style="height: 14px;">
              <div class="pixel-bar-fill ${m.fillClass}" style="width: ${m.val}%;"></div>
            </div>
          </div>
        `).join('');

      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }

    window.LifeOSStats = {
      adjust: async function(key, delta) {
        LifeOS.playRetroSound('click');
        try {
          const res = await fetch('/api/system/stats');
          const current = await res.json();
          const newVal = Math.max(0, Math.min(100, (current[key] || 0) + delta));
          const payload = {};
          payload[key] = newVal;

          await fetch('/api/system/stats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          loadStats();
        } catch (e) {
          console.error("Failed to adjust stat:", e);
        }
      }
    };

    window.LifeOSStatsRefresh = loadStats;
    loadStats();
  }

  LifeOS.registerWidget({
    id: 'stats',
    title: '📊 LIFE STATUS GAUGE',
    defaultPos: { x: 360, y: 40, w: 320, h: 260 },
    renderContent: renderStatsWidget
  });
})();
