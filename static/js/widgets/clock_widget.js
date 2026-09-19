/**
 * 🕒 Retro Clock & Pomodoro Focus Timer Widget
 */
(function() {
  let timerInterval = null;
  let pomodoroTimeLeft = 25 * 60; // 25 minutes
  let isTimerRunning = false;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function renderClockWidget(container) {
    container.innerHTML = `
      <div style="text-align: center; font-family: var(--font-pixel);">
        <div id="pixel-clock-display" style="font-size: 26px; color: var(--accent-cyan); margin: 8px 0; text-shadow: 2px 2px #ff007f;">
          00:00:00
        </div>
        <div id="pixel-date-display" style="font-size: 10px; color: var(--accent-yellow); margin-bottom: 12px;">
          2026-09-19 (SAT)
        </div>

        <div style="border-top: 2px dashed #4a2c82; padding-top: 10px; margin-top: 10px;">
          <div style="font-size: 10px; color: var(--accent-green); margin-bottom: 6px;">⏱️ POMODORO FOCUS</div>
          <div id="pomodoro-timer-display" style="font-size: 22px; color: #fff; margin-bottom: 10px;">
            ${formatTime(pomodoroTimeLeft)}
          </div>
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button class="retro-btn" id="btn-pomo-toggle">START</button>
            <button class="retro-btn" id="btn-pomo-reset">RESET</button>
          </div>
        </div>
      </div>
    `;

    // Clock update loop
    function updateClock() {
      const now = new Date();
      const clockElem = container.querySelector('#pixel-clock-display');
      const dateElem = container.querySelector('#pixel-date-display');
      if (clockElem) {
        clockElem.textContent = now.toTimeString().split(' ')[0];
      }
      if (dateElem) {
        dateElem.textContent = now.toISOString().split('T')[0] + ' (' + now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() + ')';
      }
    }
    updateClock();
    const clockInt = setInterval(updateClock, 1000);

    // Timer controls
    const toggleBtn = container.querySelector('#btn-pomo-toggle');
    const resetBtn = container.querySelector('#btn-pomo-reset');
    const timerDisplay = container.querySelector('#pomodoro-timer-display');

    toggleBtn.addEventListener('click', () => {
      LifeOS.playRetroSound('click');
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        toggleBtn.textContent = 'START';
      } else {
        isTimerRunning = true;
        toggleBtn.textContent = 'PAUSE';
        timerInterval = setInterval(() => {
          if (pomodoroTimeLeft > 0) {
            pomodoroTimeLeft--;
            timerDisplay.textContent = formatTime(pomodoroTimeLeft);
          } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
            toggleBtn.textContent = 'START';
            LifeOS.playRetroSound('success');
            alert('🎉 Pomodoro Session Completed! Take a retro break!');
          }
        }, 1000);
      }
    });

    resetBtn.addEventListener('click', () => {
      LifeOS.playRetroSound('click');
      clearInterval(timerInterval);
      isTimerRunning = false;
      pomodoroTimeLeft = 25 * 60;
      timerDisplay.textContent = formatTime(pomodoroTimeLeft);
      toggleBtn.textContent = 'START';
    });
  }

  LifeOS.registerWidget({
    id: 'clock',
    title: '🕒 RETRO CLOCK',
    defaultPos: { x: 40, y: 40, w: 300, h: 250 },
    renderContent: renderClockWidget
  });
})();
