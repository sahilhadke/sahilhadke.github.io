function initStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    const stars = [];
    const COUNT = 180;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    let scrollY = 0;
    let mouseX = 0, mouseY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / w - 0.5) * 2;
        mouseY = (e.clientY / h - 0.5) * 2;
    }, { passive: true });

    function create() {
        stars.length = 0;
        for (let i = 0; i < COUNT; i++) {
            const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2;
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: [0.4, 0.8, 1.4][layer] + Math.random() * 0.4,
                baseAlpha: [0.2, 0.35, 0.55][layer] + Math.random() * 0.15,
                speed: Math.random() * 0.012 + 0.003,
                phase: Math.random() * Math.PI * 2,
                layer,
                driftSpeed: [0.02, 0.05, 0.1][layer],
                parallax: [0.02, 0.06, 0.12][layer],
                mouseParallax: [2, 5, 10][layer],
            });
        }
    }

    const planets = [];

    function drawPlanet(p, time) {
        const x = p.xPct * w + mouseX * p.mouseP;
        const y = p.yPct * h + Math.sin(time * p.drift) * 8 - scrollY * p.parallax + mouseY * p.mouseP;
        const [r, g, b] = p.color;
        const [gr, gg, gb] = p.glowColor;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3);
        glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.08)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        const body = ctx.createRadialGradient(x - p.r * 0.3, y - p.r * 0.3, 0, x, y, p.r);
        body.addColorStop(0, `rgba(${r + 40}, ${g + 40}, ${b + 40}, 0.25)`);
        body.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.18)`);
        body.addColorStop(1, `rgba(${r - 20}, ${g - 20}, ${b - 20}, 0.08)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }

    const triSolar = {
        xPct: 0.82, yPct: 0.18, r: 22,
        color: [50, 70, 110], glowColor: [70, 100, 150],
        drift: 0.006, parallax: 0.07, mouseP: 12,
        suns: [
            { orbitR: 50, speed: 0.012, phase: 0, r: 5, color: [255, 200, 80], glow: [255, 220, 100] },
            { orbitR: 50, speed: 0.012, phase: Math.PI * 2 / 3, r: 4, color: [255, 140, 60], glow: [255, 160, 80] },
            { orbitR: 50, speed: 0.012, phase: Math.PI * 4 / 3, r: 4.5, color: [255, 100, 100], glow: [255, 130, 120] },
        ],
        state: 'orbiting',
        particles: [],
    };

    const startTime = performance.now();
    const PROJECTILE_AT_MS = 29200;
    const PROJECTILE_MS = 800;
    const COLLIDE_AT_MS = 30000;
    const YELLOW_COLLIDE_MS = 2000;
    const ABSORB_MS = 1000;
    const EXPLODE_MS = 3000;

    function drawSun(sx, sy, sun, glowMult, alphaMult) {
        const glowSize = sun.r * 4 * glowMult;
        const gA = 0.15 * alphaMult;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowSize);
        glow.addColorStop(0, `rgba(${sun.glow[0]}, ${sun.glow[1]}, ${sun.glow[2]}, ${gA})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        const body = ctx.createRadialGradient(sx, sy, 0, sx, sy, sun.r);
        body.addColorStop(0, `rgba(${sun.color[0]}, ${sun.color[1]}, ${sun.color[2]}, ${0.9 * alphaMult})`);
        body.addColorStop(1, `rgba(${sun.color[0]}, ${sun.color[1]}, ${sun.color[2]}, ${0.3 * alphaMult})`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(sx, sy, sun.r, 0, Math.PI * 2);
        ctx.fill();
    }

    function getYellowSunPos(cx, cy, frameTime) {
        const sun = triSolar.suns[0];
        return {
            x: cx + Math.cos(sun.phase) * sun.orbitR,
            y: cy + Math.sin(sun.phase) * sun.orbitR * 0.45
        };
    }

    function drawProjectile(elapsed, cx, cy, frameTime) {
        const t = elapsed - PROJECTILE_AT_MS;
        if (t < 0 || t > PROJECTILE_MS) return;

        const p = t / PROJECTILE_MS;
        const ease = p * p * p;

        const targetPos = getYellowSunPos(cx, cy, frameTime);
        const startX = -40;
        const startY = h * 0.6;
        const px = startX + (targetPos.x - startX) * ease;
        const py = startY + (targetPos.y - startY) * ease;

        const trailLen = 8;
        for (let i = 0; i < trailLen; i++) {
            const frac = i / trailLen;
            const tx = px - (px - startX) * frac * 0.06;
            const ty = py - (py - startY) * frac * 0.06;
            const alpha = (1 - frac) * 0.7 * (1 - p * 0.5);
            const r = (1 - frac) * 2.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `rgb(180, 220, 255)`;
            ctx.beginPath();
            ctx.arc(tx, ty, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 0.9;
        const headGlow = ctx.createRadialGradient(px, py, 0, px, py, 8);
        headGlow.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
        headGlow.addColorStop(0.5, 'rgba(150, 200, 255, 0.3)');
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ddeeff';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p >= 0.95) {
            const impactGlow = ctx.createRadialGradient(px, py, 0, px, py, 20);
            impactGlow.addColorStop(0, `rgba(255, 240, 200, ${(1 - p) * 8})`);
            impactGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = impactGlow;
            ctx.beginPath();
            ctx.arc(px, py, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawTriSolar(frameTime) {
        const cx = triSolar.xPct * w + mouseX * triSolar.mouseP;
        const cy = triSolar.yPct * h + Math.sin(frameTime * triSolar.drift) * 6 - scrollY * triSolar.parallax + mouseY * triSolar.mouseP;
        const elapsed = performance.now() - startTime;

        if (triSolar.state === 'gone') return;

        if (triSolar.state === 'exploding') {
            const t = elapsed - COLLIDE_AT_MS - YELLOW_COLLIDE_MS - ABSORB_MS;
            const progress = Math.min(t / EXPLODE_MS, 1);

            if (progress < 0.4) {
                const flashAlpha = 0.35 * (1 - progress / 0.4);
                const flashR = 60 + progress * 300;
                const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
                flash.addColorStop(0, `rgba(255, 240, 200, ${flashAlpha})`);
                flash.addColorStop(0.3, `rgba(255, 160, 60, ${flashAlpha * 0.5})`);
                flash.addColorStop(0.6, `rgba(255, 80, 30, ${flashAlpha * 0.2})`);
                flash.addColorStop(1, 'transparent');
                ctx.fillStyle = flash;
                ctx.beginPath();
                ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
                ctx.fill();
            }

            for (const p of triSolar.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.988;
                p.vy *= 0.988;
                p.life -= p.decay;
                if (p.life <= 0) continue;

                ctx.globalAlpha = p.life;
                const trail = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * p.life * 2);
                trail.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
                trail.addColorStop(1, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0)`);
                ctx.fillStyle = trail;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            if (progress >= 1) {
                triSolar.state = 'gone';
                const hint = document.getElementById('book-hint');
                if (hint) {
                    hint.innerHTML = 'Read <a href="https://en.wikipedia.org/wiki/The_Three-Body_Problem_(novel)" target="_blank">The Three-Body Problem</a> — my favourite book. This event happens in it.';
                    hint.classList.add('visible');
                }
            }
            return;
        }

        if (elapsed < COLLIDE_AT_MS) {
            drawPlanet(triSolar, frameTime);

            const orbitAlpha = 0.04 + 0.02 * Math.sin(frameTime * 0.02);
            ctx.strokeStyle = `rgba(255, 255, 255, ${orbitAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy, triSolar.suns[0].orbitR, 0, Math.PI * 2);
            ctx.stroke();

            for (const sun of triSolar.suns) {
                sun.phase += sun.speed;
                const sx = cx + Math.cos(sun.phase) * sun.orbitR;
                const sy = cy + Math.sin(sun.phase) * sun.orbitR * 0.45;
                drawSun(sx, sy, sun, 1, 1);
            }

            drawProjectile(elapsed, cx, cy, frameTime);
            return;
        }

        const yellowSun = triSolar.suns[0];
        const otherSuns = [triSolar.suns[1], triSolar.suns[2]];
        const collideT = elapsed - COLLIDE_AT_MS;

        if (collideT < YELLOW_COLLIDE_MS) {
            const p = Math.min(collideT / YELLOW_COLLIDE_MS, 1);
            const ease = p * p * p;

            drawPlanet(triSolar, frameTime);

            yellowSun.phase += yellowSun.speed * (1 + p * 5);
            const curOrbit = yellowSun.orbitR * (1 - ease);
            const sx = cx + Math.cos(yellowSun.phase) * curOrbit;
            const sy = cy + Math.sin(yellowSun.phase) * curOrbit * 0.45;
            drawSun(sx, sy, yellowSun, 1 + p * 2, 1);

            for (const sun of otherSuns) {
                sun.phase += sun.speed;
                const osx = cx + Math.cos(sun.phase) * sun.orbitR;
                const osy = cy + Math.sin(sun.phase) * sun.orbitR * 0.45;
                drawSun(osx, osy, sun, 1, 1);
            }
            return;
        }

        const absorbT = collideT - YELLOW_COLLIDE_MS;
        if (absorbT < ABSORB_MS) {
            const p = Math.min(absorbT / ABSORB_MS, 1);
            const ease = p * p;

            const planetGlow = triSolar.r * (1 + p * 2);
            const impactGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, planetGlow * 3);
            impactGrad.addColorStop(0, `rgba(255, 200, 80, ${0.2 * (1 - ease)})`);
            impactGrad.addColorStop(0.5, `rgba(255, 140, 40, ${0.1 * (1 - ease)})`);
            impactGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = impactGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, planetGlow * 3, 0, Math.PI * 2);
            ctx.fill();

            drawPlanet(triSolar, frameTime);

            for (const sun of otherSuns) {
                sun.phase += sun.speed * (1 + p * 4);
                const curOrbit = sun.orbitR * (1 - ease);
                const osx = cx + Math.cos(sun.phase) * curOrbit;
                const osy = cy + Math.sin(sun.phase) * curOrbit * 0.45;
                drawSun(osx, osy, sun, 1 + p * 3, 1);
            }

            if (p >= 1) {
                triSolar.state = 'exploding';
                const fireColors = [
                    [255, 220, 80], [255, 180, 40], [255, 120, 20],
                    [255, 80, 10], [255, 60, 30], [255, 200, 100],
                    [255, 255, 180], [200, 100, 20],
                ];
                for (let i = 0; i < 90; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 3.5 + 0.8;
                    const c = fireColors[Math.floor(Math.random() * fireColors.length)];
                    triSolar.particles.push({
                        x: cx + (Math.random() - 0.5) * 10,
                        y: cy + (Math.random() - 0.5) * 10,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        r: Math.random() * 3 + 0.8,
                        color: c,
                        life: 1,
                        decay: Math.random() * 0.006 + 0.004,
                    });
                }
            }
            return;
        }
    }

    let time = 0;
    function draw() {
        ctx.clearRect(0, 0, w, h);
        time++;

        for (const p of planets) drawPlanet(p, time);
        drawTriSolar(time);

        for (const s of stars) {
            s.phase += s.speed;
            s.y -= s.driftSpeed;
            if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }

            const px = s.x + mouseX * s.mouseParallax;
            const py = ((s.y - scrollY * s.parallax) % h + h) % h;
            const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(s.phase));

            ctx.beginPath();
            ctx.arc(px, py, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }

    resize();
    create();
    draw();
    window.addEventListener('resize', () => { resize(); create(); });
}

function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;
    let remaining = 30;

    const interval = setInterval(() => {
        remaining--;
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        el.textContent = `${m}:${s.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(interval);
            el.classList.add('done');
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initCountdown();
    const list = document.getElementById('projects-list');
    if (!list || typeof projectsData === 'undefined') return;

    projectsData.forEach(project => {
        const li = document.createElement('li');
        li.className = 'project-item';
        li.innerHTML = `
            <a href="${project.link}" target="_blank" rel="noopener">
                <div class="project-header">
                    <span class="project-name">${project.title}${project.tag ? `<span class="tag">${project.tag}</span>` : ''}</span>
                    <span class="project-arrow">&rarr;</span>
                </div>
                <p class="project-desc">${project.description}</p>
            </a>
        `;
        list.appendChild(li);
    });
});
