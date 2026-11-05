"use client";

/**
 * Modernization gate — a WebGL landing splash.
 *
 * A point-cloud city streams toward the camera; legacy buildings flicker in dim
 * phosphor green, cross an invisible gate, and resolve into bright cyan — the
 * "legacy in, modern out" story told as motion rather than copy. Six national
 * landmarks line the route and a rotating globe feeds a network constellation
 * overhead ("International Logic Systems").
 *
 * The scene keeps its own cinematic palette — near-black ground, cyan accent,
 * international orange on the Golden Gate — rather than the page's forest and
 * green. It reads as an opener above the site rather than a continuation of it.
 * Type is the exception: it uses the site's own Inter Tight and IBM Plex Mono
 * tokens, so the wordmark and headline are set in the same faces as every page
 * below. The three.js scene lives entirely in an effect — nothing runs on the
 * server, and `prefers-reduced-motion` freezes the travel while keeping the
 * scene drawn.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CITY_DEPTH = 500;
const SPEED = 38;
const ROAD_HALF = 14;
const GATE_Z = -130;

const HEADLINES: [string, string][] = [
  ["AI-Enabled", "Modernization"],
  ["Legacy In.", "Modern Out."],
  ["Built for Federal", "& State Government"],
];

/** One point cloud on the move: a landmark stays lit, a city block transforms. */
type Mover = {
  mesh: THREE.Points;
  mat: THREE.PointsMaterial;
  total: number;
  flash: number;
  flicker: number;
  isLandmark: boolean;
};

function toGeometry(positions: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

function boxPoints(
  w: number,
  h: number,
  d: number,
  density = 2.0,
  x0 = 0,
  y0 = 0,
  z0 = 0,
): number[] {
  const p: number[] = [];
  const face = (count: number, fn: (u: number, v: number) => [number, number, number]) => {
    for (let i = 0; i < count; i++) {
      const [x, y, z] = fn(Math.random(), Math.random());
      p.push(x + x0, y + y0, z + z0);
    }
  };
  face(w * h * density, (u, v) => [u * w - w / 2, v * h, d / 2]);
  face(w * h * density, (u, v) => [u * w - w / 2, v * h, -d / 2]);
  face(d * h * density, (u, v) => [w / 2, v * h, u * d - d / 2]);
  face(d * h * density, (u, v) => [-w / 2, v * h, u * d - d / 2]);
  face(w * d * density, (u, v) => [u * w - w / 2, h, v * d - d / 2]);
  return p;
}

// --- Washington Monument ---
function obeliskPoints(baseW = 6, shaftH = 46, tipH = 6): number[] {
  const p: number[] = [];
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * shaftH;
    const half = (baseW / 2) * (1 - 0.35 * (y / shaftH));
    const side = Math.floor(Math.random() * 4);
    const t = Math.random() * 2 - 1;
    if (side === 0) p.push(t * half, y, half);
    else if (side === 1) p.push(t * half, y, -half);
    else if (side === 2) p.push(half, y, t * half);
    else p.push(-half, y, t * half);
  }
  const topHalf = (baseW / 2) * 0.65;
  for (let i = 0; i < 400; i++) {
    const v = Math.random();
    const half = topHalf * (1 - v);
    const a = Math.random() * Math.PI * 2;
    p.push(Math.cos(a) * half, shaftH + v * tipH, Math.sin(a) * half);
  }
  return p;
}

// --- US Capitol ---
function capitolPoints(): number[] {
  const p: number[] = [];
  p.push(...boxPoints(16, 9, 12, 2.4, -17));
  p.push(...boxPoints(16, 9, 12, 2.4, 17));
  p.push(...boxPoints(14, 11, 14, 2.4, 0));
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    p.push(Math.cos(a) * 5.5, 11 + Math.random() * 6, Math.sin(a) * 5.5);
  }
  for (let i = 0; i < 1400; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 0.5;
    p.push(Math.cos(u) * Math.sin(v) * 6.2, 17 + Math.cos(v) * 5.9, Math.sin(u) * Math.sin(v) * 6.2);
  }
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    p.push(Math.cos(a) * 1.1, 23 + Math.random() * 3.5, Math.sin(a) * 1.1);
  }
  return p;
}

