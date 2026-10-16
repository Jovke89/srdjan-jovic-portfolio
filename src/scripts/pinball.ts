/* Pinball game START */
/* Agent Pinball for /game-room/pinball/, drawn smooth on a canvas in the
   site's colors. A portrait table sits in the middle of the board with a big
   AI agent and SRDJAN painted on it. The bumpers are the agent robot, rubber
   posts, side springs and two slingshots kick the ball back, and the six
   rollover lanes at the top spell SRDJAN. Light all six to raise the
   multiplier (up to x5). Every 30 bumper hits earns one extra ball. A short
   ball save runs after each launch. Left / A / Z and Right / D / M work the
   flippers, hold Space to pull the plunger and release to launch, Up or W
   nudges the table (too many nudges tilt it), P or Escape pauses. Best score
   is kept per browser in localStorage. */
type Vec = { x: number; y: number };
type Wall = { a: Vec; b: Vec; r: number; bounce?: number; kick?: number; id?: string; gate?: boolean; spring?: boolean };
type Bumper = { x: number; y: number; r: number; flash: number; post?: boolean };
type Flipper = { pivot: Vec; side: 1 | -1; angle: number; prev: number; pressed: boolean };
type Floater = { text: string; x: number; y: number; life: number };
type State = 'ready' | 'playing' | 'paused' | 'over';

const W = 960;
const H = 600;
/* The table is drawn in its own 420 wide coordinates, centered on the board. */
const TABLE_W = 420;
const OX = (W - TABLE_W) / 2;
const LANE_X = 380;
const BALL_R = 8;
const GRAVITY = 950;
const MAX_SPEED = 1700;
const SUBSTEPS = 8;
const WALL_BOUNCE = 0.45;
/* The guides into the flippers are soft, so the ball rolls down onto them. */
const GUIDE_BOUNCE = 0.1;
const FLIPPER_BOUNCE = 0.25;
const FLIPPER_LEN = 60;
const FLIPPER_R = 7;
const FLIPPER_REST = 0.52;
const FLIPPER_UP = -0.5;
const FLIPPER_UP_SPEED = 24;
const FLIPPER_DOWN_SPEED = 12;
const BUMPER_KICK = 330;
const POST_KICK = 220;
const SPRING_KICK = 450;
const SLING_KICK = 380;
const PLUNGER_MIN = 700;
const PLUNGER_MAX = 1500;
const PLUNGER_CHARGE = 1;
const BALL_SAVE = 5;
const BALLS = 3;
const MAX_MULT = 5;
const EXTRA_BALL_HITS = 30;
const NUDGE_DECAY = 3;
const TILT_AT = 3;
const LETTERS = ['S', 'R', 'D', 'J', 'A', 'N'];
const ROLLOVER_X = [110, 142, 174, 206, 238, 270];
const ROLLOVER_Y = 116;
const BALL_START: Vec = { x: 400, y: 571 };
const BEST_KEY = 'game-room-pinball-best';
const FONT = 'Splinesansmono, monospace';
/* The bumper robot: the chat launcher glyph from ChatWidget.astro (12x12). */
const ROBOT = 'M5 0h2v1H5zM5.5 1h1v1h-1zM1 2h10v8H1zM3 4h2v2H3zM7 4h2v2H7zM4 8h4v1H4zM0 5h1v2H0zM11 5h1v2h-1zM3 10h2v1H3zM7 10h2v1H7z';

const v = (x: number, y: number): Vec => ({ x, y });

/* Static table geometry: outer walls, the arched top, the plunger lane, the
   guides into the flippers, the slingshots, the side springs and the posts
   between the SRDJAN lanes. */
