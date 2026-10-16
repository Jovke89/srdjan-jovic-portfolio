/* Space Defender game START */
/* Space Invaders style shooter for /game-room/space-defender/, drawn smooth on
   a canvas in the site's brand colors (yellow ship and lasers, the chat robot as
   aliens, sparks on hits). The aliens march sideways, step down at the edges and fire
   back; the fewer are left the faster they move, and every cleared wave comes
   back faster. Destroyed aliens sometimes drop a power-up capsule: double
   shot, a rocket that blows up a whole cluster, or a push that sends the
   fleet one or two steps back up. Arrow keys / A D to move, Space to fire
   (hold for auto fire), P or Escape to pause. Best score is kept per browser
   in localStorage. */
const W = 960;
const H = 600;
const BEST_KEY = 'game-room-space-defender-best';
const COLS = 9;
const ROWS = 4;
const ROW_POINTS = [30, 20, 20, 10];
const SHIP_SPEED = 420;
const SHOT_SPEED = 720;
const FIRE_COOLDOWN = 0.28;
const ALIEN_SHOT_SPEED = 260;
const LIVES = 3;
const STEP_DOWN = 22;
const TOP_LIMIT = 70;
const DROP_CHANCE = 0.12;
const DROP_SPEED = 150;
const DOUBLE_SECONDS = 8;
const ROCKET_RADIUS = 95;
/* Drop weights: push 2 is the rarest. */
const POWERS = [
  { kind: 'double', weight: 3, label: 'II', name: 'Double shot' },
  { kind: 'rocket', weight: 3, label: 'R', name: 'Rocket' },
  { kind: 'push1', weight: 3, label: '↑', name: 'Push back 1' },
  { kind: 'push2', weight: 1, label: '⇈', name: 'Push back 2' },
] as const;

