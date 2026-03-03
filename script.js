document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initShootingStars();
    initParallax();
    initTypewriter();
    initNavScroll();
    renderProjects();
    initSwiper();
    AOS.init({ once: true, offset: 80, duration: 900 });
});

/* ============================================================
   CANVAS STARFIELD
   Multi-layer twinkling star field with subtle parallax on scroll
   ============================================================ */
function initStarfield() {
    const canvas = document.getElementById('space-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const stars = [];
    let scrollY = 0;

    function resize() {
        width  = canvas.width  = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createStar(layer) {
        // layer 0 = tiny/dim, layer 1 = medium, layer 2 = bright
        const radii   = [() => Math.random() * 0.7 + 0.15,
                         () => Math.random() * 1.1 + 0.5,
                         () => Math.random() * 1.8 + 1.0];
        const colors  = ['#ffffff', '#93c5fd', '#a78bfa', '#e2e8f0'];
        const weights = [0.65, 0.25, 0.07, 0.03];

        let rand = Math.random();
        let color = colors[0];
        let cum = 0;
        for (let i = 0; i < weights.length; i++) {
            cum += weights[i];
            if (rand < cum) { color = colors[i]; break; }
        }

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            radius: radii[layer](),
            layer,
            baseOpacity: Math.random() * 0.5 + 0.25,
            twinkleSpeed: Math.random() * 0.018 + 0.004,
            twinklePhase: Math.random() * Math.PI * 2,
            color,
        };
    }

    function initStars() {
        stars.length = 0;
        for (let i = 0; i < 220; i++) stars.push(createStar(0));
        for (let i = 0; i < 80;  i++) stars.push(createStar(1));
        for (let i = 0; i < 22;  i++) stars.push(createStar(2));
    }

    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    function draw() {
        ctx.clearRect(0, 0, width, height);

        stars.forEach(star => {
            // Parallax: deeper layers move more
            const parallaxFactor = [0.05, 0.12, 0.22][star.layer];
            const py = ((star.y - scrollY * parallaxFactor) % height + height) % height;

            star.twinklePhase += star.twinkleSpeed;
            const opacity = star.baseOpacity * (0.65 + 0.35 * Math.sin(star.twinklePhase));

            ctx.globalAlpha = opacity;
            ctx.fillStyle   = star.color;
            ctx.beginPath();
            ctx.arc(star.x, py, star.radius, 0, Math.PI * 2);
            ctx.fill();

            // Soft glow for bright stars
            if (star.layer === 2) {
                const gr = ctx.createRadialGradient(star.x, py, 0, star.x, py, star.radius * 5);
                gr.addColorStop(0, star.color);
                gr.addColorStop(1, 'transparent');
                ctx.globalAlpha = opacity * 0.25;
                ctx.fillStyle   = gr;
                ctx.beginPath();
                ctx.arc(star.x, py, star.radius * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    window.addEventListener('resize', () => { resize(); initStars(); });
}

/* ============================================================
   SHOOTING STARS
   Randomly spawns streaking stars at intervals
   ============================================================ */
function initShootingStars() {
    const container = document.getElementById('shooting-stars');
    if (!container) return;

    function spawn() {
        const star = document.createElement('div');
        star.className = 'shooting-star';

        // Start from random top/right quadrant
        const startX = Math.random() * window.innerWidth * 0.85;
        const startY = Math.random() * window.innerHeight * 0.45;
        const dur    = (Math.random() * 0.45 + 0.55).toFixed(2);

        star.style.cssText = `left:${startX}px; top:${startY}px; animation-duration:${dur}s;`;
        container.appendChild(star);
        setTimeout(() => star.remove(), 1600);
    }

    function schedule() {
        const delay = Math.random() * 3800 + 1800;
        setTimeout(() => { spawn(); schedule(); }, delay);
    }

    // Two initial bursts for immediate wow effect
    setTimeout(spawn, 800);
    setTimeout(spawn, 2200);
    schedule();
}

/* ============================================================
   PARALLAX NEBULA
   Moves the fixed nebula overlay at a slower rate than scroll
   ============================================================ */
function initParallax() {
    const nebula = document.querySelector('.nebula-overlay');
    if (!nebula) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                nebula.style.transform = `translateY(${window.scrollY * 0.18}px)`;
                ticking = false;
            });
            ticking = true;
        }
    });
}

/* ============================================================
   TYPEWRITER EFFECT
   Cycles through phrases with a typing / deleting animation
   ============================================================ */
function initTypewriter() {
    const el = document.getElementById('typewriter-text');
    if (!el) return;

    const phrases = [
        "I'm just a guy who likes to break down big problems into smaller ones… and then automate them away.",
        "Software Engineer MTS @ Salesforce. Hackathon winner. Problem solver.",
        "Building the future, one function at a time.",
        "Turning coffee and curiosity into production-ready code.",
        "From RPA bots to AI agents — I automate the boring stuff.",
    ];

    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;

    function tick() {
        const current = phrases[phraseIdx];

        if (!deleting) {
            el.textContent = current.slice(0, ++charIdx);
            if (charIdx === current.length) {
                deleting = true;
                setTimeout(tick, 2600);
                return;
            }
        } else {
            el.textContent = current.slice(0, --charIdx);
            if (charIdx === 0) {
                deleting   = false;
                phraseIdx  = (phraseIdx + 1) % phrases.length;
            }
        }

        setTimeout(tick, deleting ? 32 : 52);
    }

    setTimeout(tick, 900);
}

/* ============================================================
   NAV SCROLL STATE
   Adds .scrolled class to nav when page is scrolled down
   ============================================================ */
function initNavScroll() {
    const nav = document.getElementById('floating-nav');
    if (!nav) return;

    const update = () => nav.classList.toggle('scrolled', window.scrollY > 45);
    window.addEventListener('scroll', update, { passive: true });
}

/* ============================================================
   RENDER PROJECTS
   Injects project cards into the Swiper container
   ============================================================ */
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    if (typeof projectsData === 'undefined' || !Array.isArray(projectsData)) return;

    projectsData.forEach(project => {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        slide.innerHTML = `
            <a href="${project.link}" target="_blank" class="project-card">
                <div class="card-image-wrapper">
                    <img src="${project.image}" alt="${project.title}" class="project-image" loading="lazy">
                </div>
                <div class="card-content">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <span class="read-more">VIEW MISSION &rarr;</span>
                </div>
            </a>
        `;
        container.appendChild(slide);
    });
}

/* ============================================================
   SWIPER CAROUSEL
   ============================================================ */
function initSwiper() {
    if (typeof Swiper === 'undefined') return;

    new Swiper('.mySwiper', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: {
            rotate: 40,
            stretch: 0,
            depth: 130,
            modifier: 1,
            slideShadows: true,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        autoplay: {
            delay: 4000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
        },
    });
}
