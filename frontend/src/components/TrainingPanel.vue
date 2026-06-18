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
        >{{ getTypeLabel(w) }}</span>
      </div>
    </div>
    <div v-if="training.playerStats.strengths.length > 0" class="mb-4">
      <div class="flex items-center gap-1 flex-wrap">
        <span class="text-xs text-gray-500">强项：</span>
        <span
          v-for="s in training.playerStats.strengths"
          :key="s"
          class="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full"
        >{{ getTypeLabel(s) }}</span>
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
              {{ task.completed ? '已领取' : `+${task.reward} XP` }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mb-2">{{ task.description }}</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all"
                :class="task.completed ? 'bg-green-500' : 'bg-green-600'"
                :style="{ width: `${task.targetCount > 0 ? Math.min((task.currentCount / task.targetCount) * 100, 100) : 0}%` }"
              />
            </div>
            <span class="text-xs text-gray-400">{{ task.currentCount }}/{{ task.targetCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        为你推荐
      </h4>
      <div v-if="training.recommendedChallenges.length > 0" class="space-y-2">
        <div
          v-for="ch in training.recommendedChallenges"
          :key="ch.id"
          class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
          @click="handleStartChallenge(ch.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-white">{{ ch.title }}</span>
            <div class="flex items-center gap-1">
              <span class="text-xs px-1.5 py-0.5 rounded" :class="getDifficultyClass(ch.difficulty)">{{ getDifficultyLabel(ch.difficulty) }}</span>
              <span class="text-xs text-yellow-400">+{{ ch.reward }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-1.5 py-0.5 rounded" :class="getTypeClass(ch.type)">{{ getTypeLabel(ch.type) }}</span>
            <span v-if="training.isChallengeCompleted(ch.id)" class="text-xs text-green-400 flex items-center gap-0.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              已完成
            </span>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800 rounded-lg p-3 text-center">
        <p class="text-gray-500 text-xs">当前分组所有题目已完成</p>
        <p class="text-gray-600 text-xs mt-1">继续对弈累积经验值以解锁下一组</p>
      </div>
    </div>

    <div>
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
        题目分组
      </h4>
      <div class="space-y-2 max-h-72 overflow-y-auto">
        <div
          v-for="g in groupList"
          :key="g.id"
          class="rounded-lg p-3 transition-colors border"
          :class="g.unlocked
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 cursor-pointer'
            : 'bg-gray-800/50 border-gray-800 opacity-60 cursor-not-allowed'"
          @click="g.unlocked && toggleGroup(g.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1">
              <span v-if="!g.unlocked" class="text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </span>
              <span class="text-sm font-medium" :class="g.unlocked ? 'text-white' : 'text-gray-500'">{{ g.name }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded" :class="getDifficultyClass(g.difficulty)">{{ getDifficultyLabel(g.difficulty) }}</span>
            </div>
            <span class="text-xs text-gray-400">{{ g.completed }}/{{ g.total }}</span>
          </div>
          <div class="flex items-center gap-1 mb-2 flex-wrap" v-if="g.unlocked">
            <span v-for="t in getGroupTypes(g.id)" :key="t" class="text-xs px-1.5 py-0.5 rounded" :class="getTypeClass(t)">{{ getTypeLabel(t) }}</span>
          </div>
          <p class="text-xs text-yellow-600" v-else>需要 {{ g.requiredProgress }} XP 解锁（当前 {{ training.playerStats.totalXP }} XP）</p>
          <div v-if="g.unlocked" class="w-full bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              class="bg-green-500 h-1.5 rounded-full transition-all"
              :style="{ width: `${g.total > 0 ? (g.completed / g.total) * 100 : 0}%` }"
            />
          </div>

          <div v-if="expandedGroup === g.id && g.unlocked" class="mt-2 pt-2 border-t border-gray-700 space-y-1">
            <div
              v-for="ch in getGroupChallenges(g.id)"
              :key="ch.id"
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700 cursor-pointer text-xs"
              @click.stop="handleStartChallenge(ch.id)"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="training.isChallengeCompleted(ch.id)" class="text-green-400 flex-shrink-0">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
                <span v-else class="text-gray-600 flex-shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
                </span>
                <span :class="training.isChallengeCompleted(ch.id) ? 'text-gray-400 line-through' : 'text-gray-300'">{{ ch.title }}</span>
                <span class="px-1 py-0.5 rounded flex-shrink-0" :class="getTypeClass(ch.type)">{{ getTypeLabel(ch.type) }}</span>
              </div>
              <span class="text-yellow-400 flex-shrink-0">+{{ ch.reward }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t border-gray-800">
      <button
        @click="handleResetProgress"
        class="w-full py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 text-red-400 text-xs rounded-lg transition-colors"
      >
        重置训练进度
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTrainingStore } from '../store/training';
import { challengeGroups, getChallengesByGroup } from '../data/trainingData';
import {
  getTypeLabel,
  getDifficultyLabel,
  getTypeClass,
  getDifficultyClass,
  getGroupTypes as getGroupTypesConst,
} from '../utils/trainingConstants';
import type { ChallengeType } from '../types';

const emit = defineEmits<{
  startChallenge: [id: string];
}>();

const training = useTrainingStore();
const expandedGroup = ref<string | null>(null);

interface GroupItem {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredProgress: number;
  total: number;
  completed: number;
  unlocked: boolean;
}

const groupList = computed<GroupItem[]>(() => {
  return challengeGroups.map(g => {
    const prog = training.groupProgress[g.id] || { total: 0, completed: 0, unlocked: false, nextRequired: 0 };
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      difficulty: g.difficulty,
      requiredProgress: g.requiredProgress,
      total: prog.total,
      completed: prog.completed,
      unlocked: prog.unlocked,
    } as GroupItem;
  });
});

function toggleGroup(id: string) {
  expandedGroup.value = expandedGroup.value === id ? null : id;
}

function getGroupChallenges(id: string) {
  return getChallengesByGroup(id);
}

function getGroupTypes(gid: string): ChallengeType[] {
  return getGroupTypesConst(gid);
}

function handleStartChallenge(id: string) {
  emit('startChallenge', id);
}

function handleResetProgress() {
  if (window.confirm('确定要重置所有训练进度吗？此操作不可撤销。')) {
    training.resetAllProgress();
    expandedGroup.value = null;
  }
}
</script>
