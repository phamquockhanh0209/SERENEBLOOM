/**
 * SereneBloom - Tab 4: Healing Corner Controller (healing.html)
 * Includes real Bloom Jigsaw Mini-Game (drag & drop / touch), Guided Breathing, Self-care, and Articles.
 */

import { showToast, showConfirmModal } from './navigation.js';

export function initHealingPage() {
  // 1. Category Filter Tabs
  initCategoryTabs();

  // 2. Bloom Jigsaw Puzzle Game
  initBloomJigsaw();

  // 3. Guided Box Breathing Visualizer
  initGuidedBreathing();

  // 4. Water Intake Tracker
  initWaterTracker();

  // 5. Gratitude Note Modal
  initGratitudeAction();

  // 6. Psychology Articles Modal
  initArticlesModal();
}

// 1. Category Tabs Switching
function initCategoryTabs() {
  const tabs = document.querySelectorAll('.category-tab');
  const sections = document.querySelectorAll('.healing-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetCategory = tab.dataset.category;
      sections.forEach(sec => {
        if (targetCategory === 'all' || sec.dataset.category === targetCategory) {
          sec.style.display = 'flex';
        } else {
          sec.style.display = 'none';
        }
      });
    });
  });
}

// 2. Bloom Jigsaw Puzzle Implementation
const PUZZLE_IMAGES = {
  'puzzle-1': 'assets/images/hosen.webp',
  'puzzle-2': 'assets/images/doihoa.jpg',
  'puzzle-3': 'assets/images/gocdocsach.jpg'
};

let currentPuzzleKey = 'puzzle-1';
let placedPiecesCount = 0;
const TOTAL_PIECES = 9; // 3x3 grid

function initBloomJigsaw() {
  const gridContainer = document.getElementById('puzzle-grid');
  const trayContainer = document.getElementById('puzzle-tray');
  const themePills = document.querySelectorAll('.puzzle-pill');
  const resetBtn = document.getElementById('puzzle-reset-btn');

  if (!gridContainer || !trayContainer) return;

  // Theme switch
  themePills.forEach(pill => {
    pill.addEventListener('click', () => {
      themePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPuzzleKey = pill.dataset.theme;
      startPuzzleGame();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      startPuzzleGame();
      showToast('Đã xáo lại các mảnh ghép!', 'info');
    });
  }

  startPuzzleGame();
}

function startPuzzleGame() {
  const gridContainer = document.getElementById('puzzle-grid');
  const trayContainer = document.getElementById('puzzle-tray');
  const progressFill = document.getElementById('puzzle-progress-fill');
  const progressText = document.getElementById('puzzle-progress-text');
  const celebration = document.getElementById('puzzle-celebration');

  if (!gridContainer || !trayContainer) return;

  gridContainer.innerHTML = '';
  trayContainer.innerHTML = '';
  placedPiecesCount = 0;
  if (celebration) celebration.style.display = 'none';
  updatePuzzleProgress();

  const imgUrl = PUZZLE_IMAGES[currentPuzzleKey] || PUZZLE_IMAGES['puzzle-1'];

  // Create 9 Target Slots (3x3)
  for (let index = 0; index < TOTAL_PIECES; index++) {
    const slot = document.createElement('div');
    slot.className = 'puzzle-slot';
    slot.dataset.slotIndex = index;
    gridContainer.appendChild(slot);
  }

  // Create 9 Scrambled Pieces
  const pieceIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);

  pieceIndices.forEach(pieceIndex => {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.dataset.pieceIndex = pieceIndex;
    piece.style.backgroundImage = `url('${imgUrl}')`;

    // Calculate background-position based on 3x3 grid (300px total -> 100px per piece)
    const row = Math.floor(pieceIndex / 3);
    const col = pieceIndex % 3;
    piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;

    setupPieceDragAndDrop(piece);
    trayContainer.appendChild(piece);
  });
}