// --- The Pentagon ---
function pentagonPoints(radius = 16, height = 6): number[] {
  const p: number[] = [];
  const verts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    verts.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  for (let s = 0; s < 5; s++) {
    const [x1, z1] = verts[s];
    const [x2, z2] = verts[(s + 1) % 5];
    for (let i = 0; i < 550; i++) {
      const t = Math.random();
      p.push(x1 + (x2 - x1) * t, Math.random() * height, z1 + (z2 - z1) * t);
    }
    for (let i = 0; i < 150; i++) {
      const t = Math.random();
      p.push((x1 + (x2 - x1) * t) * 0.45, Math.random() * height, (z1 + (z2 - z1) * t) * 0.45);
    }
  }
  for (let i = 0; i < 1500; i++) {
    const t = 0.45 + Math.random() * 0.55;
    const s = Math.floor(Math.random() * 5);
    const [x1, z1] = verts[s];
    const [x2, z2] = verts[(s + 1) % 5];
    const u = Math.random();
    p.push((x1 + (x2 - x1) * u) * t, height, (z1 + (z2 - z1) * u) * t);
  }
  return p;
}

// --- One World Trade Center: square base morphing to rotated square + spire ---
function wtcPoints(baseHalf = 6, h = 56): number[] {
  const p: number[] = [];
  const sqRadius = (ang: number, half: number) =>
    half / Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang)));
  for (let i = 0; i < 3200; i++) {
    const y = Math.random() * h;
    const f = y / h;
    const a = Math.random() * Math.PI * 2;
    const rBase = sqRadius(a, baseHalf);
    const rTop = sqRadius(a + Math.PI / 4, baseHalf * 0.72);
    const r = rBase * (1 - f) + rTop * f;
    p.push(Math.cos(a) * r, y, Math.sin(a) * r);
  }
  for (let i = 0; i < 260; i++) {
    const v = Math.random();
    p.push((Math.random() - 0.5) * 0.6, h + v * 14, (Math.random() - 0.5) * 0.6);
  }
  return p;
}

// --- Empire State Building: stepped setbacks + spire ---
function empireStatePoints(): number[] {
  const p: number[] = [];
  p.push(...boxPoints(16, 10, 12, 2.2, 0, 0));
  p.push(...boxPoints(12, 16, 9, 2.2, 0, 10));
  p.push(...boxPoints(9, 14, 7, 2.2, 0, 26));
  p.push(...boxPoints(6, 8, 5, 2.2, 0, 40));
  p.push(...boxPoints(3.5, 4, 3, 2.4, 0, 48));
  for (let i = 0; i < 320; i++) {
    const v = Math.random();
    const r = 1.4 * (1 - v);
    const a = Math.random() * Math.PI * 2;
    p.push(Math.cos(a) * r, 52 + v * 5, Math.sin(a) * r);
  }
  for (let i = 0; i < 160; i++) {
    p.push((Math.random() - 0.5) * 0.4, 57 + Math.random() * 7, (Math.random() - 0.5) * 0.4);
  }
  return p;
}

