        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
        import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

        const config = {
            paused: false,
            activePaletteIndex: 2,
            currentFormation: 4,
            numFormations: 5,
            densityFactor: 1
        };

        const colorPalettes = [
            [new THREE.Color(0x4F46E5), new THREE.Color(0x7C3AED), new THREE.Color(0xC026D3), new THREE.Color(0xDB2777), new THREE.Color(0x8B5CF6)],
            [new THREE.Color(0xF59E0B), new THREE.Color(0xF97316), new THREE.Color(0xDC2626), new THREE.Color(0x7F1D1D), new THREE.Color(0xFBBF24)],
            [new THREE.Color(0xEC4899), new THREE.Color(0x8B5CF6), new THREE.Color(0x6366F1), new THREE.Color(0x3B82F6), new THREE.Color(0xA855F7)],
            [new THREE.Color(0x10B981), new THREE.Color(0xA3E635), new THREE.Color(0xFACC15), new THREE.Color(0xFB923C), new THREE.Color(0x4ADE80)]
        ];

        const heroEl = document.getElementById('orecube-hero');
        const getSize = () => ({ w: Math.max(heroEl.clientWidth, 1), h: Math.max(heroEl.clientHeight, 1) });
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let visible = true;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0015);

        const camera = new THREE.PerspectiveCamera(60, getSize().w / getSize().h, 0.1, 1200);
        camera.position.set(0, 5, 22);

        const canvasElement = document.getElementById('neural-network-canvas'); // Get canvas element
        const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(getSize().w, getSize().h, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Hides the big glowing background squares only where they would sit over the cube
        const starMask = {
            uCenter: { value: new THREE.Vector2() },      // cube centre on screen (device pixels)
            uRadius: { value: 0 },                        // cube size on screen (device pixels)
            uResolution: { value: new THREE.Vector2(1, 1) },
            uPR: { value: 1 }
        };

        function createStarfield() {
            const count = 5000, pos = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(40, 120);
                const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                pos.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.15,
                sizeAttenuation: true,
                depthWrite: false,
                opacity: 0.8,
                transparent: true
            });
            // Same stars as the template; the only addition is the per-star fade over the cube
            mat.onBeforeCompile = (shader) => {
                Object.assign(shader.uniforms, starMask);
                shader.vertexShader = shader.vertexShader
                    .replace('void main() {', 'uniform vec2 uCenter; uniform float uRadius; uniform vec2 uResolution; uniform float uPR;\nvarying float vVisible;\nvoid main() {')
                    .replace('#include <fog_vertex>', `#include <fog_vertex>
                        vec2 sp = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uResolution;
                        float inside = 1.0 - smoothstep(uRadius, uRadius * 1.2, distance(sp, uCenter));
                        float big = smoothstep(3.0 * uPR, 5.0 * uPR, gl_PointSize);   // only the large squares
                        vVisible = 1.0 - big * inside;`);
                shader.fragmentShader = shader.fragmentShader
                    .replace('void main() {', 'varying float vVisible;\nvoid main() {')
                    .replace('#include <fog_fragment>', '#include <fog_fragment>\n                        gl_FragColor.a *= vVisible;');
            };
            return new THREE.Points(geo, mat);
        }
        const starField = createStarfield();
        scene.add(starField);
        const holder = new THREE.Group();     // everything in the network lives here, so old and new shapes rotate as one
        scene.add(holder);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableRotate = true;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.minDistance = 12;
        controls.maxDistance = 60;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.15;
        controls.enablePan = false;
        renderer.domElement.style.touchAction = 'pan-y';   // vertical swipes keep scrolling on phones

        const mobileViewport = window.matchMedia('(max-width: 767px)');
        function updateViewportControls() {
            const isMobile = mobileViewport.matches;
            controls.enableRotate = true;
            controls.enableZoom = isMobile;
            controls.zoomSpeed = isMobile ? 0.85 : 0.6;
            controls.rotateSpeed = isMobile ? 0.9 : 0.5;
        }
        updateViewportControls();
        mobileViewport.addEventListener('change', updateViewportControls);

        let leftMouseHeld = false;

        renderer.domElement.addEventListener('pointerdown', (event) => {
            if (event.button === 0) leftMouseHeld = true;
        });
        window.addEventListener('pointerup', (event) => {
            if (event.button === 0) leftMouseHeld = false;
        });
        renderer.domElement.addEventListener('pointerleave', () => {
            leftMouseHeld = false;
        });
        renderer.domElement.addEventListener('wheel', (event) => {
            if (!leftMouseHeld) return;

            event.preventDefault();
            const offset = camera.position.clone().sub(controls.target);
            const distance = offset.length();
            const zoomDistance = THREE.MathUtils.clamp(distance + event.deltaY * 0.012, controls.minDistance, controls.maxDistance);
            camera.position.copy(controls.target).addScaledVector(offset.normalize(), zoomDistance);
            controls.update();
        }, { passive: false });

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(getSize().w, getSize().h), 1.5, 0.4, 0.68);
        composer.addPass(bloomPass);

        const filmPass = new FilmPass(0.35, 0.55, 2048, false);
        composer.addPass(filmPass);

        composer.addPass(new OutputPass());

        const pulseUniforms = {
            uTime: { value: 0.0 },
            uPulsePositions: { value: [new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3)] },
            uPulseTimes: { value: [-1e3, -1e3, -1e3] },
            uPulseColors: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
            uPulseSpeed: { value: 15.0 },
            uBaseNodeSize: { value: 0.5 },
            uActivePalette: { value: 0 },
            uFade: { value: 1.0 }
        };

        const noiseFunctions = `
        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
            const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
            vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);
            vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
            vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
            vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
            float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
            vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
            vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
            vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
            vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
            vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
            vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
            m*=m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
        float fbm(vec3 p,float time){
            float value=0.0;float amplitude=0.5;float frequency=1.0;int octaves=3;
            for(int i=0;i<octaves;i++){
                value+=amplitude*snoise(p*frequency+time*0.2*frequency);
                amplitude*=0.5;frequency*=2.0;
            }
            return value;
        }`;

        const nodeShader = {
            vertexShader: `${noiseFunctions}
            attribute float nodeSize;attribute float nodeType;attribute vec3 nodeColor;attribute vec3 connectionIndices;attribute float distanceFromRoot;
            uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;uniform float uBaseNodeSize;
            varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;

            float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                if (pulseTime < 0.0) return 0.0;
                float timeSinceClick = uTime - pulseTime;
                if (timeSinceClick < 0.0 || timeSinceClick > 3.0) return 0.0;

                float pulseRadius = timeSinceClick * uPulseSpeed;
                float distToClick = distance(worldPos, pulsePos);
                float pulseThickness = 2.0;
                float waveProximity = abs(distToClick - pulseRadius);

                return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(3.0, 0.0, timeSinceClick);
            }

            void main() {
                vNodeType = nodeType;
                vColor = nodeColor;
                vDistanceFromRoot = distanceFromRoot;

                vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vPosition = worldPos;

                float totalPulseIntensity = 0.0;
                for (int i = 0; i < 3; i++) {
                    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                }
                vPulseIntensity = min(totalPulseIntensity, 1.0);

                float timeScale = 0.5 + 0.5 * sin(uTime * 0.8 + distanceFromRoot * 0.2);
                float baseSize = nodeSize * (0.8 + 0.2 * timeScale);
                float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.0);

                vec3 modifiedPosition = position;
                if (nodeType > 0.5) {
                    float noise = fbm(position * 0.1, uTime * 0.1);
                    modifiedPosition += normal * noise * 0.2;
                }

                vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition, 1.0);
                gl_PointSize = pulseSize * uBaseNodeSize * (800.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }`,

            fragmentShader: `
            uniform float uFade;uniform float uTime;uniform vec3 uPulseColors[3];uniform int uActivePalette;
            varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;

            void main() {
                vec2 center = 2.0 * gl_PointCoord - 1.0;
                float dist = length(center);
                if (dist > 1.0) discard;

                float glowStrength = 1.0 - smoothstep(0.0, 1.0, dist);
                glowStrength = pow(glowStrength, 1.4);

                vec3 baseColor = vColor * (0.8 + 0.2 * sin(uTime * 0.5 + vDistanceFromRoot * 0.3));
                vec3 finalColor = baseColor;

                if (vPulseIntensity > 0.0) {
                    vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.3);
                    finalColor = mix(baseColor, pulseColor, vPulseIntensity);
                    finalColor *= (1.0 + vPulseIntensity * 0.7);
                }

                float alpha = glowStrength * (0.9 - 0.5 * dist);

                float camDistance = length(vPosition - cameraPosition);
                float distanceFade = smoothstep(80.0, 10.0, camDistance);

                if (vNodeType > 0.5) {
                    alpha *= 0.85;
                } else {
                    finalColor *= 1.2;
                }

                gl_FragColor = vec4(finalColor, alpha * distanceFade * uFade);
            }`
        };

        const connectionShader = {
            vertexShader: `${noiseFunctions}
            attribute vec3 startPoint;attribute vec3 endPoint;attribute float connectionStrength;attribute float pathIndex;attribute vec3 connectionColor;
            uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;
            varying vec3 vColor;varying float vConnectionStrength;varying float vPulseIntensity;varying float vPathPosition;

            float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                if (pulseTime < 0.0) return 0.0;
                float timeSinceClick = uTime - pulseTime;
                if (timeSinceClick < 0.0 || timeSinceClick > 3.0) return 0.0;
                float pulseRadius = timeSinceClick * uPulseSpeed;
                float distToClick = distance(worldPos, pulsePos);
                float pulseThickness = 2.0;
                float waveProximity = abs(distToClick - pulseRadius);
                return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(3.0, 0.0, timeSinceClick);
            }

            void main() {
                float t = position.x;
                vPathPosition = t;

                vec3 midPoint = mix(startPoint, endPoint, 0.5);
                float pathOffset = sin(t * 3.14159) * 0.1;
                vec3 perpendicular = normalize(cross(normalize(endPoint - startPoint), vec3(0.0, 1.0, 0.0)));
                if (length(perpendicular) < 0.1) perpendicular = vec3(1.0, 0.0, 0.0);
                midPoint += perpendicular * pathOffset;

                vec3 p0 = mix(startPoint, midPoint, t);
                vec3 p1 = mix(midPoint, endPoint, t);
                vec3 finalPos = mix(p0, p1, t);

                float noiseTime = uTime * 0.2;
                float noise = fbm(vec3(pathIndex * 0.1, t * 0.5, noiseTime), noiseTime);
                finalPos += perpendicular * noise * 0.1;

                vec3 worldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;

                float totalPulseIntensity = 0.0;
                for (int i = 0; i < 3; i++) {
                    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                }
                vPulseIntensity = min(totalPulseIntensity, 1.0);

                vColor = connectionColor;
                vConnectionStrength = connectionStrength;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
            }`,

            fragmentShader: `
            uniform float uFade;uniform float uTime;uniform vec3 uPulseColors[3];
            varying vec3 vColor;varying float vConnectionStrength;varying float vPulseIntensity;varying float vPathPosition;

            void main() {
                vec3 baseColor = vColor * (0.7 + 0.3 * sin(uTime * 0.5 + vPathPosition * 10.0));

                float flowPattern = sin(vPathPosition * 20.0 - uTime * 3.0) * 0.5 + 0.5;
                float flowIntensity = 0.3 * flowPattern * vConnectionStrength;

                vec3 finalColor = baseColor;

                if (vPulseIntensity > 0.0) {
                    vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.3);
                    finalColor = mix(baseColor, pulseColor, vPulseIntensity);
                    flowIntensity += vPulseIntensity * 0.5;
                }

                finalColor *= (0.6 + flowIntensity + vConnectionStrength * 0.4);

                float alpha = 0.8 * vConnectionStrength + 0.2 * flowPattern;
                alpha = mix(alpha, min(1.0, alpha * 2.0), vPulseIntensity);

                gl_FragColor = vec4(finalColor, alpha * uFade);
            }`
        };

        class Node {
            constructor(position, level = 0, type = 0) {
                this.position = position;
                this.connections = [];
                this.level = level;
                this.type = type;
                this.size = type === 0 ? THREE.MathUtils.randFloat(0.7, 1.2) : THREE.MathUtils.randFloat(0.4, 0.9);
                this.distanceFromRoot = 0;
            }

            addConnection(node, strength = 1.0) {
                if (!this.isConnectedTo(node)) {
                    this.connections.push({ node, strength });
                    node.connections.push({ node: this, strength });
                }
            }

            isConnectedTo(node) {
                return this.connections.some(conn => conn.node === node);
            }
        }

        function generateNeuralNetwork(formationIndex, densityFactor = 1.0) {
            let nodes = [];
            let rootNode;

            function generateOrecubeLattice() {
                // A "cube-ish" cloud: points spread over a rounded, slightly wobbly cube.
                rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0); rootNode.size = 1.5; nodes.push(rootNode);

                const half = 9;                                   // size of the cube
                const count = Math.floor(260 * densityFactor);    // number of nodes
                const rounding = 0.25;                            // 0 = sharp cube, 1 = sphere
                const wobble = 1.2;                               // random offset, makes it organic
                const reach = 6.5;                                // max length of a connection
                const shape = [];

                for (let i = 0; i < count; i++) {
                    // random point -> pushed out onto the cube surface -> pulled back inside a little
                    const p = new THREE.Vector3(
                        THREE.MathUtils.randFloatSpread(2),
                        THREE.MathUtils.randFloatSpread(2),
                        THREE.MathUtils.randFloatSpread(2)
                    );
                    p.divideScalar(Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) || 1);
                    const depth = Math.pow(Math.random(), 2.2) * 0.55;       // most points stay near the surface
                    p.multiplyScalar(1 - depth);
                    p.lerp(p.clone().normalize().multiplyScalar((1 - depth) * 1.15), rounding);   // soften corners
                    p.multiplyScalar(half);
                    p.add(new THREE.Vector3(
                        THREE.MathUtils.randFloatSpread(wobble * 2),
                        THREE.MathUtils.randFloatSpread(wobble * 2),
                        THREE.MathUtils.randFloatSpread(wobble * 2)
                    ));
                    const level = depth < 0.12 ? 1 : (depth < 0.3 ? 2 : 3);
                    const node = new Node(p, level, Math.random() < 0.25 ? 1 : 0);
                    node.distanceFromRoot = p.length();
                    nodes.push(node);
                    shape.push(node);
                }

                // 8 bigger "corner" nodes so you can still feel the cube
                for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
                    const pos = new THREE.Vector3(x, y, z).multiplyScalar(half * 0.92).add(new THREE.Vector3(
                        THREE.MathUtils.randFloatSpread(wobble),
                        THREE.MathUtils.randFloatSpread(wobble),
                        THREE.MathUtils.randFloatSpread(wobble)
                    ));
                    const node = new Node(pos, 4, 1);
                    node.size = 1.4;
                    node.distanceFromRoot = pos.length();
                    nodes.push(node);
                    shape.push(node);
                }

                // connect every node to its 3 nearest neighbours (like neurons linking up)
                for (const node of shape) {
                    const nearest = shape
                        .filter(other => other !== node)
                        .map(other => ({ other, d: node.position.distanceTo(other.position) }))
                        .sort((a, b) => a.d - b.d)
                        .slice(0, 3);
                    for (const { other, d } of nearest) {
                        if (d < reach) node.addConnection(other, 1 - d / (reach * 1.4));
                    }
                }

                // the centre node feeds the 8 nodes closest to it
                shape.slice().sort((a, b) => a.distanceFromRoot - b.distanceFromRoot)
                    .slice(0, 8).forEach(n => rootNode.addConnection(n, 0.9));
            }

            generateOrecubeLattice();

             if (densityFactor < 1.0) {
                const originalNodeCount = nodes.length;
                nodes = nodes.filter((node, index) => {
                    if (node === rootNode) return true;
                    const hash = (index * 31 + Math.floor(densityFactor * 100)) % 100;
                    return hash < (densityFactor * 100);
                });

                nodes.forEach(node => {
                    node.connections = node.connections.filter(conn => nodes.includes(conn.node));
                });
                console.log(`Density Filter: ${originalNodeCount} -> ${nodes.length} nodes`);
            }

            return { nodes, rootNode };
        }

        let neuralNetwork = null, nodesMesh = null, connectionsMesh = null;

        function createNetworkVisualization(formationIndex, densityFactor = 1.0) {
            console.log(`Creating formation ${formationIndex}, density ${densityFactor}`);
            if (nodesMesh) {
                holder.remove(nodesMesh);
                nodesMesh.geometry.dispose();
                nodesMesh.material.dispose();
                nodesMesh = null;
            }
            if (connectionsMesh) {
                holder.remove(connectionsMesh);
                connectionsMesh.geometry.dispose();
                connectionsMesh.material.dispose();
                connectionsMesh = null;
            }

            neuralNetwork = generateNeuralNetwork(formationIndex, densityFactor);
            if (!neuralNetwork || neuralNetwork.nodes.length === 0) {
                console.error("Network generation failed or resulted in zero nodes.");
                return;
            }

            const nodesGeometry = new THREE.BufferGeometry();
            const nodePositions = [], nodeTypes = [], nodeSizes = [], nodeColors = [], connectionIndices = [], distancesFromRoot = [];

            neuralNetwork.nodes.forEach((node, index) => {
                nodePositions.push(node.position.x, node.position.y, node.position.z);
                nodeTypes.push(node.type);
                nodeSizes.push(node.size);
                distancesFromRoot.push(node.distanceFromRoot);

                const indices = node.connections.slice(0, 3).map(conn => neuralNetwork.nodes.indexOf(conn.node));
                while (indices.length < 3) indices.push(-1);
                connectionIndices.push(...indices);

                const palette = colorPalettes[config.activePaletteIndex];
                const colorIndex = Math.min(node.level, palette.length - 1);
                const baseColor = palette[colorIndex % palette.length].clone();
                baseColor.offsetHSL(
                    THREE.MathUtils.randFloatSpread(0.05),
                    THREE.MathUtils.randFloatSpread(0.1),
                    THREE.MathUtils.randFloatSpread(0.1)
                );
                nodeColors.push(baseColor.r, baseColor.g, baseColor.b);
            });

            nodesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
            nodesGeometry.setAttribute('nodeType', new THREE.Float32BufferAttribute(nodeTypes, 1));
            nodesGeometry.setAttribute('nodeSize', new THREE.Float32BufferAttribute(nodeSizes, 1));
            nodesGeometry.setAttribute('nodeColor', new THREE.Float32BufferAttribute(nodeColors, 3));
            nodesGeometry.setAttribute('connectionIndices', new THREE.Float32BufferAttribute(connectionIndices, 3));
            nodesGeometry.setAttribute('distanceFromRoot', new THREE.Float32BufferAttribute(distancesFromRoot, 1));

            const nodesMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(pulseUniforms),
                vertexShader: nodeShader.vertexShader,
                fragmentShader: nodeShader.fragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            nodesMesh = new THREE.Points(nodesGeometry, nodesMaterial);
            holder.add(nodesMesh);

            const connectionsGeometry = new THREE.BufferGeometry();
            const connectionColors = [], connectionStrengths = [], connectionPositions = [], startPoints = [], endPoints = [], pathIndices = [];
            const processedConnections = new Set();
            let pathIndex = 0;

            neuralNetwork.nodes.forEach((node, nodeIndex) => {
                node.connections.forEach(connection => {
                    const connectedNode = connection.node;
                    const connectedIndex = neuralNetwork.nodes.indexOf(connectedNode);
                    if (connectedIndex === -1) return;

                    const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-');
                    if (!processedConnections.has(key)) {
                        processedConnections.add(key);

                        const startPoint = node.position;
                        const endPoint = connectedNode.position;
                        const numSegments = 15;

                        for (let i = 0; i < numSegments; i++) {
                            const t = i / (numSegments - 1);
                            connectionPositions.push(t, 0, 0);
                            startPoints.push(startPoint.x, startPoint.y, startPoint.z);
                            endPoints.push(endPoint.x, endPoint.y, endPoint.z);
                            pathIndices.push(pathIndex);
                            connectionStrengths.push(connection.strength);

                            const palette = colorPalettes[config.activePaletteIndex];
                            const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1);
                            const baseColor = palette[avgLevel % palette.length].clone();
                            baseColor.offsetHSL(
                                THREE.MathUtils.randFloatSpread(0.05),
                                THREE.MathUtils.randFloatSpread(0.1),
                                THREE.MathUtils.randFloatSpread(0.1)
                            );
                            connectionColors.push(baseColor.r, baseColor.g, baseColor.b);
                        }
                        pathIndex++;
                    }
                });
            });

            connectionsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
            connectionsGeometry.setAttribute('startPoint', new THREE.Float32BufferAttribute(startPoints, 3));
            connectionsGeometry.setAttribute('endPoint', new THREE.Float32BufferAttribute(endPoints, 3));
            connectionsGeometry.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(connectionStrengths, 1));
            connectionsGeometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3));
            connectionsGeometry.setAttribute('pathIndex', new THREE.Float32BufferAttribute(pathIndices, 1));

            const connectionsMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(pulseUniforms),
                vertexShader: connectionShader.vertexShader,
                fragmentShader: connectionShader.fragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            connectionsMesh = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
            holder.add(connectionsMesh);

            const palette = colorPalettes[config.activePaletteIndex];
            connectionsMaterial.uniforms.uPulseColors.value[0].copy(palette[0]);
            connectionsMaterial.uniforms.uPulseColors.value[1].copy(palette[1]);
            connectionsMaterial.uniforms.uPulseColors.value[2].copy(palette[2]);
            nodesMaterial.uniforms.uPulseColors.value[0].copy(palette[0]);
            nodesMaterial.uniforms.uPulseColors.value[1].copy(palette[1]);
            nodesMaterial.uniforms.uPulseColors.value[2].copy(palette[2]);
            nodesMaterial.uniforms.uActivePalette.value = config.activePaletteIndex;
        }

        function updateTheme(paletteIndex) {
            config.activePaletteIndex = paletteIndex;
            if (!nodesMesh || !connectionsMesh) return;

            const palette = colorPalettes[paletteIndex];

            const nodeColorsAttr = nodesMesh.geometry.attributes.nodeColor;
            const nodeLevels = neuralNetwork.nodes.map(n => n.level);

            for (let i = 0; i < nodeColorsAttr.count; i++) {
                const node = neuralNetwork.nodes[i];
                if (!node) continue;

                const colorIndex = Math.min(node.level, palette.length - 1);
                const baseColor = palette[colorIndex % palette.length].clone();
                baseColor.offsetHSL(
                    THREE.MathUtils.randFloatSpread(0.05),
                    THREE.MathUtils.randFloatSpread(0.1),
                    THREE.MathUtils.randFloatSpread(0.1)
                );
                nodeColorsAttr.setXYZ(i, baseColor.r, baseColor.g, baseColor.b);
            }
            nodeColorsAttr.needsUpdate = true;

            const connectionColors = [];
            const processedConnections = new Set();
            neuralNetwork.nodes.forEach((node, nodeIndex) => {
                 node.connections.forEach(connection => {
                    const connectedNode = connection.node;
                    const connectedIndex = neuralNetwork.nodes.indexOf(connectedNode);
                    if (connectedIndex === -1) return;

                    const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-');
                    if (!processedConnections.has(key)) {
                        processedConnections.add(key);
                        const numSegments = 15;
                        for (let i = 0; i < numSegments; i++) {
                             const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1);
                             const baseColor = palette[avgLevel % palette.length].clone();
                             baseColor.offsetHSL(
                                 THREE.MathUtils.randFloatSpread(0.05),
                                 THREE.MathUtils.randFloatSpread(0.1),
                                 THREE.MathUtils.randFloatSpread(0.1)
                             );
                             connectionColors.push(baseColor.r, baseColor.g, baseColor.b);
                        }
                    }
                 });
            });
            connectionsMesh.geometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3));
            connectionsMesh.geometry.attributes.connectionColor.needsUpdate = true;

            nodesMesh.material.uniforms.uPulseColors.value.forEach((c, i) => c.copy(palette[i % palette.length]));
            connectionsMesh.material.uniforms.uPulseColors.value.forEach((c, i) => c.copy(palette[i % palette.length]));
            nodesMesh.material.uniforms.uActivePalette.value = paletteIndex;
        }

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const interactionPoint = new THREE.Vector3();
        let lastPulseIndex = 0;

        function triggerPulse(clientX, clientY) {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            interactionPlane.normal.copy(camera.position).normalize();
            interactionPlane.constant = -interactionPlane.normal.dot(camera.position) + camera.position.length() * 0.5;

            if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
                const time = clock.getElapsedTime();

                if (nodesMesh && connectionsMesh) {
                    lastPulseIndex = (lastPulseIndex + 1) % 3;

                    nodesMesh.material.uniforms.uPulsePositions.value[lastPulseIndex].copy(interactionPoint);
                    nodesMesh.material.uniforms.uPulseTimes.value[lastPulseIndex] = time;
                    connectionsMesh.material.uniforms.uPulsePositions.value[lastPulseIndex].copy(interactionPoint);
                    connectionsMesh.material.uniforms.uPulseTimes.value[lastPulseIndex] = time;

                    const palette = colorPalettes[config.activePaletteIndex];
                    const randomColor = palette[Math.floor(Math.random() * palette.length)];
                    nodesMesh.material.uniforms.uPulseColors.value[lastPulseIndex].copy(randomColor);
                    connectionsMesh.material.uniforms.uPulseColors.value[lastPulseIndex].copy(randomColor);
                }
            }
        }

        renderer.domElement.addEventListener('click', (e) => {
            if (!config.paused) triggerPulse(e.clientX, e.clientY);
        });
        renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0 && !config.paused) {
                triggerPulse(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

// ---- Automatic show: every cycle a freshly generated cube dissolves in over the old one ----
        // [shape, colour theme]. Only neighbouring colour themes (0 violet-pink, 2 blue-violet) so colour never jumps.
        const SHOW = [[4, 2], [4, 0]];
        const HOLD_SECONDS = 12;     // how long a shape stays on its own
        const BLEND_SECONDS = 7;     // how long the old and new shapes overlap
        let showIndex = 0, blendStart = null, nextChange = HOLD_SECONDS, retiring = null;
        const ease = (x) => x * x * (3 - 2 * x);

        function setFade(mesh, value) { mesh.material.uniforms.uFade.value = value; }

        function updateShow(t) {
            if (reduceMotion) return;
            if (blendStart === null && t >= nextChange) {
                retiring = { nodes: nodesMesh, lines: connectionsMesh };      // old shape stays in the scene
                nodesMesh = null; connectionsMesh = null;
                showIndex = (showIndex + 1) % SHOW.length;
                const [formation, palette] = SHOW[showIndex];
                config.currentFormation = formation;
                config.activePaletteIndex = palette;
                createNetworkVisualization(formation, config.densityFactor);
                updateTheme(palette);
                setFade(nodesMesh, 0); setFade(connectionsMesh, 0);
                blendStart = t;
            }
            if (blendStart !== null) {
                const k = Math.min((t - blendStart) / BLEND_SECONDS, 1);
                const e = ease(k);
                setFade(nodesMesh, e); setFade(connectionsMesh, e);
                setFade(retiring.nodes, 1 - e); setFade(retiring.lines, 1 - e);
                if (k >= 1) {
                    [retiring.nodes, retiring.lines].forEach(m => { holder.remove(m); m.geometry.dispose(); m.material.dispose(); });
                    retiring = null; blendStart = null; nextChange = t + HOLD_SECONDS;
                }
            }
        }

        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            if (!visible || document.hidden) return;     // save battery when the hero is off-screen

            const t = clock.getElapsedTime();
            const spin = reduceMotion ? 0 : t;

            holder.rotation.set(spin * 0.07, spin * 0.16, 0);     // one slow, constant tumble for every shape
            [nodesMesh, connectionsMesh, retiring && retiring.nodes, retiring && retiring.lines]
                .forEach(m => { if (m) m.material.uniforms.uTime.value = t; });

            updateShow(t);

            {   // where is the cube on screen right now?
                const pr = renderer.getPixelRatio(), { w, h } = getSize();
                const c = new THREE.Vector3(0, 0, 0).project(camera);
                starMask.uCenter.value.set((c.x * 0.5 + 0.5) * w * pr, (c.y * 0.5 + 0.5) * h * pr);
                starMask.uRadius.value = (15.5 / (camera.position.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * (h / 2) * pr;
                starMask.uResolution.value.set(w * pr, h * pr);
                starMask.uPR.value = pr;
            }

            if (!reduceMotion) starField.rotation.y += 0.0003;

            controls.update();
            composer.render();
        }

        function init() {
            createNetworkVisualization(config.currentFormation, config.densityFactor);
            updateTheme(config.activePaletteIndex);
            onWindowResize();
            animate();
        }

        // Keep the animation sized to the hero box (also fits narrow phone screens)
        function onWindowResize() {
            const { w, h } = getSize();
            camera.aspect = w / h;
            camera.position.setLength(22.6 * Math.min(2.2, Math.max(1, 1.1 / camera.aspect)));
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            composer.setSize(w, h);
            bloomPass.resolution.set(w, h);
        }
        new ResizeObserver(onWindowResize).observe(heroEl);
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(heroEl);

        init();

