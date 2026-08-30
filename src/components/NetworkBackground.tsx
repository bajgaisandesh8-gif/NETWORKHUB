import React, { useEffect, useRef, useState } from 'react';

export const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Subtle canvas animation of connected network nodes and traveling packet bursts
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create sparse, elegant background nodes
    const nodeCount = Math.floor(Math.min(width, 1600) / 75);
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.5 + 1,
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Packet pulse traveling along links
    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
      color: string;
    }
    const packets: Packet[] = [];

    const colors = ['#38bdf8', '#34d399', '#818cf8', '#a78bfa'];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.beginPath();
        const r = n.radius + Math.sin(n.pulse) * 0.4;
        ctx.arc(n.x, n.y, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();

        // Connect adjacent nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();

            // Randomly spawn traveling packet
            if (packets.length < 5 && Math.random() < 0.001) {
              packets.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.008 + Math.random() * 0.008,
                color: colors[Math.floor(Math.random() * colors.length)]
              });
            }
          }
        }
      }

      // Draw active packet pulses
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        pkt.progress += pkt.speed;

        const src = nodes[pkt.fromIndex];
        const dst = nodes[pkt.toIndex];

        if (!src || !dst || pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const curX = src.x + (dst.x - src.x) * pkt.progress;
        const curY = src.y + (dst.y - src.y) * pkt.progress;

        ctx.beginPath();
        ctx.arc(curX, curY, 2, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  const floatingBadges = [
    { text: 'PACKET FLOW', top: '12%', left: '8%', delay: '0s' },
    { text: '192.168.10.0/24', top: '24%', right: '10%', delay: '2s' },
    { text: 'VLAN 20', top: '55%', left: '5%', delay: '4s' },
    { text: 'TTL 64', top: '78%', left: '14%', delay: '1s' },
    { text: 'TCP/IP', top: '38%', right: '7%', delay: '3s' },
    { text: 'OSPF AREA 0', top: '70%', right: '12%', delay: '5s' },
    { text: '10 Gbps SFP+', top: '88%', right: '22%', delay: '2.5s' },
    { text: 'NETWORK READY', top: '16%', right: '35%', delay: '4.5s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-40">
      {/* Background canvas for live node mesh & traveling packets */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Floating Technical Labels (High contrast, very low opacity, non-intrusive) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden">
          {floatingBadges.map((badge, idx) => (
            <span
              key={idx}
              style={{
                top: badge.top,
                left: badge.left,
                right: badge.right,
                animationDelay: badge.delay,
              }}
              className="absolute text-[10px] font-mono font-medium tracking-wider text-cyan-500/20 uppercase animate-pulse border border-cyan-500/10 px-2 py-0.5 rounded bg-slate-950/20"
            >
              {badge.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
