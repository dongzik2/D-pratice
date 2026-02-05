
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
        .main-title { text-align: center; color: var(--text-color-bright); font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; font-family: 'Orbitron', sans-serif; }
        .game-wrapper { display: grid; grid-template-columns: 320px 1fr; gap: 20px; padding: 24px; background-color: var(--container-blue); border-radius: 20px; border: 2px solid #3a4a8a; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 1000px; }

        .sidebar { display: flex; flex-direction: column; gap: 20px; padding-top: 50px; }
        .sidebar-panel { background-color: #0d123c; padding: 20px; border-radius: 10px; border: 1px solid #2a3a7a; }
        
        .ticket-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .ticket-panel-header h2 { font-size: 1.8rem; font-weight: 700; margin: 0; color: var(--text-color-bright); }
        #ticket-count { font-size: 1.8rem; font-weight: 700; color: var(--highlight-yellow); }
        #buy-ticket-btn { background: linear-gradient(to top, #0088ff, #4ab3ff); color: var(--text-color-bright); font-size: 1.5rem; font-weight: 700; padding: 20px; border-radius: 10px; border: 2px solid #88cfff; box-shadow: 0 0 15px rgba(74, 179, 255, 0.5); cursor: pointer; width: 100%; text-align: center; box-sizing: border-box; }

        .info-panel h3 { font-size: 1.3rem; margin: 0 0 15px 0; border-bottom: 1px solid #2a3a7a; padding-bottom: 10px;}
        .info-panel-content { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 1rem;}
        .info-item-label { display: flex; align-items: center; gap: 8px; }
        .color-box { width: 16px; height: 16px; border-radius: 3px;}

        .reset-info-panel h3 { font-size: 1.3rem; margin: 0 0 10px 0; }
        .reset-info-panel p { color: var(--text-color-dark); margin: 5px 0; font-size: 0.9rem; line-height: 1.5;}

        #reset-btn { background-color: #2a3a7a; color: var(--text-color-dark); font-size: 1.1rem; padding: 15px; border-radius: 8px; border: 1px solid #4a5a9a; cursor: pointer; width: 100%; margin-top: 10px; transition: background-color 0.3s, color 0.3s; }
        #reset-btn:disabled { background-color: #20284a; color: #5a688a; cursor: not-allowed; }

        .game-board-area { display: flex; flex-direction: column; justify-content: center; }
        
        .hint-tracker { text-align: center; margin-bottom: 20px; }
        .hint-tracker-content { display: flex; align-items: center; justify-content: center; gap: 40px; background-color: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; }
        .hint-steps { display: flex; gap: 20px; }
        .hint-step { width: 50px; height: 60px; background-color: #101842; clip-path: polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%); box-shadow: inset 0 4px 8px rgba(0,0,0,0.5); transition: background-color 0.4s, color 0.4s; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; color: var(--text-color-dark); font-family: 'Orbitron'; }
        .hint-step.active { background-color: var(--primary-blue-light); color: transparent; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px var(--primary-blue-light); }
        .hint-text-container span { font-size: 1.2rem; }
        #hint-countdown-span { font-size: 2.2rem; color: var(--highlight-yellow); font-weight: 700; }

        .game-board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .card { background-color: transparent; aspect-ratio: 1 / 1; cursor: pointer; perspective: 1000px; position: relative; }
        .card-inner { position: absolute; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
        .card.flipped .card-inner { transform: rotateY(180deg); }
        .card-front, .card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; display: flex; justify-content: center; align-items: center; border-radius: 8px; }
        .card-front { background-color: #0d123c; border: 1px solid #3a4a8a; color: var(--highlight-yellow); font-size: 2.2rem; font-family: 'Orbitron'; }
        .card-back { transform: rotateY(180deg); font-weight: bold; font-size: 2.2rem; color: #fff; border: 2px solid #fff;}

        .hint-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 210, 255, 0.3); border: 2px solid var(--primary-blue-light); z-index: 3; pointer-events: none; border-radius: 8px; display: none; justify-content: center; align-items: flex-end; padding-bottom: 5px; box-sizing: border-box; }
        .card.hinted .hint-overlay { display: flex; }
        .hint-overlay-text { font-size: 0.8rem; color: white; animation: sparkle 1.5s infinite; }
        @keyframes sparkle { 0%, 100% { opacity: 1; text-shadow: 0 0 5px #fff; } 50% { opacity: 0.7; text-shadow: 0 0 10px var(--primary-blue-light); } }

      </style>
      <h1 class="main-title">빠칭코 시뮬레이터</h1>
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
             <p>2. 게임판의 보상을 전부 획득하여 리셋 (보상 전부 획득 리셋 시 참여권 1개 지급)</p>
             <button id="reset-btn" disabled>게임판 리셋하기</button>
          </div>
        </div>
        <div class="game-board-area">
          <div class="hint-tracker">
            <div class="hint-tracker-content">
              <div class="hint-steps">
                <div class="hint-step" data-step="1">1</div>
                <div class="hint-step" data-step="2">2</div>
                <div class="hint-step" data-step="3">3</div>
              </div>
              <div class="hint-text-container">
                <span>A등급 이상 힌트까지<br><span id="hint-countdown-span">3</span>회 남았습니다.</span>
              </div>
            </div>
          </div>
          <div class="game-board">
              ${this.boardData.map(item => `
                <div class="card ${item.hinted ? 'hinted' : ''}" data-id="${item.id}">
                  <div class="card-inner">
                    <div class="hint-overlay"><span class="hint-overlay-text">A등급 이상</span></div>
                    <div class="card-front">${item.id}</div>
                    <div class="card-back" style="background-color: ${gradeColors[item.grade]}; border-color: ${gradeColors[item.grade]};">
                      ${item.grade}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
        </div>
      </div>
    `;
    
    this.shadowRoot.getElementById('buy-ticket-btn').addEventListener('click', () => this.buyTicket());
    this.shadowRoot.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => this.flipCard(card));
    });
    this.updateInfoPanel();
    this.updateTicketCount();
    this.updateHintTracker();
  }
  
  updateInfoPanel() {
    const infoPanel = this.shadowRoot.querySelector('.info-panel-content');
    const gradeOrder = ['SSS', 'SS', 'S', 'A', 'B', 'C'];
    if (infoPanel) {
        infoPanel.innerHTML = gradeOrder.map(grade => `
            <div class="info-item">
                <div class="info-item-label">
                    <div class="color-box" style="background-color: var(--${grade.toLowerCase()}-color);"></div>
                    <span>${grade}</span>
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

  flipCard(card) {
    const cardId = parseInt(card.dataset.id, 10);
    const cardData = this.boardData.find(item => item.id === cardId);

    if (this.tickets > 0 && !cardData.flipped) {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.shadowRoot.getElementById('reset-btn').disabled = false;
      }

      this.tickets--; this.updateTicketCount();
      card.classList.add('flipped'); cardData.flipped = true;
      if(card.classList.contains('hinted')) card.classList.remove('hinted');
      if (this.gradeCounts[cardData.grade] > 0) this.gradeCounts[cardData.grade]--;
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
    }
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
      const stepsActive = 3 - countdown;
      steps.forEach((step, index) => {
          step.classList.toggle('active', index < stepsActive);
      });
  }

  provideHint() {
    const potentialHints = this.boardData.filter(item => !item.flipped && !item.hinted && ['SSS', 'SS', 'S', 'A'].includes(item.grade));
    if (potentialHints.length > 0) {
      const hintedCardData = potentialHints[Math.floor(Math.random() * potentialHints.length)];
      hintedCardData.hinted = true;
      const cardElement = this.shadowRoot.querySelector(`.card[data-id='${hintedCardData.id}']`);
      cardElement.classList.add('hinted');
    }
  }

  resetGame() {
    this.initializeGame();
  }
}

customElements.define('lotto-game', LottoGame);
