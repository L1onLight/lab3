// ── ЧИСЛОВЕ ПОЛЮВАННЯ — game.js ──────────────────────────────────────

const nSlider = document.getElementById('n-slider');
const tSlider = document.getElementById('t-slider');
const nVal = document.getElementById('n-val');
const tVal = document.getElementById('t-val');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const gameArea = document.getElementById('game-area');
const grid = document.getElementById('grid');
const timerDisp = document.getElementById('timer-display');
const nextNum = document.getElementById('next-num');
const overlay = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlay-icon');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const playAgain = document.getElementById('play-again-btn');
const progressBar = document.getElementById('progress-bar');
const progressWrap = document.getElementById('progress-bar-wrap');
const configPanel = document.getElementById('config-panel');

// ── CONFIG SLIDERS ────────────────────────────────────────────────────
nSlider.addEventListener('input', () => {
    // snap to perfect-square-ish grid (we compute cols from N)
    nVal.textContent = nSlider.value;
});

tSlider.addEventListener('input', () => {
    tVal.textContent = tSlider.value;
});

// ── STATE ─────────────────────────────────────────────────────────────
let N, M, current, timerInterval, timeLeft, startTime;

// palette: varied hues, avoid full white/black
const COLORS = [
    '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#a8dadc',
    '#f4a261', '#e9c46a', '#2a9d8f', '#e76f51', '#457b9d',
    '#b5838d', '#6d6875', '#f72585', '#4cc9f0', '#90e0ef',
    '#80b918', '#f3722c', '#43aa8b', '#577590', '#f8961e',
    '#c77dff', '#48cae4', '#fb8500', '#023e8a', '#d62828',
    '#606c38', '#283618', '#dda15e', '#bc6c25', '#8ecae6',
    '#219ebc', '#023047', '#ffb703', '#fb8500', '#e9d8a6',
    '#ee9b00',
];

// font sizes — varied across cells
const SIZES = ['1.4rem', '1.7rem', '2rem', '2.4rem', '2.8rem', '1.1rem', '3rem'];

// ── UTILITIES ─────────────────────────────────────────────────────────
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function gridCols(n) {
    // prefer a roughly-square grid
    const sqrt = Math.round(Math.sqrt(n));
    for (let c = sqrt; c >= 2; c--) {
        if (n % c === 0) return c;
    }
    return sqrt; // non-perfect — some cells will be empty
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : String(s);
}

// ── BUILD GRID ────────────────────────────────────────────────────────
function buildGrid() {
    grid.innerHTML = '';

    const nums = Array.from({ length: N }, (_, i) => i + 1);
    shuffle(nums);

    const cols = gridCols(N);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // pre-pick random color + size per number (shuffle separately so not correlated)
    const colorList = shuffle([...COLORS]).slice(0, N);
    const sizeList = Array.from({ length: N }, () => SIZES[Math.floor(Math.random() * SIZES.length)]);

    nums.forEach((num, idx) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.num = num;

        const span = document.createElement('span');
        span.className = 'cell-num';
        span.textContent = num;
        span.style.color = colorList[idx];
        span.style.fontSize = sizeList[idx];
        span.style.textShadow = `0 0 18px ${colorList[idx]}55`;

        cell.appendChild(span);
        cell.addEventListener('click', () => handleClick(cell, num));
        grid.appendChild(cell);
    });
}

// ── CLICK HANDLER ─────────────────────────────────────────────────────
function handleClick(cell, num) {
    if (cell.classList.contains('found')) return;

    if (num === current) {
        // Correct!
        cell.classList.add('found');
        current++;
        nextNum.textContent = current;

        // progress bar
        const pct = ((current - 1) / N) * 100;
        progressBar.style.width = pct + '%';

        if (current > N) {
            endGame(true);
        }
    } else {
        // Wrong — shake
        cell.classList.remove('wrong-shake');
        void cell.offsetWidth; // reflow trick to restart animation
        cell.classList.add('wrong-shake');
    }
}

// ── TIMER ─────────────────────────────────────────────────────────────
function startTimer() {
    timerDisp.className = '';
    timerDisp.textContent = formatTime(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisp.textContent = formatTime(timeLeft);

        // colour feedback
        const ratio = timeLeft / M;
        timerDisp.className = '';
        if (ratio <= 0.2) timerDisp.classList.add('danger');
        else if (ratio <= 0.4) timerDisp.classList.add('warn');

        if (timeLeft <= 0) endGame(false);
    }, 1000);
}

// ── START ─────────────────────────────────────────────────────────────
function startGame() {
    N = parseInt(nSlider.value);
    M = parseInt(tSlider.value);
    timeLeft = M;
    current = 1;

    // UI
    configPanel.style.display = 'none';
    hud.style.display = 'flex';
    progressWrap.style.display = 'block';
    gameArea.style.display = 'block';
    overlay.classList.remove('show');

    progressBar.style.width = '0%';
    nextNum.textContent = 1;
    timerDisp.textContent = formatTime(M);

    buildGrid();
    startTimer();
    startTime = Date.now();
}

// ── END ───────────────────────────────────────────────────────────────
function endGame(won) {
    clearInterval(timerInterval);

    // freeze grid clicks
    document.querySelectorAll('.cell:not(.found)').forEach(c => {
        c.style.pointerEvents = 'none';
        c.style.opacity = '0.3';
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (won) {
        overlayIcon.textContent = '🏆';
        overlayTitle.className = 'overlay-title win';
        overlayTitle.textContent = 'ПЕРЕМОГА!';
        overlaySub.innerHTML = `Всі <strong>${N}</strong> чисел знайдено за <strong>${elapsed}с</strong>.<br>Залишилось часу: <strong>${timeLeft}с</strong>.`;
    } else {
        overlayIcon.textContent = '💀';
        overlayTitle.className = 'overlay-title lose';
        overlayTitle.textContent = 'ПОРАЗКА';
        overlaySub.innerHTML = `Час вийшов! Знайдено <strong>${current - 1}</strong> з <strong>${N}</strong> чисел.<br>Спробуй ще раз!`;
    }

    setTimeout(() => overlay.classList.add('show'), 300);
}

// ── PLAY AGAIN ────────────────────────────────────────────────────────
playAgain.addEventListener('click', () => {
    overlay.classList.remove('show');
    configPanel.style.display = 'block';
    hud.style.display = 'none';
    progressWrap.style.display = 'none';
    gameArea.style.display = 'none';
});

startBtn.addEventListener('click', startGame);