/* Tetris game START */
/* Classic falling blocks game for /game-room/tetris/, drawn smooth on a canvas
   in the site's colors. 10x20 well in the middle, the held piece on the left,
   the next 3 pieces on the right. Pieces come from a shuffled bag of all 7, so
   no long droughts. Ghost piece, hold, lock delay and simple wall kicks. Every
   10 lines the level goes up and pieces fall faster. Arrow keys / WASD to move,
   Up / W / X to rotate, Z to rotate back, Space to hard drop, C or Shift to
   hold, P or Escape to pause. Best score is kept per browser in localStorage. */
type Kind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Matrix = number[][];
type Piece = { kind: Kind; shape: Matrix; x: number; y: number };
type State = 'ready' | 'playing' | 'paused' | 'over';

const W = 960;
const H = 600;
const COLS = 10;
const ROWS = 20;
const CELL = 27;
const BOARD_X = (W - COLS * CELL) / 2;
const BOARD_Y = (H - ROWS * CELL) / 2;
const PANEL_W = 150;
const PANEL_GAP = 40;
const BEST_KEY = 'game-room-tetris-best';
const LINES_PER_LEVEL = 10;
const LOCK_DELAY = 0.5;
const MAX_LOCK_RESETS = 15;
const DAS = 0.17;
const ARR = 0.05;
const SOFT_DROP = 0.035;
const CLEAR_TIME = 0.3;
const LINE_SCORES = [0, 100, 300, 500, 800];
const LINE_NAMES = ['', 'single', 'double', 'triple', 'tetris!'];
const FONT = 'Splinesansmono, monospace';

const SHAPES: Record<Kind, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};
const KINDS = Object.keys(SHAPES) as Kind[];
/* Wall kicks tried in order when a rotation collides: in place, sideways,
   one up, then two sideways for the long I piece. */
const KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-2, 0],
  [2, 0],
];

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

/* Darker version of a #rrggbb color for the bottom of each tile. */
const shade = (hex: string) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (v: number, base: number) => Math.round(v * 0.62 + base * 0.38);
  return `rgb(${mix(n >> 16, 0x13)}, ${mix((n >> 8) & 255, 0x13)}, ${mix(n & 255, 0x12)})`;
};

const rotate = (m: Matrix, dir: 1 | -1): Matrix =>
  m.map((row, r) => row.map((_, c) => (dir === 1 ? m[m.length - 1 - c][r] : m[c][m.length - 1 - r])));