function buildWalls(): Wall[] {
  const walls: Wall[] = [];
  const add = (a: Vec, b: Vec, extra: Partial<Wall> = {}) => walls.push({ a, b, r: 2, ...extra });
  const arc: Vec[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = Math.PI + (Math.PI * i) / 24;
    arc.push(v(210 + 210 * Math.cos(t), 210 + 210 * Math.sin(t)));
  }
  arc.slice(1).forEach((p, i) => add(arc[i], p));
  add(v(0, 210), v(0, 420));
  add(v(0, 420), v(112, 533), { bounce: GUIDE_BOUNCE });
  add(v(TABLE_W, 210), v(TABLE_W, 590));
  add(v(LANE_X, 205), v(LANE_X, 590));
  add(v(LANE_X, 420), v(268, 533), { bounce: GUIDE_BOUNCE });
  add(v(LANE_X, 584), v(TABLE_W, 584));
  // One-way gate at the top of the plunger lane, it rolls the ball back left.
  add(v(TABLE_W, 165), v(LANE_X, 205), { gate: true });
  // Slingshots: the long inner edge kicks.
  add(v(55, 370), v(55, 430));
  add(v(55, 430), v(100, 455));
  add(v(55, 370), v(100, 455), { kick: SLING_KICK, id: 'sling-l', r: 3 });
  add(v(325, 370), v(325, 430));
  add(v(325, 430), v(280, 455));
  add(v(280, 455), v(325, 370), { kick: SLING_KICK, id: 'sling-r', r: 3 });
  // Side springs kick the ball back into the middle.
  add(v(7, 235), v(7, 320), { kick: SPRING_KICK, id: 'spring-l', r: 3, spring: true });
  add(v(LANE_X - 7, 320), v(LANE_X - 7, 235), { kick: SPRING_KICK, id: 'spring-r', r: 3, spring: true });
  // Posts between the SRDJAN rollover lanes.
  [94, 126, 158, 190, 222, 254, 286].forEach((x) => add(v(x, 98), v(x, 130), { r: 3 }));
  return walls;
}

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

const closestOnSegment = (p: Vec, a: Vec, b: Vec): Vec => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby)));
  return v(a.x + abx * t, a.y + aby * t);
};

