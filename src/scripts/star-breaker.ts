/* Star Breaker game START */
/* Breakout style game for /game-room/star-breaker/, drawn smooth on a canvas
   in the site's colors. The mouse moves the paddle (arrow keys / A D work
   too), the ball breaks the bricks, and broken bricks sometimes drop a power-up
   capsule (wide paddle, multi ball, slow ball, extra life). Rockets also fall
   from the top after a short "!" warning and must be dodged. Clearing all
   bricks starts the next level with a faster ball, more tough bricks and more
   rockets. Click or Space to launch, P or Escape to pause. Best score is kept
   per browser in localStorage. */
const W = 960;
const H = 600;
const BEST_KEY = 'game-room-star-breaker-best';
const COLS = 10;
const ROWS = 5;
const BRICK_W = 80;
const BRICK_H = 26;
const BRICK_GAP = 8;
const BRICK_TOP = 70;
const PADDLE_Y = H - 40;
const PADDLE_W = 120;
const PADDLE_H = 14;
const BALL_R = 8;
const BASE_SPEED = 380;
const LIVES = 3;
const DROP_CHANCE = 0.16;
const DROP_SPEED = 160;
const WIDE_SECONDS = 12;
const SLOW_SECONDS = 10;
const ROCKET_SPEED = 230;
const WARN_SECONDS = 0.7;
/* Brick colors per row, from the site's background glows and brand yellow. */
const ROW_COLORS = ['#ff5722', '#e5514b', '#9640c4', '#4853ec', '#ffc000'];
const POWERS = [
  { kind: 'wide', weight: 3, label: 'W', name: 'Wide paddle' },
  { kind: 'multi', weight: 3, label: 'M', name: 'Multi ball' },
  { kind: 'slow', weight: 2, label: 'S', name: 'Slow ball' },
  { kind: 'life', weight: 1, label: '+1', name: 'Extra life' },
] as const;

type State = 'ready' | 'playing' | 'paused' | 'over';
type PowerKind = (typeof POWERS)[number]['kind'];
interface Brick { x: number; y: number; hits: number; color: string }
interface Ball { x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[] }
interface Drop { x: number; y: number; kind: PowerKind; label: string; name: string; age: number }
interface Rocket { x: number; y: number; warn: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; life: number; color: string }

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

