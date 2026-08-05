/* ============================================================
   CONFETTI.JS
   A small, dependency-free confetti burst used on the
   confirmation page. Draws rectangles that fall + spin on a
   full-screen canvas, then removes itself when they're off
   screen or time runs out. Respects prefers-reduced-motion.
   ============================================================ */

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const colors = ["#C6A15B", "#E7CE9A", "#A15A34", "#6E7F5C", "#F5EFDF"];
  const count = window.innerWidth < 600 ? 90 : 160;
  const pieces = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 220,
    y: canvas.height * 0.32 + (Math.random() - 0.5) * 60,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 10,
    color: colors[(Math.random() * colors.length) | 0],
    vx: (Math.random() - 0.5) * 9,
    vy: -(Math.random() * 9 + 6),
    gravity: 0.32 + Math.random() * 0.1,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    drag: 0.985,
  }));

  const start = performance.now();
  const duration = 3200;

  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < duration) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
