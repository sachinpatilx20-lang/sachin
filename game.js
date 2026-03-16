

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
        this.scene.fog = new THREE.FogExp2(0x000510, 0.002);
        
        // Physics variables
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
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
            space: false,
            flipLeft: false,
            flipRight: false
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
        
        // Deep Improvements
        this.cameraShake = 0;
        this.targetFOV = 75;
        this.driftScore = 0;
        this.shockwaveCooldown = 0;
        this.carBanking = 0;
        this.carPitch = 0;
        this.pointer = new THREE.Vector2();
        this.targetCameraLook = new THREE.Vector3();

        // Quantum Paradox Systems
        this.stateHistory = [];
        this.maxHistory = 180; // 3 seconds at 60fps
        this.isRewinding = false;
        this.paradoxLevel = 0;
        this.blackHole = null;
        this.dejaVuCounter = 0;
        this.echoes = [];
        this.echoTexture = this.createTexture(32, 'white');
        this.roadPlanes = [];
        
        // Pro-Player State
        this.momentum = 0;
        this.bestSectorTimes = [];
        this.currentSector = 0;
        this.sectorStartTime = 0;
        this.lastDelta = 0;
        
        // Disable Sprite raycasting to fix "Raycaster.camera" console spam
        THREE.Sprite.prototype.raycast = () => null;

        this.setupLights();
        this.createTrack();
        this.createEnvironment();
        this.createCar();
        this.createAsteroids();
        this.createCosmicWind();
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
        // Primary Global Light (The Stellar Sun)
        const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
        sunLight.position.set(500, 1000, 500);
        this.scene.add(sunLight);

        // Ambient "Fill" Light for deep space shadows
        const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.4);
        this.scene.add(ambientLight);

        // Distant Star Cluster Glow
        const fillLight = new THREE.PointLight(0x4040ff, 0.5, 2000);
        fillLight.position.set(-500, -200, -500);
        this.scene.add(fillLight);
    }

    createTexture(size = 128, color = 'white') {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
    }

    createCosmicWind() {
        // High-speed streak particles for depth
        const count = 500;
        const geo = new THREE.BufferGeometry();
        const pos = [];
        const vel = [];
        
        for (let i = 0; i < count; i++) {
            pos.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 500);
            vel.push(Math.random() * 0.5 + 0.5); // Random streak speed
        }
        
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x00f2ff,
            size: 1.0,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.cosmicWind = new THREE.Points(geo, mat);
        this.cosmicWindVelocities = vel;
        this.scene.add(this.cosmicWind);
    }

    updateCosmicWind(delta) {
        if (!this.cosmicWind || !this.car) return;
        
        const positions = this.cosmicWind.geometry.attributes.position.array;
        const windSpeed = 50 + Math.abs(this.speed) * 100;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Move particles relative to car momentum
            positions[i+2] += windSpeed * delta * this.cosmicWindVelocities[i/3];
            
            // Wrap around
            if (positions[i+2] > 250) {
                positions[i+2] = -250;
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i+1] = (Math.random() - 0.5) * 100;
            }
        }
        
        this.cosmicWind.geometry.attributes.position.needsUpdate = true;
        this.cosmicWind.position.copy(this.car.position);
    }

    createEnvironment() {
        // Cinematic Background Color
        this.scene.background = new THREE.Color(0x020205);
        this.scene.fog = new THREE.FogExp2(0x020510, 0.0004);

        // High-Density Realistic Starfield (Scientifically Colored)
        const starGeo = new THREE.BufferGeometry();
        const starPos = [];
        const starColors = [];
        const colorPalette = [0xffffff, 0xfff5e6, 0xe6f5ff, 0xffe6e6];

        for (let i = 0; i < 30000; i++) {
            starPos.push((Math.random() - 0.5) * 10000);
            starPos.push((Math.random() - 0.5) * 6000);
            starPos.push((Math.random() - 0.5) * 10000);
            
            const color = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
            starColors.push(color.r, color.g, color.b);
        }

        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stars = new THREE.Points(starGeo, starMat);
        this.scene.add(stars);

        this.createNebulae(colorPalette);
        this.createPlanets();
        this.createSpaceDust();
        this.createBlackHole();
        this.createWormhole();
    }

    createNebulae(palette) {
        // Procedural Volumetric Clouds
        const nebulaTexture = this.createTexture(256, 'white');
        for (let i = 0; i < 60; i++) {
            const color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
            const spriteMat = new THREE.SpriteMaterial({
                map: nebulaTexture,
                color: color,
                transparent: true,
                opacity: 0.03,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(
                (Math.random() - 0.5) * 8000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 8000
            );
            sprite.scale.set(1200 + Math.random() * 2000, 800 + Math.random() * 1200, 1);
            this.scene.add(sprite);
        }
    }

    createBlackHole() {
        const group = new THREE.Group();
        
        // The Singularity (The Event Horizon)
        const holeGeo = new THREE.SphereGeometry(100, 64, 64);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        group.add(hole);

        // Photosphere / Accretion Disk
        const diskGeo = new THREE.TorusGeometry(250, 20, 2, 100);
        const diskMat = new THREE.MeshBasicMaterial({
            color: 0xbc00ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.accretionDisk = new THREE.Mesh(diskGeo, diskMat);
        this.accretionDisk.rotation.x = Math.PI / 2;
        group.add(this.accretionDisk);

        // Core Lighting
        const light = new THREE.PointLight(0xbc00ff, 10, 2000);
        group.add(light);

        group.position.set(0, -500, -2000);
        this.blackHole = group;
        this.scene.add(this.blackHole);
    }

    createPlanets() {
        this.planets = [];
        const biomeTypes = [
            { name: 'Solar', color: 0xffcc00, atmos: 0xff6600, scale: 15, emissive: 5 },
            { name: 'Frozen', color: 0x00f2ff, atmos: 0xffffff, scale: 8, emissive: 1 },
            { name: 'Gas', color: 0xbc00ff, atmos: 0x00f2ff, scale: 12, emissive: 1 },
            { name: 'Toxic', color: 0x66ff00, atmos: 0x003300, scale: 10, emissive: 0.5 }
        ];

        for (let i = 0; i < 15; i++) {
            const type = biomeTypes[i % biomeTypes.length];
            const planetGroup = new THREE.Group();
            
            // Core (Physically Based Surfaces)
            const coreGeo = new THREE.SphereGeometry(10 * type.scale, 64, 64);
            const coreMat = new THREE.MeshPhysicalMaterial({
                color: type.color,
                metalness: 0.1,
                roughness: 0.8,
                specularIntensity: 0.5,
                emissive: type.color,
                emissiveIntensity: type.emissive * 0.1 // Muted for realism
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            planetGroup.add(core);

            // Scientific Atmospheric Scattering (Scattered Glow)
            const atmosGeo = new THREE.SphereGeometry(11.5 * type.scale, 64, 64);
            const atmosMat = new THREE.MeshBasicMaterial({
                color: type.atmos,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const atmos = new THREE.Mesh(atmosGeo, atmosMat);
            planetGroup.add(atmos);

            // Rim Light / Rayleigh Scattering simulation
            const rimGeo = new THREE.SphereGeometry(10.2 * type.scale, 64, 64);
            const rimMat = new THREE.MeshPhysicalMaterial({
                color: type.atmos,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.FrontSide
            });
            const rim = new THREE.Mesh(rimGeo, rimMat);
            planetGroup.add(rim);

            // Unique details (Rings for Gas)
            if (type.name === 'Gas') {
                const ringGeo = new THREE.TorusGeometry(20 * type.scale, 2, 2, 128);
                const ringMat = new THREE.MeshStandardMaterial({
                    color: type.atmos,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5);
                planetGroup.add(ring);
            }

            // Distribute along the track
            const t = Math.random();
            const point = this.trackCurve.getPoint(t);
            planetGroup.position.copy(point).add(new THREE.Vector3(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            ));
            
            this.scene.add(planetGroup);
            this.planets.push({
                group: planetGroup,
                type: type,
                origPos: planetGroup.position.clone()
            });
        }
    }

    createSpaceDust() {
        const dustCount = 1000;
        const geo = new THREE.BufferGeometry();
        const pos = [];
        for (let i = 0; i < dustCount; i++) {
            pos.push((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.5,
            map: this.createTexture(32, 'white'),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.spaceDust = new THREE.Points(geo, mat);
        this.scene.add(this.spaceDust);
    }

    updateSpaceDust() {
        if (!this.spaceDust || !this.car) return;
        this.spaceDust.position.copy(this.car.position);
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
        this.car = group;
        this.scene.add(group);

        // Main Body (Premium Physically Based Material)
        const bodyGeo = new THREE.BoxGeometry(2, 0.4, 4);
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            reflectivity: 1.0,
            emissive: 0xffffff,
            emissiveIntensity: 0.05
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Cockpit (Reinforced Physical Glass)
        const cockpitGeo = new THREE.SphereGeometry(0.5, 32, 16);
        const cockpitMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.95,
            ior: 1.5,
            thickness: 0.1,
            specularIntensity: 1.0
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.scale.set(1, 0.6, 2.5);
        cockpit.position.set(0, 0.2, 0.5);
        group.add(cockpit);

        // Technical Fins
        const finGeo = new THREE.BoxGeometry(0.1, 1, 2);
        const finMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 1 });
        
        const leftFin = new THREE.Mesh(finGeo, finMat);
        leftFin.position.set(-1, 0, 0);
        leftFin.rotation.z = Math.PI / 4;
        group.add(leftFin);

        const rightFin = leftFin.clone();
        rightFin.position.set(1, 0, 0);
        rightFin.rotation.z = -Math.PI / 4;
        group.add(rightFin);

        // High-Fidelity Thrusters
        this.thrusters = [];
        this.skidParticles = [];
        const thrusterPos = [
            new THREE.Vector3(-0.5, 0, 1.8),
            new THREE.Vector3(0.5, 0, 1.8)
        ];

        thrusterPos.forEach(pos => {
            const tGroup = new THREE.Group();
            tGroup.position.copy(pos);
            
            // Plume
            const plumeGeo = new THREE.CylinderGeometry(0, 0.4, 3, 16);
            const plumeMat = new THREE.MeshBasicMaterial({
                color: 0x00f2ff,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            const plume = new THREE.Mesh(plumeGeo, plumeMat);
            plume.rotation.x = -Math.PI / 2;
            tGroup.add(plume);

            // Light
            const light = new THREE.PointLight(0x00f2ff, 3, 10);
            tGroup.add(light);
            
            group.add(tGroup);
            this.thrusters.push({ mesh: plume, light: light, group: tGroup });
        });

        this.car = group;
        this.scene.add(this.car);
        
        // Global Lens Flare Placeholder / Bright Spot
        const sunLight = new THREE.PointLight(0xffffff, 2, 5000);
        sunLight.position.set(0, 1000, 2000);
        this.scene.add(sunLight);

        // Cinematic Muted Trails
        this.trailGeometry = new THREE.PlaneGeometry(0.2, 1);
        this.trailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, // Stellar White
            transparent: true, 
            opacity: 0.2, 
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
    }

    createTrack() {
        const points = [];
        let currentPos = new THREE.Vector3(0, 0, 0);
        
        for (let i = 0; i < 50; i++) {
            points.push(currentPos.clone());
            currentPos.x += (Math.random() - 0.5) * 120;
            currentPos.y += (Math.random() - 0.5) * 80;
            currentPos.z -= 150;
        }

        const curve = new THREE.CatmullRomCurve3(points);
        this.trackCurve = curve;

        // Physically Grounded Energy Ribbon
        const tubeGeo = new THREE.TubeGeometry(curve, 200, 12, 4, false);
        
        this.trackMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x222244, // Deep Stellar Indigo
            metalness: 0.9,
            roughness: 0.1,
            clearcoat: 1.0,
            transparent: true,
            opacity: 0.8,
            emissive: 0x4444ff,
            emissiveIntensity: 0.1, // Drastically reduced for realism
            side: THREE.BackSide
        });
        
        const road = new THREE.Mesh(tubeGeo, this.trackMaterial);
        road.rotation.z = Math.PI / 4;
        this.scene.add(road);
        this.roadPlanes = [road];

        // Wireframe Energy Grid
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0xbc00ff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const grid = new THREE.Mesh(tubeGeo, gridMat);
        grid.rotation.z = Math.PI / 4;
        this.scene.add(grid);
        this.roadPlanes.push(grid);

        this.createMegastructures(curve);

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
            case 'KeyR': this.keys.rewind = pressed; break;
            case 'KeyQ': this.keys.flipLeft = pressed; break;
            case 'KeyE': this.keys.flipRight = pressed; break;
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
            
            // Layer 1: Main Sawtooth Engine
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            this.engineOsc = osc;

            // Layer 2: Sub-Bass Throb
            const sub = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(25, audioCtx.currentTime);
            subGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            sub.connect(subGain);
            subGain.connect(audioCtx.destination);
            sub.start();
            this.engineSub = sub;
            
            // Layer 3: High-Tech Whine
            const tri = audioCtx.createOscillator();
            const triGain = audioCtx.createGain();
            tri.type = 'triangle';
            tri.frequency.setValueAtTime(100, audioCtx.currentTime);
            triGain.gain.setValueAtTime(0.005, audioCtx.currentTime);
            tri.connect(triGain);
            triGain.connect(audioCtx.destination);
            tri.start();
            this.engineTri = tri;

        } catch(e) { console.log("Audio not supported"); }
    }

    updateAudio() {
        if (this.audioCtx) {
            const freq = 50 + Math.abs(this.speed) * 100;
            if (this.engineOsc) this.engineOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
            if (this.engineSub) this.engineSub.frequency.setTargetAtTime(freq / 2, this.audioCtx.currentTime, 0.1);
            if (this.engineTri) this.engineTri.frequency.setTargetAtTime(freq * 2, this.audioCtx.currentTime, 0.1);
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
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
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
            s.userData.life -= 0.03;
            // Photon Ribbon Effect: Scale width over life
            s.scale.x = s.userData.life * 2;
            s.material.opacity = s.userData.life * 0.8;
            s.material.color.setHSL((time * 0.1) % 1, 1, 0.5); // Chameleon trails
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
            for (let i = this.asteroids.length - 1; i >= 0; i--) {
                const a = this.asteroids[i];
                const dist = this.car.position.distanceTo(a.mesh.position);
                
                if (dist < 4) {
                    this.speed *= 0.5; // Crash penalty
                    this.cameraShake = 1.0; // Trigger Screen Shake
                    
                    // Push car away
                    const pushDir = this.car.position.clone().sub(a.mesh.position).normalize();
                    this.car.position.addScaledVector(pushDir, 1);
                }

                // Shockwave interaction
                if (this.shockwaveActive && dist < 50) {
                    this.scene.remove(a.mesh);
                    this.asteroids.splice(i, 1);
                    this.score += 50;
                    this.updateScore();
                }
            }
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
        // Speed-Adaptive Sensitivity: Higher sensitivity at lower speeds for sharper turns
        const adaptiveSensitivity = 1.0 + (1.0 / (Math.abs(this.speed) + 0.5));
        const currentSteering = steeringForce * adaptiveSensitivity;

        if (this.keys.left) this.car.rotateY(currentSteering);
        if (this.keys.right) this.car.rotateY(-currentSteering);
        
        // Pitch Control (Unnatural Cosmic Freedom)
        // Using W/S for acceleration + pitch if keys are held? 
        // No, let's keep steering pure. Maybe add Pitch to specific keys.
        // For now, let's ensure rotateY is LOCAL so it works at every angle.

        // Centrifugal Banking (Visual only)
        const targetBank = (this.keys.left ? 0.3 : 0) + (this.keys.right ? -0.3 : 0);
        this.carBanking = THREE.MathUtils.lerp(this.carBanking, targetBank, 0.1);
        
        // Reset rotation.z for banking specifically without affecting quaternion
        this.car.rotation.z = this.carBanking;
        
        // World Flipping Logic (Q/E)
        if (this.keys.flipLeft && !this.isFlipping) {
            this.flipWorld(Math.PI / 2);
        }
        if (this.keys.flipRight && !this.isFlipping) {
            this.flipWorld(-Math.PI / 2);
        }
        
        // Drift Scoring Logic (Local-Axis Aware)
        const isTurning = this.keys.left || this.keys.right;
        if (isTurning && Math.abs(this.speed) > 0.5) {
            this.driftScore += delta * 150; // Increasedreward for perfect turns
            if (this.driftScore > 15) {
                this.score += Math.floor(this.driftScore);
                this.driftScore = 0;
                this.updateScore();
            }
        } else {
            this.driftScore *= 0.9; // Slowly decay drift potential
        }
        
        // Dynamic Suspensions (Floating)
        const time = this.clock.getElapsedTime();
        const floatY = Math.sin(time * 3) * 0.1;

        // Shockwave Cooldown
        if (this.shockwaveCooldown > 0) this.shockwaveCooldown -= delta;
        this.shockwaveActive = false;

        // Space Ability (Quantum Shockwave + Jump)
        if (this.keys.space) {
            if (!this.isJumping) {
                this.isJumping = true;
                this.jumpVelocity = 0.5;
            }
            if (this.shockwaveCooldown <= 0) {
                this.triggerShockwave();
            }
        }

        // Multi-Planar Snap-to-Road (Local Gravity)
        // Find the car's "local down" vector based on its current flip orientation
        const localDown = new THREE.Vector3(0, -1, 0).applyQuaternion(this.car.quaternion);
        
        // Raycast down to find the track surface
        const raycaster = new THREE.Raycaster(this.car.position, localDown, 0, 20);
        raycaster.camera = this.camera; // Fix Sprite raycast error
        const intersects = raycaster.intersectObjects(this.roadPlanes, true);
        
        if (intersects.length > 0) {
            const dist = intersects[0].distance;
            const targetDist = 0.5 + floatY;
            
            // Apply Jump Physics relative to current plane
            if (this.isJumping) {
                this.car.position.addScaledVector(localDown, -this.jumpVelocity);
                this.jumpVelocity -= 0.02;
                if (dist <= targetDist && this.jumpVelocity < 0) {
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            } else {
                // Snap to surface
                const correction = (targetDist - dist) * 0.2;
                this.car.position.addScaledVector(localDown, -correction);
            }
        }

        // Velocity based on forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.car.quaternion);
        
        // Kinetic Momentum System
        const isCleanDriving = Math.abs(this.steering) < 0.05 && this.speed > 1.0;
        if (isCleanDriving) {
            this.momentum = Math.min(this.momentum + delta * 0.2, 1.0);
        } else if (Math.abs(this.steering) > 0.08) {
            this.momentum = Math.max(this.momentum - delta * 0.5, 0); // Lose momentum on heavy turns
        }

        // Aerodynamic Downforce (Speed-Adaptive Grip)
        // High speed = more grip, but heavier steering
        const downforce = 1.0 + (this.speed * 0.5);
        const steeringWeight = 1.0 + (this.speed * 1.5);
        this.steeringLerp = 0.1 / steeringWeight;
        
        // Update Physics relative to downforce
        const speedFactor = this.speed * (1 + this.momentum * 0.5);
        this.velocity.copy(direction).multiplyScalar(speedFactor);
        this.car.position.add(this.velocity);
        
        // Physically Grounded Weight Transfer (Roll/Pitch)
        const targetRoll = -this.steering * 8 * Math.min(Math.abs(this.speed), 1);
        const targetPitch = -this.speed * 0.15;
        
        this.car.rotation.z = THREE.MathUtils.lerp(this.car.rotation.z, targetRoll, 0.08);
        this.car.rotation.x = THREE.MathUtils.lerp(this.car.rotation.x, targetPitch, 0.08);

        // Suspension Micro-vibration (Scales with speed and momentum)
        this.car.position.y += Math.sin(time * 30) * 0.01 * this.speed * (1 + this.momentum);

        // Pro Telemetry: G-Force Vector
        this.updateGForceVector();
        this.updateSectorDelta(time);

        // Style Bonus Logic
        const isSharpTurn = Math.abs(this.steering) > 0.03;
        if (isSharpTurn && Math.abs(this.speed) > 0.5) {
            this.driftScore += delta * 100;
            if (this.driftScore > 500) {
                this.showStylePopup("SHARP TURN!");
                this.score += 10;
                this.driftScore = 0;
            }
        }

        // HUD Effects
        const hud = document.getElementById('hud');
        if (hud) {
            if (Math.abs(this.speed) > 1.2) {
                hud.classList.add('hud-jitter-active');
            } else {
                hud.classList.remove('hud-jitter-active');
            }
        }

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

    updateCamera() {
        if (!this.car) return;

        // Immersive Panoramic Camera Skew
        const skewLimit = 0.3;
        const targetSkewX = -this.pointer.x * skewLimit;
        const targetSkewY = this.pointer.y * skewLimit;
        
        // Horizontal/Vertical Skew Lerp (Cockpit Inertia)
        this.cameraSkewX = THREE.MathUtils.lerp(this.cameraSkewX || 0, targetSkewX, 0.05);
        this.cameraSkewY = THREE.MathUtils.lerp(this.cameraSkewY || 0, targetSkewY, 0.05);

        const relativeCameraOffset = new THREE.Vector3(0, 3, 8);
        const cameraOffset = relativeCameraOffset.applyQuaternion(this.car.quaternion);
        this.camera.position.lerp(this.car.position.clone().add(cameraOffset), 0.1);

        // Look-at Target with Panoramic Skew
        const lookAtTarget = this.car.position.clone();
        const forward = new THREE.Vector3(0, 0, -20).applyQuaternion(this.car.quaternion);
        lookAtTarget.add(forward);
        
        // Apply skew to look-at vector
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.car.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.car.quaternion);
        lookAtTarget.addScaledVector(right, this.cameraSkewX * 15);
        lookAtTarget.addScaledVector(up, this.cameraSkewY * 10);
        
        this.camera.lookAt(lookAtTarget);

        // Speed-Adaptive FOV (Deep Focus)
        const baseFOV = 70;
        const momentumStretch = this.momentum * 40;
        const speedStretch = Math.min(this.speed * 10, 20);
        this.targetFOV = baseFOV + speedStretch + momentumStretch;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, 0.08);
        this.camera.updateProjectionMatrix();

        // Centrifugal Roll (Cinematic Lean)
        const rollAmount = -this.steering * this.speed * 5;
        this.camera.rotation.z += rollAmount;
        
        // Camera Shake
        if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake *= 0.9;
        }
    }

    update() {
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();
        
        // Screen Shake
        if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
            
            // Haptic HUD Vibration
            const hud = document.getElementById('hud');
            if (hud) {
                hud.style.transform = `translate(${(Math.random() - 0.5) * this.cameraShake * 10}px, ${(Math.random() - 0.5) * this.cameraShake * 10}px)`;
            }
            
            this.cameraShake *= 0.9;
        } else {
            const hud = document.getElementById('hud');
            if (hud) hud.style.transform = 'translate(0,0)';
        }

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
            if (this.isRewinding) {
                this.rewindTime();
            } else {
                this.recordState();
                this.updatePhysics(delta);
            }
            
            this.updateAsteroids(delta);
            this.animateThrusters(time);
            this.updateAudio();
            this.updateRadar();
            this.updateTrails();
            this.updateStorms(delta);
            this.updateSpaceDust();
            this.updateCosmicWind(delta);
            this.updateBlackHole(delta);
            this.updateCamera();
            this.updateCosmicBiomes(time, delta);
            this.checkEnergySkids(delta);
            this.updateProHUD();
            
            if (this.camera && this.isRewinding) {
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 120, 0.1);
                this.camera.updateProjectionMatrix();
            }
            
            // Pulse track material
            if (this.trackMaterial) {
                this.trackMaterial.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.3;
            }

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

            // Paradox UI Update
            const paradoxInd = document.getElementById('paradox-indicator');
            const paradoxFill = document.getElementById('paradox-fill');
            if (this.paradoxLevel > 0.1) {
                paradoxInd.classList.remove('hidden');
                paradoxFill.style.width = `${Math.min(this.paradoxLevel * 100, 100)}%`;
                if (this.paradoxLevel > 0.5) document.body.classList.add('glitch-active');
                else document.body.classList.remove('glitch-active');
            } else {
                paradoxInd.classList.add('hidden');
                document.body.classList.remove('glitch-active');
            }

            // Update Temporal Echoes
            this.updateEchoes();

            // Deja Vu Mechanics
            if (this.score > 0 && this.score % 5000 < 100) {
                this.triggerDejaVu();
            }

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

    updateCosmicBiomes(time, delta) {
        if (!this.planets || !this.car || !this.trackMaterial) return;
        
        // Find nearest planet
        let nearest = null;
        let minDist = Infinity;
        
        this.planets.forEach(p => {
            const d = this.car.position.distanceTo(p.group.position);
            if (d < minDist) {
                minDist = d;
                nearest = p;
            }
        });
        
        if (nearest && minDist < 1500) {
            const influence = 1 - (minDist / 1500);
            const targetColor = new THREE.Color(nearest.type.color);
            
            // Lerp track color
            this.trackMaterial.color.lerp(targetColor, influence * 0.05);
            this.trackMaterial.emissive.lerp(targetColor, influence * 0.05);
            
            // Dynamic Fog
            this.scene.fog.color.lerp(targetColor, influence * 0.01);
            
            // Biome Physics Forces
            if (nearest.type.name === 'Solar') {
                const flareForce = Math.sin(time * 2) * influence * 0.02;
                this.car.position.x += flareForce;
            }
            if (nearest.type.name === 'Toxic') {
                this.speed *= (1 - influence * 0.005); // Resitance
            }
        } else {
            // Default Deep Space Biome
            const defaultColor = new THREE.Color(0x00f2ff);
            this.trackMaterial.color.lerp(defaultColor, 0.01);
            this.trackMaterial.emissive.lerp(defaultColor, 0.01);
            this.scene.fog.color.lerp(new THREE.Color(0x000510), 0.01);
        }
    }

    checkEnergySkids(delta) {
        if (!this.car || Math.abs(this.speed) < 0.5) return;
        
        // Trigger skids on sharp turns or drifting (Space)
        const isSharpTurn = Math.abs(this.steering) > 0.03;
        if (isSharpTurn || this.keys.space) {
            this.spawnEnergySkid();
        }
        
        // Update existing skid particles
        for (let i = this.skidParticles.length - 1; i >= 0; i--) {
            const p = this.skidParticles[i];
            p.life -= delta * 2;
            p.mesh.scale.multiplyScalar(0.95);
            p.mesh.material.opacity = p.life;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.skidParticles.splice(i, 1);
            }
        }
    }

    spawnEnergySkid() {
        const geo = new THREE.IcosahedronGeometry(0.2, 0);
        const mat = new THREE.MeshBasicMaterial({
            color: this.trackMaterial.color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const spark = new THREE.Mesh(geo, mat);
        const offset = new THREE.Vector3((Math.random() - 0.5) * 2, -0.5, (Math.random() - 0.5) * 2);
        spark.position.copy(this.car.position).add(offset.applyQuaternion(this.car.quaternion));
        
        this.scene.add(spark);
        this.skidParticles.push({ mesh: spark, life: 1.0 });
    }

    createMegastructures(curve) {
        const count = 10;
        const ringGeo = new THREE.TorusGeometry(40, 2, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: 0x00f2ff,
            emissiveIntensity: 1,
            metalness: 1,
            roughness: 0
        });

        for (let i = 0; i < count; i++) {
            const t = (i + 0.5) / count;
            const point = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(point);
            ring.lookAt(point.clone().add(tangent));
            this.scene.add(ring);
            
            // Add light beacon
            const light = new THREE.PointLight(0x00f2ff, 10, 100);
            light.position.copy(point);
            this.scene.add(light);
        }
    }

    animateThrusters(time) {
        if (!this.thrusters) return;
        
        const boostMultiplier = this.keys.shift ? 2.5 : 1;
        
        this.thrusters.forEach((t, i) => {
            const scale = (1.0 + Math.sin(time * 30 + i) * 0.2) * boostMultiplier;
            t.mesh.scale.set(1, scale, 1);
            t.light.intensity = scale * 5;
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


    updateBlackHole(delta) {
        if (!this.blackHole || !this.car) return;
        
        // Accretion Disk Rotation
        if (this.accretionDisk) {
            this.accretionDisk.rotation.z += delta * 5;
        }

        // Gravitational Pull
        const dist = this.car.position.distanceTo(this.blackHole.position);
        if (dist < 1000) {
            const pullStrength = (1000 - dist) / 5000;
            const dir = this.blackHole.position.clone().sub(this.car.position).normalize();
            this.car.position.addScaledVector(dir, pullStrength);
            
            // Spatial Distortion
            this.paradoxLevel = pullStrength * 2;
            document.getElementById('hud').style.filter = `hue-rotate(${this.paradoxLevel * 360}deg) contrast(${1 + this.paradoxLevel})`;
        } else {
            this.paradoxLevel = 0;
            document.getElementById('hud').style.filter = '';
        }
    }

    recordState() {
        if (!this.car) return;
        this.stateHistory.push({
            pos: this.car.position.clone(),
            rot: this.car.rotation.clone(),
            speed: this.speed,
            score: this.score
        });
        if (this.stateHistory.length > this.maxHistory) {
            this.stateHistory.shift();
        }
        
        // Trigger Rewind on R
        if (this.keys.rewind && this.stateHistory.length > 20) {
            this.isRewinding = true;
        }
    }

    showStylePopup(text) {
        const popup = document.createElement('div');
        popup.className = 'style-multiplier';
        popup.style.position = 'fixed';
        popup.style.top = '40%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '1000';
        popup.innerText = text;
        document.body.appendChild(popup);
        setTimeout(() => {
            if (popup.parentNode) document.body.removeChild(popup);
        }, 800);
    }

    rewindTime() {
        if (this.stateHistory.length > 0) {
            const state = this.stateHistory.pop();
            this.car.position.copy(state.pos);
            this.car.rotation.copy(state.rot);
            this.speed = state.speed;
            this.score = state.score;
            this.cameraShake = 0.5;
            
            // Unnatural Glitch Effect
            this.renderer.domElement.style.filter = `invert(${Math.random() > 0.8 ? 1 : 0}) hue-rotate(${Math.random() * 360}deg)`;
        } else {
            this.isRewinding = false;
            this.renderer.domElement.style.filter = '';
            this.camera.fov = 75;
            this.camera.updateProjectionMatrix();
        }
    }

    updateEchoes() {
        // Spawn a new echo every few seconds
        if (this.gameState === 'playing' && Math.random() < 0.01 && this.stateHistory.length > 100) {
            this.createEcho();
        }

        for (let i = this.echoes.length - 1; i >= 0; i--) {
            const echo = this.echoes[i];
            if (echo.historyIndex < echo.path.length) {
                const state = echo.path[echo.historyIndex];
                echo.mesh.position.copy(state.pos);
                echo.mesh.rotation.copy(state.rot);
                echo.historyIndex += 2; // Fast forward echo
                echo.mesh.material.opacity = (1 - echo.historyIndex / echo.path.length) * 0.3;
            } else {
                this.scene.remove(echo.mesh);
                this.echoes.splice(i, 1);
            }
        }
    }

    createEcho() {
        const ghostGeo = new THREE.BoxGeometry(2, 0.5, 4);
        const ghostMat = new THREE.MeshBasicMaterial({ color: 0xbc00ff, transparent: true, opacity: 0.3, wireframe: true });
        const ghost = new THREE.Mesh(ghostGeo, ghostMat);
        this.scene.add(ghost);

        this.echoes.push({
            mesh: ghost,
            path: [...this.stateHistory],
            historyIndex: 0
        });
    }

    triggerDejaVu() {
        this.cameraShake = 2.0;
        this.speed *= 1.2;
        // Visual indicator
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.background = 'white';
        flash.style.zIndex = '1000';
        flash.style.pointerEvents = 'none';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.transition = 'opacity 1s';
            flash.style.opacity = '0';
            setTimeout(() => document.body.removeChild(flash), 1000);
        }, 50);
    }

    flipWorld(angle) {
        this.isFlipping = true;
        
        // Use a Tween-like smooth rotation for the car's local-axis flip
        const startQuaternion = this.car.quaternion.clone();
        const flipRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
        const endQuaternion = startQuaternion.clone().multiply(flipRotation);
        
        let progress = 0;
        const duration = 20; // frames
        
        const animateFlip = () => {
            progress++;
            this.car.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress / duration);
            this.cameraShake = 0.5;
            
            if (progress < duration) {
                requestAnimationFrame(animateFlip);
            } else {
                this.isFlipping = false;
                this.triggerDejaVu(); // Visual flash for dimension shift
            }
        };
        
        animateFlip();
    }

    updateGForceVector() {
        // Internal logic for G-force calculation based on acceleration and turning
        this.gForce = {
            x: -this.steering * this.speed * 5,
            y: (this.speed - (this.lastSpeed || 0)) * 10
        };
        this.lastSpeed = this.speed;
    }

    updateSectorDelta(time) {
        // Divide the infinite track loop into 4 logical sectors
        const sectorSize = 0.25;
        const currentProgress = (this.carProgress || 0) % 1;
        const sectorIndex = Math.floor(currentProgress / sectorSize);
        
        if (sectorIndex !== this.currentSector) {
            const sectorTime = time - this.sectorStartTime;
            const pb = this.bestSectorTimes[this.currentSector] || sectorTime;
            
            if (sectorTime <= pb) {
                this.bestSectorTimes[this.currentSector] = sectorTime;
                if (this.lastDelta < 0) this.triggerNovaEffect(); // Surprise Supernova on fast sector!
            }
            
            this.lastDelta = sectorTime - pb;
            this.currentSector = sectorIndex;
            this.sectorStartTime = time;
            
            this.triggerDeltaPopup();
        }
    }

    triggerNovaEffect() {
        // Procedural Supernova Flash
        const novaGeo = new THREE.SphereGeometry(1, 32, 32);
        const novaMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        const nova = new THREE.Mesh(novaGeo, novaMat);
        nova.position.copy(this.car.position).add(new THREE.Vector3(0, 0, -50).applyQuaternion(this.car.quaternion));
        this.scene.add(nova);

        let scale = 1;
        const animateNova = () => {
            scale *= 1.4;
            nova.scale.set(scale, scale, scale);
            nova.material.opacity *= 0.9;
            if (nova.material.opacity > 0.01) {
                requestAnimationFrame(animateNova);
            } else {
                this.scene.remove(nova);
                nova.geometry.dispose();
                nova.material.dispose();
            }
        };
        animateNova();
        
        // Secondary Shockwave Ring
        const ringGeo = new THREE.RingGeometry(1, 2, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(nova.position);
        ring.lookAt(this.camera.position);
        this.scene.add(ring);

        let rScale = 1;
        const animateRing = () => {
            rScale += 2;
            ring.scale.set(rScale, rScale, 1);
            ring.material.opacity *= 0.95;
            if (ring.material.opacity > 0.01) {
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
            }
        };
        animateRing();
    }

    triggerDeltaPopup() {
        const deltaEl = document.getElementById('delta-timer');
        if (!deltaEl) return;
        
        const sign = this.lastDelta <= 0 ? '-' : '+';
        deltaEl.textContent = `${sign}${Math.abs(this.lastDelta).toFixed(3)}s`;
        deltaEl.className = this.lastDelta <= 0 ? 'delta-fast' : 'delta-slow';
        
        // Remove 'hidden' class if present
        deltaEl.classList.remove('hidden');
        
        setTimeout(() => {
            deltaEl.classList.add('hidden');
        }, 2000);
    }

    updateProHUD() {
        const momentumFill = document.getElementById('momentum-fill');
        if (momentumFill) {
            momentumFill.style.width = `${this.momentum * 100}%`;
            momentumFill.style.boxShadow = `0 0 ${this.momentum * 20}px #fff`;
        }
        
        // Chromatic Speed Warp (Surprise Visual Filter)
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const aberration = this.momentum * 10;
            const blur = this.momentum * 2;
            canvas.style.filter = `contrast(1.05) brightness(1.0) drop-shadow(0 0 5px rgba(255,255,255,${this.momentum * 0.5})) blur(${blur}px)`;
            
            // Screen Distortion on High Momentum
            if (this.momentum > 0.8) {
                document.body.style.filter = `hue-rotate(${Math.sin(Date.now()*0.01)*10}deg)`;
            } else {
                document.body.style.filter = 'none';
            }
        }

        // Surprise: Spawn Rare Monolith
        if (Math.random() > 0.999 && this.gameState === 'playing') {
            this.createMonolith();
        }

        // Adaptive HUD Jitter based on momentum and speed
        const hud = document.getElementById('hud');
        if (hud && (this.momentum > 0.5 || this.speed > 2.0)) {
            const intensity = (this.momentum * 5) + (this.speed * 2);
            hud.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
        } else if (hud) {
            hud.style.transform = 'translate(0, 0)';
        }
    }

    createMonolith() {
        // High-Vibrancy Cosmic Crystal Monolith
        const geo = new THREE.BoxGeometry(40, 150, 40);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            emissive: 0x00f2ff,
            emissiveIntensity: 5.0,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6
        });
        const monolith = new THREE.Mesh(geo, mat);
        
        // Position far ahead and slightly offset
        const forward = new THREE.Vector3(0, 0, -500).applyQuaternion(this.car.quaternion);
        const offset = new THREE.Vector3((Math.random()-0.5)*400, (Math.random()-0.5)*200, 0).applyQuaternion(this.car.quaternion);
        monolith.position.copy(this.car.position).add(forward).add(offset);
        monolith.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        
        this.scene.add(monolith);
        
        // Fading logic for transient encounter
        setTimeout(() => {
            this.scene.remove(monolith);
            geo.dispose();
            mat.dispose();
        }, 10000);
    }

    updateEchoes() {
        if (this.momentum < 0.7) return; // Only at high speed
        
        // Spawn Temporal Echo (After-Image)
        if (Math.random() > 0.85) {
            const ghostGroup = this.car.clone();
            
            // Set ghost materials to transparent/emissive
            ghostGroup.traverse(child => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.3;
                    child.material.emissiveIntensity *= 2;
                }
            });

            this.scene.add(ghostGroup);
            
            let alpha = 0.3;
            const animateEcho = () => {
                alpha -= 0.01;
                ghostGroup.traverse(child => {
                    if (child.isMesh) child.material.opacity = alpha;
                });
                
                if (alpha > 0) {
                    requestAnimationFrame(animateEcho);
                } else {
                    this.scene.remove(ghostGroup);
                    ghostGroup.traverse(child => {
                        if (child.isMesh) {
                            child.geometry.dispose();
                            child.material.dispose();
                        }
                    });
                }
            };
            animateEcho();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
