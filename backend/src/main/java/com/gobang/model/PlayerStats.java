package com.gobang.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerStats {
    private int totalXP;
    private int totalCompleted;
    private int winRate;
    private int recentGames;
    private int recentWins;
    private int avgMoves;
    private List<TrainingChallenge.ChallengeType> weaknesses = new ArrayList<>();
    private List<TrainingChallenge.ChallengeType> strengths = new ArrayList<>();
}
