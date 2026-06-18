<template>
  <div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-green-400">每日训练</h3>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">经验值</span>
        <span class="text-sm font-bold text-yellow-400">{{ training.playerStats.totalXP }} XP</span>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-gray-800 rounded-lg p-2 text-center">
        <div class="text-lg font-bold text-white">{{ training.playerStats.totalCompleted }}</div>
        <div class="text-xs text-gray-500">已完成</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-2 text-center">
        <div class="text-lg font-bold text-white">{{ training.playerStats.winRate }}%</div>
        <div class="text-xs text-gray-500">对弈胜率</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-2 text-center">
        <div class="text-lg font-bold text-white">{{ training.playerStats.avgMoves || 0 }}</div>
        <div class="text-xs text-gray-500">平均手数</div>
      </div>
    </div>

    <div v-if="training.playerStats.weaknesses.length > 0" class="mb-4">
      <div class="flex items-center gap-1 flex-wrap">
        <span class="text-xs text-gray-500">弱项：</span>
        <span
          v-for="w in training.playerStats.weaknesses"
          :key="w"
          class="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded-full"
        >{{ typeLabel(w) }}</span>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        每日任务
      </h4>
      <div class="space-y-2">
        <div
          v-for="task in training.dailyTasks"
          :key="task.id"
          class="bg-gray-800 rounded-lg p-3"
          :class="task.completed ? 'border border-green-600/50' : ''"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium" :class="task.completed ? 'text-green-400' : 'text-white'">{{ task.title }}</span>
            <span class="text-xs" :class="task.completed ? 'text-green-400' : 'text-yellow-400'">
              {{ task.completed ? '+已领取' : `+${task.reward} XP` }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mb-2">{{ task.description }}</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all"
                :class="task.completed ? 'bg-green-500' : 'bg-green-600'"
                :style="{ width: `${Math.min((task.currentCount / task.targetCount) * 100, 100)}%` }"
              />
            </div>
            <span class="text-xs text-gray-400">{{ task.currentCount }}/{{ task.targetCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="training.recommendedChallenges.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        为你推荐
      </h4>
      <div class="space-y-2">
        <div
          v-for="ch in training.recommendedChallenges"
          :key="ch.id"
          class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
          @click="$emit('startChallenge', ch.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-white">{{ ch.title }}</span>
            <div class="flex items-center gap-1">
              <span class="text-xs px-1.5 py-0.5 rounded" :class="diffClass(ch.difficulty)">{{ diffLabel(ch.difficulty) }}</span>
              <span class="text-xs text-yellow-400">+{{ ch.reward }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-400 rounded">{{ typeLabel(ch.type) }}</span>
            <span v-if="training.isChallengeCompleted(ch.id)" class="text-xs text-green-400 flex items-center gap-0.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              已完成
            </span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
        题目分组
      </h4>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="g in groupList"
          :key="g.group.id"
          class="rounded-lg p-3 cursor-pointer transition-colors border"
          :class="g.unlocked
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
            : 'bg-gray-800/50 border-gray-800 opacity-60 cursor-not-allowed'"
          @click="g.unlocked && toggleGroup(g.group.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1">
              <span v-if="!g.unlocked" class="text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </span>
              <span class="text-sm font-medium" :class="g.unlocked ? 'text-white' : 'text-gray-500'">{{ g.group.name }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded" :class="diffClass(g.group.difficulty)">{{ diffLabel(g.group.difficulty) }}</span>
            </div>
            <span class="text-xs text-gray-400">{{ g.completed }}/{{ g.total }}</span>
          </div>
          <p class="text-xs text-gray-500 mb-2" v-if="g.unlocked">{{ g.group.description }}</p>
          <p class="text-xs text-yellow-600" v-else>需要 {{ g.group.requiredProgress }} XP 解锁</p>
          <div v-if="g.unlocked" class="w-full bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              class="bg-green-500 h-1.5 rounded-full transition-all"
              :style="{ width: `${(g.completed / g.total) * 100}%` }"
            />
          </div>

          <div v-if="expandedGroup === g.group.id && g.unlocked" class="mt-2 pt-2 border-t border-gray-700 space-y-1">
            <div
              v-for="ch in getGroupChallenges(g.group.id)"
              :key="ch.id"
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700 cursor-pointer text-xs"
              @click.stop="$emit('startChallenge', ch.id)"
            >
              <div class="flex items-center gap-2">
                <span v-if="training.isChallengeCompleted(ch.id)" class="text-green-400">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
                <span v-else class="text-gray-600">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
                </span>
                <span :class="training.isChallengeCompleted(ch.id) ? 'text-gray-400 line-through' : 'text-gray-300'">{{ ch.title }}</span>
              </div>
              <span class="text-yellow-400">+{{ ch.reward }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTrainingStore } from '../store/training';
import { challengeGroups, getChallengesByGroup } from '../data/trainingData';
import type { ChallengeType, ChallengeDifficulty } from '../types';

defineEmits<{
  startChallenge: [id: string];
}>();

const training = useTrainingStore();
const expandedGroup = ref<string | null>(null);

const groupList = computed(() => {
  return challengeGroups.map(g => ({
    group: g,
    ...training.groupProgress[g.id],
  }));
});

function toggleGroup(id: string) {
  expandedGroup.value = expandedGroup.value === id ? null : id;
}

function getGroupChallenges(id: string) {
  return getChallengesByGroup(id);
}

function typeLabel(t: ChallengeType): string {
  const map: Record<ChallengeType, string> = {
    checkmate: '杀棋',
    defense: '防守',
    opening: '布局',
    tactical: '战术',
  };
  return map[t];
}

function diffLabel(d: ChallengeDifficulty): string {
  const map: Record<ChallengeDifficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return map[d];
}

function diffClass(d: ChallengeDifficulty): string {
  const map: Record<ChallengeDifficulty, string> = {
    easy: 'bg-green-900/50 text-green-400',
    medium: 'bg-yellow-900/50 text-yellow-400',
    hard: 'bg-red-900/50 text-red-400',
  };
  return map[d];
}
</script>
