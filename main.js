
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
    let isValidBoard = false;

    // Retry shuffling until 'C' adjacency rule is met
    while (!isValidBoard) {
      // Shuffle
      for (let i = gradePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gradePool[i], gradePool[j]] = [gradePool[j], gradePool[i]];
      }

      // Check for adjacent C's
      isValidBoard = true;
      for (let i = 0; i < gradePool.length - 1; i++) {
        if (gradePool[i] === 'C' && gradePool[i + 1] === 'C') {
          isValidBoard = false;
          break;
        }
      }
    }

    this.boardData = gradePool.map((grade, i) => ({
      id: i + 1,
      grade: grade,
      flipped: false,
      hinted: false,
    }));

    this.render();
  }

  // ... (render method update inside the template) ...
  // Actually, I need to update the entire class or targeting specific methods if I use replace_file_content.
  // Since I need to touch multiple methods, I will apply them carefully.
  // I will skip the render update here and do it in a separate chunk if needed or rely on the user to reload.
  // Wait, I need to update the 'render' method's HTML string for the CSS/HTML "A등급 이상" text.

  // Let's do initializeGame first.


  render() {
    const gradeColors = {
      SSS: 'var(--sss-color)', SS: 'var(--ss-color)', S: 'var(--s-color)',
      A: 'var(--a-color)', B: 'var(--b-color)', C: 'var(--c-color)',
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host { 
            --modal-green: #00e676; 
            /* Inherit main vars from document, but define defaults */
            --primary-bg: #050814;
            --accent-gold: #d4af37;
            --accent-blue: #1c4bfa;
        }

        @keyframes sparkle-text {
          0%, 100% { opacity: 0.8; text-shadow: 0 0 4px #fff, 0 0 8px #fff, 0 0 12px var(--accent-gold); }
          50% { opacity: 1; text-shadow: 0 0 8px #fff, 0 0 16px #fff, 0 0 24px var(--accent-gold); }
        }

        .main-title { 
            text-align: center; 
            font-size: 3rem; 
            font-weight: 800; 
            margin-bottom: 30px; 
            font-family: 'Orbitron', sans-serif;
            text-transform: uppercase;
            /* Gold Gradient Text */
            background: linear-gradient(to bottom, #fff 0%, #d4af37 40%, #aa771c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
        }

        .game-wrapper { 
            display: grid; 
            grid-template-columns: 340px 1fr; 
            gap: 25px; 
            padding: 30px; 
            background: rgba(13, 20, 48, 0.7); 
            backdrop-filter: blur(12px);
            border-radius: 20px; 
            border: 1px solid rgba(212, 175, 55, 0.3); /* Subtle Gold Border */
            box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05); 
            width: 1050px; 
        }

        .sidebar { display: flex; flex-direction: column; gap: 20px; padding-top: 10px; }
        
        .sidebar-panel { 
            background: linear-gradient(180deg, rgba(20, 25, 50, 0.9) 0%, rgba(10, 14, 30, 0.9) 100%);
            padding: 24px; 
            border-radius: 12px; 
            border: 1px solid #2a3a5a;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        .ticket-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ticket-panel-header h2 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #fff; font-family: 'Orbitron'; letter-spacing: 1px; }
        #ticket-count { font-size: 2rem; font-weight: 700; color: var(--accent-gold); text-shadow: 0 0 10px rgba(212, 175, 55, 0.5); }
        
        /* Blue Jewel Button */
        #buy-ticket-btn { 
            background: linear-gradient(135deg, #1c4bfa 0%, #0022aa 100%);
            color: #fff; 
            font-size: 1.4rem; 
            font-weight: 700; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #4daeff; 
            box-shadow: 0 0 20px rgba(28, 75, 250, 0.4), inset 0 0 10px rgba(255,255,255,0.2); 
            cursor: pointer; 
            width: 100%; 
            text-align: center; 
            box-sizing: border-box;
            font-family: 'Orbitron';
            text-transform: uppercase;
            transition: all 0.3s ease;
        }
        #buy-ticket-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(28, 75, 250, 0.6), inset 0 0 20px rgba(255,255,255,0.4); 
            filter: brightness(1.1);
        }

        .info-panel h3, .reset-info-panel h3 { 
            font-size: 1.2rem; 
            margin: 0 0 15px 0; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            padding-bottom: 10px; 
            color: #ccc;
            font-family: 'Orbitron';
        }
        .info-panel-content { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; color: #a9b3d1; }
        .info-item-label { display: flex; align-items: center; gap: 8px; }
        .color-box { width: 14px; height: 14px; border-radius: 3px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }

        .reset-info-panel p { color: #8899ac; margin: 8px 0; font-size: 0.9rem; line-height: 1.6; }
        
        #reset-btn { 
            background-color: transparent; 
            color: #667799; 
            font-size: 1rem; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #334466; 
            cursor: pointer; 
            width: 100%; 
            margin-top: 15px; 
            transition: all 0.3s;
            font-family: 'Orbitron'; 
        }
        #reset-btn:not(:disabled) { 
            background: rgba(255, 255, 255, 0.05);
            color: #fff; 
            border-color: #556688;
        }
        #reset-btn:not(:disabled):hover { 
            background: rgba(255, 255, 255, 0.1); 
            border-color: #fff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); 
        }

        .game-board-area { display: flex; flex-direction: column; justify-content: center; }
        
        .hint-tracker-content { display: flex; align-items: center; justify-content: center; gap: 40px; background-color: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; }
        .hint-steps { display: flex; gap: 20px; }
        .hint-step { width: 50px; height: 60px; background-color: #101842; clip-path: polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%); box-shadow: inset 0 4px 8px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-size: 1.5rem; color: var(--text-color-dark, #888); font-family: 'Orbitron'; }
        .hint-step.active { background-color: var(--accent-blue, #1c4bfa); color: transparent; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px var(--accent-blue, #1c4bfa); }
        .hint-text-container { display: flex; align-items: center; justify-content: center; height: 60px; text-align: center; }
        #hint-countdown-span { font-size: 2.2rem; color: var(--accent-gold, #ffd700); font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.5); }

        .game-board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        .card { background-color: transparent; aspect-ratio: 1 / 1; cursor: pointer; perspective: 1000px; position: relative; }
        .card-inner { position: absolute; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 2, 0.5, 1); transform-style: preserve-3d; }
        .card.flipped .card-inner { transform: rotateY(180deg); }
        .card-front, .card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        
        /* CARD FRONT - Premium Design */
        .card-front { 
            background: linear-gradient(135deg, #0f1630 0%, #050814 100%); 
            border: 1px solid #2a3a5a; 
            font-family: 'Orbitron'; 
            transition: all 0.3s;
        }
        .card:not(.flipped):hover .card-front { 
            border-color: var(--accent-gold); 
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
            transform: translateY(-2px);
        }
        .card-number { 
            color: var(--accent-gold); 
            font-size: 2.5rem; 
            font-weight: 700; 
            transition: color 0.3s;
            text-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        .card:not(.flipped):hover .card-number { color: #fff; opacity: 1; text-shadow: 0 0 15px var(--accent-gold); }
        
        /* Hover Overlay Logic - Simplified for premium feel */
        .card-hover-overlay { display: none; } /* Removed explicit overlay, using border/glow instead */

        .card-back { transform: rotateY(180deg); font-weight: 800; font-size: 2.2rem; color: #fff; border: 2px solid rgba(255,255,255,0.2); text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(5px); display: none; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { 
            background: linear-gradient(135deg, #1c2a6c 0%, #0d123c 100%);
            border: 1px solid var(--accent-gold);
            border-radius: 12px; width: 480px; box-shadow: 0 0 50px rgba(28, 75, 250, 0.3); overflow: hidden; 
        }
        .modal-header { 
            display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; 
            background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); 
        }
        .modal-title { font-size: 1.1rem; font-weight: 600; color: var(--accent-gold); font-family: 'Orbitron'; letter-spacing: 1px; }
        .modal-close-btn { color: #667799; cursor: pointer; font-size: 1.5rem; transition: color 0.3s; }
        .modal-close-btn:hover { color: #fff; }
        
        .modal-body { padding: 40px 30px; text-align: center; }
        .modal-body .primary-message { color: #fff; font-size: 1.3rem; font-weight: 500; margin: 0; line-height: 1.5; }
        
        .modal-footer { display: flex; border-top: 1px solid rgba(255,255,255,0.1); }
        .modal-footer button { flex: 1; border: none; padding: 20px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Orbitron'; }
        .modal-footer .cancel-btn { background: #1a2035; color: #8899ac; }
        .modal-footer .cancel-btn:hover { background: #252d45; color: #fff; }
        .modal-footer .confirm-btn { background: var(--accent-blue); color: white; }
        .modal-footer .confirm-btn:hover { filter: brightness(1.2); }
        .modal-footer .confirm-btn:hover { filter: brightness(1.2); }
        
        /* HINT VISIBILITY LOGIC - RESTORED */
        .card-hint-overlay, .card-hint-text { display: none; }
        .card.hinted .card-front { border-color: var(--hint-color, var(--accent-blue)); }
        
        .card.hinted .card-hint-overlay { 
            display: block; 
            position: absolute; 
            top: 50%; left: 50%; 
            width: 50px; height: 50px; 
            margin-top: -25px; margin-left: -25px; 
            background: radial-gradient(circle, var(--hint-color, --accent-blue) 0%, rgba(0,0,0,0) 70%); 
            border-radius: 50%; 
            animation: hint-pulse-circle 2s infinite; 
        }
        
        .card.hinted .card-hint-text { 
            display: block; 
            position: absolute; 
            bottom: 4px; 
            left: 50%;
            transform: translateX(-50%);
            width: max-content;
            padding: 0;
            text-align: center; 
            color: var(--hint-color, #fff); 
            font-size: 0.7rem; 
            font-weight: 800; 
            animation: sparkle-text 2s infinite; 
            text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 2px black; 
        }

        /* Grade Colors for Hint Text */
        .card.hinted.grade-a { --hint-color: var(--a-color, #00e676); }
        .card.hinted.grade-b { --hint-color: var(--b-color, #ff9900); }

        @keyframes hint-pulse-circle {
            0% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 10px var(--hint-color); }
            50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 20px var(--hint-color); }
            100% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 10px var(--hint-color); }
        }
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
  }

  cancelConfirmation() {
    this.hideConfirmationModal();
    this.cardToFlip = null; // Clear if cancelled
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

    if (cardData.flipped) return;

    if (this.tickets > 0) {
      this.cardToFlip = card;
      this.showConfirmationModal('참여권을 사용하여 게임에 참여하시겠습니까?', 'flip');
    } else {
      this.showConfirmationModal('참여권을 구매하여 주십시오.', 'none'); // Show Alert
    }
  }

  handleResetClick() {
    this.showConfirmationModal('게임판을 리셋하시겠습니까?', 'reset_1');
  }

  proceedWithConfirmation() {
    switch (this.confirmationAction) {
      case 'flip':
        const card = this.cardToFlip;
        const cardId = parseInt(card.dataset.id, 10);
        const cardData = this.boardData.find(item => item.id === cardId);

        this.hideConfirmationModal();

        // 1. Perform immediate visuals (Card flip) + Deduct Ticket
        this.performFlipVisuals(card, cardData);

        // 2. Direct Logic Check (No Animation)
        this.processPostTurnLogic();
        break;
      case 'reset_1':
        this.showConfirmationModal('정말로 리셋하시겠습니까?', 'reset_2');
        break;
      case 'reset_2':
        this.resetGame();
        break;
      default:
        // 'none' or other actions just close
        this.hideConfirmationModal();
        break;
    }
  }

  // New method: Handles the immediate "cost" and "flip"
  performFlipVisuals(card, cardData) {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.shadowRoot.getElementById('reset-btn').disabled = false;
    }

    // Deduct Ticket
    this.tickets--;
    this.updateTicketCount();

    // Flip Card Immediately
    card.classList.add('flipped');
    cardData.flipped = true;

    // Remove Hints if present
    if (card.classList.contains('hinted')) {
      card.classList.remove('hinted');
    }

    // Update Counts
    if (this.gradeCounts[cardData.grade] > 0) {
      this.gradeCounts[cardData.grade]--;
    }
    this.updateInfoPanel();

    // --- NEW LOGIC: C-Grade Neighbor Hints ---
    if (cardData.grade === 'C') {
      const neighborIds = [cardData.id - 1, cardData.id + 1];
      neighborIds.forEach(nId => {
        const neighbor = this.boardData.find(d => d.id === nId);
        // Check existence, not flipped, and not already hinted
        if (neighbor && !neighbor.flipped && !neighbor.hinted) {
          neighbor.hinted = true;
          const nCard = this.shadowRoot.querySelector(`.card[data-id='${nId}']`);
          if (nCard) {
            nCard.classList.add('hinted');
            nCard.classList.add('grade-b'); // Add Orange Styling Class
            const textEl = nCard.querySelector('.card-hint-text');
            if (textEl) textEl.textContent = 'B등급 이상';
          }
        }
      });
    }
  }

  processPostTurnLogic() {
    // Logic for Hint Countdown
    this.hintCountdown--;
    this.updateHintTracker();

    if (this.hintCountdown <= 0) {
      this.provideHint();
      this.hintCountdown = 3;
      setTimeout(() => this.updateHintTracker(), 1000);
    }

    // Logic for All Clear
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
      if (countdown <= 0) {
        container.innerHTML = `<span><span id="hint-countdown-span">힌트 제공!</span></span>`;
      } else {
        container.innerHTML = `<span>A등급 이상 힌트까지<br><span id="hint-countdown-span">${countdown}</span>회 남았습니다.</span>`;
      }
    }
    const steps = this.shadowRoot.querySelectorAll('.hint-step');
    steps.forEach((step, i) => step.classList.toggle('active', i < (3 - countdown)));
  }

  provideHint() {
    // Revert to original A-grade logic
    const potentialHints = this.boardData.filter(item => !item.flipped && !item.hinted && ['SSS', 'SS', 'S', 'A'].includes(item.grade));
    if (potentialHints.length > 0) {
      const hintedCardData = potentialHints[Math.floor(Math.random() * potentialHints.length)];
      hintedCardData.hinted = true;
      const cardElement = this.shadowRoot.querySelector(`.card[data-id='${hintedCardData.id}']`);
      if (cardElement) {
        cardElement.classList.add('hinted');
        // Ensure standard text for standard hints
        const textEl = cardElement.querySelector('.card-hint-text');
        if (textEl) textEl.textContent = 'A등급 이상';

        // Add specific class for Green Styling
        cardElement.classList.add('grade-a');
      }
    }
  }

  resetGame() {
    this.initializeGame();
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
