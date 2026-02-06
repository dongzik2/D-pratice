
class LottoGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.initializeGame();
  }

  initializeGame() {
    this.tickets = this.tickets || 0;
    this.gameStarted = false;
    this.hintCountdown = 3;
    this.cardToFlip = null;
    this.confirmationAction = null;
    this.gradeCounts = { SSS: 1, SS: 2, S: 6, A: 10, B: 18, C: 12 };

    let gradePool = Object.entries(this.gradeCounts).flatMap(([grade, count]) => Array(count).fill(grade));

    for (let i = gradePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gradePool[i], gradePool[j]] = [gradePool[j], gradePool[i]];
    }

    this.boardData = gradePool.map((grade, i) => ({
      id: i + 1,
      grade: grade,
      flipped: false,
      hinted: false,
    }));

    this.render();
  }

  render() {
    const gradeColors = {
      SSS: 'var(--sss-color)', SS: 'var(--ss-color)', S: 'var(--s-color)',
      A: 'var(--a-color)', B: 'var(--b-color)', C: 'var(--c-color)',
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host { --modal-green: #1DB954; }
        @keyframes sparkle-text {
          0%, 100% { opacity: 0.8; text-shadow: 0 0 4px #fff, 0 0 8px #fff, 0 0 12px var(--primary-blue-light); }
          50% { opacity: 1; text-shadow: 0 0 8px #fff, 0 0 16px #fff, 0 0 24px var(--primary-blue-light); }
        }
        @keyframes hint-pulse-circle {
            0% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 10px rgba(0, 210, 255, 0.5); }
            50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 20px rgba(0, 210, 255, 0.8); }
            100% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 10px rgba(0, 210, 255, 0.5); }
        }

        .main-title { text-align: center; color: var(--text-color-bright); font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; font-family: 'Orbitron', sans-serif; }
        .game-wrapper { display: grid; grid-template-columns: 320px 1fr; gap: 20px; padding: 24px; background-color: var(--container-blue); border-radius: 20px; border: 2px solid #3a4a8a; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 1000px; }

        .sidebar { display: flex; flex-direction: column; gap: 20px; padding-top: 50px; }
        .sidebar-panel { background-color: #0d123c; padding: 20px; border-radius: 10px; border: 1px solid #2a3a7a; }
        
        .ticket-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .ticket-panel-header h2 { font-size: 1.8rem; font-weight: 700; margin: 0; color: var(--text-color-bright); }
        #ticket-count { font-size: 1.8rem; font-weight: 700; color: var(--highlight-yellow); }
        #buy-ticket-btn { background: linear-gradient(to top, #0088ff, #4ab3ff); color: var(--text-color-bright); font-size: 1.5rem; font-weight: 700; padding: 20px; border-radius: 10px; border: 2px solid #88cfff; box-shadow: 0 0 15px rgba(74, 179, 255, 0.5); cursor: pointer; width: 100%; text-align: center; box-sizing: border-box; }

        .info-panel h3, .reset-info-panel h3 { font-size: 1.3rem; margin: 0 0 10px 0; border-bottom: 1px solid #2a3a7a; padding-bottom: 10px; color: var(--text-color-bright); }
        .info-panel-content { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 1rem; color: var(--text-color-dark); }
        .info-item-label { display: flex; align-items: center; gap: 8px; }
        .color-box { width: 16px; height: 16px; border-radius: 3px;}

        .reset-info-panel p { color: var(--text-color-dark); margin: 5px 0; font-size: 0.9rem; line-height: 1.5; }
        #reset-btn { background-color: #2a3a7a; color: var(--text-color-dark); font-size: 1.1rem; padding: 15px; border-radius: 8px; border: 1px solid #4a5a9a; cursor: pointer; width: 100%; margin-top: 10px; transition: background-color 0.3s, color 0.3s, box-shadow 0.3s; }
        #reset-btn:disabled { background-color: #20284a; color: #5a688a; cursor: not-allowed; }
        #reset-btn:not(:disabled) { color: var(--text-color-bright); }
        #reset-btn:not(:disabled):hover { background-color: #3a4a8a; box-shadow: 0 0 10px rgba(74, 179, 255, 0.3); }

        .game-board-area { display: flex; flex-direction: column; justify-content: center; }
        .hint-tracker { text-align: center; margin-bottom: 20px; }
        .hint-tracker-content { display: flex; align-items: center; justify-content: center; gap: 40px; background-color: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; }
        .hint-steps { display: flex; gap: 20px; }
        .hint-step { width: 50px; height: 60px; background-color: #101842; clip-path: polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%); box-shadow: inset 0 4px 8px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-size: 1.5rem; color: var(--text-color-dark); font-family: 'Orbitron'; }
        .hint-step.active { background-color: var(--primary-blue-light); color: transparent; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px var(--primary-blue-light); }
        .hint-text-container { display: flex; align-items: center; justify-content: center; height: 60px; text-align: center; }
        #hint-countdown-span { font-size: 2.2rem; color: var(--highlight-yellow); font-weight: 700; }

        .game-board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .card { background-color: transparent; aspect-ratio: 1 / 1; cursor: pointer; perspective: 1000px; position: relative; }
        .card-inner { position: absolute; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
        .card.flipped .card-inner { transform: rotateY(180deg); }
        .card-front, .card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        .card-front { background-color: #0d123c; border: 1px solid #3a4a8a; font-family: 'Orbitron'; transition: border-color 0.3s, box-shadow 0.3s; }
        .card-front-content { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; position: relative; }
        .card-back { transform: rotateY(180deg); font-weight: bold; font-size: 2.2rem; color: #fff; border: 2px solid #fff; }
        
        .card-hint-overlay, .card-hint-text { display: none; }
        .card.hinted .card-front { border-color: var(--primary-blue-light); }
        .card.hinted .card-hint-overlay { display: block; position: absolute; top: 50%; left: 50%; width: 50px; height: 50px; margin-top: -25px; margin-left: -25px; background: radial-gradient(circle, rgba(0,210,255,0.6) 0%, rgba(0,150,255,0) 70%); border-radius: 50%; animation: hint-pulse-circle 2s infinite; }
        .card.hinted .card-hint-text { display: block; position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; color: white; font-size: 1rem; font-weight: bold; animation: sparkle-text 2s infinite; }

        .card:not(.flipped):hover .card-front { border-color: var(--highlight-yellow); }
        .card-number { color: var(--highlight-yellow); font-size: 2.2rem; transition: opacity 0.3s; z-index: 2; }
        .card:not(.flipped):hover .card-number { opacity: 0; }
        .card-hover-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); color: white; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; border-radius: 8px; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 3; }
        .card:not(.flipped):hover .card-hover-overlay { opacity: 1; }

        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); display: none; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background-color: white; border-radius: 8px; width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #eee; }
        .modal-title { font-size: 1rem; font-weight: 600; color: #333; }
        .modal-close-btn { font-size: 1.8rem; color: #aaa; cursor: pointer; line-height: 1; }
        .modal-close-btn:hover { color: #333; }
        .modal-body { padding: 40px 30px; text-align: center; }
        .modal-body .primary-message { color: #333; font-size: 1.25rem; font-weight: 700; margin: 0; }
        .modal-footer { display: flex; }
        .modal-footer button { flex: 1; background-color: #333; color: white; border: none; padding: 18px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: filter 0.2s; }
        .modal-footer button:hover { filter: brightness(1.2); }
        .modal-footer .confirm-btn { background-color: var(--modal-green); }
      </style>

      <h1 class="main-title">FC온라인 빠칭코 시뮬레이터</h1>
      <div class="game-wrapper">
        <div class="sidebar">
          <div class="sidebar-panel ticket-panel">
            <div class="ticket-panel-header">
              <h2>게임 참여권</h2>
              <div id="ticket-count">x${this.tickets}</div>
            </div>
            <div id="buy-ticket-btn">참여권 구매하기</div>
          </div>
          <div class="sidebar-panel info-panel">
             <h3>잔여 아이템</h3>
             <div class="info-panel-content"></div>
          </div>
          <div class="sidebar-panel reset-info-panel">
             <h3>게임판 리셋 방법</h3>
             <p>1. 1회 이상 참여 후 강제로 리셋</p>
             <p>2. 게임판 전부 획득 시 리셋 (보상 지급)</p>
             <button id="reset-btn" disabled>게임판 리셋하기</button>
          </div>
        </div>

        <div class="game-board-area">
            <div class="hint-tracker">
              <div class="hint-tracker-content">
                <div class="hint-steps">
                  <div class="hint-step"></div>
                  <div class="hint-step"></div>
                  <div class="hint-step"></div>
                </div>
                <div class="hint-text-container"></div>
              </div>
            </div>
          <div class="game-board">
              ${this.boardData.map(item => `
                <div class="card ${item.hinted ? 'hinted' : ''}" data-id="${item.id}">
                  <div class="card-inner">
                    <div class="card-front">
                      <div class="card-front-content">
                        <span class="card-number">${item.id}</span>
                        <div class="card-hint-overlay"></div>
                        <div class="card-hint-text">A등급 이상</div>
                      </div>
                      <div class="card-hover-overlay">선택</div>
                    </div>
                    <div class="card-back" style="background-color: ${gradeColors[item.grade]};">
                      ${item.grade}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
        </div>
      </div>

      <div id="confirmation-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <span class="modal-title">FC온라인 빠칭코 시뮬레이터</span>
            <span id="modal-close-btn" class="modal-close-btn">&times;</span>
          </div>
          <div class="modal-body">
            <p class="primary-message"></p>
          </div>
          <div class="modal-footer">
            <button id="modal-cancel-btn" class="cancel-btn">취소</button>
            <button id="modal-confirm-btn" class="confirm-btn">확인</button>
          </div>
        </div>
      </div>

      <!-- Box Animation Overlay -->
      <div id="animation-overlay" class="animation-overlay">
          <div id="mystery-box" class="mystery-box">📦</div>
          <div id="grade-reveal" class="grade-reveal"></div>
          <div id="animation-message" class="animation-message"></div>
          <button id="animation-btn" class="animation-btn">확인</button>
      </div>
    `;

    this.shadowRoot.getElementById('buy-ticket-btn').addEventListener('click', () => this.buyTicket());
    this.shadowRoot.getElementById('reset-btn').addEventListener('click', () => this.handleResetClick());
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => this.handleCardClick(card));
    });

    this.shadowRoot.getElementById('modal-confirm-btn').addEventListener('click', () => this.proceedWithConfirmation());
    this.shadowRoot.getElementById('modal-cancel-btn').addEventListener('click', () => this.cancelConfirmation());
    this.shadowRoot.getElementById('modal-close-btn').addEventListener('click', () => this.cancelConfirmation());
    this.shadowRoot.getElementById('confirmation-modal').addEventListener('click', (e) => { if (e.target.id === 'confirmation-modal') this.cancelConfirmation(); });

    // Animation Event Listeners
    this.shadowRoot.getElementById('animation-btn').addEventListener('click', () => this.finishAnimation());

    this.updateInfoPanel();
    this.updateTicketCount();
    this.updateHintTracker();
  }

  showConfirmationModal(message, action) {
    this.shadowRoot.querySelector('.primary-message').textContent = message;
    this.confirmationAction = action;
    this.shadowRoot.getElementById('confirmation-modal').style.display = 'flex';
  }

  hideConfirmationModal() {
    this.shadowRoot.getElementById('confirmation-modal').style.display = 'none';
    this.confirmationAction = null;
    this.cardToFlip = null;
  }

  cancelConfirmation() {
    this.hideConfirmationModal();
  }

  updateInfoPanel() {
    const infoPanel = this.shadowRoot.querySelector('.info-panel-content');
    const gradeOrder = ['SSS', 'SS', 'S', 'A', 'B', 'C'];
    if (infoPanel) {
      infoPanel.innerHTML = gradeOrder.map(grade => `
            <div class="info-item">
                <div class="info-item-label">
                    <div class="color-box" style="background-color: var(--${grade.toLowerCase()}-color);"></div>
                    <span style="color: var(--text-color-bright);">${grade}</span>
                </div>
                <span>${this.gradeCounts[grade]}개</span>
            </div>
        `).join('');
    }
  }

  buyTicket() {
    this.tickets++;
    this.updateTicketCount();
  }

  updateTicketCount() {
    this.shadowRoot.getElementById('ticket-count').textContent = `x${this.tickets}`;
  }

  handleCardClick(card) {
    const cardId = parseInt(card.dataset.id, 10);
    const cardData = this.boardData.find(item => item.id === cardId);

    if (this.tickets > 0 && !cardData.flipped) {
      this.cardToFlip = card;
      this.showConfirmationModal('참여권을 사용하여 게임에 참여하시겠습니까?', 'flip');
    }
  }

  handleResetClick() {
    this.showConfirmationModal('게임판을 리셋하시겠습니까?', 'reset_1');
  }

  proceedWithConfirmation() {
    switch (this.confirmationAction) {
      case 'flip':
        // Logic Changed: Start Box Animation instead of direct flip
        const card = this.cardToFlip;
        const cardId = parseInt(card.dataset.id, 10);
        const cardData = this.boardData.find(item => item.id === cardId);

        this.hideConfirmationModal(); // Close confirm modal
        this.showBoxAnimation(cardData); // Start animation
        break;
      case 'reset_1':
        this.showConfirmationModal('정말로 리셋하시겠습니까?', 'reset_2');
        break;
      case 'reset_2':
        this.resetGame();
        break;
      default:
        this.hideConfirmationModal();
        break;
    }
  }

  proceedWithFlip() {
    if (!this.cardToFlip) return;

    const card = this.cardToFlip;
    const cardId = parseInt(card.dataset.id, 10);
    const cardData = this.boardData.find(item => item.id === cardId);

    this.hideConfirmationModal();

    if (!this.gameStarted) {
      this.gameStarted = true;
      this.shadowRoot.getElementById('reset-btn').disabled = false;
    }

    this.tickets--;
    this.updateTicketCount();
    card.classList.add('flipped');
    cardData.flipped = true;
    if (card.classList.contains('hinted')) {
      card.classList.remove('hinted');
    }
    if (this.gradeCounts[cardData.grade] > 0) {
      this.gradeCounts[cardData.grade]--;
    }
    this.updateInfoPanel();

    this.hintCountdown--;
    this.updateHintTracker();

    if (this.hintCountdown === 0) {
      this.provideHint();
      this.hintCountdown = 3;
      setTimeout(() => this.updateHintTracker(), 1000);
    }

    const allFlipped = this.boardData.every(item => item.flipped);
    if (allFlipped) {
      setTimeout(() => {
        alert('모든 보상을 획득했습니다! 참여권 1개를 보상으로 지급합니다.');
        this.tickets++;
        this.initializeGame();
      }, 500);
    }

    this.cardToFlip = null;
  }

  updateHintTracker() {
    const countdown = this.hintCountdown;
    const container = this.shadowRoot.querySelector('.hint-text-container');
    if (container) {
      if (countdown === 0) {
        container.innerHTML = `<span><span id="hint-countdown-span">힌트 제공!</span></span>`;
      } else {
        container.innerHTML = `<span>A등급 이상 힌트까지<br><span id="hint-countdown-span">${countdown}</span>회 남았습니다.</span>`;
      }
    }
    const steps = this.shadowRoot.querySelectorAll('.hint-step');
    steps.forEach((step, i) => step.classList.toggle('active', i < (3 - countdown)));
  }

  provideHint() {
    const potentialHints = this.boardData.filter(item => !item.flipped && !item.hinted && ['SSS', 'SS', 'S', 'A'].includes(item.grade));
    if (potentialHints.length > 0) {
      const hintedCardData = potentialHints[Math.floor(Math.random() * potentialHints.length)];
      hintedCardData.hinted = true;
      const cardElement = this.shadowRoot.querySelector(`.card[data-id='${hintedCardData.id}']`);
      if (cardElement) cardElement.classList.add('hinted');
    }
  }

  resetGame() {
    this.initializeGame();
  }

  showBoxAnimation(cardData) {
    const overlay = this.shadowRoot.getElementById('animation-overlay');
    const box = this.shadowRoot.getElementById('mystery-box');
    const reveal = this.shadowRoot.getElementById('grade-reveal');
    const message = this.shadowRoot.getElementById('animation-message');
    const btn = this.shadowRoot.getElementById('animation-btn');

    // Reset State
    overlay.style.display = 'flex';
    box.style.display = 'block';
    box.classList.remove('shake');
    reveal.style.display = 'none';
    reveal.textContent = '';
    message.textContent = '';
    message.style.opacity = '0';
    btn.style.display = 'none';

    // 1. Shake Animation (0s - 1.5s)
    setTimeout(() => {
      box.classList.add('shake');
    }, 100);

    // 2. Open Box & Reveal (1.5s)
    setTimeout(() => {
      box.style.display = 'none'; // Hide box

      // Show Grade
      reveal.textContent = `${cardData.grade}등급!`;
      reveal.style.color = this.getGradeColor(cardData.grade); // Helper needed or use simple map
      reveal.style.display = 'block';

      // Show Message
      message.textContent = '획득을 축하합니다!';
      message.style.opacity = '1';

      // Show Button
      btn.style.display = 'block';

    }, 1500);
  }

  finishAnimation() {
    const overlay = this.shadowRoot.getElementById('animation-overlay');
    overlay.style.display = 'none';
    this.proceedWithFlip(); // Continue original logic
  }

  getGradeColor(grade) {
    const colors = {
      SSS: '#ff69b4', SS: '#7A28D1', S: '#55aaff',
      A: '#55ff55', B: '#ff9900', C: '#aaaaaa',
    };
    return colors[grade] || '#fff';
  }
}

customElements.define('lotto-game', LottoGame);
