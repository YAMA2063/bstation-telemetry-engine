// ===== DOM REFERENCES =====
const $ = id => document.getElementById(id);

const videoUrlInput = $('video-url-input');
const btnCheckInfo = $('btn-check-info');
const btnStart = $('btn-start');
const btnStop = $('btn-stop');
const btnClearLogs = $('btn-clear-logs');

const targetCountInput = $('target-count-input');
const minDelayInput = $('min-delay-input');
const maxDelayInput = $('max-delay-input');
const useProxyCheckbox = $('use-proxy-checkbox');
const proxyDetails = $('proxy-details');
const parallelCountInput = $('parallel-count-input');
const proxyListTextarea = $('proxy-list-textarea');

const previewAid = $('preview-aid');
const previewTitle = $('preview-title');
const previewUploader = $('preview-uploader');
const previewViews = $('preview-views');

const statCurrentViews = $('stat-current-views');
const statInitialViews = $('stat-initial-views');
const statSuccess = $('stat-success');
const statTarget = $('stat-target');
const statCountdown = $('stat-countdown');
const statFailed = $('stat-failed');
const statSuccessRate = $('stat-success-rate');
const statErrorLabel = $('stat-error-label');
const statCountdownLabel = $('stat-countdown-label');

const progressBar = $('progress-bar');
const progressPercentage = $('progress-percentage');
const progressStatus = $('progress-status');
const terminalBody = $('terminal-body');

const connDot = $('conn-dot');
const connText = $('conn-text');
const liveClock = $('live-clock');
const termLiveBadge = $('term-live-badge');
const toastContainer = $('toast-container');

// Ring SVG elements
const ringViews = $('ring-views');
const ringSuccess = $('ring-success');
const ringTimer = $('ring-timer');
const ringFail = $('ring-fail');

const RING_CIRCUMFERENCE = 2 * Math.PI * 34; // ~213.6

// ===== STATE =====
let lastKnownViews = null;
let lastLogCount = 0;
let isConnected = false;
let prevState = {};
let maxDelay = 85; // track for ring animation

// ===== UTILITY =====
function setRingProgress(el, pct) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, pct)));
  el.style.strokeDashoffset = offset;
}

function animateNumber(el, newVal) {
  if (el.textContent !== String(newVal)) {
    el.textContent = newVal;
    el.classList.remove('num-bump');
    void el.offsetWidth; // reflow
    el.classList.add('num-bump');
  }
}

