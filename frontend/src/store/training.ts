import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ChallengeProgress,
  DailyTask,
  PlayerStats,
  TrainingChallenge,
  ChallengeType,
  ChallengeDifficulty,
} from '../types';
import { challengeGroups, trainingChallenges, getChallengeById, getChallengesByGroup } from '../data/trainingData';
import {
  STORAGE_KEY,
  DEFAULT_UNLOCKED_GROUPS,
  TYPE_LABELS,
  DIFFICULTY_LABELS,
} from '../utils/trainingConstants';

const BOARD_SIZE = 15;
const EMPTY = 0;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface StoredState {
  challenges: Record<string, ChallengeProgress>;
  unlockedGroups: string[];
  dailyTasks: DailyTask[];
  playerStats: PlayerStats;
  lastDailyRefresh: string;
}

function defaultPlayerStats(): PlayerStats {
  return {
    totalXP: 0,
    totalCompleted: 0,
    winRate: 0,
    recentGames: 0,
    recentWins: 0,
    avgMoves: 0,
    weaknesses: [],
    strengths: [],
  };
}

function safeLoadState(): StoredState {
  let parsed: StoredState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      parsed = JSON.parse(raw) as StoredState;
    }
  } catch (_) {
    parsed = null;
  }

  const result: StoredState = {
    challenges: {},
    unlockedGroups: [...DEFAULT_UNLOCKED_GROUPS],
    dailyTasks: [],
    playerStats: defaultPlayerStats(),
    lastDailyRefresh: '',
  };

  if (parsed) {
    if (parsed.challenges && typeof parsed.challenges === 'object') {
      result.challenges = parsed.challenges;
    }
    if (Array.isArray(parsed.unlockedGroups) && parsed.unlockedGroups.length > 0) {
      for (const gid of DEFAULT_UNLOCKED_GROUPS) {
        if (!parsed.unlockedGroups.includes(gid)) {
          parsed.unlockedGroups.push(gid);
        }
      }
      result.unlockedGroups = parsed.unlockedGroups;
    }
    if (Array.isArray(parsed.dailyTasks)) {
      result.dailyTasks = parsed.dailyTasks;
    }
    if (parsed.playerStats && typeof parsed.playerStats === 'object') {
      result.playerStats = {
        ...defaultPlayerStats(),
        ...parsed.playerStats,
        weaknesses: Array.isArray(parsed.playerStats.weaknesses) ? parsed.playerStats.weaknesses : [],
        strengths: Array.isArray(parsed.playerStats.strengths) ? parsed.playerStats.strengths : [],
      };
    }
    if (typeof parsed.lastDailyRefresh === 'string') {
      result.lastDailyRefresh = parsed.lastDailyRefresh;
    }
  }

  return result;
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // ignore
  }
}

function generateDailyTasks(date: string, stats: PlayerStats): DailyTask[] {
  const tasks: DailyTask[] = [];
  const weaknessTypes: ChallengeType[] =
    stats.weaknesses && stats.weaknesses.length > 0
      ? stats.weaknesses
      : (['checkmate', 'defense', 'tactical'] as ChallengeType[]);

  tasks.push({
    id: `daily-${date}-any`,
    date,
    title: '每日练习',
    description: '完成任意 3 道训练题',
    targetCount: 3,
    currentCount: 0,
    reward: 30,
    completed: false,
    challengeType: undefined,
  });

  const focusType = weaknessTypes[0];
  tasks.push({
    id: `daily-${date}-type-${focusType}`,
    date,
    title: `专项突破：${TYPE_LABELS[focusType]}`,
    description: `完成 2 道${TYPE_LABELS[focusType]}类型的训练题`,
    targetCount: 2,
    currentCount: 0,
    reward: 40,
    completed: false,
    challengeType: focusType,
  });

  const diff: ChallengeDifficulty =
    stats.totalXP < 100 ? 'easy' : stats.totalXP < 400 ? 'medium' : 'hard';
  tasks.push({
    id: `daily-${date}-diff-${diff}`,
    date,
    title: `难度挑战：${DIFFICULTY_LABELS[diff]}`,
    description: `完成 2 道${DIFFICULTY_LABELS[diff]}难度的训练题`,
    targetCount: 2,
    currentCount: 0,
    reward: 50,
    completed: false,
    challengeType: undefined,
  });

  return tasks;
}