function setupPieceDragAndDrop(piece) {
  let startX = 0, startY = 0, currentX = 0, currentY = 0;
  let isDragging = false;

  const onPointerDown = (e) => {
    if (piece.classList.contains('placed')) return;
    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX);
    startY = e.clientY || (e.touches && e.touches[0].clientY);
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    updatePiecePos(startX, startY);

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  };

  const updatePiecePos = (x, y) => {
    piece.style.left = `${x - 45}px`;
    piece.style.top = `${y - 45}px`;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    updatePiecePos(clientX, clientY);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    if (e.touches && e.touches[0]) {
      updatePiecePos(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onPointerUp);

    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

    // Hide piece momentarily to detect slot underneath
    piece.style.display = 'none';
    const elemBelow = document.elementFromPoint(clientX, clientY);
    piece.style.display = '';

    const slot = elemBelow ? elemBelow.closest('.puzzle-slot') : null;
    const pieceIndex = parseInt(piece.dataset.pieceIndex, 10);

    if (slot && !slot.hasChildNodes()) {
      const slotIndex = parseInt(slot.dataset.slotIndex, 10);
      if (slotIndex === pieceIndex) {
        // Correct Placement!
        piece.classList.add('placed');
        piece.style.position = 'static';
        piece.style.left = '';
        piece.style.top = '';
        piece.style.zIndex = '';
        slot.appendChild(piece);

        placedPiecesCount++;
        updatePuzzleProgress();

        if (placedPiecesCount === TOTAL_PIECES) {
          triggerPuzzleCompletion();
        }
        return;
      }
    }

    // Return back to tray if dropped incorrectly
    piece.style.position = 'static';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.zIndex = '';
    document.getElementById('puzzle-tray')?.appendChild(piece);
  };

  piece.addEventListener('pointerdown', onPointerDown);
}

function updatePuzzleProgress() {
  const fill = document.getElementById('puzzle-progress-fill');
  const text = document.getElementById('puzzle-progress-text');
  const percent = Math.round((placedPiecesCount / TOTAL_PIECES) * 100);

  if (fill) fill.style.width = `${percent}%`;
  if (text) text.textContent = `${placedPiecesCount}/${TOTAL_PIECES} mảnh đã hoàn thành`;
}

function triggerPuzzleCompletion() {
  const celebration = document.getElementById('puzzle-celebration');
  if (celebration) {
    celebration.style.display = 'block';
  }
  showToast('Chúc mừng bạn! Bức tranh đã được ghép hoàn chỉnh tuyệt đẹp ', 'success');
}

// 3. Guided Box Breathing (4-4-4-4)
let breathingInterval = null;
let breathingPhase = 0;
let isBreathingActive = false;

function initGuidedBreathing() {
  const toggleBtn = document.getElementById('breathing-toggle-btn');
  const circle = document.getElementById('breathing-circle');
  const promptEl = document.getElementById('breathing-prompt');
  const counterEl = document.getElementById('breathing-counter');

  if (!toggleBtn || !circle) return;

  const phases = [
    { name: 'Hít vào chậm rãi', className: 'inhale', duration: 4 },
    { name: 'Giữ hơi thở nhẹ nhàng', className: 'hold', duration: 4 },
    { name: 'Thở ra từ từ', className: 'exhale', duration: 4 },
    { name: 'Thả lỏng toàn thân', className: 'relax', duration: 4 }
  ];

  toggleBtn.addEventListener('click', () => {
    if (isBreathingActive) {
      // Stop
      clearInterval(breathingInterval);
      isBreathingActive = false;
      toggleBtn.innerHTML = 'Bắt đầu hít thở';
      promptEl.textContent = 'Nhấn để bắt đầu';
      counterEl.textContent = '4';
      circle.className = 'breathing-circle';
    } else {
      // Start
      isBreathingActive = true;
      toggleBtn.innerHTML = '<span>⏸️</span> Tạm dừng';
      startBreathingCycle(phases, circle, promptEl, counterEl);
    }
  });
}

function startBreathingCycle(phases, circle, promptEl, counterEl) {
  let currentPhaseIndex = 0;
  let remainingSeconds = 4;

  const runStep = () => {
    const phase = phases[currentPhaseIndex];
    circle.className = `breathing-circle ${phase.className}`;
    promptEl.textContent = phase.name;
    counterEl.textContent = remainingSeconds;

    remainingSeconds--;

    if (remainingSeconds < 0) {
      currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
      remainingSeconds = phases[currentPhaseIndex].duration;
    }
  };

  runStep();
  breathingInterval = setInterval(runStep, 1000);
}

// 4. Water Tracker
function initWaterTracker() {
  const cups = document.querySelectorAll('.water-cup');
  const countDisplay = document.getElementById('water-count-display');
  const todayKey = 'serene_water_' + new Date().toISOString().split('T')[0];

  let currentWater = parseInt(localStorage.getItem(todayKey) || '0', 10);

  cups.forEach((cup, idx) => {
    cup.addEventListener('click', () => {
      currentWater = idx + 1;
      localStorage.setItem(todayKey, currentWater.toString());
      updateCups();
      showToast(`Đã ghi nhận ${currentWater} ly nước hôm nay. Rất tốt cho cơ thể! 💧`, 'info');
    });
  });

  updateCups();
}

