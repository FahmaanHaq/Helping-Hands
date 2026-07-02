package com.helpinghands.application.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory cooldown tracker, keyed by an arbitrary string (email, user id,
 * etc.). Deliberately not backed by a database table — this is
 * throwaway/transient state, not something that needs to survive a restart
 * or be queried later. If this app ever runs as more than one instance,
 * this needs to move to a shared store (Redis) since each instance would
 * otherwise track its own independent cooldowns.
 */
@Service
public class RateLimiterService {

    private final Map<String, Instant> lastRequestByKey = new ConcurrentHashMap<>();

    /**
     * Returns true and records the attempt if the key is outside its cooldown
     * window; returns false (and does NOT reset the timer) if still cooling down.
     */
    public boolean tryAcquire(String key, Duration cooldown) {
        Instant now = Instant.now();
        Instant last = lastRequestByKey.get(key);

        if (last != null && now.isBefore(last.plus(cooldown))) {
            return false;
        }

        lastRequestByKey.put(key, now);
        return true;
    }

    /**
     * Housekeeping so this map doesn't grow unbounded over the app's lifetime —
     * entries older than an hour are almost certainly no longer relevant to any
     * cooldown check (the longest cooldown in use today is a few minutes).
     */
    @Scheduled(fixedRate = 3_600_000) // hourly
    public void evictStaleEntries() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        lastRequestByKey.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
    }
}