type State = 'ready' | 'playing' | 'paused' | 'over';
interface Alien { x: number; y: number; row: number; alive: boolean }
interface Shot { x: number; y: number; vy: number; rocket?: boolean }
type PowerKind = (typeof POWERS)[number]['kind'];
interface Drop { x: number; y: number; kind: PowerKind; label: string; name: string; age: number }
/* Floating text: names a capsule's power when it is caught. */
interface Floater { text: string; x: number; y: number; life: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Star { x: number; y: number; r: number; phase: number }

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

function initSpaceDefender() {
  const root = document.querySelector<HTMLElement>('[data-space]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;

  const overlay = root.querySelector<HTMLElement>('[data-game-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-game-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-game-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-game-score]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-game-best]')!;
  const waveEl = root.querySelector<HTMLElement>('[data-game-wave]')!;
  const livesEl = root.querySelector<HTMLElement>('[data-game-lives]')!;

  const brand =
    getComputedStyle(document.documentElement).getPropertyValue('--_srdjan-variables---brand-color').trim() || '#ffc000';

  let state: State = 'ready';
  let score = 0;
  let best = readBest();
  let wave = 1;
  let lives = LIVES;
  let shipX = W / 2;
  let cooldown = 0;
  let invulnerable = 0;
  let aliens: Alien[] = [];
  let alienDir = 1;
  let alienStepDown = 0;
  let shots: Shot[] = [];
  let alienShots: Shot[] = [];
  let sparks: Spark[] = [];
  let drops: Drop[] = [];
  let floaters: Floater[] = [];
  let doubleLeft = 0;
  let rockets = 0;
  let lastTime = 0;
  let rafId = 0;
  let scale = 1;
  const keys = new Set<string>();
  const stars: Star[] = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.3 + 0.3,
    phase: Math.random() * Math.PI * 2,
  }));

  bestEl.textContent = String(best);

  /* Game logic runs in a fixed 960x600 space; the canvas scales it to its
     width and renders sharp on Retina. */
  const resize = () => {
    const width = canvas.clientWidth;
    scale = width / W;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    buildSprite();
    draw(performance.now());
  };

  const updateHud = () => {
    scoreEl.textContent = String(score);
    waveEl.textContent = String(wave);
    livesEl.textContent = String(lives);
  };

  const spawnWave = () => {
    aliens = [];
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) aliens.push({ x: 150 + col * 75, y: 70 + row * 56, row, alive: true });
    alienDir = 1;
    alienStepDown = 0;
    alienShots = [];
  };

  const reset = () => {
    score = 0;
    wave = 1;
    lives = LIVES;
    shipX = W / 2;
    shots = [];
    sparks = [];
    drops = [];
    floaters = [];
    doubleLeft = 0;
    rockets = 0;
    invulnerable = 0;
    spawnWave();
    updateHud();
  };

  const burst = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.5 + Math.random() * 0.4, color });
    }
  };

  /* Aliens speed up as their number drops and with every wave. */
  const alienSpeed = (alive: number) => (40 + (COLS * ROWS - alive) * 4.5) * (1 + (wave - 1) * 0.18);

  const update = (dt: number) => {
    // Ship
    const move = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    shipX = Math.min(W - 40, Math.max(40, shipX + move * SHIP_SPEED * dt));
    cooldown -= dt;
    invulnerable -= dt;
    doubleLeft -= dt;
    if (keys.has('fire') && cooldown <= 0) {
      if (rockets > 0) {
        rockets -= 1;
        shots.push({ x: shipX, y: H - 84, vy: -SHOT_SPEED * 0.75, rocket: true });
      } else if (doubleLeft > 0) {
        shots.push({ x: shipX - 18, y: H - 70, vy: -SHOT_SPEED }, { x: shipX + 18, y: H - 70, vy: -SHOT_SPEED });
      } else {
        shots.push({ x: shipX, y: H - 78, vy: -SHOT_SPEED });
      }
      cooldown = FIRE_COOLDOWN;
    }

    // Aliens march, step down at the edges
    const alive = aliens.filter((a) => a.alive);
    const speed = alienSpeed(alive.length);
    if (alienStepDown > 0) {
      const step = Math.min(alienStepDown, 120 * dt);
      alive.forEach((a) => (a.y += step));
      alienStepDown -= step;
    } else {
      alive.forEach((a) => (a.x += alienDir * speed * dt));
      const hitEdge = alive.some((a) => (alienDir > 0 ? a.x > W - 40 : a.x < 40));
      if (hitEdge) {
        alienDir *= -1;
        alienStepDown = STEP_DOWN;
      }
    }

    // Aliens fire from the lowest alien in a random column
    const fireChance = (0.6 + wave * 0.25) * dt;
    if (alive.length && Math.random() < fireChance) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      const lowest = alive
        .filter((a) => Math.abs(a.x - shooter.x) < 10)
        .reduce((low, a) => (a.y > low.y ? a : low), shooter);
      alienShots.push({ x: lowest.x, y: lowest.y + 18, vy: ALIEN_SHOT_SPEED + wave * 20 });
    }

    // Shots
    shots.forEach((s) => (s.y += s.vy * dt));
    alienShots.forEach((s) => (s.y += s.vy * dt));
    shots = shots.filter((s) => {
      const target = alive.find((a) => a.alive && Math.abs(a.x - s.x) < 24 && Math.abs(a.y - s.y) < 18);
      if (!target) return s.y > -20;
      const victims = s.rocket
        ? alive.filter((a) => a.alive && Math.hypot(a.x - target.x, a.y - target.y) <= ROCKET_RADIUS)
        : [target];
      victims.forEach((a) => destroy(a));
      if (s.rocket) burst(target.x, target.y, brand, 40);
      return false;
    });

    // Power-up capsules fall and are caught by the ship
    drops.forEach((d) => {
      d.y += DROP_SPEED * dt;
      d.age += dt;
    });
    floaters.forEach((f) => {
      f.y -= 40 * dt;
      f.life -= dt;
    });
    floaters = floaters.filter((f) => f.life > 0);
    drops = drops.filter((d) => {
      if (Math.abs(d.x - shipX) < 38 && d.y > H - 80 && d.y < H - 16) {
        collect(d.kind);
        floaters.push({ text: d.name.toUpperCase(), x: shipX, y: H - 100, life: 1.4 });
        return false;
      }
      return d.y < H + 20;
    });
    alienShots = alienShots.filter((s) => {
      const hitsShip = invulnerable <= 0 && Math.abs(s.x - shipX) < 30 && s.y > H - 70 && s.y < H - 20;
      if (hitsShip) {
        loseLife();
        return false;
      }
      return s.y < H + 20;
    });

    // Sparks
    sparks.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    });
    sparks = sparks.filter((p) => p.life > 0);

    // Wave cleared, or the aliens reached the ship's row
    if (!aliens.some((a) => a.alive)) {
      wave += 1;
      updateHud();
      spawnWave();
    } else if (alive.some((a) => a.y > H - 110)) {
      lives = 0;
      updateHud();
      burst(shipX, H - 50, brand, 30);
      gameOver();
    }
  };

  function destroy(a: Alien) {
    a.alive = false;
    score += ROW_POINTS[a.row] ?? 10;
    updateHud();
    burst(a.x, a.y, brand, 14);
    if (Math.random() < DROP_CHANCE) {
      const total = POWERS.reduce((sum, p) => sum + p.weight, 0);
      let pick = Math.random() * total;
      const power = POWERS.find((p) => (pick -= p.weight) < 0) ?? POWERS[0];
      drops.push({ x: a.x, y: a.y, kind: power.kind, label: power.label, name: power.name, age: 0 });
    }
  }

  /* Push-ups move the whole fleet back up by whole march steps, never above
     where a wave starts. */
  function collect(kind: PowerKind) {
    burst(shipX, H - 60, brand, 12);
    if (kind === 'double') doubleLeft = DOUBLE_SECONDS;
    else if (kind === 'rocket') rockets += 1;
    else {
      const alive = aliens.filter((a) => a.alive);
      const topmost = Math.min(...alive.map((a) => a.y));
      const lift = Math.min(STEP_DOWN * (kind === 'push2' ? 2 : 1), Math.max(0, topmost - TOP_LIMIT));
      alive.forEach((a) => (a.y -= lift));
      alienStepDown = 0;
    }
  }

  function loseLife() {
    lives -= 1;
    updateHud();
    burst(shipX, H - 50, brand, 24);
    if (lives <= 0) return gameOver();
    invulnerable = 1.5;
    alienShots = [];
  }

  /* Aliens are the site's chat launcher robot: the same 12x12 glyph from
     ChatWidget.astro in dark on a yellow disc. */
  const ROBOT = new Path2D(
    'M5 0h2v1H5zM5.5 1h1v1h-1zM1 2h10v8H1zM3 4h2v2H3zM7 4h2v2H7zM4 8h4v1H4zM0 5h1v2H0zM11 5h1v2h-1zM3 10h2v1H3zM7 10h2v1H7z',
  );
  /* The robot is pixel art, so it is rendered once per resize into a sprite
     at exact device-pixel size (whole-pixel glyph units) and always drawn at
     whole device pixels: it stays sharp while the fleet marches. */
  let sprite: HTMLCanvasElement | null = null;
  let devicePx = 1;
  const buildSprite = () => {
    devicePx = scale * (window.devicePixelRatio || 1);
    const size = Math.round(44 * devicePx);
    const unit = Math.max(1, Math.round(2 * devicePx));
    const offset = Math.round((size - 12 * unit) / 2);
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = size;
    const sctx = sprite.getContext('2d')!;
    const disc = sctx.createLinearGradient(0, 0, size, size);
    disc.addColorStop(0, '#ffd54d');
    disc.addColorStop(1, '#c98f00');
    sctx.fillStyle = disc;
    sctx.beginPath();
    sctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    sctx.fill();
    sctx.translate(offset, offset);
    sctx.scale(unit, unit);
    sctx.fillStyle = '#131312';
    sctx.fill(ROBOT, 'evenodd');
  };

  const drawAlien = (a: Alien) => {
    if (!sprite) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a.row === 0 ? 0.75 : 1;
    ctx.drawImage(sprite, Math.round(a.x * devicePx - sprite.width / 2), Math.round(a.y * devicePx - sprite.height / 2));
    ctx.restore();
  };

  const drawShip = () => {
    if (invulnerable > 0 && Math.floor(invulnerable * 10) % 2 === 0) return;
    const y = H - 48;
    const gradient = ctx.createLinearGradient(shipX - 30, y - 30, shipX + 30, y + 25);
    gradient.addColorStop(0, '#ffd54d');
    gradient.addColorStop(1, '#c98f00');
    ctx.save();
    ctx.shadowColor = brand;
    ctx.shadowBlur = 18;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(shipX, y - 32);
    ctx.lineTo(shipX + 30, y + 26);
    ctx.lineTo(shipX, y + 16);
    ctx.lineTo(shipX - 30, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(19, 19, 18, 0.55)';
    ctx.beginPath();
    ctx.moveTo(shipX, y - 14);
    ctx.lineTo(shipX + 11, y + 12);
    ctx.lineTo(shipX, y + 7);
    ctx.lineTo(shipX - 11, y + 12);
    ctx.closePath();
    ctx.fill();
  };

  function draw(time: number) {
    ctx.clearRect(0, 0, W, H);

    // Twinkling stars
    stars.forEach((s) => {
      ctx.globalAlpha = 0.35 + Math.sin(time / 600 + s.phase) * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    aliens.filter((a) => a.alive).forEach(drawAlien);

    // Player lasers: glowing yellow streaks
    ctx.save();
    ctx.shadowColor = brand;
    ctx.shadowBlur = 12;
    shots.forEach((s) => {
      if (s.rocket) {
        ctx.fillStyle = brand;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 10);
        ctx.lineTo(s.x + 7, s.y + 4);
        ctx.lineTo(s.x + 7, s.y + 18);
        ctx.lineTo(s.x - 7, s.y + 18);
        ctx.lineTo(s.x - 7, s.y + 4);
        ctx.closePath();
        ctx.fill();
        const flame = ctx.createLinearGradient(s.x, s.y + 18, s.x, s.y + 40);
        flame.addColorStop(0, 'rgba(255, 87, 34, 0.9)');
        flame.addColorStop(1, 'rgba(255, 87, 34, 0)');
        ctx.fillStyle = flame;
        ctx.fillRect(s.x - 4, s.y + 18, 8, 22);
        return;
      }
      const g = ctx.createLinearGradient(s.x, s.y + 26, s.x, s.y);
      g.addColorStop(0, 'rgba(255, 192, 0, 0)');
      g.addColorStop(1, brand);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(s.x - 2.5, s.y, 5, 26, 2.5);
      ctx.fill();
    });
    ctx.restore();

    // Alien shots: small light bolts
    ctx.fillStyle = 'rgba(232, 232, 232, 0.85)';
    alienShots.forEach((s) => {
      ctx.beginPath();
      ctx.roundRect(s.x - 2, s.y - 8, 4, 16, 2);
      ctx.fill();
    });

    // Power-up capsules: dark pill with a yellow outline and an icon
    ctx.font = '600 15px Splinesansmono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drops.forEach((d) => {
      ctx.save();
      ctx.shadowColor = brand;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#131312';
      ctx.strokeStyle = brand;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(d.x - 17, d.y - 12, 34, 24, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = brand;
      ctx.fillText(d.label, d.x, d.y + 1);
    });

    // A new capsule names its power for its first second and a half
    ctx.font = '12px Splinesansmono, monospace';
    drops.forEach((d) => {
      if (d.age > 1.5) return;
      ctx.globalAlpha = Math.min(1, (1.5 - d.age) * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(d.name.toUpperCase(), d.x, d.y - 24);
    });
    ctx.globalAlpha = 1;

    // Caught power-ups: name rises from the ship and fades
    ctx.font = '600 16px Splinesansmono, monospace';
    floaters.forEach((f) => {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = brand;
      ctx.fillText(`+ ${f.text}`, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // Active power-ups in the top left corner
    const status = [doubleLeft > 0 && `DOUBLE ${Math.ceil(doubleLeft)}S`, rockets > 0 && `ROCKET ×${rockets}`].filter(Boolean);
    ctx.textAlign = 'left';
    ctx.font = '14px Splinesansmono, monospace';
    ctx.fillStyle = brand;
    status.forEach((line, i) => ctx.fillText(line as string, 18, 22 + i * 22));

    sparks.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.9);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (state !== 'over') drawShip();
  }

  const loop = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (state === 'playing') update(dt);
    draw(time);
    if (state === 'playing') rafId = requestAnimationFrame(loop);
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
    keys.clear();
    canvas.focus({ preventScroll: true });
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
    // Let the last sparks fade out behind the overlay.
    const fade = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      sparks.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      });
      sparks = sparks.filter((p) => p.life > 0);
      draw(time);
      if (sparks.length && state === 'over') requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
    showOverlay('Game over', `You scored ${score} and reached wave ${wave}. Best: ${best}.`, 'Play again');
  }

  const KEY_MAP: Record<string, string> = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'fire',
  };

  startBtn.addEventListener('click', play);

  window.addEventListener('keydown', (e) => {
    const action = KEY_MAP[e.code];
    if (state === 'playing' && action) {
      e.preventDefault();
      keys.add(action);
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

  canvas.tabIndex = -1;
  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initSpaceDefender();
/* Space Defender game END */