// --- Golden Gate Bridge: towers, deck, main cables, suspenders ---
// Built along the X axis so it spans ACROSS the road; camera flies under it.
function goldenGatePoints(): number[] {
  const p: number[] = [];
  const towerX = [-30, 30];
  const towerH = 42;
  const deckY = 11;
  const deckHalf = 70;

  towerX.forEach((tx) => {
    [-2.2, 2.2].forEach((zOff) => {
      for (let i = 0; i < 500; i++) {
        p.push(tx + (Math.random() - 0.5) * 1.6, Math.random() * towerH, zOff + (Math.random() - 0.5) * 1.2);
      }
    });
    [0.35, 0.6, 0.85].forEach((f) => {
      for (let i = 0; i < 120; i++) {
        p.push(tx + (Math.random() - 0.5) * 1.6, towerH * f + (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 4.4);
      }
    });
  });

  for (let i = 0; i < 1600; i++) {
    p.push((Math.random() * 2 - 1) * deckHalf, deckY + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 5);
  }

  const cableY = (x: number) => {
    const ax = Math.abs(x);
    if (ax <= 30) {
      const f = x / 30;
      return towerH - (towerH - (deckY + 3)) * (1 - f * f);
    }
    const f = (ax - 30) / (deckHalf - 30);
    return towerH - (towerH - deckY) * f;
  };
  [-2.6, 2.6].forEach((zOff) => {
    for (let i = 0; i < 900; i++) {
      const x = (Math.random() * 2 - 1) * deckHalf;
      p.push(x, cableY(x) + (Math.random() - 0.5) * 0.4, zOff);
    }
    for (let sx = -66; sx <= 66; sx += 4) {
      const top = cableY(sx);
      for (let i = 0; i < 14; i++) {
        p.push(sx, deckY + Math.random() * (top - deckY), zOff);
      }
    }
  });
  return p;
}

export default function ModernizationHero() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [headline, setHeadline] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate the headline unless the visitor has asked for less motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setHeadline((h) => (h + 1) % HEADLINES.length);
        setFade(true);
      }, 600);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a);
    scene.fog = new THREE.FogExp2(0x02030a, 0.005);

    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth / mount.clientHeight, 0.1, 800);
    camera.position.set(0, 7, 0);
    camera.lookAt(0, 10, -90);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const LEGACY = new THREE.Color(0x2e8f3e); // dim phosphor green
    const MODERN = new THREE.Color(0x66e0ff); // bright cyan
    const FLASH = new THREE.Color(0xffffff);
    const LANDMARK = new THREE.Color(0xd8f4ff); // bright white-cyan
    const BRIDGE = new THREE.Color(0xff6a2a); // international orange

    const movers: Mover[] = [];
    const add = (
      positions: number[],
      x: number,
      z: number,
      rotY = 0,
      kind: "city" | "landmark" = "city",
      color: THREE.Color | null = null,
    ) => {
      const geo = toGeometry(positions);
      const isLandmark = kind !== "city";
      const mat = new THREE.PointsMaterial({
        color: (color || (isLandmark ? LANDMARK : LEGACY)).clone(),
        size: isLandmark ? 0.4 : 0.3,
        transparent: true,
        opacity: isLandmark ? 0.95 : 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const mesh = new THREE.Points(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = rotY;
      scene.add(mesh);
      movers.push({ mesh, mat, total: positions.length / 3, flash: 0, flicker: Math.random() * 10, isLandmark });
    };

    // Landmarks along the loop.
    add(obeliskPoints(), 26, -80, 0, "landmark"); // Washington Monument
    add(capitolPoints(), -36, -160, Math.PI / 2.4, "landmark"); // US Capitol
    add(wtcPoints(), 32, -235, 0.3, "landmark"); // One World Trade Center
    add(empireStatePoints(), -32, -310, 0.2, "landmark"); // Empire State Building
    add(pentagonPoints(), 48, -380, 0.4, "landmark"); // The Pentagon
    add(goldenGatePoints(), 0, -455, 0, "landmark", BRIDGE); // Golden Gate Bridge (spans the road)

    // City fill — these do the legacy -> modern transformation.
    for (let i = 0; i < 56; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      add(
        boxPoints(6 + Math.random() * 12, 8 + Math.pow(Math.random(), 2) * 42, 6 + Math.random() * 10),
        side * (ROAD_HALF + 8 + Math.random() * 55),
        -Math.random() * CITY_DEPTH,
      );
    }

    // Road streaks.
    const streaks: THREE.Mesh[] = [];
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0xff8c1a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hotMat = streakMat.clone();
    hotMat.color = new THREE.Color(0xffd27a);
    for (let i = 0; i < 110; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15 + Math.random() * 0.5, 8 + Math.random() * 26),
        Math.random() > 0.7 ? hotMat : streakMat,
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set((Math.random() - 0.5) * ROAD_HALF * 1.7, 0.02 + Math.random() * 0.06, -Math.random() * CITY_DEPTH);
      scene.add(m);
      streaks.push(m);
    }

    // Sky constellation: rotating globe hub -> network nodes.
    const hub = new THREE.Vector3(0, 64, -270);
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < 14; i++) {
      nodes.push(
        new THREE.Vector3((Math.random() - 0.5) * 220, 42 + Math.random() * 45, -150 - Math.random() * 260),
      );
    }
    const linePos: number[] = [];
    nodes.forEach((n) => linePos.push(hub.x, hub.y, hub.z, n.x, n.y, n.z));
    const net = new THREE.LineSegments(
      toGeometry(linePos),
      new THREE.LineBasicMaterial({
        color: 0x7fd4ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(net);
    const nodePts: number[] = [];
    nodes.forEach((n) => nodePts.push(n.x, n.y, n.z));
    scene.add(
      new THREE.Points(
        toGeometry(nodePts),
        new THREE.PointsMaterial({
          color: 0xbfeaff,
          size: 1.4,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    // Rotating point-cloud globe at the hub ("International").
    const globePts: number[] = [];
    const GR = 9;
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = (lat * Math.PI) / 180;
      for (let i = 0; i < 46; i++) {
        const th = (i / 46) * Math.PI * 2;
        globePts.push(Math.cos(phi) * Math.cos(th) * GR, Math.sin(phi) * GR, Math.cos(phi) * Math.sin(th) * GR);
      }
    }
    for (let lon = 0; lon < 360; lon += 20) {
      const th = (lon * Math.PI) / 180;
      for (let i = 0; i < 30; i++) {
        const phi = ((i / 30) * 160 - 80) * (Math.PI / 180);
        globePts.push(Math.cos(phi) * Math.cos(th) * GR, Math.sin(phi) * GR, Math.cos(phi) * Math.sin(th) * GR);
      }
    }
    const globe = new THREE.Points(
      toGeometry(globePts),
      new THREE.PointsMaterial({
        color: 0x9fe8ff,
        size: 0.55,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    globe.position.copy(hub);
    scene.add(globe);

    const PULSES = 28;
    const pulsePos = new Float32Array(PULSES * 3);
    const pulseT = new Float32Array(PULSES);
    const pulseNode = new Int16Array(PULSES);
    for (let i = 0; i < PULSES; i++) {
      pulseT[i] = Math.random();
      pulseNode[i] = Math.floor(Math.random() * nodes.length);
    }
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    scene.add(
      new THREE.Points(
        pulseGeo,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 1.0,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    // Animation.
    const clock = new THREE.Clock();
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const dz = prefersReduced ? 0 : SPEED * dt;

      movers.forEach((b) => {
        b.mesh.position.z += dz;
        if (b.mesh.position.z > 15) {
          b.mesh.position.z -= CITY_DEPTH;
          b.flash = 0;
        }
        if (b.isLandmark) return; // landmarks stay bright

        const crossed = b.mesh.position.z > GATE_Z;
        if (crossed && b.flash < 1) b.flash = Math.min(1, b.flash + dt * 1.6);

        if (!crossed) {
          const flick = 0.3 + 0.12 * Math.sin(t * 11 + b.flicker) * Math.sin(t * 3.7 + b.flicker * 2);
          b.mat.color.copy(LEGACY);
          b.mat.opacity = Math.max(0.15, flick);
          b.mat.size = 0.22;
          b.mesh.geometry.setDrawRange(0, Math.floor(b.total * 0.35));
        } else {
          const e = b.flash;
          b.mat.color.copy(FLASH).lerp(MODERN, e);
          b.mat.opacity = 0.95 - 0.05 * e;
          b.mat.size = 0.42 - 0.06 * e;
          b.mesh.geometry.setDrawRange(0, Math.floor(b.total * (0.35 + 0.65 * Math.min(1, e * 2))));
        }
      });

      streaks.forEach((s) => {
        s.position.z += dz * 1.6;
        if (s.position.z > 15) s.position.z -= CITY_DEPTH;
      });

      globe.rotation.y = t * 0.25;

      for (let i = 0; i < PULSES; i++) {
        pulseT[i] += dt * 0.25;
        if (pulseT[i] > 1) {
          pulseT[i] = 0;
          pulseNode[i] = Math.floor(Math.random() * nodes.length);
        }
        const n = nodes[pulseNode[i]];
        pulsePos[i * 3] = hub.x + (n.x - hub.x) * pulseT[i];
        pulsePos[i * 3 + 1] = hub.y + (n.y - hub.y) * pulseT[i];
        pulsePos[i * 3 + 2] = hub.z + (n.z - hub.z) * pulseT[i];
      }
      pulseGeo.attributes.position.needsUpdate = true;
      net.material.opacity = 0.13 + Math.sin(t * 1.3) * 0.04;

      camera.position.x = Math.sin(t * 0.3) * 0.8;
      camera.position.y = 7 + Math.sin(t * 0.6) * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Stop drawing while the splash is scrolled off-screen — a background hero
    // has no business burning a GPU frame budget nobody is looking at.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) animate();
        else if (!entry.isIntersecting && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 },
    );
    io.observe(mount);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      movers.forEach((b) => {
        b.mesh.geometry.dispose();
        b.mat.dispose();
      });
      streaks.forEach((s) => s.geometry.dispose());
      pulseGeo.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // The page's own faces, read off the @theme tokens, so the hero is set in the
  // same two families as everything below it.
  const display = "var(--font-display)"; // Inter Tight
  const mono = "var(--font-mono)"; // IBM Plex Mono

  return (
    <section
      aria-label="International Logic Systems — legacy systems, modernized"
      style={{
        position: "relative",
        width: "100%",
        // Fill the viewport below the 76px sticky header, as one clean screen.
        height: "calc(100svh - 76px)",
        minHeight: "460px",
        background: "#02030a",
        overflow: "hidden",
      }}
    >
      <div ref={mountRef} aria-hidden style={{ position: "absolute", inset: 0 }} />

      {/* Readability wash behind the copy, so headline weight never depends on
          wherever the point cloud happens to be. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 42%, rgba(2,3,10,0) 30%, rgba(2,3,10,0.58) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 1.25rem",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            color: "#9fe8ff",
            fontFamily: mono,
            fontWeight: 500,
            fontSize: "clamp(0.68rem, 1.1vw, 0.8rem)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "1.15rem",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            paddingLeft: "0.16em", // optically balance the tracking
          }}
        >
          International Logic Systems
        </div>

        <h1
          style={{
            color: "#f0f7ff",
            fontFamily: display,
            fontWeight: 800,
            fontSize: "clamp(2.1rem, 6vw, 4.25rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.08,
            textShadow: "0 0 30px rgba(102,224,255,0.45), 0 2px 8px rgba(0,0,0,0.85)",
            margin: 0,
            opacity: fade ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          {HEADLINES[headline][0]}
          <br />
          {HEADLINES[headline][1]}
        </h1>

        <p
          style={{
            color: "#c9dbe8",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
            lineHeight: 1.6,
            maxWidth: "40rem",
            marginTop: "1.4rem",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Legacy systems in, modern platforms out — AI-enabled software engineering
          for the federal and state government enterprise.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.9rem",
            justifyContent: "center",
            marginTop: "2rem",
            pointerEvents: "auto",
          }}
        >
          <Link href="/contact" className="mgh-btn mgh-btn-primary">
            Schedule a capability briefing
          </Link>
          <Link href="/contracts" className="mgh-btn mgh-btn-ghost">
            View contract vehicles
          </Link>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "1.4rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#9fe8ff",
          fontFamily: mono,
          fontSize: "0.62rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.72,
        }}
      >
        Scroll ▾
      </div>

      {/* Scoped to the hero: the page's own .btn-primary is brand green, which
          would fight the cyan the scene resolves to. */}
      <style>{`
        .mgh-btn {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.72rem 1.35rem;
          border-radius: 2px;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .mgh-btn:hover { transform: translateY(-1px); }
        .mgh-btn-primary {
          background: #66e0ff;
          color: #02121a;
          box-shadow: 0 0 24px rgba(102,224,255,0.35);
        }
        .mgh-btn-primary:hover { background: #8fe9ff; box-shadow: 0 0 30px rgba(102,224,255,0.5); }
        .mgh-btn-ghost {
          color: #d8f4ff;
          border: 1px solid rgba(159,232,255,0.45);
        }
        .mgh-btn-ghost:hover { border-color: rgba(159,232,255,0.9); background: rgba(102,224,255,0.08); }
      `}</style>
    </section>
  );
}
