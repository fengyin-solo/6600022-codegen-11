import type { ChallengeType, ChallengeDifficulty } from '../types';

export const TYPE_LABELS: Record<ChallengeType, string> = {
  checkmate: '杀棋',
  defense: '防守',
  opening: '布局',
  tactical: '战术',
};

export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const TYPE_CLASSES: Record<ChallengeType, string> = {
  checkmate: 'bg-red-900/50 text-red-400',
  defense: 'bg-blue-900/50 text-blue-400',
  opening: 'bg-purple-900/50 text-purple-400',
  tactical: 'bg-orange-900/50 text-orange-400',
};

export const DIFFICULTY_CLASSES: Record<ChallengeDifficulty, string> = {
  easy: 'bg-green-900/50 text-green-400',
  medium: 'bg-yellow-900/50 text-yellow-400',
  hard: 'bg-red-900/50 text-red-400',
};

export const GROUP_TYPE_MAP: Record<string, ChallengeType[]> = {
  'group-beginner-1': ['checkmate', 'defense'],
  'group-beginner-2': ['tactical', 'opening', 'defense'],
  'group-intermediate-1': ['checkmate', 'tactical'],
  'group-intermediate-2': ['defense'],
  'group-advanced-1': ['opening', 'checkmate', 'defense', 'tactical'],
};

export const DEFAULT_UNLOCKED_GROUPS = ['group-beginner-1'];

export const STORAGE_KEY = 'gobang-training-state';

export function getTypeLabel(t: ChallengeType): string {
  return TYPE_LABELS[t] || t;
}

export function getDifficultyLabel(d: ChallengeDifficulty): string {
  return DIFFICULTY_LABELS[d] || d;
}

export function getTypeClass(t: ChallengeType): string {
  return TYPE_CLASSES[t] || 'bg-gray-800 text-gray-400';
}

export function getDifficultyClass(d: ChallengeDifficulty): string {
  return DIFFICULTY_CLASSES[d] || 'bg-gray-800 text-gray-400';
}

export function getGroupTypes(gid: string): ChallengeType[] {
  return GROUP_TYPE_MAP[gid] || [];
}
