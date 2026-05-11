/**
 * ===================================================================
 * MÓDULO DE INTELIGÊNCIA ARTIFICIAL - AI Tic-Tac-Toe
 * ===================================================================
 * Implementa:
 * 1. Algoritmo Minimax com Alpha-Beta Pruning (IA perfeita)
 * 2. IA com níveis de dificuldade (fácil, médio, difícil)
 * 3. Sistema adaptativo que aprende padrões do jogador
 * 4. Comentários contextuais da IA
 * ===================================================================
 */

class TicTacToeAI {
    constructor() {
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard', 'adaptive'

        // Sistema de aprendizagem adaptativa
        this.playerData = {
            moves: [],                    // Histórico de jogadas
            firstMoves: [],               // Primeiras jogadas favoritas
            patterns: {},                 // Padrões detetados (sequências de jogadas)
            preferCorners: 0,             // Preferência por cantos
            preferCenter: 0,              // Preferência pelo centro
            preferEdges: 0,              // Preferência por lados
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            draws: 0,
            blockAttempts: 0,            // Quantas vezes tenta bloquear
            aggressiveness: 0.5          // 0 = defensivo, 1 = agressivo
        };

        // Nível adaptativo (0 a 1)
        this.adaptiveLevel = 0.5;
        this.consecutiveWins = 0;
        this.consecutiveLosses = 0;
    }