// 5. Gratitude Note Modal
function initGratitudeAction() {
  const btn = document.getElementById('gratitude-open-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showConfirmModal({
      title: '3 Điều Bạn Biết Ơn Hôm Nay',
      message: `
        <p style="margin-bottom: 0.75rem; color: var(--color-text-muted); font-size: 0.85rem;">
          Khi tâm trí hướng về sự biết ơn, những lo lắng học đường sẽ dần lắng dịu.
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <input type="text" id="gratitude-1" placeholder="1. Một điều nho nhỏ khiến bạn mỉm cười..." style="padding: 0.6rem;" />
          <input type="text" id="gratitude-2" placeholder="2. Một người bạn hay người thân đã giúp đỡ bạn..." style="padding: 0.6rem;" />
          <input type="text" id="gratitude-3" placeholder="3. Một điều bạn tự hào về chính bản thân mình..." style="padding: 0.6rem;" />
        </div>
      `,
      confirmText: 'Lưu ghi nhớ',
      cancelText: 'Đóng',
      onConfirm: () => {
        showToast('Trái tim bạn đã được tưới mát bằng lòng biết ơn ', 'success');
      }
    });
  });
}

// 6. Psychology Articles Reader Modal
function initArticlesModal() {
  const articles = [
    {
      id: 'art-1',
      title: 'Vượt qua áp lực thi cử và kỳ vọng gia đình',
      content: `
        Áp lực điểm số và kỳ vọng từ cha mẹ là nỗi trăn trở phổ biến của hầu hết học sinh THPT. 
        Tuy nhiên, giá trị của bạn không bao giờ được định nghĩa bởi một con số trên trang giấy.
        
        Để bảo vệ sức khỏe tinh thần trước kỳ thi:
        1. Chia nhỏ mục tiêu học tập theo kỹ thuật Pomodoro (học 25 phút, nghỉ 5 phút).
        2. Dành thời gian trò chuyện chân thành với cha mẹ về sự cố gắng và cả những giới hạn hiện tại của bản thân.
        3. Đảm bảo giấc ngủ tối thiểu 7 tiếng mỗi đêm — giấc ngủ giúp não bộ củng cố kiến thức tốt gấp đôi việc thức trắng đêm ôn thi.
      `
    },
    {
      id: 'art-2',
      title: 'Hiểu về cơn bão cảm xúc tuổi 17',
      content: `
        Ở lứa tuổi thanh thiếu niên, vùng não xử lý cảm xúc (hạch hạnh nhân) phát triển nhanh hơn vùng não lý trí (vỏ não trước trán). 
        Điều này lý giải vì sao đôi khi bạn cảm thấy một sự việc nhỏ cũng có thể khiến tâm trạng bùng nổ hoặc chùng xuống đột ngột.
        
        Cách đối diện dịu dàng:
        - Đặt tên cho cảm xúc: "Mình đang thấy thất vọng", "Mình đang lo sợ".
        - Nhớ rằng cảm xúc giống như những đợt sóng biển — dâng lên rồi chắc chắn sẽ hạ xuống.
        - Tìm kiếm một không gian an toàn (như viết nhật ký tại SereneBloom) để giải tỏa thay vì kìm nén.
      `
    },
    {
      id: 'art-3',
      title: '5 phút chánh niệm giải tỏa căng thẳng trước giờ kiểm tra',
      content: `
        Ngay trước khi giám thị phát đề thi, bạn có thể thực hành bài tập 5 ngón tay:
        1. Xòe bàn tay trái ra, dùng ngón trỏ tay phải men theo từng ngón tay.
        2. Men ngón tay lên thì hít vào chậm qua mũi.
        3. Men ngón tay xuống thì thở ra êm qua miệng.
        4. Lặp lại với cả 5 ngón tay.
        
        Chỉ sau 2 phút, nhịp tim của bạn sẽ ổn định trở lại và tâm trí sẽ lấy lại sự sáng suốt.
      `
    }
  ];

  document.querySelectorAll('.article-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const artId = btn.dataset.articleId;
      const target = articles.find(a => a.id === artId);
      if (target) {
        showConfirmModal({
          title: target.title,
          message: `<div style="white-space: pre-line; line-height: 1.7; font-size: 0.92rem; color: var(--color-text-main);">${escapeHtml(target.content)}</div>`,
          confirmText: 'Đã hiểu',
          cancelText: 'Đóng',
          onConfirm: () => {}
        });
      }
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
