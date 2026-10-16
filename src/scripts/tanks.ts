/* Tank battle game START */
/* Battle City style tank game for /game-room/tanks/, drawn smooth on a canvas
   in the site's colors. Five levels with 6, 9, 12, 15 and 18 enemy tanks to
   destroy. The map has brick walls (shot away tile by tile) and steel walls;
   at the bottom sits the base, the site's AI agent robot walled in by bricks.
   An enemy bullet on the base ends the game. Destroyed tanks sometimes leave a
   weapon crate: rapid fire, steel breaker, shield or bomb. Arrow keys / WASD
   to move, Space to fire, P or Escape to pause. Best score is kept per
   browser in localStorage. */
const W = 960;
const H = 600;
const TILE = 40;
const COLS = W / TILE;
const ROWS = H / TILE;
const TANK = 32;
const BEST_KEY = 'game-room-tanks-best';
const LIVES = 3;
const LEVELS = 5;
const PLAYER_SPEED = 130;
const BULLET_SPEED = 480;
const ENEMY_BULLET_SPEED = 320;
const FIRE_COOLDOWN = 0.4;
const RAPID_COOLDOWN = 0.18;
const MAX_ENEMIES = 4;
const CRATE_CHANCE = 0.35;
const CRATE_LIFE = 12;
const SPAWNS = [
  { x: 20, y: 20 },
  { x: W / 2, y: 20 },
  { x: W - 20, y: 20 },
];
const PLAYER_START = { x: 8 * TILE + TILE / 2, y: H - TILE / 2 };
const BASE = { x: W / 2, y: H - TILE / 2 };
const CRATES = [
  { kind: 'rapid', label: 'R', name: 'Rapid fire' },
  { kind: 'steel', label: 'ST', name: 'Steel breaker' },
  { kind: 'shield', label: 'SH', name: 'Shield' },
  { kind: 'bomb', label: 'B', name: 'Bomb' },
] as const;
/* The base robot: the chat launcher glyph from ChatWidget.astro (12x12). */
const ROBOT = 'M5 0h2v1H5zM5.5 1h1v1h-1zM1 2h10v8H1zM3 4h2v2H3zM7 4h2v2H7zM4 8h4v1H4zM0 5h1v2H0zM11 5h1v2h-1zM3 10h2v1H3zM7 10h2v1H7z';

/* Left half of each row, mirrored for the right half.
   '#' brick, 'S' steel, 'B' base, '.' empty. */
const MAP_HALF = [
  '............',
  '.##..##..#..',
  '.##..##..#..',
  '.##..##.....',
  '......SS..##',
  'SS..........',
  '..##..##..#.',
  '..##..##..#.',
  '..........##',
  '.SS..##.....',
  '.....##..#..',
  '.##......#..',
  '.##..##.....',
  '.....##...##',
  '..........#B',
];

type State = 'ready' | 'playing' | 'paused' | 'over';
type Tile = '.' | '#' | 'S' | 'B';
type CrateKind = (typeof CRATES)[number]['kind'];
interface Dir { x: number; y: number }
interface Tank { x: number; y: number; dir: Dir; cooldown: number; turn: number; enemy: boolean }
interface Bullet { x: number; y: number; dir: Dir; enemy: boolean }
interface Crate { x: number; y: number; kind: CrateKind; label: string; name: string; age: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; life: number }

const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };
const DIRS = [UP, DOWN, LEFT, RIGHT];

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

