/**
 * ===================================================================
 * MÓDULO DE VISÃO COMPUTACIONAL - AI Tic-Tac-Toe
 * ===================================================================
 * Utiliza MediaPipe Hands para detetar a mão do jogador via webcam.
 * O jogador aponta para uma célula do tabuleiro e fecha a mão
 * (gesto de "punho") para confirmar a jogada.
 * 
 * Funcionalidades:
 * - Deteção da mão em tempo real
 * - Tracking do dedo indicador (ponta)
 * - Deteção de gesto "mão fechada" para confirmar
 * - Mapeamento da posição da mão para as células do tabuleiro
 * - Feedback visual (cursor, barra de progresso, highlight)
 * ===================================================================
 */

class HandTracker {
    constructor() {
        this.video = document.getElementById('camera-feed');
        this.canvas = document.getElementById('camera-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.cursor = document.getElementById('hand-cursor');
        this.gestureText = document.getElementById('gesture-text');
        this.confirmFill = document.getElementById('confirm-fill');

        this.isActive = false;
        this.hands = null;
        this.camera = null;

        // Estado do tracking
        this.fingerPosition = { x: 0, y: 0 };  // Posição normalizada (0-1)
        this.smoothedPosition = { x: 0, y: 0 }; // Posição suavizada
        this.smoothingFactor = 0.15;  // Quanto menor, mais suave (0.1 = muito suave)
        this.isHandClosed = false;
        this.hoveredCell = -1;
        this.confirmTimer = 0;
        this.confirmThreshold = 50;  // Frames com mão fechada para confirmar (~2.5 segundos)
        this.lastConfirmTime = 0;

        // Callback quando uma célula é confirmada
        this.onCellConfirmed = null;
    }

    /**
     * Inicia a câmara e o sistema de deteção de mãos
     */
    async start() {
        try {
            // Inicializar MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => this.onResults(results));

            // Iniciar câmara
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.isActive) {
                        await this.hands.send({ image: this.video });
                    }
                },
                width: 320,
                height: 240
            });

            await this.camera.start();
            this.isActive = true;
            this.canvas.width = 320;
            this.canvas.height = 240;

            this.gestureText.textContent = '📷 Câmara ativa - Aponta e fecha a mão';
            console.log('[Camera] MediaPipe Hands iniciado com sucesso');

        } catch (error) {
            console.error('[Camera] Erro ao iniciar:', error);
            this.gestureText.textContent = '⚠️ Erro na câmara - Usa clique normal';
            this.isActive = false;
        }
    }

    /**
     * Para a câmara e limpa recursos
     */
    stop() {
        this.isActive = false;
        if (this.camera) {
            this.camera.stop();
        }
        this.cursor.classList.remove('active');
    }

    /**
     * Callback principal - chamado a cada frame processado pelo MediaPipe
     * @param {Object} results - Resultados da deteção de mãos
     */
    onResults(results) {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Desenhar landmarks da mão no canvas
            this.drawHandLandmarks(landmarks);

            // Obter posição da ponta do dedo indicador (landmark 8)
            const indexTip = landmarks[8];
            // Espelhar X porque a câmara é espelhada
            this.fingerPosition.x = 1 - indexTip.x;
            this.fingerPosition.y = indexTip.y;

            // Suavizar movimento (interpolação linear) para reduzir tremores
            this.smoothedPosition.x += (this.fingerPosition.x - this.smoothedPosition.x) * this.smoothingFactor;
            this.smoothedPosition.y += (this.fingerPosition.y - this.smoothedPosition.y) * this.smoothingFactor;

            // Atualizar cursor visual com posição suavizada
            this.cursor.classList.add('active');
            this.cursor.style.left = (this.smoothedPosition.x * 100) + '%';
            this.cursor.style.top = (this.smoothedPosition.y * 100) + '%';

            // Detetar se a mão está fechada (gesto de confirmar)
            this.isHandClosed = this.detectClosedHand(landmarks);

            if (this.isHandClosed) {
                this.cursor.classList.add('closed');
                this.confirmTimer++;
                this.confirmFill.style.width = Math.min(100, (this.confirmTimer / this.confirmThreshold) * 100) + '%';

                // Confirmar jogada após threshold
                if (this.confirmTimer >= this.confirmThreshold) {
                    this.confirmCell();
                }
            } else {
                this.cursor.classList.remove('closed');
                this.confirmTimer = 0;
                this.confirmFill.style.width = '0%';
            }

            // Mapear posição para célula do tabuleiro
            this.updateHoveredCell();

            // Atualizar texto do gesto
            if (this.isHandClosed) {
                this.gestureText.textContent = '✊ Mão fechada - A confirmar...';
            } else {
                this.gestureText.textContent = '☝️ Aponta para uma célula e fecha a mão';
            }

        } else {
            // Sem mão detetada
            this.cursor.classList.remove('active', 'closed');
            this.confirmTimer = 0;
            this.confirmFill.style.width = '0%';
            this.clearHoveredCell();
            this.gestureText.textContent = '👋 Mostra a mão à câmara';
        }
    }

    /**
     * Desenha os landmarks da mão no canvas de overlay
     * @param {Object[]} landmarks - 21 pontos da mão detetados
     */
    drawHandLandmarks(landmarks) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Desenhar conexões
        const connections = [
            [0,1],[1,2],[2,3],[3,4],      // Polegar
            [0,5],[5,6],[6,7],[7,8],      // Indicador
            [0,9],[9,10],[10,11],[11,12], // Médio
            [0,13],[13,14],[14,15],[15,16], // Anelar
            [0,17],[17,18],[18,19],[19,20], // Mindinho
            [5,9],[9,13],[13,17]           // Palma
        ];

        ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
        ctx.lineWidth = 2;
        for (const [i, j] of connections) {
            ctx.beginPath();
            ctx.moveTo(landmarks[i].x * w, landmarks[i].y * h);
            ctx.lineTo(landmarks[j].x * w, landmarks[j].y * h);
            ctx.stroke();
        }

        // Desenhar pontos
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            ctx.fillStyle = i === 8 ? '#4f4' : 'rgba(88, 166, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(lm.x * w, lm.y * h, i === 8 ? 6 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Deteta se a mão está fechada (punho)
     * Compara a distância entre as pontas dos dedos e a base da mão.
     * Se todos os dedos estiverem dobrados, a mão está fechada.
     * 
     * @param {Object[]} landmarks - Landmarks da mão
     * @returns {boolean} - true se mão fechada
     */
    detectClosedHand(landmarks) {
        // Pontas dos dedos: 8 (indicador), 12 (médio), 16 (anelar), 20 (mindinho)
        // Base dos dedos (MCP): 5, 9, 13, 17
        // Pulso: 0

        const fingerTips = [8, 12, 16, 20];
        const fingerMCPs = [5, 9, 13, 17];

        let closedFingers = 0;

        for (let i = 0; i < 4; i++) {
            const tip = landmarks[fingerTips[i]];
            const mcp = landmarks[fingerMCPs[i]];
            const wrist = landmarks[0];

            // Dedo está dobrado se a ponta está mais perto do pulso que o MCP
            const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

            if (tipDist < mcpDist * 1.1) {
                closedFingers++;
            }
        }

        // Mão fechada se pelo menos 3 dedos estão dobrados
        return closedFingers >= 3;
    }

    /**
     * Mapeia a posição do dedo para a célula do tabuleiro
     * correspondente e aplica highlight visual
     */
    updateHoveredCell() {
        const boardEl = document.getElementById('board-container');
        const boardRect = boardEl.getBoundingClientRect();
        const gameScreen = document.getElementById('game-screen');
        const screenRect = gameScreen.getBoundingClientRect();

        // Converter posição suavizada do dedo para coordenadas de ecrã
        const screenX = screenRect.left + this.smoothedPosition.x * screenRect.width;
        const screenY = screenRect.top + this.smoothedPosition.y * screenRect.height;

        // Verificar quais células estão sob o cursor
        const cells = boardEl.querySelectorAll('.cell');
        let found = false;

        cells.forEach((cell, i) => {
            const rect = cell.getBoundingClientRect();
            if (screenX >= rect.left && screenX <= rect.right &&
                screenY >= rect.top && screenY <= rect.bottom) {
                cell.classList.add('hovered-by-hand');
                this.hoveredCell = parseInt(cell.dataset.index || cell.dataset.cell || i);
                this.hoveredCellElement = cell;
                found = true;
            } else {
                cell.classList.remove('hovered-by-hand');
            }
        });

        if (!found) {
            this.hoveredCell = -1;
            this.hoveredCellElement = null;
        }
    }

    /**
     * Remove highlight de todas as células
     */
    clearHoveredCell() {
        document.querySelectorAll('.cell.hovered-by-hand').forEach(c => {
            c.classList.remove('hovered-by-hand');
        });
        this.hoveredCell = -1;
    }

    /**
     * Confirma a jogada na célula atualmente selecionada
     * Chamado quando o jogador mantém a mão fechada tempo suficiente
     */
    confirmCell() {
        const now = Date.now();
        if (now - this.lastConfirmTime < 1000) return; // Debounce 1 segundo
        this.lastConfirmTime = now;
        this.confirmTimer = 0;
        this.confirmFill.style.width = '0%';

        if (this.hoveredCell !== -1 && this.onCellConfirmed) {
            // Efeito visual de confirmação
            if (this.hoveredCellElement) {
                this.hoveredCellElement.style.transition = 'transform 0.1s';
                this.hoveredCellElement.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (this.hoveredCellElement) {
                        this.hoveredCellElement.style.transform = 'scale(1)';
                    }
                }, 100);
            }

            this.onCellConfirmed(this.hoveredCell, this.hoveredCellElement);
            this.gestureText.textContent = '✅ Jogada confirmada!';
        }
    }
}

// Instância global do hand tracker
const handTracker = new HandTracker();
