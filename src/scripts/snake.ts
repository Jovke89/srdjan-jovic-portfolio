/* Snake game START */
/* Nokia 3310 style snake for /game-room/snake/, drawn smooth on a canvas in
   the site's brand colors: the body is one rounded stroke with a yellow
   gradient, the coin a glowing dot. The board edges wrap around like the
   original, but blocks do not: a few are on the board from the start and a new
   one drops in every BLOCK_EVERY coins; every SPEEDUP_EVERY coins the snake
   gets faster. Arrow keys / WASD to turn, Space to pause. The best score is
   kept per browser in localStorage. */
type Point = { x: number; y: number };

const COLS = 24;
const ROWS = 15;
const START_STEP_MS = 150;
const MIN_STEP_MS = 60;
/* Every SPEEDUP_EVERY coins each step gets SPEEDUP_RATE shorter (15% faster). */
const SPEEDUP_EVERY = 10;
const SPEEDUP_RATE = 0.15;
const BEST_KEY = 'game-room-snake-best';
const BLOCK_EVERY = 3;
const BLINK_STEPS = 8;
/* Starting blocks, kept away from the snake's start on the middle row. */
const START_BLOCKS: Point[][] = [
  [4, 5, 6, 7, 8].map((x) => ({ x, y: 3 })),
  [15, 16, 17, 18, 19].map((x) => ({ x, y: 11 })),
  [2, 3, 4, 5].map((y) => ({ x: 19, y })),
];

type State = 'ready' | 'playing' | 'paused' | 'over';

const DIRS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value: number) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* Storage blocked: the best score just isn't remembered. */
  }
}

