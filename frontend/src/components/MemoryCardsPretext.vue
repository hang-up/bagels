<script setup lang="ts">
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import type { StoryBeat } from "../types/demo";

const props = defineProps<{
  beat: StoryBeat;
  sceneImage: string;
}>();

interface Particle {
  char: string;
  readX: number;
  readY: number;
  sceneX: number;
  sceneY: number;
  sceneAlpha: number;
  fromOriginal: boolean;
  depth: number;
}

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stageHeight = ref(0);
const isScene = ref(false);

let particles: Particle[] = [];
let progress = 0;
let targetProgress = 0;
let rafId = 0;
let driftT = 0;
let cW = 0;
let readH = 0;
let sceneH = 0;
let initialized = false;

let isGif = false;
let gifFrameAlphas: number[][] = [];
let gifFrameOffsets: { dx: number; dy: number }[][] = [];
let gifFrameDelays: number[] = [];
let currentFrame = 0;
let frameElapsed = 0;

const MAX_GIF_FRAMES = 24;
const MAX_PARTICLES = 8000;
const READ_SIZE = 18.56;
const SCENE_SIZE = 8;
const READ_LINE_HEIGHT = 28;
const FONT_FAMILY = 'Georgia, "Times New Roman", serif';
const readFont = `${READ_SIZE}px ${FONT_FAMILY}`;
const SCENE_CELL_W = 7;
const SCENE_CELL_H = 11;
const GIF_CELL_W = 11;
const GIF_CELL_H = 16;
const SPEED = 0.005;
const PAD = 20;

function ease(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) ** 4 / 2;
}

function seededRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sampleDarkCells(img: HTMLImageElement, w: number, h: number) {
  const cols = Math.floor(w / SCENE_CELL_W);
  const rows = Math.floor(h / SCENE_CELL_H);
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const cells: { x: number; y: number; d: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      const lum =
        (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const d = 1 - lum;
      if (d > 0.2) {
        cells.push({
          x: c * SCENE_CELL_W,
          y: r * SCENE_CELL_H + SCENE_SIZE,
          d,
        });
      }
    }
  }
  return cells;
}

function computeReadPositions(content: string, width: number) {
  const out: { char: string; x: number; y: number }[] = [];
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = readFont;
  const prepared = prepareWithSegments(content, readFont);
  const textW = width - PAD * 2;
  const { lines } = layoutWithLines(prepared, textW, READ_LINE_HEIGHT);
  for (let li = 0; li < lines.length; li++) {
    let x = PAD;
    const y = PAD + li * READ_LINE_HEIGHT + READ_SIZE;
    for (const ch of lines[li].text) {
      const w = measure.measureText(ch).width;
      if (ch.trim()) out.push({ char: ch, x, y });
      x += w;
    }
  }
  return out;
}

function buildParticles(
  cells: { x: number; y: number; d: number }[],
  readPos: { char: string; x: number; y: number }[],
  content: string,
  rand: () => number,
) {
  const chars = content.replace(/\s+/g, "").split("");

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  cells.sort((a, b) => b.d - a.d);

  if (cells.length > MAX_PARTICLES) {
    cells.length = MAX_PARTICLES;
  }

  const readMaxY =
    readPos.length > 0 ? Math.max(...readPos.map((p) => p.y)) : readH;

  particles = cells.map((cell, i) => {
    const ci = i % chars.length;
    const isOrig = i < readPos.length;
    const rp = isOrig ? readPos[i] : null;
    return {
      char: chars[ci],
      readX: rp ? rp.x : PAD + rand() * (cW - PAD * 2),
      readY: rp ? rp.y : PAD + rand() * Math.max(readMaxY - PAD, 40),
      sceneX: cell.x,
      sceneY: cell.y,
      sceneAlpha: Math.min(1, cell.d * 1.3),
      fromOriginal: isOrig,
      depth: cell.y / sceneH,
    };
  });
}

// --------------- GIF helpers ---------------

function buildGifFullFrames(
  frames: import("gifuct-js").GifFrame[],
  gifW: number,
  gifH: number,
  targetCols: number,
  targetRows: number,
) {
  const comp = document.createElement("canvas");
  comp.width = gifW;
  comp.height = gifH;
  const compCtx = comp.getContext("2d")!;
  compCtx.fillStyle = "#ffffff";
  compCtx.fillRect(0, 0, gifW, gifH);

  const scaled = document.createElement("canvas");
  scaled.width = targetCols;
  scaled.height = targetRows;
  const scaledCtx = scaled.getContext("2d", { willReadFrequently: true })!;

  const results: ImageData[] = [];

  for (const frame of frames) {
    const { dims, patch, disposalType } = frame;
    const tmp = document.createElement("canvas");
    tmp.width = dims.width;
    tmp.height = dims.height;
    const tmpCtx = tmp.getContext("2d")!;
    tmpCtx.putImageData(
      new ImageData(
        Uint8ClampedArray.from(patch),
        dims.width,
        dims.height,
      ),
      0,
      0,
    );
    compCtx.drawImage(tmp, dims.left, dims.top);

    scaledCtx.clearRect(0, 0, targetCols, targetRows);
    scaledCtx.drawImage(comp, 0, 0, targetCols, targetRows);
    results.push(scaledCtx.getImageData(0, 0, targetCols, targetRows));

    if (disposalType === 2) {
      compCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    }
  }

  return results;
}

