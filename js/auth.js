/**
 * SereneBloom - Authentication Controller
 * Handles login, registration, password reset and session protection
 */

import { DataService } from './data-service.js';
import { showToast } from './navigation.js';

export function initAuthPage() {
  // 1. Login Form Handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');

      if (!email || !password) {
        showToast('Vui lòng nhập đầy đủ email và mật khẩu', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';

        await DataService.loginUser(email, password);
        showToast('Đăng nhập thành công! Chào mừng bạn quay trở lại.', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } catch (err) {
        console.error("Login error:", err);
        showToast(err.message || 'Email hoặc mật khẩu không chính xác', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Đăng nhập';
      }
    });

    // Quick demo login button
    const quickDemoBtn = document.getElementById('quick-demo-login-btn');
    if (quickDemoBtn) {
      quickDemoBtn.addEventListener('click', async () => {
        document.getElementById('login-email').value = 'ngochan@thpt.edu.vn';
        document.getElementById('login-password').value = 'serene123';
        loginForm.dispatchEvent(new Event('submit'));
      });
    }
  }

  // 2. Register Form Handling
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      const submitBtn = document.getElementById('register-submit-btn');

      if (!name || !email || !password) {
        showToast('Vui lòng điền đầy đủ các thông tin', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Mật khẩu cần tối thiểu 6 ký tự', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không trùng khớp', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Đang tạo tài khoản...';

        await DataService.registerUser(email, password, name);
        showToast('Tạo tài khoản thành công! Bắt đầu hành trình chăm sóc bản thân.', 'success');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);
      } catch (err) {
        console.error("Register error:", err);
        showToast(err.message || 'Không thể tạo tài khoản. Vui lòng thử lại.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Tạo tài khoản';
      }
    });
  }

  // 3. Forgot Password Form Handling
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const submitBtn = document.getElementById('forgot-submit-btn');

      if (!email) {
        showToast('Vui lòng nhập địa chỉ email của bạn', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Đang gửi liên kết...';

        await DataService.resetPassword(email);
        showToast('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!', 'success', 5000);

        const successBox = document.getElementById('forgot-success-box');
        if (successBox) {
          successBox.style.display = 'block';
          forgotForm.style.display = 'none';
        }
      } catch (err) {
        console.error("Forgot error:", err);
        showToast(err.message || 'Không thể gửi email. Vui lòng thử lại.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Gửi liên kết khôi phục';
      }
    });
  }

  // Password visibility toggle helper
  document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });
}
