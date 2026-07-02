package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.domain.entity.FailedLoginAttempt;
import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.FailedLoginAttemptRepository;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Closes two gaps at once: brute-force protection on login (nothing
 * previously rate-limited login attempts specifically — only password-reset
 * and resend-verification were) and the SRS's explicit requirement to "log
 * all failed login attempts and flag repeated suspicious activities to
 * administrators."
 */
@Service
@RequiredArgsConstructor
public class LoginSecurityService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MINUTES = 15;

    private final FailedLoginAttemptRepository failedLoginAttemptRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Call before attempting authentication. Throws if this identifier has
     * already hit the failure threshold within the window — the account
     * itself isn't locked (that's a separate, admin-driven action), this is
     * purely a temporary brute-force cooldown tied to the identifier string.
     */
    @Transactional(readOnly = true)
    public void assertNotRateLimited(String identifier) {
        long recentFailures = failedLoginAttemptRepository.countRecentByIdentifier(
                identifier.toLowerCase(), LocalDateTime.now().minusMinutes(WINDOW_MINUTES));

        if (recentFailures >= MAX_ATTEMPTS) {
            throw new ApiException(
                    "Too many failed login attempts. Please try again in a few minutes.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    /**
     * Call on every failed authentication. Logs the attempt and, once the
     * threshold is crossed, notifies every Administrator — this is the
     * "flag repeated suspicious activities to administrators" requirement.
     */
    @Transactional
    public void recordFailure(String identifier) {
        FailedLoginAttempt attempt = new FailedLoginAttempt();
        attempt.setIdentifier(identifier.toLowerCase());
        failedLoginAttemptRepository.save(attempt);

        long recentFailures = failedLoginAttemptRepository.countRecentByIdentifier(
                identifier.toLowerCase(), LocalDateTime.now().minusMinutes(WINDOW_MINUTES));

        if (recentFailures == MAX_ATTEMPTS) {
            // Notify exactly once per lockout window (== rather than >=) so
            // admins get one alert per incident, not one per attempt after
            // the threshold is already crossed.
            alertAdmins(identifier, recentFailures);
        }
    }

    private void alertAdmins(String identifier, long attemptCount) {
        String message = "Repeated failed login attempts (" + attemptCount + ") detected for account \""
                + identifier + "\" within the last " + WINDOW_MINUTES + " minutes.";

        for (User admin : userRepository.findAllActiveByRoleName(RoleName.ADMINISTRATOR)) {
            notificationService.notify(admin, NotificationType.SUSPICIOUS_LOGIN_ACTIVITY,
                    "Suspicious Login Activity", message, "/admin/users");
        }
    }
}
