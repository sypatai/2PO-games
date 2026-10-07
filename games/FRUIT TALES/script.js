const SoundManager = {
    muted: localStorage.getItem('ft_muted') === 'true',
    ctx: null,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.updateButton();
    },

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('ft_muted', this.muted);
        this.updateButton();
        if (!this.muted) this.playSelect();
    },

    updateButton() {
        const btn = document.getElementById('sound-btn');
        if (btn) {
            btn.innerText = this.muted ? '🔇' : '🔊';
        }
    },

    playTone(freq, type, duration, vol = 0.1) {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    },

    playSelect() {
        this.playTone(523.25, 'sine', 0.08, 0.05);
    },

    playMatch(combo = 1) {
        const baseFreq = 440 * Math.pow(1.12, Math.min(combo, 10));
        this.playTone(baseFreq, 'triangle', 0.2, 0.12);
        setTimeout(() => this.playTone(baseFreq * 1.25, 'triangle', 0.2, 0.1), 60);
    },

    playCombo(mult) {
        const freq = 400 + mult * 120;
        this.playTone(freq, 'square', 0.25, 0.12);
    },

    playVictory() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 'triangle', 0.3, 0.15), i * 120);
        });
    },

    playDefeat() {
        const notes = [400, 350, 300, 250];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 'sawtooth', 0.35, 0.15), i * 150);
        });
    }
};

const GameData = {
    levels: [
        { id: 1, targetScore: 800, maxMoves: 20, type: 'moves', name: 'Ягодная поляна', fruitsCount: 5 },
        { id: 2, targetScore: 1200, maxMoves: 22, type: 'moves', name: 'Цитрусовый сад', fruitsCount: 5 },
        { id: 3, targetScore: 1800, timeLimit: 45, type: 'time', name: 'Тропический бриз', fruitsCount: 6 },
        { id: 4, targetScore: 2200, maxMoves: 25, type: 'moves', name: 'Арбузный рай', fruitsCount: 6 },
        { id: 5, targetScore: 3000, timeLimit: 60, type: 'time', name: 'Королевский фреш', fruitsCount: 6 }
    ],

    getFruitConfig(type) {
        const configs = {
            1: { name: 'strawberry', emoji: '🍓', bg: 'from-red-500 to-rose-700', shadow: 'rgba(244, 63, 94, 0.5)' },
            2: { name: 'orange', emoji: '🍊', bg: 'from-amber-400 to-orange-600', shadow: 'rgba(245, 158, 11, 0.5)' },
            3: { name: 'banana', emoji: '🍌', bg: 'from-yellow-300 to-amber-500', shadow: 'rgba(252, 211, 77, 0.5)' },
            4: { name: 'apple', emoji: '🍏', bg: 'from-emerald-400 to-green-600', shadow: 'rgba(52, 211, 153, 0.5)' },
            5: { name: 'grape', emoji: '🍇', bg: 'from-purple-500 to-indigo-700', shadow: 'rgba(168, 85, 247, 0.5)' },
            6: { name: 'watermelon', emoji: '🍉', bg: 'from-pink-500 to-red-600', shadow: 'rgba(236, 72, 153, 0.5)' }
        };
        return configs[type] || configs[1];
    },

    loadProgress() {
        try {
            const saved = localStorage.getItem('ft_progress');
            return saved ? JSON.parse(saved) : { unlockedLevel: 1, stars: {} };
        } catch(e) {
            return { unlockedLevel: 1, stars: {} };
        }
    },

    saveProgress(progress) {
        try {
            localStorage.setItem('ft_progress', JSON.stringify(progress));
        } catch(e) {}
    }
};

