package com.gobang.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeGroup {
    private String id;
    private String name;
    private String description;
    private TrainingChallenge.Difficulty difficulty;
    private int requiredProgress;
    private List<String> challengeIds;
}
