'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Hexagram as HexagramData, HexagramMood } from '@/data/iching';

const N = 1500;
const HALF = N / 2;

// Seeded PRNG for deterministic geometry
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sort points by spherical angle for optimal transport matching
function sortByAngle(pts: THREE.Vector3[]): THREE.Vector3[] {
  return [...pts].sort((a, b) => {
    const thetaA = Math.atan2(a.z, a.x);
    const thetaB = Math.atan2(b.z, b.x);
    if (Math.abs(thetaA - thetaB) > 0.01) return thetaA - thetaB;
    return a.y - b.y;
  });
}

// --- Geometry generators: deterministic, one per trigram ---
const TRIGRAM_GEN: Record<string, (n: number) => THREE.Vector3[]> = {
  // Heaven — fibonacci sphere
  qian: (n) => {
    const pts = [], phi_g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi_g * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * r * 4, y * 4, Math.sin(theta) * r * 4));
    }
    return sortByAngle(pts);
  },

  // Earth — flat breathing grid
  kun: (n) => {
    const pts = [], side = Math.sqrt(n) | 0;
    for (let i = 0; i < n; i++) {
      pts.push(new THREE.Vector3(
        ((i % side) / side - 0.5) * 9,
        Math.sin((i % side) * 0.15) * Math.cos(Math.floor(i / side) * 0.15) * 0.2,
        (Math.floor(i / side) / side - 0.5) * 9
      ));
    }
    return sortByAngle(pts);
  },

  // Thunder — vertical streams erupting
  zhen: (n) => {
    const pts = [], streams = 12, rand = mulberry32(3);
    for (let i = 0; i < n; i++) {
      const s = i % streams;
      const angle = (s / streams) * Math.PI * 2;
      const t = (i / n) + (rand() * 0.1);
      const spread = 0.15 + t * 0.3;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * (1.2 + t * 0.8) + (rand() - 0.5) * spread,
        t * 8 - 4,
        Math.sin(angle) * (1.2 + t * 0.8) + (rand() - 0.5) * spread
      ));
    }
    return sortByAngle(pts);
  },

  // Water — helical channel
  kan: (n) => {
    const pts = [], rand = mulberry32(4);
    const helixCount = Math.floor(n * 0.6);
    for (let i = 0; i < helixCount; i++) {
      const theta = (i / helixCount) * Math.PI * 25;
      const z = (i / helixCount) * 10 - 5;
      const r = 2.2 + Math.sin(z * 0.4) * 0.4;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    }
    for (let i = 0; i < n - helixCount; i++) {
      const z = rand() * 10 - 5;
      const r = rand() * 1.5;
      const theta = rand() * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    }
    return sortByAngle(pts);
  },

  // Mountain — dense cone tapering to peak
  gen: (n) => {
    const pts = [], rand = mulberry32(5);
    for (let i = 0; i < n; i++) {
      const t = Math.pow(rand(), 0.55);
      const y = t * 7 - 2;
      const spread = (1 - t) * 3.5 + 0.1;
      const theta = rand() * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * spread, y, Math.sin(theta) * spread));
    }
    return sortByAngle(pts);
  },

  // Wind — dispersed drifting layers
  xun: (n) => {
    const pts = [], rand = mulberry32(6);
    for (let i = 0; i < n; i++) {
      const r = Math.pow(rand(), 0.35) * 5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pts.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.4,
        r * Math.cos(phi)
      ));
    }
    return sortByAngle(pts);
  },

  // Fire — rays radiating from core
  li: (n) => {
    const pts = [], rays = 36;
    for (let i = 0; i < n; i++) {
      const l = i % rays;
      const theta = (l / rays) * Math.PI * 2;
      const phi = Math.acos(2 * (l % 18) / 18 - 1);
      const t = i / n, r = t * 5.5;
      pts.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }
    return sortByAngle(pts);
  },

  // Lake — concave surface with radial ripples
  dui: (n) => {
    const pts = [], side = Math.sqrt(n) | 0;
    for (let i = 0; i < n; i++) {
      const x = (i % side) / side - 0.5;
      const z = Math.floor(i / side) / side - 0.5;
      const dist = Math.sqrt(x * x + z * z);
      const y = Math.sin(dist * 12) * 0.7 * Math.max(0, 1 - dist * 1.5);
      pts.push(new THREE.Vector3(x * 10, y, z * 10));
    }
    return sortByAngle(pts);
  },
};

