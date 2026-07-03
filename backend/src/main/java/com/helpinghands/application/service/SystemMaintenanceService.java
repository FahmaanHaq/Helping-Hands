package com.helpinghands.application.service;

import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(SystemMaintenanceService.class);

    /** How long without a login before an account is considered inactive. */
    private static final int INACTIVITY_THRESHOLD_DAYS = 365;

    /** How long an unpledged request sits before the Home gets a nudge. */
    private static final int STALE_REQUEST_REMINDER_DAYS = 7;

    /** How long a pledged-but-unfinished request sits before the fulfiller gets a nudge. */
    private static final int STALLED_PROGRESS_REMINDER_DAYS = 14;

    /**
     * The specific "volunteer said they'd pick it up but nothing's happened"
     * window — shorter than the general stalled-progress reminder, because a
     * Home needs enough runway left to actually arrange a paid courier
     * alternative before the situation gets urgent.
     */
    private static final int STALLED_VOLUNTEER_PICKUP_REMINDER_DAYS = 7;

    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    /**
     * Runs daily. Soft-deactivates (is_active = false — never a hard delete,
     * consistent with the platform-wide rule) accounts that haven't logged
     * in for over a year. Administrators are exempt — an inactive admin
     * account is an operational concern, not a cleanup target, and
     * deactivating the only admin would be a genuinely bad outcome for a
     * fully automated job to cause.
     */
    @Scheduled(cron = "0 0 3 * * *") // 03:00 daily — low-traffic hour
    @Transactional
    public void deactivateInactiveUsers() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(INACTIVITY_THRESHOLD_DAYS);
        List<User> candidates = userRepository.findInactiveSince(cutoff);

        int deactivated = 0;
        for (User user : candidates) {
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(r -> r.getName() == com.helpinghands.domain.entity.RoleName.ADMINISTRATOR);
            if (isAdmin || !user.getIsActive()) continue;

            user.setIsActive(false);
            user.setModifiedBy("system-inactivity-sweep");
            user.setModifiedDate(LocalDateTime.now());
            userRepository.save(user);
            auditLogService.record("USER_DEACTIVATED_INACTIVITY", "USER", user.getId(),
                    "No login since before " + cutoff.toLocalDate());
            deactivated++;
        }

        if (deactivated > 0) {
            log.info("Inactivity sweep deactivated {} account(s) with no login since {}", deactivated, cutoff.toLocalDate());
        }
    }

    /**
     * Runs daily. Two reminder types, both answering "Send alerts and
     * reminders": a stale unpledged request nudges the Home, a stalled
     * in-progress request nudges whoever pledged to it.
     */
    @Scheduled(cron = "0 0 9 * * *") // 09:00 daily
    @Transactional
    public void sendReminders() {
        LocalDateTime staleCutoff = LocalDateTime.now().minusDays(STALE_REQUEST_REMINDER_DAYS);
        for (Request request : requestRepository.findStaleUnpledged(staleCutoff)) {
            notificationService.notify(request.getChildrensHome().getUser(), NotificationType.REQUEST_REMINDER,
                    "Request Still Open", "\"" + request.getTitle() + "\" has had no pledges for over "
                            + STALE_REQUEST_REMINDER_DAYS + " days. Consider reviewing its details or urgency.",
                    "/requests/" + request.getId());
        }

        LocalDateTime stalledCutoff = LocalDateTime.now().minusDays(STALLED_PROGRESS_REMINDER_DAYS);
        for (Request request : requestRepository.findStalledInProgress(stalledCutoff)) {
            if (request.getPledgedBy() == null) continue;
            notificationService.notify(request.getPledgedBy(), NotificationType.REQUEST_REMINDER,
                    "Pledge Awaiting Progress", "\"" + request.getTitle() + "\" hasn't been updated in over "
                            + STALLED_PROGRESS_REMINDER_DAYS + " days. Please update its status when you can.",
                    "/requests/" + request.getId());
        }

        LocalDateTime volunteerCutoff = LocalDateTime.now().minusDays(STALLED_VOLUNTEER_PICKUP_REMINDER_DAYS);
        for (Request request : requestRepository.findStalledVolunteerPickup(volunteerCutoff)) {
            notificationService.notify(request.getChildrensHome().getUser(), NotificationType.REQUEST_REMINDER,
                    "Volunteer Pickup Hasn't Progressed",
                    "\"" + request.getTitle() + "\" was pledged with a delivery volunteer requested, but there's been no "
                            + "progress in over " + STALLED_VOLUNTEER_PICKUP_REMINDER_DAYS + " days. You can arrange an "
                            + "alternative (e.g. a courier) from the request page if needed.",
                    "/requests/" + request.getId());
        }
    }
}
