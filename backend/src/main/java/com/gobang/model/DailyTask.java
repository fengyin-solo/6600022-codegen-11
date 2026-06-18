package com.gobang.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DailyTask {
    private String id;
    private String date;
    private String title;
    private String description;
    private int targetCount;
    private int currentCount;
    private int reward;
    private boolean completed;
    private TrainingChallenge.ChallengeType challengeType;
}
