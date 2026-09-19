/**
 * 📌 Pixel Sticky Memos Widget
 */
(function() {

  async function renderMemoWidget(container) {
    container.innerHTML = `
      <div style="font-family: var(--font-silkscreen);">
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <button class="retro-btn" id="btn-add-memo">+ NEW MEMO</button>
        </div>

        <div id="memo-list-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto;">
          <div style="text-align: center; color: var(--accent-cyan); font-size: 11px;">Loading Memos...</div>
        </div>
      </div>
    `;

    const listContainer = container.querySelector('#memo-list-container');
    const addBtn = container.querySelector('#btn-add-memo');

    async function fetchAndRenderMemos() {
      try {
        const res = await fetch('/api/memos');
        const memos = await res.json();

        if (!memos || memos.length === 0) {
          listContainer.innerHTML = `<div style="text-align:center; color:#888; font-size:11px;">No memos saved! Click + NEW MEMO above.</div>`;
          return;
        }

        listContainer.innerHTML = memos.map(m => {
          const colorMap = {
            yellow: '#ffe600',
            green: '#00ff66',
            cyan: '#00f0ff',
            magenta: '#ff007f'
          };
          const borderColor = colorMap[m.color] || '#ffe600';

          return `
            <div style="
              background: #1c0e35;
              border-left: 4px solid ${borderColor};
              border-top: 2px solid #3d2466;
              border-right: 2px solid #3d2466;
              border-bottom: 2px solid #3d2466;
              padding: 8px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <input type="text" class="pixel-input" value="${m.title}" 
                  onchange="window.LifeOSMemos.updateMemo(${m.id}, 'title', this.value)"
                  style="margin-bottom:0; padding:2px 4px; font-size:11px; font-weight:bold; color:${borderColor}; background:transparent; border:none; width:75%;">
                <button class="win-btn close-btn" onclick="window.LifeOSMemos.deleteMemo(${m.id})" style="width:16px; height:16px; line-height:14px; font-size:8px;">✕</button>
              </div>
              <textarea class="pixel-input" style="margin-bottom:0; height:50px; font-size:11px; resize:none;"
                onchange="window.LifeOSMemos.updateMemo(${m.id}, 'content', this.value)">${m.content}</textarea>
            </div>
          `;
        }).join('');

      } catch (e) {
        listContainer.innerHTML = `<div style="color:#ff0055; font-size:11px;">Error loading memos.</div>`;
      }
    }

    addBtn.addEventListener('click', async () => {
      LifeOS.playRetroSound('click');
      try {
        const colors = ['yellow', 'green', 'cyan', 'magenta'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '📌 QUICK MEMO', content: 'Type your retro note here...', color: randomColor })
        });
        fetchAndRenderMemos();
      } catch (e) {
        console.error("Failed to create memo:", e);
      }
    });

    window.LifeOSMemos = {
      updateMemo: async function(id, field, value) {
        try {
          const payload = {};
          payload[field] = value;
          await fetch(`/api/memos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.error("Failed to update memo:", e);
        }
      },
      deleteMemo: async function(id) {
        LifeOS.playRetroSound('delete');
        try {
          await fetch(`/api/memos/${id}`, { method: 'DELETE' });
          fetchAndRenderMemos();
        } catch (e) {
          console.error("Failed to delete memo:", e);
        }
      }
    };

    fetchAndRenderMemos();
  }

  LifeOS.registerWidget({
    id: 'memos',
    title: '📌 PIXEL STICKY MEMOS',
    defaultPos: { x: 480, y: 310, w: 340, h: 320 },
    renderContent: renderMemoWidget
  });
})();
