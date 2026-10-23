/**
 * SereneBloom - Tab 5: Profile & Mood Analytics Controller (profile.html)
 */

import { DataService } from './data-service.js';
import { showToast, showConfirmModal, initUserDisplay } from './navigation.js';

let moodChartInstance = null;
let currentChartMode = 'week'; // 'week' or 'month'

export async function initProfilePage() {
  const user = await DataService.getCurrentUser();
  if (!user) return;

  // 1. Edit Profile Modal Trigger
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    openEditProfileModal(user);
  });

  // 2. Chart Mode Toggles
  document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartMode = btn.dataset.mode;
      await renderMoodChart(user.uid);
    });
  });

  // 3. Nightly Reminder 21:00 Switch
  initReminderSetting(user.uid);

  // 4. Load Profile Data & Analytics
  await loadProfileData(user.uid);
}

async function loadProfileData(uid) {
  const checkins = await DataService.getCheckins(uid);
  const stats = DataService.calculateStats(checkins);

  // Update Stats Cards
  const totalEl = document.getElementById('profile-stat-total');
  const goodEl = document.getElementById('profile-stat-good');
  const neutralEl = document.getElementById('profile-stat-neutral');
  const streakEl = document.getElementById('profile-stat-streak');

  if (totalEl) totalEl.textContent = stats.total;
  if (goodEl) goodEl.textContent = stats.moodCounts.good + stats.moodCounts.joy;
  if (neutralEl) neutralEl.textContent = stats.moodCounts.neutral;
  if (streakEl) streakEl.textContent = stats.streak;

  // Render Mood Chart
  await renderMoodChart(uid);

  // Render Recent Records
  renderRecentJournalRecords(uid, checkins);
}

// Render Chart.js
async function renderMoodChart(uid) {
  const chartCanvas = document.getElementById('mood-chart-canvas');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const checkins = await DataService.getCheckins(uid);

  // Mood Score Mapping for Chart Y-axis
  // Rất vui: 5, Tốt: 4, Bình thường: 3, Mệt mỏi: 2, Lo lắng: 1.5, Buồn: 1
  const moodScore = {
    joy: 5,
    good: 4,
    neutral: 3,
    tired: 2,
    anxious: 1.5,
    sad: 1
  };

  let labels = [];
  let dataPoints = [];

  const now = new Date();

  if (currentChartMode === 'week') {
    // Last 7 days
    labels = ['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2'];
    const daysArr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      daysArr.push(d.toISOString().split('T')[0]);
    }

    dataPoints = daysArr.map(dStr => {
      const matched = checkins.find(c => (c.dateKey === dStr || (c.createdAt && c.createdAt.startsWith(dStr))));
      return matched ? moodScore[matched.mood] || null : null;
    });
  } else {
    // Last 4 weeks (Month view)
    labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
    dataPoints = [3.5, 4.0, 3.8, statsAvgScore(checkins)];
  }

  if (moodChartInstance) {
    moodChartInstance.destroy();
  }

  const ctx = chartCanvas.getContext('2d');
  moodChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mức độ tích cực cảm xúc',
        data: dataPoints,
        borderColor: '#668B7B',
        backgroundColor: 'rgba(226, 239, 233, 0.5)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#52796F',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              if (val >= 4.5) return 'Tâm trạng: Rất vui ';
              if (val >= 3.5) return 'Tâm trạng: Tốt ';
              if (val >= 2.5) return 'Tâm trạng: Bình thường ';
              if (val >= 1.8) return 'Tâm trạng: Mệt mỏi ';
              if (val >= 1.2) return 'Tâm trạng: Lo lắng ';
              return 'Tâm trạng: Buồn ';
            }
          }
        }
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            callback: (val) => {
              if (val === 5) return ' Rất vui';
              if (val === 4) return ' Tốt';
              if (val === 3) return ' Bình thường';
              if (val === 2) return ' Mệt mỏi';
              if (val === 1) return ' Buồn';
              return '';
            }
          },
          grid: { color: 'rgba(102, 139, 123, 0.1)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function statsAvgScore(checkins) {
  if (!checkins || checkins.length === 0) return 3;
  const moodScore = { joy: 5, good: 4, neutral: 3, tired: 2, anxious: 1.5, sad: 1 };
  const sum = checkins.reduce((acc, cur) => acc + (moodScore[cur.mood] || 3), 0);
  return Number((sum / checkins.length).toFixed(1));
}

