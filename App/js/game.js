/**
 * ===================================================================
 * MOTOR DE JOGO - AI Tic-Tac-Toe
 * ===================================================================
 * Gere a lógica de jogo, interface, e interação entre jogador e IA.
 * Suporta 3 modos: Clássico 3x3, Expandido 5x5, e Ultimate.
 * ===================================================================
 */

const ai = new TicTacToeAI();

// Estado do jogo
let gameMode = 'classic';   // 'classic', '5x5', 'ultimate'
let board = [];
let boardSize = 3;
let winLength = 3;
let currentPlayer = 'X';    // X = jogador, O = IA
let gameActive = false;
let scores = { player: 0, ai: 0 };
let gamesPlayed = 0;
let draws = 0;

// Ultimate mode
let ultimateBoards = [];     // 9 mini-tabuleiros
let metaBoard = [];          // Estado do meta-tabuleiro
let activeBoard = -1;        // Qual mini-tabuleiro está ativo (-1 = qualquer)

// ===================== INICIALIZAÇÃO =====================
function startGame() {
    const mode = gameMode;
    gameActive = true;
    currentPlayer = 'X';

    if (mode === 'classic') {
        boardSize = 3;
        winLength = 3;
        board = new Array(9).fill('');
        renderClassicBoard(3);
    } else if (mode === '5x5') {
        boardSize = 5;
        winLength = 4;
        board = new Array(25).fill('');
        renderClassicBoard(5);
    } else if (mode === 'ultimate') {
        ultimateBoards = Array.from({ length: 9 }, () => new Array(9).fill(''));
        metaBoard = new Array(9).fill('');
        activeBoard = -1;
        renderUltimateBoard();
    }

    document.getElementById('turn-text').textContent = 'Tua vez';
    document.getElementById('ai-comment').textContent = '';
    document.getElementById('ai-thinking').classList.add('hidden');
    document.getElementById('ai-level').textContent = getDifficultyLabel();

    showScreen('game-screen');

    // Iniciar câmara para controlo por gestos
    initCamera();
}

// ===================== RENDERING =====================
function renderClassicBoard(size) {
    const container = document.getElementById('board-container');
    const boardEl = document.createElement('div');
    boardEl.className = `board board-${size}x${size}`;
    boardEl.id = 'board';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardEl.appendChild(cell);
    }

    container.innerHTML = '';
    container.appendChild(boardEl);
}

function renderUltimateBoard() {
    const container = document.getElementById('board-container');
    const boardEl = document.createElement('div');
    boardEl.className = 'ultimate-board';

    for (let bi = 0; bi < 9; bi++) {
        const miniBoard = document.createElement('div');
        miniBoard.className = 'mini-board';
        miniBoard.id = `mini-board-${bi}`;
        if (activeBoard === -1 || activeBoard === bi) miniBoard.classList.add('active-board');

        for (let ci = 0; ci < 9; ci++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.board = bi;
            cell.dataset.cell = ci;
            cell.addEventListener('click', () => handleUltimateClick(bi, ci));
            miniBoard.appendChild(cell);
        }
        boardEl.appendChild(miniBoard);
    }

    container.innerHTML = '';
    container.appendChild(boardEl);
}

function updateBoardDisplay() {
    if (gameMode === 'ultimate') {
        updateUltimateDisplay();
        return;
    }

    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        cell.textContent = board[i];
        cell.className = 'cell';
        if (board[i] === 'X') cell.classList.add('taken', 'x-cell');
        else if (board[i] === 'O') cell.classList.add('taken', 'o-cell');
    });
}

function updateUltimateDisplay() {
    for (let bi = 0; bi < 9; bi++) {
        const miniBoard = document.getElementById(`mini-board-${bi}`);
        const cells = miniBoard.querySelectorAll('.cell');

        cells.forEach((cell, ci) => {
            cell.textContent = ultimateBoards[bi][ci];
            cell.className = 'cell';
            if (ultimateBoards[bi][ci] === 'X') cell.classList.add('taken', 'x-cell');
            else if (ultimateBoards[bi][ci] === 'O') cell.classList.add('taken', 'o-cell');
        });

        miniBoard.className = 'mini-board';
        if (metaBoard[bi] === 'X') miniBoard.classList.add('won-x');
        else if (metaBoard[bi] === 'O') miniBoard.classList.add('won-o');

        // Marcar tabuleiro ativo
        if (gameActive && currentPlayer === 'X') {
            if (activeBoard === -1 || activeBoard === bi) {
                if (metaBoard[bi] === '') miniBoard.classList.add('active-board');
            }
        }
    }
}

function highlightWinningLine(winLine) {
    if (gameMode === 'ultimate') return;
    const cells = document.querySelectorAll('.cell');
    winLine.forEach(idx => cells[idx].classList.add('winning'));
}

