package com.noithat.qlnt.backend.service.chat;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very simple in-memory rate limiter for guest chat session creation.
 * Not suitable for multi-instance deployment; for production use Redis/Bucket4j.
 */
@Component
public class GuestChatRateLimiter {
    private static class WindowRule {
        final Duration window;
        final int max;
        WindowRule(Duration window, int max) { this.window = window; this.max = max; }
    }

    private final Map<String, Deque<Instant>> events = new ConcurrentHashMap<>();
    private final WindowRule[] rules = new WindowRule[] {
            new WindowRule(Duration.ofMinutes(1), 3),   // max 3 per minute
            new WindowRule(Duration.ofMinutes(5), 6),   // max 6 per 5 minutes
            new WindowRule(Duration.ofHours(1), 20)     // max 20 per hour
    };

    public boolean checkAndRecord(String key) {
        Instant now = Instant.now();
        Deque<Instant> deque = events.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            // purge old
            for (WindowRule rule : rules) {
                purgeOlderThan(deque, now.minus(rule.window));
                // Count within rule window
                int count = countSince(deque, now.minus(rule.window));
                if (count >= rule.max) {
                    return false;
                }
            }
            deque.addLast(now);
            // keep reasonable size
            while (deque.size() > 100) deque.removeFirst();
        }
        return true;
    }

    private void purgeOlderThan(Deque<Instant> deque, Instant threshold) {
        while (!deque.isEmpty() && deque.peekFirst().isBefore(threshold)) {
            deque.removeFirst();
        }
    }

    private int countSince(Deque<Instant> deque, Instant threshold) {
        int c = 0;
        for (Instant i : deque) if (!i.isBefore(threshold)) c++;
        return c;
    }
}
