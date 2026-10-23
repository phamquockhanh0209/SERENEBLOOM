/**
 * SereneBloom - Tab 3: Check-in & Emotional Journal Controller (checkin.html)
 */

import { DataService } from './data-service.js';
import { showToast, showConfirmModal } from './navigation.js';

let activeMoodFilter = 'all';
let searchQuery = '';

export async function initCheckinPage() {
  const user = await DataService.getCurrentUser();
  if (!user) return;

  // 1. Setup Form Date Input to Today
  const dateInput = document.getElementById('checkin-date-input');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 2. Setup Mood Selector
  let selectedMood = 'good';
  const moodOptions = document.querySelectorAll('.checkin-mood-option');
  moodOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      moodOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedMood = opt.dataset.mood;
    });
  });

  // 3. Form Submit / Save
  const form = document.getElementById('checkin-full-form');
  const contentInput = document.getElementById('checkin-content-input');
  const saveBtn = document.getElementById('checkin-submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = contentInput.value.trim();
      const dateKey = dateInput.value;

      if (!selectedMood && !content) {
        showToast('Vui lòng chọn một tâm trạng hoặc viết cảm xúc của bạn.', 'error');
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span> Đang lưu...';

        await DataService.addCheckin(user.uid, {
          mood: selectedMood,
          content,
          dateKey
        });

        showToast('Đã lưu nhật ký cảm xúc thành công!', 'success');
        contentInput.value = '';

        await renderJournalList(user.uid);
      } catch (err) {
        console.error("Checkin save error:", err);
        showToast(err.message || 'Lỗi khi lưu nhật ký. Vui lòng thử lại.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Lưu vào nhật ký';
      }
    });
  }

  // 4. Filter Pills Setup
  document.querySelectorAll('.journal-filter-pill').forEach(pill => {
    pill.addEventListener('click', async () => {
      document.querySelectorAll('.journal-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeMoodFilter = pill.dataset.mood;
      await renderJournalList(user.uid);
    });
  });

  // Search input
  const searchInput = document.getElementById('journal-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      await renderJournalList(user.uid);
    });
  }

  // 5. Setup "Thả bay muộn phiền" (Release Worries Balloon)
  initBalloonRelease();

  // 6. Setup Drawing Canvas
  initMoodCanvas();

  // 7. Initial List Render
  await renderJournalList(user.uid);
}

const MOOD_DATA = {
  joy: { label: 'Rất vui', badge: 'badge-mood-joy', emoji: '😄' },
  good: { label: 'Tốt', badge: 'badge-mood-good', emoji: '😊' },
  neutral: { label: 'Bình thường', badge: 'badge-mood-neutral', emoji: '😐' },
  sad: { label: 'Buồn', badge: 'badge-mood-sad', emoji: '😢' },
  anxious: { label: 'Lo lắng', badge: 'badge-mood-anxious', emoji: '😰' },
  tired: { label: 'Mệt mỏi', badge: 'badge-mood-tired', emoji: '🥱' }
};

async function renderJournalList(uid) {
  const container = document.getElementById('journal-records-container');
  if (!container) return;

  const checkins = await DataService.getCheckins(uid);

  // Apply filters
  let filtered = checkins;
  if (activeMoodFilter !== 'all') {
    filtered = filtered.filter(c => c.mood === activeMoodFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter(c => 
      (c.content && c.content.toLowerCase().includes(searchQuery)) ||
      (c.dateKey && c.dateKey.includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="assets/images/blossom-empty.svg" alt="Không tìm thấy nhật ký" />
        <h3>Không có bản ghi phù hợp</h3>
        <p>Thử đổi bộ lọc hoặc thêm một trang nhật ký mới ở trên nhé.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const m = MOOD_DATA[item.mood] || MOOD_DATA.good;
    const formattedDate = formatFullDate(item.dateKey || item.createdAt);
    return `
      <div class="journal-item" data-id="${item.checkinId}">
        <div class="journal-item-header">
          <div class="journal-item-meta">
            <span class="badge ${m.badge}">${m.emoji} ${m.label}</span>
            <span class="journal-date">${formattedDate}</span>
          </div>
          <div class="journal-actions">
            <button class="btn btn-ghost btn-sm edit-journal-btn" data-id="${item.checkinId}">
              ✏️ Sửa
            </button>
            <button class="btn btn-ghost btn-sm del-journal-btn" data-id="${item.checkinId}" style="color: var(--color-error);">
              🗑️ Xóa
            </button>
          </div>
        </div>
        <div class="journal-preview">${escapeHtml(item.content || 'Chỉ ghi nhận trạng thái cảm xúc.')}</div>
      </div>
    `;
  }).join('');

  // Attach Edit Listeners
  container.querySelectorAll('.edit-journal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = checkins.find(c => c.checkinId === id);
      if (target) openEditModal(uid, target);
    });
  });

  // Attach Delete Listeners
  container.querySelectorAll('.del-journal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      showConfirmModal({
        title: 'Xóa nhật ký',
        message: 'Bạn có chắc chắn muốn xóa bản ghi nhật ký này? Thống kê tâm trạng sẽ được cập nhật lại.',
        confirmText: 'Xóa bản ghi',
        onConfirm: async () => {
          await DataService.deleteCheckin(uid, id);
          showToast('Đã xóa nhật ký cảm xúc.', 'info');
          await renderJournalList(uid);
        }
      });
    });
  });
}

