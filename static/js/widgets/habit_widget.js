/**
 * ✅ Daily Habit & Streak Tracker Widget
 */
(function() {
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

  async function renderHabitWidget(container) {
    container.innerHTML = `
      <div style="font-family: var(--font-silkscreen);">
        <form id="habit-add-form" style="display:flex; gap:6px; margin-bottom:10px;">
          <input type="text" class="pixel-input" id="habit-emoji-input" value="✅" maxlength="4"
            aria-label="Habit emoji" style="width:55px; margin-bottom:0; text-align:center;">
          <input type="text" class="pixel-input" id="habit-name-input" placeholder="New daily habit..." required
            maxlength="60" style="margin-bottom:0;">
          <button type="submit" class="retro-btn">+ADD</button>
        </form>

        <div id="habit-summary" style="
          background:#1e0d38;
          border:2px solid var(--accent-cyan);
          padding:6px 8px;
          margin-bottom:8px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          font-size:10px;
        ">Loading streaks...</div>

        <div id="habit-list-container" style="display:flex; flex-direction:column; gap:7px; max-height:330px; overflow-y:auto;">
          <div style="text-align:center; color:var(--accent-cyan); font-size:11px;">Loading habits...</div>
        </div>
      </div>
    `;

    const listContainer = container.querySelector('#habit-list-container');
    const summary = container.querySelector('#habit-summary');
    const form = container.querySelector('#habit-add-form');

    async function fetchAndRenderHabits() {
      try {
        const res = await fetch('/api/habits');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const habits = data.habits || [];
        const totals = data.summary || {};

        summary.innerHTML = `
          <span style="color:var(--accent-yellow); font-family:var(--font-pixel);">TODAY ${totals.completed_today || 0}/${totals.total_today || 0}</span>
          <span style="color:var(--accent-green);">7D ${totals.completion_percent || 0}%</span>
          <span style="color:var(--accent-magenta);">🔥 BEST ${totals.best_streak || 0}D</span>
        `;

        if (habits.length === 0) {
          listContainer.innerHTML = `<div style="text-align:center; color:#888; font-size:11px;">No habits yet. Add your first daily habit above.</div>`;
          return;
        }

        listContainer.innerHTML = habits.map((habit) => {
          const dots = habit.last_7.map((day) => `
            <span title="${day.date}" style="
              display:inline-flex;
              width:12px;
              height:12px;
              align-items:center;
              justify-content:center;
              background:${day.completed ? 'var(--accent-green)' : '#241441'};
              border:1px solid ${day.completed ? 'var(--accent-green)' : '#5a3a91'};
              color:#08040f;
              font-size:8px;
              margin-left:2px;
            ">${day.completed ? '✓' : ''}</span>
          `).join('');

          return `
            <div style="
              background:#1c0e35;
              border:2px solid ${habit.completed_today ? 'var(--accent-green)' : 'var(--accent-magenta)'};
              padding:7px 8px;
            ">
              <div style="display:flex; align-items:center; gap:7px;">
                <input type="checkbox"
                  ${habit.completed_today ? 'checked' : ''}
                  onchange="window.LifeOSHabits.setToday(${habit.id}, this.checked)"
                  style="width:16px; height:16px; cursor:pointer;">
                <span style="font-size:13px; margin-right:auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${escapeHtml(habit.emoji)} ${escapeHtml(habit.name)}
                </span>
                <span style="font-size:9px; color:var(--accent-yellow); font-family:var(--font-pixel); white-space:nowrap;">
                  🔥 ${habit.current_streak}D
                </span>
                <button class="win-btn close-btn" type="button"
                  onclick="window.LifeOSHabits.delete(${habit.id})"
                  aria-label="Delete habit"
                  style="width:16px; height:16px; line-height:14px; font-size:8px;">✕</button>
              </div>
              <div style="display:flex; align-items:center; gap:5px; margin-top:6px; padding-left:23px;">
                <span style="font-size:9px; color:#8e76aa; font-family:var(--font-pixel);">7D</span>
                ${dots}
                <span style="margin-left:auto; font-size:9px; color:var(--accent-cyan); font-family:var(--font-pixel);">
                  ${habit.completion_rate_7d}% • BEST ${habit.best_streak}D
                </span>
              </div>
            </div>
          `;
        }).join('');
      } catch (error) {
        summary.textContent = 'STREAK DATA OFFLINE';
        listContainer.innerHTML = `<div style="color:#ff0055; font-size:11px;">Unable to load habits.</div>`;
        console.error('Failed to load habits:', error);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const nameInput = container.querySelector('#habit-name-input');
      const emojiInput = container.querySelector('#habit-emoji-input');
      const name = nameInput.value.trim();
      const emoji = emojiInput.value.trim() || '✅';

      if (!name) return;

      LifeOS.playRetroSound('click');
      try {
        const res = await fetch('/api/habits', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name, emoji})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        nameInput.value = '';
        fetchAndRenderHabits();
      } catch (error) {
        console.error('Failed to create habit:', error);
      }
    });

    window.LifeOSHabits = {
      setToday: async function(id, completed) {
        try {
          const res = await fetch(`/api/habits/${id}/today`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({completed})
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          LifeOS.playRetroSound(completed ? 'success' : 'click');
          fetchAndRenderHabits();
        } catch (error) {
          console.error('Failed to update habit:', error);
        }
      },
      delete: async function(id) {
        if (!confirm('Delete this habit and its streak history?')) return;
        LifeOS.playRetroSound('delete');
        try {
          const res = await fetch(`/api/habits/${id}`, {method:'DELETE'});
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchAndRenderHabits();
        } catch (error) {
          console.error('Failed to delete habit:', error);
        }
      }
    };

    fetchAndRenderHabits();
  }

  LifeOS.registerWidget({
    id: 'habits',
    title: '✅ HABIT STREAK TRACKER',
    defaultPos: { x: 840, y: 40, w: 360, h: 520 },
    renderContent: renderHabitWidget
  });
})();