const Game = {
    currentView: 'menu',
    currentLevelId: 1,
    board: [],
    rows: 8,
    cols: 8,
    score: 0,
    movesLeft: 0,
    timeLeft: 0,
    timerInterval: null,
    selectedCell: null,
    isAnimating: false,
    combo: 1,
    fruitsCount: 5,

    init() {
        this.renderMenu();
    },

    switchView(viewName) {
        this.currentView = viewName;
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        
        if (viewName === 'menu') {
            this.renderMenu();
        } else if (viewName === 'levels') {
            this.renderLevelSelect();
        } else if (viewName === 'game') {
            this.renderGameScreen();
        } else if (viewName === 'settings') {
            this.renderSettings();
        }
    },

    openSettings() {
        this.switchView('settings');
    },

    renderMenu() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center space-y-6 py-6 animate-pop">
                <div class="relative w-32 h-32 flex items-center justify-center">
                    <div class="absolute inset-0 bg-gradient-to-tr from-pink-500 to-amber-400 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                    <div class="relative w-28 h-28 glass-panel rounded-3xl flex items-center justify-center text-6xl shadow-2xl border border-white/20">
                        🍇
                    </div>
                </div>
                <div class="text-center">
                    <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">Fruit Tales</h2>
                    <p class="text-slate-400 text-sm mt-1">Яркое приключение три-в-ряд</p>
                </div>
                <div class="flex flex-col space-y-3.5 w-full max-w-xs">
                    <button onclick="SoundManager.playSelect(); Game.startLevel(GameData.loadProgress().unlockedLevel || 1)" class="btn-3d w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center space-x-3 text-lg">
                        <span>▶️</span><span>ИГРАТЬ</span>
                    </button>
                    <button onclick="SoundManager.playSelect(); Game.switchView('levels')" class="btn-3d w-full py-3.5 px-6 glass-panel hover:bg-slate-700/60 text-white font-semibold rounded-2xl flex items-center justify-center space-x-3">
                        <span>🗺️</span><span>УРОВНИ</span>
                    </button>
                    <button onclick="SoundManager.playSelect(); Game.switchView('settings')" class="btn-3d w-full py-3.5 px-6 glass-panel hover:bg-slate-700/60 text-white font-semibold rounded-2xl flex items-center justify-center space-x-3">
                        <span>⚙️</span><span>НАСТРОЙКИ</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLevelSelect() {
        const progress = GameData.loadProgress();
        const container = document.getElementById('view-container');
        
        let levelsHTML = '';
        GameData.levels.forEach(lvl => {
            const isUnlocked = lvl.id <= (progress.unlockedLevel || 1);
            const starsCount = (progress.stars && progress.stars[lvl.id]) || 0;
            let starsStr = '';
            for (let i = 1; i <= 3; i++) {
                starsStr += i <= starsCount ? '⭐' : '☆';
            }

            if (isUnlocked) {
                levelsHTML += `
                    <button onclick="SoundManager.playSelect(); Game.startLevel(${lvl.id})" class="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-700/60 transition group border border-white/10 btn-3d">
                        <span class="text-lg font-bold text-white group-hover:scale-110 transition">Ур. ${lvl.id}</span>
                        <span class="text-xs text-slate-400 mt-0.5 truncate w-full text-center">${lvl.name}</span>
                        <span class="text-amber-400 text-sm mt-2">${starsStr}</span>
                    </button>
                `;
            } else {
                levelsHTML += `
                    <div class="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center opacity-50 cursor-not-allowed border border-white/5">
                        <span class="text-lg font-bold text-slate-500">🔒 Ур. ${lvl.id}</span>
                        <span class="text-[10px] text-slate-600 mt-0.5">${lvl.name}</span>
                        <span class="text-slate-600 text-sm mt-2">☆☆☆</span>
                    </div>
                `;
            }
        });

        container.innerHTML = `
            <div class="flex flex-col h-full space-y-4 animate-pop">
                <div class="flex items-center justify-between">
                    <button onclick="SoundManager.playSelect(); Game.switchView('menu')" class="px-4 py-2 glass-panel rounded-xl text-sm font-semibold hover:bg-slate-700/50">
                        ← Меню
                    </button>
                    <h2 class="text-xl font-bold text-white">Выбор уровня</h2>
                    <div class="w-16"></div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] p-1">
                    ${levelsHTML}
                </div>
            </div>
        `;
    },

    renderSettings() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="flex flex-col h-full space-y-6 animate-pop max-w-sm mx-auto w-full">
                <div class="flex items-center justify-between">
                    <button onclick="SoundManager.playSelect(); Game.switchView('menu')" class="px-4 py-2 glass-panel rounded-xl text-sm font-semibold hover:bg-slate-700/50">
                        ← Меню
                    </button>
                    <h2 class="text-xl font-bold text-white">Настройки</h2>
                    <div class="w-16"></div>
                </div>
                <div class="glass-panel p-6 rounded-3xl space-y-6 border border-white/10">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-slate-200">Звуковые эффекты</span>
                        <button onclick="SoundManager.toggleMute(); Game.renderSettings();" class="px-4 py-2 rounded-xl font-bold text-sm ${SoundManager.muted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                            ${SoundManager.muted ? 'Выключено' : 'Включено'}
                        </button>
                    </div>
                    <div class="pt-4 border-t border-slate-700 flex flex-col space-y-3">
                        <span class="font-medium text-slate-200">Сброс прогресса</span>
                        <button onclick="localStorage.removeItem('ft_progress'); Game.renderSettings();" class="py-2.5 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-xl text-sm font-semibold transition">
                            Сбросить данные
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    startLevel(levelId) {
        this.currentLevelId = levelId;
        const levelConfig = GameData.levels.find(l => l.id === levelId) || GameData.levels[0];
        this.score = 0;
        this.combo = 1;
        this.fruitsCount = levelConfig.fruitsCount || 5;

        if (levelConfig.type === 'moves') {
            this.movesLeft = levelConfig.maxMoves;
            this.timeLeft = 0;
        } else {
            this.timeLeft = levelConfig.timeLimit;
            this.movesLeft = 0;
            this.startTimer();
        }

        this.generateValidBoard();
        this.switchView('game');
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.currentView !== 'game') {
                clearInterval(this.timerInterval);
                return;
            }
            this.timeLeft--;
            const timeEl = document.getElementById('time-display');
            if (timeEl) timeEl.innerText = this.timeLeft;

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.checkGameOver();
            }
        }, 1000);
    },

    generateValidBoard() {
        do {
            this.board = [];
            for (let r = 0; r < this.rows; r++) {
                const row = [];
                for (let c = 0; c < this.cols; c++) {
                    row.push(Math.floor(Math.random() * this.fruitsCount) + 1);
                }
                this.board.push(row);
            }
        } while (this.hasInitialMatches() || !this.hasPossibleMoves());
    },

    hasInitialMatches() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const val = this.board[r][c];
                if (!val) continue;
                if (c < this.cols - 2 && val === this.board[r][c+1] && val === this.board[r][c+2]) return true;
                if (r < this.rows - 2 && val === this.board[r+1][c] && val === this.board[r+2][c]) return true;
            }
        }
        return false;
    },

    hasPossibleMoves() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (c < this.cols - 1) {
                    this.swapCells(r, c, r, c+1);
                    const has = this.checkMatchesSilent();
                    this.swapCells(r, c, r, c+1);
                    if (has) return true;
                }
                if (r < this.rows - 1) {
                    this.swapCells(r, c, r+1, c);
                    const has = this.checkMatchesSilent();
                    this.swapCells(r, c, r+1, c);
                    if (has) return true;
                }
            }
        }
        return false;
    },

    swapCells(r1, c1, r2, c2) {
        const temp = this.board[r1][c1];
        this.board[r1][c1] = this.board[r2][c2];
        this.board[r2][c2] = temp;
    },

    checkMatchesSilent() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const val = this.board[r][c];
                if (!val) continue;
                if (c < this.cols - 2 && val === this.board[r][c+1] && val === this.board[r][c+2]) return true;
                if (r < this.rows - 2 && val === this.board[r+1][c] && val === this.board[r+2][c]) return true;
            }
        }
        return false;
    },

    renderGameScreen() {
        const container = document.getElementById('view-container');
        const levelConfig = GameData.levels.find(l => l.id === this.currentLevelId) || GameData.levels[0];
        const progressPct = Math.min(100, Math.floor((this.score / levelConfig.targetScore) * 100));

        container.innerHTML = `
            <div class="flex flex-col h-full space-y-3 animate-pop">
                <!-- Top HUD Bar -->
                <div class="flex items-center justify-between glass-panel px-3 py-2 rounded-2xl text-xs sm:text-sm">
                    <button onclick="SoundManager.playSelect(); if(Game.timerInterval) clearInterval(Game.timerInterval); Game.switchView('levels')" class="px-3 py-1.5 glass-panel rounded-xl font-semibold hover:bg-slate-700/50">
                        ← Назад
                    </button>
                    <div class="font-bold text-white">Ур. ${this.currentLevelId}</div>
                    <div class="font-semibold text-amber-400">Счёт: <span id="score-display">${this.score}</span></div>
                </div>

                <!-- Objective & Status -->
                <div class="glass-panel p-3 rounded-2xl flex flex-col space-y-2">
                    <div class="flex justify-between items-center text-xs text-slate-300 font-medium">
                        <span>Цель: ${levelConfig.targetScore} очков</span>
                        <span>${levelConfig.type === 'moves' ? 'Ходы: <span id="moves-display" class="font-bold text-white">' + this.movesLeft + '</span>' : 'Время: <span id="time-display" class="font-bold text-white">' + this.timeLeft + '</span>с'}</span>
                    </div>
                    <!-- Progress Bar -->
                    <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div id="progress-bar" class="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
                    </div>
                </div>

                <!-- Game Grid Board -->
                <div class="flex items-center justify-center my-auto">
                    <div id="game-board" class="grid grid-cols-8 gap-1.5 p-2.5 glass-panel rounded-3xl shadow-2xl max-w-full aspect-square border border-white/10 relative" style="width: min(100%, 380px);">
                        ${this.buildBoardHTML()}
                    </div>
                </div>

                <!-- Combo Indicator Popup -->
                <div id="combo-popup" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-3xl font-extrabold text-amber-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-300 z-30">
                    COMBO x2
                </div>
            </div>
        `;

        this.attachBoardEvents();
    },

    buildBoardHTML() {
        if (!this.board || this.board.length === 0) return '';
        let html = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const val = this.board[r] && this.board[r][c] ? this.board[r][c] : 1;
                const config = GameData.getFruitConfig(val);
                const isSelected = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;
                
                html += `
                    <div data-r="${r}" data-c="${c}" class="fruit-cell relative aspect-square rounded-2xl bg-gradient-to-br ${config.bg} flex items-center justify-center text-2xl sm:text-3xl shadow-md cursor-pointer transition-transform duration-200 hover:scale-105 ${isSelected ? 'ring-4 ring-white scale-110 shadow-xl z-20' : ''}" style="box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 6px ${config.shadow}">
                        <span class="select-none pointer-events-none">${config.emoji}</span>
                    </div>
                `;
            }
        }
        return html;
    },

    attachBoardEvents() {
        const boardEl = document.getElementById('game-board');
        if (!boardEl) return;

        const handleCellClick = (r, c) => {
            if (this.isAnimating) return;

            if (!this.selectedCell) {
                this.selectedCell = { r, c };
                SoundManager.playSelect();
                this.updateBoardUI();
            } else {
                const r1 = this.selectedCell.r;
                const c1 = this.selectedCell.c;
                const r2 = r;
                const c2 = c;

                const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);

                if (isAdjacent) {
                    this.selectedCell = null;
                    this.executeSwapAndMatch(r1, c1, r2, c2);
                } else {
                    this.selectedCell = { r, c };
                    SoundManager.playSelect();
                    this.updateBoardUI();
                }
            }
        };

        boardEl.querySelectorAll('.fruit-cell').forEach(cell => {
            const r = parseInt(cell.getAttribute('data-r'));
            const c = parseInt(cell.getAttribute('data-c'));

            cell.addEventListener('click', () => handleCellClick(r, c));
            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleCellClick(r, c);
            });
        });
    },

    updateBoardUI() {
        const boardEl = document.getElementById('game-board');
        if (boardEl) {
            boardEl.innerHTML = this.buildBoardHTML();
            this.attachBoardEvents();
        }
    },

    async executeSwapAndMatch(r1, c1, r2, c2) {
        this.isAnimating = true;
        this.swapCells(r1, c1, r2, c2);
        this.updateBoardUI();

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.combo = 1;
            if (GameData.levels.find(l => l.id === this.currentLevelId).type === 'moves') {
                this.movesLeft--;
                const movesEl = document.getElementById('moves-display');
                if (movesEl) movesEl.innerText = this.movesLeft;
            }
            await this.processMatchesAndCascades();
        } else {
            await new Promise(res => setTimeout(res, 200));
            this.swapCells(r1, c1, r2, c2);
            this.updateBoardUI();
            this.isAnimating = false;
        }
    },

    findMatches() {
        let matchedSet = new Set();

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                let val = this.board[r][c];
                if (!val) continue;
                if (val === this.board[r][c+1] && val === this.board[r][c+2]) {
                    matchedSet.add(`${r},${c}`);
                    matchedSet.add(`${r},${c+1}`);
                    matchedSet.add(`${r},${c+2}`);
                }
            }
        }

        for (let r = 0; r < this.rows - 2; r++) {
            for (let c = 0; c < this.cols; c++) {
                let val = this.board[r][c];
                if (!val) continue;
                if (val === this.board[r+1][c] && val === this.board[r+2][c]) {
                    matchedSet.add(`${r},${c}`);
                    matchedSet.add(`${r+1},${c}`);
                    matchedSet.add(`${r+2},${c}`);
                }
            }
        }

        return Array.from(matchedSet).map(item => {
            const [r, c] = item.split(',').map(Number);
            return { r, c };
        });
    },

    async processMatchesAndCascades() {
        let matches = this.findMatches();
        while (matches.length > 0) {
            SoundManager.playMatch(this.combo);
            
            const points = matches.length * 50 * this.combo;
            this.score += points;
            this.updateHUD();

            if (this.combo > 1) {
                this.showComboAnimation(this.combo);
                SoundManager.playCombo(this.combo);
            }

            matches.forEach(m => {
                this.board[m.r][m.c] = 0;
            });
            this.updateBoardUI();
            await new Promise(res => setTimeout(res, 250));

            for (let c = 0; c < this.cols; c++) {
                let emptyRow = this.rows - 1;
                for (let r = this.rows - 1; r >= 0; r--) {
                    if (this.board[r][c] !== 0) {
                        if (r !== emptyRow) {
                            this.board[emptyRow][c] = this.board[r][c];
                            this.board[r][c] = 0;
                        }
                        emptyRow--;
                    }
                }
                for (let r = emptyRow; r >= 0; r--) {
                    this.board[r][c] = Math.floor(Math.random() * this.fruitsCount) + 1;
                }
            }

            this.updateBoardUI();
            await new Promise(res => setTimeout(res, 300));

            this.combo++;
            matches = this.findMatches();
        }

        this.isAnimating = false;
        this.combo = 1;
        this.checkGameCompletion();
    },

    updateHUD() {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) scoreEl.innerText = this.score;

        const levelConfig = GameData.levels.find(l => l.id === this.currentLevelId) || GameData.levels[0];
        const progressPct = Math.min(100, Math.floor((this.score / levelConfig.targetScore) * 100));
        const bar = document.getElementById('progress-bar');
        if (bar) bar.style.width = progressPct + '%';
    },

    showComboAnimation(mult) {
        const popup = document.getElementById('combo-popup');
        if (popup) {
            popup.innerText = `COMBO x${mult}`;
            popup.classList.remove('opacity-0', 'scale-50');
            popup.classList.add('opacity-100', 'scale-110');
            setTimeout(() => {
                popup.classList.remove('opacity-100', 'scale-110');
                popup.classList.add('opacity-0', 'scale-50');
            }, 600);
        }
    },

    checkGameCompletion() {
        const levelConfig = GameData.levels.find(l => l.id === this.currentLevelId) || GameData.levels[0];
        
        if (this.score >= levelConfig.targetScore) {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.triggerVictory();
            return;
        }

        if (levelConfig.type === 'moves' && this.movesLeft <= 0) {
            this.checkGameOver();
        } else if (levelConfig.type === 'time' && this.timeLeft <= 0) {
            this.checkGameOver();
        } else if (!this.hasPossibleMoves()) {
            this.generateValidBoard();
            this.updateBoardUI();
        }
    },

    checkGameOver() {
        const levelConfig = GameData.levels.find(l => l.id === this.currentLevelId) || GameData.levels[0];
        if (this.score < levelConfig.targetScore) {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.triggerDefeat();
        }
    },

    triggerVictory() {
        SoundManager.playVictory();
        const levelConfig = GameData.levels.find(l => l.id === this.currentLevelId) || GameData.levels[0];
        
        let stars = 1;
        if (this.score >= levelConfig.targetScore * 1.6) stars = 3;
        else if (this.score >= levelConfig.targetScore * 1.3) stars = 2;

        const progress = GameData.loadProgress();
        progress.stars = progress.stars || {};
        progress.stars[this.currentLevelId] = Math.max(progress.stars[this.currentLevelId] || 0, stars);
        if (this.currentLevelId + 1 > (progress.unlockedLevel || 1) && this.currentLevelId < GameData.levels.length + 1) {
            progress.unlockedLevel = this.currentLevelId + 1;
        }
        GameData.saveProgress(progress);

        this.showModal({
            icon: '🏆',
            title: 'Уровень пройден!',
            text: `Отличный результат! Вы набрали ${this.score} очков.`,
            stars: '⭐'.repeat(stars) + '☆'.repeat(3 - stars),
            buttons: `
                <button onclick="Game.closeModal(); Game.startLevel(${this.currentLevelId})" class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-sm transition">Повторить</button>
                ${this.currentLevelId < GameData.levels.length ? `<button onclick="Game.closeModal(); Game.startLevel(${this.currentLevelId + 1})" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition">Дальше →</button>` : `<button onclick="Game.closeModal(); Game.switchView('levels')" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition">Уровни</button>`}
            `
        });
    },

    triggerDefeat() {
        SoundManager.playDefeat();
        this.showModal({
            icon: '💀',
            title: 'Упс! Ходы закончились',
            text: `Вы набрали ${this.score} очков. Чуть-чуть не хватило до цели!`,
            stars: '❌',
            buttons: `
                <button onclick="Game.closeModal(); Game.switchView('levels')" class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-sm transition">Уровни</button>
                <button onclick="Game.closeModal(); Game.startLevel(${this.currentLevelId})" class="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-sm shadow-lg transition">Повторить</button>
            `
        });
    },

    showModal(data) {
        const modal = document.getElementById('msg-modal');
        document.getElementById('modal-icon').innerText = data.icon;
        document.getElementById('modal-title').innerText = data.title;
        document.getElementById('modal-text').innerHTML = `${data.text}<br><div class="text-2xl mt-2">${data.stars || ''}</div>`;
        document.getElementById('modal-buttons').innerHTML = data.buttons;
        modal.classList.remove('hidden');
    },

    closeModal() {
        const modal = document.getElementById('msg-modal');
        modal.classList.add('hidden');
        this.switchView('levels');
    }
};

window.onload = function() {
    Game.init();
};