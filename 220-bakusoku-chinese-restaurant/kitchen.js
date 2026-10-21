class HighHeatKitchen {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.particles = [];
        this.lastTime = performance.now();
        this.tossPhase = 0;
        this.lastToss = 0;
        this.flare = 0.4;
        this.heat = 0.35;
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas.parentElement || canvas);
        this.resize();
        requestAnimationFrame((time) => this.frame(time));
    }

    resize() {
        const host = this.canvas.parentElement || this.canvas;
        const rect = host.getBoundingClientRect();
        const cssW = Math.max(rect.width, host.clientWidth, 200);
        const cssH = Math.max(rect.height, host.clientHeight, 140);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
        this.canvas.style.width = `${cssW}px`;
        this.canvas.style.height = `${cssH}px`;
        this.dpr = dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = cssW;
        this.height = cssH;
    }

    targetHeat() {
        const gs = window.GameState;
        if (!gs) return 0.35;
        if (!gs.isPlaying) return 0.28;
        let heat = 0.45;
        gs.cookers.forEach((c) => {
            if (c.status === 'cooking') heat += 0.7;
            else if (c.status === 'ready') heat += 0.35;
        });
        return Math.min(2, heat + this.flare * 0.8);
    }

    ignite() {
        this.flare = 1;
        this.heat = Math.max(this.heat, 1.2);
        this.burst(10, 'food');
        this.burst(12, 'spark');
    }

    burst(count, kind) {
        const cx = this.width * 0.5;
        const baseY = this.height * 0.78;
        for (let i = 0; i < count; i++) {
            const food = kind === 'food';
            this.particles.push({
                kind,
                x: cx + (Math.random() - 0.5) * 70,
                y: baseY - 10,
                vx: (Math.random() - 0.5) * (food ? 90 : 50),
                vy: -(food ? 80 + Math.random() * 70 : 100 + Math.random() * 90),
                life: food ? 0.65 : 0.4,
                size: food ? 4 + Math.random() * 5 : 2 + Math.random() * 4,
                hue: food ? [28, 40, 12][i % 3] : 28 + Math.random() * 20
            });
        }
    }

    drawWok(ctx, x, y, angle, lift) {
        ctx.save();
        ctx.translate(x, y - lift);
        ctx.rotate(angle);
        ctx.fillStyle = '#2c3133';
        ctx.beginPath();
        ctx.ellipse(0, 4, 58, 16, 0, 0, Math.PI);
        ctx.quadraticCurveTo(0, 32, -58, 4);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e6c77a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(50, 2);
        ctx.lineTo(96, -10);
        ctx.stroke();
        ctx.restore();
    }

    drawFire(ctx, cx, baseY, time) {
        const hScale = this.height * 0.62 * Math.max(0.45, this.heat * 0.55);
        for (let i = 0; i < 6; i++) {
            const t = i / 5 - 0.5;
            const sway = Math.sin(time / 90 + i) * 8;
            const h = hScale * (0.7 + Math.abs(Math.sin(time / 120 + i)) * 0.35);
            const x = cx + t * 46 + sway;
            const grad = ctx.createLinearGradient(x, baseY, x, baseY - h);
            grad.addColorStop(0, '#ff1a00');
            grad.addColorStop(0.35, '#ff7a00');
            grad.addColorStop(0.7, '#ffe14a');
            grad.addColorStop(1, '#fff5c8');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - 14, baseY);
            ctx.quadraticCurveTo(x - 6, baseY - h * 0.45, x + sway * 0.4, baseY - h);
            ctx.quadraticCurveTo(x + 8, baseY - h * 0.4, x + 14, baseY);
            ctx.closePath();
            ctx.fill();
        }
    }

    frame(time) {
        const dt = Math.min(0.034, (time - this.lastTime) / 1000 || 0);
        this.lastTime = time;
        if (this.width < 20 || this.height < 20) this.resize();
        this.flare = Math.max(0.15, this.flare - dt * 1.2);
        const target = this.targetHeat();
        this.heat += (target - this.heat) * Math.min(1, dt * 6);
        const cooking = !!(window.GameState && window.GameState.isPlaying && window.GameState.cookers.some((c) => c.status === 'cooking' || c.status === 'ready'));
        document.getElementById('wok-bay')?.classList.toggle('is-blazing', cooking || this.heat > 0.5);

        const ctx = this.ctx;
        ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#0a0b0d';
        ctx.fillRect(0, 0, this.width, this.height);

        const cx = this.width * 0.5;
        const baseY = this.height * 0.8;
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 70, baseY + 10, 140, 10);

        this.tossPhase += dt * (cooking ? 4.2 : 1.6);
        const cycle = this.tossPhase % (Math.PI * 2);
        const toss = cooking ? Math.max(0, Math.sin(cycle)) : 0;
        if (cooking && toss > 0.9 && time - this.lastToss > 420) {
            this.lastToss = time;
            this.flare = 1;
            this.burst(8, 'food');
            if (window.SoundEngine) window.SoundEngine.playWokChime();
        }

        this.drawFire(ctx, cx, baseY, time);
        this.drawWok(ctx, cx, baseY, cooking ? Math.sin(cycle) * -0.1 : 0, toss * 10);

        this.particles = this.particles.filter((p) => {
            p.life -= dt;
            if (p.life <= 0) return false;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 180 * dt;
            ctx.globalAlpha = Math.min(1, p.life / 0.2);
            ctx.fillStyle = p.kind === 'food' ? `hsl(${p.hue} 80% 50%)` : '#ffd36a';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame((next) => this.frame(next));
    }
}
