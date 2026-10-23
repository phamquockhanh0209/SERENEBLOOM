/**
 * SereneBloom - Tab 2: AI Chat Controller (chat.html)
 */

import { DataService } from './data-service.js';
import { sendMessageToGemini } from './services/gemini-client.js';
import { showToast, showConfirmModal } from './navigation.js';

let activeSessionId = null;
let isAiResponding = false;

export async function initChatPage() {
  const user = await DataService.getCurrentUser();
  if (!user) return;

  const newSessionBtn = document.getElementById('chat-new-session-btn');
  const sendBtn = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-input-textarea');
  const sessionsPane = document.getElementById('chat-sessions-pane');
  const toggleSessionsBtn = document.getElementById('chat-toggle-sessions');

  // Mobile sessions toggle
  if (toggleSessionsBtn && sessionsPane) {
    toggleSessionsBtn.addEventListener('click', () => {
      sessionsPane.classList.toggle('open');
    });
  }

  // Create new session button
  if (newSessionBtn) {
    newSessionBtn.addEventListener('click', async () => {
      await createNewSession(user.uid);
    });
  }

  // Auto-resize input textarea and handle Enter to send
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(user.uid);
      }
    });
  }

  // Send button click
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      handleSendMessage(user.uid);
    });
  }

  // Load Sessions
  await loadSessionsList(user.uid);
}

async function loadSessionsList(uid) {
  const sessions = await DataService.getChatSessions(uid);
  const listEl = document.getElementById('chat-sessions-list');
  if (!listEl) return;

  if (sessions.length === 0) {
    listEl.innerHTML = `
      <li style="padding: 1rem; text-align: center; font-size: var(--font-size-xs); color: var(--color-text-muted);">
        Chưa có phiên trò chuyện nào. Nhấn dấu (+) để bắt đầu.
      </li>
    `;
    renderEmptyChatScreen(uid);
    return;
  }

  listEl.innerHTML = sessions.map(sess => {
    const isActive = sess.sessionId === activeSessionId;
    return `
      <li class="chat-session-item ${isActive ? 'active' : ''}" data-id="${sess.sessionId}">
        <div class="chat-session-info">
          <span class="chat-session-name">${escapeHtml(sess.title || 'Cuộc trò chuyện')}</span>
          <span class="chat-session-date">${formatRelativeTime(sess.updatedAt || sess.createdAt)}</span>
        </div>
        <button class="chat-session-del-btn" data-id="${sess.sessionId}" title="Xóa phiên chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </li>
    `;
  }).join('');

  // Switch session click
  listEl.querySelectorAll('.chat-session-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-session-del-btn')) return;
      const sId = item.dataset.id;
      switchSession(uid, sId);
      // Close mobile drawer if open
      document.getElementById('chat-sessions-pane')?.classList.remove('open');
    });
  });

  // Delete session click
  listEl.querySelectorAll('.chat-session-del-btn').forEach(delBtn => {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sId = delBtn.dataset.id;
      showConfirmModal({
        title: 'Xóa phiên trò chuyện',
        message: 'Bạn có chắc chắn muốn xóa phiên trò chuyện này cùng toàn bộ tin nhắn liên quan?',
        confirmText: 'Xóa',
        cancelText: 'Giữ lại',
        onConfirm: async () => {
          await DataService.deleteChatSession(uid, sId);
          showToast('Đã xóa phiên trò chuyện', 'info');
          if (activeSessionId === sId) {
            activeSessionId = null;
          }
          await loadSessionsList(uid);
        }
      });
    });
  });

  // If no active session selected yet, select the first one
  if (!activeSessionId && sessions.length > 0) {
    switchSession(uid, sessions[0].sessionId);
  }
}

async function createNewSession(uid) {
  const newSession = await DataService.createChatSession(uid, "Cuộc trò chuyện mới");
  activeSessionId = newSession.sessionId;
  await loadSessionsList(uid);
  await switchSession(uid, activeSessionId);
  showToast('Đã tạo phiên trò chuyện mới ', 'info');
}

