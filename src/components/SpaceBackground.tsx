'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  colorDark: string;
  colorLight: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // Dark Mode Observer to adapt colors in real-time
    let isDark = document.documentElement.classList.contains('dark');
    const classObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    classObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Dark theme cosmic colors
    const colorsDark = [
      '#ffffff', // Pure starlight
      '#38bdf8', // Cyan / Sky 400
      '#60a5fa', // Electric blue 400
      '#818cf8', // Indigo 400
      '#c084fc', // Neon purple 400
      '#34d399', // Emerald starlight
    ];

    // Light theme cosmic colors (vibrant, high contrast against white)
    const colorsLight = [
      '#0284c7', // Sky 600
      '#2563eb', // Blue 600
      '#4f46e5', // Indigo 600
      '#7c3aed', // Purple 600
      '#0891b2', // Cyan 600
      '#059669', // Emerald 600
    ];

    // Create particles based on screen area
    const particleCount = Math.min(Math.floor((width * height) / 10000), 105);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseOpacity = Math.random() * 0.6 + 0.35;
      const colorIdx = Math.floor(Math.random() * colorsDark.length);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 1.0,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35 - 0.05,
        opacity: baseOpacity,
        baseOpacity,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        colorDark: colorsDark[colorIdx],
        colorLight: colorsLight[colorIdx],
      });
    }

    // Shooting stars system
    const shootingStars: ShootingStar[] = [];
    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.85,
        y: Math.random() * (height * 0.45),
        length: Math.random() * 90 + 60,
        speed: Math.random() * 7 + 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25, // ~45 deg
        opacity: 1,
        active: true,
      });
    };

    let shootingStarCooldown = 180; // First shooting star appears quickly (~3s)

    // Interactive mouse tracking
    let mouseX = -9999;
    let mouseY = -9999;
    let isMouseOver = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseOver = true;
    };

    const handleMouseLeave = () => {
      isMouseOver = false;
      mouseX = -9999;
      mouseY = -9999;
    };

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Render loop
    let tick = 0;
    const maxConnectDist = 115;
    const maxMouseDist = 145;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Constellation Network (Connecting Lines between close stars)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectDist * maxConnectDist) {
            const dist = Math.sqrt(distSq);
            const lineOpacity = (1 - dist / maxConnectDist) * (isDark ? 0.16 : 0.13);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineOpacity})`
              : `rgba(2, 132, 199, ${lineOpacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
            ctx.restore();
          }
        }

        // Connect to mouse if nearby
        if (isMouseOver) {
          const mdx = p1.x - mouseX;
          const mdy = p1.y - mouseY;
          const mDistSq = mdx * mdx + mdy * mdy;

          if (mDistSq < maxMouseDist * maxMouseDist) {
            const mDist = Math.sqrt(mDistSq);
            const mLineOpacity = (1 - mDist / maxMouseDist) * (isDark ? 0.38 : 0.3);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${mLineOpacity})`
              : `rgba(37, 99, 235, ${mLineOpacity})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
            ctx.restore();

            // Gentle interactive push away from cursor
            const force = (1 - mDist / maxMouseDist) * 0.45;
            p1.x += (mdx / mDist) * force;
            p1.y += (mdy / mDist) * force;
          }
        }
      }

      // 2. Draw Stars & Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Twinkle
        p.opacity = p.baseOpacity + Math.sin(tick * p.twinkleSpeed) * 0.22;
        const currentOpacity = Math.max(0.2, Math.min(1, p.opacity));
        const particleColor = isDark ? p.colorDark : p.colorLight;

        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = particleColor;

        // Core star dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing glow aura for larger nodes
        if (p.size > 1.6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.globalAlpha = currentOpacity * (isDark ? 0.22 : 0.16);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Shooting Stars spawn (~every 5-7 seconds)
      shootingStarCooldown--;
      if (shootingStarCooldown <= 0) {
        spawnShootingStar();
        shootingStarCooldown = Math.floor(Math.random() * 200 + 260); // 4-7s interval
      }

      // 4. Draw Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) continue;

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.015;

        if (s.opacity <= 0 || s.x > width || s.y > height) {
          s.active = false;
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        ctx.save();
        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        if (isDark) {
          gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
          gradient.addColorStop(0.3, `rgba(56, 189, 248, ${s.opacity * 0.85})`);
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        } else {
          gradient.addColorStop(0, `rgba(37, 99, 235, ${s.opacity})`);
          gradient.addColorStop(0.3, `rgba(2, 132, 199, ${s.opacity * 0.85})`);
          gradient.addColorStop(1, 'rgba(2, 132, 199, 0)');
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      classObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep Space Cosmic Gradient Base */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#060814] transition-colors duration-500" />

      {/* Cosmic Nebula Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 dark:bg-blue-600/15 blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-purple-600/10 dark:bg-purple-600/15 blur-3xl animate-pulse-glow [animation-delay:2s]" />
      <div className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl animate-pulse-glow [animation-delay:4s]" />

      {/* Space Grid Layer (Futuristic coordinate matrix) */}
      <div
        className="absolute inset-0 opacity-45 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 88%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 88%)',
        }}
      />

      {/* Perspective Horizon Ground Grid (Sci-fi Tron Space Grid at the bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 opacity-30 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.28) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.28) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(400px) rotateX(60deg) scale(1.5)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Interactive Space Canvas: Constellation Nodes, Stars & Shooting Stars */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
