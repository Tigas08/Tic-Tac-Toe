# AI Tic-Tac-Toe - Jogo da Velha com Inteligência Artificial

## Descrição

**AI Tic-Tac-Toe** é uma versão avançada do clássico Jogo da Velha que implementa múltiplos algoritmos de Inteligência Artificial, incluindo Minimax com Alpha-Beta Pruning e um sistema de aprendizagem adaptativa que evolui com o jogador.

## Tecnologias Usadas

| Componente | Tecnologia |
|------------|-----------|
| Frontend | HTML5 + CSS3 (Grid, Flexbox, Animações) |
| Linguagem | JavaScript (ES6+) |
| IA - Decisão | Algoritmo Minimax com Alpha-Beta Pruning |
| IA - Adaptação | Machine Learning (análise de padrões + dificuldade dinâmica) |
| Visão Computacional | MediaPipe Hands (deteção de mãos via webcam) |
| IA - Pathfinding | Heurística posicional + avaliação de tabuleiro |

## Modos de Jogo

### 1. Clássico 3x3
O jogo da velha tradicional. 3 em linha para ganhar.

### 2. Expandido 5x5 (4 em linha)
Tabuleiro maior onde é preciso alinhar 4 peças. A IA usa heurísticas avançadas.

### 3. Ultimate Tic-Tac-Toe
9 mini-tabuleiros organizados numa grelha 3x3. Cada jogada determina em que mini-tabuleiro o adversário joga. Ganha quem conquistar 3 mini-tabuleiros em linha.

## Níveis de Dificuldade

### Fácil
- 40% jogadas aleatórias
- Tenta ganhar se possível, mas não bloqueia consistentemente

### Médio
- Bloqueia vitórias do jogador
- Tenta ganhar quando possível
- 30% chance de jogada sub-ótima

### Impossível
- Algoritmo Minimax perfeito com Alpha-Beta Pruning
- Nunca perde no 3x3 (matematicamente impossível)
- Jogo ótimo garantido

### Adaptativo (Machine Learning)
- Começa com nível intermédio
- Aprende os padrões do jogador ao longo dos jogos
- Se o jogador ganha → IA fica mais forte
- Se o jogador perde → IA fica mais fraca
- Deteta estratégias favoritas (cantos, centro, lados)
- Contra-joga padrões previsíveis

## Mecânicas Principais

### Algoritmo Minimax
```
O algoritmo explora recursivamente TODAS as jogadas possíveis:
1. Simula cada jogada possível
2. Assume que ambos os jogadores jogam de forma ótima
3. Atribui pontuação: +10 se IA ganha, -10 se perde, 0 empate
4. Prefere vitórias rápidas (penaliza profundidade)
5. Alpha-Beta Pruning corta ramos impossíveis (otimização)
```

### Sistema Adaptativo
- Regista todas as jogadas do jogador
- Calcula preferência por cantos/centro/lados
- Deteta jogadores agressivos vs defensivos
- Ajusta o nível de jogo automaticamente
- Tenta prever e contrariar a estratégia do jogador

### Visão Computacional - Controlo por Câmara
O jogo utiliza **MediaPipe Hands** para detetar a mão do jogador via webcam:
1. A ponta do **dedo indicador** funciona como cursor sobre o tabuleiro
2. **Fechar a mão** (gesto de punho) durante ~1 segundo confirma a jogada (coloca o X)
3. Feedback visual: cursor azul, highlight da célula, barra de progresso
4. O jogador pode sempre usar o **rato/clique** como alternativa

### Funcionalidades Extras
- Comentários contextuais da IA durante o jogo
- Análise final com estatísticas e padrões detetados
- Barra visual do nível de IA
- Animações e feedback visual (última jogada, linha vencedora)
- Responsive (funciona em mobile)
- Controlo por toque (mobile)

## Instruções de Instalação e Execução

### Opção 1: XAMPP
1. Ficheiros em `C:\xampp\htdocs\App\`
2. Iniciar Apache no XAMPP
3. Abrir: `http://localhost/App/`

### Opção 2: Abrir Diretamente
Abrir `index.html` no browser (Chrome, Firefox, Edge)

### Opção 3: Live Server (VS Code)
Botão direito em `index.html` → "Open with Live Server"

**Zero dependências** — funciona inteiramente no browser.

## Estrutura do Projeto

```
App/
├── index.html       # Página principal (menu, jogo, modais)
├── css/
│   └── style.css    # Interface moderna (tema escuro GitHub-style)
├── js/
│   ├── ai.js        # IA: Minimax, Alpha-Beta, Adaptação, Ultimate
│   ├── camera.js    # Visão Computacional: MediaPipe Hands, gestos
│   └── game.js      # Motor de jogo: rendering, lógica, interação
└── README.md        # Documentação
```

## Como a IA Funciona (Resumo Técnico)

### Minimax com Alpha-Beta Pruning
1. **Exploração**: Gera árvore de todas as jogadas possíveis
2. **Avaliação**: Folhas recebem +10 (vitória IA), -10 (derrota), 0 (empate)
3. **Propagação**: Maximiza para IA, minimiza para jogador
4. **Poda**: Se um ramo não pode melhorar o resultado, é ignorado
5. **Profundidade**: Prefere vitórias rápidas (10 - depth)

### Heurística para 5x5
- Conta peças alinhadas por linha possível
- Pontuação exponencial (2 em linha = 100, 3 = 1000)
- Subtrai linhas ameaçadoras do adversário

### Aprendizagem Adaptativa
1. Regista posição de cada jogada (canto/centro/lado)
2. Calcula frequência de primeira jogada
3. Se jogador é previsível → contra-joga padrão
4. Ajusta `adaptiveLevel` (0.1 a 1.0) baseado em vitórias/derrotas
5. Nível alto = mais Minimax, nível baixo = mais aleatório

## Autor

Projeto académico do curso profissional de Programação.

## Licença

Projeto educativo - uso livre para fins académicos.
