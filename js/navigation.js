/**
 * SereneBloom - Shared Navigation, Layout & UI Utilities
 */

import { DataService } from './data-service.js';

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function getFormattedDate() {
  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${dayName}, ${date} tháng ${month}, ${year}`;
}

export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✅',
    error: '⚠️',
    info: '🌸'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || '🌸'}</span>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showConfirmModal({ title = 'Xác nhận', message, confirmText = 'Đồng ý', cancelText = 'Hủy', onConfirm }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <p style="font-size: var(--font-size-sm); color: var(--color-text-main); line-height: 1.6;">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>
        <button class="btn btn-danger" id="modal-confirm-btn">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('active'));

  const close = () => {
    backdrop.classList.remove('active');
    setTimeout(() => backdrop.remove(), 250);
  };

  backdrop.querySelector('#modal-close-btn').addEventListener('click', close);
  backdrop.querySelector('#modal-cancel-btn').addEventListener('click', close);
  backdrop.querySelector('#modal-confirm-btn').addEventListener('click', () => {
    close();
    if (typeof onConfirm === 'function') onConfirm();
  });
}

// Update Topbar and Sidebar user display
export async function initUserDisplay() {
  const user = await DataService.getCurrentUser();
  if (!user) return;

  // Header / Topbar
  const topbarUserAvatar = document.querySelectorAll('.user-avatar-initial');
  topbarUserAvatar.forEach(el => {
    el.textContent = user.avatarInitial || 'U';
  });

  const userNameEls = document.querySelectorAll('.user-display-name');
  userNameEls.forEach(el => {
    el.textContent = user.displayName || 'Bạn';
  });

  const userEmailEls = document.querySelectorAll('.user-display-email');
  userEmailEls.forEach(el => {
    el.textContent = user.email || '';
  });

  // Calculate Streak
  const checkins = await DataService.getCheckins(user.uid);
  const stats = DataService.calculateStats(checkins);
  const streakEls = document.querySelectorAll('.streak-display-count');
  streakEls.forEach(el => {
    el.textContent = `Chuỗi ${stats.streak} ngày`;
  });

  // Topbar date display
  const dateEls = document.querySelectorAll('.topbar-date-display');
  dateEls.forEach(el => {
    el.textContent = getFormattedDate();
  });

  // Dynamic greeting in Home
  const greetingEls = document.querySelectorAll('.dynamic-greeting-title');
  greetingEls.forEach(el => {
    el.textContent = `${getGreeting()}, ${user.displayName || 'bạn'}`;
  });
}

// Enforce login on protected pages
export async function requireAuth() {
  const user = await DataService.getCurrentUser();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  return user;
}

// Setup active navigation highlights and logout listeners
export async function initNavigation(activePage = 'home') {
  // Check auth first
  const user = await requireAuth();
  if (!user) return;

  document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
    if (link.dataset.page === activePage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Logout buttons
  document.querySelectorAll('.logout-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showConfirmModal({
        title: 'Đăng xuất',
        message: 'Bạn có chắc chắn muốn đăng xuất khỏi SereneBloom?',
        confirmText: 'Đăng xuất',
        onConfirm: async () => {
          await DataService.logoutUser();
          showToast('Đã đăng xuất thành công', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 600);
        }
      });
    });
  });

  initUserDisplay();
}
