/**
 * ⚔️ RPG Quest Log (Todos & EXP System) Widget
 */
(function() {

  async function renderQuestWidget(container) {
    container.innerHTML = `
      <div style="font-family: var(--font-silkscreen);">
        <form id="quest-add-form" style="display: flex; gap: 6px; margin-bottom: 10px;">
          <input type="text" class="pixel-input" id="quest-title-input" placeholder="New quest title..." required style="margin-bottom: 0;">
          <input type="number" class="pixel-input" id="quest-exp-input" value="20" min="5" max="100" style="width: 70px; margin-bottom: 0;" title="EXP Reward">
          <button type="submit" class="retro-btn">+ADD</button>
        </form>

        <div id="quest-list-container" style="display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;">
          <div style="text-align: center; color: var(--accent-cyan); font-size: 11px;">Loading Quests...</div>
        </div>
      </div>
    `;

    const listContainer = container.querySelector('#quest-list-container');
    const form = container.querySelector('#quest-add-form');

    async function fetchAndRenderQuests() {
      try {
        const res = await fetch('/api/quests');
        const quests = await res.json();

        if (!quests || quests.length === 0) {
          listContainer.innerHTML = `<div style="text-align:center; color:#888; font-size:11px;">No active quests! Add one above.</div>`;
          return;
        }

        listContainer.innerHTML = quests.map(q => `
          <div class="quest-item" style="
            background: #1f1138;
            border: 2px solid ${q.completed ? '#4a3266' : 'var(--accent-magenta)'};
            padding: 6px 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            opacity: ${q.completed ? 0.6 : 1.0};
          ">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
              <input type="checkbox" ${q.completed ? 'checked' : ''} onchange="window.LifeOSQuests.toggleQuest(${q.id}, this.checked)" style="cursor: pointer;">
              <span style="
                font-size: 11px;
                text-decoration: ${q.completed ? 'line-through' : 'none'};
                color: ${q.completed ? '#aaa' : '#fff'};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${q.title}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 9px; font-family: var(--font-pixel); color: var(--accent-yellow); background: #351a5c; padding: 2px 4px;">+${q.exp_reward} EXP</span>
              <button class="win-btn close-btn" onclick="window.LifeOSQuests.deleteQuest(${q.id})" style="width:16px; height:16px; line-height:14px; font-size:8px;">✕</button>
            </div>
          </div>
        `).join('');

      } catch (e) {
        listContainer.innerHTML = `<div style="color:#ff0055; font-size:11px;">Error loading quests.</div>`;
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = container.querySelector('#quest-title-input');
      const expInput = container.querySelector('#quest-exp-input');

      const title = titleInput.value.trim();
      const exp_reward = parseInt(expInput.value, 10) || 15;

      if (!title) return;

      LifeOS.playRetroSound('click');
      try {
        await fetch('/api/quests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, exp_reward })
        });
        titleInput.value = '';
        fetchAndRenderQuests();
      } catch (e) {
        console.error("Failed to add quest:", e);
      }
    });

    // Expose helpers globally for inline event handlers
    window.LifeOSQuests = {
      toggleQuest: async function(questId, isCompleted) {
        try {
          const res = await fetch(`/api/quests/${questId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: isCompleted })
          });
          const data = await res.json();
          if (data.exp_gained > 0) {
            LifeOS.playRetroSound(data.level_up ? 'levelup' : 'success');
            if (data.level_up) {
              alert(`⭐ LEVEL UP! You reached LEVEL ${data.new_level}!`);
            }
          } else {
            LifeOS.playRetroSound('click');
          }
          fetchAndRenderQuests();
          if (window.LifeOSStatsRefresh) {
            window.LifeOSStatsRefresh();
          }
        } catch (e) {
          console.error("Failed to toggle quest:", e);
        }
      },
      deleteQuest: async function(questId) {
        LifeOS.playRetroSound('delete');
        try {
          await fetch(`/api/quests/${questId}`, { method: 'DELETE' });
          fetchAndRenderQuests();
        } catch (e) {
          console.error("Failed to delete quest:", e);
        }
      }
    };

    fetchAndRenderQuests();
  }

  LifeOS.registerWidget({
    id: 'quests',
    title: '⚔️ RPG QUEST LOG',
    defaultPos: { x: 40, y: 310, w: 420, h: 320 },
    renderContent: renderQuestWidget
  });
})();
