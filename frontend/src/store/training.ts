import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ChallengeProgress,
  ChallengeGroup,
  DailyTask,
  PlayerStats,
  TrainingChallenge,
  ChallengeType,
  ChallengeDifficulty,
} from '../types';
import { challengeGroups, trainingChallenges, getChallengeById, getGroupById, getChallengesByGroup } from '../data/trainingData';

const STORAGE_KEY = 'gobang-training-state';
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

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed && parsed.challenges) return parsed;
    }
  } catch (_) {
    // ignore
  }
  return {
    challenges: {},
    unlockedGroups: ['group-beginner-1'],
    dailyTasks: [],
    playerStats: defaultPlayerStats(),
    lastDailyRefresh: '',
  };
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
  const weaknessTypes = stats.weaknesses.length > 0 ? stats.weaknesses : ['checkmate', 'defense', 'tactical'];

  tasks.push({
    id: `daily-${date}-any`,
    date,
    title: '每日练习',
    description: '完成任意 3 道训练题',
    targetCount: 3,
    currentCount: 0,
    reward: 30,
    completed: false,
  });

  const focusType = weaknessTypes[0];
  const typeLabels: Record<ChallengeType, string> = {
    checkmate: '杀棋',
    defense: '防守',
    opening: '布局',
    tactical: '战术',
  };
  tasks.push({
    id: `daily-${date}-${focusType}`,
    date,
    title: `专项突破：${typeLabels[focusType]}`,
    description: `完成 2 道${typeLabels[focusType]}类型的训练题`,
    targetCount: 2,
    currentCount: 0,
    reward: 40,
    completed: false,
    challengeType: focusType,
  });

  const diff = stats.totalXP < 100 ? 'easy' : stats.totalXP < 400 ? 'medium' : 'hard';
  const diffLabels: Record<ChallengeDifficulty, string> = { easy: '简单', medium: '中等', hard: '困难' };
  tasks.push({
    id: `daily-${date}-${diff}`,
    date,
    title: `难度挑战：${diffLabels[diff]}`,
    description: `完成 2 道${diffLabels[diff]}难度的训练题`,
    targetCount: 2,
    currentCount: 0,
    reward: 50,
    completed: false,
  });

  return tasks;
}

