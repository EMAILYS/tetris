const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over-screen');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

// 顏色對應 1-7
const COLORS = [
    null,
    '#00d8ff', // 1: I
    '#0055ff', // 2: J
    '#ffaa00', // 3: L
    '#ffea00', // 4: O
    '#00cc44', // 5: S
    '#cc00ff', // 6: T
    '#ff0044'  // 7: Z
];

// 方塊形狀定義
const PIECES = [
    [],
    [ // I
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [ // J
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    [ // L
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    [ // O
        [4, 4],
        [4, 4]
    ],
    [ // S
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    [ // T
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    [ // Z
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

let board = [];
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;
let isGameOver = false;
let isPlaying = false;

const player = {
    pos: { x: 0, y: 0 },
    matrix: null
};

const nextPlayer = {
    matrix: null
};

// --- Web Audio API ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    move: () => playTone(300, 'square', 0.1, 0.05),
    rotate: () => playTone(400, 'square', 0.1, 0.05),
    drop: () => playTone(150, 'square', 0.1, 0.1),
    clear: () => {
        playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 100);
    },
    gameover: () => {
        playTone(300, 'sawtooth', 0.3, 0.1);
        setTimeout(() => playTone(250, 'sawtooth', 0.3, 0.1), 300);
        setTimeout(() => playTone(200, 'sawtooth', 0.5, 0.1), 600);
    }
};

// --- 遊戲邏輯 ---
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function drawBlock(ctx, value, x, y) {
    ctx.fillStyle = COLORS[value];
    ctx.fillRect(x, y, 1, 1);
    
    // 增加 Neon 效果
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS[value];
    
    // 內縮畫點邊框讓方塊有立體感
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, 1, 0.1); // 上邊緣高光
    ctx.fillRect(x, y, 0.1, 1); // 左邊緣高光
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y + 0.9, 1, 0.1); // 下邊緣陰影
    ctx.fillRect(x + 0.9, y, 0.1, 1); // 右邊緣陰影
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(context, value, x + offset.x, y + offset.y);
            }
        });
    });
}

function draw() {
    // 畫背景
    ctx.fillStyle = '#2a241f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 畫格線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.05;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ROWS);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(COLS, i);
        ctx.stroke();
    }

    drawMatrix(board, { x: 0, y: 0 }, ctx);
    drawMatrix(player.matrix, player.pos, ctx);
}

function drawNext() {
    nextCtx.fillStyle = '#2a241f';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPlayer.matrix) {
        // 置中
        const offset = {
            x: 2 - nextPlayer.matrix[0].length / 2,
            y: 2 - nextPlayer.matrix.length / 2
        };
        drawMatrix(nextPlayer.matrix, offset, nextCtx);
    }
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        arenaSweep();
        updateScore();
        if (collide(board, player)) {
            // Game Over
            isGameOver = true;
            isPlaying = false;
            sfx.gameover();
            gameOverScreen.classList.remove('hidden');
        }
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(board, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    sfx.drop();
    merge(board, player);
    playerReset();
    arenaSweep();
    updateScore();
    if (collide(board, player)) {
        isGameOver = true;
        isPlaying = false;
        sfx.gameover();
        gameOverScreen.classList.remove('hidden');
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    } else {
        sfx.move();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir); // 旋轉失敗退回
            player.pos.x = pos;
            return;
        }
    }
    sfx.rotate();
}

// dir 1: 順時針, -1: 逆時針
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x]
            ] = [
                matrix[y][x],
                matrix[x][y]
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function getRandomPiece() {
    const pieces = '1234567';
    return PIECES[pieces[pieces.length * Math.random() | 0]];
}

function playerReset() {
    if (!nextPlayer.matrix) {
        nextPlayer.matrix = getRandomPiece();
    }
    player.matrix = nextPlayer.matrix;
    nextPlayer.matrix = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    drawNext();
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        rowCount++;
    }

    if (rowCount > 0) {
        sfx.clear();
        lines += rowCount;
        score += rowCount * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
}

function updateScore() {
    scoreElement.innerText = score;
    linesElement.innerText = lines;
    levelElement.innerText = level;
}

function update(time = 0) {
    if (!isPlaying) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function startGame() {
    board = createMatrix(COLS, ROWS);
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    isGameOver = false;
    isPlaying = true;
    gameOverScreen.classList.add('hidden');
    updateScore();
    nextPlayer.matrix = null;
    playerReset();
    lastTime = performance.now();
    
    // 初始化 AudioContext
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    cancelAnimationFrame(animationId);
    update();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', event => {
    if (!isPlaying || isGameOver) return;
    
    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down
            playerDrop();
            break;
        case 38: // Up
        case 88: // X
            playerRotate(1); // 順時針
            break;
        case 90: // Z
            playerRotate(-1); // 逆時針
            break;
        case 32: // Space
            playerHardDrop();
            break;
    }
});

// 初始畫面繪製
board = createMatrix(COLS, ROWS);
draw();
