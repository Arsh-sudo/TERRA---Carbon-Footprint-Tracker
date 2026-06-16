import React, { useEffect, useRef } from "react";

// Helper to draw a beautiful leaf shape on canvas
function drawLeafShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number,
  isDark: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  
  // Left side of leaf (made fatter/thicker by increasing the curve tension to 1.5)
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(-size * 1.4, -size * 0.1, 0, size);
  
  // Right side of leaf
  ctx.quadraticCurveTo(size * 1.4, -size * 0.1, 0, -size);
  
  // Green color fill (richer values for light mode)
  ctx.fillStyle = isDark ? `rgba(168, 191, 145, ${alpha})` : `rgba(110, 142, 85, ${alpha})`;
  ctx.shadowBlur = isDark ? 10 : 15;
  ctx.shadowColor = isDark ? `rgba(168, 191, 145, ${alpha})` : `rgba(110, 142, 85, ${alpha})`;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Central Vein
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.strokeStyle = isDark ? `rgba(120, 140, 100, ${alpha * 0.4})` : `rgba(80, 105, 60, ${alpha * 0.5})`;
  ctx.lineWidth = Math.max(0.7, size * 0.12);
  ctx.stroke();
  
  ctx.restore();
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const leavesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    angle: number;
    spin: number;
    alpha: number;
    decay: number;
  }[]>([]);
  const lastSpawnRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Drop green leaves along the trail
      const lastSpawn = lastSpawnRef.current;
      if (lastSpawn.x === 0 && lastSpawn.y === 0) {
        lastSpawnRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const dx = e.clientX - lastSpawn.x;
      const dy = e.clientY - lastSpawn.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 18) { // Spawn a cute small leaf every 18 pixels of movement
        leavesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.6, // Minimal horizontal drift
          vy: Math.random() * 0.5 + 0.4,   // Gentle falling rate
          size: Math.random() * 3.5 + 4,   // Small dainty leaves
          angle: Math.random() * Math.PI * 2, // Random starting angle
          spin: (Math.random() - 0.5) * 0.05, // Slow spin velocity
          alpha: 0.9,                      // Opaque start
          decay: Math.random() * 0.008 + 0.006 // Slow fade-to-zero in ~120-150 frames
        });
        lastSpawnRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Particle representation
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseColor: string;
      alpha: number;
      angle: number;
      speed: number;
    }

    const particles: Particle[] = [];
    const particleCount = 180;

    // Detect if dark mode is active on documentElement
    const isDarkMode = () => document.documentElement.classList.contains("dark");

    const dark = isDarkMode();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 3.5 + 2.0, // Thicker, larger particles
        baseColor: "#a3b18a", // Sage/Moss palette
        alpha: dark ? (Math.random() * 0.3 + 0.15) : (Math.random() * 0.35 + 0.45), // Substantially brighter in light mode
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.2,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dark = isDarkMode();
      const currentMouse = mouseRef.current;

      const particleColor = dark ? "rgba(154, 176, 131," : "rgba(110, 138, 90,";

      // 2.5 Update and draw dropped green leaves
      const leaves = leavesRef.current;
      for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];
        
        // Update kinematics/physics
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.angle += leaf.spin;
        leaf.alpha -= leaf.decay;

        // Clean up out of bounds or fully transparent leaves
        if (leaf.alpha <= 0 || leaf.y > canvas.height + 20) {
          leaves.splice(i, 1);
        } else {
          // Render leaf shape
          drawLeafShape(ctx, leaf.x, leaf.y, leaf.size, leaf.angle, leaf.alpha, dark);
        }
      }

      // 3. Draw & update particles
      particles.forEach((p) => {
        // Natural drift
        p.angle += 0.005;
        p.x += p.vx + Math.cos(p.angle) * p.speed * 0.3;
        p.y += p.vy + Math.sin(p.angle) * p.speed * 0.3;

        // Wrap around screen boundaries nicely
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Cursor attraction & concentration!
        if (currentMouse.x !== null && currentMouse.y !== null) {
          const dx = currentMouse.x - p.x;
          const dy = currentMouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Concentration radius
          if (distance < 280) {
            // Apply a gentle force drawing them inwards
            const force = (280 - distance) / 280;
            // Particles accelerate closer
            p.x += (dx / distance) * force * 1.8;
            p.y += (dy / distance) * force * 1.8;
            
            // Brighten up slightly as they concentrate near cursor!
            p.alpha = Math.min(0.75, p.alpha + 0.015);
          } else {
            // Gradually decay back to default baseline opacity
            p.alpha = Math.max(dark ? 0.12 : 0.42, p.alpha - 0.005);
          }
        } else {
          p.alpha = Math.max(dark ? 0.12 : 0.42, p.alpha - 0.005);
        }

        // Render particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particleColor}${p.alpha})`;
        
        ctx.shadowBlur = dark ? 8 : 12;
        ctx.shadowColor = dark ? `rgba(154, 176, 131, ${p.alpha})` : `rgba(110, 138, 90, ${p.alpha})`;
        
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Simple connection lines between very close particles to look tech-organic
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (85 - dist) / 85 * (dark ? 0.06 : 0.16);
            ctx.strokeStyle = dark ? `rgba(154, 176, 131, ${lineAlpha})` : `rgba(110, 138, 90, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="particle-canvas-bg" ref={canvasRef} />;
}