// ===================== LÓGICA DE JOGO (CLASSIC/5x5) =====================
function handleCellClick(index) {
    if (!gameActive || currentPlayer !== 'X' || board[index] !== '') return;

    // Fazer jogada do jogador
    board[index] = 'X';
    ai.recordPlayerMove(index, board, boardSize);
    updateBoardDisplay();

    // Marcar última jogada
    document.querySelectorAll('.cell')[index].classList.add('last-move');

    // Verificar vitória/empate
    const winner = ai.checkWinner(board, boardSize, winLength);
    if (winner) {
        endGame('win');
        return;
    }
    if (ai.isBoardFull(board)) {
        endGame('draw');
        return;
    }

    // Turno da IA
    currentPlayer = 'O';
    document.getElementById('turn-text').textContent = '';
    document.getElementById('ai-thinking').classList.remove('hidden');

    // Delay para simular "pensamento" da IA
    const thinkTime = 400 + Math.random() * 600;
    setTimeout(() => {
        aiMove();
    }, thinkTime);
}

function aiMove() {
    const move = ai.getBestMove(board, boardSize, winLength);
    if (move === -1 || move === undefined) return;

    board[move] = 'O';
    updateBoardDisplay();
    document.querySelectorAll('.cell')[move].classList.add('last-move');

    // Comentário da IA
    const comment = ai.getComment(board, move, boardSize, winLength);
    document.getElementById('ai-comment').textContent = comment;

    document.getElementById('ai-thinking').classList.add('hidden');

    // Verificar vitória/empate
    const winner = ai.checkWinner(board, boardSize, winLength);
    if (winner) {
        endGame('lose');
        return;
    }
    if (ai.isBoardFull(board)) {
        endGame('draw');
        return;
    }

    currentPlayer = 'X';
    document.getElementById('turn-text').textContent = 'Tua vez';
}

// ===================== LÓGICA ULTIMATE =====================
function handleUltimateClick(bi, ci) {
    if (!gameActive || currentPlayer !== 'X') return;
    if (metaBoard[bi] !== '') return; // Mini-board já ganho
    if (activeBoard !== -1 && activeBoard !== bi) return; // Não é o board ativo
    if (ultimateBoards[bi][ci] !== '') return; // Célula ocupada

    // Fazer jogada
    ultimateBoards[bi][ci] = 'X';

    // Verificar se ganhou o mini-board
    const miniWinner = ai.checkWinner(ultimateBoards[bi], 3, 3);
    if (miniWinner) metaBoard[bi] = miniWinner;
    else if (ai.isBoardFull(ultimateBoards[bi])) metaBoard[bi] = 'D';

    // Próximo board ativo
    activeBoard = metaBoard[ci] === '' ? ci : -1;

    updateUltimateDisplay();

    // Verificar vitória no meta-board
    const metaWinner = ai.checkWinner(metaBoard.map(v => v === 'D' ? '' : v), 3, 3);
    if (metaWinner === 'X') { endGame('win'); return; }
    if (metaBoard.every(v => v !== '')) { endGame('draw'); return; }

    // Turno da IA
    currentPlayer = 'O';
    document.getElementById('turn-text').textContent = '';
    document.getElementById('ai-thinking').classList.remove('hidden');

    setTimeout(() => aiUltimateMove(), 500 + Math.random() * 500);
}

function aiUltimateMove() {
    const move = ai.getUltimateMove(ultimateBoards, metaBoard, activeBoard, 'O');
    if (!move) return;

    ultimateBoards[move.board][move.cell] = 'O';

    // Verificar mini-board
    const miniWinner = ai.checkWinner(ultimateBoards[move.board], 3, 3);
    if (miniWinner) metaBoard[move.board] = miniWinner;
    else if (ai.isBoardFull(ultimateBoards[move.board])) metaBoard[move.board] = 'D';

    activeBoard = metaBoard[move.cell] === '' ? move.cell : -1;

    updateUltimateDisplay();
    document.getElementById('ai-thinking').classList.add('hidden');
    document.getElementById('ai-comment').textContent = ai.getComment([], undefined, 3, 3);

    // Verificar meta-vitória
    const metaWinner = ai.checkWinner(metaBoard.map(v => v === 'D' ? '' : v), 3, 3);
    if (metaWinner === 'O') { endGame('lose'); return; }
    if (metaBoard.every(v => v !== '')) { endGame('draw'); return; }

    currentPlayer = 'X';
    document.getElementById('turn-text').textContent = 'Tua vez';
}

