document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 0;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Performance Toggles
    const STAR_COUNT = isTouch ? 250 : 500;
    const GALAXY_PARTICLES = isTouch ? 800 : 1500;
    const SINGULARITY_PARTICLES = isTouch ? 150 : 300;

    // Canvas Selection & Fixed Sizing for Mobile URL Bar Stability
    const canvases = {
        travel: document.getElementById('travel-canvas'),
        galaxy: document.getElementById('galaxy-canvas'),
        planet: document.getElementById('planet-canvas'),
        nebula: document.getElementById('nebula-canvas'),
        singularity: document.getElementById('singularity-canvas'),
        monolith: document.getElementById('monolith-canvas'),
        impact: document.getElementById('impact-canvas'),
        destruction: document.getElementById('destruction-canvas')
    };

    const ctx = {};
    Object.keys(canvases).forEach(key => {
        if (canvases[key]) {
            ctx[key] = canvases[key].getContext('2d');
            canvases[key].width = window.innerWidth;
            canvases[key].height = window.innerHeight;
        }
    });

    // -------------------------------------------------------------------------
    // MISSION CONTROL
    // -------------------------------------------------------------------------
    const suggestions = [
        "INITIATE WARP SEQUENCE", "STABILIZE GRAVITY", "SCAN SECTOR 7",
        "DECODE PROTOCOLS", "ANALYZE RADIATION", "ENGAGE STEALTH"
    ];

    function updateMission(objective, statusText) {
        const objEl = document.getElementById('mission-objective');
        const sugEl = document.getElementById('suggestion-text');
        if (objEl) {
            objEl.style.opacity = 0;
            setTimeout(() => { objEl.textContent = objective; objEl.style.opacity = 1; }, 300);
        }
        if (sugEl) {
            sugEl.style.opacity = 0;
            setTimeout(() => { sugEl.textContent = statusText || suggestions[Math.floor(Math.random() * suggestions.length)]; sugEl.style.opacity = 1; }, 300);
        }
    }

    // -------------------------------------------------------------------------
    // TRAVEL ENGINE (Starfield)
    // -------------------------------------------------------------------------
    let stars = [];
    let warpSpeed = 0.02;
    let targetWarp = 0.02;

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvases.travel.width - canvases.travel.width / 2,
                y: Math.random() * canvases.travel.height - canvases.travel.height / 2,
                z: Math.random() * canvases.travel.width
            });
        }
    }

    function animateTravel() {
        ctx.travel.fillStyle = 'rgba(2, 2, 5, 0.4)';
        ctx.travel.fillRect(0, 0, canvases.travel.width, canvases.travel.height);
        warpSpeed += (targetWarp - warpSpeed) * 0.02;
        const cx = canvases.travel.width / 2;
        const cy = canvases.travel.height / 2;

        stars.forEach(s => {
            s.z -= warpSpeed * 500;
            if (s.z <= 0) {
                s.z = canvases.travel.width;
                s.x = Math.random() * canvases.travel.width - cx;
                s.y = Math.random() * canvases.travel.height - cy;
            }
            const sx = (s.x / s.z) * 500 + cx;
            const sy = (s.y / s.z) * 500 + cy;
            const r = (1 - s.z / canvases.travel.width) * 2;
            ctx.travel.fillStyle = '#fff';
            ctx.travel.beginPath();
            ctx.travel.arc(sx, sy, Math.max(0, r), 0, Math.PI * 2);
            ctx.travel.fill();
            if (warpSpeed > 0.1) {
                ctx.travel.strokeStyle = `rgba(255, 255, 255, ${warpSpeed - 0.1})`;
                ctx.travel.beginPath();
                ctx.travel.moveTo(sx, sy);
                ctx.travel.lineTo((s.x / (s.z + 50)) * 500 + cx, (s.y / (s.z + 50)) * 500 + cy);
                ctx.travel.stroke();
            }
        });
        requestAnimationFrame(animateTravel);
    }

    // -------------------------------------------------------------------------
    // NEBULA ENGINE
    // -------------------------------------------------------------------------
    let nebulaTime = 0;
    function drawNebula() {
        if (currentPage !== 3) return;
        nebulaTime += 0.005;
        ctx.nebula.clearRect(0, 0, canvases.nebula.width, canvases.nebula.height);
        const cx = canvases.nebula.width / 2;
        const cy = canvases.nebula.height / 2;
        for (let i = 0; i < 3; i++) {
            const angle = nebulaTime + i * (Math.PI / 2);
            const ox = Math.sin(angle) * 100;
            const oy = Math.cos(angle * 0.5) * 100;
            const grad = ctx.nebula.createRadialGradient(cx + ox, cy + oy, 0, cx, cy, 600);
            const hue = (260 + i * 40 + Math.sin(nebulaTime) * 20) % 360;
            grad.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.15)`);
            grad.addColorStop(1, 'transparent');
            ctx.nebula.globalCompositeOperation = 'screen';
            ctx.nebula.fillStyle = grad;
            ctx.nebula.fillRect(0, 0, canvases.nebula.width, canvases.nebula.height);
        }
        requestAnimationFrame(drawNebula);
    }

    // -------------------------------------------------------------------------
    // SINGULARITY ENGINE
    // -------------------------------------------------------------------------
    let singParticles = [];
    function initSingularity() {
        singParticles = [];
        for (let i = 0; i < SINGULARITY_PARTICLES; i++) {
            singParticles.push({ a: Math.random() * Math.PI * 2, r: Math.random() * 600 + 100, s: Math.random() * 2 + 1 });
        }
    }
    function drawSingularity() {
        if (currentPage !== 4) return;
        ctx.singularity.fillStyle = 'rgba(2, 2, 5, 0.2)';
        ctx.singularity.fillRect(0, 0, canvases.singularity.width, canvases.singularity.height);
        const cx = canvases.singularity.width / 2;
        const cy = canvases.singularity.height / 2;

        ctx.singularity.save();
        ctx.singularity.beginPath();
        ctx.singularity.arc(cx, cy, 60, 0, Math.PI * 2);
        const coreGrad = ctx.singularity.createRadialGradient(cx, cy, 40, cx, cy, 70);
        coreGrad.addColorStop(0, '#000');
        coreGrad.addColorStop(0.8, '#00f2ff');
        coreGrad.addColorStop(1, 'transparent');
        ctx.singularity.fillStyle = coreGrad;
        ctx.singularity.fill();
        ctx.singularity.restore();

        singParticles.forEach(p => {
            p.r -= p.s * 1.5; p.a += 0.03;
            if (p.r <= 40) p.r = Math.max(canvases.singularity.width, canvases.singularity.height);
            const x = cx + Math.cos(p.a) * p.r;
            const y = cy + Math.sin(p.a) * p.r;
            const distRatio = 1 - (p.r / canvases.singularity.width);
            ctx.singularity.fillStyle = `rgba(255, 255, 255, ${0.2 + distRatio * 0.8})`;
            ctx.singularity.beginPath();
            ctx.singularity.arc(x, y, 1 + distRatio * 2, 0, Math.PI * 2);
            ctx.singularity.fill();
        });
        requestAnimationFrame(drawSingularity);
    }

    // -------------------------------------------------------------------------
    // MONOLITH ENGINE
    // -------------------------------------------------------------------------
    let monolithRot = 0;
    function drawMonolith() {
        if (currentPage !== 5) return;
        ctx.monolith.fillStyle = 'rgba(2, 2, 5, 0.2)';
        ctx.monolith.fillRect(0, 0, canvases.monolith.width, canvases.monolith.height);
        monolithRot += 0.01;
        const cx = canvases.monolith.width / 2;
        const cy = canvases.monolith.height / 2;
        const h = 250, w = 120;
        ctx.monolith.strokeStyle = '#00ff00';
        ctx.monolith.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = monolithRot + i * (Math.PI / 2);
            const x1 = cx + Math.cos(angle) * w;
            const z1 = Math.sin(angle) * w;
            const nextAngle = monolithRot + (i + 1) * (Math.PI / 2);
            const x2 = cx + Math.cos(nextAngle) * w;
            const z2 = Math.sin(nextAngle) * w;
            const p1 = 600 / (600 + z1);
            const p2 = 600 / (600 + z2);
            ctx.monolith.beginPath();
            ctx.monolith.moveTo(cx + (x1 - cx) * p1, cy - h / 2 * p1);
            ctx.monolith.lineTo(cx + (x2 - cx) * p2, cy - h / 2 * p2);
            ctx.monolith.lineTo(cx + (x2 - cx) * p2, cy + h / 2 * p2);
            ctx.monolith.lineTo(cx + (x1 - cx) * p1, cy + h / 2 * p1);
            ctx.monolith.closePath();
            ctx.monolith.stroke();
        }
        requestAnimationFrame(drawMonolith);
    }

    // -------------------------------------------------------------------------
    // PLANET ENGINE
    // -------------------------------------------------------------------------
    let planetColor = 180, planetRotation = 0, planetDrawing = false;
    function drawPlanet() {
        if (planetDrawing) return;
        planetDrawing = true;
        function loop() {
            if (currentPage < 2 || currentPage > 7 || currentPage === 3) { planetDrawing = false; return; }
            ctx.planet.clearRect(0, 0, canvases.planet.width, canvases.planet.height);
            const cx = canvases.planet.width / 2, cy = canvases.planet.height / 2;
            const size = Math.min(window.innerWidth, window.innerHeight) * 0.4;
            const atmos = ctx.planet.createRadialGradient(cx, cy, size * 0.8, cx, cy, size * 1.3);
            atmos.addColorStop(0, `hsla(${planetColor}, 100%, 50%, 0.15)`);
            atmos.addColorStop(1, 'transparent');
            ctx.planet.fillStyle = atmos;
            ctx.planet.fillRect(0, 0, canvases.planet.width, canvases.planet.height);
            ctx.planet.save();
            ctx.planet.beginPath();
            ctx.planet.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.planet.clip();
            const surf = ctx.planet.createRadialGradient(cx - size * 0.4, cy - size * 0.4, 0, cx, cy, size);
            surf.addColorStop(0, `hsla(${planetColor}, 80%, 70%, 1)`);
            surf.addColorStop(0.5, `hsla(${(planetColor + 20) % 360}, 100%, 30%, 1)`);
            surf.addColorStop(1, '#020205');
            ctx.planet.fillStyle = surf;
            ctx.planet.fillRect(cx - size, cy - size, size * 2, size * 2);
            ctx.planet.restore();
            planetRotation += 0.005;
            requestAnimationFrame(loop);
        }
        loop();
    }

    // -------------------------------------------------------------------------
    // GALAXY ENGINE
    // -------------------------------------------------------------------------
    let galaxyRotation = 0, galaxyDrawing = false;
    function drawGalaxy() {
        if (galaxyDrawing) return;
        galaxyDrawing = true;
        function loop() {
            if (currentPage < 2 || currentPage > 7) { galaxyDrawing = false; return; }
            ctx.galaxy.clearRect(0, 0, canvases.galaxy.width, canvases.galaxy.height);
            const cx = canvases.galaxy.width / 2, cy = canvases.galaxy.height / 2;
            galaxyRotation += 0.002;
            for (let i = 0; i < GALAXY_PARTICLES; i++) {
                const angle = (i * 0.1) + galaxyRotation;
                const dist = Math.sqrt(i) * 15;
                const alpha = Math.max(0, 1 - dist / (canvases.galaxy.width * 0.5));
                ctx.galaxy.fillStyle = `hsla(200, 80%, 80%, ${alpha * 0.4})`;
                ctx.galaxy.beginPath();
                ctx.galaxy.arc(cx + Math.cos(angle + dist * 0.01) * dist, cy + Math.sin(angle + dist * 0.01) * dist, 1, 0, Math.PI * 2);
                ctx.galaxy.fill();
            }
            requestAnimationFrame(loop);
        }
        loop();
    }

    // -------------------------------------------------------------------------
    // DESTRUCTION ENGINE
    // -------------------------------------------------------------------------
    let shards = [];
    function initDestruction() {
        shards = [];
        for (let i = 0; i < 100; i++) {
            shards.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, size: Math.random() * 40 + 10, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.1 });
        }
    }
    function drawDestruction() {
        if (currentPage !== 8) return;
        ctx.destruction.clearRect(0, 0, canvases.destruction.width, canvases.destruction.height);
        shards.forEach(s => {
            s.x += s.vx; s.y += s.vy; s.rot += s.vrot;
            ctx.destruction.save();
            ctx.destruction.translate(s.x, s.y);
            ctx.destruction.rotate(s.rot);
            ctx.destruction.fillStyle = 'rgba(255, 70, 0, 0.3)';
            ctx.destruction.strokeStyle = '#ff4500';
            ctx.destruction.beginPath();
            ctx.destruction.moveTo(0, -s.size); ctx.destruction.lineTo(s.size, s.size); ctx.destruction.lineTo(-s.size, s.size);
            ctx.destruction.closePath();
            ctx.destruction.fill(); ctx.destruction.stroke();
            ctx.destruction.restore();
        });
        requestAnimationFrame(drawDestruction);
    }

    // -------------------------------------------------------------------------
    // IMPACT & NAVIGATION
    // -------------------------------------------------------------------------
    let pArray = [];
    class Particle {
        constructor(x, y, color) { this.x = x; this.y = y; this.color = color; this.size = Math.random() * 4 + 2; this.vx = (Math.random() - 0.5) * 15; this.vy = (Math.random() - 0.5) * 15; this.life = 1.0; }
        update() { this.x += this.vx; this.y += this.vy; this.vy += 0.2; this.life -= 0.03; }
        draw() { ctx.impact.globalAlpha = this.life; ctx.impact.fillStyle = this.color; ctx.impact.beginPath(); ctx.impact.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.impact.fill(); }
    }
    function animateImpact() {
        ctx.impact.clearRect(0, 0, canvases.impact.width, canvases.impact.height);
        pArray = pArray.filter(p => p.life > 0);
        pArray.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateImpact);
    }

    let lastAdvance = 0;
    function advance() {
        const now = Date.now();
        if (now - lastAdvance < 800) return;
        lastAdvance = now;
        createImpact(window.innerWidth / 2, window.innerHeight / 2, '#00f2ff', 25);

        const sequence = [
            { obj: "IDENTITY CONFIRMED", sug: "WELCOMING SACHIN PATIL...", warp: 0.5 },
            { obj: "WARP COMPLETE", sug: "ENTERING SECTOR 7..." },
            { obj: "NEBULA DETECTED", sug: "SCANNING COSMIC CLOUDS..." },
            { obj: "GRAVITY WARNING", sug: "APPROACHING SINGULARITY..." },
            { obj: "OBJECT LOCATED", sug: "DECODING MONOLITH..." },
            { obj: "SECURE PERIMETER", sug: "ANOMALY NEUTRALIZED..." },
            { obj: "CORE BREACH", sug: "WITNESSING GENESIS..." },
            { obj: "CRITICAL FAILURE", sug: "WORLD FRAGMENTATION..." },
            { obj: "TEMPORAL SHIFT", sug: "LOCATING FUTURE GUY..." }
        ];

        if (currentPage < 9) {
            const next = sequence[currentPage];
            transitionPage(currentPage + 1);
            updateMission(next.obj, next.sug);
            if (next.warp) { targetWarp = next.warp; setTimeout(() => targetWarp = 0.02, 1200); }
        } else {
            window.open('https://www.instagram.com/sachinpatil12n/', '_blank');
        }
    }

    function transitionPage(num) {
        document.body.classList.remove('shatter-shake', 'destruction-active', 'planet-active', 'galaxy-active', 'nebula-active', 'singularity-active', 'monolith-active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        const progress = document.getElementById('progress-bar-inner');
        if (progress) progress.style.width = `${(num / 9) * 100}%`;

        setTimeout(() => {
            const next = document.getElementById(`page-${num}`);
            if (next) next.classList.add('active');
            currentPage = num;

            if ([2, 4, 6, 7].includes(num)) { document.body.classList.add('planet-active', 'galaxy-active'); drawGalaxy(); drawPlanet(); }
            if (num === 3) { document.body.classList.add('nebula-active'); drawNebula(); }
            if (num === 4) { document.body.classList.add('singularity-active'); initSingularity(); drawSingularity(); }
            if (num === 5) { document.body.classList.add('monolith-active'); drawMonolith(); }
            if (num === 8) { document.body.classList.add('destruction-active', 'shatter-shake'); initDestruction(); drawDestruction(); }
        }, 100);
    }

    function createImpact(x, y, color, n) {
        for (let i = 0; i < n; i++) pArray.push(new Particle(x, y, color === 'colorful' ? `hsl(${Math.random() * 360}, 100%, 50%)` : color));
    }

    // Listeners
    document.addEventListener('touchstart', (e) => { e.preventDefault(); advance(); }, { passive: false });
    document.addEventListener('mousedown', advance);
    document.addEventListener('keydown', (e) => { if (e.code === 'Space') advance(); });

    // Initial Start
    initStars();
    animateTravel();
    animateImpact();
    updateMission("INITIALIZING SYSTEM", "IDENTIFYING VOYAGER...");
    setTimeout(() => document.getElementById('name-popup')?.classList.add('show'), 1000);
});