function initStarBreaker() {
  const root = document.querySelector<HTMLElement>('[data-breaker]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;

  const overlay = root.querySelector<HTMLElement>('[data-game-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-game-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-game-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-game-score]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-game-best]')!;
  const levelEl = root.querySelector<HTMLElement>('[data-game-level]')!;
  const livesEl = root.querySelector<HTMLElement>('[data-game-lives]')!;

  const brand =
    getComputedStyle(document.documentElement).getPropertyValue('--_srdjan-variables---brand-color').trim() || '#ffc000';

  let state: State = 'ready';
  let score = 0;
  let best = readBest();
  let level = 1;
  let lives = LIVES;
  let paddleX = W / 2;
  let bricks: Brick[] = [];
  let balls: Ball[] = [];
  let attached = true;
  let drops: Drop[] = [];
  let rockets: Rocket[] = [];
  let sparks: Spark[] = [];
  let floaters: Floater[] = [];
  let wideLeft = 0;
  let slowLeft = 0;
  let rocketTimer = 0;
  let hurt = 0;
  let lastTime = 0;
  let rafId = 0;
  let scale = 1;
  const keys = new Set<string>();

  bestEl.textContent = String(best);

  /* Logic runs in a fixed 960x600 space scaled to the canvas width. */
  const resize = () => {
    const width = canvas.clientWidth;
    scale = width / W;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    draw();
  };

  const updateHud = () => {
    scoreEl.textContent = String(score);
    levelEl.textContent = String(level);
    livesEl.textContent = String(lives);
  };

  const paddleWidth = () => (wideLeft > 0 ? PADDLE_W * 1.6 : PADDLE_W);
  const ballSpeed = () => (BASE_SPEED + (level - 1) * 40) * (slowLeft > 0 ? 0.7 : 1);

  /* Tough bricks (two hits) get more common with every level. */
  const buildLevel = () => {
    bricks = [];
    const left = (W - (COLS * BRICK_W + (COLS - 1) * BRICK_GAP)) / 2;
    const toughChance = Math.min(0.5, (level - 1) * 0.15);
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        bricks.push({
          x: left + col * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
          hits: Math.random() < toughChance ? 2 : 1,
          color: ROW_COLORS[row],
        });
  };

  const resetBall = () => {
    balls = [{ x: paddleX, y: PADDLE_Y - BALL_R - 2, vx: 0, vy: 0, trail: [] }];
    attached = true;
  };

  const reset = () => {
    score = 0;
    level = 1;
    lives = LIVES;
    wideLeft = 0;
    slowLeft = 0;
    drops = [];
    rockets = [];
    sparks = [];
    floaters = [];
    rocketTimer = 3;
    hurt = 0;
    buildLevel();
    resetBall();
    updateHud();
  };

  const launch = () => {
    if (!attached || state !== 'playing') return;
    attached = false;
    const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6;
    balls[0].vx = Math.cos(angle) * ballSpeed();
    balls[0].vy = Math.sin(angle) * ballSpeed();
  };

  const burst = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.4, color });
    }
  };

  const float = (text: string, x: number, y: number, color = brand) => floaters.push({ text, x, y, life: 1.4, color });

  const loseLife = (reason: 'ball' | 'rocket') => {
    lives -= 1;
    hurt = 1;
    updateHud();
    burst(paddleX, PADDLE_Y, reason === 'rocket' ? '#ff5722' : brand, 26);
    if (lives <= 0) return gameOver();
    if (reason === 'ball') resetBall();
  };

  const collect = (d: Drop) => {
    float(`+ ${d.name.toUpperCase()}`, paddleX, PADDLE_Y - 30);
    if (d.kind === 'wide') wideLeft = WIDE_SECONDS;
    else if (d.kind === 'slow') {
      slowLeft = SLOW_SECONDS;
      // Rescale every ball's speed right away.
      balls.forEach((b) => {
        const speed = Math.hypot(b.vx, b.vy) || 1;
        b.vx = (b.vx / speed) * ballSpeed();
        b.vy = (b.vy / speed) * ballSpeed();
      });
    } else if (d.kind === 'life') {
      lives += 1;
      updateHud();
    } else if (d.kind === 'multi' && !attached) {
      const source = balls[0];
      const speed = ballSpeed();
      [-0.5, 0.5].forEach((turn) => {
        const angle = Math.atan2(source.vy, source.vx) + turn;
        balls.push({ x: source.x, y: source.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, trail: [] });
      });
    }
  };

  const breakBrick = (brick: Brick) => {
    brick.hits -= 1;
    if (brick.hits > 0) {
      burst(brick.x + BRICK_W / 2, brick.y + BRICK_H / 2, '#ffffff', 6);
      score += 5;
      updateHud();
      return;
    }
    bricks = bricks.filter((b) => b !== brick);
    score += 10 * level;
    updateHud();
    burst(brick.x + BRICK_W / 2, brick.y + BRICK_H / 2, brick.color, 14);
    if (Math.random() < DROP_CHANCE) {
      const total = POWERS.reduce((sum, p) => sum + p.weight, 0);
      let pick = Math.random() * total;
      const power = POWERS.find((p) => (pick -= p.weight) < 0) ?? POWERS[0];
      drops.push({ x: brick.x + BRICK_W / 2, y: brick.y + BRICK_H / 2, kind: power.kind, label: power.label, name: power.name, age: 0 });
    }
  };

  /* Ball vs brick: reflect on the axis of least overlap. */
  const hitBricks = (b: Ball) => {
    for (const brick of bricks) {
      const nx = Math.max(brick.x, Math.min(b.x, brick.x + BRICK_W));
      const ny = Math.max(brick.y, Math.min(b.y, brick.y + BRICK_H));
      if ((b.x - nx) ** 2 + (b.y - ny) ** 2 > BALL_R ** 2) continue;
      const overlapX = Math.min(b.x + BALL_R - brick.x, brick.x + BRICK_W - (b.x - BALL_R));
      const overlapY = Math.min(b.y + BALL_R - brick.y, brick.y + BRICK_H - (b.y - BALL_R));
      if (overlapX < overlapY) b.vx *= -1;
      else b.vy *= -1;
      breakBrick(brick);
      return;
    }
  };

  const update = (dt: number) => {
    // Paddle from keys (the mouse sets it directly in the pointer handler)
    const move = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    paddleX += move * 600 * dt;
    const half = paddleWidth() / 2;
    paddleX = Math.min(W - half - 6, Math.max(half + 6, paddleX));
    wideLeft -= dt;
    slowLeft -= dt;
    hurt -= dt;

    // Balls
    if (attached) {
      balls[0].x = paddleX;
      balls[0].y = PADDLE_Y - BALL_R - 2;
    }
    balls.forEach((b) => {
      if (attached) return;
      b.trail.unshift({ x: b.x, y: b.y });
      b.trail.length = Math.min(b.trail.length, 10);
      // Sub-steps keep the fast ball from tunnelling through bricks.
      const steps = Math.ceil((Math.hypot(b.vx, b.vy) * dt) / (BALL_R * 0.8));
      for (let i = 0; i < steps; i++) {
        b.x += (b.vx * dt) / steps;
        b.y += (b.vy * dt) / steps;
        if (b.x < BALL_R) (b.x = BALL_R), (b.vx = Math.abs(b.vx));
        if (b.x > W - BALL_R) (b.x = W - BALL_R), (b.vx = -Math.abs(b.vx));
        if (b.y < BALL_R) (b.y = BALL_R), (b.vy = Math.abs(b.vy));
        // Paddle: the hit position sets the bounce angle, edges send it wide.
        if (b.vy > 0 && b.y + BALL_R >= PADDLE_Y - PADDLE_H / 2 && b.y < PADDLE_Y + PADDLE_H / 2 && Math.abs(b.x - paddleX) <= half + BALL_R) {
          const offset = Math.max(-1, Math.min(1, (b.x - paddleX) / half));
          const angle = -Math.PI / 2 + offset * 1.05;
          const speed = ballSpeed();
          b.vx = Math.cos(angle) * speed;
          b.vy = Math.sin(angle) * speed;
          b.y = PADDLE_Y - PADDLE_H / 2 - BALL_R;
        }
        hitBricks(b);
      }
    });
    const before = balls.length;
    balls = balls.filter((b) => b.y < H + 20);
    if (!attached && before && !balls.length) {
      loseLife('ball');
      if (state !== 'playing') return;
    }

    // Power-ups
    drops.forEach((d) => {
      d.y += DROP_SPEED * dt;
      d.age += dt;
    });
    drops = drops.filter((d) => {
      if (Math.abs(d.x - paddleX) < half + 14 && Math.abs(d.y - PADDLE_Y) < 18) {
        collect(d);
        return false;
      }
      return d.y < H + 20;
    });

    // Rockets: a "!" warning at the top, then a fall to dodge
    rocketTimer -= dt;
    if (rocketTimer <= 0 && !attached) {
      rockets.push({ x: 40 + Math.random() * (W - 80), y: -30, warn: WARN_SECONDS });
      rocketTimer = Math.max(1.2, 5 - level * 0.6) * (0.6 + Math.random() * 0.8);
    }
    rockets.forEach((r) => {
      if (r.warn > 0) r.warn -= dt;
      else r.y += (ROCKET_SPEED + level * 25) * dt;
    });
    rockets = rockets.filter((r) => {
      if (r.warn <= 0 && hurt <= 0 && Math.abs(r.x - paddleX) < half + 6 && r.y + 18 > PADDLE_Y - PADDLE_H / 2 && r.y < PADDLE_Y + PADDLE_H) {
        float('HIT', paddleX, PADDLE_Y - 30, '#ff5722');
        loseLife('rocket');
        return false;
      }
      return r.y < H + 40;
    });
    if (state !== 'playing') return;

    // Effects
    sparks.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    sparks = sparks.filter((p) => p.life > 0);
    floaters.forEach((f) => {
      f.y -= 40 * dt;
      f.life -= dt;
    });
    floaters = floaters.filter((f) => f.life > 0);

    // Level cleared
    if (!bricks.length) {
      level += 1;
      updateHud();
      float(`LEVEL ${level}`, W / 2, H / 2, '#ffffff');
      rockets = [];
      drops = [];
      buildLevel();
      resetBall();
    }
  };

  const drawCapsule = (x: number, y: number, label: string) => {
    ctx.save();
    ctx.shadowColor = brand;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#131312';
    ctx.strokeStyle = brand;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 12, 36, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = brand;
    ctx.fillText(label, x, y + 1);
  };

  const drawRocket = (r: Rocket) => {
    if (r.warn > 0) {
      // Blinking warning where the rocket will drop
      if (Math.floor(r.warn * 10) % 2 === 0) {
        ctx.fillStyle = '#ff5722';
        ctx.font = '700 22px Splinesansmono, monospace';
        ctx.fillText('!', r.x, 22);
      }
      return;
    }
    ctx.save();
    ctx.translate(r.x, r.y);
    const flame = ctx.createLinearGradient(0, -34, 0, -12);
    flame.addColorStop(0, 'rgba(255, 87, 34, 0)');
    flame.addColorStop(1, 'rgba(255, 87, 34, 0.95)');
    ctx.fillStyle = flame;
    ctx.fillRect(-4, -34, 8, 22);
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(8, 6);
    ctx.lineTo(8, -12);
    ctx.lineTo(-8, -12);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(-13, -16);
    ctx.lineTo(-8, -4);
    ctx.moveTo(8, -12);
    ctx.lineTo(13, -16);
    ctx.lineTo(8, -4);
    ctx.fill();
    ctx.restore();
  };

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Bricks: rounded tiles with a soft top highlight; tough ones get a ring
    bricks.forEach((b) => {
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK_H);
      g.addColorStop(0, b.color);
      g.addColorStop(1, `${b.color}aa`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BRICK_W, BRICK_H, 7);
      ctx.fill();
      if (b.hits > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Paddle
    const half = paddleWidth() / 2;
    if (!(hurt > 0 && Math.floor(hurt * 10) % 2 === 0)) {
      const pg = ctx.createLinearGradient(paddleX - half, 0, paddleX + half, 0);
      pg.addColorStop(0, '#c98f00');
      pg.addColorStop(0.5, '#ffd54d');
      pg.addColorStop(1, '#c98f00');
      ctx.save();
      ctx.shadowColor = brand;
      ctx.shadowBlur = 16;
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(paddleX - half, PADDLE_Y - PADDLE_H / 2, half * 2, PADDLE_H, PADDLE_H / 2);
      ctx.fill();
      ctx.restore();
    }

    // Balls with a comet trail
    balls.forEach((b) => {
      b.trail.forEach((t, i) => {
        ctx.globalAlpha = (1 - i / b.trail.length) * 0.35;
        ctx.fillStyle = brand;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_R * (1 - i / 14), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 14px Splinesansmono, monospace';
    drops.forEach((d) => drawCapsule(d.x, d.y, d.label));
    ctx.font = '12px Splinesansmono, monospace';
    drops.forEach((d) => {
      if (d.age > 1.5) return;
      ctx.globalAlpha = Math.min(1, (1.5 - d.age) * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(d.name.toUpperCase(), d.x, d.y - 24);
    });
    ctx.globalAlpha = 1;

    rockets.forEach(drawRocket);

    sparks.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.font = '600 16px Splinesansmono, monospace';
    floaters.forEach((f) => {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // Active power-ups, top left; launch hint while the ball waits
    ctx.textAlign = 'left';
    ctx.font = '14px Splinesansmono, monospace';
    ctx.fillStyle = brand;
    [wideLeft > 0 && `WIDE ${Math.ceil(wideLeft)}S`, slowLeft > 0 && `SLOW ${Math.ceil(slowLeft)}S`]
      .filter(Boolean)
      .forEach((line, i) => ctx.fillText(line as string, 18, 22 + i * 22));
    if (attached && state === 'playing') {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('CLICK OR SPACE TO LAUNCH', W / 2, PADDLE_Y - 60);
    }
  }

  const loop = (time: number) => {
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    if (state === 'playing') update(dt);
    draw();
    if (state === 'playing') rafId = requestAnimationFrame(loop);
  };

  /* The button keeps its visible "Play" label (the stager hover splits it into
     letters), so only its accessible name changes with the state. */
  const showOverlay = (title: string, text: string, button: string) => {
    titleEl.textContent = title;
    textEl.textContent = text;
    startBtn.setAttribute('aria-label', button);
    overlay.hidden = false;
    canvas.classList.remove('is-playing');
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
    canvas.classList.add('is-playing');
    keys.clear();
    centerBoard();
    lastTime = performance.now();
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
    showOverlay('Game over', `You scored ${score} and reached level ${level}. Best: ${best}.`, 'Play again');
  }

  const KEY_MAP: Record<string, string> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

  startBtn.addEventListener('click', play);
  canvas.addEventListener('click', launch);

  // The paddle follows the mouse anywhere over the page while playing.
  window.addEventListener('pointermove', (e) => {
    if (state !== 'playing' || e.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    paddleX = ((e.clientX - rect.left) / rect.width) * W;
  });

  window.addEventListener('keydown', (e) => {
    const action = KEY_MAP[e.code];
    if (state === 'playing' && action) {
      e.preventDefault();
      keys.add(action);
    } else if (state === 'playing' && e.code === 'Space') {
      e.preventDefault();
      launch();
    } else if (state === 'playing' && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
      // Not used by the game, but the page must not scroll mid-game.
      e.preventDefault();
    } else if ((e.code === 'KeyP' || e.code === 'Escape') && state === 'playing') {
      e.preventDefault();
      pause();
    } else if (e.code === 'KeyP' && state === 'paused') {
      e.preventDefault();
      play();
    }
  });
  window.addEventListener('keyup', (e) => {
    const action = KEY_MAP[e.code];
    if (action) keys.delete(action);
  });
  window.addEventListener('blur', () => keys.clear());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initStarBreaker();
/* Star Breaker game END */
