package com.kavach.ai.repository;

import com.kavach.ai.entity.MoodCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for the legacy AI-module mood check-ins (student-id schema).
 * Renamed from MoodCheckinRepository to avoid conflict with com.kavach.mood.repository.MoodCheckinRepository.
 */
public interface AiMoodCheckinRepository extends JpaRepository<MoodCheckin, UUID> {

    /** Latest check-in for a student — for daily "already checked-in" guard. */
    Optional<MoodCheckin> findTopByStudentIdOrderByCheckedInAtDesc(UUID studentId);

    /** 7-day check-ins for a device — used in parent mood trend chart. */
    List<MoodCheckin> findByDeviceIdAndCheckedInAtAfterOrderByCheckedInAtAsc(
            UUID deviceId, Instant since);

    /** Weekly mood check-ins for a student — used in weekly digest. */
    @Query("SELECT m FROM AiMoodCheckin m " +
           "WHERE m.studentId = :studentId AND m.checkedInAt >= :since " +
           "ORDER BY m.checkedInAt ASC")
    List<MoodCheckin> findWeeklyByStudent(@Param("studentId") UUID studentId,
                                          @Param("since") Instant since);

    /** Count today's check-ins (guard against double submission). */
    @Query("SELECT COUNT(m) FROM AiMoodCheckin m " +
           "WHERE m.studentId = :studentId AND m.checkedInAt >= :since")
    int countTodayByStudent(@Param("studentId") UUID studentId,
                             @Param("since") Instant since);

    /** Weekly mood for a device — used in InsightService digest. */
    @Query("SELECT m FROM AiMoodCheckin m " +
           "WHERE m.deviceId = :deviceId AND m.checkedInAt >= :since " +
           "ORDER BY m.checkedInAt ASC")
    List<MoodCheckin> findWeeklyByDevice(@Param("deviceId") UUID deviceId,
                                          @Param("since") Instant since);
}
