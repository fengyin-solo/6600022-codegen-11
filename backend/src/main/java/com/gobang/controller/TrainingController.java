package com.gobang.controller;

import com.gobang.model.*;
import com.gobang.service.TrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/training")
@CrossOrigin(origins = "*")
public class TrainingController {

    @Autowired
    private TrainingService trainingService;

    @GetMapping("/challenges")
    public ResponseEntity<List<TrainingChallenge>> getAllChallenges() {
        return ResponseEntity.ok(trainingService.getAllChallenges());
    }

    @GetMapping("/challenges/{id}")
    public ResponseEntity<TrainingChallenge> getChallenge(@PathVariable String id) {
        TrainingChallenge ch = trainingService.getChallenge(id);
        if (ch == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ch);
    }

    @GetMapping("/groups")
    public ResponseEntity<List<ChallengeGroup>> getAllGroups() {
        return ResponseEntity.ok(trainingService.getAllGroups());
    }

    @GetMapping("/groups/{id}")
    public ResponseEntity<ChallengeGroup> getGroup(@PathVariable String id) {
        ChallengeGroup g = trainingService.getGroup(id);
        if (g == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(g);
    }

    @GetMapping("/groups/{id}/challenges")
    public ResponseEntity<List<TrainingChallenge>> getGroupChallenges(@PathVariable String id) {
        return ResponseEntity.ok(trainingService.getChallengesByGroup(id));
    }

    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<PlayerStats> getPlayerStats(@PathVariable String userId) {
        return ResponseEntity.ok(trainingService.getPlayerStats(userId));
    }

    @GetMapping("/users/{userId}/progress")
    public ResponseEntity<Map<String, ChallengeProgress>> getAllProgress(@PathVariable String userId) {
        return ResponseEntity.ok(trainingService.getAllProgress(userId));
    }

    @GetMapping("/users/{userId}/progress/{challengeId}")
    public ResponseEntity<ChallengeProgress> getProgress(
            @PathVariable String userId,
            @PathVariable String challengeId) {
        ChallengeProgress p = trainingService.getProgress(userId, challengeId);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

    @GetMapping("/users/{userId}/groups")
    public ResponseEntity<List<String>> getUnlockedGroups(@PathVariable String userId) {
        return ResponseEntity.ok(trainingService.getUnlockedGroups(userId));
    }

    @GetMapping("/users/{userId}/daily-tasks")
    public ResponseEntity<List<DailyTask>> getDailyTasks(@PathVariable String userId) {
        return ResponseEntity.ok(trainingService.getDailyTasks(userId));
    }

    @GetMapping("/users/{userId}/recommended")
    public ResponseEntity<List<TrainingChallenge>> getRecommended(@PathVariable String userId) {
        return ResponseEntity.ok(trainingService.getRecommended(userId));
    }

    @PostMapping("/users/{userId}/submit/{challengeId}")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable String userId,
            @PathVariable String challengeId,
            @RequestBody Map<String, Integer> body) {
        int row = body.getOrDefault("row", -1);
        int col = body.getOrDefault("col", -1);
        boolean correct = trainingService.submitAnswer(userId, challengeId, row, col);

        Map<String, Object> result = new HashMap<>();
        result.put("correct", correct);
        result.put("challengeId", challengeId);
        result.put("progress", trainingService.getProgress(userId, challengeId));
        result.put("stats", trainingService.getPlayerStats(userId));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/users/{userId}/game-stats")
    public ResponseEntity<PlayerStats> updateGameStats(
            @PathVariable String userId,
            @RequestBody Map<String, Integer> body) {
        int winner = body.getOrDefault("winner", 0);
        int moves = body.getOrDefault("moves", 0);
        int playerColor = body.getOrDefault("playerColor", 1);
        trainingService.updateGameStats(userId, winner, moves, playerColor);
        return ResponseEntity.ok(trainingService.getPlayerStats(userId));
    }
}
