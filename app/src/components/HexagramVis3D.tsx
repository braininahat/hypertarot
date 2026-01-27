'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Hexagram as HexagramData, HexagramMood } from '@/data/iching';

const N = 1500;
const HALF = N / 2;

// --- Geometry generators: one per trigram ---
// Chosen for visual impact and distinctness.
// Each returns `n` THREE.Vector3 points.

const TRIGRAM_GEN: Record<string, (n: number) => THREE.Vector3[]> = {
  // Heaven — fibonacci sphere, radiating outward
  qian: (n) => {
    const pts = [], phi_g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi_g * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * r * 4, y * 4, Math.sin(theta) * r * 4));
    }
    return pts;
  },

  // Earth — flat grid, barely breathing
  kun: (n) => {
    const pts = [], side = Math.sqrt(n) | 0;
    for (let i = 0; i < n; i++) {
      pts.push(new THREE.Vector3(
        ((i % side) / side - 0.5) * 9,
        Math.sin((i % side) * 0.15) * Math.cos(Math.floor(i / side) * 0.15) * 0.2,
        (Math.floor(i / side) / side - 0.5) * 9
      ));
    }
    return pts;
  },

  // Thunder — vertical streams erupting
  zhen: (n) => {
    const pts = [], streams = 12, per = Math.floor(n / streams);
    for (let s = 0; s < streams; s++) {
      const angle = (s / streams) * Math.PI * 2;
      for (let i = 0; i < per; i++) {
        const t = i / per;
        const spread = 0.15 + t * 0.3;
        pts.push(new THREE.Vector3(
          Math.cos(angle) * (1.2 + t * 0.8) + (Math.random() - 0.5) * spread,
          t * 8 - 4,
          Math.sin(angle) * (1.2 + t * 0.8) + (Math.random() - 0.5) * spread
        ));
      }
    }
    return pts.slice(0, n);
  },

  // Water — helical channel, flowing
  kan: (n) => {
    const pts = [];
    for (let i = 0; i < n * 0.6; i++) {
      const theta = (i / (n * 0.6)) * Math.PI * 25;
      const z = (i / (n * 0.6)) * 10 - 5;
      const r = 2.2 + Math.sin(z * 0.4) * 0.4;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    }
    for (let i = 0; i < n * 0.4; i++) {
      const z = Math.random() * 10 - 5;
      const r = Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    }
    return pts.slice(0, n);
  },

  // Mountain — dense cone tapering to peak
  gen: (n) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = Math.pow(Math.random(), 0.55);
      const y = t * 7 - 2;
      const spread = (1 - t) * 3.5 + 0.1;
      const theta = Math.random() * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * spread, y, Math.sin(theta) * spread));
    }
    return pts;
  },

  // Wind — dispersed, drifting in layers
  xun: (n) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 0.35) * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.4,
        r * Math.cos(phi)
      ));
    }
    return pts;
  },

  // Fire — rays radiating from core
  li: (n) => {
    const pts = [], rays = 36, per = Math.floor(n / rays);
    for (let l = 0; l < rays; l++) {
      const theta = (l / rays) * Math.PI * 2;
      const phi = Math.acos(2 * (l % 18) / 18 - 1);
      for (let i = 0; i < per; i++) {
        const t = i / per, r = t * 5.5;
        pts.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ));
      }
    }
    return pts.slice(0, n);
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
    return pts;
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
  const stateRef = useRef({
    inner: primaryHexagram.lowerTrigram,
    outer: primaryHexagram.upperTrigram,
    targetInner: transformedHexagram?.lowerTrigram ?? primaryHexagram.lowerTrigram,
    targetOuter: transformedHexagram?.upperTrigram ?? primaryHexagram.upperTrigram,
    hasTransformation: transformedHexagram != null,
    mood: primaryHexagram.mood,
    targetMood: transformedHexagram?.mood ?? primaryHexagram.mood,
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

    // Points
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.07,
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

    const render = () => {
      frameId = requestAnimationFrame(render);
      const t = Date.now() * 0.001;
      const elapsed = (Date.now() - startTime) * 0.001;
      const st = stateRef.current;

      const innerPts = configs[st.inner] || configs.qian;
      const outerPts = configs[st.outer] || configs.qian;
      const tInnerPts = configs[st.targetInner] || configs.qian;
      const tOuterPts = configs[st.targetOuter] || configs.qian;

      // Morph oscillation (primary ↔ transformed)
      const morphRaw = st.hasTransformation
        ? Math.sin(t * 0.3) * 0.5 + 0.5
        : 0;
      const morph = morphRaw * morphRaw * (3 - 2 * morphRaw);

      // Fade in over 2 seconds
      const fade = Math.min(1, elapsed * 0.5);
      material.opacity = fade * 0.85;
      lineMat.opacity = fade * 0.05;

      // Color
      const cA = new THREE.Color(MOOD_COLORS[st.mood]);
      const cB = new THREE.Color(MOOD_COLORS[st.targetMood]);
      const col = cA.clone().lerp(cB, morph);

      const pos = geometry.attributes.position.array as Float32Array;
      const clr = geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < N; i++) {
        const isInner = i < HALF;
        const idx = isInner ? i : i - HALF;
        const src = isInner ? innerPts[idx] : outerPts[idx];
        const tgt = isInner ? tInnerPts[idx] : tOuterPts[idx];

        const noise = Math.sin(t * 1.5 + i * 0.03) * 0.02;
        pos[i * 3]     = src.x + (tgt.x - src.x) * morph + noise;
        pos[i * 3 + 1] = src.y + (tgt.y - src.y) * morph + noise;
        pos[i * 3 + 2] = src.z + (tgt.z - src.z) * morph + noise;

        const b = 0.6 + Math.sin(t + i * 0.02) * 0.4;
        clr[i * 3]     = col.r * b;
        clr[i * 3 + 1] = col.g * b;
        clr[i * 3 + 2] = col.b * b;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      // Lines connecting nearby particles
      const lp = lineGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const j = (i + 5) % N;
        lp[i * 6]     = pos[i * 3];
        lp[i * 6 + 1] = pos[i * 3 + 1];
        lp[i * 6 + 2] = pos[i * 3 + 2];
        lp[i * 6 + 3] = pos[j * 3];
        lp[i * 6 + 4] = pos[j * 3 + 1];
        lp[i * 6 + 5] = pos[j * 3 + 2];
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.color.copy(col);

      // Camera orbit
      camera.position.x = Math.sin(t * 0.12) * 2;
      camera.position.y = Math.cos(t * 0.1) * 1.5;
      camera.position.z = 14 + Math.sin(t * 0.15) * 2;
      camera.lookAt(0, 0, 0);

      // Gentle rotation
      points.rotation.y = t * 0.06;
      points.rotation.x = Math.sin(t * 0.04) * 0.1;
      lines.rotation.copy(points.rotation);

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
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
      className="w-full aspect-square max-w-lg mx-auto"
      style={{ minHeight: 340 }}
    />
  );
}