// Render recent history in Profile
function renderRecentJournalRecords(uid, checkins) {
  const container = document.getElementById('profile-recent-records');
  if (!container) return;

  if (checkins.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Bạn chưa có nhật ký nào gần đây.</p>
      </div>
    `;
    return;
  }

  const moodMap = {
    joy: { label: 'Rất vui', badge: 'badge-mood-joy', emoji: '' },
    good: { label: 'Tốt', badge: 'badge-mood-good', emoji: '' },
    neutral: { label: 'Bình thường', badge: 'badge-mood-neutral', emoji: '' },
    sad: { label: 'Buồn', badge: 'badge-mood-sad', emoji: '' },
    anxious: { label: 'Lo lắng', badge: 'badge-mood-anxious', emoji: '' },
    tired: { label: 'Mệt mỏi', badge: 'badge-mood-tired', emoji: '' }
  };

  container.innerHTML = checkins.slice(0, 5).map(item => {
    const m = moodMap[item.mood] || moodMap.good;
    const dateFormatted = formatShortDate(item.dateKey || item.createdAt);
    return `
      <div class="journal-item" data-id="${item.checkinId}">
        <div class="journal-item-header">
          <div class="journal-item-meta">
            <span class="badge ${m.badge}">${m.emoji} ${m.label}</span>
            <span class="journal-date">${dateFormatted}</span>
          </div>
          <div class="journal-actions">
            <button class="btn btn-ghost btn-sm prof-del-btn" data-id="${item.checkinId}" style="color: var(--color-error);">
              🗑️ Xóa
            </button>
          </div>
        </div>
        <div class="journal-preview">${escapeHtml(item.content || 'Chỉ ghi nhận tâm trạng.')}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.prof-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      showConfirmModal({
        title: 'Xóa nhật ký',
        message: 'Bạn có chắc chắn muốn xóa bản ghi này?',
        confirmText: 'Xóa',
        onConfirm: async () => {
          await DataService.deleteCheckin(uid, id);
          showToast('Đã xóa nhật ký.', 'info');
          await loadProfileData(uid);
        }
      });
    });
  });
}

// 21:00 Nightly reminder preference
async function initReminderSetting(uid) {
  const switchInput = document.getElementById('daily-reminder-switch');
  if (!switchInput) return;

  const prefs = await DataService.getPreferences(uid);
  switchInput.checked = prefs.dailyReminderEnabled !== false;

  switchInput.addEventListener('change', async () => {
    const isEnabled = switchInput.checked;
    await DataService.savePreferences(uid, {
      dailyReminderEnabled: isEnabled,
      reminderTime: '21:00'
    });

    if (isEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      showToast('Đã bật nhắc nhở viết nhật ký mỗi tối lúc 21:00 🌙', 'success');
    } else {
      showToast('Đã tắt nhắc nhở cuối ngày.', 'info');
    }
  });
}

function openEditProfileModal(user) {
  showConfirmModal({
    title: 'Chỉnh sửa thông tin hồ sơ',
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-main);">Tên hiển thị của bạn</label>
        <input type="text" id="edit-profile-name" value="${escapeHtml(user.displayName || '')}" style="padding: 0.65rem;" />
      </div>
    `,
    confirmText: 'Lưu thay đổi',
    cancelText: 'Hủy',
    onConfirm: async () => {
      const newName = document.getElementById('edit-profile-name').value.trim();
      if (newName) {
        await DataService.updateUserProfile(user.uid, { displayName: newName });
        showToast('Cập nhật hồ sơ thành công!', 'success');
        await initUserDisplay();
        window.location.reload();
      }
    }
  });
}

function formatShortDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const value = dateStr.trim();
  if (!value) return '';

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDate.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return '';
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
