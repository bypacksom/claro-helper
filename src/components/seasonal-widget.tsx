import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SeasonalMode = "halloween" | "navidad";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

const CANDY_COLORS = [
  "#e0402f",
  "#f59e0b",
  "#a855f7",
  "#22a55a",
  "#eab308",
  "#e05a8a",
  "#3b82f6",
];

// Full viewport particle field: the floor is the bottom edge of the screen.
// Gravity and launch velocity use the same units (CSS pixels per animation frame).
const GRAVITY = 0.32;
const FLOOR_PADDING = 8;
const floorY = (height: number, particleSize: number) =>
  height - FLOOR_PADDING - particleSize * 0.5;

/**
 * Widget estacional con física simple:
 * - Halloween: calabaza que al agitarla hace volar los dulces del piso.
 * - Navidad: bola de cristal que al agitarla hace subir y caer la nieve.
 */
export function SeasonalWidget({ theme }: { theme: string }) {
  const mode: SeasonalMode | null =
    theme === "halloween" ? "halloween" : theme === "navidad" ? "navidad" : null;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastBurstRef = useRef<number>(0);
  const [wiggle, setWiggle] = useState(false);

  const burst = useCallback(() => {
    const now = performance.now();
    if (now - lastBurstRef.current < 280) return;
    lastBurstRef.current = now;
    const parts = particlesRef.current;
    if (!parts.length) return;
    // A ballistic launch that reaches the top of the visible page (rather
    // than only 96px above the floor), with slight variation per particle.
    const launchSpeed = Math.sqrt(
      2 * GRAVITY * Math.max(360, window.innerHeight - FLOOR_PADDING - 20),
    );
    for (const p of parts) {
      p.vy = -launchSpeed * (0.95 + Math.random() * 0.22);
      p.vx = (Math.random() - 0.5) * 9;
      p.vr = (Math.random() - 0.5) * 0.35;
    }
    setWiggle(true);
    window.setTimeout(() => setWiggle(false), 450);
  }, []);

  // Física: gravedad, rebote en el piso y en los bordes, fricción.
  useEffect(() => {
    if (!mode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let disposed = false;
    // Limit canvas resolution slightly to keep full-screen effects smooth.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const seed = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const parts: Particle[] = [];
      if (mode === "halloween") {
        const count = Math.max(24, Math.floor(w / 34));
        for (let i = 0; i < count; i++) {
          const size = 11 + Math.random() * 7;
          parts.push({
            x: Math.random() * (w - 20) + 10,
            y: floorY(h, size),
            vx: 0,
            vy: 0,
            rot: Math.random() * Math.PI,
            vr: 0,
            size,
            color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
          });
        }
      } else {
        const count = Math.max(90, Math.floor(w / 8));
        for (let i = 0; i < count; i++) {
          const size = 2.5 + Math.random() * 3.5;
          parts.push({
            x: Math.random() * w,
            y: floorY(h, size) - Math.random() * 14,
            vx: 0,
            vy: 0,
            rot: 0,
            vr: 0,
            size,
            color: "#ffffff",
          });
        }
      }
      particlesRef.current = parts;
    };
    seed();

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);

    const drawCandy = (p: Particle) => {
      const s = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.95;
      // Envolturas (picos) a los lados
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.75, 0);
      ctx.lineTo(-s * 1.15, -s * 0.38);
      ctx.lineTo(-s * 1.15, s * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.75, 0);
      ctx.lineTo(s * 1.15, -s * 0.38);
      ctx.lineTo(s * 1.15, s * 0.38);
      ctx.closePath();
      ctx.fill();
      // Cuerpo
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.8, s * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Franja clara
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.ellipse(-s * 0.3, 0, s * 0.12, s * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.3, 0, s * 0.12, s * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brillo
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-s * 0.15, -s * 0.2, s * 0.3, s * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSnow = (p: Particle) => {
      ctx.globalAlpha = p.size > 4.5 ? 0.95 : 0.75;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      if (disposed) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      // Only the ground is decorated; the rest of the viewport stays transparent.
      if (mode === "halloween") {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, h - FLOOR_PADDING, w, FLOOR_PADDING);
      } else {
        const grad = ctx.createLinearGradient(0, h - 18, 0, h);
        grad.addColorStop(0, "rgba(255,255,255,0.25)");
        grad.addColorStop(1, "rgba(255,255,255,0.75)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - 18, w, 18);
      }
      for (const p of particlesRef.current) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const ground = floorY(h, p.size);
        if (p.y > ground) {
          p.y = ground;
          if (Math.abs(p.vy) > 0.8) {
            p.vy = -p.vy * 0.38;
            p.vx *= 0.85;
          } else {
            p.vy = 0;
            p.vx *= 0.9;
          }
          p.vr *= 0.9;
        }
        if (p.x < p.size) {
          p.x = p.size;
          p.vx = Math.abs(p.vx) * 0.6;
        }
        if (p.x > w - p.size) {
          p.x = w - p.size;
          p.vx = -Math.abs(p.vx) * 0.6;
        }
        if (mode === "halloween") drawCandy(p);
        else drawSnow(p);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [mode]);

  // Agitado: detecta movimiento rápido del puntero sobre el botón.
  const dragRef = useRef<{ lastX: number; lastY: number; moved: number; bursted: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { lastX: e.clientX, lastY: e.clientY, moved: 0, bursted: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    d.moved += Math.abs(e.clientX - d.lastX) + Math.abs(e.clientY - d.lastY);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (d.moved > 40 && !d.bursted) {
      d.bursted = true;
      burst();
    }
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    // Un toque corto también sacude.
    if (d && !d.bursted && d.moved < 40) burst();
  };

  if (!mode || typeof document === "undefined") return null;

  // Portaling to <body> keeps particles above cards, sticky headers and any
  // dashboard stacking context without intercepting interactions.
  return createPortal(
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999]"
      />
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={mode === "halloween" ? "Calabaza de Halloween: agítame" : "Bola de cristal de nieve: agítame"}
        title="¡Agítame!"
        className={`fixed bottom-3 right-5 z-[10000] select-none touch-none outline-none ${
          wiggle
            ? "animate-[seasonal-wiggle_0.45s_ease-in-out]"
            : "transition-transform hover:scale-110"
        }`}
      >
        {mode === "halloween" ? (
          <span className="block text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">🎃</span>
        ) : (
          <span className="relative block">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-gradient-to-b from-sky-200/90 via-white/80 to-white/95 text-2xl shadow-[0_4px_14px_rgba(120,170,255,0.55)] backdrop-blur-sm">
              ⛄
            </span>
            <span className="mx-auto -mt-1 block h-2.5 w-12 rounded-b-md bg-amber-800/90 shadow-md" />
          </span>
        )}
      </button>
      <style>{`
        @keyframes seasonal-wiggle {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-14deg) scale(1.12); }
          50% { transform: rotate(12deg) scale(1.05); }
          75% { transform: rotate(-8deg) scale(1.1); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </>,
    document.body,
  );
}
