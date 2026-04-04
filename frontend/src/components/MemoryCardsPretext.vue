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

const READ_SIZE = 14;
const SCENE_SIZE = 6;
const READ_LINE_HEIGHT = 21;
const FONT_FAMILY = 'Georgia, "Times New Roman", serif';
const readFont = `${READ_SIZE}px ${FONT_FAMILY}`;
const SCENE_CELL_W = 5;
const SCENE_CELL_H = 8;
const SPEED = 0.005;
const PAD = 16;

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
        cells.push({ x: c * SCENE_CELL_W, y: r * SCENE_CELL_H + SCENE_SIZE, d });
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

async function init() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!canvas || !container) return;

  const dpr = window.devicePixelRatio || 1;
  cW = container.clientWidth - 26;

  const content = props.beat.content;
  const readPos = computeReadPositions(content, cW);

  readH =
    readPos.length > 0
      ? Math.max(...readPos.map((p) => p.y)) + PAD
      : 200;
  sceneH = Math.round(cW * 1.4);

  canvas.width = cW * dpr;
  canvas.height = sceneH * dpr;
  canvas.style.width = `${cW}px`;
  canvas.style.height = `${sceneH}px`;

  stageHeight.value = readH;

  const img = await loadImg(props.sceneImage);
  const cells = sampleDarkCells(img, cW, sceneH);
  const chars = content.replace(/\s+/g, "").split("");
  const rand = seededRng(7);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  cells.sort((a, b) => b.d - a.d);

  const readMaxY = readPos.length > 0 ? Math.max(...readPos.map((p) => p.y)) : readH;

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
    };
  });

  initialized = true;
  render();
}

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

  for (const p of particles) {
    const x = p.readX + (p.sceneX - p.readX) * t;
    let y = p.readY + (p.sceneY - p.readY) * t;

    let a: number;
    if (p.fromOriginal) {
      a = 1 * (1 - t) + p.sceneAlpha * t;
    } else {
      a = p.sceneAlpha * Math.min(1, t * 2.5);
    }

    if (t > 0.85) {
      const d = (t - 0.85) / 0.15;
      y +=
        Math.sin(driftT * 0.5 + p.sceneX * 0.025 + p.sceneY * 0.018) *
        1.0 *
        d;
    }

    ctx.globalAlpha = a;
    ctx.fillStyle = "#f4efe6";
    ctx.fillText(p.char, x, y);
  }
}

function tick() {
  if (targetProgress > progress) {
    progress = Math.min(targetProgress, progress + SPEED);
  } else if (targetProgress < progress) {
    progress = Math.max(targetProgress, progress - SPEED);
  }
  driftT += 0.016;
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
    <span class="chip">memory-cards</span>
    <h3>{{ beat.title }}</h3>

    <div class="memory-stage" :style="{ height: stageHeight + 'px' }">
      <canvas ref="canvasRef" class="memory-canvas" />
    </div>

    <button class="animate-btn" type="button" @click="toggle">
      {{ isScene ? "Read" : "Animate" }}
    </button>
  </article>
</template>

<style scoped>
.memory-stage {
  overflow: hidden;
  margin-top: 8px;
  border-radius: 4px;
}

.memory-canvas {
  display: block;
}

.animate-btn {
  display: block;
  margin: 14px auto 0;
  padding: 6px 22px;
  border: 1px solid #2a3f56;
  border-radius: 6px;
  background: transparent;
  color: #b0c8e0;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 140ms,
    border-color 140ms;
}

.animate-btn:hover {
  background: rgba(110, 160, 220, 0.1);
  border-color: #4a6a8a;
}
</style>
