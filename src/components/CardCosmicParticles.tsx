'use client';

import React from 'react';

interface CardCosmicParticlesProps {
  variant?: 'blue' | 'purple' | 'cyan' | 'mixed';
  density?: 'low' | 'normal';
}

export default function CardCosmicParticles({
  variant = 'blue',
  density = 'normal',
}: CardCosmicParticlesProps) {
  // Pre-calculated particle positions to ensure stable hydration without layout shift
  const particles = [
    { top: '15%', left: '10%', size: 2, delay: '0s', duration: '3s', opacity: 0.6 },
    { top: '65%', left: '22%', size: 3, delay: '1.2s', duration: '4s', opacity: 0.8 },
    { top: '25%', left: '78%', size: 2.5, delay: '0.5s', duration: '3.5s', opacity: 0.7 },
    { top: '80%', left: '85%', size: 2, delay: '2s', duration: '4.5s', opacity: 0.5 },
    { top: '45%', left: '50%', size: 3.5, delay: '1.8s', duration: '3.2s', opacity: 0.9 },
    { top: '10%', left: '92%', size: 1.5, delay: '0.8s', duration: '2.8s', opacity: 0.6 },
    { top: '88%', left: '12%', size: 2.5, delay: '2.3s', duration: '4s', opacity: 0.75 },
    { top: '50%', left: '5%', size: 1.8, delay: '1.5s', duration: '3.8s', opacity: 0.5 },
  ];

  const nebulaColors = {
    blue: 'from-blue-600/15 via-indigo-600/10 to-transparent',
    purple: 'from-purple-600/15 via-indigo-600/10 to-transparent',
    cyan: 'from-cyan-500/15 via-blue-600/10 to-transparent',
    mixed: 'from-blue-600/15 via-cyan-500/10 to-purple-600/15',
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-0" aria-hidden="true">
      {/* Subtle Space Grid Overlay */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
        }}
      />

      {/* Cosmic Nebula Glow */}
      <div className={`absolute -top-12 -left-12 w-44 h-44 rounded-full bg-gradient-to-br ${nebulaColors[variant]} blur-2xl`} />
      <div className={`absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-tl ${nebulaColors[variant]} blur-2xl`} />

      {/* Floating Stardust Particles */}
      {particles.slice(0, density === 'low' ? 5 : 8).map((p, idx) => (
        <span
          key={idx}
          className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse-glow"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
