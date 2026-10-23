/**
 * SereneBloom - Tab 1: Home Controller (index.html)
 */

import { DataService } from './data-service.js';
import { showToast, showConfirmModal } from './navigation.js';

// Curated gentle inspirational quotes for Vietnamese high school students
const INSPIRATIONAL_QUOTES = [
  { text: "Chữa lành không phải cuộc đua, hãy đi theo nhịp của bạn.", author: "SereneBloom Whisper" },
  { text: "Mọi cảm xúc bạn đang có đều xứng đáng được lắng nghe và thấu hiểu.", author: "Tâm lý học tích cực" },
  { text: "Bạn không cần phải hoàn hảo để trở nên tuyệt vời.", author: "Thầy cô & Bạn bè" },
  { text: "Cho phép mình nghỉ ngơi khi mệt mỏi là một hành động dũng cảm.", author: "Chăm sóc bản thân" },
  { text: "Hôm nay, chỉ cần làm tốt nhất những gì trong khả năng của bạn là đủ rồi.", author: "Góc bình yên" },
  { text: "Dù ngày hôm nay có khó khăn đến đâu, bạn vẫn đã vượt qua rất kiên cường.", author: "Lời nhắn gửi yêu thương" }
];

export async function initHomePage() {
  const user = await DataService.getCurrentUser();
  if (!user) return;

  // 1. Pick a random gentle quote
  renderDailyQuote();

  // 2. Setup Quick Check-in Mood Selector
  let selectedMood = 'good';
  const moodOptions = document.querySelectorAll('.home-mood-option');
  moodOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      moodOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedMood = opt.dataset.mood;
    });
  });

  // 3. Quick Check-in Save Handler
  const quickSaveBtn = document.getElementById('quick-checkin-save-btn');
  const quickTextarea = document.getElementById('quick-checkin-text');

  if (quickSaveBtn && quickTextarea) {
    quickSaveBtn.addEventListener('click', async () => {
      const content = quickTextarea.value.trim();

      if (!selectedMood && !content) {
        showToast('Vui lòng chọn một tâm trạng hoặc viết cảm xúc của bạn.', 'error');
        return;
      }

      try {
        quickSaveBtn.disabled = true;
        quickSaveBtn.innerHTML = '<span class="spinner"></span> Đang lưu...';

        await DataService.addCheckin(user.uid, {
          mood: selectedMood,
          content: content,
          dateKey: new Date().toISOString().split('T')[0]
        });

        showToast('Đã lưu cảm xúc thành công! Hãy mỉm cười và tự hào về bản thân nhé', 'success');
        quickTextarea.value = '';

        // Refresh stats & recent entries
        await loadHomeData(user.uid);
      } catch (err) {
        console.error("Save quick checkin error:", err);
        showToast(err.message || 'Không thể lưu. Vui lòng thử lại.', 'error');
      } finally {
        quickSaveBtn.disabled = false;
        quickSaveBtn.innerHTML = 'Lưu cảm xúc';
      }
    });
  }

  // 4. Initial load of check-ins and stats
  await loadHomeData(user.uid);
}

function renderDailyQuote() {
  const quoteEl = document.getElementById('daily-quote-text');
  const authorEl = document.getElementById('daily-quote-author');
  if (quoteEl && authorEl) {
    const random = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
    quoteEl.textContent = `"${random.text}"`;
    authorEl.textContent = `— ${random.author}`;
  }
}

async function loadHomeData(uid) {
  const checkins = await DataService.getCheckins(uid);
  const stats = DataService.calculateStats(checkins);

  // Update Mini Stats
  const statTotalEl = document.getElementById('home-stat-total');
  const statStreakEl = document.getElementById('home-stat-streak');
  const statGoodEl = document.getElementById('home-stat-good');

  if (statTotalEl) statTotalEl.textContent = stats.total;
  if (statStreakEl) statStreakEl.textContent = stats.streak;
  if (statGoodEl) statGoodEl.textContent = stats.moodCounts.good + stats.moodCounts.joy;

  // Render Recent Check-ins List
  const listContainer = document.getElementById('home-recent-list');
  if (!listContainer) return;

  if (checkins.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <img src="assets/images/blossom-empty.svg" alt="Chưa có nhật ký" />
        <h3>Chưa có nhật ký nào</h3>
        <p>Hãy bắt đầu bằng cách ghi lại cảm xúc của bạn hôm nay tại ô bên trái nhé!</p>
      </div>
    `;
    return;
  }

  // Show top 3 recent
  const recent = checkins.slice(0, 3);
  const moodMap = {
    joy: { label: 'Rất vui', badge: 'badge-mood-joy', emoji: '😄' },
    good: { label: 'Tốt', badge: 'badge-mood-good', emoji: '😊' },
    neutral: { label: 'Bình thường', badge: 'badge-mood-neutral', emoji: '😐' },
    sad: { label: 'Buồn', badge: 'badge-mood-sad', emoji: '😢' },
    anxious: { label: 'Lo lắng', badge: 'badge-mood-anxious', emoji: '😰' },
    tired: { label: 'Mệt mỏi', badge: 'badge-mood-tired', emoji: '🥱' }
  };

  listContainer.innerHTML = recent.map(item => {
    const m = moodMap[item.mood] || moodMap.good;
    const dateFormatted = formatShortDate(item.createdAt || item.dateKey);
    return `
      <div class="journal-item" data-id="${item.checkinId}">
        <div class="journal-item-header">
          <div class="journal-item-meta">
            <span class="badge ${m.badge}">${m.emoji} ${m.label}</span>
            <span class="journal-date">${dateFormatted}</span>
          </div>
        </div>
        <div class="journal-preview">${escapeHtml(item.content || 'Không có ghi chú thêm.')}</div>
        <div class="journal-actions">
          <button class="btn btn-ghost btn-sm view-detail-btn" data-id="${item.checkinId}">Xem chi tiết</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach view detail modal listeners
  listContainer.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = checkins.find(c => c.checkinId === id);
      if (target) {
        const m = moodMap[target.mood] || moodMap.good;
        showConfirmModal({
          title: `Nhật ký ngày ${formatShortDate(target.createdAt || target.dateKey)}`,
          message: `
            <div style="margin-bottom: 0.75rem;">
              <span class="badge ${m.badge}">${m.emoji} ${m.label}</span>
            </div>
            <p style="white-space: pre-wrap; font-size: 0.95rem;">${escapeHtml(target.content || 'Chỉ ghi nhận cảm xúc không kèm ghi chú.')}</p>
          `,
          confirmText: 'Đóng',
          cancelText: '',
          onConfirm: () => {}
        });
      }
    });
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
