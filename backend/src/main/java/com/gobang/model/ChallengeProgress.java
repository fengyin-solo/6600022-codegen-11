package com.gobang.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeProgress {
    private String challengeId;
    private boolean completed;
    private int attempts;
    private String completedAt;
}
