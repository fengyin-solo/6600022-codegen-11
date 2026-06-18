export type BoardState = number[][];

export interface Move {
  row: number;
  col: number;
  player: number; // 1=black, 2=white
  timestamp: number;
}

export interface GameRecord {
  id: string;
  moves: Move[];
  winner: number | null; // 0=draw, 1=black, 2=white, null=ongoing
  createdAt: string;
  duration: number;
}

export interface AIConfig {
  depth: number;
  enabled: boolean;
  playerColor: number; // AI plays as this color
}

export type GameStatus = 'idle' | 'playing' | 'finished' | 'replaying';

export type ChallengeType = 'checkmate' | 'defense' | 'opening' | 'tactical';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface TrainingChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  initialBoard: BoardState;
  playerToMove: number; // 1=black, 2=white
  correctMoves: [number, number][]; // acceptable winning/optimal moves (row, col)
  hints: string[];
  reward: number;
  groupId: string;
}

export interface ChallengeProgress {
  challengeId: string;
  completed: boolean;
  attempts: number;
  completedAt?: string;
}

export interface ChallengeGroup {
  id: string;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  requiredProgress: number; // required total XP to unlock
  challengeIds: string[];
}

export interface DailyTask {
  id: string;
  date: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  reward: number;
  completed: boolean;
  challengeType?: ChallengeType;
}

export interface PlayerStats {
  totalXP: number;
  totalCompleted: number;
  winRate: number;
  recentGames: number;
  recentWins: number;
  avgMoves: number;
  weaknesses: ChallengeType[];
  strengths: ChallengeType[];
}

export interface TrainingState {
  challenges: Record<string, ChallengeProgress>;
  unlockedGroups: string[];
  dailyTasks: DailyTask[];
  playerStats: PlayerStats;
  activeChallengeId: string | null;
  lastDailyRefresh: string;
}