const MOOD_COLORS: Record<HexagramMood, number> = {
  serene: 0x94a3b8,
  tense: 0xef4444,
  dynamic: 0xfbbf24,
  mysterious: 0xa78bfa,
  joyful: 0x4ade80,
  dangerous: 0xdc2626,
  powerful: 0xf59e0b,
  gentle: 0xa5b4fc,
};

interface HexagramVis3DProps {
  primaryHexagram: HexagramData;
  transformedHexagram?: HexagramData | null;
}

export function HexagramVis3D({ primaryHexagram, transformedHexagram }: HexagramVis3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track current state for morphing
  const stateRef = useRef({
    inner: primaryHexagram.lowerTrigram,
    outer: primaryHexagram.upperTrigram,
    targetInner: transformedHexagram?.lowerTrigram ?? primaryHexagram.lowerTrigram,
    targetOuter: transformedHexagram?.upperTrigram ?? primaryHexagram.upperTrigram,
    hasTransformation: transformedHexagram != null,
    mood: primaryHexagram.mood,
    targetMood: transformedHexagram?.mood ?? primaryHexagram.mood,
  });

  // Camera control state with inertia
  const cameraRef = useRef({
    theta: 0,        // horizontal angle
    phi: Math.PI / 2, // vertical angle (start at equator)
    radius: 14,
    velocityTheta: 0,
    velocityPhi: 0,
    velocityRadius: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    autoRotate: true,
  });

  useEffect(() => {
    stateRef.current = {
      inner: primaryHexagram.lowerTrigram,
      outer: primaryHexagram.upperTrigram,
      targetInner: transformedHexagram?.lowerTrigram ?? primaryHexagram.lowerTrigram,
      targetOuter: transformedHexagram?.upperTrigram ?? primaryHexagram.upperTrigram,
      hasTransformation: transformedHexagram != null,
      mood: primaryHexagram.mood,
      targetMood: transformedHexagram?.mood ?? primaryHexagram.mood,
    };
  }, [primaryHexagram, transformedHexagram]);

  // Precompute all trigram geometries once
  const configs = useMemo(() => {
    const c: Record<string, THREE.Vector3[]> = {};
    for (const key of Object.keys(TRIGRAM_GEN)) {
      c[key] = TRIGRAM_GEN[key](HALF);
    }
    return c;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth, H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Points with persistent positions for smooth morphing
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const targets = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    // Initialize positions to first geometry
    const st = stateRef.current;
    const initInner = configs[st.inner] || configs.qian;
    const initOuter = configs[st.outer] || configs.qian;
    for (let i = 0; i < N; i++) {
      const isInner = i < HALF;
      const idx = isInner ? i : i - HALF;
      const pt = isInner ? initInner[idx] : initOuter[idx];
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
      targets[i * 3] = pt.x;
      targets[i * 3 + 1] = pt.y;
      targets[i * 3 + 2] = pt.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Connecting lines
    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(N * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // --- Mouse/touch interaction with inertia ---
    const cam = cameraRef.current;

    const onPointerDown = (e: PointerEvent) => {
      cam.isDragging = true;
      cam.autoRotate = false;
      cam.lastX = e.clientX;
      cam.lastY = e.clientY;
      cam.lastTime = Date.now();
      // Kill existing velocity when grabbing
      cam.velocityTheta = 0;
      cam.velocityPhi = 0;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!cam.isDragging) return;
      const now = Date.now();
      const dt = Math.max(1, now - cam.lastTime) / 1000;
      const dx = e.clientX - cam.lastX;
      const dy = e.clientY - cam.lastY;

      // Update position directly while dragging
      cam.theta -= dx * 0.005;
      cam.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cam.phi - dy * 0.005));

      // Track velocity for inertia (smoothed)
      cam.velocityTheta = cam.velocityTheta * 0.5 + (dx * 0.005 / dt) * 0.5;
      cam.velocityPhi = cam.velocityPhi * 0.5 + (dy * 0.005 / dt) * 0.5;

      cam.lastX = e.clientX;
      cam.lastY = e.clientY;
      cam.lastTime = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      cam.isDragging = false;
      container.releasePointerCapture(e.pointerId);
      // Velocity is already set from tracking in onPointerMove
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.velocityRadius += e.deltaY * 0.002;
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const startTime = Date.now();
    let frameId: number;
    let lastInner = st.inner;
    let lastOuter = st.outer;
    let morphProgress = 0; // 0 = primary, 1 = transformed

    const render = () => {
      frameId = requestAnimationFrame(render);
      const t = Date.now() * 0.001;
      const elapsed = (Date.now() - startTime) * 0.001;
      const currentState = stateRef.current;

      // Detect geometry changes and update targets
      if (lastInner !== currentState.inner || lastOuter !== currentState.outer) {
        lastInner = currentState.inner;
        lastOuter = currentState.outer;
      }

      // Compute target geometry based on morph state
      const innerPts = configs[currentState.inner] || configs.qian;
      const outerPts = configs[currentState.outer] || configs.qian;
      const tInnerPts = configs[currentState.targetInner] || configs.qian;
      const tOuterPts = configs[currentState.targetOuter] || configs.qian;

      // Smooth morph oscillation for transformation
      if (currentState.hasTransformation) {
        const targetMorph = Math.sin(t * 0.3) * 0.5 + 0.5;
        morphProgress += (targetMorph - morphProgress) * 0.02;
      } else {
        morphProgress += (0 - morphProgress) * 0.02;
      }
      const morph = morphProgress * morphProgress * (3 - 2 * morphProgress);

      // Update target positions based on morph
      for (let i = 0; i < N; i++) {
        const isInner = i < HALF;
        const idx = isInner ? i : i - HALF;
        const src = isInner ? innerPts[idx] : outerPts[idx];
        const tgt = isInner ? tInnerPts[idx] : tOuterPts[idx];

        targets[i * 3] = src.x + (tgt.x - src.x) * morph;
        targets[i * 3 + 1] = src.y + (tgt.y - src.y) * morph;
        targets[i * 3 + 2] = src.z + (tgt.z - src.z) * morph;
      }

      // Optimal transport: smoothly lerp current positions toward targets
      const lerpFactor = 0.04; // Controls how fast particles flow
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < N * 3; i++) {
        pos[i] += (targets[i] - pos[i]) * lerpFactor;
      }

      // Add subtle motion
      for (let i = 0; i < N; i++) {
        const noise = Math.sin(t * 1.2 + i * 0.03) * 0.015;
        pos[i * 3] += noise;
        pos[i * 3 + 1] += Math.cos(t * 1.1 + i * 0.025) * 0.015;
      }

      geometry.attributes.position.needsUpdate = true;

      // Fade in
      const fade = Math.min(1, elapsed * 0.5);
      material.opacity = fade * 0.85;
      lineMat.opacity = fade * 0.04;

      // Color interpolation
      const cA = new THREE.Color(MOOD_COLORS[currentState.mood]);
      const cB = new THREE.Color(MOOD_COLORS[currentState.targetMood]);
      const col = cA.clone().lerp(cB, morph);

      const clr = geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const b = 0.6 + Math.sin(t + i * 0.02) * 0.4;
        clr[i * 3] = col.r * b;
        clr[i * 3 + 1] = col.g * b;
        clr[i * 3 + 2] = col.b * b;
      }
      geometry.attributes.color.needsUpdate = true;

      // Lines
      const lp = lineGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const j = (i + 5) % N;
        lp[i * 6] = pos[i * 3];
        lp[i * 6 + 1] = pos[i * 3 + 1];
        lp[i * 6 + 2] = pos[i * 3 + 2];
        lp[i * 6 + 3] = pos[j * 3];
        lp[i * 6 + 4] = pos[j * 3 + 1];
        lp[i * 6 + 5] = pos[j * 3 + 2];
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.color.copy(col);

      // Camera: apply velocity with friction (inertial)
      if (!cam.isDragging) {
        // Apply inertia
        cam.theta -= cam.velocityTheta * 0.016; // ~60fps timestep
        cam.phi -= cam.velocityPhi * 0.016;
        cam.radius += cam.velocityRadius;

        // Friction decay
        cam.velocityTheta *= 0.95;
        cam.velocityPhi *= 0.95;
        cam.velocityRadius *= 0.9;

        // Clamp phi
        cam.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cam.phi));
        // Clamp radius
        cam.radius = Math.max(6, Math.min(30, cam.radius));

        // Auto-rotate when velocity dies down
        if (Math.abs(cam.velocityTheta) < 0.01 && Math.abs(cam.velocityPhi) < 0.01) {
          cam.autoRotate = true;
        }
        if (cam.autoRotate) {
          cam.theta += 0.002;
        }
      }

      camera.position.x = cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta);
      camera.position.y = cam.radius * Math.cos(cam.phi);
      camera.position.z = cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta);
      camera.lookAt(0, 0, 0);

      // Gentle scene rotation
      points.rotation.y = t * 0.02;
      lines.rotation.copy(points.rotation);

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [configs]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-square max-w-lg mx-auto cursor-grab active:cursor-grabbing touch-none"
      style={{ minHeight: 340 }}
    />
  );
}
