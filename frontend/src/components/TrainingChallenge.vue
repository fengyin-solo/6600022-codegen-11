<template>
  <div class="flex flex-col items-center">
    <div class="w-full max-w-2xl mb-4">
      <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2 py-0.5 rounded" :class="getTypeClass(ch!.type)">{{ getTypeLabel(ch!.type) }}</span>
              <span class="text-xs px-2 py-0.5 rounded" :class="getDifficultyClass(ch!.difficulty)">{{ getDifficultyLabel(ch!.difficulty) }}</span>
              <span class="text-xs text-yellow-400">+{{ ch!.reward }} XP</span>
            </div>
            <h3 class="text-lg font-bold text-white">{{ ch!.title }}</h3>
          </div>
          <button
            @click="training.exitChallenge()"
            class="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
            title="退出训练"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <p class="text-sm text-gray-300 mb-3">{{ ch!.description }}</p>

        <div class="flex items-center gap-3 text-sm mb-3">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400">执子方：</span>
            <span class="inline-block w-4 h-4 rounded-full" :class="ch!.playerToMove === 1 ? 'bg-gray-800 border border-gray-600' : 'bg-white'"></span>
            <span class="text-white">{{ ch!.playerToMove === 1 ? '黑棋' : '白棋' }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-400">
            <span>尝试：</span>
            <span class="text-white">{{ attempts }}</span>
          </div>
        </div>

        <div v-if="training.challengeResult === 'correct'" class="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span class="text-green-400 font-medium">回答正确！获得 {{ ch!.reward }} XP</span>
          </div>
        </div>
        <div v-else-if="training.challengeResult === 'wrong'" class="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            <span class="text-red-400 font-medium">这步棋不太对，点击棋盘重新尝试</span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            @click="training.nextHint()"
            class="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-600/50 rounded-lg text-sm transition-colors"
            :disabled="training.currentHintIndex >= ch!.hints.length"
          >
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              提示 ({{ training.currentHintIndex }}/{{ ch!.hints.length }})
            </span>
          </button>
          <button
            @click="training.resetChallenge()"
            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-sm transition-colors"
          >
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              重置
            </span>
          </button>
          <button
            v-if="training.challengeResult === 'correct'"
            @click="nextChallenge"
            class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            下一题
          </button>
        </div>

        <div v-if="training.currentHint" class="mt-3 bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-sm text-blue-300">{{ training.currentHint }}</p>
          </div>
        </div>
      </div>
    </div>

    <canvas
      ref="canvasRef"
      :width="canvasSize"
      :height="canvasSize"
      class="cursor-pointer rounded-lg shadow-2xl"
      @click="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useTrainingStore } from '../store/training';
import { getTypeLabel, getDifficultyLabel, getTypeClass, getDifficultyClass } from '../utils/trainingConstants';

const training = useTrainingStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const BOARD_SIZE = 15;
const CELL_SIZE = 40;
const PADDING = 30;
const canvasSize = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;

const ch = computed(() => training.activeChallenge);
const attempts = computed(() => {
  if (!ch.value) return 0;
  return training.challenges[ch.value.id]?.attempts || 0;
});

function nextChallenge() {
  training.goNextChallenge();
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1a3a2a';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.strokeStyle = '#3d7a5a';
  ctx.lineWidth = 1;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = PADDING + i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(PADDING, pos);
    ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, pos);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos, PADDING);
    ctx.lineTo(pos, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
    ctx.stroke();
  }

  const starPoints = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]];
  ctx.fillStyle = '#5aaa7a';
  for (const [r, c] of starPoints) {
    ctx.beginPath();
    ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStone(ctx: CanvasRenderingContext2D, row: number, col: number, player: number, highlight?: 'correct' | 'wrong') {
  const x = PADDING + col * CELL_SIZE;
  const y = PADDING + row * CELL_SIZE;
  const radius = CELL_SIZE * 0.42;

  const gradient = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
  if (player === 1) {
    gradient.addColorStop(0, '#555');
    gradient.addColorStop(1, '#111');
  } else {
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = player === 1 ? '#000' : '#aaa';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (highlight === 'correct') {
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (highlight === 'wrong') {
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (!ch.value) return;

  drawBoard(ctx);

  const currentBoard = training.activeChallengeBoard;
  const lastMove = training.challengeAttemptMoves.length > 0
    ? training.challengeAttemptMoves[training.challengeAttemptMoves.length - 1]
    : null;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (currentBoard[r]?.[c] !== 0) {
        let hl: 'correct' | 'wrong' | undefined;
        if (lastMove && lastMove[0] === r && lastMove[1] === c) {
          hl = training.challengeResult === 'correct' ? 'correct'
             : training.challengeResult === 'wrong' ? 'wrong'
             : undefined;
        }
        drawStone(ctx, r, c, currentBoard[r][c], hl);
      }
    }
  }
}

function handleClick(e: MouseEvent) {
  if (!ch.value) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvasSize / rect.width;
  const scaleY = canvasSize / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const col = Math.round((mx - PADDING) / CELL_SIZE);
  const row = Math.round((my - PADDING) / CELL_SIZE);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

  training.placeTrainingStone(row, col);
}



onMounted(() => {
  nextTick(() => render());
});

watch(
  [() => training.activeChallengeBoard, () => training.challengeResult, () => training.activeChallengeId, () => training.challengeAttemptMoves],
  () => {
    nextTick(() => render());
  },
  { deep: true }
);
</script>