async function initGif(
  readPos: { char: string; x: number; y: number }[],
  content: string,
  rand: () => number,
) {
  const { parseGIF, decompressFrames } = await import("gifuct-js");
  const resp = await fetch(props.sceneImage);
  const buffer = await resp.arrayBuffer();
  const gif = parseGIF(buffer);
  let frames = decompressFrames(gif, true);

  if (frames.length > MAX_GIF_FRAMES) {
    const step = frames.length / MAX_GIF_FRAMES;
    const picked: typeof frames = [];
    for (let i = 0; i < MAX_GIF_FRAMES; i++)
      picked.push(frames[Math.floor(i * step)]);
    frames = picked;
  }

  const cols = Math.floor(cW / GIF_CELL_W);
  const rows = Math.floor(sceneH / GIF_CELL_H);
  const fullFrames = buildGifFullFrames(
    frames,
    gif.lsd.width,
    gif.lsd.height,
    cols,
    rows,
  );

  gifFrameDelays = frames.map((f) => Math.max(f.delay || 10, 2) * 10);

  // Union darkness across all frames to decide which cells get particles
  const maxD = new Float32Array(cols * rows);
  for (const fd of fullFrames) {
    const { data } = fd;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 4;
        const lum =
          (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        const d = 1 - lum;
        const idx = r * cols + c;
        if (d > maxD[idx]) maxD[idx] = d;
      }
    }
  }

  const cellMeta: { x: number; y: number; d: number; col: number; row: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = maxD[r * cols + c];
      if (d > 0.2) {
        cellMeta.push({
          x: c * GIF_CELL_W,
          y: r * GIF_CELL_H + SCENE_SIZE,
          d,
          col: c,
          row: r,
        });
      }
    }
  }

  buildParticles(cellMeta, readPos, content, rand);

  const OFFSET_SCALE = 10.0;

  const getDarkness = (data: Uint8ClampedArray, c: number, r: number) => {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return 0;
    const i = (r * cols + c) * 4;
    const lum =
      (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    return 1 - lum;
  };

  gifFrameAlphas = fullFrames.map((fd) => {
    const { data } = fd;
    return cellMeta.map(({ col, row }) => {
      const i = (row * cols + col) * 4;
      const lum =
        (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      return Math.min(1, (1 - lum) * 1.3);
    });
  });

  gifFrameOffsets = fullFrames.map((fd) => {
    const { data } = fd;
    return cellMeta.map(({ col, row }) => {
      const dx =
        (getDarkness(data, col + 1, row) - getDarkness(data, col - 1, row)) *
        OFFSET_SCALE;
      const dy =
        (getDarkness(data, col, row + 1) - getDarkness(data, col, row - 1)) *
        OFFSET_SCALE;
      return { dx, dy };
    });
  });

  isGif = true;
  currentFrame = 0;
  frameElapsed = 0;
}

// --------------- init ---------------

async function init() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!canvas || !container) return;

  const dpr = window.devicePixelRatio || 1;
  cW = container.clientWidth - 26;

  const content = props.beat.content;
  const readPos = computeReadPositions(content, cW);

  readH =
    readPos.length > 0 ? Math.max(...readPos.map((p) => p.y)) + PAD : 200;
  sceneH = Math.round(cW * 1.4);

  canvas.width = cW * dpr;
  canvas.height = sceneH * dpr;
  canvas.style.width = `${cW}px`;
  canvas.style.height = `${sceneH}px`;
  stageHeight.value = readH;

  const rand = seededRng(7);

  if (props.sceneImage.toLowerCase().endsWith(".gif")) {
    await initGif(readPos, content, rand);
  } else {
    const img = await loadImg(props.sceneImage);
    const cells = sampleDarkCells(img, cW, sceneH);
    buildParticles(cells, readPos, content, rand);
  }

  initialized = true;
  render();
}

// --------------- render ---------------