function openEditModal(uid, item) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop active';
  backdrop.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">Chỉnh sửa nhật ký</h3>
        <button class="modal-close" id="edit-modal-close">&times;</button>
      </div>
      <form id="edit-journal-form">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Tâm trạng</label>
          <div class="mood-selector" id="edit-mood-selector" style="margin: 0.5rem 0;">
            ${Object.keys(MOOD_DATA).map(key => `
              <div class="mood-option edit-mood-opt ${item.mood === key ? 'selected' : ''}" data-mood="${key}">
                <span class="mood-emoji">${MOOD_DATA[key].emoji}</span>
                <span class="mood-label">${MOOD_DATA[key].label}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Ngày ghi nhận</label>
          <input type="date" id="edit-date-input" value="${item.dateKey || item.createdAt.split('T')[0]}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung</label>
          <textarea id="edit-content-input" rows="4">${escapeHtml(item.content || '')}</textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="edit-cancel-btn">Hủy</button>
          <button type="submit" class="btn btn-primary" id="edit-submit-btn">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);

  let currentMood = item.mood;
  backdrop.querySelectorAll('.edit-mood-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      backdrop.querySelectorAll('.edit-mood-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      currentMood = opt.dataset.mood;
    });
  });

  const close = () => {
    backdrop.classList.remove('active');
    setTimeout(() => backdrop.remove(), 250);
  };

  backdrop.querySelector('#edit-modal-close').addEventListener('click', close);
  backdrop.querySelector('#edit-cancel-btn').addEventListener('click', close);

  backdrop.querySelector('#edit-journal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newContent = backdrop.querySelector('#edit-content-input').value.trim();
    const newDate = backdrop.querySelector('#edit-date-input').value;

    await DataService.updateCheckin(uid, item.checkinId, {
      mood: currentMood,
      content: newContent,
      dateKey: newDate
    });

    close();
    showToast('Đã cập nhật nhật ký thành công!', 'success');
    await renderJournalList(uid);
  });
}

// 5. "Thả bay muộn phiền" Logic
function initBalloonRelease() {
  const releaseBtn = document.getElementById('balloon-release-btn');
  const balloonWrap = document.getElementById('balloon-svg-wrap');
  const inputEl = document.getElementById('balloon-worry-input');
  const feedbackEl = document.getElementById('balloon-released-feedback');
  const resetBtn = document.getElementById('balloon-reset-btn');

  if (!releaseBtn || !balloonWrap) return;

  releaseBtn.addEventListener('click', () => {
    const text = inputEl.value.trim();
    if (!text) {
      showToast('Hãy viết ra điều bạn muốn buông bỏ trước khi thả bay nhé ', 'info');
      return;
    }

    // Trigger floating animation
    balloonWrap.classList.add('released');
    inputEl.disabled = true;
    releaseBtn.disabled = true;

    setTimeout(() => {
      if (feedbackEl) feedbackEl.style.display = 'block';
    }, 1800);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      balloonWrap.classList.remove('released');
      inputEl.disabled = false;
      inputEl.value = '';
      releaseBtn.disabled = false;
      if (feedbackEl) feedbackEl.style.display = 'none';
    });
  }
}

// 6. Interactive Mood Drawing Canvas
function initMoodCanvas() {
  const canvas = document.getElementById('mood-drawing-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#668B7B';
  let lineWidth = 4;

  // Resize canvas to match display size
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Color Swatches
  document.querySelectorAll('.canvas-color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.canvas-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentColor = swatch.dataset.color;
    });
  });

  // Brush size
  const brushSelect = document.getElementById('canvas-brush-size');
  if (brushSelect) {
    brushSelect.addEventListener('change', (e) => {
      lineWidth = parseInt(e.target.value, 10);
    });
  }

  // Clear button
  document.getElementById('canvas-clear-btn')?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showToast('Đã xóa bảng vẽ.', 'info');
  });

  // Drawing event handlers (Mouse & Touch)
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDraw = (e) => {
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', stopDraw);
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