// ===== LIVE CLOCK =====
function updateClock() {
  const now = new Date();
  liveClock.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== TOAST =====
const toastIcons = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕'
};

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast t-${type}`;

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = toastIcons[type] || 'ℹ';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// ===== PROXY TOGGLE =====
useProxyCheckbox.addEventListener('change', () => {
  if (useProxyCheckbox.checked) {
    proxyDetails.classList.add('open');
  } else {
    proxyDetails.classList.remove('open');
  }
});

// ===== CHECK VIDEO INFO =====
async function checkVideoInfo() {
  const url = videoUrlInput.value.trim();
  if (!url) {
    showToast('Masukkan link video Bstation', 'warning');
    return;
  }

  btnCheckInfo.style.opacity = '0.5';
  btnCheckInfo.style.pointerEvents = 'none';

  try {
    const res = await fetch('/api/check-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();

    if (data.error) {
      showToast(data.error, 'warning');
    } else {
      previewAid.textContent = `AID: ${data.aid}`;
      previewTitle.textContent = data.title;
      previewUploader.textContent = data.uploader;
      previewViews.textContent = data.views;

      const numViews = (data.views || '').replace(/[^0-9]/g, '');
      animateNumber(statCurrentViews, numViews || data.views);
      statInitialViews.textContent = `Awal: ${data.views}`;

      lastKnownViews = data.views;
      showToast(`Video ditemukan: ${data.title}`, 'success');
    }
  } catch (err) {
    showToast(`Gagal cek video: ${err.message}`, 'error');
  } finally {
    btnCheckInfo.style.opacity = '1';
    btnCheckInfo.style.pointerEvents = 'auto';
  }
}

// ===== START =====
async function startAutoView() {
  const url = videoUrlInput.value.trim();
  if (!url) {
    showToast('Masukkan link video terlebih dahulu', 'warning');
    return;
  }

  const count = parseInt(targetCountInput.value, 10) || 10;
  const minDel = parseInt(minDelayInput.value, 10) || 81;
  const maxDel = parseInt(maxDelayInput.value, 10) || 85;
  const useProxy = useProxyCheckbox.checked;
  const parallelCount = 1;
  const proxies = proxyListTextarea.value.split(/\r?\n/).map(p => p.trim()).filter(Boolean);

  if (minDel >= maxDel) {
    showToast('Jeda minimum harus < jeda maksimum', 'warning');
    return;
  }

  maxDelay = maxDel;
  btnStart.disabled = true;
  btnStop.disabled = false;

  try {
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url, count, minDelay: minDel, maxDelay: maxDel,
        useProxy, parallelCount, proxies
      })
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, 'error');
      btnStart.disabled = false;
      btnStop.disabled = true;
    } else {
      showToast('🚀 Boost dimulai!', 'success');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    btnStart.disabled = false;
    btnStop.disabled = true;
  }
}

// ===== STOP =====
async function stopAutoView() {
  btnStop.disabled = true;
  try {
    await fetch('/api/stop', { method: 'POST' });
    showToast('Proses dihentikan', 'warning');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ===== SYNC STATUS =====
async function syncStatus() {
  try {
    const res = await fetch('/api/status');
    const state = await res.json();

    // Connection state
    if (!isConnected) {
      isConnected = true;
      connDot.classList.add('online');
      connText.textContent = 'Terhubung';
    }

    // Running state
    if (state.isRunning) {
      btnStart.disabled = true;
      btnStop.disabled = false;

      if (state.nextRunIn > 0) {
        connDot.className = 'conn-dot waiting';
        connText.textContent = 'Menunggu jeda...';
        statCountdownLabel.textContent = 'Hitung mundur';
      } else {
        connDot.className = 'conn-dot running';
        connText.textContent = 'Sedang berjalan';
        statCountdownLabel.textContent = 'Mengirim...';
      }
      termLiveBadge.classList.add('active');
    } else {
      btnStart.disabled = false;
      btnStop.disabled = true;
      connDot.className = 'conn-dot online';
      connText.textContent = state.completedCount > 0 ? 'Selesai' : 'Siap';
      termLiveBadge.classList.remove('active');
      statCountdownLabel.textContent = 'Idle';
    }

    // Update progress status text
    progressStatus.textContent = state.currentStatus || 'Siap dijalankan';

    // Views
    if (state.currentViews) {
      const numViews = (state.currentViews || '').replace(/[^0-9]/g, '');
      const prevNumViews = statCurrentViews.textContent;
      
      if (numViews && numViews !== prevNumViews) {
        animateNumber(statCurrentViews, numViews);
        statCurrentViews.classList.add('view-flash');
        setTimeout(() => statCurrentViews.classList.remove('view-flash'), 600);
      }
      
      previewViews.textContent = state.currentViews;

      if (lastKnownViews && lastKnownViews !== state.currentViews) {
        showToast(`🎉 Views naik! → ${state.currentViews}`, 'success');
        lastKnownViews = state.currentViews;
      }
      if (!lastKnownViews) lastKnownViews = state.currentViews;
    }

    if (state.initialViews) {
      statInitialViews.textContent = `Awal: ${state.initialViews}`;
    }

    // Video info
    if (state.videoTitle && previewTitle.textContent === 'Belum ada video dipilih') {
      previewTitle.textContent = state.videoTitle;
      previewUploader.textContent = state.uploader || '—';
      previewAid.textContent = `AID: ${state.aid}`;
    }

    // Stats numbers
    animateNumber(statSuccess, state.successCount);
    statTarget.textContent = ` / ${state.targetCount}`;
    animateNumber(statFailed, state.failCount);
    animateNumber(statCountdown, state.nextRunIn || 0);

    // Success rate
    const total = state.successCount + state.failCount;
    if (total > 0) {
      const rate = Math.round((state.successCount / total) * 100);
      statSuccessRate.textContent = `${rate}% berhasil`;
    }

    // Error label
    statErrorLabel.textContent = state.failCount > 0 ? `${state.failCount} gagal` : 'Tidak ada';

    // Progress bar
    const progress = state.targetCount > 0
      ? Math.round((state.completedCount / state.targetCount) * 100)
      : 0;
    progressBar.style.width = `${progress}%`;
    progressPercentage.textContent = `${progress}%`;

    // Ring animations
    setRingProgress(ringViews, state.currentViews ? 0.75 : 0); // decorative for views

    const successPct = state.targetCount > 0 ? state.completedCount / state.targetCount : 0;
    setRingProgress(ringSuccess, successPct);

    const timerPct = (state.nextRunIn > 0 && maxDelay > 0) ? state.nextRunIn / maxDelay : 0;
    setRingProgress(ringTimer, timerPct);

    const failPct = total > 0 ? state.failCount / total : 0;
    setRingProgress(ringFail, failPct);

    // Logs
    if (state.logs && state.logs.length !== lastLogCount) {
      lastLogCount = state.logs.length;
      terminalBody.innerHTML = state.logs.map(log => {
        const cls = log.type === 'success' ? 'log-success'
          : log.type === 'error' ? 'log-error'
          : log.type === 'highlight' ? 'log-highlight'
          : log.type === 'warning' ? 'log-warning'
          : 'log-info';
        return `<div class="log-line ${cls}"><span class="log-ts">[${log.time}]</span> ${log.message}</div>`;
      }).join('');

      // Auto scroll to top (newest first)
      terminalBody.scrollTop = 0;
    }

  } catch (err) {
    if (isConnected) {
      isConnected = false;
      connDot.className = 'conn-dot';
      connText.textContent = 'Terputus';
    }
  }
}

// ===== EVENT LISTENERS =====
btnCheckInfo.addEventListener('click', checkVideoInfo);
btnStart.addEventListener('click', startAutoView);
btnStop.addEventListener('click', stopAutoView);
btnClearLogs.addEventListener('click', () => {
  terminalBody.innerHTML = '<div class="log-line log-info"><span class="log-ts">[SYS]</span> Log dibersihkan.</div>';
  lastLogCount = 0;
});

// Enter key on URL input
videoUrlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkVideoInfo();
});

// ===== AUTO POLL =====
setInterval(syncStatus, 1000);
syncStatus();