    /**
     * =========================================================
     * ALGORITMO MINIMAX COM ALPHA-BETA PRUNING
     * =========================================================
     * O algoritmo Minimax explora todas as jogadas possíveis e
     * escolhe a que maximiza o resultado para a IA, assumindo
     * que o jogador também joga de forma ótima.
     * 
     * Alpha-Beta Pruning otimiza cortando ramos da árvore que
     * não podem influenciar a decisão final.
     * 
     * @param {string[]} board - Estado do tabuleiro
     * @param {number} depth - Profundidade atual
     * @param {boolean} isMaximizing - Se é o turno da IA (maximizar)
     * @param {number} alpha - Melhor valor garantido para maximizador
     * @param {number} beta - Melhor valor garantido para minimizador
     * @param {number} boardSize - Tamanho do tabuleiro
     * @param {number} winLength - Peças em linha para ganhar
     * @returns {number} - Pontuação da posição
     */
    minimax(board, depth, isMaximizing, alpha, beta, boardSize, winLength) {
        // Verificar estado terminal
        const winner = this.checkWinner(board, boardSize, winLength);
        if (winner === 'O') return 10 - depth;  // IA ganha (preferir vitórias rápidas)
        if (winner === 'X') return depth - 10;  // Jogador ganha
        if (this.isBoardFull(board)) return 0;   // Empate

        // Limitar profundidade para tabuleiros grandes
        const maxDepth = boardSize === 3 ? 9 : 4;
        if (depth >= maxDepth) return this.evaluatePosition(board, boardSize, winLength);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const eval_ = this.minimax(board, depth + 1, false, alpha, beta, boardSize, winLength);
                    board[i] = '';
                    maxEval = Math.max(maxEval, eval_);
                    alpha = Math.max(alpha, eval_);
                    if (beta <= alpha) break; // Poda Alpha-Beta
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const eval_ = this.minimax(board, depth + 1, true, alpha, beta, boardSize, winLength);
                    board[i] = '';
                    minEval = Math.min(minEval, eval_);
                    beta = Math.min(beta, eval_);
                    if (beta <= alpha) break; // Poda Alpha-Beta
                }
            }
            return minEval;
        }
    }

    /**
     * Avalia uma posição não-terminal (heurística para tabuleiros grandes)
     * Conta linhas com potencial de vitória para cada jogador
     */
    evaluatePosition(board, boardSize, winLength) {
        let score = 0;
        const lines = this.getAllLines(boardSize, winLength);

        for (const line of lines) {
            let oCount = 0, xCount = 0, emptyCount = 0;
            for (const idx of line) {
                if (board[idx] === 'O') oCount++;
                else if (board[idx] === 'X') xCount++;
                else emptyCount++;
            }
            // Linha só com peças da IA
            if (xCount === 0 && oCount > 0) {
                score += Math.pow(10, oCount);
            }
            // Linha só com peças do jogador
            if (oCount === 0 && xCount > 0) {
                score -= Math.pow(10, xCount);
            }
        }
        return score > 0 ? Math.min(score / 100, 5) : Math.max(score / 100, -5);
    }

    /**
     * Escolhe a melhor jogada para a IA
     * @param {string[]} board - Estado atual do tabuleiro
     * @param {number} boardSize - Tamanho (3 ou 5)
     * @param {number} winLength - Peças em linha para ganhar
     * @returns {number} - Índice da célula escolhida
     */
    getBestMove(board, boardSize = 3, winLength = 3) {
        switch (this.difficulty) {
            case 'easy': return this.getEasyMove(board, boardSize, winLength);
            case 'medium': return this.getMediumMove(board, boardSize, winLength);
            case 'hard': return this.getHardMove(board, boardSize, winLength);
            case 'adaptive': return this.getAdaptiveMove(board, boardSize, winLength);
            default: return this.getMediumMove(board, boardSize, winLength);
        }
    }

    /**
     * IA Fácil: 40% jogadas aleatórias, 60% semi-inteligente
     */
    getEasyMove(board, boardSize, winLength) {
        // 40% chance de jogada aleatória
        if (Math.random() < 0.4) {
            return this.getRandomMove(board);
        }
        // Tentar ganhar se possível
        const winMove = this.findWinningMove(board, 'O', boardSize, winLength);
        if (winMove !== -1) return winMove;
        // Senão, aleatório
        return this.getRandomMove(board);
    }

    /**
     * IA Média: Bloqueia vitórias, tenta ganhar, mas não é perfeita
     */
    getMediumMove(board, boardSize, winLength) {
        // Tentar ganhar
        const winMove = this.findWinningMove(board, 'O', boardSize, winLength);
        if (winMove !== -1) return winMove;

        // Bloquear jogador
        const blockMove = this.findWinningMove(board, 'X', boardSize, winLength);
        if (blockMove !== -1) return blockMove;

        // 30% chance de jogada sub-ótima
        if (Math.random() < 0.3) {
            return this.getStrategicMove(board, boardSize);
        }

        // Minimax com profundidade limitada
        return this.getHardMove(board, boardSize, winLength);
    }

    /**
     * IA Difícil (Impossível): Minimax puro - nunca perde
     */
    getHardMove(board, boardSize, winLength) {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = this.minimax(board, 0, false, -Infinity, Infinity, boardSize, winLength);
                board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    /**
     * =========================================================
     * IA ADAPTATIVA - Machine Learning
     * =========================================================
     * Ajusta a dificuldade baseada no desempenho do jogador.
     * Também tenta prever e contrariar padrões do jogador.
     */
    getAdaptiveMove(board, boardSize, winLength) {
        // Primeiro, tentar contra-jogar padrões detetados
        const patternMove = this.predictAndCounter(board, boardSize);
        if (patternMove !== -1 && Math.random() < this.adaptiveLevel) {
            return patternMove;
        }

        // Usar nível adaptativo para decidir qualidade da jogada
        if (Math.random() < this.adaptiveLevel) {
            return this.getHardMove(board, boardSize, winLength);
        } else if (Math.random() < 0.5) {
            return this.getMediumMove(board, boardSize, winLength);
        } else {
            return this.getEasyMove(board, boardSize, winLength);
        }
    }

    /**
     * Tenta prever a próxima jogada do jogador baseado em padrões
     * e posiciona-se para bloquear/contrariar
     */
    predictAndCounter(board, boardSize) {
        const moveCount = board.filter(c => c !== '').length;

        // Prever primeira jogada do jogador
        if (moveCount === 0 && this.playerData.firstMoves.length > 3) {
            // Encontrar primeira jogada mais frequente
            const counts = {};
            this.playerData.firstMoves.forEach(m => counts[m] = (counts[m] || 0) + 1);
            const predicted = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            if (predicted && predicted[1] / this.playerData.firstMoves.length > 0.4) {
                // Jogar de forma a contrariar a posição favorita
                return -1; // Deixar minimax decidir (já sabe que o jogador vai lá)
            }
        }

        // Se o jogador prefere cantos, ocupar o centro
        if (this.playerData.preferCorners > this.playerData.preferCenter * 2) {
            const center = Math.floor(boardSize * boardSize / 2);
            if (board[center] === '') return center;
        }

        // Se prefere o centro, ocupar cantos
        if (this.playerData.preferCenter > this.playerData.preferCorners * 2) {
            const corners = boardSize === 3 ? [0, 2, 6, 8] : [0, 4, 20, 24];
            const available = corners.filter(c => board[c] === '');
            if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
        }

        return -1;
    }

    /**
     * Regista uma jogada do jogador para aprendizagem
     */
    recordPlayerMove(index, board, boardSize) {
        const moveNumber = board.filter(c => c !== '').length;
        this.playerData.moves.push(index);

        // Primeira jogada
        if (moveNumber <= 1) {
            this.playerData.firstMoves.push(index);
            if (this.playerData.firstMoves.length > 20) this.playerData.firstMoves.shift();
        }

        // Classificar posição
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        const isCorner = (row === 0 || row === boardSize - 1) && (col === 0 || col === boardSize - 1);
        const isCenter = row === Math.floor(boardSize / 2) && col === Math.floor(boardSize / 2);

        if (isCorner) this.playerData.preferCorners++;
        else if (isCenter) this.playerData.preferCenter++;
        else this.playerData.preferEdges++;

        // Detetar bloqueios
        const wasBlocking = this.findWinningMove(board, 'O', boardSize, boardSize === 5 ? 4 : 3);
        if (wasBlocking === index) this.playerData.blockAttempts++;
    }

    /**
     * Atualiza o sistema adaptativo após cada jogo
     * @param {string} result - 'win', 'lose', 'draw'
     */
    updateAdaptive(result) {
        this.playerData.gamesPlayed++;

        switch (result) {
            case 'win':
                this.playerData.gamesWon++;
                this.consecutiveWins++;
                this.consecutiveLosses = 0;
                // Jogador ganhou → IA fica mais forte
                this.adaptiveLevel = Math.min(1, this.adaptiveLevel + 0.15);
                break;
            case 'lose':
                this.playerData.gamesLost++;
                this.consecutiveLosses++;
                this.consecutiveWins = 0;
                // Jogador perdeu → IA fica mais fraca
                this.adaptiveLevel = Math.max(0.1, this.adaptiveLevel - 0.1);
                break;
            case 'draw':
                this.playerData.draws++;
                this.consecutiveWins = 0;
                this.consecutiveLosses = 0;
                // Empate → ligeiro aumento
                this.adaptiveLevel = Math.min(1, this.adaptiveLevel + 0.05);
                break;
        }

        // Calcular agressividade do jogador
        const total = this.playerData.preferCorners + this.playerData.preferCenter + this.playerData.preferEdges;
        if (total > 0) {
            this.playerData.aggressiveness = this.playerData.preferCenter / total;
        }
    }

    // ===================== UTILITÁRIOS =====================

    /**
     * Encontra uma jogada que dá vitória imediata ao jogador especificado
     */
    findWinningMove(board, player, boardSize, winLength) {
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = player;
                if (this.checkWinner(board, boardSize, winLength) === player) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        return -1;
    }

    /**
     * Verifica se há vencedor no tabuleiro
     */
    checkWinner(board, boardSize, winLength) {
        const lines = this.getAllLines(boardSize, winLength);
        for (const line of lines) {
            const first = board[line[0]];
            if (first && line.every(idx => board[idx] === first)) {
                return first;
            }
        }
        return null;
    }

    /**
     * Obtém todas as linhas vencedoras possíveis
     */
    getAllLines(boardSize, winLength) {
        const key = `${boardSize}-${winLength}`;
        if (this._linesCache && this._linesCache[key]) return this._linesCache[key];

        const lines = [];
        const n = boardSize;

        if (winLength === n) {
            // Linhas completas (3x3 standard)
            for (let i = 0; i < n; i++) {
                const row = [], col = [];
                for (let j = 0; j < n; j++) {
                    row.push(i * n + j);
                    col.push(j * n + i);
                }
                lines.push(row);
                lines.push(col);
            }
            const diag1 = [], diag2 = [];
            for (let i = 0; i < n; i++) {
                diag1.push(i * n + i);
                diag2.push(i * n + (n - 1 - i));
            }
            lines.push(diag1);
            lines.push(diag2);
        } else {
            // Sub-linhas (5x5 com 4 em linha)
            for (let r = 0; r < n; r++) {
                for (let c = 0; c <= n - winLength; c++) {
                    const line = [];
                    for (let k = 0; k < winLength; k++) line.push(r * n + c + k);
                    lines.push(line);
                }
            }
            for (let c = 0; c < n; c++) {
                for (let r = 0; r <= n - winLength; r++) {
                    const line = [];
                    for (let k = 0; k < winLength; k++) line.push((r + k) * n + c);
                    lines.push(line);
                }
            }
            for (let r = 0; r <= n - winLength; r++) {
                for (let c = 0; c <= n - winLength; c++) {
                    const line1 = [], line2 = [];
                    for (let k = 0; k < winLength; k++) {
                        line1.push((r + k) * n + c + k);
                        line2.push((r + k) * n + (c + winLength - 1 - k));
                    }
                    lines.push(line1);
                    lines.push(line2);
                }
            }
        }

        if (!this._linesCache) this._linesCache = {};
        this._linesCache[key] = lines;
        return lines;
    }

    /**
     * Verifica se o tabuleiro está cheio
     */
    isBoardFull(board) {
        return board.every(cell => cell !== '');
    }

    /**
     * Jogada aleatória
     */
    getRandomMove(board) {
        const available = board.map((cell, i) => cell === '' ? i : -1).filter(i => i !== -1);
        return available[Math.floor(Math.random() * available.length)];
    }

    /**
     * Jogada estratégica (preferir centro e cantos)
     */
    getStrategicMove(board, boardSize) {
        const center = Math.floor(boardSize * boardSize / 2);
        if (board[center] === '') return center;

        const corners = boardSize === 3 ? [0, 2, 6, 8] : [0, 4, 20, 24];
        const availCorners = corners.filter(c => board[c] === '');
        if (availCorners.length > 0) return availCorners[Math.floor(Math.random() * availCorners.length)];

        return this.getRandomMove(board);
    }

    /**
     * Gera um comentário contextual da IA
     */
    getComment(board, lastMove, boardSize, winLength) {
        const moveCount = board.filter(c => c !== '').length;
        const comments = [];

        // Comentário sobre a jogada do jogador
        if (lastMove !== undefined) {
            const row = Math.floor(lastMove / boardSize);
            const col = lastMove % boardSize;
            const isCorner = (row === 0 || row === boardSize - 1) && (col === 0 || col === boardSize - 1);
            const isCenter = row === Math.floor(boardSize / 2) && col === Math.floor(boardSize / 2);

            if (moveCount === 1 && isCenter) {
                comments.push("Centro? Jogada clássica... Vamos ver.");
            } else if (moveCount === 1 && isCorner) {
                comments.push("Canto? Bom começo estratégico.");
            }
        }

        // Comentários baseados no estado do jogo
        if (this.findWinningMove(board, 'X', boardSize, winLength) !== -1) {
            comments.push("Quase me apanhas... mas eu vi!");
            comments.push("Boa tentativa! Mas estou atento.");
        }

        if (this.findWinningMove(board, 'O', boardSize, winLength) !== -1) {
            comments.push("Preparado para o meu golpe final?");
            comments.push("Xeque-mate... quer dizer, Tic-Tac-Toe!");
        }

        // Comentários adaptativos
        if (this.difficulty === 'adaptive') {
            if (this.consecutiveWins >= 3) {
                comments.push(`${this.consecutiveWins} vitórias seguidas? Estou a aumentar a pressão!`);
            }
            if (this.consecutiveLosses >= 2) {
                comments.push("Estou a aprender com os meus erros...");
            }
            if (this.playerData.preferCorners > 10) {
                comments.push("Sei que adoras cantos. Preparei-me para isso.");
            }
        }

        // Comentários gerais
        if (moveCount >= boardSize * boardSize - 2) {
            comments.push("Isto está apertado...");
        }

        if (comments.length === 0) {
            const generic = [
                "Hmm, interessante...",
                "Boa jogada.",
                "Vejamos o que faço com isto...",
                "A calcular possibilidades...",
                "Tens um plano? Eu tenho vários.",
                ""
            ];
            comments.push(generic[Math.floor(Math.random() * generic.length)]);
        }

        return comments[Math.floor(Math.random() * comments.length)];
    }

    /**
     * Gera relatório final do que a IA aprendeu
     */
    generateReport() {
        const d = this.playerData;
        const report = [];

        if (d.gamesPlayed < 2) {
            report.push("Preciso de mais jogos para te analisar melhor!");
            return report;
        }

        const winRate = Math.round((d.gamesWon / d.gamesPlayed) * 100);
        report.push(`Taxa de vitória: ${winRate}% (${d.gamesWon}/${d.gamesPlayed})`);

        const total = d.preferCorners + d.preferCenter + d.preferEdges;
        if (total > 0) {
            if (d.preferCorners / total > 0.4) report.push("Estratégia dominante: Cantos (bom para forks)");
            else if (d.preferCenter / total > 0.3) report.push("Estratégia dominante: Centro (controlo do tabuleiro)");
            else if (d.preferEdges / total > 0.4) report.push("Estratégia dominante: Lados (arriscado!)");
            else report.push("Estratégia variada (difícil de prever)");
        }

        if (this.difficulty === 'adaptive') {
            report.push(`Nível adaptativo atual: ${Math.round(this.adaptiveLevel * 100)}%`);
        }

        if (d.blockAttempts > 5) {
            report.push("Jogador defensivo - tenta bloquear frequentemente");
        }

        return report;
    }

    // ===================== ULTIMATE TIC-TAC-TOE =====================

    /**
     * Melhor jogada para Ultimate Tic-Tac-Toe
     * Usa Minimax simplificado + heurísticas
     */
    getUltimateMove(boards, metaBoard, activeBoard, player) {
        const available = [];

        // Determinar tabuleiros disponíveis
        const playableBoards = activeBoard !== -1 && metaBoard[activeBoard] === ''
            ? [activeBoard]
            : metaBoard.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);

        for (const bi of playableBoards) {
            for (let ci = 0; ci < 9; ci++) {
                if (boards[bi][ci] === '') {
                    available.push({ board: bi, cell: ci });
                }
            }
        }

        if (available.length === 0) return null;

        // Priorizar: ganhar mini-board > bloquear > centro > cantos
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of available) {
            let score = 0;
            const testBoard = [...boards[move.board]];
            testBoard[move.cell] = 'O';

            // Ganhar um mini-board
            if (this.checkWinner(testBoard, 3, 3) === 'O') score += 100;

            // Bloquear vitória do jogador
            const testBlock = [...boards[move.board]];
            testBlock[move.cell] = 'X';
            if (this.checkWinner(testBlock, 3, 3) === 'X') score += 80;

            // Enviar jogador para board já ganho ou cheio (limita opções)
            if (metaBoard[move.cell] !== '') score += 30;

            // Preferir centro dos mini-boards
            if (move.cell === 4) score += 15;
            // Cantos
            if ([0, 2, 6, 8].includes(move.cell)) score += 10;

            // Centro do meta-board
            if (move.board === 4) score += 20;

            // Adicionar aleatoriedade baseada na dificuldade
            score += Math.random() * (1 - this.adaptiveLevel) * 50;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }
}