// ===================== FIM DE JOGO =====================
function endGame(result) {
    gameActive = false;
    gamesPlayed++;
    document.getElementById('games-played').textContent = gamesPlayed;

    // Encontrar e destacar linha vencedora (classic/5x5)
    if (gameMode !== 'ultimate' && result !== 'draw') {
        const lines = ai.getAllLines(boardSize, winLength);
        const winner = result === 'win' ? 'X' : 'O';
        for (const line of lines) {
            if (line.every(idx => board[idx] === winner)) {
                highlightWinningLine(line);
                break;
            }
        }
    }

    // Atualizar scores
    if (result === 'win') {
        scores.player++;
        ai.updateAdaptive('win');
    } else if (result === 'lose') {
        scores.ai++;
        ai.updateAdaptive('lose');
    } else {
        draws++;
        ai.updateAdaptive('draw');
    }

    document.getElementById('player-score').textContent = scores.player;
    document.getElementById('ai-score').textContent = scores.ai;
    document.getElementById('draws-count').textContent = draws;

    // Atualizar barra de nível IA
    const aiFill = document.getElementById('ai-fill');
    if (aiFill) {
        aiFill.style.width = (ai.adaptiveLevel * 100) + '%';
    }

    // Mostrar mensagem grande no ecrã
    showBigMessage(result);

    // Mostrar modal com delay
    setTimeout(() => showResult(result), 2500);
}

/**
 * Mostra uma mensagem grande e animada no ecrã quando o jogo acaba
 */
function showBigMessage(result) {
    // Remover mensagem anterior se existir
    const existing = document.getElementById('big-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.id = 'big-message';
    msg.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 50; pointer-events: none;
        animation: bigMsgIn 0.4s ease;
    `;

    let text, color;
    if (result === 'win') {
        text = 'Ganhaste';
        color = '#4f4';
    } else if (result === 'lose') {
        text = 'Perdeste';
        color = '#f44';
    } else {
        text = 'Enpatou';
        color = '#ff0';
    }

    msg.innerHTML = `<span style="
        font-size: 5rem; font-weight: 900; color: ${color};
        text-shadow: 0 0 40px ${color}, 0 0 80px ${color}44;
        letter-spacing: 0.2rem;
        animation: bigMsgPulse 0.6s ease infinite alternate;
    ">${text}</span>`;

    document.body.appendChild(msg);

    // Remover após 2 segundos
    setTimeout(() => {
        msg.style.animation = 'bigMsgOut 0.4s ease forwards';
        setTimeout(() => msg.remove(), 400);
    }, 2000);
}

function showResult(result) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const insight = document.getElementById('result-ai-insight');

    if (result === 'win') {
        title.textContent = '🎉 Ganhaste';
        title.style.color = '#58a6ff';
        message.textContent = 'Parabéns! Derrotaste a IA!';
    } else if (result === 'lose') {
        title.textContent = '🤖 Perdeste';
        title.style.color = '#f78166';
        message.textContent = 'A IA foi mais esperta desta vez...';
    } else {
        title.textContent = '🤝 Enpatou';
        title.style.color = '#e3b341';
        message.textContent = 'Boa partida! Ninguém conseguiu ganhar.';
    }

    // Insight da IA
    const report = ai.generateReport();
    insight.innerHTML = '<strong>🧠 Análise:</strong><br>' + report.join('<br>');

    modal.classList.remove('hidden');
}

// ===================== UTILITÁRIOS =====================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function getDifficultyLabel() {
    const labels = { easy: 'Fácil', medium: 'Médio', hard: 'Impossível', adaptive: 'Adaptativo' };
    return labels[ai.difficulty] || 'Médio';
}

// ===================== EVENT LISTENERS =====================
// Seleção de dificuldade
document.querySelectorAll('.btn-diff').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active-diff'));
        btn.classList.add('active-diff');
        ai.difficulty = btn.dataset.diff;
    });
});

// Seleção de modo
document.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active-mode'));
        btn.classList.add('active-mode');
        gameMode = btn.dataset.mode;
    });
});

// Botões
document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu-screen'));
document.getElementById('btn-play-again').addEventListener('click', () => {
    document.getElementById('result-modal').classList.add('hidden');
    startGame();
});
document.getElementById('btn-result-menu').addEventListener('click', () => {
    document.getElementById('result-modal').classList.add('hidden');
    showScreen('menu-screen');
});

// ===================== INTEGRAÇÃO COM CÂMARA =====================
/**
 * Inicia o sistema de visão computacional (MediaPipe Hands)
 * O jogador controla o cursor com o dedo indicador e
 * confirma a jogada fechando a mão (punho).
 */
let cameraInitialized = false;

function initCamera() {
    if (cameraInitialized) return;
    cameraInitialized = true;

    handTracker.start();

    // Callback: quando o jogador confirma uma célula via gesto
    handTracker.onCellConfirmed = function(cellIndex, cellElement) {
        if (!gameActive || currentPlayer !== 'X') return;

        if (gameMode === 'ultimate') {
            // Para Ultimate, extrair board e cell do elemento
            const bi = parseInt(cellElement.dataset.board);
            const ci = parseInt(cellElement.dataset.cell);
            if (!isNaN(bi) && !isNaN(ci)) {
                handleUltimateClick(bi, ci);
            }
        } else {
            // Classic / 5x5
            handleCellClick(cellIndex);
        }
    };
}
