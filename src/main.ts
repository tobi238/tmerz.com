/**
 * Single-file landing page - Vite + TypeScript version
 * Generation order enforced:
 *   River -> Roads -> Buildings -> Parks
 */

import "./styles.css";

import "./analytics";

const canvas = document.getElementById("map") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", {
  alpha: true,
}) as CanvasRenderingContext2D;
const markersEl = document.getElementById("markers") as HTMLElement;

// SVG Icons - larger and more visible
const ICONS: Record<string, string> = {
  mail: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M2 6l10 7 10-7" fill="none"/></svg>`,
  github: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.92 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.82-2.34 4.66-4.57 4.9.36.31.68.93.68 1.88v2.79c0 .27.18.58.69.48C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="none"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 18H5V8h3v10zm-1.5-11.1a1.74 1.74 0 1 1 0-3.48 1.74 1.74 0 0 1 0 3.48zM18 18h-3v-5.5c0-1.5-1-2.5-2-2.5-1.5 0-2.5 1-2.5 2.5V18h-3V8h2.8v1.3c.4-.6 1.5-1.3 3-1.3 2.5 0 4.7 1.5 4.7 5v5z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>`,
  xing: `<svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <!-- left chevron -->
              <path
                d="M6.2 7.2h3.3l2.1 3.6-2.6 6H5.7l2.7-6.2-2.2-3.4z"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linejoin="round"
              />
              <!-- right 'X' -->
              <path
                d="M14.2 4.2h4.1l-4.6 8.1 5.4 9.5H15l-5.4-9.5 4.6-8.1z"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linejoin="round"
              />
            </svg>`,
};

// ====== MODE MANAGEMENT ======
let isDarkMode = true;

function initializeTheme() {
  const savedMode = localStorage.getItem("theme-mode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  console.debug("savedMode:", savedMode);
  console.debug("prefersDark:", prefersDark);

  if (savedMode === "light") {
    setLightMode();
  } else if (savedMode === "dark") {
    setDarkMode();
  } else if (prefersDark) {
    setDarkMode();
  } else {
    setLightMode();
  }
}

function setDarkMode() {
  document.documentElement.classList.remove("light-mode");
  localStorage.setItem("theme-mode", "dark");
  isDarkMode = true;
}

function setLightMode() {
  document.documentElement.classList.add("light-mode");
  localStorage.setItem("theme-mode", "light");
  isDarkMode = false;
}

// ====== CONFIG ======
const CFG = {
  gridSize: 150,
  majorSpacing: 3,

  // River
  riverWidth: 26,
  riverRoadClearance: 22,
  riverParallelBuffer: 30,

  // Road density
  majorProb: 0.92,
  minorProb: 0.7,
  minorDiagProb: 0.55,

  // Buildings / parks
  buildingRoadBuffer: 8,
  parkRoadBuffer: 15,

  // Marker placement
  markerPadding: 80,
  markerMinDistance: 180,

  // Map size multiplier
  mapScale: 2,

  // Animation - minimal subtle movement
  animationDuration: 1500,
};

// Social links (replace with your real URLs)
const LINKS = [
  {
    name: "Email",
    icon: "mail",
    url: "mailto:info@tmerz.com",
  },
  {
    name: "GitHub",
    icon: "github",
    url: "https://github.com/tobi238",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    url: "https://www.linkedin.com/in/tobiasmerz",
  },
  {
    name: "Xing",
    icon: "xing",
    url: "https://www.xing.com/profile/Tobias_Merz14/cv",
  },
];

// ====== STATE ======
let sessionSeed = Math.random() * 100000;
let river: River | null = null;
let roads: Road[] = [];
let buildings: Building[] = [];
let parks: Park[] = [];
let nodes: Record<string, Node> = {};
let markerPositions: Array<{ x: number; y: number }> = [];

// Camera state for panning and zooming
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let mapWidth = 0;
let mapHeight = 0;

// Zoom constraints
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

// Pinch zoom state
let lastPinchDistance = 0;

// Marker editing state
let isEditMode = false;
let draggedMarker: HTMLElement | null = null;
let markerDragStart = { x: 0, y: 0 };
let markerWorldStart = { x: 0, y: 0 };

// Check if device is mobile
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) ||
  "ontouchstart" in window ||
  window.innerWidth <= 768;

// Animation state
let animationStart = 0;
let isAnimating = false;
let animationTarget = { x: 0, y: 0, zoom: 1 };
let animationInitial = { x: 0, y: 0, zoom: 1 };

// ====== UTIL ======
function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  // Set map size to be larger than viewport
  mapWidth = Math.floor(window.innerWidth * CFG.mapScale);
  mapHeight = Math.floor(window.innerHeight * CFG.mapScale);

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Center camera on initial load
  camera.x = -(mapWidth - window.innerWidth) / 2;
  camera.y = -(mapHeight - window.innerHeight) / 2;
}

function prand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function smoothNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const n00 = prand((xi * 73856093) ^ (yi * 19349663) ^ sessionSeed);
  const n10 = prand(((xi + 1) * 73856093) ^ (yi * 19349663) ^ sessionSeed);
  const n01 = prand((xi * 73856093) ^ ((yi + 1) * 19349663) ^ sessionSeed);
  const n11 = prand(
    ((xi + 1) * 73856093) ^ ((yi + 1) * 19349663) ^ sessionSeed,
  );

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPointInExclusionZone(
  x: number,
  y: number,
  mainBounds: { centerX: number; centerY: number; radius: number },
  legendBounds: { left: number; right: number; top: number; bottom: number },
) {
  // Check distance from main card
  if (dist(x, y, mainBounds.centerX, mainBounds.centerY) < mainBounds.radius) {
    return true;
  }

  // Check if marker overlaps with legend
  if (doesMarkerOverlapLegend(x, y, legendBounds)) {
    return true;
  }

  return false;
}

function getLegendBounds() {
  const legendEl = document.querySelector(".legend");
  if (!legendEl) {
    return {
      left: -1000,
      right: -900,
      top: -1000,
      bottom: -900,
    };
  }

  const rect = legendEl.getBoundingClientRect();
  const padding = 10;

  return {
    left: rect.left - padding,
    right: rect.right + padding,
    top: rect.top - padding,
    bottom: rect.bottom + padding,
  };
}

function getMainCardBounds() {
  const cardEl = document.querySelector(".card");
  if (!cardEl) {
    // Fallback to fixed radius if card not found (centered in map world)
    return {
      centerX: mapWidth / 2,
      centerY: mapHeight / 2,
      radius: 340,
    };
  }

  const rect = cardEl.getBoundingClientRect();
  const pinEl = document.querySelector(".main .pin") as HTMLElement | null;
  const pinHeight = pinEl ? pinEl.offsetHeight : 60;

  // Add padding around the card + pin
  const padding = 40;

  // Calculate the bounding circle that encompasses the card and pin
  // Main card is always at the center of the map in world coordinates
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // The card is centered, so we need to account for:
  // - Half the card width/height
  // - The pin above it
  // - Extra padding
  const cardHalfWidth = rect.width / 2;
  const cardHalfHeight = rect.height / 2;

  // Use the larger dimension to create a circular exclusion zone
  const radius =
    Math.max(
      Math.sqrt(
        cardHalfWidth * cardHalfWidth + cardHalfHeight * cardHalfHeight,
      ),
      cardHalfHeight + pinHeight,
    ) + padding;

  return { centerX, centerY, radius };
}

function getPinSize() {
  // Get current pin size from CSS variable
  const pinSize =
    parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--pin-size")
        .trim(),
    ) || 68;
  return pinSize;
}

function doesMarkerOverlapLegend(
  x: number,
  y: number,
  legendBounds: { left: number; right: number; top: number; bottom: number },
) {
  const pinSize = getPinSize();
  const markerRadius = pinSize / 2;

  // Check if the marker circle intersects with the legend rectangle
  // Find the closest point on the rectangle to the marker center
  const closestX = Math.max(legendBounds.left, Math.min(x, legendBounds.right));
  const closestY = Math.max(legendBounds.top, Math.min(y, legendBounds.bottom));

  // Calculate distance from marker center to closest point
  const dx = x - closestX;
  const dy = y - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Add a small buffer
  return distance < markerRadius + 10;
}

// ====== EASING ======
function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

// ====== MAP PRIMITIVES ======
class River {
  points: Array<{ x: number; y: number }>;
  width: number;
  isVertical: boolean;

  constructor() {
    this.points = [];
    this.width = CFG.riverWidth;
    this.isVertical = Math.random() > 0.5;
    this.generate();
  }

  generate() {
    this.points = [];
    const step = 15;
    const maxMeander = 46;

    let x = this.isVertical ? mapWidth * (0.3 + Math.random() * 0.4) : -50;
    let y = this.isVertical ? -50 : mapHeight * (0.3 + Math.random() * 0.4);

    let meander = 0;

    if (this.isVertical) {
      while (y < mapHeight + 100) {
        this.points.push({ x, y });
        meander += (Math.random() - 0.5) * 15;
        meander = clamp(meander, -maxMeander, maxMeander);
        x += meander * 0.12;
        x = clamp(x, 60, mapWidth - 60);
        y += step;
      }
    } else {
      while (x < mapWidth + 100) {
        this.points.push({ x, y });
        meander += (Math.random() - 0.5) * 15;
        meander = clamp(meander, -maxMeander, maxMeander);
        y += meander * 0.12;
        y = clamp(y, 60, mapHeight - 60);
        x += step;
      }
    }
  }

  distanceTo(px: number, py: number) {
    let min = Infinity;
    for (const p of this.points) {
      const d = dist(px, py, p.x, p.y);
      if (d < min) min = d;
    }
    return min;
  }

  isNear(px: number, py: number, buffer: number) {
    return this.distanceTo(px, py) < buffer;
  }

  doesLineCross(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    clearance = CFG.riverRoadClearance,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;

    const samples = Math.max(6, Math.floor(len / 12));
    const threshold = this.width / 2 + clearance;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      if (this.distanceTo(px, py) < threshold) return true;
    }
    return false;
  }

  isLineParallel(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    buffer = CFG.riverParallelBuffer,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;

    let near = 0;
    const samples = Math.max(6, Math.floor(len / 16));
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      if (this.isNear(px, py, buffer)) near++;
    }
    return near / (samples + 1) > 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isDarkMode) {
      ctx.strokeStyle = "rgba(150, 200, 255, 0.10)";
      ctx.lineWidth = this.width + 22;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(150, 200, 255, 0.22)";
      ctx.lineWidth = this.width;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = Math.max(3, this.width * 0.22);
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(80, 130, 200, 0.25)";
      ctx.lineWidth = this.width + 22;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(60, 110, 180, 0.5)";
      ctx.lineWidth = this.width;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(40, 80, 140, 0.3)";
      ctx.lineWidth = Math.max(3, this.width * 0.22);
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Node {
  gridX: number;
  gridY: number;
  x: number;
  y: number;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;

    const baseX = gridX * CFG.gridSize;
    const baseY = gridY * CFG.gridSize;

    const n1 = smoothNoise(gridX * 0.5, gridY * 0.5);
    const n2 = smoothNoise(gridX * 0.5 + 100, gridY * 0.5 + 100);

    this.x = baseX + (n1 - 0.5) * 100;
    this.y = baseY + (n2 - 0.5) * 100;
  }
}

class Road {
  a: Node;
  b: Node;
  type: string;
  path: Array<{ x: number; y: number }>;
  dots: Array<{ t: number; v: number; r: number }>;

  constructor(a: Node, b: Node, type: string) {
    this.a = a;
    this.b = b;
    this.type = type;
    this.path = [];
    this.dots = [];
    this.makePath();
    this.makeDots();
  }

  makePath() {
    this.path = [];
    if (this.type === "major") {
      this.path.push({ x: this.a.x, y: this.a.y });
      this.path.push({ x: this.b.x, y: this.b.y });
      return;
    }

    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const seed =
      (this.a.gridX * 73856093) ^
      (this.a.gridY * 19349663) ^
      (this.b.gridX * 83492791) ^
      (this.b.gridY * 12345677) ^
      sessionSeed;

    const px = -dy / d;
    const py = dx / d;
    const curve = (prand(seed) - 0.5) * d * 0.38;

    const cx = this.a.x + dx / 2 + px * curve;
    const cy = this.a.y + dy / 2 + py * curve;

    const steps = Math.max(5, Math.floor(d / 18));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x = mt * mt * this.a.x + 2 * mt * t * cx + t * t * this.b.x;
      const y = mt * mt * this.a.y + 2 * mt * t * cy + t * t * this.b.y;
      this.path.push({ x, y });
    }

    this.path[0] = { x: this.a.x, y: this.a.y };
    this.path[this.path.length - 1] = {
      x: this.b.x,
      y: this.b.y,
    };
  }

  makeDots() {
    const count =
      this.type === "major"
        ? Math.floor(Math.random() * 3) + 3
        : Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < count; i++) {
      this.dots.push({
        t: Math.random(),
        v:
          (Math.random() * 0.0008 + 0.0003) *
          (this.type === "major" ? 1.25 : 1),
        r: Math.random() * 1.5 + 0.8,
      });
    }
  }

  step() {
    for (const dot of this.dots) {
      dot.t += dot.v;
      if (dot.t > 1) dot.t = 0;
    }
  }

  pointAt(t: number) {
    const idx = t * (this.path.length - 1);
    const a = Math.floor(idx);
    const b = Math.min(this.path.length - 1, Math.ceil(idx));
    const u = idx - a;
    const p1 = this.path[a];
    const p2 = this.path[b];
    return {
      x: p1.x + (p2.x - p1.x) * u,
      y: p1.y + (p2.y - p1.y) * u,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    const major = this.type === "major";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isDarkMode) {
      ctx.strokeStyle = "rgba(101, 245, 255, 0.08)";
      ctx.lineWidth = major ? 8 : 5;
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(101, 245, 255, 0.24)";
      ctx.lineWidth = major ? 2.6 : 1.25;
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(100, 160, 220, 0.2)";
      ctx.lineWidth = major ? 8 : 5;
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(60, 130, 200, 0.6)";
      ctx.lineWidth = major ? 2.6 : 1.25;
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.stroke();
    }

    for (const dot of this.dots) {
      const p = this.pointAt(dot.t);
      if (isDarkMode) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      } else {
        ctx.fillStyle = "rgba(100, 160, 220, 0.2)";
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, dot.r * 3.2, 0, Math.PI * 2);
      ctx.fill();

      if (isDarkMode) {
        ctx.fillStyle = "rgba(101, 245, 255, 0.65)";
      } else {
        ctx.fillStyle = "rgba(80, 140, 200, 0.7)";
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class Building {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
  o: number;

  constructor(x: number, y: number, w: number, h: number, a: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.a = a;
    this.o = 0.06 + Math.random() * 0.08;
  }

  bounds() {
    const c = Math.cos(this.a);
    const s = Math.sin(this.a);
    const corners = [
      { x: -this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: this.h / 2 },
      { x: -this.w / 2, y: this.h / 2 },
    ].map((p) => ({
      x: this.x + p.x * c - p.y * s,
      y: this.y + p.x * s + p.y * c,
    }));

    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  overlapsBuilding(other: Building, buffer = 2) {
    const a = this.bounds();
    const b = other.bounds();
    return !(
      a.maxX + buffer < b.minX ||
      b.maxX + buffer < a.minX ||
      a.maxY + buffer < b.minY ||
      b.maxY + buffer < a.minY
    );
  }

  overlapsRoad(roads: Road[], buffer = CFG.buildingRoadBuffer) {
    const r = buffer + Math.max(this.w, this.h) / 2;
    for (const road of roads) {
      for (const p of road.path) {
        if (dist(p.x, p.y, this.x, this.y) < r) return true;
      }
    }
    return false;
  }

  overlapsRiver(river: River, buffer = 10) {
    return river.isNear(this.x, this.y, buffer + this.w);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);

    if (isDarkMode) {
      ctx.fillStyle = `rgba(101, 245, 255, ${this.o * 0.32})`;
      ctx.fillRect(-this.w / 2 - 2, -this.h / 2 - 2, this.w + 4, this.h + 4);

      ctx.fillStyle = `rgba(160, 210, 255, ${this.o})`;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = `rgba(100, 160, 220, ${this.o * 0.4})`;
      ctx.fillRect(-this.w / 2 - 2, -this.h / 2 - 2, this.w + 4, this.h + 4);

      ctx.fillStyle = `rgba(80, 140, 200, ${this.o * 1.2})`;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }

    ctx.restore();
  }
}

class Park {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
  o: number;

  constructor(x: number, y: number, w: number, h: number, a: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.a = a;
    this.o = 0.07 + Math.random() * 0.06;
  }

  bounds() {
    const c = Math.cos(this.a);
    const s = Math.sin(this.a);
    const corners = [
      { x: -this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: this.h / 2 },
      { x: -this.w / 2, y: this.h / 2 },
    ].map((p) => ({
      x: this.x + p.x * c - p.y * s,
      y: this.y + p.x * s + p.y * c,
    }));

    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  overlapsPark(other: Park, buffer = 3) {
    const a = this.bounds();
    const b = other.bounds();
    return !(
      a.maxX + buffer < b.minX ||
      b.maxX + buffer < a.minX ||
      a.maxY + buffer < b.minY ||
      b.maxY + buffer < a.minY
    );
  }

  overlapsRoad(roads: Road[], buffer = CFG.parkRoadBuffer) {
    const r = buffer + Math.max(this.w, this.h) / 2;
    for (const road of roads) {
      for (const p of road.path) {
        if (dist(p.x, p.y, this.x, this.y) < r) return true;
      }
    }
    return false;
  }

  overlapsRiver(river: River, buffer = 18) {
    const b = this.bounds();
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    return river.isNear(cx, cy, buffer + Math.max(this.w, this.h));
  }

  overlapsBuildings(buildings: Building[], buffer = 3) {
    const a = this.bounds();
    for (const bld of buildings) {
      const b = bld.bounds();
      const overlap = !(
        a.maxX + buffer < b.minX ||
        b.maxX + buffer < a.minX ||
        a.maxY + buffer < b.minY ||
        b.maxY + buffer < a.minY
      );
      if (overlap) return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);

    if (isDarkMode) {
      ctx.fillStyle = `rgba(100, 220, 150, ${this.o * 0.35})`;
      ctx.fillRect(-this.w / 2 - 3, -this.h / 2 - 3, this.w + 6, this.h + 6);

      ctx.fillStyle = `rgba(100, 220, 150, ${this.o})`;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

      ctx.strokeStyle = `rgba(255, 255, 255, ${this.o * 0.28})`;
    } else {
      ctx.fillStyle = `rgba(100, 180, 120, ${this.o * 0.4})`;
      ctx.fillRect(-this.w / 2 - 3, -this.h / 2 - 3, this.w + 6, this.h + 6);

      ctx.fillStyle = `rgba(80, 160, 100, ${this.o * 1.2})`;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

      ctx.strokeStyle = `rgba(60, 140, 80, ${this.o * 0.4})`;
    }

    ctx.lineWidth = 1;
    for (let i = -this.w / 2; i < this.w / 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -this.h / 2);
      ctx.lineTo(i + 14, this.h / 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ====== GENERATION (ORDER ENFORCED) ======
function getNode(gx: number, gy: number) {
  const k = `${gx},${gy}`;
  if (!nodes[k]) nodes[k] = new Node(gx, gy);
  return nodes[k];
}

function isMajorCell(gx: number, gy: number) {
  const majorX = Math.abs(gx % CFG.majorSpacing) === 0;
  const majorY = Math.abs(gy % CFG.majorSpacing) === 0;
  return majorX || majorY;
}

function addRoadIfAllowed(a: Node, b: Node, type: string) {
  if (!river) return;

  if (river.isLineParallel(a.x, a.y, b.x, b.y)) return;

  const crosses = river.doesLineCross(a.x, a.y, b.x, b.y);

  if (type === "minor") {
    if (crosses) return;
    roads.push(new Road(a, b, type));
    return;
  }

  if (!crosses) {
    roads.push(new Road(a, b, type));
    return;
  }

  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  const nearThreshold = river.width / 2 + CFG.riverRoadClearance;

  const midNear = river.isNear(midX, midY, nearThreshold);
  const aNear = river.isNear(a.x, a.y, nearThreshold);
  const bNear = river.isNear(b.x, b.y, nearThreshold);

  if (midNear && !aNear && !bNear) {
    roads.push(new Road(a, b, type));
  }
}

function generateRiver() {
  river = new River();
}

function generateRoads() {
  roads = [];
  nodes = {};

  const cols = Math.ceil(mapWidth / CFG.gridSize) + 2;
  const rows = Math.ceil(mapHeight / CFG.gridSize) + 2;

  for (let gy = -1; gy < rows; gy++) {
    for (let gx = -1; gx < cols; gx++) {
      getNode(gx, gy);
    }
  }

  for (let gy = -1; gy < rows; gy++) {
    for (let gx = -1; gx < cols; gx++) {
      const seed = ((gx * 73856093) ^ (gy * 19349663) ^ sessionSeed) >>> 0;
      const node = getNode(gx, gy);
      const major = isMajorCell(gx, gy);

      if (prand(seed) < (major ? CFG.majorProb : CFG.minorProb)) {
        addRoadIfAllowed(node, getNode(gx + 1, gy), major ? "major" : "minor");
      }

      if (prand(seed + 500) < (major ? CFG.majorProb : CFG.minorProb)) {
        addRoadIfAllowed(node, getNode(gx, gy + 1), major ? "major" : "minor");
      }

      if (!major && prand(seed + 1000) < CFG.minorDiagProb) {
        const dx = prand(seed + 1500) > 0.5 ? 1 : -1;
        const dy = prand(seed + 2000) > 0.5 ? 1 : -1;
        addRoadIfAllowed(node, getNode(gx + dx, gy + dy), "minor");
      }
    }
  }
}

function generateBuildings() {
  buildings = [];

  roads.forEach((road, roadIdx) => {
    const start = road.path[0];
    const end = road.path[road.path.length - 1];
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perp = angle + Math.PI / 2;

    const count = Math.floor(road.path.length / 3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / Math.max(1, count)) * (road.path.length - 1));
      const p = road.path[idx];

      const seed = roadIdx * 1000 + i * 100;
      const side = prand(seed) > 0.5 ? 1 : -1;
      const offset = 18 + prand(seed + 10) * 8;
      const w = 12 + prand(seed + 20) * 9;
      const h = 18 + prand(seed + 30) * 14;

      const x = p.x + Math.cos(perp) * offset * side;
      const y = p.y + Math.sin(perp) * offset * side;

      const b = new Building(
        x,
        y,
        w,
        h,
        angle + (prand(seed + 40) > 0.5 ? 0 : Math.PI / 2),
      );

      let ok = !b.overlapsRoad(roads);
      if (ok) ok = !b.overlapsRiver(river!);
      if (ok) {
        for (const other of buildings) {
          if (b.overlapsBuilding(other)) {
            ok = false;
            break;
          }
        }
      }

      if (ok) buildings.push(b);
    }
  });
}

function generateParks() {
  parks = [];

  const cols = Math.ceil(mapWidth / CFG.gridSize) + 2;
  const rows = Math.ceil(mapHeight / CFG.gridSize) + 2;

  for (let gy = -1; gy < rows; gy++) {
    for (let gx = -1; gx < cols; gx++) {
      const seed = ((gx * 73856093) ^ (gy * 19349663) ^ sessionSeed) >>> 0;
      const cx = gx * CFG.gridSize;
      const cy = gy * CFG.gridSize;

      const parkCount = Math.floor(prand(seed + 3000) * 4) + 2;
      for (let p = 0; p < parkCount; p++) {
        const s = seed + 3000 + p * 500;
        if (prand(s) <= 0.2) continue;

        const x = cx + prand(s + 100) * 110 - 55;
        const y = cy + prand(s + 200) * 110 - 55;
        const w = 28 + prand(s + 300) * 46;
        const h = 24 + prand(s + 400) * 46;
        const a = (Math.floor(prand(s + 500) * 4) * Math.PI) / 2;

        const park = new Park(x, y, w, h, a);

        let ok = x > -w && x < mapWidth + w && y > -h && y < mapHeight + h;

        if (ok) ok = !park.overlapsRoad(roads);
        if (ok) ok = !park.overlapsRiver(river!);
        if (ok) ok = !park.overlapsBuildings(buildings);
        if (ok) {
          for (const other of parks) {
            if (park.overlapsPark(other)) {
              ok = false;
              break;
            }
          }
        }

        if (ok) parks.push(park);
      }
    }
  }
}

function placeMarkers() {
  markersEl.innerHTML = "";

  const main = document.createElement("div");
  main.className = "marker main";
  main.style.left = "50%";
  main.style.top = "50%";
  main.innerHTML = `
      <div class="main-wrapper">
        <div class="card" role="region" aria-label="Profile">
          <div class="card-inner">
            <h1 class="name">Tobias Merz</h1>
            <div class="role">Senior Developer • GIS / Geodata • Web Mapping</div>
            <p class="tagline">
              Building fast, reliable web apps and mapping experiences —
              from geospatial analysis to interactive cartography.
            </p>
            <div class="chips" aria-label="Skills">
              <span class="chip"><strong>GIS</strong> &amp; Spatial Analysis</span>
              <span class="chip"><strong>Web Mapping</strong> (Vector/Tile)</span>
              <span class="chip"><strong>OGC APIs</strong> &amp; Data Engineering</span>
              <span class="chip"><strong>Web Apps</strong> (Fullstack/UX/UI)</span>
            </div>
            <div class="divider"></div>
            <div class="cta">
              <button class="btn" id="btn-randomize">
                <span>Recreate map</span>
                <span class="kbd">R</span>
              </button>
              <button class="btn" id="btn-edit-mode" aria-label="Toggle marker edit mode" style="display: none;">
                <span id="edit-mode-text">Edit Markers</span>
                <span class="kbd">E</span>
              </button>
              <button class="btn" id="mode-toggle" aria-label="Toggle dark/light mode">
                <span id="mode-toggle-text">Light Mode</span>
                <span class="kbd">M</span>
              </button>
            </div>
            <div class="footer-note">
              Tip: Move and zoom around the map to explore different areas and find hidden treasures.
            </div>
          </div>
        </div>
      </div>
    `;
  markersEl.appendChild(main);

  const btnRand = main.querySelector("#btn-randomize") as HTMLButtonElement;
  btnRand.addEventListener("click", (e) => {
    e.preventDefault();
    reshuffle();
  });

  const btnMode = main.querySelector("#mode-toggle") as HTMLButtonElement;
  btnMode.addEventListener("click", toggleMode);

  // Show edit mode button only on desktop
  const btnEditMode = main.querySelector("#btn-edit-mode") as HTMLButtonElement;
  if (!isMobile) {
    btnEditMode.style.display = "inline-flex";
    btnEditMode.addEventListener("click", (e) => {
      e.preventDefault();
      toggleEditMode();
    });
  }

  // Get dynamic exclusion zones
  const mainBounds = getMainCardBounds();
  const legendBounds = getLegendBounds();

  const placed = [{ x: mainBounds.centerX, y: mainBounds.centerY }];
  markerPositions = [{ x: mainBounds.centerX, y: mainBounds.centerY }];

  // Define the visible initial viewport area in world coordinates
  // The initial camera is centered, so visible area is centered in the map
  const viewportBounds = {
    minX: (mapWidth - window.innerWidth) / 2,
    maxX: (mapWidth + window.innerWidth) / 2,
    minY: (mapHeight - window.innerHeight) / 2,
    maxY: (mapHeight + window.innerHeight) / 2,
  };

  for (const link of LINKS) {
    let x = 0;
    let y = 0;
    let attempts = 0;

    while (attempts < 120) {
      const r = roads[Math.floor(Math.random() * roads.length)];
      if (!r || !r.path.length) {
        attempts++;
        continue;
      }

      const p = r.path[Math.floor(Math.random() * r.path.length)];

      // Only consider roads within or near the visible initial viewport
      const margin = 200;
      if (
        p.x < viewportBounds.minX - margin ||
        p.x > viewportBounds.maxX + margin ||
        p.y < viewportBounds.minY - margin ||
        p.y > viewportBounds.maxY + margin
      ) {
        attempts++;
        continue;
      }

      const offset = 110 + Math.random() * 80;
      const ang = Math.random() * Math.PI * 2;

      x = p.x + Math.cos(ang) * offset;
      y = p.y + Math.sin(ang) * offset;

      // Check if marker is at least somewhat visible (relaxed constraints)
      if (
        x < viewportBounds.minX - CFG.markerPadding ||
        x > viewportBounds.maxX + CFG.markerPadding ||
        y < viewportBounds.minY - CFG.markerPadding ||
        y > viewportBounds.maxY + CFG.markerPadding
      ) {
        attempts++;
        continue;
      }

      // Check if point is in exclusion zones
      if (isPointInExclusionZone(x, y, mainBounds, legendBounds)) {
        attempts++;
        continue;
      }

      // Ensure minimum distance from other markers
      const ok = !placed.some(
        (m) => dist(m.x, m.y, x, y) < CFG.markerMinDistance,
      );

      if (ok) break;

      attempts++;
    }

    if (attempts >= 120) continue;

    placed.push({ x, y });
    markerPositions.push({ x, y });

    const el = document.createElement("div");
    el.className = "marker";
    // Store world coordinates as data attributes
    el.dataset.worldX = x.toString();
    el.dataset.worldY = y.toString();
    // Position in screen space with camera offset and zoom
    const screenX = x * camera.zoom + camera.x;
    const screenY = y * camera.zoom + camera.y;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.transform = `translate(-50%, -100%) scale(${camera.zoom})`;
    el.innerHTML = `
        <div class="drag-handle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 22M12 2L9 5M12 2L15 5M12 22L9 19M12 22L15 19M2 12L22 12M2 12L5 9M2 12L5 15M22 12L19 9M22 12L19 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="tooltip">${link.name}</div>
        <a href="${link.url}" target="_blank" rel="noopener" aria-label="${link.name}">
          <div class="pin">
            <div class="pin-icon">${ICONS[link.icon]}</div>
          </div>
        </a>
      `;

    // Add marker drag event listeners (desktop only)
    if (!isMobile) {
      el.addEventListener("mousedown", onMarkerMouseDown);
    }

    markersEl.appendChild(el);
  }
}

function generateAll() {
  generateRiver();
  generateRoads();
  generateBuildings();
  generateParks();
  placeMarkers();
}

function startMapAnimation() {
  isAnimating = true;
  animationStart = Date.now();

  // Calculate bounding box of all markers
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const marker of markerPositions) {
    minX = Math.min(minX, marker.x);
    maxX = Math.max(maxX, marker.x);
    minY = Math.min(minY, marker.y);
    maxY = Math.max(maxY, marker.y);
  }

  // Center of bounding box
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Calculate zoom to fit bounding box with padding
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const padding = 1.2;

  const zoomX = window.innerWidth / (boxWidth * padding);
  const zoomY = window.innerHeight / (boxHeight * padding);
  const targetZoom = Math.min(zoomX, zoomY, MAX_ZOOM);

  // Calculate camera position to center the bounding box
  const centerScreenX = window.innerWidth / 2;
  const centerScreenY = window.innerHeight / 2;

  const targetCameraX = centerScreenX - centerX * targetZoom;
  const targetCameraY = centerScreenY - centerY * targetZoom;

  animationInitial = { ...camera };
  animationTarget = {
    x: targetCameraX,
    y: targetCameraY,
    zoom: targetZoom,
  };
}

function updateAnimation() {
  if (!isAnimating) return;

  const now = Date.now();
  const elapsed = now - animationStart;
  let progress = Math.min(1, elapsed / CFG.animationDuration);

  // Ease out quad
  progress = easeOutQuad(progress);

  camera.x =
    animationInitial.x + (animationTarget.x - animationInitial.x) * progress;
  camera.y =
    animationInitial.y + (animationTarget.y - animationInitial.y) * progress;
  camera.zoom =
    animationInitial.zoom +
    (animationTarget.zoom - animationInitial.zoom) * progress;

  applyBounds();
  updateMarkerPositions();

  if (progress >= 1) {
    isAnimating = false;
  }
}

// ====== DRAW LOOP ======
function drawBackdrop() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;

  const step = 90;
  for (let x = -mapHeight; x < mapWidth + mapHeight; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + mapHeight, mapHeight);
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (isDarkMode) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
  }
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Apply camera transformation (translate and zoom)
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  drawBackdrop();

  for (const b of buildings) b.draw(ctx);
  for (const p of parks) p.draw(ctx);
  if (river) river.draw(ctx);
  for (const r of roads) {
    r.step();
    r.draw(ctx);
  }

  ctx.restore();

  updateAnimation();

  requestAnimationFrame(draw);
}

// ====== INTERACTION ======
function reshuffle() {
  sessionSeed = Math.random() * 100000;
  generateAll();
  startMapAnimation();
}

function toggleMode() {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle("light-mode");
  localStorage.setItem("theme-mode", isDarkMode ? "dark" : "light");

  // Update button text to show the mode it will switch TO
  const modeToggleText = document.getElementById("mode-toggle-text");
  if (modeToggleText) {
    modeToggleText.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
  }
}

function toggleEditMode() {
  if (isMobile) return;

  isEditMode = !isEditMode;
  const editModeText = document.getElementById("edit-mode-text");
  const btnEditMode = document.getElementById(
    "btn-edit-mode",
  ) as HTMLButtonElement;

  if (isEditMode) {
    if (editModeText) editModeText.textContent = "Done Editing";
    if (isDarkMode) {
      btnEditMode.style.background = "rgba(101, 245, 255, 0.15)";
      btnEditMode.style.borderColor = "rgba(101, 245, 255, 0.4)";
    } else {
      btnEditMode.style.background = "rgba(80, 150, 255, 0.2)";
      btnEditMode.style.borderColor = "rgba(80, 150, 255, 0.5)";
    }

    // Show drag handles
    const markers = markersEl.querySelectorAll(".marker:not(.main)");
    markers.forEach((marker) => {
      marker.classList.add("edit-mode");
    });
  } else {
    if (editModeText) editModeText.textContent = "Edit Markers";
    btnEditMode.style.background = "";
    btnEditMode.style.borderColor = "";

    // Hide drag handles
    const markers = markersEl.querySelectorAll(".marker:not(.main)");
    markers.forEach((marker) => {
      marker.classList.remove("edit-mode");
    });
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "r" || e.key === "R") {
    reshuffle();
  }
  if (e.key === "m" || e.key === "M") {
    toggleMode();
  }
  if (e.key === "e" || e.key === "E") {
    toggleEditMode();
  }
}

// ====== MARKER DRAGGING ======
function onMarkerMouseDown(e: MouseEvent) {
  if (!isEditMode || isMobile) return;

  const marker = (e.target as HTMLElement).closest(
    ".marker:not(.main)",
  ) as HTMLElement;
  if (!marker) return;

  // Prevent default to stop link navigation and prevent text selection
  e.preventDefault();
  e.stopPropagation();

  draggedMarker = marker;

  markerDragStart.x = e.clientX;
  markerDragStart.y = e.clientY;

  markerWorldStart.x = parseFloat(marker.dataset.worldX || "0");
  markerWorldStart.y = parseFloat(marker.dataset.worldY || "0");

  // Add visual feedback
  marker.style.opacity = "0.7";
}

function onMarkerMouseMove(e: MouseEvent) {
  if (!draggedMarker || !isEditMode) return;

  const dx = e.clientX - markerDragStart.x;
  const dy = e.clientY - markerDragStart.y;

  // Convert screen delta to world delta
  const worldDx = dx / camera.zoom;
  const worldDy = dy / camera.zoom;

  // Update world coordinates
  const newWorldX = markerWorldStart.x + worldDx;
  const newWorldY = markerWorldStart.y + worldDy;

  // Update data attributes
  draggedMarker.dataset.worldX = newWorldX.toString();
  draggedMarker.dataset.worldY = newWorldY.toString();

  // Update screen position
  const screenX = newWorldX * camera.zoom + camera.x;
  const screenY = newWorldY * camera.zoom + camera.y;
  draggedMarker.style.left = `${screenX}px`;
  draggedMarker.style.top = `${screenY}px`;
}

function onMarkerMouseUp() {
  if (draggedMarker) {
    // Reset visual feedback
    draggedMarker.style.opacity = "";
    draggedMarker = null;
  }
}

// ====== PANNING ======
function onMouseDown(e: MouseEvent) {
  if (draggedMarker) return;

  if (e.target !== canvas) return;
  isDragging = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  dragOffset.x = camera.x;
  dragOffset.y = camera.y;
  canvas.style.cursor = "grabbing";
}

function onMouseMove(e: MouseEvent) {
  if (draggedMarker) {
    onMarkerMouseMove(e);
    return;
  }

  if (!isDragging) return;

  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  // Update camera position
  camera.x = dragOffset.x + dx;
  camera.y = dragOffset.y + dy;

  applyBounds();
  updateMarkerPositions();
}

function onMouseUp() {
  if (draggedMarker) {
    onMarkerMouseUp();
  }

  isDragging = false;
  canvas.style.cursor = "grab";
}

function onTouchStart(e: TouchEvent) {
  if (e.target !== canvas) return;

  if (e.touches.length === 2) {
    // Pinch zoom starting
    isAnimating = false;
    isDragging = false;
    lastPinchDistance = getPinchDistance(e.touches[0], e.touches[1]);
  } else if (e.touches.length === 1) {
    // Single touch pan
    isAnimating = false;
    isDragging = true;
    dragStart.x = e.touches[0].clientX;
    dragStart.y = e.touches[0].clientY;
    dragOffset.x = camera.x;
    dragOffset.y = camera.y;
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    // Pinch zoom
    e.preventDefault();

    const currentDistance = getPinchDistance(e.touches[0], e.touches[1]);
    if (lastPinchDistance > 0) {
      const center = getPinchCenter(e.touches[0], e.touches[1]);
      const rect = canvas.getBoundingClientRect();
      const centerX = center.x - rect.left;
      const centerY = center.y - rect.top;

      // Calculate world position before zoom
      const worldX = (centerX - camera.x) / camera.zoom;
      const worldY = (centerY - camera.y) / camera.zoom;

      // Calculate new zoom
      const zoomDelta = currentDistance / lastPinchDistance;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, camera.zoom * zoomDelta),
      );

      // Calculate new camera position to keep pinch center stationary
      camera.x = centerX - worldX * newZoom;
      camera.y = centerY - worldY * newZoom;
      camera.zoom = newZoom;

      applyBounds();
      updateMarkerPositions();
    }

    lastPinchDistance = currentDistance;
  } else if (e.touches.length === 1 && isDragging) {
    // Single touch pan
    e.preventDefault();

    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    camera.x = dragOffset.x + dx;
    camera.y = dragOffset.y + dy;

    applyBounds();
    updateMarkerPositions();
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) {
    lastPinchDistance = 0;
  }
  if (e.touches.length === 0) {
    isDragging = false;
  }
}

function updateMarkerPositions() {
  const markers = markersEl.querySelectorAll(".marker");
  markers.forEach((marker) => {
    if (marker.classList.contains("main")) return;

    const markerEl = marker as HTMLElement;
    const worldX = parseFloat(markerEl.dataset.worldX || "0");
    const worldY = parseFloat(markerEl.dataset.worldY || "0");

    if (!isNaN(worldX) && !isNaN(worldY)) {
      const screenX = worldX * camera.zoom + camera.x;
      const screenY = worldY * camera.zoom + camera.y;
      markerEl.style.left = `${screenX}px`;
      markerEl.style.top = `${screenY}px`;
      markerEl.style.transform = `translate(-50%, -100%) scale(${camera.zoom})`;
    }
  });
}

// ====== ZOOMING ======
function onWheel(e: WheelEvent) {
  e.preventDefault();

  isAnimating = false;

  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Calculate world position before zoom
  const worldX = (mouseX - camera.x) / camera.zoom;
  const worldY = (mouseY - camera.y) / camera.zoom;

  // Calculate zoom delta
  const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, camera.zoom * zoomDelta),
  );

  // Calculate new camera position to keep mouse point stationary
  camera.x = mouseX - worldX * newZoom;
  camera.y = mouseY - worldY * newZoom;
  camera.zoom = newZoom;

  // Apply bounds
  applyBounds();
  updateMarkerPositions();
}

function getPinchDistance(touch1: Touch, touch2: Touch) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(touch1: Touch, touch2: Touch) {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

function applyBounds() {
  const scaledWidth = mapWidth * camera.zoom;
  const scaledHeight = mapHeight * camera.zoom;

  camera.x = Math.max(
    -(scaledWidth - window.innerWidth),
    Math.min(0, camera.x),
  );
  camera.y = Math.max(
    -(scaledHeight - window.innerHeight),
    Math.min(0, camera.y),
  );
}

// ====== INIT ======
function init() {
  // Initialize theme using the proper function
  initializeTheme();

  resize();
  generateAll();
  startMapAnimation();
  draw();

  // Update mode toggle button text after DOM is ready
  setTimeout(() => {
    const modeToggleText = document.getElementById("mode-toggle-text");
    if (modeToggleText) {
      modeToggleText.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    }
  }, 0);

  // Set cursor style for panning
  canvas.style.cursor = "grab";

  // Add event listeners
  window.addEventListener("resize", () => {
    resize();
    generateAll();
  });
  window.addEventListener("keydown", onKeyDown);

  // Mouse events for panning
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  // Mouse wheel for zooming
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // Touch events for mobile panning and pinch zoom
  canvas.addEventListener("touchstart", onTouchStart, {
    passive: false,
  });
  canvas.addEventListener("touchmove", onTouchMove, {
    passive: false,
  });
  canvas.addEventListener("touchend", onTouchEnd);
}

init();
