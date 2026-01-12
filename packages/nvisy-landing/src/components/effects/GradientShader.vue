<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";

interface Props {
  maskSelector?: string;
}

const props = defineProps<Props>();
const container = ref<HTMLDivElement | null>(null);

// Three.js instances
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let material: THREE.ShaderMaterial | null = null;
let animationId = 0;
let darkModeObserver: MutationObserver | null = null;

// Mouse state
const mouse = { x: 0.5, y: 0.5 };
const targetMouse = { x: 0.5, y: 0.5 };
const lastMouse = { x: 0.5, y: 0.5 };
let hoverStrength = 0;
let flyAwayProgress = 0;
let isHovering = false;
let wasHovering = false;
let isDarkMode = false;
let maskRect: DOMRect | null = null;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec2 uLastMouse;
  uniform float uTime;
  uniform float uHover;
  uniform float uFlyAway;
  uniform float uDarkMode;
  uniform vec4 uMask;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  vec2 random2(vec2 st) {
    return vec2(
      fract(sin(dot(st, vec2(127.1, 311.7))) * 43758.5453),
      fract(sin(dot(st, vec2(269.5, 183.3))) * 43758.5453)
    );
  }

  void main() {
    vec2 st = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Check if in masked area (screenshot)
    bool inMask = uMask.z > 0.0 &&
                  st.x >= uMask.x && st.x <= uMask.x + uMask.z &&
                  st.y >= uMask.y && st.y <= uMask.y + uMask.w;

    // Mouse distances
    vec2 mouseAdj = vec2(uMouse.x * aspect, uMouse.y);
    vec2 lastMouseAdj = vec2(uLastMouse.x * aspect, uLastMouse.y);
    vec2 stAdj = vec2(st.x * aspect, st.y);
    float distToMouse = distance(stAdj, mouseAdj);
    float distToLastMouse = distance(stAdj, lastMouseAdj);

    // Pixel grid
    float pixelCount = 35.0;
    vec2 gridSize = vec2(pixelCount, pixelCount / aspect);
    vec2 pixelCoord = floor(st * gridSize);
    vec2 pixelCenter = (pixelCoord + 0.5) / gridSize;
    vec2 snappedUv = pixelCoord / gridSize;

    float pixelDist = distance(vec2(pixelCenter.x * aspect, pixelCenter.y), mouseAdj);
    float pixelDistLast = distance(vec2(pixelCenter.x * aspect, pixelCenter.y), lastMouseAdj);

    float hoverInfluence = smoothstep(0.5, 0.0, distToMouse) * uHover;
    float flyInfluence = smoothstep(0.6, 0.0, distToLastMouse) * uFlyAway;
    float baseVisibility = 0.7;
    float pixelInfluence = max(baseVisibility, max(hoverInfluence, flyInfluence));

    // Random values for this pixel
    float randVal = random(pixelCoord);
    vec2 randDir = random2(pixelCoord) * 2.0 - 1.0;

    // Fold effect on hover (no pulsing)
    float foldAngle = smoothstep(0.5, 0.0, pixelDist) * hoverInfluence;

    // Layering on hover
    float layerIndex = floor(randVal * 3.0);
    float layerOffset = smoothstep(0.4, 0.0, pixelDist) * hoverInfluence;
    float stackOffset = layerIndex * 0.015 * layerOffset;

    // Fly away effect
    vec2 flyDirection = normalize(vec2(pixelCenter.x * aspect, pixelCenter.y) - lastMouseAdj + randDir * 0.3);
    float flySpeed = 0.5 + randVal * 0.5;
    float flyDelay = randVal * 0.3;
    float flyProgress = smoothstep(0.0, 1.0, max(0.0, uFlyAway - flyDelay) / (1.0 - flyDelay));
    vec2 flyOffset = flyDirection * flyProgress * flySpeed * 0.4;
    float flyRotation = flyProgress * (randVal - 0.5) * 6.28;

    // Grid position with fold
    vec2 gridPos = fract(st * gridSize);
    vec2 centeredPos = gridPos - 0.5;

    // Apply fly rotation
    if (uFlyAway > 0.01) {
      float cosR = cos(flyRotation);
      float sinR = sin(flyRotation);
      centeredPos = vec2(
        centeredPos.x * cosR - centeredPos.y * sinR,
        centeredPos.x * sinR + centeredPos.y * cosR
      );
    }

    centeredPos.y *= (1.0 - foldAngle * 0.6);
    centeredPos.y += foldAngle * 0.1 + stackOffset;

    // Shading (no grid lines)
    float foldShade = foldAngle * 0.2 * (1.0 - gridPos.y) + layerIndex * 0.04 * layerOffset;

    // Pixelation blend
    vec2 pixelatedUv = mix(st, snappedUv, pixelInfluence);
    pixelatedUv += flyOffset;

    // Colors - light mode (more contrast)
    vec3 colorBlueLight = vec3(0.88, 0.92, 1.0);
    vec3 colorPinkLight = vec3(1.0, 0.90, 0.95);

    // Colors - dark mode (more contrast)
    vec3 colorBlueDark = vec3(0.02, 0.05, 0.15);
    vec3 colorPinkDark = vec3(0.15, 0.02, 0.15);

    vec3 colorBlue = mix(colorBlueLight, colorBlueDark, uDarkMode);
    vec3 colorPink = mix(colorPinkLight, colorPinkDark, uDarkMode);
    vec3 edgeColor = mix(vec3(1.0), vec3(0.0), uDarkMode);

    // Gradient
    float wave = sin(st.x * 4.0 + uTime * 0.3) * 0.015;
    vec3 baseColor = mix(colorBlue, colorPink, pixelatedUv.x + wave);

    // Add per-pixel color variation to make pixels visible
    float pixelVariation = (randVal - 0.5) * 0.08 * pixelInfluence;
    baseColor += pixelVariation;

    // Hover effect: brighten pixels near cursor
    float hoverBrighten = smoothstep(0.4, 0.0, pixelDist) * uHover * 0.15;
    baseColor += hoverBrighten;

    // Add subtle border between pixels (stronger on hover)
    float borderWidth = mix(0.06, 0.12, hoverInfluence);
    float borderX = smoothstep(0.0, borderWidth, gridPos.x) * smoothstep(0.0, borderWidth, 1.0 - gridPos.x);
    float borderY = smoothstep(0.0, borderWidth, gridPos.y) * smoothstep(0.0, borderWidth, 1.0 - gridPos.y);
    float border = borderX * borderY;
    float borderDarken = mix(0.92, 0.85, hoverInfluence);
    baseColor *= mix(borderDarken, 1.0, border);

    // Apply effects (skip for masked area)
    vec3 finalColor = baseColor;
    if (!inMask) {
      finalColor = mix(finalColor, finalColor * 0.9, foldShade);
    }

    // Edge fade (5% at top and bottom) - blend to edge color
    float edgeFade = 0.05;
    float topBlend = 1.0 - smoothstep(1.0 - edgeFade, 1.0, st.y);
    float bottomBlend = smoothstep(0.0, edgeFade, st.y);
    finalColor = mix(edgeColor, finalColor, topBlend);
    finalColor = mix(edgeColor, finalColor, bottomBlend);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function updateMaskRect() {
  if (!props.maskSelector || !container.value) {
    maskRect = null;
    return;
  }

  const maskEl = document.querySelector(props.maskSelector);
  if (!maskEl) return;

  const containerRect = container.value.getBoundingClientRect();
  const elRect = maskEl.getBoundingClientRect();

  maskRect = new DOMRect(
    (elRect.left - containerRect.left) / containerRect.width,
    1 - (elRect.bottom - containerRect.top) / containerRect.height,
    elRect.width / containerRect.width,
    elRect.height / containerRect.height,
  );
}

function checkDarkMode() {
  isDarkMode = document.documentElement.classList.contains("dark");
}

function init() {
  if (!container.value) return;

  const rect = container.value.getBoundingClientRect();
  checkDarkMode();
  updateMaskRect();

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.value.appendChild(renderer.domElement);

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(rect.width, rect.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uLastMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uFlyAway: { value: 0 },
      uDarkMode: { value: isDarkMode ? 1 : 0 },
      uMask: { value: new THREE.Vector4(0, 0, 0, 0) },
    },
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);
}

