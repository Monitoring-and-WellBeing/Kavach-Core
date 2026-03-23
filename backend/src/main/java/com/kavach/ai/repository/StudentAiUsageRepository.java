package com.kavach.ai.repository;

import com.kavach.ai.entity.StudentAiUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface StudentAiUsageRepository extends JpaRepository<StudentAiUsage, UUID> {

    /** Count how many questions a student has asked today (UTC day boundary). */
    @Query("SELECT COUNT(u) FROM StudentAiUsage u " +
           "WHERE u.studentId = :studentId AND u.usedAt >= :since")
    int countTodayByStudent(@Param("studentId") UUID studentId,
                             @Param("since") Instant since);

    /** Recent topic usage for a student — used for parent topic summary. */
    List<StudentAiUsage> findByStudentIdOrderByUsedAtDesc(UUID studentId);

    /** Topic usage for a student since a given time — for weekly digest. */
    @Query("SELECT u FROM StudentAiUsage u " +
           "WHERE u.studentId = :studentId AND u.usedAt >= :since " +
           "ORDER BY u.usedAt DESC")
    List<StudentAiUsage> findByStudentIdSince(@Param("studentId") UUID studentId,
                                               @Param("since") Instant since);
}