function initTanks() {
  const root = document.querySelector<HTMLElement>('[data-tanks]');
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
  const robot = new Path2D(ROBOT);

  let state: State = 'ready';
  let score = 0;
  let best = readBest();
  let level = 1;
  let lives = LIVES;
  let map: Tile[][] = [];
  let player: Tank | null = null;
  let enemies: Tank[] = [];
  let bullets: Bullet[] = [];
  let crates: Crate[] = [];
  let sparks: Spark[] = [];
  let floaters: Floater[] = [];
  let toSpawn = 0;
  let spawnTimer = 0;
  let shield = 0;
  let rapid = 0;
  let steel = 0;
  let respawn = 0;
  let banner = 0;
  let baseAlive = true;
  let lastTime = 0;
  let rafId = 0;
  const held: string[] = [];
  let firing = false;

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
    levelEl.textContent = `${level}/${LEVELS}`;
    livesEl.textContent = String(lives);
  };

  const enemiesForLevel = () => 6 + (level - 1) * 3;
  const enemySpeed = () => 80 + level * 10;

  const spawnPlayer = () => {
    player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: UP, cooldown: 0, turn: 0, enemy: false };
    shield = Math.max(shield, 2);
  };

  /* Every level starts on a fresh map with the player back by the base. */
  const startLevel = () => {
    map = MAP_HALF.map((half) => (half + [...half].reverse().join('')).split('') as Tile[]);
    toSpawn = enemiesForLevel();
    spawnTimer = 0.8;
    enemies = [];
    bullets = [];
    crates = [];
    banner = 1.8;
    spawnPlayer();
  };

  const reset = () => {
    score = 0;
    level = 1;
    lives = LIVES;
    sparks = [];
    floaters = [];
    shield = 0;
    rapid = 0;
    steel = 0;
    respawn = 0;
    baseAlive = true;
    startLevel();
    updateHud();
  };

  const burst = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 200;
      sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.4, color });
    }
  };

  const float = (text: string, x: number, y: number) => floaters.push({ text, x, y, life: 1.4 });

  const tileAt = (px: number, py: number): Tile => {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'S';
    return map[r][c];
  };

  const hitsWall = (x: number, y: number) => {
    const half = TANK / 2;
    if (x - half < 0 || y - half < 0 || x + half > W || y + half > H) return true;
    const c0 = Math.floor((x - half) / TILE);
    const c1 = Math.floor((x + half - 0.01) / TILE);
    const r0 = Math.floor((y - half) / TILE);
    const r1 = Math.floor((y + half - 0.01) / TILE);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (map[r]?.[c] !== '.') return true;
    return false;
  };

  /* Tanks block each other only when a move would bring them closer, so two
     tanks that touch can always back away from each other. */
  const hitsTank = (self: Tank, x: number, y: number, strict = false) =>
    [player, ...enemies].some((t) => {
      if (!t || t === self || Math.abs(t.x - x) >= TANK || Math.abs(t.y - y) >= TANK) return false;
      return strict || Math.hypot(t.x - x, t.y - y) < Math.hypot(t.x - self.x, t.y - self.y);
    });

  const blocked = (t: Tank, x: number, y: number) => hitsWall(x, y) || hitsTank(t, x, y);

  /* Turning onto the other axis snaps to the half-tile grid (only when that
     spot is free), so tanks slide into corridors instead of catching on
     corners and never get pushed into a wall. */
  const move = (t: Tank, dir: Dir, speed: number, dt: number) => {
    if (dir.x !== t.dir.x || dir.y !== t.dir.y) {
      const snapX = dir.y !== 0 && t.dir.y === 0 ? Math.round(t.x / (TILE / 2)) * (TILE / 2) : t.x;
      const snapY = dir.x !== 0 && t.dir.x === 0 ? Math.round(t.y / (TILE / 2)) * (TILE / 2) : t.y;
      if (!hitsWall(snapX, snapY)) {
        t.x = snapX;
        t.y = snapY;
      }
      t.dir = dir;
    }
    const nx = t.x + dir.x * speed * dt;
    const ny = t.y + dir.y * speed * dt;
    if (blocked(t, nx, ny)) return false;
    t.x = nx;
    t.y = ny;
    return true;
  };

  const fire = (t: Tank) => {
    if (t.cooldown > 0) return;
    if (!t.enemy && bullets.filter((b) => !b.enemy).length >= (rapid > 0 ? 3 : 2)) return;
    bullets.push({ x: t.x + t.dir.x * 20, y: t.y + t.dir.y * 20, dir: t.dir, enemy: t.enemy });
    t.cooldown = t.enemy ? Math.max(0.9, 2.2 - level * 0.15) : rapid > 0 ? RAPID_COOLDOWN : FIRE_COOLDOWN;
  };

  const destroyEnemy = (t: Tank) => {
    enemies = enemies.filter((e) => e !== t);
    score += 100 * level;
    updateHud();
    burst(t.x, t.y, '#e8e8e8', 22);
    if (Math.random() < CRATE_CHANCE) {
      const pick = CRATES[Math.floor(Math.random() * CRATES.length)];
      const x = Math.floor(t.x / TILE) * TILE + TILE / 2;
      const y = Math.floor(t.y / TILE) * TILE + TILE / 2;
      crates.push({ x, y, kind: pick.kind, label: pick.label, name: pick.name, age: 0 });
    }
  };

  const collect = (c: Crate) => {
    float(`+ ${c.name.toUpperCase()}`, c.x, c.y - 24);
    burst(c.x, c.y, brand, 12);
    if (c.kind === 'rapid') rapid = 10;
    else if (c.kind === 'steel') steel = 12;
    else if (c.kind === 'shield') shield = 8;
    else [...enemies].forEach(destroyEnemy);
  };

  const killPlayer = () => {
    if (!player) return;
    burst(player.x, player.y, brand, 30);
    player = null;
    lives -= 1;
    rapid = 0;
    steel = 0;
    updateHud();
    if (lives <= 0) return gameOver('You ran out of lives.');
    respawn = 1.2;
  };

  /* A stuck or bored enemy picks a free direction, leaning towards the player
     about half the time. */
  const aiTurn = (t: Tank) => {
    const free = DIRS.filter((d) => !blocked(t, t.x + d.x * 4, t.y + d.y * 4));
    const options = free.length ? free : DIRS;
    if (player && Math.random() < 0.5) {
      const dx = player.x - t.x;
      const dy = player.y - t.y;
      const toward = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP;
      if (options.includes(toward)) return toward;
    }
    return options[Math.floor(Math.random() * options.length)];
  };

  const update = (dt: number) => {
    banner -= dt;
    shield -= dt;
    rapid -= dt;
    steel -= dt;

    // Player
    if (player) {
      player.cooldown -= dt;
      const key = held[held.length - 1];
      const dir = key === 'up' ? UP : key === 'down' ? DOWN : key === 'left' ? LEFT : key === 'right' ? RIGHT : null;
      if (dir) move(player, dir, PLAYER_SPEED, dt);
      if (firing) fire(player);
    } else if (respawn > 0) {
      respawn -= dt;
      if (respawn <= 0) spawnPlayer();
    }

    // Spawning
    spawnTimer -= dt;
    if (toSpawn > 0 && spawnTimer <= 0 && enemies.length < MAX_ENEMIES) {
      const spot = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
      const tank: Tank = { x: spot.x, y: spot.y, dir: DOWN, cooldown: 1 + Math.random(), turn: 1, enemy: true };
      if (!hitsWall(spot.x, spot.y) && !hitsTank(tank, spot.x, spot.y, true)) {
        enemies.push(tank);
        toSpawn -= 1;
        burst(spot.x, spot.y, '#e8e8e8', 10);
      }
      spawnTimer = Math.max(0.8, 2.4 - level * 0.2);
    }

    // Enemies
    enemies.forEach((t) => {
      t.cooldown -= dt;
      t.turn -= dt;
      const moved = move(t, t.dir, enemySpeed(), dt);
      if (!moved || t.turn <= 0) {
        move(t, aiTurn(t), 0, dt);
        t.turn = 0.8 + Math.random() * 1.6;
      }
      const lined =
        player &&
        ((Math.abs(player.x - t.x) < 14 && Math.sign(player.y - t.y) === t.dir.y) ||
          (Math.abs(player.y - t.y) < 14 && Math.sign(player.x - t.x) === t.dir.x));
      if (lined || Math.random() < 0.6 * dt) fire(t);
    });

    // Crates: picked up by driving over them, blink out after a while
    crates.forEach((c) => (c.age += dt));
    crates = crates.filter((c) => {
      if (player && Math.abs(player.x - c.x) < TANK && Math.abs(player.y - c.y) < TANK) {
        collect(c);
        return false;
      }
      return c.age < CRATE_LIFE;
    });

    // Bullets
    bullets.forEach((b) => {
      const speed = b.enemy ? ENEMY_BULLET_SPEED : BULLET_SPEED;
      b.x += b.dir.x * speed * dt;
      b.y += b.dir.y * speed * dt;
    });
    const dead = new Set<Bullet>();
    bullets.forEach((b, i) => {
      if (dead.has(b)) return;
      // Bullets cancel each other out
      for (let j = i + 1; j < bullets.length; j++) {
        const o = bullets[j];
        if (o.enemy !== b.enemy && !dead.has(o) && Math.abs(o.x - b.x) < 8 && Math.abs(o.y - b.y) < 8) {
          dead.add(b).add(o);
          burst(b.x, b.y, '#ffffff', 6);
          return;
        }
      }
      const tile = tileAt(b.x, b.y);
      if (tile !== '.') {
        dead.add(b);
        const c = Math.floor(b.x / TILE);
        const r = Math.floor(b.y / TILE);
        if (tile === 'B') {
          if (b.enemy) {
            baseAlive = false;
            burst(BASE.x, BASE.y, brand, 50);
            gameOver('The agent was destroyed.');
          }
        } else if (tile === '#' || (tile === 'S' && !b.enemy && steel > 0 && map[r])) {
          map[r][c] = '.';
          burst(b.x, b.y, tile === '#' ? '#e5514b' : '#9a9a9a', 10);
        } else burst(b.x, b.y, '#9a9a9a', 5);
        return;
      }
      if (b.enemy) {
        if (player && shield <= 0 && Math.abs(player.x - b.x) < TANK / 2 && Math.abs(player.y - b.y) < TANK / 2) {
          dead.add(b);
          killPlayer();
        }
      } else {
        const hit = enemies.find((t) => Math.abs(t.x - b.x) < TANK / 2 && Math.abs(t.y - b.y) < TANK / 2);
        if (hit) {
          dead.add(b);
          destroyEnemy(hit);
        }
      }
    });
    bullets = bullets.filter((b) => !dead.has(b));
    if (state !== 'playing') return;

    sparks.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    });
    sparks = sparks.filter((p) => p.life > 0);
    floaters.forEach((f) => {
      f.y -= 40 * dt;
      f.life -= dt;
    });
    floaters = floaters.filter((f) => f.life > 0);

    // Level cleared
    if (toSpawn === 0 && !enemies.length) {
      if (level === LEVELS) return victory();
      level += 1;
      updateHud();
      startLevel();
    }
  };

  const drawTank = (t: Tank) => {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(Math.atan2(t.dir.y, t.dir.x) + Math.PI / 2);
    const half = TANK / 2;
    // Treads
    ctx.fillStyle = '#2a2a28';
    ctx.beginPath();
    ctx.roundRect(-half, -half, 9, TANK, 3);
    ctx.roundRect(half - 9, -half, 9, TANK, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let y = -half + 4; y < half; y += 6) {
      ctx.beginPath();
      ctx.moveTo(-half + 1, y);
      ctx.lineTo(-half + 8, y);
      ctx.moveTo(half - 8, y);
      ctx.lineTo(half - 1, y);
      ctx.stroke();
    }
    // Hull
    const hull = ctx.createLinearGradient(-half, -half, half, half);
    hull.addColorStop(0, t.enemy ? '#f2f2f2' : '#ffd54d');
    hull.addColorStop(1, t.enemy ? '#9a9a9a' : '#c98f00');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.roundRect(-half + 7, -half + 4, TANK - 14, TANK - 8, 5);
    ctx.fill();
    // Barrel and turret
    ctx.fillStyle = t.enemy ? '#ff5722' : '#131312';
    ctx.beginPath();
    ctx.roundRect(-2.5, -half - 6, 5, half + 4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* The base: the AI agent robot on a yellow disc (grey once destroyed). */
  const drawBase = () => {
    ctx.save();
    ctx.translate(BASE.x, BASE.y);
    const disc = ctx.createLinearGradient(-18, -18, 18, 18);
    disc.addColorStop(0, baseAlive ? '#ffd54d' : '#6b6b6b');
    disc.addColorStop(1, baseAlive ? '#c98f00' : '#3a3a3a');
    ctx.fillStyle = disc;
    if (baseAlive) {
      ctx.shadowColor = brand;
      ctx.shadowBlur = 16;
    }
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.translate(-12, -12);
    ctx.scale(2, 2);
    ctx.fillStyle = '#131312';
    ctx.fill(robot, 'evenodd');
    ctx.restore();
  };

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Walls
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const tile = map[r]?.[c];
        if (!tile || tile === '.' || tile === 'B') continue;
        const x = c * TILE;
        const y = r * TILE;
        if (tile === '#') {
          // Bricks: a 2x2 block of rounded bricks, the lower row a shade darker
          const half = TILE / 2;
          for (let row = 0; row < 2; row++)
            for (let col = 0; col < 2; col++) {
              ctx.fillStyle = row ? '#e5514b' : '#ff5722';
              ctx.beginPath();
              ctx.roundRect(x + 1 + col * half, y + 1 + row * half, half - 2, half - 2, 3);
              ctx.fill();
            }
        } else {
          const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
          g.addColorStop(0, '#6b6b6b');
          g.addColorStop(1, '#3a3a3a');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 9, y + 9, TILE - 18, TILE - 18);
        }
      }
    drawBase();

    // Weapon crates: dark boxes with a yellow outline, blinking before they vanish
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    crates.forEach((c) => {
      if (c.age > CRATE_LIFE - 3 && Math.floor(c.age * 6) % 2 === 0) return;
      ctx.save();
      ctx.shadowColor = brand;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#131312';
      ctx.strokeStyle = brand;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(c.x - 15, c.y - 15, 30, 30, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = brand;
      ctx.font = '700 13px Splinesansmono, monospace';
      ctx.fillText(c.label, c.x, c.y + 1);
      if (c.age < 1.5) {
        ctx.globalAlpha = Math.min(1, (1.5 - c.age) * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Splinesansmono, monospace';
        ctx.fillText(c.name.toUpperCase(), c.x, c.y - 26);
        ctx.globalAlpha = 1;
      }
    });

    enemies.forEach(drawTank);
    if (player && !(shield > 0 && shield < 2 && Math.floor(shield * 10) % 2 === 0)) drawTank(player);
    if (player && shield > 0) {
      ctx.strokeStyle = 'rgba(255, 192, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, TANK * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bullets: glowing dots, yellow for the player, orange for enemies
    bullets.forEach((b) => {
      ctx.save();
      ctx.shadowColor = b.enemy ? '#ff5722' : brand;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.enemy ? '#ff5722' : brand;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

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
      ctx.fillStyle = brand;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // Active weapons (top left), enemies left (bottom right), level banner
    ctx.textAlign = 'left';
    ctx.font = '14px Splinesansmono, monospace';
    ctx.fillStyle = brand;
    [rapid > 0 && `RAPID ${Math.ceil(rapid)}S`, steel > 0 && `STEEL ${Math.ceil(steel)}S`, shield > 2 && `SHIELD ${Math.ceil(shield)}S`]
      .filter(Boolean)
      .forEach((line, i) => ctx.fillText(line as string, 14, 52 + i * 22));
    if (state === 'playing') {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(`TANKS LEFT ${toSpawn + enemies.length}`, W - 14, 52);
    }
    if (banner > 0 && state === 'playing') {
      ctx.globalAlpha = Math.min(1, banner);
      ctx.textAlign = 'center';
      ctx.font = '700 34px Syne, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`LEVEL ${level}`, W / 2, H / 2 - 14);
      ctx.font = '15px Splinesansmono, monospace';
      ctx.fillText(`DESTROY ${enemiesForLevel()} TANKS`, W / 2, H / 2 + 22);
      ctx.globalAlpha = 1;
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
    held.length = 0;
    firing = false;
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

  const finish = () => {
    state = 'over';
    cancelAnimationFrame(rafId);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      saveBest(best);
    }
    draw();
  };

  function gameOver(reason: string) {
    finish();
    showOverlay('Game over', `${reason} You scored ${score} on level ${level}. Best: ${best}.`, 'Play again');
  }

  function victory() {
    finish();
    showOverlay('You win', `All ${LEVELS} levels cleared and the agent is safe. Score ${score}. Best: ${best}.`, 'Play again');
  }

  const KEY_MAP: Record<string, string> = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
  };

  startBtn.addEventListener('click', play);

  /* Held direction keys stack up; the most recent one wins. */
  window.addEventListener('keydown', (e) => {
    const action = KEY_MAP[e.code];
    if (state === 'playing' && action) {
      e.preventDefault();
      if (!held.includes(action)) held.push(action);
    } else if (state === 'playing' && e.code === 'Space') {
      e.preventDefault();
      firing = true;
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
    const index = action ? held.indexOf(action) : -1;
    if (index !== -1) held.splice(index, 1);
    if (e.code === 'Space') firing = false;
  });
  window.addEventListener('blur', () => {
    held.length = 0;
    firing = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  canvas.tabIndex = -1;
  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initTanks();
/* Tank battle game END */
