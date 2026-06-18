<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center p-4">
    <header class="w-full max-w-7xl mb-6">
      <h1 class="text-2xl font-bold text-green-400 text-center">棋类 AI 对弈与棋谱回放系统</h1>
      <p class="text-center text-gray-500 text-sm mt-1">五子棋 · Minimax + Alpha-Beta 剪枝</p>

      <div class="flex justify-center gap-2 mt-4">
        <button
          @click="activeTab = 'play'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === 'play' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
        >
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            对弈模式
          </span>
        </button>
        <button
          @click="activeTab = 'training'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors relative"
          :class="activeTab === 'training' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
        >
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            每日训练
          </span>
          <span
            v-if="pendingDailyTasks > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >{{ pendingDailyTasks }}</span>
        </button>
      </div>
    </header>

    <!-- Play Mode -->
    <div v-if="activeTab === 'play'" class="flex flex-col lg:flex-row gap-6 max-w-6xl w-full items-start justify-center">
      <!-- Board -->
      <div class="flex-shrink-0">
        <GameBoard />
      </div>

      <!-- Sidebar -->
      <div class="w-full lg:w-80 space-y-4">
        <!-- Game Status -->
        <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 class="text-lg font-bold text-green-400 mb-3">游戏状态</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">状态</span>
              <span class="text-white">
                {{ statusText }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">当前回合</span>
              <span class="flex items-center gap-1">
                <span class="inline-block w-3 h-3 rounded-full" :class="store.currentPlayer === 1 ? 'bg-gray-800 border border-gray-600' : 'bg-white'"></span>
                {{ store.currentPlayer === 1 ? '黑棋' : '白棋' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">手数</span>
              <span class="text-white">{{ store.currentMoveCount }}</span>
            </div>
            <div v-if="store.winner !== null" class="flex justify-between">
              <span class="text-gray-400">结果</span>
              <span class="font-bold" :class="store.winner === 1 ? 'text-gray-300' : store.winner === 2 ? 'text-white' : 'text-yellow-400'">
                {{ store.winner === 1 ? '黑棋胜' : store.winner === 2 ? '白棋胜' : '平局' }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              @click="handleStartGame"
              class="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {{ store.status === 'playing' ? '重新开始' : '开始游戏' }}
            </button>
          </div>
        </div>

        <!-- AI Settings -->
        <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 class="text-lg font-bold text-green-400 mb-3">AI 设置</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">启用 AI</span>
              <button
                @click="store.aiConfig.enabled = !store.aiConfig.enabled"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="store.aiConfig.enabled ? 'bg-green-600' : 'bg-gray-700'"
              >
                <span
                  class="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                  :class="store.aiConfig.enabled ? 'left-6' : 'left-0.5'"
                />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">AI 执</span>
              <div class="flex gap-2">
                <button
                  @click="store.aiConfig.playerColor = 2"
                  class="px-3 py-1 text-xs rounded transition-colors"
                  :class="store.aiConfig.playerColor === 2 ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'"
                >白棋</button>
                <button
                  @click="store.aiConfig.playerColor = 1"
                  class="px-3 py-1 text-xs rounded transition-colors"
                  :class="store.aiConfig.playerColor === 1 ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'"
                >黑棋</button>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-400">搜索深度</span>
                <span class="text-sm text-white">{{ store.aiConfig.depth }}</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                v-model.number="store.aiConfig.depth"
                class="w-full accent-green-500"
              />
              <div class="flex justify-between text-xs text-gray-600">
                <span>1 (快)</span>
                <span>4 (强)</span>
              </div>
            </div>
            <div v-if="store.isAiThinking" class="flex items-center gap-2 text-yellow-400 text-sm">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              AI 思考中...
            </div>
          </div>
        </div>

        <!-- Replay Panel -->
        <ReplayPanel />
      </div>
    </div>

    <!-- Training Mode -->
    <div v-else class="flex flex-col lg:flex-row gap-6 max-w-7xl w-full items-start justify-center">
      <div class="flex-shrink-0">
        <TrainingChallenge v-if="training.activeChallengeId" />
        <div v-else class="w-[590px] h-[590px] bg-gray-900 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
          <svg class="w-20 h-20 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          <p class="text-gray-500 text-lg">从右侧选择一道训练题开始练习</p>
          <p class="text-gray-600 text-sm mt-2">系统会根据你的表现推荐适合的题目</p>
        </div>
      </div>

      <div class="w-full lg:w-96 space-y-4">
        <TrainingPanel @start-challenge="handleStartChallenge" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from './store/game';
import { useTrainingStore } from './store/training';
import GameBoard from './components/GameBoard.vue';
import ReplayPanel from './components/ReplayPanel.vue';
import TrainingPanel from './components/TrainingPanel.vue';
import TrainingChallenge from './components/TrainingChallenge.vue';

const store = useGameStore();
const training = useTrainingStore();

const activeTab = ref<'play' | 'training'>('play');

const pendingDailyTasks = computed(() => {
  return training.dailyTasks.filter(t => !t.completed).length;
});

const statusText = computed(() => {
  switch (store.status) {
    case 'idle': return '等待开始';
    case 'playing': return '对弈中';
    case 'finished': return '已结束';
    case 'replaying': return '回放中';
    default: return '';
  }
});

const gameStartMoveCount = ref(0);

function handleStartGame() {
  gameStartMoveCount.value = store.currentMoveCount;
  store.startGame();
}

function handleStartChallenge(id: string) {
  training.startChallenge(id);
}

watch(() => store.status, (newStatus, oldStatus) => {
  if (oldStatus === 'playing' && newStatus === 'finished' && store.winner !== null) {
    const playerColor = store.aiConfig.enabled
      ? (store.aiConfig.playerColor === 1 ? 2 : 1)
      : 1;
    training.updateStatsFromGame(store.winner, store.currentMoveCount, playerColor);
  }
});
</script>
