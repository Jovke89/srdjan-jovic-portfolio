/* Animated gradient-blob background. Ported verbatim from the Webflow
   "SITE BG/CANVAS ANIMATION" head embed. Desktop only, respects reduced motion. */
export function initHeroCanvas(): () => void {
  const canvas = document.getElementById('heroCanvas') as HTMLCanvasElement | null;
  if (!canvas || window.innerWidth <= 991) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  /* Render at half resolution and let CSS stretch it to the viewport: the blobs
     are soft gradients, so this looks identical while filling 4x fewer pixels
     every frame. Drawing still uses viewport (CSS px) coordinates. */
  const SCALE = 0.5;
  let width = window.innerWidth;
  let height = window.innerHeight;
  const sizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * SCALE);
    canvas.height = Math.round(height * SCALE);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  };
  sizeCanvas();

  /* `document.body.scrollHeight` forces a layout read; caching it and only
     recomputing on resize (instead of every animation frame) avoids doing
     that read 60x/sec for the lifetime of the page. */
  let maxScroll = document.body.scrollHeight - window.innerHeight;
  const onResize = () => {
    sizeCanvas();
    maxScroll = document.body.scrollHeight - window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const onMove = (event: MouseEvent) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  };
  document.addEventListener('mousemove', onMove);

  function hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  function lerpColor(hex1: string, hex2: string, t: number): string {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  const colorPhases = [
    ['#ff5722', '#7c3aed', '#2563eb'],
    ['#7c3aed', '#0d9488', '#ec4899'],
    ['#0d9488', '#2563eb', '#6d28d9'],
  ];
  function getCurrentColors(): string[] {
    const scrolled = window.scrollY;
    const progress = Math.min(scrolled / maxScroll, 1);
    if (progress < 0.33) {
      const t = progress / 0.33;
      return [
        lerpColor(colorPhases[0][0], colorPhases[1][0], t),
        lerpColor(colorPhases[0][1], colorPhases[1][1], t),
        lerpColor(colorPhases[0][2], colorPhases[1][2], t),
      ];
    }
    if (progress < 0.66) {
      const t = (progress - 0.33) / 0.33;
      return [
        lerpColor(colorPhases[1][0], colorPhases[2][0], t),
        lerpColor(colorPhases[1][1], colorPhases[2][1], t),
        lerpColor(colorPhases[1][2], colorPhases[2][2], t),
      ];
    }
    const t = (progress - 0.66) / 0.34;
    return [
      lerpColor(colorPhases[2][0], colorPhases[0][0], t),
      lerpColor(colorPhases[2][1], colorPhases[0][1], t),
      lerpColor(colorPhases[2][2], colorPhases[0][2], t),
    ];
  }

  const blobs = [
    { x: width * 0.2, y: height * 0.3, vx: 0.4, vy: 0.3, size: 350 },
    { x: width * 0.6, y: height * 0.5, vx: -0.3, vy: 0.5, size: 300 },
    { x: width * 0.8, y: height * 0.2, vx: 0.5, vy: -0.4, size: 320 },
  ];
  function drawBlob(blob: (typeof blobs)[number], color: string) {
    const gradient = ctx!.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.size);
    gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.6)'));
    gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'));
    ctx!.fillStyle = gradient;
    ctx!.beginPath();
    ctx!.arc(blob.x, blob.y, blob.size, 0, Math.PI * 2);
    ctx!.fill();
  }

  let raf = 0;
  function animate() {
    ctx!.clearRect(0, 0, width, height);
    const colors = getCurrentColors();
    blobs.forEach((blob, index) => {
      blob.x += (mouse.x - blob.x) * 0.003 * (index + 1) * 0.3;
      blob.y += (mouse.y - blob.y) * 0.003 * (index + 1) * 0.3;
      blob.x += blob.vx;
      blob.y += blob.vy;
      if (blob.x > width + blob.size) blob.x = -blob.size;
      if (blob.x < -blob.size) blob.x = width + blob.size;
      if (blob.y > height + blob.size) blob.y = -blob.size;
      if (blob.y < -blob.size) blob.y = height + blob.size;
      drawBlob(blob, colors[index]);
    });
    raf = requestAnimationFrame(animate);
  }
  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('mousemove', onMove);
  };
}
