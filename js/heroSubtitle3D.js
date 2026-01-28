/**
 * HeroSubtitle3D — Flickering 3D hero title replacement
 * Renders "DEM Systems" as 3D chrome text on the fullscreen canvas,
 * aligned exactly over the DOM h1 using AlignmentTool (from demo-3d-text.html).
 * Cycles between chrome (metallic), CRT (neon green), and default (dark matte)
 * with glitch/flicker/fade transitions.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { AlignmentTool } from './AlignmentTool.js';

// ---------------------------------------------------------------------------
// Flicker state definitions
// ---------------------------------------------------------------------------
const STATES = [
  { name: 'chrome',  duration: 4000, transition: 'glitch' },
  { name: 'crt',     duration: 2500, transition: 'flicker' },
  { name: 'default', duration: 5000, transition: 'fade' },
];

// Calibrated alignment from demo-3d-text.html (premium chrome export)
const ALIGNMENT_CONFIG = {
  rotation: { x: 0.000, y: 0.000, z: 0.000 },
  flipX: false,
  flipY: false,
  offsetX: 0.0070,
  offsetY: -0.0120,
  scaleAdj: 0.9720
};
const MESH_WIDTH = 4.631;
const MESH_MIN_X = -2.866;
const MESH_MAX_X = 0.818;

// CRT aligned export bounds (from Blender MCP re-export, no manual rotation)
const CRT_MESH_WIDTH = 402.356;
const CRT_MESH_MIN_X = -201.178;
const CRT_MESH_MAX_X = 201.178;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ---------------------------------------------------------------------------
// Main class
// ---------------------------------------------------------------------------
export class HeroSubtitle3D {
  constructor(canvas, heroTitle) {
    this.canvas = canvas;
    this.heroTitle = heroTitle;
    this.textMesh = null;
    this.alignmentTool = null;
    this.meshes = [];
    this.currentStateIndex = 0;
    this.time = 0;
    this.disposed = false;
    this.stateTimer = null;
    this.inView = true;
    this.frustumSize = 1.5; // Match demo-3d-text.html
    this.transitionScale = 1.0;
    this.transitionScaleTarget = 1.0;
    this._transitioning = false;

    // Proximity blend state
    this._blendFactor = 1.0;        // 1.0 = full 3D, 0.0 = full video-mask
    this._blendTarget = 1.0;
    this._proximityPaused = false;

    this._initScene();
    this._initLights();
    this.envMap = this._createEnvMap();
    this.scene.environment = this.envMap;
    this._initMaterials();
    this._load();
    this._initVisibilityObserver();
    this._initProximityBlend();
  }

  // =========================================================================
  // Scene — fullscreen orthographic (matches demo-3d-text.html)
  // =========================================================================

  _initScene() {
    this.scene = new THREE.Scene();

    let aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -this.frustumSize * aspect / 2,
       this.frustumSize * aspect / 2,
       this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1, 100
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this._boundResize = () => this._onResize();
    window.addEventListener('resize', this._boundResize);
  }

  // =========================================================================
  // 9-light rig (from demo-3d-text.html)
  // =========================================================================

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0x101018, 0.15));

    const key = new THREE.DirectionalLight(0xffe8d0, 2.5);
    key.position.set(5, 2, 3);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8090b0, 0.8);
    fill.position.set(-4, 1, 2);
    this.scene.add(fill);

    const rimR = new THREE.DirectionalLight(0xffd0a0, 5.0);
    rimR.position.set(4, 0, -5);
    this.scene.add(rimR);

    const rimL = new THREE.DirectionalLight(0x90b0ff, 4.0);
    rimL.position.set(-4, 0, -5);
    this.scene.add(rimL);

    const rimT = new THREE.DirectionalLight(0xffffff, 3.0);
    rimT.position.set(0, 6, -3);
    this.scene.add(rimT);

    this.orbitLight1 = new THREE.PointLight(0xffffff, 2.5, 10);
    this.orbitLight1.position.set(3, 0, 3);
    this.scene.add(this.orbitLight1);

    this.orbitLight2 = new THREE.PointLight(0x8090c0, 1.8, 8);
    this.orbitLight2.position.set(-3, 0, 3);
    this.scene.add(this.orbitLight2);

    const sideL = new THREE.DirectionalLight(0xffffff, 2.0);
    sideL.position.set(-6, 0, 1);
    this.scene.add(sideL);

    const sideR = new THREE.DirectionalLight(0xffffff, 2.0);
    sideR.position.set(6, 0, 1);
    this.scene.add(sideR);

    this.lights = { key, fill, rimR, rimL, rimT, sideL, sideR };
  }

  // =========================================================================
  // Premium env map (moody studio HDRI from demo-3d-text.html)
  // =========================================================================

  _createEnvMap() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const ctx = c.getContext('2d');

    // Dark gradient base
    const grad = ctx.createLinearGradient(0, c.height, 0, 0);
    grad.addColorStop(0, '#000002');
    grad.addColorStop(0.3, '#020204');
    grad.addColorStop(0.5, '#050508');
    grad.addColorStop(0.7, '#0a0a12');
    grad.addColorStop(0.85, '#151520');
    grad.addColorStop(0.95, '#252535');
    grad.addColorStop(1, '#354050');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    // Softbox upper-left (warm)
    const sb1 = ctx.createRadialGradient(c.width*0.18, c.height*0.12, 0, c.width*0.18, c.height*0.12, 100);
    sb1.addColorStop(0, 'rgba(255,240,220,0.6)');
    sb1.addColorStop(0.4, 'rgba(255,235,210,0.25)');
    sb1.addColorStop(1, 'rgba(255,230,200,0)');
    ctx.fillStyle = sb1;
    ctx.fillRect(0, 0, c.width, c.height);

    // Softbox upper-right (cool)
    const sb2 = ctx.createRadialGradient(c.width*0.8, c.height*0.15, 0, c.width*0.8, c.height*0.15, 80);
    sb2.addColorStop(0, 'rgba(180,200,255,0.4)');
    sb2.addColorStop(0.5, 'rgba(170,190,255,0.15)');
    sb2.addColorStop(1, 'rgba(160,180,255,0)');
    ctx.fillStyle = sb2;
    ctx.fillRect(0, 0, c.width, c.height);

    // Strip light
    const strip = ctx.createRadialGradient(c.width*0.5, c.height*0.05, 0, c.width*0.5, c.height*0.05, 60);
    strip.addColorStop(0, 'rgba(255,255,255,0.9)');
    strip.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    strip.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = strip;
    ctx.fillRect(0, 0, c.width, c.height);

    // Specular hotspots
    [{x:0.15,y:0.08,r:25,a:0.95},{x:0.5,y:0.03,r:20,a:0.9},{x:0.82,y:0.1,r:18,a:0.7},{x:0.35,y:0.2,r:12,a:0.4}].forEach(s => {
      const h = ctx.createRadialGradient(c.width*s.x, c.height*s.y, 0, c.width*s.x, c.height*s.y, s.r);
      h.addColorStop(0, `rgba(255,255,255,${s.a})`);
      h.addColorStop(0.5, `rgba(255,255,255,${s.a*0.4})`);
      h.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = h;
      ctx.beginPath();
      ctx.arc(c.width*s.x, c.height*s.y, s.r*2, 0, Math.PI*2);
      ctx.fill();
    });

    // Edge strips
    const ls = ctx.createLinearGradient(0, 0, c.width*0.1, 0);
    ls.addColorStop(0, 'rgba(255,250,240,0.5)');
    ls.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = ls;
    ctx.fillRect(0, c.height*0.3, c.width*0.1, c.height*0.4);

    const rs = ctx.createLinearGradient(c.width*0.9, 0, c.width, 0);
    rs.addColorStop(0, 'rgba(230,245,255,0)');
    rs.addColorStop(1, 'rgba(230,245,255,0.5)');
    ctx.fillStyle = rs;
    ctx.fillRect(c.width*0.85, c.height*0.35, c.width*0.15, c.height*0.3);

    // Horizon glow
    const hg = ctx.createLinearGradient(0, c.height*0.45, 0, c.height*0.55);
    hg.addColorStop(0, 'rgba(200,210,230,0)');
    hg.addColorStop(0.5, 'rgba(200,210,230,0.2)');
    hg.addColorStop(1, 'rgba(200,210,230,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, c.height*0.4, c.width, c.height*0.2);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    return envMap;
  }

  // =========================================================================
  // Materials — Chrome / CRT / Default
  // =========================================================================

  _initMaterials() {
    this.materials = {
      chrome: new THREE.MeshPhysicalMaterial({
        color: 0xf8f8fa,
        metalness: 1.0,
        roughness: 0.06,
        clearcoat: 0.4,
        clearcoatRoughness: 0.08,
        anisotropy: 0.15,
        sheen: 0.1,
        sheenRoughness: 0.25,
        sheenColor: new THREE.Color(0xd0e0ff),
        envMap: this.envMap,
        envMapIntensity: 2.2,
        flatShading: false
      }),
      crt: new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x00ff66,
        emissiveIntensity: 1.0,
        roughness: 1.0,
        metalness: 0.0,
        envMapIntensity: 0,
        toneMapped: false,
      }),
      default: new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.5,
        metalness: 0.0,
      })
    };
  }

  // =========================================================================
  // GLB Loading + AlignmentTool
  // =========================================================================

  async _load() {
    // -----------------------------------------------------------------------
    // Ensure hero title has layout for AlignmentTool measurements.
    // In the final project, .hero-title--fallback is display:none when the
    // video-text-container is present. Override it and position the h1 to
    // overlay the video text area so getBoundingClientRect returns valid data.
    //
    // CRITICAL: The AlignmentTool reads rect.left and assumes the text starts
    // there. The prototype's h1 is inside an inline-block wrapper centered
    // via text-align:center, so rect.left = text left edge. Here we replicate
    // that by making the h1 fit-content + auto-margin centered.
    // -----------------------------------------------------------------------
    await document.fonts.ready; // Ensure Satoshi is loaded for measureTextWidth

    this._fallbackWasHidden = getComputedStyle(this.heroTitle).display === 'none';
    if (this._fallbackWasHidden) {
      this.heroTitle.style.display = 'block';
      this.heroTitle.style.position = 'absolute';
      this.heroTitle.style.left = '0';
      this.heroTitle.style.right = '0';
      this.heroTitle.style.width = 'fit-content';
      this.heroTitle.style.margin = '0 auto';
      this.heroTitle.style.pointerEvents = 'none';
      this._syncFallbackPosition();
    }

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(draco);

    try {
      // Load BOTH models in parallel
      const [chromeGltf, crtGltf] = await Promise.all([
        loader.loadAsync('./assets/dem_systems_chrome_premium.glb'),
        loader.loadAsync('./assets/crt_web_aligned.glb'),
      ]);

      // --- Chrome model ---
      this.chromeMesh = chromeGltf.scene;
      this.chromeMesh.visible = false;
      this.scene.add(this.chromeMesh);

      this.chromeParts = [];
      this.chromeMesh.traverse(child => {
        if (child.isMesh) {
          child.geometry.computeVertexNormals();
          child.material = this.materials.chrome;
          this.chromeParts.push(child);
        }
      });

      // AlignmentTool — positions chrome mesh exactly over the DOM h1
      this.alignmentTool = new AlignmentTool(this.chromeMesh, this.heroTitle, {
        frustumSize: this.frustumSize
      });
      this.alignmentTool.setMeshBounds(MESH_WIDTH, MESH_MIN_X, MESH_MAX_X);
      this.alignmentTool.loadConfig(ALIGNMENT_CONFIG);
      this.alignmentTool.hide();

      // --- CRT model (two-layer: emission core + glass outer) ---
      // Pre-aligned GLB: rotation baked, centered at origin (export_crt_aligned.py)
      this.crtMesh = crtGltf.scene;
      this.crtMesh.visible = false;
      this.scene.add(this.crtMesh);

      // Apply neon materials per layer
      this.crtMesh.traverse(child => {
        if (!child.isMesh) return;
        child.geometry.computeVertexNormals();
        const name = (child.name || '').toLowerCase();
        if (name.includes('glass') || name.includes('outer')) {
          // Translucent glass shell
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x00ff88,
            transmission: 0.85,
            thickness: 0.3,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            ior: 1.5,
            toneMapped: false,
          });
        } else {
          // Emission core
          child.material = this.materials.crt;
        }
      });

      // Second AlignmentTool for CRT — same calibration, CRT-specific bounds
      this.crtAlignmentTool = new AlignmentTool(this.crtMesh, this.heroTitle, {
        frustumSize: this.frustumSize
      });
      this.crtAlignmentTool.setMeshBounds(CRT_MESH_WIDTH, CRT_MESH_MIN_X, CRT_MESH_MAX_X);
      this.crtAlignmentTool.loadConfig(ALIGNMENT_CONFIG);
      this.crtAlignmentTool.hide();

      // Set active mesh ref
      this.textMesh = this.chromeMesh;

      // Show chrome, hide DOM h1
      this.chromeMesh.visible = true;
      this.heroTitle.style.visibility = 'hidden';
      const circuitMask = this.heroTitle.parentElement.querySelector('.hero-circuit-mask');
      if (circuitMask) circuitMask.style.display = 'none';

      this._startAnimation();
      this._startFlickerCycle();

      console.log('[HeroSubtitle3D] Both models loaded — chrome + CRT');
    } catch (err) {
      console.error('[HeroSubtitle3D] Load error:', err);
    }
  }

  // =========================================================================
  // Visibility — hide 3D text when hero section is off-screen
  // =========================================================================

  _initVisibilityObserver() {
    const heroSection = this.heroTitle.closest('.section--hero');
    if (!heroSection) return;

    this._observer = new IntersectionObserver((entries) => {
      this.inView = entries[0].isIntersecting;
      if (this.textMesh) {
        this.textMesh.visible = this.inView;
      }
    }, { threshold: 0 });

    this._observer.observe(heroSection);
  }

  // =========================================================================
  // Proximity blend — fade 3D canvas as cursor approaches hero title
  // =========================================================================

  _initProximityBlend() {
    // On touch devices, skip proximity — keep 3D always visible
    if ('ontouchend' in document) return;

    this._cursorX = -9999;
    this._cursorY = -9999;

    this._boundProximityMove = (e) => {
      this._cursorX = e.clientX;
      this._cursorY = e.clientY;
    };

    document.addEventListener('mousemove', this._boundProximityMove, { passive: true });
  }

  /**
   * Called every frame from the animation loop.
   * Recalculates hero center, distance, and updates blend target.
   */
  _updateProximityBlend() {
    if (!this._boundProximityMove) return;

    // Hero center — use video-text-container if available (always positioned)
    const wrapper = this.heroTitle.parentElement;
    const videoText = wrapper && wrapper.querySelector('.hero-video-text-container');
    const el = videoText || this.heroTitle;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Distance from cursor to hero center
    const dx = this._cursorX - cx;
    const dy = this._cursorY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Wide perimeter — 45% of viewport height, min 400px
    const radius = Math.max(window.innerHeight * 0.45, 400);

    // Map: far → 1.0 (full 3D), close → 0.0 (full video-mask)
    const raw = Math.min(dist / radius, 1.0);
    this._blendTarget = raw * raw;  // Quadratic ease — stays at 3D longer, fades faster near center

    // Smooth lerp toward target
    this._blendFactor += (this._blendTarget - this._blendFactor) * 0.06;

    // Clamp to avoid sub-pixel flicker
    if (this._blendFactor < 0.01) this._blendFactor = 0;
    if (this._blendFactor > 0.99) this._blendFactor = 1.0;

    // Apply canvas opacity
    this.canvas.style.opacity = this._blendFactor;

    // When blend drops low, pause the flicker cycle (no point animating invisible 3D)
    if (this._blendFactor < 0.05 && !this._proximityPaused) {
      this._proximityPaused = true;
      if (this.stateTimer) {
        clearTimeout(this.stateTimer);
        this.stateTimer = null;
      }
      // If we're in the default state (h1 visible), hide it so video-mask shows
      if (STATES[this.currentStateIndex].name === 'default') {
        this.heroTitle.style.opacity = '0';
        this.heroTitle.style.visibility = 'hidden';
      }
    }

    // When blend recovers, resume the flicker cycle
    if (this._blendFactor > 0.3 && this._proximityPaused) {
      this._proximityPaused = false;
      // Restart from chrome state for clean re-entry
      this.currentStateIndex = 0;
      this._applyMaterial('chrome');
      this._startFlickerCycle();
    }

    // During default state with active blend, modulate h1 opacity
    if (!this._proximityPaused && STATES[this.currentStateIndex].name === 'default') {
      if (this._blendFactor < 0.95) {
        this.heroTitle.style.opacity = String(this._blendFactor);
      }
    }
  }

  // =========================================================================
  // Material swap
  // =========================================================================

  _applyMaterial(name) {
    // Reset DOM h1 rocking transform
    this.heroTitle.style.transform = '';

    if (name === 'crt') {
      // Swap to CRT model (two-layer neon)
      if (this.chromeMesh) this.chromeMesh.visible = false;
      if (this.crtMesh) this.crtMesh.visible = this.inView;
      this.textMesh = this.crtMesh;
      this.heroTitle.style.visibility = 'hidden';
      this.heroTitle.style.opacity = '0';
      this.heroTitle.style.filter = 'blur(4px)';
      // Scale in from depth
      this.transitionScale = 0.91;
      this.transitionScaleTarget = 1.0;
    } else if (name === 'default') {
      // Fade out 3D, fade in DOM h1
      if (this.chromeMesh) this.chromeMesh.visible = false;
      if (this.crtMesh) this.crtMesh.visible = false;
      this.textMesh = null;
      this.heroTitle.style.visibility = 'visible';
      // CSS transition handles smooth fade-in
      requestAnimationFrame(() => {
        this.heroTitle.style.opacity = '1';
        this.heroTitle.style.filter = 'blur(0px)';
      });
    } else {
      // Chrome model
      if (this.crtMesh) this.crtMesh.visible = false;
      if (this.chromeMesh) this.chromeMesh.visible = this.inView;
      this.textMesh = this.chromeMesh;
      this.heroTitle.style.visibility = 'hidden';
      this.heroTitle.style.opacity = '0';
      this.heroTitle.style.filter = 'blur(4px)';
      const mat = this.materials[name];
      if (mat) this.chromeParts.forEach(m => { m.material = mat; });
      // Scale in with overshoot
      this.transitionScale = 0.91;
      this.transitionScaleTarget = 1.0;
    }
  }

  // =========================================================================
  // Transitions
  // =========================================================================

  // Glitch (chrome → CRT): scale pulse + rapid flashes + depth zoom
  _glitchTransition(callback) {
    this._transitioning = true;
    // Phase 1: Scale up chrome (overshoot)
    this.transitionScaleTarget = 1.06;
    setTimeout(() => {
      // Phase 2: Rapid flashes
      let flashes = 0;
      const interval = setInterval(() => {
        if (this.textMesh) this.textMesh.visible = !this.textMesh.visible;
        flashes++;
        if (flashes >= 6) {
          clearInterval(interval);
          if (this.textMesh) this.textMesh.visible = this.inView;
          this._transitioning = false;
          callback();
        }
      }, 22);
    }, 150);
  }

  // Flicker (CRT → default): CRT dims + blinks + h1 fades in with depth
  _flickerTransition(callback) {
    this._transitioning = true;
    // Phase 1: Scale down CRT
    this.transitionScaleTarget = 0.94;
    setTimeout(() => {
      // Phase 2: Blinks
      const steps = [
        { visible: false, delay: 0 },
        { visible: true,  delay: 50 },
        { visible: false, delay: 100 },
      ];
      steps.forEach(step => {
        setTimeout(() => {
          if (this.textMesh) this.textMesh.visible = step.visible && this.inView;
        }, step.delay);
      });
      // Phase 3: Brief darkness then swap
      setTimeout(() => {
        this._transitioning = false;
        callback();
      }, 200);
    }, 200);
  }

  // Fade (default → chrome): h1 blurs out → chrome scales in
  _fadeTransition(callback) {
    this._transitioning = true;
    // Phase 1: Blur out h1 (CSS transition handles animation)
    this.heroTitle.style.opacity = '0';
    this.heroTitle.style.filter = 'blur(4px)';
    setTimeout(() => {
      this._transitioning = false;
      callback();
    }, 400);
  }

  // =========================================================================
  // Flicker state machine
  // =========================================================================

  _startFlickerCycle() {
    const cycle = () => {
      if (this.disposed) return;
      const state = STATES[this.currentStateIndex];
      const nextIndex = (this.currentStateIndex + 1) % STATES.length;
      const nextState = STATES[nextIndex];

      this.stateTimer = setTimeout(() => {
        if (this.disposed) return;
        const doSwap = () => {
          this.currentStateIndex = nextIndex;
          this._applyMaterial(nextState.name);
          cycle();
        };
        switch (state.transition) {
          case 'glitch':  this._glitchTransition(doSwap); break;
          case 'flicker': this._flickerTransition(doSwap); break;
          case 'fade':    this._fadeTransition(doSwap); break;
          default: doSwap();
        }
      }, state.duration);
    };

    this._applyMaterial('chrome');
    cycle();
  }

  // =========================================================================
  // Animation loop
  // =========================================================================

  _startAnimation() {
    const animate = () => {
      if (this.disposed) return;
      requestAnimationFrame(animate);

      // Skip rendering when off-screen
      if (!this.inView) return;

      this.time += 0.016;

      // Update proximity blend (cursor distance → canvas opacity)
      this._updateProximityBlend();

      // Smooth lerp transition scale toward target
      this.transitionScale += (this.transitionScaleTarget - this.transitionScale) * 0.12;

      const stateName = STATES[this.currentStateIndex].name;

      if (stateName === 'default' && !this._transitioning) {
        // Animate DOM h1 with CSS transform rocking
        this._animateDefault();
      }

      if (this.textMesh && this.textMesh.visible) {
        // Use the correct AlignmentTool per state
        if (stateName === 'crt') {
          if (this.crtAlignmentTool) this.crtAlignmentTool.update();
          this._animateCRT();
        } else {
          if (this.alignmentTool) this.alignmentTool.update();
          if (stateName === 'chrome' || this._transitioning) {
            this._animateChrome();
          }
        }

        // Apply transition scale AFTER AlignmentTool (multiplier on top)
        if (Math.abs(this.transitionScale - 1.0) > 0.001) {
          this.textMesh.scale.multiplyScalar(this.transitionScale);
        }
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // -----------------------------------------------------------------------
  // Shared rocking oscillators — IDENTICAL frequencies & phases across all
  // three states so rotation is continuous at every transition point.
  // Only amplitudes differ per state.
  // -----------------------------------------------------------------------
  _getRock(t) {
    const rockCycle = (Math.sin(t * 0.35) + 1) / 2;
    const twistCycle = (Math.sin(t * 0.25 + 1.0) + 1) / 2;
    return {
      rock: easeInOutCubic(rockCycle) - 0.5,   // −0.5 … +0.5
      twist: easeInOutCubic(twistCycle) - 0.5,  // −0.5 … +0.5
      yaw: Math.sin(t * 0.48),                  // −1 … +1
    };
  }

  // Chrome: diamond rocking + breathing lights
  _animateChrome() {
    const t = this.time;
    const r = this._getRock(t);
    this.textMesh.rotation.x = r.rock * 0.12;
    this.textMesh.rotation.z = r.twist * 0.05;
    this.textMesh.rotation.y = r.yaw * 0.015;

    // Breathing lights
    const breathe = Math.sin(t * 0.3);
    const breathe2 = Math.sin(t * 0.3 + 1.5);
    const sparkle = Math.sin(t * 0.8);

    this.orbitLight1.position.x = 3 + breathe * 0.3;
    this.orbitLight1.position.y = breathe2 * 0.4;
    this.orbitLight1.intensity = 2.5 + sparkle * 0.8;
    this.orbitLight2.position.x = -3 + breathe2 * 0.3;
    this.orbitLight2.position.y = breathe * 0.4;
    this.orbitLight2.intensity = 1.8 + sparkle * 0.5;

    this.lights.rimR.intensity = 5.0 + breathe * 1.2;
    this.lights.rimL.intensity = 4.0 + breathe2 * 1.0;
    this.lights.rimT.intensity = 3.0 + breathe * 0.5;
    this.lights.key.intensity = 2.5 + breathe2 * 0.3;
    this.lights.fill.intensity = 0.8 + breathe * 0.15;
    this.lights.sideL.intensity = 2.0 + breathe * 0.4;
    this.lights.sideR.intensity = 2.0 + breathe2 * 0.4;
  }

  // CRT: same rocking (slightly larger) + neon glow + dimmed lights
  _animateCRT() {
    const t = this.time;
    const r = this._getRock(t);
    this.textMesh.rotation.x = r.rock * 0.14;
    this.textMesh.rotation.z = r.twist * 0.06;
    this.textMesh.rotation.y = r.yaw * 0.018;

    // Neon glow pulse
    this.materials.crt.emissiveIntensity = 1.0 + Math.sin(t * 1.8) * 0.2;

    // Dim scene lights so neon pops
    const pulse = Math.sin(t * 0.5);
    this.orbitLight1.intensity = 0.3 + pulse * 0.1;
    this.orbitLight2.intensity = 0.2 + pulse * 0.08;
    this.lights.key.intensity = 0.3;
    this.lights.fill.intensity = 0.1;
    this.lights.rimR.intensity = 0.4 + pulse * 0.2;
    this.lights.rimL.intensity = 0.3 + pulse * 0.15;
    this.lights.rimT.intensity = 0.2;
    this.lights.sideL.intensity = 0.15;
    this.lights.sideR.intensity = 0.15;
  }

  // Default: same rocking as CSS perspective (amplitude matched to radians→degrees)
  // Chrome X=0.12 rad ≈ 6.9°, Z=0.05 rad ≈ 2.9°, Y=0.015 rad ≈ 0.86°
  _animateDefault() {
    const t = this.time;
    const r = this._getRock(t);
    const rotX = r.rock * 6.9;
    const rotZ = r.twist * 2.9;
    const rotY = r.yaw * 0.86;

    this.heroTitle.style.transform =
      `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
    this.heroTitle.style.transformOrigin = 'center center';

    // Restore scene lights for next transition
    this.lights.key.intensity = 2.5;
    this.lights.fill.intensity = 0.8;
    this.lights.rimR.intensity = 5.0;
    this.lights.rimL.intensity = 4.0;
    this.lights.rimT.intensity = 3.0;
    this.lights.sideL.intensity = 2.0;
    this.lights.sideR.intensity = 2.0;
    this.orbitLight1.intensity = 2.5;
    this.orbitLight2.intensity = 1.8;
  }

  // =========================================================================
  // Fallback h1 positioning (final project only)
  // =========================================================================

  /**
   * Position the fallback h1 to overlay the video-text-container so the
   * AlignmentTool reads the correct bounding rect. Called on init and resize.
   */
  _syncFallbackPosition() {
    const wrapper = this.heroTitle.parentElement;
    const videoText = wrapper && wrapper.querySelector('.hero-video-text-container');
    if (videoText) {
      const vtRect = videoText.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      this.heroTitle.style.top = (vtRect.top - wrapperRect.top) + 'px';
    } else {
      this.heroTitle.style.top = '0';
    }
  }

  // =========================================================================
  // Resize
  // =========================================================================

  _onResize() {
    if (this.disposed) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    this.camera.left = -this.frustumSize * aspect / 2;
    this.camera.right = this.frustumSize * aspect / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);

    // Reposition fallback h1 if needed (video-text-container may have moved)
    if (this._fallbackWasHidden) this._syncFallbackPosition();

    if (this.alignmentTool) this.alignmentTool.sync();
    if (this.crtAlignmentTool) this.crtAlignmentTool.sync();
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

  dispose() {
    this.disposed = true;
    if (this.stateTimer) clearTimeout(this.stateTimer);
    if (this._observer) this._observer.disconnect();
    window.removeEventListener('resize', this._boundResize);
    if (this._boundProximityMove) {
      document.removeEventListener('mousemove', this._boundProximityMove);
    }
    this.canvas.style.opacity = '';

    // Restore DOM h1
    this.heroTitle.style.visibility = '';
    this.heroTitle.style.transform = '';
    this.heroTitle.style.opacity = '';
    this.heroTitle.style.filter = '';
    // Restore fallback h1 to original hidden state
    if (this._fallbackWasHidden) {
      this.heroTitle.style.display = '';
      this.heroTitle.style.position = '';
      this.heroTitle.style.top = '';
      this.heroTitle.style.left = '';
      this.heroTitle.style.right = '';
      this.heroTitle.style.width = '';
      this.heroTitle.style.margin = '';
      this.heroTitle.style.pointerEvents = '';
    }
    const circuitMask = this.heroTitle.parentElement.querySelector('.hero-circuit-mask');
    if (circuitMask) circuitMask.style.display = '';

    this.renderer.dispose();
    Object.values(this.materials).forEach(m => m.dispose());
    if (this.envMap) this.envMap.dispose();
    if (this.alignmentTool) this.alignmentTool.destroy();
    if (this.crtAlignmentTool) this.crtAlignmentTool.destroy();
  }
}