function initSnake() {
  const root = document.querySelector<HTMLElement>('[data-snake]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-snake-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;

  const overlay = root.querySelector<HTMLElement>('[data-snake-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-snake-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-snake-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-snake-start]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-snake-score]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-snake-best]')!;

  const brand =
    getComputedStyle(document.documentElement).getPropertyValue('--_srdjan-variables---brand-color').trim() || '#ffc000';

  let snake: Point[] = [];
  let dir: Point = { x: 1, y: 0 };
  const queue: Point[] = [];
  let food: Point = { x: 0, y: 0 };
  let blocks: Point[] = [];
  let newBlock: Point[] = [];
  let blinkSteps = 0;
  let score = 0;
  let best = readBest();
  let stepMs = START_STEP_MS;
  let state: State = 'ready';
  let lastStep = 0;
  let rafId = 0;
  let cell = 0;

  bestEl.textContent = String(best);

  /* The canvas keeps the grid's aspect ratio and renders sharp on Retina. */
  const resize = () => {
    const width = canvas.clientWidth;
    cell = width / COLS;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(cell * ROWS * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  const has = (list: Point[], p: Point) => list.some((s) => s.x === p.x && s.y === p.y);
  const taken = (p: Point) => has(snake, p) || has(blocks, p);

  const placeFood = () => {
    const free: Point[] = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!taken({ x, y })) free.push({ x, y });
    food = free[Math.floor(Math.random() * free.length)];
  };

  /* A new 2 to 4 cell block on free cells, never on the coin, never within 4
     cells of the head and never on the 6 cells straight ahead of it. */
  const dropBlock = () => {
    const head = snake[0];
    const ahead = Array.from({ length: 6 }, (_, i) => ({
      x: (head.x + dir.x * (i + 1) + COLS) % COLS,
      y: (head.y + dir.y * (i + 1) + ROWS) % ROWS,
    }));
    for (let attempt = 0; attempt < 60; attempt++) {
      const length = 2 + Math.floor(Math.random() * 3);
      const vertical = Math.random() < 0.5;
      const start = {
        x: Math.floor(Math.random() * (COLS - (vertical ? 0 : length))),
        y: Math.floor(Math.random() * (ROWS - (vertical ? length : 0))),
      };
      const cells = Array.from({ length }, (_, i) => ({
        x: start.x + (vertical ? 0 : i),
        y: start.y + (vertical ? i : 0),
      }));
      const ok = cells.every(
        (c) =>
          !taken(c) &&
          !(c.x === food.x && c.y === food.y) &&
          !has(ahead, c) &&
          Math.abs(c.x - head.x) + Math.abs(c.y - head.y) > 4,
      );
      if (ok) {
        blocks = blocks.concat(cells);
        newBlock = cells;
        blinkSteps = BLINK_STEPS;
        return;
      }
    }
  };

  const reset = () => {
    const y = Math.floor(ROWS / 2);
    snake = [{ x: 6, y }, { x: 5, y }, { x: 4, y }];
    dir = { x: 1, y: 0 };
    queue.length = 0;
    score = 0;
    stepMs = START_STEP_MS;
    scoreEl.textContent = '0';
    blocks = START_BLOCKS.flat();
    newBlock = [];
    blinkSteps = 0;
    placeFood();
  };

  const center = (p: Point) => ({ x: (p.x + 0.5) * cell, y: (p.y + 0.5) * cell });

  /* The body is one rounded stroke from tail to head; it is split wherever the
     snake wraps through a wall so no line is drawn across the board. */
  const drawSnake = () => {
    const tail = center(snake[snake.length - 1]);
    const head = center(snake[0]);
    const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
    gradient.addColorStop(0, '#7a5600');
    gradient.addColorStop(1, brand);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = cell * 0.62;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    snake.forEach((part, i) => {
      const c = center(part);
      const prev = snake[i - 1];
      const wrapped = prev && (Math.abs(prev.x - part.x) > 1 || Math.abs(prev.y - part.y) > 1);
      if (i === 0 || wrapped) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    if (snake.length === 1) ctx.lineTo(head.x + 0.01, head.y);
    ctx.stroke();

    // Eyes sit on either side of the head, facing the direction of travel.
    const side = { x: -dir.y, y: dir.x };
    ctx.fillStyle = '#131312';
    [1, -1].forEach((s) => {
      ctx.beginPath();
      ctx.arc(
        head.x + dir.x * cell * 0.12 + side.x * s * cell * 0.16,
        head.y + dir.y * cell * 0.12 + side.y * s * cell * 0.16,
        cell * 0.07,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
  };

  function draw() {
    ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
    // Faint grid, like the cover art.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(Math.round(x * cell) + 0.5, 0);
      ctx.lineTo(Math.round(x * cell) + 0.5, ROWS * cell);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, Math.round(y * cell) + 0.5);
      ctx.lineTo(COLS * cell, Math.round(y * cell) + 0.5);
    }
    ctx.stroke();

    const f = center(food);
    ctx.save();
    ctx.shadowColor = brand;
    ctx.shadowBlur = cell * 0.8;
    ctx.fillStyle = brand;
    ctx.beginPath();
    ctx.arc(f.x, f.y, cell * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawBlocks();
    drawSnake();
  }

  /* Blocks are rounded light tiles, clearly apart from the yellow snake. A new
     block blinks for a few steps so it is noticed when it drops in. */
  function drawBlocks() {
    const pad = cell * 0.1;
    const radius = cell * 0.18;
    blocks.forEach((b) => {
      const blinking = blinkSteps > 0 && has(newBlock, b) && blinkSteps % 2 === 0;
      ctx.globalAlpha = blinking ? 0.25 : 1;
      ctx.beginPath();
      ctx.roundRect(b.x * cell + pad, b.y * cell + pad, cell - pad * 2, cell - pad * 2, radius);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  /* The button keeps its visible "Play" label (the stager hover splits it into
     letters), so only its accessible name changes with the state. */
  const showOverlay = (title: string, text: string, button: string) => {
    titleEl.textContent = title;
    textEl.textContent = text;
    startBtn.setAttribute('aria-label', button);
    overlay.hidden = false;
    startBtn.focus({ preventScroll: true });
  };

  const step = () => {
    const next = queue.shift();
    if (next) dir = next;
    const head = {
      x: (snake[0].x + dir.x + COLS) % COLS,
      y: (snake[0].y + dir.y + ROWS) % ROWS,
    };
    const eats = head.x === food.x && head.y === food.y;
    // The tail moves away this step unless the snake grows, so it is not a collision.
    const body = eats ? snake : snake.slice(0, -1);
    if (has(body, head) || has(blocks, head)) return gameOver();
    if (blinkSteps > 0) blinkSteps -= 1;
    snake.unshift(head);
    if (eats) {
      score += 1;
      scoreEl.textContent = String(score);
      if (score % SPEEDUP_EVERY === 0) stepMs = Math.max(MIN_STEP_MS, stepMs * (1 - SPEEDUP_RATE));
      if (snake.length + blocks.length === COLS * ROWS) return gameOver();
      placeFood();
      if (score % BLOCK_EVERY === 0) dropBlock();
    } else {
      snake.pop();
    }
  };

  const loop = (time: number) => {
    if (state !== 'playing') return;
    if (time - lastStep >= stepMs) {
      lastStep = time;
      step();
      draw();
    }
    rafId = requestAnimationFrame(loop);
  };

  const play = () => {
    if (state === 'playing') return;
    if (state === 'over' || state === 'ready') reset();
    state = 'playing';
    overlay.hidden = true;
    canvas.focus({ preventScroll: true });
    // Bring the whole board into view, centered below the sticky nav; arrow
    // keys can't scroll the page mid-game.
    const rect = root.getBoundingClientRect();
    const navHeight = document.querySelector('.sticky_nav-component')?.getBoundingClientRect().height ?? 0;
    const targetTop = navHeight + Math.max(0, (window.innerHeight - navHeight - rect.height) / 2);
    if (Math.abs(rect.top - targetTop) > 4) {
      const y = window.scrollY + rect.top - targetTop;
      const lenis = (window as unknown as { lenis?: { scrollTo: (t: number, o: object) => void } }).lenis;
      if (lenis) lenis.scrollTo(y, { duration: 0.6 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    }
    lastStep = performance.now();
    draw();
    rafId = requestAnimationFrame(loop);
  };

  const pause = () => {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(rafId);
    showOverlay('Paused', 'Press space or the button to continue.', 'Continue');
  };

  function gameOver() {
    state = 'over';
    cancelAnimationFrame(rafId);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      saveBest(best);
    }
    draw();
    showOverlay('Game over', `You scored ${score}. Best: ${best}.`, 'Play again');
  }

  /* A new direction can't reverse the snake into itself; up to two turns are
     queued so quick key combos between steps are not lost. */
  const turn = (d: Point) => {
    const last = queue[queue.length - 1] ?? dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 2) queue.push(d);
  };

  startBtn.addEventListener('click', play);

  window.addEventListener('keydown', (e) => {
    const d = DIRS[e.code];
    if (d && state === 'playing') {
      e.preventDefault();
      turn(d);
    } else if (e.code === 'Space' && state === 'playing') {
      e.preventDefault();
      pause();
    } else if (e.code === 'Space' && state === 'paused' && document.activeElement !== startBtn) {
      e.preventDefault();
      play();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  canvas.tabIndex = -1;
  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initSnake();
/* Snake game END */
