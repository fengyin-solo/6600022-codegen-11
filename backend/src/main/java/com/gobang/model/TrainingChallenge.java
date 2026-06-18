package com.gobang.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrainingChallenge {
    public enum ChallengeType {
        CHECKMATE, DEFENSE, OPENING, TACTICAL
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    private String id;
    private String title;
    private String description;
    private ChallengeType type;
    private Difficulty difficulty;
    private int[][] initialBoard;
    private int playerToMove;
    private List<int[]> correctMoves;
    private List<String> hints;
    private int reward;
    private String groupId;
}