function resize() {
  if (!container.value || !renderer || !material) return;
  const rect = container.value.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  material.uniforms.uResolution.value.set(rect.width, rect.height);
  updateMaskRect();
}

function animate() {
  if (!renderer || !scene || !camera || !material) return;

  mouse.x += (targetMouse.x - mouse.x) * 0.08;
  mouse.y += (targetMouse.y - mouse.y) * 0.08;

  if (wasHovering && !isHovering) {
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    flyAwayProgress = 0.01;
  }
  wasHovering = isHovering;

  hoverStrength += ((isHovering ? 1 : 0) - hoverStrength) * 0.05;

  if (!isHovering && flyAwayProgress > 0 && flyAwayProgress < 1) {
    flyAwayProgress += 0.02;
  } else if (isHovering) {
    flyAwayProgress *= 0.95;
  }

  checkDarkMode();

  material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  material.uniforms.uLastMouse.value.set(lastMouse.x, lastMouse.y);
  material.uniforms.uTime.value = performance.now() * 0.001;
  material.uniforms.uHover.value = hoverStrength;
  material.uniforms.uFlyAway.value = flyAwayProgress;
  material.uniforms.uDarkMode.value = isDarkMode ? 1 : 0;

  if (maskRect) {
    material.uniforms.uMask.value.set(
      maskRect.x,
      maskRect.y,
      maskRect.width,
      maskRect.height,
    );
  }

  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function handleMouseMove(e: MouseEvent) {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  isHovering = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
  if (isHovering) {
    targetMouse.x = x / rect.width;
    targetMouse.y = 1 - y / rect.height;
  }
}

function handleMouseLeave() {
  isHovering = false;
}

function cleanup() {
  window.removeEventListener("resize", resize);
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseleave", handleMouseLeave);
  darkModeObserver?.disconnect();
  cancelAnimationFrame(animationId);

  if (renderer && container.value) {
    container.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  material?.dispose();
  scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });
}

let darkModeObserverInstance: MutationObserver | null = null;

onMounted(() => {
  init();
  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseleave", handleMouseLeave);

  darkModeObserverInstance = new MutationObserver(checkDarkMode);
  darkModeObserverInstance.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  animate();
});

onUnmounted(cleanup);
</script>

<template>
  <div
    ref="container"
    class="absolute inset-0 z-0 pointer-events-none blur-[4px]"
  />
</template>
