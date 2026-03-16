

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: true
        });
        
        this.clock = new THREE.Clock();
        this.car = null;
        this.controls = null;
        this.gameState = 'intro'; // intro, playing, menu
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x050510, 1);
        
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        
        // Physics variables
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotationVelocity = 0;
        this.speed = 0;
        this.maxSpeed = 1.5;
        this.friction = 0.98;
        this.steering = 0.04;
        this.driftFactor = 0.95;
        this.score = 0;
        this.currentMode = 'free'; // 'free', 'race', 'survival', 'time'
        this.timeLeft = 60;
        
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false,
            space: false
        };

        // Refinements
        this.trails = [];
        this.radarCanvas = document.getElementById('radar-canvas');
        if (this.radarCanvas) {
            this.radarCtx = this.radarCanvas.getContext('2d');
            this.radarCanvas.width = 150;
            this.radarCanvas.height = 150;
        }
        this.stormIntensity = 0;
        this.stormTimer = 0;
        this.steeringNoise = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;

        this.setupLights();
        this.createEnvironment();
        this.createCar();
        this.createTrack();
        this.createAsteroids();
        this.setupEventListeners();
        
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 1000);

        this.animate();
    }

    createAsteroids() {
        this.asteroids = [];
        const asteroidCount = 30;
        const asteroidGeo = new THREE.DodecahedronGeometry(2, 0);
        const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 });

        for (let i = 0; i < asteroidCount; i++) {
            const mesh = new THREE.Mesh(asteroidGeo, asteroidMat);
            const t = Math.random();
            const point = this.trackCurve.getPoint(t);
            mesh.position.copy(point).add(new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            ));
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mesh.scale.setScalar(1 + Math.random() * 3);
            
            this.scene.add(mesh);
            this.asteroids.push({
                mesh: mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                rotation: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                )
            });
        }
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x4040ff, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);

        const blueLight = new THREE.PointLight(0x00f2ff, 1, 100);
        blueLight.position.set(-10, 5, -5);
        this.scene.add(blueLight);

        const pinkLight = new THREE.PointLight(0xff00ea, 1, 100);
        pinkLight.position.set(10, -5, 5);
        this.scene.add(pinkLight);
    }

    createEnvironment() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true
        });

        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 5000;
            const y = (Math.random() - 0.5) * 5000;
            const z = (Math.random() - 0.5) * 5000;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);

        const nebulaCount = 5;
        for (let i = 0; i < nebulaCount; i++) {
            const geo = new THREE.SphereGeometry(100, 32, 32);
            const mat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00f2ff : 0xbc00ff,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            const nebula = new THREE.Mesh(geo, mat);
            nebula.position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
            nebula.scale.set(5, 2, 5);
            this.scene.add(nebula);
        }

        this.createWormhole();
    }

    createWormhole() {
        // Create a large tube for the intro
        const points = [];
        for (let i = 0; i < 10; i++) {
            points.push(new THREE.Vector3(0, 0, i * 20));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 15, 32, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0,
            wireframe: true
        });
        this.wormhole = new THREE.Mesh(tubeGeo, tubeMat);
        this.wormhole.position.set(0, 0, 100);
        this.scene.add(this.wormhole);
    }

    createCar() {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.BoxGeometry(1.2, 0.4, 3);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x001133
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const wingGeo = new THREE.BoxGeometry(2, 0.1, 1);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.position.y = -0.1;
        group.add(wing);

        const coreGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.rotation.x = Math.PI / 2;
        core.position.y = -0.2;
        group.add(core);

        const cockpitGeo = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMat = new THREE.MeshPhysicalMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.4,
            transmission: 0.9,
            thickness: 0.5,
            roughness: 0
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.scale.set(1, 0.6, 1.5);
        cockpit.position.y = 0.2;
        cockpit.position.z = 0.5;
        group.add(cockpit);

        this.thrusters = [];
        const thrusterPos = [
            new THREE.Vector3(-0.4, -0.2, 1.5),
            new THREE.Vector3(0.4, -0.2, 1.5)
        ];

        thrusterPos.forEach(pos => {
            const tGroup = new THREE.Group();
            tGroup.position.copy(pos);
            const light = new THREE.PointLight(0x00f2ff, 1, 5);
            tGroup.add(light);
            const geo = new THREE.CylinderGeometry(0.2, 0.1, 0.4, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = Math.PI / 2;
            tGroup.add(mesh);
            group.add(tGroup);
            this.thrusters.push({ group: tGroup, light, mesh });
        });

        this.car = group;
        this.scene.add(this.car);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(this.car.position);

        // Prepare trail segments pool or ribbon
        this.trailGeometry = new THREE.PlaneGeometry(0.2, 1);
        this.trailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00f2ff, 
            transparent: true, 
            opacity: 0.5, 
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
    }

    createTrack() {
        const points = [];
        let currentPos = new THREE.Vector3(0, 0, 0);
        
        // Generate a random path
        for (let i = 0; i < 50; i++) {
            points.push(currentPos.clone());
            currentPos.x += (Math.random() - 0.5) * 100;
            currentPos.y += (Math.random() - 0.5) * 50;
            currentPos.z -= 100;
        }

        const curve = new THREE.CatmullRomCurve3(points);
        this.trackCurve = curve;

        // Visual Tube
        const tubeGeo = new THREE.TubeGeometry(curve, 200, 5, 8, false);
        const tubeMat = new THREE.MeshPhongMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const track = new THREE.Mesh(tubeGeo, tubeMat);
        this.scene.add(track);

        // Add rings and orbs
        this.collectibles = [];
        const ringCount = 100;
        for (let i = 0; i < ringCount; i++) {
            const t = i / ringCount;
            const point = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            
            // Randomly place an orb or a ring
            if (Math.random() > 0.3) {
                const orbGeo = new THREE.IcosahedronGeometry(1, 1);
                const orbMat = new THREE.MeshBasicMaterial({ color: 0xff00ea });
                const orb = new THREE.Mesh(orbGeo, orbMat);
                
                // Offset orb slightly from path center
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    0
                );
                orb.position.copy(point).add(offset);
                this.scene.add(orb);
                this.collectibles.push({ mesh: orb, type: 'orb' });
            } else {
                const ringGeo = new THREE.TorusGeometry(8, 0.2, 16, 100);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.copy(point);
                ring.lookAt(point.clone().add(tangent));
                this.scene.add(ring);
                this.collectibles.push({ mesh: ring, type: 'ring' });
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', (e) => {
            this.updateKeys(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.updateKeys(e.code, false);
        });

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setGameMode(e.target.dataset.mode);
                this.toggleMenu();
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
            this.playEngineSound(); 
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleMenu();
            }
        });
    }

    updateKeys(code, pressed) {
        switch (code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = pressed; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = pressed; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = pressed; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = pressed; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.shift = pressed; break;
            case 'Space': this.keys.space = pressed; break;
        }
    }

    setGameMode(mode) {
        this.currentMode = mode;
        this.score = 0;
        this.updateScore();
        document.getElementById('game-mode').innerText = mode.toUpperCase().replace('_', ' ');
        
        const timerContainer = document.getElementById('timer-container');
        if (mode === 'time') {
            timerContainer.classList.remove('hidden');
            this.timeLeft = 60;
            this.createPortals();
        } else {
            timerContainer.classList.add('hidden');
        }

        if (mode === 'survival') {
            this.asteroids.forEach(a => a.velocity.multiplyScalar(2));
        }
    }

    createPortals() {
        if (this.portals) {
            this.portals.forEach(p => this.scene.remove(p));
        }
        this.portals = [];
        const portalCount = 5;
        for (let i = 0; i < portalCount; i++) {
            const t = (i + 1) / (portalCount + 1);
            const point = this.trackCurve.getPoint(t);
            const tangent = this.trackCurve.getTangent(t);
            
            const portalGeo = new THREE.TorusGeometry(10, 1, 16, 100);
            const portalMat = new THREE.MeshBasicMaterial({ color: 0xbc00ff, transparent: true, opacity: 0.6 });
            const portal = new THREE.Mesh(portalGeo, portalMat);
            portal.position.copy(point);
            portal.lookAt(point.clone().add(tangent));
            this.scene.add(portal);
            this.portals.push(portal);
        }
    }

    playEngineSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.audioCtx = audioCtx;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(50, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            this.engineOsc = oscillator;
        } catch(e) { console.log("Audio not supported"); }
    }

    updateAudio() {
        if (this.engineOsc && this.audioCtx) {
            const freq = 50 + Math.abs(this.speed) * 100;
            this.engineOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
        }
    }

    updateRadar() {
        if (!this.radarCtx || !this.car) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = 0.5;

        ctx.clearRect(0, 0, w, h);

        // Track points
        ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
        if (this.trackCurve) {
            for (let i = 0; i < 1.05; i += 0.05) {
                const p = this.trackCurve.getPoint(i);
                const dx = (p.x - this.car.position.x) * scale;
                const dz = (p.z - this.car.position.z) * scale;
                ctx.beginPath();
                ctx.arc(cx + dx, cy + dz, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Collectibles
        ctx.fillStyle = '#ff00ea';
        this.collectibles.forEach(c => {
            if (c.mesh.visible) {
                const dx = (c.mesh.position.x - this.car.position.x) * scale;
                const dz = (c.mesh.position.z - this.car.position.z) * scale;
                if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
                    ctx.fillRect(cx + dx - 1, cy + dz - 1, 2, 2);
                }
            }
        });

        // Car (Self)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    updateTrails() {
        const time = this.clock.getElapsedTime();
        if (Math.abs(this.speed) > 0.1) {
            this.thrusters.forEach(t => {
                const worldPos = new THREE.Vector3();
                t.group.getWorldPosition(worldPos);
                
                const segment = new THREE.Mesh(this.trailGeometry, this.trailMaterial.clone());
                segment.position.copy(worldPos);
                segment.quaternion.copy(this.car.quaternion);
                segment.userData = { life: 1.0, creationTime: time };
                this.scene.add(segment);
                this.trails.push(segment);
            });
        }

        for (let i = this.trails.length - 1; i >= 0; i--) {
            const s = this.trails[i];
            s.userData.life -= 0.02;
            s.material.opacity = s.userData.life * 0.5;
            s.scale.multiplyScalar(0.98);
            if (s.userData.life <= 0) {
                this.scene.remove(s);
                this.trails.splice(i, 1);
            }
        }
    }

    updateStorms(delta) {
        this.stormTimer += delta;
        
        // Randomly trigger storms
        if (this.stormTimer > 10) {
            if (Math.random() < 0.3) {
                this.stormIntensity = 2.0;
                console.log("ENERGY STORM DETECTED");
            }
            this.stormTimer = 0;
        }

        if (this.stormIntensity > 0) {
            this.stormIntensity -= delta * 0.5;
            this.steeringNoise = (Math.random() - 0.5) * this.stormIntensity * 0.1;
            
            // Visual storm indicator
            document.getElementById('hud').style.boxShadow = `inset 0 0 ${this.stormIntensity * 30}px rgba(188, 0, 255, 0.8)`;
            this.renderer.domElement.style.filter = `contrast(1.1) brightness(1.2) drop-shadow(0 0 5px var(--neon-blue)) hue-rotate(${this.stormIntensity * 20}deg)`;
        } else {
            this.steeringNoise = 0;
            document.getElementById('hud').style.boxShadow = 'none';
            this.renderer.domElement.style.filter = ''; // Reset to default CSS filter
        }
    }

    checkCollisions() {
        if (!this.car || !this.collectibles) return;

        // Collectibles
        this.collectibles.forEach((c, index) => {
            if (c.mesh.visible && this.car.position.distanceTo(c.mesh.position) < 5) {
                c.mesh.visible = false;
                if (c.type === 'orb') {
                    this.score += 100;
                    this.updateScore();
                } else if (c.type === 'ring') {
                    this.speed += 0.5; // Boost!
                }
            }
        });

        // Asteroids
        if (this.asteroids) {
            this.asteroids.forEach(a => {
                if (this.car.position.distanceTo(a.mesh.position) < 4) {
                    this.speed *= 0.5; // Crash penalty
                    // Push car away
                    const pushDir = this.car.position.clone().sub(a.mesh.position).normalize();
                    this.car.position.addScaledVector(pushDir, 1);
                }
            });
        }
    }

    updateAsteroids(delta) {
        if (!this.asteroids) return;
        this.asteroids.forEach(a => {
            a.mesh.position.add(a.velocity);
            a.mesh.rotation.x += a.rotation.x;
            a.mesh.rotation.y += a.rotation.y;
            a.mesh.rotation.z += a.rotation.z;

            // Keep asteroids within a certain range of the track
            const t = Math.random();
            if (a.mesh.position.length() > 5000) {
                const point = this.trackCurve.getPoint(t);
                a.mesh.position.copy(point).add(new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                ));
            }
        });
    }

    updateScore() {
        const scoreEl = document.getElementById('score');
        scoreEl.innerText = this.score.toString().padStart(6, '0');
    }

    updatePhysics(delta) {
        if (!this.car || this.gameState !== 'playing') return;

        this.checkCollisions();

        // Apply acceleration
        if (this.keys.forward) this.speed += 0.02;
        if (this.keys.backward) this.speed -= 0.01;

        // Apply friction
        this.speed *= this.friction;

        // Steering
        const steeringForce = this.keys.shift ? this.steering * 1.5 : this.steering;
        if (this.keys.left) this.rotationVelocity += steeringForce;
        if (this.keys.right) this.rotationVelocity -= steeringForce;

        // Apply Storm Noise
        this.rotationVelocity += this.steeringNoise;

        this.car.rotation.y += this.rotationVelocity;
        this.rotationVelocity *= 0.9;

        // Jump Logic
        if (this.keys.space && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 0.5;
        }

        if (this.isJumping) {
            this.car.position.y += this.jumpVelocity;
            this.jumpVelocity -= 0.02; // Gravity
            if (this.car.position.y <= 0) {
                this.car.position.y = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        // Velocity based on forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.car.quaternion);
        
        this.velocity.copy(direction).multiplyScalar(this.speed);
        this.car.position.add(this.velocity);
        
        // Update Camera to follow car
        const cameraOffset = new THREE.Vector3(0, 3, 10);
        cameraOffset.applyQuaternion(this.car.quaternion);
        const targetCameraPos = this.car.position.clone().add(cameraOffset);
        this.camera.position.lerp(targetCameraPos, 0.1);
        this.camera.lookAt(this.car.position);

        // UI Speed
        document.getElementById('speed').innerText = Math.floor(Math.abs(this.speed) * 1000);
        const boostBar = document.getElementById('boost-bar');
        if (this.keys.shift) {
            boostBar.style.width = '100%';
            boostBar.style.boxShadow = '0 0 20px var(--neon-pink)';
        } else {
            boostBar.style.width = '70%';
            boostBar.style.boxShadow = '0 0 10px var(--neon-blue)';
        }
    }

    update() {
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();
        
        if (this.gameState === 'intro') {
            this.camera.position.x = Math.sin(time * 0.5) * 10;
            this.camera.position.z = Math.cos(time * 0.5) * 15;
            this.camera.lookAt(this.car.position);
            this.car.position.y = Math.sin(time * 2) * 0.2;
        }

        if (this.gameState === 'wormhole') {
            const progress = (time - this.wormholeStartTime) / 2; // 2 seconds transition
            if (progress < 1) {
                this.camera.position.z -= 2;
                this.camera.fov = 75 + progress * 40;
                this.camera.updateProjectionMatrix();
                this.wormhole.material.opacity = Math.sin(progress * Math.PI) * 0.5;
                this.wormhole.rotation.z += 0.1;
            } else {
                this.gameState = 'playing';
                this.camera.fov = 75;
                this.camera.updateProjectionMatrix();
                this.wormhole.visible = false;
                document.getElementById('hud').style.display = 'block';
            }
        }

        if (this.gameState === 'playing') {
            this.updatePhysics(delta);
            this.updateAsteroids(delta);
            this.animateThrusters(time);
            this.updateAudio();
            this.updateRadar();
            this.updateTrails();
            this.updateStorms(delta);
            
            // Time Warp Mode Timer
            if (this.currentMode === 'time') {
                this.timeLeft -= delta;
                const minutes = Math.floor(this.timeLeft / 60);
                const seconds = Math.floor(this.timeLeft % 60);
                document.getElementById('timer-value').innerText = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.timeLeft <= 0) {
                    this.toggleMenu(); // Game Over / Menu
                    alert("Out of Time! Returning to base.");
                    this.timeLeft = 60;
                }
            }

            // Floating animation
            this.car.position.y += Math.sin(time * 5) * 0.01;

            // Portal Logic
            if (this.portals && this.currentMode === 'time') {
                this.portals.forEach(p => {
                    if (this.car.position.distanceTo(p.position) < 10) {
                        this.score += 500;
                        this.updateScore();
                        p.scale.multiplyScalar(0.9); // Visual feedback
                    }
                    p.rotation.z += 0.05;
                });
            }
        }
    }

    animateThrusters(time) {
        if (!this.thrusters) return;
        
        const throttle = this.keys.forward ? 2 : 1;
        const boost = this.keys.shift ? 3 : 1;
        
        this.thrusters.forEach((t, i) => {
            const scale = (0.8 + Math.sin(time * 20 + i) * 0.2) * throttle * boost;
            t.mesh.scale.set(scale, scale, scale);
            t.light.intensity = scale * 2;
            t.mesh.material.color.setHex(this.keys.shift ? 0xff00ea : 0x00f2ff);
            t.light.color.setHex(this.keys.shift ? 0xff00ea : 0x00f2ff);
        });
    }

    startGame() {
        this.gameState = 'wormhole';
        this.wormholeStartTime = this.clock.getElapsedTime();
        document.getElementById('intro-screen').classList.add('hidden');
        this.camera.position.set(0, 0, 200);
        this.wormhole.visible = true;
    }

    toggleMenu() {
        const menu = document.getElementById('menu-overlay');
        if (this.gameState === 'playing') {
            this.gameState = 'menu';
            menu.classList.remove('hidden');
        } else if (this.gameState === 'menu') {
            this.gameState = 'playing';
            menu.classList.add('hidden');
        }
    }


    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