export const useTrainingStore = defineStore('training', () => {
  const stored = loadState();

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
    } else if (dailyTasks.value.length === 0) {
      dailyTasks.value = generateDailyTasks(today, playerStats.value);
      persist();
    }
  }

  refreshDailyTasksIfNeeded();

  const activeChallenge = computed<TrainingChallenge | null>(() => {
    if (!activeChallengeId.value) return null;
    return getChallengeById(activeChallengeId.value) || null;
  });

  const isChallengeCompleted = (id: string) => !!challenges.value[id]?.completed;

  const groupProgress = computed(() => {
    const result: Record<string, { total: number; completed: number; unlocked: boolean; nextRequired: number; group: ChallengeGroup }> = {};
    for (const g of challengeGroups) {
      const chs = getChallengesByGroup(g.id);
      let completed = 0;
      for (const c of chs) {
        if (isChallengeCompleted(c.id)) completed++;
      }
      const unlocked = unlockedGroups.value.includes(g.id);
      const nextGroup = challengeGroups.find((_, idx) => idx > challengeGroups.indexOf(g));
      result[g.id] = {
        total: chs.length,
        completed,
        unlocked,
        nextRequired: nextGroup ? nextGroup.requiredProgress : 0,
        group: g,
      };
    }
    return result;
  });

  const recommendedChallenges = computed<TrainingChallenge[]>(() => {
    refreshDailyTasksIfNeeded();
    const weaknessTypes = playerStats.value.weaknesses.length > 0
      ? playerStats.value.weaknesses
      : ['checkmate', 'defense', 'tactical'];

    const candidates: TrainingChallenge[] = [];
    for (const gid of unlockedGroups.value) {
      for (const c of getChallengesByGroup(gid)) {
        if (!isChallengeCompleted(c.id)) {
          candidates.push(c);
        }
      }
    }

    if (candidates.length === 0) {
      return [];
    }

    const scored = candidates.map(c => {
      let score = 0;
      if (weaknessTypes.includes(c.type)) score += 3;
      if (c.difficulty === 'easy') score += 1;
      if (playerStats.value.totalXP < 100 && c.difficulty === 'easy') score += 2;
      if (challenges.value[c.id]) {
        score += challenges.value[c.id].attempts > 0 ? -1 : 0;
      }
      return { c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.c);
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
  }

  function resetChallenge() {
    if (!activeChallenge.value) return;
    activeChallengeBoard.value = activeChallenge.value.initialBoard.map(row => [...row]);
    challengeAttemptMoves.value = [];
    challengeResult.value = 'idle';
    currentHintIndex.value = 0;
    showHint.value = false;
  }

  function placeTrainingStone(row: number, col: number): boolean {
    if (!activeChallenge.value) return false;
    if (challengeResult.value === 'correct') return false;
    if (activeChallengeBoard.value[row]?.[col] !== EMPTY) return false;

    activeChallengeBoard.value[row][col] = activeChallenge.value.playerToMove;
    challengeAttemptMoves.value.push([row, col]);

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
    }

    updateDailyTaskProgress(ch);
    analyzePlayerPerformance();
    checkGroupUnlocks();
    persist();
  }

  function updateDailyTaskProgress(ch: TrainingChallenge) {
    refreshDailyTasksIfNeeded();
    for (const task of dailyTasks.value) {
      if (task.completed) continue;
      if (task.challengeType && task.challengeType !== ch.type) continue;
      if (task.id.includes('easy') && ch.difficulty !== 'easy') continue;
      if (task.id.includes('medium') && ch.difficulty !== 'medium') continue;
      if (task.id.includes('hard') && ch.difficulty !== 'hard') continue;

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
      if (s.attempted >= 3) {
        const rate = s.completed / s.attempted;
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
        unlockedGroups.value.push(g.id);
      }
    }
  }

  function nextHint(): string | null {
    if (!activeChallenge.value) return null;
    if (currentHintIndex.value >= activeChallenge.value.hints.length) return null;
    showHint.value = true;
    const hint = activeChallenge.value.hints[currentHintIndex.value];
    currentHintIndex.value++;
    return hint;
  }

  function exitChallenge() {
    activeChallengeId.value = null;
    activeChallengeBoard.value = [];
    challengeAttemptMoves.value = [];
    challengeResult.value = 'idle';
    currentHintIndex.value = 0;
    showHint.value = false;
  }

  function updateStatsFromGame(winner: number | null, movesCount: number, playerColor: number) {
    playerStats.value.recentGames++;
    playerStats.value.avgMoves = Math.round(
      (playerStats.value.avgMoves * (playerStats.value.recentGames - 1) + movesCount) / playerStats.value.recentGames
    );
    if (winner === playerColor) {
      playerStats.value.recentWins++;
    }
    if (playerStats.value.recentGames > 0) {
      playerStats.value.winRate = Math.round((playerStats.value.recentWins / playerStats.value.recentGames) * 100);
    }
    persist();
  }

  function resetAllProgress() {
    challenges.value = {};
    unlockedGroups.value = ['group-beginner-1'];
    dailyTasks.value = generateDailyTasks(todayStr(), defaultPlayerStats());
    playerStats.value = defaultPlayerStats();
    lastDailyRefresh.value = todayStr();
    exitChallenge();
    persist();
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
    groupProgress,
    recommendedChallenges,
    isChallengeCompleted,
    refreshDailyTasksIfNeeded,
    startChallenge,
    resetChallenge,
    placeTrainingStone,
    nextHint,
    exitChallenge,
    updateStatsFromGame,
    resetAllProgress,
  };
});