function initPinball() {
  const root = document.querySelector<HTMLElement>('[data-pinball]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;

  const overlay = root.querySelector<HTMLElement>('[data-game-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-game-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-game-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-game-score]')!;
  const ballEl = root.querySelector<HTMLElement>('[data-game-ball]')!;
  const multEl = root.querySelector<HTMLElement>('[data-game-mult]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-game-best]')!;

  const brand =
    getComputedStyle(document.documentElement).getPropertyValue('--_srdjan-variables---brand-color').trim() || '#ffc000';
  const robot = new Path2D(ROBOT);
  const walls = buildWalls();
  const bumpers: Bumper[] = [
    { x: 120, y: 222, r: 24, flash: 0 },
    { x: 260, y: 222, r: 24, flash: 0 },
    { x: 190, y: 302, r: 24, flash: 0 },
    { x: 78, y: 300, r: 17, flash: 0 },
    { x: 302, y: 300, r: 17, flash: 0 },
    { x: 190, y: 168, r: 8, flash: 0, post: true },
    { x: 145, y: 352, r: 8, flash: 0, post: true },
    { x: 235, y: 352, r: 8, flash: 0, post: true },
  ];
  const flippers: Flipper[] = [
    { pivot: v(118, 540), side: 1, angle: FLIPPER_REST, prev: FLIPPER_REST, pressed: false },
    { pivot: v(262, 540), side: -1, angle: FLIPPER_REST, prev: FLIPPER_REST, pressed: false },
  ];

  let ball = { ...BALL_START, vx: 0, vy: 0 };
  let inLane = true;
  let score = 0;
  let balls = BALLS;
  let ballNo = 1;
  let mult = 1;
  let lit = LETTERS.map(() => false);
  let bumperHits = 0;
  let extraEarned = false;
  let saveTimer = 0;
  let charging = false;
  let charge = 0;
  let nudges = 0;
  let tilted = false;
  let best = readBest();
  let state: State = 'ready';
  let lastTime = 0;
  let rafId = 0;
  let floaters: Floater[] = [];
  const cooldowns = new Map<string, number>();
  const flashes = new Map<string, number>();
  let rolloverInside = LETTERS.map(() => false);

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
    ballEl.textContent = `${ballNo}/${ballNo + balls - 1}`;
    multEl.textContent = `x${mult}`;
  };

  const float = (text: string, x: number, y: number) => floaters.push({ text, x, y, life: 1 });

  const addScore = (points: number, x: number, y: number) => {
    if (tilted) return;
    const value = points * mult;
    score += value;
    float(`+${value}`, x, y);
    updateHud();
  };

  /* Scoring objects get a short cooldown so one contact over several substeps
     counts once. */
  const ready = (id: string) => {
    if ((cooldowns.get(id) ?? 0) > 0) return false;
    cooldowns.set(id, 0.12);
    return true;
  };

  const newBall = () => {
    ball = { ...BALL_START, vx: 0, vy: 0 };
    inLane = true;
    tilted = false;
    nudges = 0;
    charge = 0;
    saveTimer = 0;
  };

  const reset = () => {
    score = 0;
    balls = BALLS;
    ballNo = 1;
    mult = 1;
    lit = LETTERS.map(() => false);
    rolloverInside = LETTERS.map(() => false);
    bumperHits = 0;
    extraEarned = false;
    floaters = [];
    flippers.forEach((f) => {
      f.angle = f.prev = FLIPPER_REST;
      f.pressed = false;
    });
    newBall();
    updateHud();
  };

  const flipperEnds = (f: Flipper, angle = f.angle) => {
    const screen = f.side === 1 ? angle : Math.PI - angle;
    return {
      screen,
      tip: v(f.pivot.x + Math.cos(screen) * FLIPPER_LEN, f.pivot.y + Math.sin(screen) * FLIPPER_LEN),
    };
  };

  /* Pushes the ball out of a capsule and bounces it. The surface velocity lets
     a moving flipper hit the ball. Returns the contact normal, or null. */
  const collideCapsule = (a: Vec, b: Vec, radius: number, bounce: number, surface?: (p: Vec) => Vec) => {
    const p = closestOnSegment(ball, a, b);
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const dist = Math.hypot(dx, dy);
    const min = radius + BALL_R;
    if (dist >= min || dist === 0) return null;
    const n = v(dx / dist, dy / dist);
    ball.x = p.x + n.x * min;
    ball.y = p.y + n.y * min;
    const s = surface ? surface(p) : v(0, 0);
    const rvx = ball.vx - s.x;
    const rvy = ball.vy - s.y;
    const vn = rvx * n.x + rvy * n.y;
    if (vn < 0) {
      ball.vx = rvx - (1 + bounce) * vn * n.x + s.x;
      ball.vy = rvy - (1 + bounce) * vn * n.y + s.y;
    }
    return { n, vn };
  };

  const physicsStep = (dt: number) => {
    ball.vy += GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (inLane && ball.x < LANE_X - 5) inLane = false;

    walls.forEach((w) => {
      if (w.gate && inLane) return;
      const hit = collideCapsule(w.a, w.b, w.r, w.bounce ?? WALL_BOUNCE);
      if (!hit || !w.kick || !w.id) return;
      // Only a real hit fires the slingshot, not a ball resting against it.
      if (hit.vn > -60 || !ready(w.id)) return;
      ball.vx += hit.n.x * w.kick;
      ball.vy += hit.n.y * w.kick;
      flashes.set(w.id, 0.15);
      addScore(10, (w.a.x + w.b.x) / 2, (w.a.y + w.b.y) / 2);
    });

    bumpers.forEach((b, i) => {
      const dx = ball.x - b.x;
      const dy = ball.y - b.y;
      const dist = Math.hypot(dx, dy);
      const min = b.r + BALL_R;
      if (dist >= min || dist === 0) return;
      const n = v(dx / dist, dy / dist);
      ball.x = b.x + n.x * min;
      ball.y = b.y + n.y * min;
      const vn = ball.vx * n.x + ball.vy * n.y;
      if (vn < 0) {
        ball.vx -= 2 * vn * n.x;
        ball.vy -= 2 * vn * n.y;
      }
      const kick = b.post ? POST_KICK : BUMPER_KICK;
      ball.vx += n.x * kick;
      ball.vy += n.y * kick;
      if (!ready(`bumper-${i}`)) return;
      b.flash = 0.18;
      if (b.post) return addScore(25, b.x, b.y - 18);
      bumperHits += 1;
      addScore(100, b.x, b.y - b.r - 8);
      if (!extraEarned && bumperHits >= EXTRA_BALL_HITS && !tilted) {
        extraEarned = true;
        balls += 1;
        updateHud();
        float('EXTRA BALL', 190, 380);
      }
    });

    flippers.forEach((f) => {
      const { tip, screen } = flipperEnds(f);
      const prevScreen = flipperEnds(f, f.prev).screen;
      const omega = (screen - prevScreen) / dt;
      collideCapsule(f.pivot, tip, FLIPPER_R, FLIPPER_BOUNCE, (p) =>
        v(-omega * (p.y - f.pivot.y), omega * (p.x - f.pivot.x)),
      );
    });

    // SRDJAN rollovers light on entry, all six raise the multiplier.
    ROLLOVER_X.forEach((x, i) => {
      const inside = Math.hypot(ball.x - x, ball.y - ROLLOVER_Y) < 12;
      if (inside && !rolloverInside[i] && !lit[i] && !tilted) {
        lit[i] = true;
        addScore(50, x, ROLLOVER_Y - 20);
        if (lit.every(Boolean)) {
          lit = LETTERS.map(() => false);
          if (mult < MAX_MULT) mult += 1;
          score += 5000;
          float(`SRDJAN  x${mult}`, 190, 200);
          updateHud();
        }
      }
      rolloverInside[i] = inside;
    });

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > MAX_SPEED) {
      ball.vx *= MAX_SPEED / speed;
      ball.vy *= MAX_SPEED / speed;
    }
  };

  const drain = () => {
    if (saveTimer > 0 && !tilted) {
      float('BALL SAVED', 190, 380);
      newBall();
      return;
    }
    balls -= 1;
    if (balls <= 0) return gameOver();
    ballNo += 1;
    float(tilted ? 'TILT' : 'BALL LOST', 190, 380);
    newBall();
    updateHud();
  };

  const update = (dt: number) => {
    flippers.forEach((f) => {
      const target = f.pressed && !tilted ? FLIPPER_UP : FLIPPER_REST;
      const speed = (f.pressed && !tilted ? FLIPPER_UP_SPEED : FLIPPER_DOWN_SPEED) * dt;
      f.prev = f.angle;
      f.angle = f.angle > target ? Math.max(target, f.angle - speed) : Math.min(target, f.angle + speed);
    });

    // The flipper sweep is spread over the substeps so a fast flip can't skip
    // through the ball.
    const sub = dt / SUBSTEPS;
    const start = flippers.map((f) => f.prev);
    const end = flippers.map((f) => f.angle);
    for (let s = 1; s <= SUBSTEPS; s++) {
      flippers.forEach((f, i) => {
        f.prev = start[i] + ((end[i] - start[i]) * (s - 1)) / SUBSTEPS;
        f.angle = start[i] + ((end[i] - start[i]) * s) / SUBSTEPS;
      });
      physicsStep(sub);
    }

    if (charging) charge = Math.min(1, charge + dt / PLUNGER_CHARGE);
    if (saveTimer > 0 && !inLane) saveTimer -= dt;
    if (nudges > 0) nudges = Math.max(0, nudges - dt / NUDGE_DECAY);
    cooldowns.forEach((t, id) => cooldowns.set(id, t - dt));
    flashes.forEach((t, id) => flashes.set(id, t - dt));
    bumpers.forEach((b) => (b.flash = Math.max(0, b.flash - dt)));
    floaters.forEach((f) => {
      f.life -= dt;
      f.y -= 30 * dt;
    });
    floaters = floaters.filter((f) => f.life > 0);

      if (ball.y > H + 20) drain();
  };

  const ballOnPlunger = () => inLane && ball.y > 540 && Math.abs(ball.vy) < 40;

  const launch = () => {
    if (!ballOnPlunger()) {
      charge = 0;
      return;
    }
    ball.vy = -(PLUNGER_MIN + (PLUNGER_MAX - PLUNGER_MIN) * charge);
    ball.vx = 0;
    saveTimer = BALL_SAVE;
    charge = 0;
  };

  const nudge = () => {
    if (tilted || inLane) return;
    ball.vx += (Math.random() < 0.5 ? -1 : 1) * 120;
    ball.vy -= 90;
    nudges += 1;
    if (nudges >= TILT_AT) {
      tilted = true;
      float('TILT', 190, 300);
    } else if (nudges >= TILT_AT - 1) {
      float('WARNING', 190, 300);
    }
  };

  const strokeLine = (a: Vec, b: Vec, width: number, color: string | CanvasGradient) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const drawBumper = (b: Bumper) => {
    if (b.post) {
      // Rubber post: an orange ring that flashes white on a hit.
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#131312';
      ctx.fill();
      ctx.strokeStyle = b.flash > 0 ? '#ffffff' : '#ff5722';
      ctx.lineWidth = 3;
      ctx.stroke();
      return;
    }
    ctx.save();
    ctx.translate(b.x, b.y);
    const lit = b.flash > 0;
    const disc = ctx.createLinearGradient(-b.r, -b.r, b.r, b.r);
    disc.addColorStop(0, lit ? '#ffffff' : '#ffd54d');
    disc.addColorStop(1, lit ? '#ffd54d' : '#c98f00');
    ctx.shadowColor = brand;
    ctx.shadowBlur = lit ? 30 : 14;
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 4, 0, Math.PI * 2);
    ctx.stroke();
    const scale = b.r / 10;
    ctx.translate(-6 * scale, -6 * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#131312';
    ctx.fill(robot, 'evenodd');
    ctx.restore();
  };

  const drawFlipper = (f: Flipper) => {
    const { tip } = flipperEnds(f);
    const gradient = ctx.createLinearGradient(f.pivot.x, f.pivot.y, tip.x, tip.y);
    gradient.addColorStop(0, tilted ? '#6b6b6b' : brand);
    gradient.addColorStop(1, tilted ? '#3a3a3a' : '#c98f00');
    strokeLine(f.pivot, tip, FLIPPER_R * 2, gradient);
    ctx.fillStyle = '#131312';
    ctx.beginPath();
    ctx.arc(f.pivot.x, f.pivot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPanel = (x: number, y: number, h: number, title: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, 170, h, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), x + 85, y + 24);
  };

  const drawLetter = (letter: string, x: number, y: number, on: boolean, size = 11) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    if (on) {
      ctx.shadowColor = brand;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = on ? brand : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = on ? brand : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = on ? '#131312' : 'rgba(255, 255, 255, 0.7)';
    ctx.font = `700 ${Math.round(size * 1.1)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y + 1);
    ctx.restore();
  };

  /* Left: SRDJAN letters and multiplier. Right: plunger power and ball save. */
  const drawPanels = () => {
    const leftX = OX - 40 - 170;
    drawPanel(leftX, 20, 170, 'srdjan');
    LETTERS.forEach((l, i) => drawLetter(l, leftX + 22 + i * 25, 70, lit[i], 10));
    ctx.fillStyle = brand;
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`x${mult}`, leftX + 85, 125);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`BUMPERS ${Math.min(bumperHits, EXTRA_BALL_HITS)}/${EXTRA_BALL_HITS}`, leftX + 85, 160);

    const rightX = OX + TABLE_W + 40;
    drawPanel(rightX, 20, 170, 'launch');
    ctx.beginPath();
    ctx.roundRect(rightX + 20, 50, 130, 14, 7);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    if (charge > 0) {
      ctx.beginPath();
      ctx.roundRect(rightX + 20, 50, 130 * charge, 14, 7);
      ctx.fillStyle = brand;
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('HOLD SPACE', rightX + 85, 85);
    const saveOn = saveTimer > 0;
    ctx.fillStyle = saveOn ? brand : 'rgba(255, 255, 255, 0.3)';
    ctx.font = `700 14px ${FONT}`;
    ctx.fillText(tilted ? 'TILT' : saveOn ? 'BALL SAVE ON' : 'BALL SAVE OFF', rightX + 85, 125);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = `12px ${FONT}`;
    ctx.fillText(nudges >= TILT_AT - 1 && !tilted ? 'EASY ON THE NUDGE' : ' ', rightX + 85, 155);
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    drawPanels();

    ctx.save();
    ctx.translate(OX, 0);

    // Table glass inside the walls.
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(0, 210);
    ctx.arc(210, 210, 210, Math.PI, Math.PI * 2);
    ctx.lineTo(TABLE_W, 600);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 5, 1, 0.55)';
    ctx.fill();

    // Table art: the big AI agent with SRDJAN in capitals under it.
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.translate(190 - 36, 380);
    ctx.scale(6, 6);
    ctx.fillStyle = brand;
    ctx.fill(robot, 'evenodd');
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = brand;
    ctx.font = `700 40px ${FONT}`;
    ctx.letterSpacing = '8px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SRDJAN', 194, 490);
    ctx.restore();

    // SRDJAN rollover letters, lit once the ball rolls over them.
    ROLLOVER_X.forEach((x, i) => drawLetter(LETTERS[i], x, ROLLOVER_Y, lit[i]));

    walls.forEach((w) => {
      const flash = (flashes.get(w.id ?? '') ?? 0) > 0;
      if (w.spring) {
        // Springs are drawn as a coil along the side wall.
        ctx.strokeStyle = flash ? '#ffffff' : brand;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const side = w.a.x < TABLE_W / 2 ? -1 : 1;
        for (let i = 0; i <= 12; i++) {
          const y = w.a.y + ((w.b.y - w.a.y) * i) / 12;
          ctx.lineTo(w.a.x + (i % 2 ? side * 5 : 0), y);
        }
        ctx.stroke();
      } else if (w.kick) {
        strokeLine(w.a, w.b, 6, flash ? '#ffffff' : '#ff5722');
      } else {
        strokeLine(w.a, w.b, w.r * 2 + 1, w.gate ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)');
      }
    });

    bumpers.forEach(drawBumper);

    // Plunger spring, squeezed down while charging.
    const springTop = BALL_START.y + BALL_R + 2 + charge * 8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const y = springTop + ((582 - springTop) * i) / 8;
      ctx.lineTo(i % 2 ? 392 : 408, y);
    }
    ctx.stroke();

    flippers.forEach(drawFlipper);

    // The ball: a polished steel sphere.
    const shine = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, BALL_R);
    shine.addColorStop(0, '#ffffff');
    shine.addColorStop(0.5, '#c8c8c8');
    shine.addColorStop(1, '#5a5a5a');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    floaters.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
      ctx.fillStyle = brand;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const loop = (time: number) => {
    if (state !== 'playing') return;
    const dt = Math.min(1 / 30, (time - lastTime) / 1000);
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

  const releaseControls = () => {
    flippers.forEach((f) => (f.pressed = false));
    charging = false;
    charge = 0;
  };

  const play = () => {
    if (state === 'playing') return;
    if (state === 'over' || state === 'ready') reset();
    state = 'playing';
    overlay.hidden = true;
    releaseControls();
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
    releaseControls();
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
    balls = 0;
    draw();
    showOverlay('Game over', `You scored ${score}. Best: ${best}.`, 'Play again');
  }

  const LEFT_KEYS = ['ArrowLeft', 'KeyA', 'KeyZ'];
  const RIGHT_KEYS = ['ArrowRight', 'KeyD', 'KeyM'];

  startBtn.addEventListener('click', play);

  window.addEventListener('keydown', (e) => {
    if (state === 'paused' && e.code === 'KeyP') {
      e.preventDefault();
      play();
      return;
    }
    if (state !== 'playing') return;
    if (LEFT_KEYS.includes(e.code)) {
      e.preventDefault();
      flippers[0].pressed = true;
    } else if (RIGHT_KEYS.includes(e.code)) {
      e.preventDefault();
      flippers[1].pressed = true;
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) charging = true;
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (!e.repeat) nudge();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      pause();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (LEFT_KEYS.includes(e.code)) flippers[0].pressed = false;
    if (RIGHT_KEYS.includes(e.code)) flippers[1].pressed = false;
    if (e.code === 'Space' && charging) {
      charging = false;
      if (state === 'playing') launch();
    }
  });
  window.addEventListener('blur', releaseControls);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  canvas.tabIndex = -1;
  new ResizeObserver(resize).observe(canvas);
  reset();
  resize();
}

initPinball();
/* Pinball game END */