function initTetris() {
  const root = document.querySelector<HTMLElement>('[data-tetris]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;

  const overlay = root.querySelector<HTMLElement>('[data-game-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-game-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-game-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-game-score]')!;
  const linesEl = root.querySelector<HTMLElement>('[data-game-lines]')!;
  const levelEl = root.querySelector<HTMLElement>('[data-game-level]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-game-best]')!;

  const brand =
    getComputedStyle(document.documentElement).getPropertyValue('--_srdjan-variables---brand-color').trim() || '#ffc000';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const COLORS: Record<Kind, string> = {
    I: '#22d3ee',
    O: brand,
    T: '#a78bfa',
    S: '#4ade80',
    Z: '#ff5722',
    J: '#3b82f6',
    L: '#fb923c',
  };

  let grid: (Kind | null)[][] = [];
  let piece: Piece | null = null;
  let queue: Kind[] = [];
  let hold: Kind | null = null;
  let holdUsed = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let best = readBest();
  let state: State = 'ready';
  let gravityTimer = 0;
  let lockTimer = 0;
  let lockResets = 0;
  let clearing: number[] = [];
  let clearTimer = 0;
  let label = { text: '', time: 0 };
  let lastTime = 0;
  let rafId = 0;
  /* Horizontal auto repeat: the most recent held direction wins. */
  const heldDirs: number[] = [];
  let dasTimer = 0;
  let softDrop = false;

  bestEl.textContent = String(best);

  const resize = () => {
    const width = canvas.clientWidth;
    const scale = width / W;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    draw();
  };

  const updateHud = () => {
    scoreEl.textContent = String(score);
    linesEl.textContent = String(lines);
    levelEl.textContent = String(level);
  };

  /* Seconds per row, the classic guideline curve. */
  const gravity = () => Math.max(0.03, Math.pow(0.8 - (level - 1) * 0.007, level - 1));

  const refillQueue = () => {
    while (queue.length < 7) {
      const bag = [...KINDS];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      queue.push(...bag);
    }
  };

  const collides = (shape: Matrix, x: number, y: number) =>
    shape.some((row, r) =>
      row.some((filled, c) => {
        if (!filled) return false;
        const gx = x + c;
        const gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        return gy >= 0 && grid[gy][gx] !== null;
      }),
    );

  const makePiece = (kind: Kind): Piece => {
    const shape = SHAPES[kind];
    return { kind, shape, x: Math.floor((COLS - shape.length) / 2), y: kind === 'I' ? -1 : 0 };
  };

  const spawn = (kind?: Kind) => {
    refillQueue();
    piece = makePiece(kind ?? queue.shift()!);
    gravityTimer = 0;
    lockTimer = 0;
    lockResets = 0;
    if (collides(piece.shape, piece.x, piece.y)) gameOver();
  };

  const reset = () => {
    grid = Array.from({ length: ROWS }, () => Array<Kind | null>(COLS).fill(null));
    queue = [];
    hold = null;
    holdUsed = false;
    score = 0;
    lines = 0;
    level = 1;
    clearing = [];
    label = { text: '', time: 0 };
    updateHud();
    spawn();
  };

  const onGround = () => !!piece && collides(piece.shape, piece.x, piece.y + 1);

  /* Moving or rotating on the ground restarts the lock delay, a limited number
     of times so a piece can't be spun forever. */
  const touched = () => {
    if (onGround() && lockResets < MAX_LOCK_RESETS) {
      lockTimer = 0;
      lockResets += 1;
    }
  };

  const move = (dx: number) => {
    if (!piece || collides(piece.shape, piece.x + dx, piece.y)) return false;
    piece.x += dx;
    touched();
    return true;
  };

  const turn = (dir: 1 | -1) => {
    if (!piece || piece.kind === 'O') return;
    const shape = rotate(piece.shape, dir);
    for (const [kx, ky] of KICKS) {
      if (!collides(shape, piece.x + kx, piece.y + ky)) {
        piece.shape = shape;
        piece.x += kx;
        piece.y += ky;
        touched();
        return;
      }
    }
  };

  const ghostY = () => {
    if (!piece) return 0;
    let y = piece.y;
    while (!collides(piece.shape, piece.x, y + 1)) y += 1;
    return y;
  };

  const lock = () => {
    if (!piece) return;
    let above = false;
    piece.shape.forEach((row, r) =>
      row.forEach((filled, c) => {
        if (!filled) return;
        const gy = piece!.y + r;
        if (gy < 0) above = true;
        else grid[gy][piece!.x + c] = piece!.kind;
      }),
    );
    piece = null;
    holdUsed = false;
    if (above) return gameOver();
    clearing = grid.flatMap((row, r) => (row.every(Boolean) ? [r] : []));
    if (clearing.length) {
      const n = clearing.length;
      score += LINE_SCORES[n] * level;
      label = { text: LINE_NAMES[n], time: 1.2 };
      clearTimer = CLEAR_TIME;
      updateHud();
    } else {
      spawn();
    }
  };

  const finishClear = () => {
    grid = grid.filter((_, r) => !clearing.includes(r));
    while (grid.length < ROWS) grid.unshift(Array<Kind | null>(COLS).fill(null));
    lines += clearing.length;
    level = 1 + Math.floor(lines / LINES_PER_LEVEL);
    clearing = [];
    updateHud();
    spawn();
  };

  const hardDrop = () => {
    if (!piece) return;
    const y = ghostY();
    score += (y - piece.y) * 2;
    piece.y = y;
    updateHud();
    lock();
  };

  const holdPiece = () => {
    if (!piece || holdUsed) return;
    const current = piece.kind;
    if (hold) spawn(hold);
    else spawn();
    hold = current;
    holdUsed = true;
  };

  const update = (dt: number) => {
    if (label.time > 0) label.time -= dt;
    if (clearing.length) {
      clearTimer -= dt;
      if (clearTimer <= 0) finishClear();
      return;
    }
    if (!piece) return;

    const dir = heldDirs[heldDirs.length - 1];
    if (dir) {
      dasTimer -= dt;
      while (dasTimer <= 0) {
        if (!move(dir)) {
          dasTimer = 0;
          break;
        }
        dasTimer += ARR;
      }
    }

    if (onGround()) {
      lockTimer += dt;
      if (lockTimer >= LOCK_DELAY) lock();
      return;
    }
    gravityTimer += dt;
    const step = softDrop ? Math.min(SOFT_DROP, gravity()) : gravity();
    while (gravityTimer >= step && piece && !onGround()) {
      gravityTimer -= step;
      piece.y += 1;
      if (softDrop) score += 1;
    }
    if (softDrop) updateHud();
  };

  /* One cell: a rounded tile with a soft top light, like the other games. */
  const drawCell = (x: number, y: number, size: number, color: string, alpha = 1) => {
    const pad = size * 0.06;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.18);
    const gradient = ctx.createLinearGradient(0, y, 0, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, shade(color));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawGhostCell = (x: number, y: number, color: string) => {
    const pad = CELL * 0.1;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, CELL * 0.16);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawShape = (shape: Matrix, px: number, py: number, color: string) =>
    shape.forEach((row, r) =>
      row.forEach((filled, c) => {
        if (filled && py + r >= 0) drawCell(BOARD_X + (px + c) * CELL, BOARD_Y + (py + r) * CELL, CELL, color);
      }),
    );

  /* A side panel with a title and a piece centered in each slot. */
  const drawPanel = (x: number, title: string, kinds: (Kind | null)[], dim = false) => {
    const slot = 92;
    const height = 44 + slot * Math.max(1, kinds.length);
    ctx.beginPath();
    ctx.roundRect(x, BOARD_Y, PANEL_W, height, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), x + PANEL_W / 2, BOARD_Y + 24);
    kinds.forEach((kind, i) => {
      if (!kind) return;
      const shape = SHAPES[kind];
      const size = 22;
      const filled = shape.flatMap((row, r) => row.flatMap((v, c) => (v ? [{ r, c }] : [])));
      const minC = Math.min(...filled.map((f) => f.c));
      const maxC = Math.max(...filled.map((f) => f.c));
      const minR = Math.min(...filled.map((f) => f.r));
      const maxR = Math.max(...filled.map((f) => f.r));
      const ox = x + PANEL_W / 2 - ((maxC - minC + 1) * size) / 2;
      const oy = BOARD_Y + 44 + slot * i + slot / 2 - ((maxR - minR + 1) * size) / 2;
      filled.forEach((f) =>
        drawCell(ox + (f.c - minC) * size, oy + (f.r - minR) * size, size, COLORS[kind], dim ? 0.35 : 1),
      );
    });
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);

    // The well: dark glass with a faint grid.
    ctx.beginPath();
    ctx.roundRect(BOARD_X - 6, BOARD_Y - 6, COLS * CELL + 12, ROWS * CELL + 12, 8);
    ctx.fillStyle = 'rgba(6, 5, 1, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(BOARD_X + c * CELL + 0.5, BOARD_Y);
      ctx.lineTo(BOARD_X + c * CELL + 0.5, BOARD_Y + ROWS * CELL);
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.moveTo(BOARD_X, BOARD_Y + r * CELL + 0.5);
      ctx.lineTo(BOARD_X + COLS * CELL, BOARD_Y + r * CELL + 0.5);
    }
    ctx.stroke();

    // Settled blocks; full rows flash white before they collapse.
    const flash = clearing.length && !reducedMotion.matches && Math.floor(clearTimer / 0.06) % 2 === 0;
    grid.forEach((row, r) =>
      row.forEach((kind, c) => {
        if (!kind) return;
        const color = clearing.includes(r) && flash ? '#ffffff' : COLORS[kind];
        drawCell(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, color);
      }),
    );

    if (piece) {
      const gy = ghostY();
      if (gy !== piece.y)
        piece.shape.forEach((row, r) =>
          row.forEach((filled, c) => {
            if (filled && gy + r >= 0)
              drawGhostCell(BOARD_X + (piece!.x + c) * CELL, BOARD_Y + (gy + r) * CELL, COLORS[piece!.kind]);
          }),
        );
      drawShape(piece.shape, piece.x, piece.y, COLORS[piece.kind]);
    }

    drawPanel(BOARD_X - PANEL_GAP - PANEL_W, 'hold', [hold], holdUsed);
    drawPanel(BOARD_X + COLS * CELL + PANEL_GAP, 'next', queue.slice(0, 3));

    // "Double", "Tetris!" and so on rise and fade over the well.
    if (label.time > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, label.time / 0.4);
      ctx.fillStyle = brand;
      ctx.shadowColor = brand;
      ctx.shadowBlur = 16;
      ctx.font = `700 28px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const rise = reducedMotion.matches ? 0 : (1.2 - label.time) * 30;
      ctx.fillText(label.text.toUpperCase(), W / 2, H / 2 - rise);
      ctx.restore();
    }
  };

  const loop = (time: number) => {
    if (state !== 'playing') return;
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    update(dt);
    if (state !== 'playing') return;
    draw();
    rafId = requestAnimationFrame(loop);
  };

  /* The button keeps its visible "Play" label (the stager hover splits it into
     letters), so only its accessible name changes with the state. */
  const showOverlay = (title: string, text: string, button: string) => {
    titleEl.textContent = title;
    textEl.textContent = text;
    startBtn.setAttribute('aria-label', button);
    overlay.hidden = false;
    startBtn.focus({ preventScroll: true });
  };

  const centerBoard = () => {
    const rect = root.getBoundingClientRect();
    const navHeight = document.querySelector('.sticky_nav-component')?.getBoundingClientRect().height ?? 0;
    const targetTop = navHeight + Math.max(0, (window.innerHeight - navHeight - rect.height) / 2);
    if (Math.abs(rect.top - targetTop) <= 4) return;
    const y = window.scrollY + rect.top - targetTop;
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: number, o: object) => void } }).lenis;
    if (lenis) lenis.scrollTo(y, { duration: 0.6 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const play = () => {
    if (state === 'playing') return;
    if (state === 'over' || state === 'ready') reset();
    state = 'playing';
    overlay.hidden = true;
    heldDirs.length = 0;
    softDrop = false;
    canvas.focus({ preventScroll: true });
    centerBoard();
    lastTime = performance.now();
    draw();
    rafId = requestAnimationFrame(loop);
  };

  const pause = () => {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(rafId);
    showOverlay('Paused', 'Press P or the button to continue.', 'Continue');
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
    showOverlay('Game over', `You scored ${score} with ${lines} lines on level ${level}. Best: ${best}.`, 'Play again');
  }

  const HORIZONTAL: Record<string, number> = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };

  startBtn.addEventListener('click', play);

  window.addEventListener('keydown', (e) => {
    if (state === 'paused' && e.code === 'KeyP') {
      e.preventDefault();
      play();
      return;
    }
    if (state !== 'playing') return;
    const dx = HORIZONTAL[e.code];
    if (dx) {
      e.preventDefault();
      if (e.repeat) return;
      heldDirs.push(dx);
      move(dx);
      dasTimer = DAS;
      return;
    }
    // Rotation, drops and hold are blocked while full rows are clearing.
    const busy = clearing.length > 0;
    switch (e.code) {
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        softDrop = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyX':
        e.preventDefault();
        if (!e.repeat && !busy) turn(1);
        break;
      case 'KeyZ':
        e.preventDefault();
        if (!e.repeat && !busy) turn(-1);
        break;
      case 'Space':
        e.preventDefault();
        if (!e.repeat && !busy) hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        e.preventDefault();
        if (!busy) holdPiece();
        break;
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        pause();
        break;
    }
  });
  window.addEventListener('keyup', (e) => {
    const dx = HORIZONTAL[e.code];
    if (dx) {
      const index = heldDirs.lastIndexOf(dx);
      if (index !== -1) heldDirs.splice(index, 1);
      dasTimer = DAS;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') softDrop = false;
  });
  window.addEventListener('blur', () => {
    heldDirs.length = 0;
    softDrop = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  canvas.tabIndex = -1;
  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initTetris();
/* Tetris game END */
