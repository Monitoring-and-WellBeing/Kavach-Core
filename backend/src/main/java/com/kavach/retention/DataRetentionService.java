package com.kavach.retention;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataRetentionService {

    private final EntityManager em;

    @Scheduled(cron = "0 0 2 * * SUN")
    @SchedulerLock(name = "archiveOldActivityLogs", lockAtLeastFor = "PT30M", lockAtMostFor = "PT2H")
    @Transactional
    public void archiveOldActivityLogs() {
        try {
            int count = (int) em.createNativeQuery(
                "SELECT archive_old_activity_logs()"
            ).getSingleResult();
            log.info("[retention] Archived {} activity log entries older than 90 days", count);
        } catch (Exception e) {
            log.error("[retention] Failed to archive old activity logs", e);
        }
    }
}