export const useTrainingStore = defineStore('training', () => {
  const stored = safeLoadState();

  const challenges = ref<Record<string, ChallengeProgress>>(stored.challenges);
  const unlockedGroups = ref<string[]>(stored.unlockedGroups);
  const dailyTasks = ref<DailyTask[]>(stored.dailyTasks);
  const playerStats = ref<PlayerStats>(stored.playerStats);
  const lastDailyRefresh = ref<string>(stored.lastDailyRefresh);

  const activeChallengeId = ref<string | null>(null);
  const activeChallengeBoard = ref<number[][]>([]);
  const challengeAttemptMoves = ref<[number, number][]>([]);
  const challengeResult = ref<'idle' | 'correct' | 'wrong'>('idle');
  const currentHintIndex = ref(0);
  const showHint = ref(false);
  const currentHint = ref<string | null>(null);

  function persist() {
    saveState({
      challenges: challenges.value,
      unlockedGroups: unlockedGroups.value,
      dailyTasks: dailyTasks.value,
      playerStats: playerStats.value,
      lastDailyRefresh: lastDailyRefresh.value,
    });
  }

  function refreshDailyTasksIfNeeded() {
    const today = todayStr();
    if (lastDailyRefresh.value !== today) {
      dailyTasks.value = generateDailyTasks(today, playerStats.value);
      lastDailyRefresh.value = today;
      persist();
    } else if (!dailyTasks.value || dailyTasks.value.length === 0) {
      dailyTasks.value = generateDailyTasks(today, playerStats.value);
      persist();
    }
  }

  refreshDailyTasksIfNeeded();

  const activeChallenge = computed<TrainingChallenge | null>(() => {
    if (!activeChallengeId.value) return null;
    return getChallengeById(activeChallengeId.value) || null;
  });

  const isChallengeCompleted = (id: string): boolean => {
    return !!challenges.value[id]?.completed;
  };

  const groupProgress = computed(() => {
    const result: Record<string, { total: number; completed: number; unlocked: boolean; nextRequired: number }> = {};
    for (const g of challengeGroups) {
      const chs = getChallengesByGroup(g.id);
      let completed = 0;
      for (const c of chs) {
        if (isChallengeCompleted(c.id)) completed++;
      }
      const unlocked = unlockedGroups.value.includes(g.id);
      const idx = challengeGroups.indexOf(g);
      const nextGroup = idx >= 0 && idx < challengeGroups.length - 1 ? challengeGroups[idx + 1] : null;
      result[g.id] = {
        total: chs.length,
        completed,
        unlocked,
        nextRequired: nextGroup ? nextGroup.requiredProgress : 0,
      };
    }
    return result;
  });

  const recommendedChallenges = computed<TrainingChallenge[]>(() => {
    refreshDailyTasksIfNeeded();

    const allUnlocked: TrainingChallenge[] = [];
    for (const gid of unlockedGroups.value) {
      for (const c of getChallengesByGroup(gid)) {
        allUnlocked.push(c);
      }
    }

    if (allUnlocked.length === 0) {
      const fallback: TrainingChallenge[] = [];
      for (const gid of DEFAULT_UNLOCKED_GROUPS) {
        for (const c of getChallengesByGroup(gid)) {
          fallback.push(c);
        }
      }
      return fallback.slice(0, 3);
    }

    const uncompleted = allUnlocked.filter(c => !isChallengeCompleted(c.id));
    const pool = uncompleted.length > 0 ? uncompleted : allUnlocked;

    const weaknessTypes: ChallengeType[] =
      playerStats.value.weaknesses.length > 0
        ? playerStats.value.weaknesses
        : (['checkmate', 'defense', 'tactical'] as ChallengeType[]);

    const scored = pool.map(c => {
      let score = 0;
      if (weaknessTypes.includes(c.type)) score += 3;
      if (c.difficulty === 'easy') score += 1;
      if (playerStats.value.totalXP < 100 && c.difficulty === 'easy') score += 2;
      const prog = challenges.value[c.id];
      if (prog) {
        score += prog.attempts > 0 ? -1 : 0;
        if (prog.completed) score -= 5;
      }
      return { c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.c);
  });

  const nextChallengeOfActive = computed<TrainingChallenge | null>(() => {
    if (!activeChallengeId.value) return null;

    const pool: TrainingChallenge[] = [];
    for (const gid of unlockedGroups.value) {
      for (const c of getChallengesByGroup(gid)) {
        pool.push(c);
      }
    }
    const ordered = pool.sort((a, b) => {
      const ga = challengeGroups.findIndex(gr => gr.id === a.groupId);
      const gb = challengeGroups.findIndex(gr => gr.id === b.groupId);
      if (ga !== gb) return ga - gb;
      return trainingChallenges.indexOf(a) - trainingChallenges.indexOf(b);
    });

    const idx = ordered.findIndex(c => c.id === activeChallengeId.value);
    if (idx === -1) return ordered[0] || null;
    for (let i = idx + 1; i < ordered.length; i++) {
      if (!isChallengeCompleted(ordered[i].id)) {
        return ordered[i];
      }
    }
    for (let i = 0; i < ordered.length; i++) {
      if (!isChallengeCompleted(ordered[i].id)) {
        return ordered[i];
      }
    }
    return ordered[idx + 1] || ordered[0] || null;
  });

  function startChallenge(id: string) {
    const ch = getChallengeById(id);
    if (!ch) return;
    activeChallengeId.value = id;
    activeChallengeBoard.value = ch.initialBoard.map(row => [...row]);
    challengeAttemptMoves.value = [];
    challengeResult.value = 'idle';
    currentHintIndex.value = 0;
    showHint.value = false;
    currentHint.value = null;
  }

  function resetChallenge() {
    if (!activeChallenge.value) return;
    activeChallengeBoard.value = activeChallenge.value.initialBoard.map(row => [...row]);
    challengeAttemptMoves.value = [];
    challengeResult.value = 'idle';
    currentHintIndex.value = 0;
    showHint.value = false;
    currentHint.value = null;
  }

  function placeTrainingStone(row: number, col: number): boolean {
    if (!activeChallenge.value) return false;
    if (challengeResult.value === 'correct') return false;
    if (challengeResult.value === 'wrong') {
      resetChallenge();
      return false;
    }
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
    if (!activeChallengeBoard.value[row] || activeChallengeBoard.value[row][col] !== EMPTY) return false;

    const newBoard = activeChallengeBoard.value.map(r => [...r]);
    newBoard[row][col] = activeChallenge.value.playerToMove;
    activeChallengeBoard.value = newBoard;
    challengeAttemptMoves.value = [...challengeAttemptMoves.value, [row, col]];

    const ch = activeChallenge.value;
    const isCorrect = ch.correctMoves.some(([r, c]) => r === row && c === col);

    if (isCorrect) {
      challengeResult.value = 'correct';
      handleChallengeComplete(ch.id);
    } else {
      challengeResult.value = 'wrong';
      if (!challenges.value[ch.id]) {
        challenges.value[ch.id] = {
          challengeId: ch.id,
          completed: false,
          attempts: 0,
        };
      }
      challenges.value[ch.id].attempts++;
      analyzePlayerPerformance();
      persist();
    }

    return true;
  }

  function handleChallengeComplete(challengeId: string) {
    const ch = getChallengeById(challengeId);
    if (!ch) return;

    if (!challenges.value[challengeId]) {
      challenges.value[challengeId] = {
        challengeId,
        completed: false,
        attempts: 0,
      };
    }
    const wasCompleted = challenges.value[challengeId].completed;
    challenges.value[challengeId].completed = true;
    challenges.value[challengeId].attempts++;
    challenges.value[challengeId].completedAt = new Date().toLocaleString('zh-CN');

    if (!wasCompleted) {
      playerStats.value.totalXP += ch.reward;
      playerStats.value.totalCompleted++;
      updateDailyTaskProgress(ch);
      analyzePlayerPerformance();
      checkGroupUnlocks();
    }

    persist();
  }

  function updateDailyTaskProgress(ch: TrainingChallenge) {
    refreshDailyTasksIfNeeded();
    if (!dailyTasks.value) return;

    for (const task of dailyTasks.value) {
      if (task.completed) continue;

      if (task.challengeType && task.challengeType !== ch.type) continue;

      if (task.id.includes('-diff-easy') && ch.difficulty !== 'easy') continue;
      if (task.id.includes('-diff-medium') && ch.difficulty !== 'medium') continue;
      if (task.id.includes('-diff-hard') && ch.difficulty !== 'hard') continue;

      if (task.currentCount < task.targetCount) {
        task.currentCount++;
        if (task.currentCount >= task.targetCount) {
          task.completed = true;
          playerStats.value.totalXP += task.reward;
        }
      }
    }
  }

  function analyzePlayerPerformance() {
    const typeStats: Record<ChallengeType, { attempted: number; completed: number }> = {
      checkmate: { attempted: 0, completed: 0 },
      defense: { attempted: 0, completed: 0 },
      opening: { attempted: 0, completed: 0 },
      tactical: { attempted: 0, completed: 0 },
    };

    for (const [cid, prog] of Object.entries(challenges.value)) {
      const ch = getChallengeById(cid);
      if (!ch) continue;
      if (prog.attempts > 0) {
        typeStats[ch.type].attempted += prog.attempts;
      }
      if (prog.completed) {
        typeStats[ch.type].completed++;
      }
    }

    const weaknesses: ChallengeType[] = [];
    const strengths: ChallengeType[] = [];

    for (const [t, s] of Object.entries(typeStats) as [ChallengeType, { attempted: number; completed: number }][]) {
      if (s.attempted >= 2) {
        const rate = s.attempted > 0 ? s.completed / s.attempted : 0;
        if (rate < 0.5) weaknesses.push(t);
        if (rate >= 0.8) strengths.push(t);
      }
    }

    playerStats.value.weaknesses = weaknesses;
    playerStats.value.strengths = strengths;
  }

  function checkGroupUnlocks() {
    for (const g of challengeGroups) {
      if (!unlockedGroups.value.includes(g.id) && playerStats.value.totalXP >= g.requiredProgress) {
        if (!unlockedGroups.value.includes(g.id)) {
          unlockedGroups.value.push(g.id);
        }
      }
    }
    for (const gid of DEFAULT_UNLOCKED_GROUPS) {
      if (!unlockedGroups.value.includes(gid)) {
        unlockedGroups.value.push(gid);
      }
    }
  }

  function nextHint(): string | null {
    if (!activeChallenge.value) return null;
    if (currentHintIndex.value >= activeChallenge.value.hints.length) return null;
    showHint.value = true;
    const hint = activeChallenge.value.hints[currentHintIndex.value];
    currentHintIndex.value++;
    currentHint.value = hint;
    return hint;
  }

  function goNextChallenge() {
    const n = nextChallengeOfActive.value;
    if (n) {
      startChallenge(n.id);
    } else {
      exitChallenge();
    }
  }

  function exitChallenge() {
    activeChallengeId.value = null;
    activeChallengeBoard.value = [];
    challengeAttemptMoves.value = [];
    challengeResult.value = 'idle';
    currentHintIndex.value = 0;
    showHint.value = false;
    currentHint.value = null;
  }

  function updateStatsFromGame(winner: number | null, movesCount: number, playerColor: number) {
    playerStats.value.recentGames++;
    const total = playerStats.value.recentGames;
    playerStats.value.avgMoves = Math.round(
      ((playerStats.value.avgMoves || 0) * (total - 1) + (movesCount || 0)) / (total || 1)
    );
    if (winner === playerColor) {
      playerStats.value.recentWins++;
    }
    if (total > 0) {
      playerStats.value.winRate = Math.round((playerStats.value.recentWins / total) * 100);
    }
    persist();
  }

  function resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = safeLoadState();
    challenges.value = fresh.challenges;
    unlockedGroups.value = fresh.unlockedGroups;
    dailyTasks.value = fresh.dailyTasks;
    playerStats.value = fresh.playerStats;
    lastDailyRefresh.value = fresh.lastDailyRefresh;
    exitChallenge();
    refreshDailyTasksIfNeeded();
  }

  return {
    challenges,
    unlockedGroups,
    dailyTasks,
    playerStats,
    activeChallengeId,
    activeChallenge,
    activeChallengeBoard,
    challengeAttemptMoves,
    challengeResult,
    currentHintIndex,
    showHint,
    currentHint,
    nextChallengeOfActive,
    groupProgress,
    recommendedChallenges,
    isChallengeCompleted,
    refreshDailyTasksIfNeeded,
    startChallenge,
    resetChallenge,
    placeTrainingStone,
    nextHint,
    goNextChallenge,
    exitChallenge,
    updateStatsFromGame,
    resetAllProgress,
  };
});