function render() {
  const canvas = canvasRef.value;
  if (!canvas || !initialized) return;
  const ctx = canvas.getContext("2d")!;
  const dpr = window.devicePixelRatio || 1;

  const t = ease(progress);
  stageHeight.value = readH + (sceneH - readH) * t;
  const fontSize = READ_SIZE + (SCENE_SIZE - READ_SIZE) * t;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cW, sceneH);
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "alphabetic";

  let gifT = 0;
  let nextFrame = 0;
  if (isGif && gifFrameAlphas.length > 1) {
    nextFrame = (currentFrame + 1) % gifFrameAlphas.length;
    const delay = gifFrameDelays[currentFrame] || 100;
    gifT = Math.min(1, frameElapsed / delay);
  }

  for (let pi = 0; pi < particles.length; pi++) {
    const p = particles[pi];
    let x = p.readX + (p.sceneX - p.readX) * t;
    let y = p.readY + (p.sceneY - p.readY) * t;

    let a: number;
    if (p.fromOriginal) {
      a = 1 * (1 - t) + p.sceneAlpha * t;
    } else {
      a = p.sceneAlpha * Math.min(1, t * 2.5);
    }

    if (isGif && t > 0.8 && gifFrameAlphas.length > 1) {
      const blend = Math.min(1, (t - 0.8) / 0.2);
      const frameA =
        gifFrameAlphas[currentFrame][pi] +
        (gifFrameAlphas[nextFrame][pi] - gifFrameAlphas[currentFrame][pi]) *
          gifT;
      a = a * (1 - blend) + frameA * blend;

      if (gifFrameOffsets.length > 0) {
        const off = gifFrameOffsets[currentFrame][pi];
        const offN = gifFrameOffsets[nextFrame][pi];
        x += (off.dx + (offN.dx - off.dx) * gifT) * blend;
        y += (off.dy + (offN.dy - off.dy) * gifT) * blend;
      }
    }

    // Depth-aware parallax drift
    if (t > 0.85) {
      const fade = (t - 0.85) / 0.15;
      const d = p.depth;

      const hSpeed = 0.2 + d * 0.6;
      const hAmp = 0.3 + d * 1.2;
      x +=
        Math.sin(driftT * hSpeed + p.sceneX * 0.02 + p.sceneY * 0.01) *
        hAmp *
        fade;

      const vAmp = d * 0.8;
      y +=
        Math.cos(driftT * (0.3 + d * 0.4) + p.sceneX * 0.015) * vAmp * fade;
    }

    ctx.globalAlpha = a;
    ctx.fillStyle = "#f4efe6";
    ctx.fillText(p.char, x, y);
  }
}

// --------------- tick ---------------

function tick() {
  if (targetProgress > progress) {
    progress = Math.min(targetProgress, progress + SPEED);
  } else if (targetProgress < progress) {
    progress = Math.max(targetProgress, progress - SPEED);
  }
  driftT += 0.016;

  if (isGif && progress >= 0.8 && gifFrameDelays.length > 0) {
    frameElapsed += 16;
    if (frameElapsed >= gifFrameDelays[currentFrame]) {
      frameElapsed = 0;
      currentFrame = (currentFrame + 1) % gifFrameAlphas.length;
    }
  }

  render();

  if (Math.abs(progress - targetProgress) < 0.0005) {
    progress = targetProgress;
    render();
    if (targetProgress === 0) {
      isScene.value = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
  }
  rafId = requestAnimationFrame(tick);
}

function toggle() {
  if (!initialized) return;
  if (!isScene.value) {
    isScene.value = true;
    targetProgress = 1;
    if (!rafId) rafId = requestAnimationFrame(tick);
  } else {
    targetProgress = 0;
    currentFrame = 0;
    frameElapsed = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
}

onMounted(() => {
  nextTick(() => init());
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<template>
  <article ref="containerRef" class="beat beat-memory-card">
    <header class="story-section-head story-section-head-dark">
      <h3 class="story-section-title">{{ beat.title }}</h3>
      <p v-if="beat.ambient_detail" class="story-section-subtitle">
        {{ beat.ambient_detail }}
      </p>
    </header>

    <div class="memory-stage-wrap">
      <div class="memory-stage" :style="{ height: stageHeight + 'px' }">
        <canvas ref="canvasRef" class="memory-canvas" />
      </div>
    </div>

    <div class="memory-controls">
      <button class="animate-btn" type="button" @click="toggle">
        {{ isScene ? "Read" : "Animate" }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.memory-stage {
  overflow: hidden;
  margin-top: 8px;
  border: 1px solid rgb(41 57 77 / 0.6);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgb(54 84 124 / 0.18), transparent 42%),
    linear-gradient(180deg, rgb(6 12 22), rgb(9 18 31));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 20px 44px rgb(6 13 25 / 0.16);
}

.memory-canvas {
  display: block;
  width: 100%;
}

.animate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 14px 0 0;
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid #2a3f56;
  border-radius: 999px;
  background: rgb(8 16 28 / 0.8);
  color: #d5e3f2;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 140ms,
    border-color 140ms,
    color 140ms;
}

.animate-btn:hover {
  background: rgb(18 34 57 / 0.92);
  border-color: #5f81a7;
  color: #f3f8fc;
}
</style>