async function switchSession(uid, sessionId) {
  activeSessionId = sessionId;
  
  // Highlight in sidebar
  document.querySelectorAll('.chat-session-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === sessionId);
  });

  const messagesContainer = document.getElementById('chat-messages-container');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="spinner"></span></div>';

  const messages = await DataService.getSessionMessages(uid, sessionId);

  if (messages.length === 0) {
    // Initial welcome AI message for this session
    messagesContainer.innerHTML = `
      <div class="chat-msg ai">
        <div class="chat-msg-avatar"><img src="assets/images/logo.png" alt="SereneBloom"></div>
        <div class="chat-msg-bubble">Chào bạn, mình là SereneBloom AI. Bạn đang cảm thấy thế nào hôm nay? Mình luôn ở đây để lắng nghe bất cứ điều gì bạn muốn chia sẻ mà không hề phán xét.</div>
      </div>
    `;
    return;
  }

  renderMessages(messages);
}

function renderMessages(messages) {
  const messagesContainer = document.getElementById('chat-messages-container');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = messages.map(msg => {
    const isUser = msg.role === 'user';
    return `
      <div class="chat-msg ${isUser ? 'user' : 'ai'}">
        <div class="chat-msg-avatar">${isUser ? '🌿' : '<img src="assets/images/logo.png" alt="SereneBloom">'}</div>
        <div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>
      </div>
    `;
  }).join('');

  scrollToBottom();
}

function renderEmptyChatScreen(uid) {
  const messagesContainer = document.getElementById('chat-messages-container');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = `
    <div class="chat-empty-container">
      <img src="assets/images/blossom-empty.svg" class="chat-blossom-illu" alt="Trò chuyện AI" />
      <h3 style="font-size: var(--font-size-lg); margin-bottom: 0.5rem;">Trò chuyện cùng SereneBloom AI</h3>
      <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); max-width: 420px; margin-bottom: 1.5rem;">
        Một góc nhỏ an toàn, ấm áp để bạn trút bỏ những áp lực học tập và tâm sự mà không sợ bị phán xét.
      </p>
      <button class="btn btn-primary" id="chat-start-btn">
      Bắt đầu trò chuyện
      </button>
    </div>
  `;

  document.getElementById('chat-start-btn')?.addEventListener('click', () => {
    createNewSession(uid);
  });
}

async function handleSendMessage(uid) {
  if (isAiResponding) return;

  const chatInput = document.getElementById('chat-input-textarea');
  const text = chatInput.value.trim();
  if (!text) return;

  // If no session exists, create one first
  if (!activeSessionId) {
    const newSess = await DataService.createChatSession(uid, text.slice(0, 30));
    activeSessionId = newSess.sessionId;
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';

  // 1. Add user message
  await DataService.addChatMessage(uid, activeSessionId, 'user', text);
  appendSingleMessage('user', text);

  // 2. Show Typing Indicator
  isAiResponding = true;
  showTypingIndicator();

  try {
    // 3. Get history for context
    const currentMessages = await DataService.getSessionMessages(uid, activeSessionId);
    
    // 4. Call Gemini
    const aiReply = await sendMessageToGemini(text, currentMessages);

    // 5. Hide typing & save AI message
    hideTypingIndicator();
    await DataService.addChatMessage(uid, activeSessionId, 'ai', aiReply);
    appendSingleMessage('ai', aiReply);

    // Refresh session title / date in list
    await loadSessionsList(uid);
  } catch (err) {
    console.error("Chat send error:", err);
    hideTypingIndicator();
    appendSingleMessage('ai', 'Mình gặp một chút gián đoạn kết nối, nhưng mình luôn ở đây. Bạn thử gửi lại cho mình nhé!');
  } finally {
    isAiResponding = false;
  }
}

function appendSingleMessage(role, content) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Remove empty container if still present
  const empty = container.querySelector('.chat-empty-container');
  if (empty) empty.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;
  msgDiv.innerHTML = `
    <div class="chat-msg-avatar">${role === 'user' ? '🌿' : '<img src="assets/images/logo.png" alt="SereneBloom">'}</div>
    <div class="chat-msg-bubble">${escapeHtml(content)}</div>
  `;

  container.appendChild(msgDiv);
  scrollToBottom();
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg ai typing-wrap';
  typingDiv.id = 'chat-typing-indicator';
  typingDiv.innerHTML = `
    <div class="chat-msg-avatar"><img src="assets/images/logo.png" alt="SereneBloom"></div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
