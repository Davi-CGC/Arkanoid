class Game {
    // Cria a instância do jogo
    constructor() {
        // Obtém o elemento <canvas> e seu contexto 2D para desenhar
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext('2d');

        // Define largura e altura do canvas
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Configuração dos blocos (grade)
        this.brickRowCount = 2;          // número de linhas de blocos
        this.brickColumnCount = 6;       // número de colunas de blocos
        this.brickWidth = 75;            // largura de cada bloco em pixels
        this.brickHeight = 20;           // altura de cada bloco em pixels
        this.brickPadding = 10;          // espaço (em pixels) entre os blocos
        this.brickOffsetTop = 30;        // deslocamento superior da grade de blocos
        this.brickOffsetLeft = 30;       // deslocamento esquerdo da grade de blocos
        this.bricks = [];                // array que armazenará os blocos

        // Controla o nível (fase) atual do jogo
        this.level = 1;

        // Configuração da bola
        this.baseSpeed = 1.5;            // velocidade inicial da bola
        this.ballRadius = 10;            // raio da bola em pixels
        this.ballDX = this.baseSpeed;    // velocidade horizontal inicial (dx)
        this.ballDY = -this.baseSpeed;   // velocidade vertical inicial (dy)
        this.ballX = this.width / 2;     // posição X inicial da bola (centro)
        this.ballY = this.height - 30;   // posição Y inicial da bola (próximo ao paddle)

        // Configuração do paddle (barra)
        this.paddleHeight = 10;          // altura do paddle
        this.paddleWidth = 100;          // largura do paddle
        this.paddleX = (this.width - this.paddleWidth) / 2; // posição X central do paddle
        this.rightPressed = false;       // flag para tecla direita pressionada
        this.leftPressed = false;        // flag para tecla esquerda pressionada

        // Pontuação e recorde
        this.score = 0;                  // contagem de pontos do jogador
        this.totalBricks = 0;            // total de blocos na fase atual
        this.highScore = parseInt(localStorage.getItem("arkanoidHighScore")) || 0; // melhor pontuação salva

        // Estado do jogo
        this.gameOver = false;           // flag indicando fim de jogo

        // Eventos de teclado: seta direita/esquerda para mover o paddle
        document.addEventListener("keydown", (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") this.rightPressed = true;
            if (e.key === "Left" || e.key === "ArrowLeft") this.leftPressed = true;
        });
        document.addEventListener("keyup", (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") this.rightPressed = false;
            if (e.key === "Left" || e.key === "ArrowLeft") this.leftPressed = false;
        });

        // Inicializa a grade de blocos
        this.createBricks();
    }

    /**
     * Cria a matriz de blocos para a fase atual.
     * Inclui blocos normais, bônus (vermelhos) e azuis a cada 2 níveis.
     */
    createBricks() {
        this.bricks = [];        // limpa o array de blocos
        this.totalBricks = 0;    // reinicia contagem
        let isBlueCreated = false; // impede múltiplos blocos azuis

        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                let brickType = "normal"; // padrão é bloco amarelo (1 ponto)
                if (Math.random() < 0.2) {
                    brickType = "bonus";    // 20% de chance de bloco vermelho (10 pontos)
                }
                // a cada 2 níveis (level par), adiciona um bloco azul escuro
                if (this.level % 2 === 0 && !isBlueCreated) {
                    brickType = "blue";      // bloco azul escuro (aumenta 50% de velocidade)
                    isBlueCreated = true;
                }

                // armazena as propriedades iniciais do bloco
                this.bricks[c][r] = { x: 0, y: 0, status: 1, type: brickType };
                this.totalBricks++;
            }
        }
    }

    /**
     * Desenha cada bloco ativo no canvas.
     * Ajusta posição e cor conforme o tipo.
     */
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    // calcula coordenadas do bloco
                    const brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
                    const brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
                    b.x = brickX; // armazena para colisão
                    b.y = brickY;

                    // escolhe cor de acordo com tipo
                    if (b.type === "bonus") this.ctx.fillStyle = "#FF0000";
                    else if (b.type === "blue") this.ctx.fillStyle = "#00008B";
                    else this.ctx.fillStyle = "#FFAA00";

                    // desenha o bloco
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                }
            }
        }
    }

    /** Desenha a bola no canvas. */
    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FF4500"; // cor da bola
        this.ctx.fill();
        this.ctx.closePath();
    }

    /** Desenha o paddle (barra) na parte inferior. */
    drawPaddle() {
        this.ctx.fillStyle = "#00FFAA";
        this.ctx.fillRect(this.paddleX, this.height - this.paddleHeight, this.paddleWidth, this.paddleHeight);
    }

    /** Exibe a pontuação atual e o recorde no canto superior. */
    drawScore() {
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillText(`Score: ${this.score}`, 8, 20);
        this.ctx.fillText(`Recorde: ${this.highScore}`, 400, 20);
    }

    /** Desenha a tela de Game Over com pontuação final. */
    drawGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // fundo semi-transparente
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "32px Arial";
        this.ctx.fillText("Você perdeu!", this.width / 2 - 100, this.height / 2 - 10);
        this.ctx.font = "24px Arial";
        this.ctx.fillText(`Pontuação: ${this.score}`, this.width / 2 - 70, this.height / 2 + 30);
        this.ctx.fillText(`Recorde: ${this.highScore}`, this.width / 2 - 70, this.height / 2 + 60);
    }

    /**
     * Verifica colisão da bola com blocos ativos.
     * Atualiza pontuação e velocidade se necessário.
     */
    checkBrickCollisions() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1 &&
                    this.ballX > b.x && this.ballX < b.x + this.brickWidth &&
                    this.ballY > b.y && this.ballY < b.y + this.brickHeight) {
                    // inverte direção vertical da bola
                    this.ballDY = -this.ballDY;
                    b.status = 0; // marca bloco como destruído

                    // pontua conforme tipo de bloco
                    if (b.type === "bonus") this.score += 10;
                    else if (b.type === "blue") {
                        this.score += 15;
                        this.increaseSpeed(1.5); // aumenta velocidade em 50%
                    } else this.score += 1;

                    this.totalBricks--;
                    // se todos destruídos, passa de fase
                    if (this.totalBricks === 0) {
                        this.level++;
                        this.createBricks(); // recria blocos
                    }
                }
            }
        }
    }

    /**
     * Aumenta a velocidade da bola pelo fator indicado.
     * @param {number} factor // multiplicador da velocidade (padrão 1.5).
     */
    increaseSpeed(factor = 5) {
        this.ballDX *= factor;
        this.ballDY *= factor;
    }

     //Loop principal do jogo: atualiza física, desenha tudo e repete.
    
    update() {
        // se fim de jogo, exibe tela e interrompe
        if (this.gameOver) {
            this.drawGameOver();
            return;
        }

        // limpa canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        // desenha elementos
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        this.drawScore();
        // processa colisões
        this.checkBrickCollisions();

        // atualiza posição da bola
        this.ballX += this.ballDX;
        this.ballY += this.ballDY;

        // colisão com bordas laterais
        if (this.ballX + this.ballDX > this.width - this.ballRadius || this.ballX + this.ballDX < this.ballRadius) {
            this.ballDX = -this.ballDX;
        }
        // colisão com topo
        if (this.ballY + this.ballDY < this.ballRadius) {
            this.ballDY = -this.ballDY;
        // colisão com o paddle ou queda (Game Over)
        } else if (this.ballY + this.ballDY > this.height - this.ballRadius) {
            if (this.ballX > this.paddleX && this.ballX < this.paddleX + this.paddleWidth) {
                this.ballDY = -this.ballDY;
            } else {
                this.gameOver = true;
                // atualiza recorde se necessário
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('arkanoidHighScore', this.highScore);
                }
            }
        }

        // movimento do paddle conforme teclas
        if (this.rightPressed && this.paddleX < this.width - this.paddleWidth) this.paddleX += 5;
        else if (this.leftPressed && this.paddleX > 0) this.paddleX -= 5;

        // repete ciclo
        requestAnimationFrame(() => this.update());
    }
}

// Inicia o jogo
let game = new Game();
game.update();