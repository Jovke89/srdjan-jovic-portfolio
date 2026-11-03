/* Water ripples START */
/* A real ripple simulation (two height buffers, wave propagation with damping) on a
   low resolution canvas over a statue gradient. The mouse drags a "finger" through the
   water, rings spread out and fade. The canvas only draws light and shade of the waves,
   the CSS gradient stays visible below. The loop stops when the water is calm.
   Used by the CTA card and the pricing process image (desktop with a mouse only). */
export function initWaterRipple(water: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const SCALE = 2; // one simulation cell per 2 CSS pixels, upscaled smoothly
  const DAMPING = 0.982;
  let w = 0;
  let h = 0;
  let cur = new Float32Array(0);
  let prev = new Float32Array(0);
  let image: ImageData | null = null;
  let frame = 0;
  let lastX = -1;
  let lastY = -1;

  const resize = () => {
    w = Math.max(2, Math.ceil(canvas.clientWidth / SCALE));
    h = Math.max(2, Math.ceil(canvas.clientHeight / SCALE));
    canvas.width = w;
    canvas.height = h;
    cur = new Float32Array(w * h);
    prev = new Float32Array(w * h);
    image = ctx.createImageData(w, h);
  };

  // Push the water down in a small round spot
  const drop = (x: number, y: number, strength: number) => {
    const r = 2;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1 || dx * dx + dy * dy > r * r) continue;
        prev[py * w + px] += strength * (1 - Math.hypot(dx, dy) / (r + 1));
      }
    }
  };

  const step = () => {
    let energy = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = ((cur[i - 1] + cur[i + 1] + cur[i - w] + cur[i + w]) / 2 - prev[i]) * DAMPING;
        prev[i] = v;
        energy += v < 0 ? -v : v;
      }
    }
    [cur, prev] = [prev, cur];
    return energy;
  };

  // Light where the wave faces up-left, soft purple shade where it faces away
  const draw = () => {
    if (!image) return;
    const px = image.data;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const slope = (cur[i - 1] - cur[i + 1]) + (cur[i - w] - cur[i + w]);
        const o = i * 4;
        if (slope > 0) {
          px[o] = 255; px[o + 1] = 255; px[o + 2] = 255;
          px[o + 3] = Math.min(190, slope * 3.2);
        } else {
          px[o] = 70; px[o + 1] = 30; px[o + 2] = 150;
          px[o + 3] = Math.min(120, -slope * 2.2);
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  const loop = () => {
    const energy = step();
    draw();
    if (energy < 0.5 * w * h * 0.001) {
      cur.fill(0);
      prev.fill(0);
      draw();
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(loop);
  };

  water.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) / SCALE);
    const y = Math.round((e.clientY - r.top) / SCALE);
    // Fill the path between two moves, so a fast drag leaves a continuous trail
    if (lastX >= 0) {
      const steps = Math.max(1, Math.ceil(Math.hypot(x - lastX, y - lastY) / 2));
      for (let s = 1; s <= steps; s++) {
        drop(Math.round(lastX + ((x - lastX) * s) / steps), Math.round(lastY + ((y - lastY) * s) / steps), 26);
      }
    } else {
      drop(x, y, 50);
    }
    lastX = x;
    lastY = y;
    if (!frame) frame = requestAnimationFrame(loop);
  });
  water.addEventListener('pointerleave', () => {
    lastX = -1;
    lastY = -1;
  });

  new ResizeObserver(resize).observe(water);
  resize();
}
/* Water ripples END */
