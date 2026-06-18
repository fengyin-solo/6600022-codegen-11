package com.gobang.service;

import com.gobang.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TrainingService {

    private final Map<String, TrainingChallenge> challenges = new ConcurrentHashMap<>();
    private final Map<String, ChallengeGroup> groups = new ConcurrentHashMap<>();
    private final Map<String, Map<String, ChallengeProgress>> userProgress = new ConcurrentHashMap<>();
    private final Map<String, List<String>> userUnlockedGroups = new ConcurrentHashMap<>();
    private final Map<String, List<DailyTask>> userDailyTasks = new ConcurrentHashMap<>();
    private final Map<String, PlayerStats> userStats = new ConcurrentHashMap<>();
    private final Map<String, String> userLastRefresh = new ConcurrentHashMap<>();

    private static final int BOARD_SIZE = 15;
    private static final int E = 0;
    private static final int B = 1;
    private static final int W = 2;

    public TrainingService() {
        initChallengeGroups();
        initChallenges();
    }

    private int[][] emptyBoard() {
        return new int[BOARD_SIZE][BOARD_SIZE];
    }

    private int[][] setStones(int[][] board, int[][] stones) {
        int[][] b = new int[BOARD_SIZE][BOARD_SIZE];
        for (int i = 0; i < BOARD_SIZE; i++) {
            b[i] = Arrays.copyOf(board[i], BOARD_SIZE);
        }
        for (int[] s : stones) {
            b[s[0]][s[1]] = s[2];
        }
        return b;
    }

    private void initChallengeGroups() {
        groups.put("group-beginner-1", new ChallengeGroup(
            "group-beginner-1", "入门基础", "学习五子棋基本吃子和防守技巧",
            TrainingChallenge.Difficulty.EASY, 0,
            Arrays.asList("ch-easy-1", "ch-easy-2", "ch-easy-3", "ch-easy-4", "ch-easy-5")
        ));
        groups.put("group-beginner-2", new ChallengeGroup(
            "group-beginner-2", "初级战术", "掌握活三、冲四等基础战术",
            TrainingChallenge.Difficulty.EASY, 50,
            Arrays.asList("ch-easy-6", "ch-easy-7", "ch-easy-8", "ch-easy-9", "ch-easy-10")
        ));
        groups.put("group-intermediate-1", new ChallengeGroup(
            "group-intermediate-1", "中级杀棋", "练习连续进攻和双杀技巧",
            TrainingChallenge.Difficulty.MEDIUM, 150,
            Arrays.asList("ch-med-1", "ch-med-2", "ch-med-3", "ch-med-4", "ch-med-5")
        ));
        groups.put("group-intermediate-2", new ChallengeGroup(
            "group-intermediate-2", "中级防守", "学习如何阻止对手的进攻",
            TrainingChallenge.Difficulty.MEDIUM, 300,
            Arrays.asList("ch-med-6", "ch-med-7", "ch-med-8", "ch-med-9", "ch-med-10")
        ));
        groups.put("group-advanced-1", new ChallengeGroup(
            "group-advanced-1", "高级布局", "掌握常见开局和定式",
            TrainingChallenge.Difficulty.HARD, 500,
            Arrays.asList("ch-hard-1", "ch-hard-2", "ch-hard-3", "ch-hard-4", "ch-hard-5")
        ));
    }

    private void initChallenges() {
        challenges.put("ch-easy-1", new TrainingChallenge(
            "ch-easy-1", "一步成五", "黑棋走一步即可连成五子，请找出获胜点",
            TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.Difficulty.EASY,
            setStones(emptyBoard(), new int[][]{{7,5,B},{7,6,B},{7,7,B},{7,8,B},{6,5,W},{6,6,W},{6,7,W}}),
            B, Arrays.asList(new int[]{7,4}, new int[]{7,9}),
            Arrays.asList("观察横向的黑子数量", "已经有四个黑子连在一起了", "找到缺失的那一个位置"),
            10, "group-beginner-1"
        ));
        challenges.put("ch-easy-2", new TrainingChallenge(
            "ch-easy-2", "纵向成五", "黑棋走一步即可连成五子，请找出获胜点",
            TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.Difficulty.EASY,
            setStones(emptyBoard(), new int[][]{{4,7,B},{5,7,B},{6,7,B},{8,7,B},{4,6,W},{5,6,W},{6,6,W}}),
            B, Arrays.asList(new int[]{7,7}, new int[]{3,7}),
            Arrays.asList("观察纵向的黑子", "数一数纵向有几个黑子", "补齐第五个黑子"),
            10, "group-beginner-1"
        ));
        challenges.put("ch-easy-3", new TrainingChallenge(
            "ch-easy-3", "斜向成五", "黑棋走一步即可连成五子，请找出获胜点",
            TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.Difficulty.EASY,
            setStones(emptyBoard(), new int[][]{{4,4,B},{5,5,B},{6,6,B},{7,7,B},{4,5,W},{5,6,W},{6,7,W}}),
            B, Arrays.asList(new int[]{3,3}, new int[]{8,8}),
            Arrays.asList("注意对角线方向", "斜线上有几个连续黑子？", "延长这条斜线"),
            10, "group-beginner-1"
        ));
        challenges.put("ch-easy-4", new TrainingChallenge(
            "ch-easy-4", "反向斜线", "黑棋走一步即可连成五子，请找出获胜点",
            TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.Difficulty.EASY,
            setStones(emptyBoard(), new int[][]{{4,10,B},{5,9,B},{6,8,B},{7,7,B},{4,9,W},{5,8,W},{6,7,W}}),
            B, Arrays.asList(new int[]{3,11}, new int[]{8,6}),
            Arrays.asList("观察另一条对角线", "注意斜线的方向", "找到延长线的端点"),
            10, "group-beginner-1"
        ));
        challenges.put("ch-easy-5", new TrainingChallenge(
            "ch-easy-5", "简单防守", "白棋即将连成五子，黑棋该如何防守？",
            TrainingChallenge.ChallengeType.DEFENSE, TrainingChallenge.Difficulty.EASY,
            setStones(emptyBoard(), new int[][]{{7,4,W},{7,5,W},{7,6,W},{7,7,W},{6,4,B},{6,5,B},{6,6,B}}),
            B, Arrays.asList(new int[]{7,3}, new int[]{7,8}),
            Arrays.asList("白棋有什么威胁？", "找到白棋即将成五的位置", "堵住那个缺口"),
            10, "group-beginner-1"
        ));
    }

    public List<TrainingChallenge> getAllChallenges() {
        return new ArrayList<>(challenges.values());
    }

    public TrainingChallenge getChallenge(String id) {
        return challenges.get(id);
    }

    public List<ChallengeGroup> getAllGroups() {
        return new ArrayList<>(groups.values());
    }

    public ChallengeGroup getGroup(String id) {
        return groups.get(id);
    }

    public List<TrainingChallenge> getChallengesByGroup(String groupId) {
        return challenges.values().stream()
            .filter(c -> groupId.equals(c.getGroupId()))
            .collect(Collectors.toList());
    }

    private void ensureUserInitialized(String userId) {
        userProgress.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userUnlockedGroups.computeIfAbsent(userId, k -> new ArrayList<>(Collections.singletonList("group-beginner-1")));
        userStats.computeIfAbsent(userId, k -> new PlayerStats());
        refreshDailyTasksIfNeeded(userId);
    }

    public PlayerStats getPlayerStats(String userId) {
        ensureUserInitialized(userId);
        return userStats.get(userId);
    }

    public ChallengeProgress getProgress(String userId, String challengeId) {
        ensureUserInitialized(userId);
        return userProgress.get(userId).get(challengeId);
    }

    public Map<String, ChallengeProgress> getAllProgress(String userId) {
        ensureUserInitialized(userId);
        return userProgress.get(userId);
    }

    public List<String> getUnlockedGroups(String userId) {
        ensureUserInitialized(userId);
        return userUnlockedGroups.get(userId);
    }

    private String todayStr() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    public List<DailyTask> getDailyTasks(String userId) {
        ensureUserInitialized(userId);
        return userDailyTasks.get(userId);
    }

    private void refreshDailyTasksIfNeeded(String userId) {
        String today = todayStr();
        String last = userLastRefresh.get(userId);
        if (!today.equals(last)) {
            List<DailyTask> tasks = generateDailyTasks(today, userStats.getOrDefault(userId, new PlayerStats()));
            userDailyTasks.put(userId, tasks);
            userLastRefresh.put(userId, today);
        } else if (userDailyTasks.get(userId) == null) {
            userDailyTasks.put(userId, generateDailyTasks(today, userStats.getOrDefault(userId, new PlayerStats())));
        }
    }

    private List<DailyTask> generateDailyTasks(String date, PlayerStats stats) {
        List<DailyTask> tasks = new ArrayList<>();
        List<TrainingChallenge.ChallengeType> weaknesses = stats.getWeaknesses() != null && !stats.getWeaknesses().isEmpty()
            ? stats.getWeaknesses()
            : Arrays.asList(TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.ChallengeType.DEFENSE, TrainingChallenge.ChallengeType.TACTICAL);

        tasks.add(new DailyTask(
            "daily-" + date + "-any", date, "每日练习", "完成任意 3 道训练题",
            3, 0, 30, false, null
        ));

        TrainingChallenge.ChallengeType focusType = weaknesses.get(0);
        tasks.add(new DailyTask(
            "daily-" + date + "-" + focusType, date,
            "专项突破：" + typeLabel(focusType),
            "完成 2 道" + typeLabel(focusType) + "类型的训练题",
            2, 0, 40, false, focusType
        ));

        TrainingChallenge.Difficulty diff = stats.getTotalXP() < 100 ? TrainingChallenge.Difficulty.EASY
            : stats.getTotalXP() < 400 ? TrainingChallenge.Difficulty.MEDIUM
            : TrainingChallenge.Difficulty.HARD;
        tasks.add(new DailyTask(
            "daily-" + date + "-" + diff, date,
            "难度挑战：" + diffLabel(diff),
            "完成 2 道" + diffLabel(diff) + "难度的训练题",
            2, 0, 50, false, null
        ));

        return tasks;
    }

    private String typeLabel(TrainingChallenge.ChallengeType t) {
        switch (t) {
            case CHECKMATE: return "杀棋";
            case DEFENSE: return "防守";
            case OPENING: return "布局";
            case TACTICAL: return "战术";
            default: return t.name();
        }
    }

    private String diffLabel(TrainingChallenge.Difficulty d) {
        switch (d) {
            case EASY: return "简单";
            case MEDIUM: return "中等";
            case HARD: return "困难";
            default: return d.name();
        }
    }

    public boolean submitAnswer(String userId, String challengeId, int row, int col) {
        ensureUserInitialized(userId);
        TrainingChallenge ch = challenges.get(challengeId);
        if (ch == null) return false;

        Map<String, ChallengeProgress> progress = userProgress.get(userId);
        ChallengeProgress p = progress.computeIfAbsent(challengeId,
            k -> new ChallengeProgress(challengeId, false, 0, null));
        p.setAttempts(p.getAttempts() + 1);

        boolean correct = ch.getCorrectMoves().stream()
            .anyMatch(m -> m[0] == row && m[1] == col);

        if (correct && !p.isCompleted()) {
            p.setCompleted(true);
            p.setCompletedAt(java.time.LocalDateTime.now().toString());

            PlayerStats stats = userStats.get(userId);
            stats.setTotalXP(stats.getTotalXP() + ch.getReward());
            stats.setTotalCompleted(stats.getTotalCompleted() + 1);

            updateDailyTaskProgress(userId, ch);
            analyzePerformance(userId);
            checkGroupUnlocks(userId);
        }

        return correct;
    }

    private void updateDailyTaskProgress(String userId, TrainingChallenge ch) {
        List<DailyTask> tasks = userDailyTasks.get(userId);
        if (tasks == null) return;
        PlayerStats stats = userStats.get(userId);

        for (DailyTask task : tasks) {
            if (task.isCompleted()) continue;
            if (task.getChallengeType() != null && task.getChallengeType() != ch.getType()) continue;
            if (task.getId().contains("EASY") && ch.getDifficulty() != TrainingChallenge.Difficulty.EASY) continue;
            if (task.getId().contains("MEDIUM") && ch.getDifficulty() != TrainingChallenge.Difficulty.MEDIUM) continue;
            if (task.getId().contains("HARD") && ch.getDifficulty() != TrainingChallenge.Difficulty.HARD) continue;

            if (task.getCurrentCount() < task.getTargetCount()) {
                task.setCurrentCount(task.getCurrentCount() + 1);
                if (task.getCurrentCount() >= task.getTargetCount()) {
                    task.setCompleted(true);
                    stats.setTotalXP(stats.getTotalXP() + task.getReward());
                }
            }
        }
    }

    private void analyzePerformance(String userId) {
        PlayerStats stats = userStats.get(userId);
        Map<String, ChallengeProgress> progress = userProgress.get(userId);

        Map<TrainingChallenge.ChallengeType, int[]> typeStats = new EnumMap<>(TrainingChallenge.ChallengeType.class);
        for (TrainingChallenge.ChallengeType t : TrainingChallenge.ChallengeType.values()) {
            typeStats.put(t, new int[]{0, 0});
        }

        for (Map.Entry<String, ChallengeProgress> e : progress.entrySet()) {
            TrainingChallenge ch = challenges.get(e.getKey());
            if (ch == null) continue;
            int[] s = typeStats.get(ch.getType());
            if (e.getValue().getAttempts() > 0) s[0] += e.getValue().getAttempts();
            if (e.getValue().isCompleted()) s[1]++;
        }

        List<TrainingChallenge.ChallengeType> weaknesses = new ArrayList<>();
        List<TrainingChallenge.ChallengeType> strengths = new ArrayList<>();

        for (Map.Entry<TrainingChallenge.ChallengeType, int[]> e : typeStats.entrySet()) {
            int attempted = e.getValue()[0];
            int completed = e.getValue()[1];
            if (attempted >= 3) {
                double rate = (double) completed / attempted;
                if (rate < 0.5) weaknesses.add(e.getKey());
                if (rate >= 0.8) strengths.add(e.getKey());
            }
        }

        stats.setWeaknesses(weaknesses);
        stats.setStrengths(strengths);
    }

    private void checkGroupUnlocks(String userId) {
        PlayerStats stats = userStats.get(userId);
        List<String> unlocked = userUnlockedGroups.get(userId);

        for (ChallengeGroup g : groups.values()) {
            if (!unlocked.contains(g.getId()) && stats.getTotalXP() >= g.getRequiredProgress()) {
                unlocked.add(g.getId());
            }
        }
    }

    public List<TrainingChallenge> getRecommended(String userId) {
        ensureUserInitialized(userId);
        PlayerStats stats = userStats.get(userId);
        List<String> unlocked = userUnlockedGroups.get(userId);
        Map<String, ChallengeProgress> progress = userProgress.get(userId);

        List<TrainingChallenge.ChallengeType> weaknesses = stats.getWeaknesses() != null && !stats.getWeaknesses().isEmpty()
            ? stats.getWeaknesses()
            : Arrays.asList(TrainingChallenge.ChallengeType.CHECKMATE, TrainingChallenge.ChallengeType.DEFENSE, TrainingChallenge.ChallengeType.TACTICAL);

        List<TrainingChallenge> candidates = new ArrayList<>();
        for (String gid : unlocked) {
            for (TrainingChallenge c : getChallengesByGroup(gid)) {
                ChallengeProgress p = progress.get(c.getId());
                if (p == null || !p.isCompleted()) {
                    candidates.add(c);
                }
            }
        }

        candidates.sort((a, b) -> {
            int sa = 0, sb = 0;
            if (weaknesses.contains(a.getType())) sa += 3;
            if (weaknesses.contains(b.getType())) sb += 3;
            if (a.getDifficulty() == TrainingChallenge.Difficulty.EASY) sa += 1;
            if (b.getDifficulty() == TrainingChallenge.Difficulty.EASY) sb += 1;
            if (stats.getTotalXP() < 100) {
                if (a.getDifficulty() == TrainingChallenge.Difficulty.EASY) sa += 2;
                if (b.getDifficulty() == TrainingChallenge.Difficulty.EASY) sb += 2;
            }
            ChallengeProgress pa = progress.get(a.getId());
            ChallengeProgress pb = progress.get(b.getId());
            if (pa != null && pa.getAttempts() > 0) sa -= 1;
            if (pb != null && pb.getAttempts() > 0) sb -= 1;
            return sb - sa;
        });

        return candidates.stream().limit(3).collect(Collectors.toList());
    }

    public void updateGameStats(String userId, int winner, int movesCount, int playerColor) {
        ensureUserInitialized(userId);
        PlayerStats stats = userStats.get(userId);
        stats.setRecentGames(stats.getRecentGames() + 1);
        int total = stats.getRecentGames();
        stats.setAvgMoves(Math.round(((float) stats.getAvgMoves() * (total - 1) + movesCount) / total));
        if (winner == playerColor) {
            stats.setRecentWins(stats.getRecentWins() + 1);
        }
        if (total > 0) {
            stats.setWinRate(Math.round(((float) stats.getRecentWins() / total) * 100));
        }
    }
}
